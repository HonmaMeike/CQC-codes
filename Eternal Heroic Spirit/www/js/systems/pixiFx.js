// ========== PixiJS 特效层 ==========
// Hybrid 方案：
//   - 战斗单位、HP 条、名字等继续用 Canvas2D 渲染（5000 行 sprites.js 不动）
//   - 所有 addParticles / addEffect 走 WebGL 层，性能 10× 提升 + 真粒子 + bloom/glow
//
// 设计原则：
//   - PIXI.Application 在 battle init 时懒初始化
//   - 用 ParticleContainer 装上千个粒子（性能远超 Canvas 散点）
//   - 用 Graphics 画圆形/星形粒子（GPU 加速）
//   - 用 BlurFilter 给特定效果叠加 glow（发光感）
//   - 完全向下兼容现有 addParticles/addEffect API

var PixiFx = {
    app: null,
    initialized: false,
    container: null,         // 粒子总容器
    effectsLayer: null,      // 特效层（吃 BlurFilter）
    glowLayer: null,         // 高亮特效层（吃 BlurFilter + 高 alpha）
    projectileLayer: null,   // 弹道层（v2.6.1：弹道也走 PixiJS，GPU 加 glow）
    particles: [],           // 粒子引用（用于 ticker 更新）
    effects: [],             // 特效引用（用于 ticker 更新）
    projectiles: [],         // 弹道引用（用于 ticker 更新）
    onProjectileArrive: null,// v2.6.1: 弹道到达回调（battle.js 注册，应用伤害/状态）
    // v2.6.1: 单位 sprite 缓存（按 unitId 索引）
    unitSprites: {},         // unitId → {sprite, unit, color, isAlly, texture, needsRefresh}
    unitLayer: null,         // 单位 sprite 容器（z 介于 enemies 与 allies 之间）
    drawUnitCallback: null,  // battle.js 注册的 Canvas2D 绘制回调（生成 sprite texture）
    lastDrawUnitTime: 0,
    config: {
        bgAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: null        // 由 caller 设置
    },

    /**
     * 初始化 PIXI.Application（懒调用）
     *   canvas: 已有的 <canvas id="pixi-overlay-canvas">
     *   width/height: 战斗画布尺寸
     */
    init: function(canvas, width, height) {
        if (this.initialized) return;
        if (typeof PIXI === 'undefined') {
            console.warn('[PixiFx] PIXI 未加载，跳过初始化');
            return;
        }
        try {
            this.app = new PIXI.Application({
                view: canvas,
                width: width,
                height: height,
                backgroundAlpha: this.config.bgAlpha,
                antialias: this.config.antialias,
                resolution: this.config.resolution,
                autoDensity: this.config.autoDensity
            });
        } catch (e) {
            console.error('[PixiFx] 初始化失败:', e);
            return;
        }
        // 主容器
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        // 分层：粒子层 + 普通特效层 + glow 层（可叠加 BlurFilter）
        this.particles = [];
        this.effects = [];
        // ★ v2.6.2: 用普通 Container 替换 ParticleContainer
        //   ParticleContainer 不支持 Graphics 对象,会导致 baseTexture undefined 错误
        //   性能上比 ParticleContainer 慢一些,但 PixiFx 是混合方案,够用
        var pc = new PIXI.Container();
        this.container.addChild(pc);
        this._particleContainer = pc;
        // 特效层：可挂 BlurFilter
        this.effectsLayer = new PIXI.Container();
        this.container.addChild(this.effectsLayer);
        // glow 层（用于发光特效，如网友怪出场、buff光环）
        this.glowLayer = new PIXI.Container();
        this.container.addChild(this.glowLayer);
        var blurFilter = new PIXI.BlurFilter();
        blurFilter.blur = 8;
        blurFilter.quality = 4;
        this.glowLayer.filters = [blurFilter];
        // v2.6.1: 弹道层（独立 layer，方便单独加 blur 处理发光弹道）
        this.projectileLayer = new PIXI.Container();
        this.container.addChild(this.projectileLayer);
        this.projectiles = [];
        // v2.6.1: 单位 sprite 层（承载 ally/enemy/summon 的 PixiJS 渲染副本，支持程序化动画）
        this.unitLayer = new PIXI.Container();
        this.container.addChild(this.unitLayer);
        this.unitSprites = {};
        // Ticker 帧驱动（每帧调 _tick）
        this.app.ticker.add(this._tick.bind(this));
        this.initialized = true;
        console.log('[PixiFx] PixiJS v' + PIXI.VERSION + ' 初始化完成 ' + width + 'x' + height);
    },

    /** 销毁（切场景时调用） */
    destroy: function() {
        if (!this.initialized || !this.app) return;
        try {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
        } catch (e) {}
        this.app = null;
        this.initialized = false;
        this.container = null;
        this.particles = [];
        this.effects = [];
    },

    /** 调整尺寸 */
    resize: function(width, height) {
        if (!this.app) return;
        this.app.renderer.resize(width, height);
    },

    /**
     * 添加粒子爆炸（替代 addParticles(x, y, color, count)）
     *   - count 个圆形粒子向四周飞散
     *   - 800-1100ms 寿命，alpha + scale 同步衰减
     *   - GPU 加速（ParticleContainer 批渲染）
     */
    addParticles: function(x, y, color, count, opts) {
        if (!this.initialized) return;
        count = count || 8;
        opts = opts || {};
        // ★ v2.6.3 性能优化：限制同屏粒子数量，防止 GC 压力和渲染过载
        //   PixiFx.particles 数组超过 200 时，丢弃本次调用中最老的粒子（后进先出）
        var maxParticles = 200;
        if (this.particles.length >= maxParticles) {
            // 一次性清理掉最老的 20 个（释放 PIXI.Graphics 对象）
            for (var _pc = 0; _pc < 20; _pc++) {
                var oldP = this.particles.shift();
                if (oldP && oldP.sprite && oldP.sprite.parent) {
                    oldP.sprite.parent.removeChild(oldP.sprite);
                    oldP.sprite.destroy({ children: true });
                }
            }
        }
        var speed = opts.speed || 3;
        var lifeMin = opts.lifeMin || 400;
        var lifeMax = opts.lifeMax || 700;
        var sizeMin = opts.sizeMin || 2;
        var sizeMax = opts.sizeMax || 5;
        var gravity = opts.gravity != null ? opts.gravity : 0.05;
        var hexColor = this._hexToInt(color);
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var spd = speed * (0.5 + Math.random() * 0.8);
            var life = lifeMin + Math.random() * (lifeMax - lifeMin);
            var size = sizeMin + Math.random() * (sizeMax - sizeMin);
            var g = new PIXI.Graphics();
            g.beginFill(hexColor);
            g.drawCircle(0, 0, size);
            g.endFill();
            g.x = x;
            g.y = y;
            g.alpha = 1;
            g.tint = hexColor;
            this._particleContainer.addChild(g);
            this.particles.push({
                sprite: g,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - (opts.upBias || 1.2),
                gravity: gravity,
                life: life,
                maxLife: life,
                sizeStart: size
            });
        }
    },

    /**
     * 添加特效（替代 addEffect(x, y, type, color, size)）
     *   type: 'hit' / 'explosion' / 'nova' / 'slash' / 'heal' / 'shield' / 'buff' / 'dark' / 'shield_break'
     *   size: 缩放倍率
     *   glow: true = 进 glow 层（自动 blur）
     */
    addEffect: function(x, y, type, color, size, glow) {
        if (!this.initialized) return;
        // ★ v2.6.3 性能优化：限制同屏特效数量，防止 PIXI.Graphics 对象泄漏
        var maxEffects = 100;
        if (this.effects.length >= maxEffects) {
            var oldE = this.effects.shift();
            if (oldE && oldE.sprite && oldE.sprite.parent) {
                oldE.sprite.parent.removeChild(oldE.sprite);
                oldE.sprite.destroy({ children: true });
            }
        }
        size = size || 1;
        var hexColor = this._hexToInt(color);
        var g = new PIXI.Graphics();
        var radius = 16 * size;
        var layer = glow ? this.glowLayer : this.effectsLayer;
        // 不同类型画不同形状
        switch (type) {
            case 'explosion':
                // 火焰爆裂：圆 + 锯齿外圈
                g.beginFill(hexColor, 0.8);
                g.drawCircle(0, 0, radius);
                g.endFill();
                g.beginFill(0xffffff, 0.5);
                g.drawCircle(0, 0, radius * 0.5);
                g.endFill();
                break;
            case 'nova':
                // 新星：六角放射
                this._drawStar(g, 0, 0, radius, 6, hexColor);
                break;
            case 'slash':
                // 斩击：弧线
                g.lineStyle(3 * size, hexColor, 1);
                g.arc(0, 0, radius * 0.9, -Math.PI / 3, Math.PI / 3);
                break;
            case 'shield':
                // 护盾：六边形
                this._drawPolygon(g, 0, 0, radius, 6, hexColor, 0.5);
                break;
            case 'shield_break':
                // 护盾破碎：碎片散开（5 个小三角）
                for (var i = 0; i < 5; i++) {
                    var a = (i / 5) * Math.PI * 2;
                    g.beginFill(hexColor, 0.8);
                    g.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
                    g.lineTo(Math.cos(a + 0.4) * radius * 1.5, Math.sin(a + 0.4) * radius * 1.5);
                    g.lineTo(Math.cos(a + 0.2) * radius * 0.5, Math.sin(a + 0.2) * radius * 0.5);
                    g.closePath();
                    g.endFill();
                }
                break;
            case 'heal':
                // 治疗：爱心或圆 + 光柱
                g.beginFill(hexColor, 0.7);
                g.drawCircle(0, 0, radius);
                g.endFill();
                g.beginFill(0xffffff, 0.9);
                g.drawCircle(0, 0, radius * 0.4);
                g.endFill();
                break;
            case 'buff':
                // Buff：旋转光环（外环 + 内圆）
                g.lineStyle(2 * size, hexColor, 1);
                g.drawCircle(0, 0, radius);
                g.beginFill(hexColor, 0.3);
                g.drawCircle(0, 0, radius * 0.7);
                g.endFill();
                break;
            case 'dark':
                // 暗影：黑紫圆 + 锯齿
                g.beginFill(hexColor, 0.85);
                g.drawCircle(0, 0, radius);
                g.endFill();
                g.beginFill(0x000000, 0.4);
                g.drawCircle(0, 0, radius * 0.6);
                g.endFill();
                break;
            case 'hit':
            default:
                // 普通命中：白圆 + 闪线
                g.beginFill(hexColor, 0.9);
                g.drawCircle(0, 0, radius);
                g.endFill();
                g.beginFill(0xffffff, 0.7);
                g.drawCircle(0, 0, radius * 0.4);
                g.endFill();
                break;
        }
        g.x = x;
        g.y = y;
        g.alpha = 1;
        g.scale.set(0.3);  // 从 0.3 弹到 1.0
        layer.addChild(g);
        this.effects.push({
            sprite: g,
            type: type,
            life: 350,
            maxLife: 350,
            scaleStart: 0.3,
            scaleEnd: 1.0,
            hasRotated: false,
            rotationSpeed: (Math.random() - 0.5) * 6
        });
    },

    /** 帧更新（自动 ticker 调用） */
    _tick: function(delta) {
        if (!this.initialized) return;
        try {
            this._tickImpl(delta);
        } catch (e) {
            // 静默吞错(不能让异常杀掉 ticker,导致整个特效层再也不渲染)
        }
    },
    _tickImpl: function(delta) {
        var dt = delta / 60 * 1000;  // PIXI delta 是帧单位，转换为 ms
        // 粒子更新
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this._particleContainer.removeChild(p.sprite);
                p.sprite.destroy();
                this.particles.splice(i, 1);
                continue;
            }
            // 物理：重力 + 速度衰减
            p.vy += p.gravity;
            p.vx *= 0.96;
            p.sprite.x += p.vx;
            p.sprite.y += p.vy;
            // alpha + scale 同步衰减
            var lifeRatio = p.life / p.maxLife;
            p.sprite.alpha = lifeRatio;
            p.sprite.scale.set(0.4 + lifeRatio * 0.6);
        }
        // v2.6.1: 弹道更新（GPU 渲染 + 拖尾粒子）
        this._tickProjectiles(dt);
        // 特效更新（弹出 + 旋转 + 淡出）
        for (var j = this.effects.length - 1; j >= 0; j--) {
            var e = this.effects[j];
            e.life -= dt;
            if (e.life <= 0) {
                if (e.sprite.parent) e.sprite.parent.removeChild(e.sprite);
                e.sprite.destroy();
                this.effects.splice(j, 1);
                continue;
            }
            var lr = e.life / e.maxLife;  // 1 → 0
            // scale: 0.3 → 1.0 in first 30%, stay 1.0 for 30%, fade out last 40%
            var s;
            if (lr > 0.7) {
                s = e.scaleStart + (e.scaleEnd - e.scaleStart) * ((1 - lr) / 0.3);
            } else if (lr > 0.3) {
                s = e.scaleEnd;
            } else {
                s = e.scaleEnd * (lr / 0.3);
            }
            e.sprite.scale.set(s);
            // alpha: full → fade in last 40%
            e.sprite.alpha = lr > 0.4 ? 1 : (lr / 0.4);
            // 旋转（buff 类持续转）
            if (e.type === 'buff' || e.type === 'shield') {
                e.sprite.rotation += e.rotationSpeed * dt / 1000;
            }
        }
    },

    /** 清空所有粒子/特效（切场景时调用） */
    clearAll: function() {
        if (!this.initialized) return;
        for (var i = 0; i < this.particles.length; i++) {
            if (this.particles[i].sprite.parent) {
                this.particles[i].sprite.parent.removeChild(this.particles[i].sprite);
            }
            this.particles[i].sprite.destroy();
        }
        this.particles = [];
        for (var j = 0; j < this.effects.length; j++) {
            if (this.effects[j].sprite.parent) {
                this.effects[j].sprite.parent.removeChild(this.effects[j].sprite);
            }
            this.effects[j].sprite.destroy();
        }
        this.effects = [];
    },

    // ====== 工具函数 ======
    _hexToInt: function(hex) {
        if (typeof hex !== 'string') return 0xffffff;
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return parseInt(hex, 16);
    },

    /**
     * v2.6.1: 单位攻击动画光环（替代纯 Canvas2D 的 lunge 偏移，给单位加程序化动画光环）
     *   unitId: 唯一 id（用于追踪 & 防止重复添加）
     *   x, y: 单位位置
     *   color: 光环颜色
     *   isAlly: true 友方（光环向左前方扩张），false 敌方（向右前方）
     *   duration: 动画时长（默认 200ms）
     */
    addUnitAttackAnim: function(unitId, x, y, color, isAlly, duration) {
        if (!this.initialized) return;
        duration = duration || 200;
        var hexColor = this._hexToInt(color);
        var g = new PIXI.Graphics();
        g.lineStyle(3, hexColor, 1);
        g.drawCircle(0, 0, 18);
        // 内部填充（半透明白）
        g.beginFill(0xffffff, 0.25);
        g.drawCircle(0, 0, 14);
        g.endFill();
        g.x = x;
        g.y = y;
        g.alpha = 0.9;
        g.scale.set(0.5);
        this.glowLayer.addChild(g);
        if (this.effects.length >= 100) {
            var old = this.effects.shift();
            if (old && old.sprite) old.sprite.destroy();
        }
        this.effects.push({
            sprite: g,
            type: 'attack_anim',
            life: duration,
            maxLife: duration,
            scaleStart: 0.5,
            scaleEnd: 2.2,
            isAttack: true,
            attackDir: isAlly ? 1 : -1
        });
    },

    /**
     * v2.6.1: 单位受击闪光（Canvas2D drawUnit 的 hitFlash 是 fillRect 整块闪，PixiJS 更精细）
     *   在单位位置叠一个快速白闪环 + 红色冲击波
     */
    addUnitHurtAnim: function(unitId, x, y, color) {
        if (!this.initialized) return;
        var c1 = this._hexToInt('#ffffff');
        var c2 = this._hexToInt(color || '#ff6666');
        // 红色冲击波
        var wave = new PIXI.Graphics();
        wave.lineStyle(2, c2, 1);
        wave.drawCircle(0, 0, 16);
        wave.x = x;
        wave.y = y;
        wave.alpha = 1;
        wave.scale.set(0.6);
        this.glowLayer.addChild(wave);
        this.effects.push({
            sprite: wave,
            type: 'hurt_wave',
            life: 280,
            maxLife: 280,
            scaleStart: 0.6,
            scaleEnd: 1.8
        });
        // 白色闪点
        var flash = new PIXI.Graphics();
        flash.beginFill(c1, 0.9);
        flash.drawCircle(0, 0, 14);
        flash.endFill();
        flash.x = x;
        flash.y = y;
        flash.alpha = 1;
        this.effectsLayer.addChild(flash);
        this.effects.push({
            sprite: flash,
            type: 'hurt_flash',
            life: 120,
            maxLife: 120,
            scaleStart: 1.5,
            scaleEnd: 0.8
        });
    },

    /**
     * v2.6.1: 召唤师/网友怪出场光环（持续 1 秒的彩色光环 + 粒子爆发感）
     */
    addSpawnAura: function(x, y, color) {
        if (!this.initialized) return;
        var hexColor = this._hexToInt(color);
        // 大光环
        var ring = new PIXI.Graphics();
        ring.lineStyle(4, hexColor, 1);
        ring.drawCircle(0, 0, 30);
        ring.x = x;
        ring.y = y;
        ring.alpha = 0.9;
        ring.scale.set(0.3);
        this.glowLayer.addChild(ring);
        this.effects.push({
            sprite: ring,
            type: 'spawn_ring',
            life: 600,
            maxLife: 600,
            scaleStart: 0.3,
            scaleEnd: 2.0
        });
        // 爆发粒子
        this.addParticles(x, y, color, 18, { speed: 4, sizeMin: 3, sizeMax: 6 });
        this.addParticles(x, y, '#ffffff', 8, { speed: 2, sizeMin: 2, sizeMax: 4 });
    },

    /**
     * v2.6.1: 添加弹道（替代 battle.js 的 addProjectile → Canvas2D drawProjectiles）
     *   type: 'fireball' / 'frost' / 'meteor' / 'meteor_storm' / 'dark_bolt' / 'shadow_blade'
     *         / 'blade_slash' / 'whirlwind' / 'charge_burst' / 'earth_crack' / 'soul_drain'
     *         / 'arcane_blast' / 'shield_aura' / 'frost_nova' / 'fan_knives' / 'multi_slash'
     *         / 'mark_x' / 'soul_storm' / 'curse_wave' / 'death_scythe' / 'arrow'
     *   sx/sy: 起点；tx/ty: 终点
     *   返回: {sprite, progress, speed, type, color, target, caster, ...} 供 caller 监听到达
     */
    addProjectile: function(sx, sy, tx, ty, type, color, target, caster) {
        if (!this.initialized) return null;
        // ★ v6.0 内存泄漏修复：限制同屏弹道数，防止拖尾粒子累积
        var maxProjectiles = 80;
        if (this.projectiles.length >= maxProjectiles) {
            var oldP = this.projectiles.shift();
            if (oldP) {
                // 清理拖尾
                for (var _ti = 0; _ti < oldP.trail.length; _ti++) {
                    if (this.projectileLayer && oldP.trail[_ti].sprite) {
                        try { this.projectileLayer.removeChild(oldP.trail[_ti].sprite); } catch(e) {}
                        oldP.trail[_ti].sprite.destroy({ children: true });
                    }
                }
                oldP.trail = [];
                if (this.projectileLayer && oldP.sprite) {
                    try { this.projectileLayer.removeChild(oldP.sprite); } catch(e) {}
                    oldP.sprite.destroy({ children: true });
                }
            }
        }
        var speedMap = {
            fireball: 0.045, frost: 0.045, meteor: 0.03, meteor_storm: 0.035,
            dark_bolt: 0.045, arrow: 0.055, shadow_blade: 0.06, blade_slash: 0.075,
            whirlwind: 0.05, charge_burst: 0.08, earth_crack: 0.045, soul_drain: 0.05,
            arcane_blast: 0.055, shield_aura: 0.06, frost_nova: 0.05, fan_knives: 0.06,
            multi_slash: 0.06, mark_x: 0.045, soul_storm: 0.04, curse_wave: 0.05,
            death_scythe: 0.045
        };
        var speed = speedMap[type] || 0.045;
        var hexColor = this._hexToInt(color);
        // 弹道本体（按类型画不同形状）
        var g = new PIXI.Graphics();
        switch (type) {
            case 'fireball':
            case 'meteor_storm':
                g.beginFill(0xffffcc, 0.9);
                g.drawCircle(0, 0, 5);
                g.endFill();
                g.beginFill(hexColor, 0.7);
                g.drawCircle(0, 0, 4);
                g.endFill();
                break;
            case 'frost':
            case 'frost_nova':
                g.beginFill(hexColor, 0.8);
                this._drawStar(g, 0, 0, 5, 6, hexColor);
                g.lineStyle(1.5, 0xffffff, 0.7);
                g.drawCircle(0, 0, 5);
                break;
            case 'meteor':
                g.beginFill(0xffffff, 0.9);
                g.drawCircle(0, 0, 4);
                g.endFill();
                g.beginFill(hexColor, 0.8);
                g.drawCircle(0, 0, 6);
                g.endFill();
                break;
            case 'dark_bolt':
            case 'soul_drain':
            case 'soul_storm':
            case 'curse_wave':
                g.beginFill(hexColor, 0.85);
                g.drawCircle(0, 0, 5);
                g.endFill();
                g.beginFill(0x000000, 0.5);
                g.drawCircle(0, 0, 3);
                g.endFill();
                break;
            case 'shadow_blade':
            case 'death_scythe':
                g.lineStyle(2, hexColor, 1);
                g.moveTo(-6, -6); g.lineTo(6, 6);
                g.moveTo(-6, 6); g.lineTo(6, -6);
                g.lineStyle(1, 0xffffff, 0.7);
                g.drawCircle(0, 0, 3);
                break;
            case 'arcane_blast':
                g.beginFill(hexColor, 0.7);
                this._drawStar(g, 0, 0, 6, 5, hexColor);
                g.lineStyle(1, 0xffffff, 0.8);
                g.drawCircle(0, 0, 4);
                break;
            case 'blade_slash':
            case 'multi_slash':
                g.lineStyle(2.5, hexColor, 1);
                g.arc(0, 0, 6, -Math.PI / 3, Math.PI / 3);
                g.lineStyle(1, 0xffffff, 0.8);
                g.drawCircle(0, 0, 3);
                break;
            case 'whirlwind':
                g.lineStyle(2, hexColor, 1);
                for (var wi = 0; wi < 3; wi++) {
                    var wa = (wi / 3) * Math.PI * 2;
                    g.arc(0, 0, 6, wa, wa + 1.2);
                }
                g.beginFill(hexColor, 0.5);
                g.drawCircle(0, 0, 3);
                g.endFill();
                break;
            case 'charge_burst':
                g.beginFill(hexColor, 0.9);
                g.drawCircle(0, 0, 5);
                g.endFill();
                g.lineStyle(1.5, 0xffffff, 1);
                g.drawCircle(0, 0, 7);
                break;
            case 'earth_crack':
                g.lineStyle(2, hexColor, 1);
                g.moveTo(-5, -2); g.lineTo(0, 0); g.lineTo(5, -3);
                g.moveTo(-4, 3); g.lineTo(0, 2); g.lineTo(5, 2);
                g.beginFill(hexColor, 0.6);
                g.drawCircle(0, 0, 3);
                g.endFill();
                break;
            case 'shield_aura':
                g.lineStyle(1.5, hexColor, 1);
                this._drawPolygon(g, 0, 0, 6, 6, hexColor, 0.4);
                g.beginFill(hexColor, 0.5);
                g.drawCircle(0, 0, 3);
                g.endFill();
                break;
            case 'fan_knives':
                g.lineStyle(2, hexColor, 1);
                g.moveTo(-4, -3); g.lineTo(4, 3);
                g.moveTo(-4, 3); g.lineTo(4, -3);
                g.lineStyle(1, 0xffffff, 0.8);
                g.drawCircle(0, 0, 2);
                break;
            case 'mark_x':
                g.lineStyle(2.5, hexColor, 1);
                g.moveTo(-5, 0); g.lineTo(5, 0);
                g.moveTo(0, -5); g.lineTo(0, 5);
                break;
            default:
                g.beginFill(hexColor, 0.85);
                g.drawCircle(0, 0, 4);
                g.endFill();
                break;
        }
        g.x = sx;
        g.y = sy;
        g.alpha = 1;
        // 旋转（飞行动感）
        g._spinSpeed = (type === 'frost' || type === 'frost_nova' || type === 'whirlwind') ? 6 : 3;
        this.projectileLayer.addChild(g);
        // 拖尾粒子（每弹道带 3-5 个小拖尾）
        var trailColor = this._hexToInt(color);
        var data = {
            sprite: g,
            sx: sx, sy: sy, tx: tx, ty: ty,
            progress: 0,
            speed: speed,
            type: type,
            color: color,
            target: target,
            caster: caster,
            angle: Math.atan2(ty - sy, tx - sx),
            // 拖尾缓存（避免每帧新建粒子）
            trail: [],
            trailTimer: 0,
            arrived: false
        };
        this.projectiles.push(data);
        return data;
    },

    /** 弹道更新（由 _tick 调用） */
    _tickProjectiles: function(dt) {
        if (!this.initialized) return;
        for (var i = this.projectiles.length - 1; i >= 0; i--) {
            var p = this.projectiles[i];
            p.progress += p.speed * dt / 16.6;  // 按 dt 缩放
            if (p.progress >= 1) {
                // ★ v3.5.1 弹道到达时清空拖尾粒子（防止残留累积）
                for (var _ti = 0; _ti < p.trail.length; _ti++) {
                    if (this.projectileLayer && p.trail[_ti].sprite) {
                        try { this.projectileLayer.removeChild(p.trail[_ti].sprite); } catch(e) {}
                        p.trail[_ti].sprite.destroy({ children: true });
                    }
                }
                p.trail = [];
                // 弹道到达：触发命中特效
                if (!p.arrived) {
                    p.arrived = true;
                    // 业务回调：battle.js 在这里应用伤害/触发 status effect
                    if (typeof this.onProjectileArrive === 'function') {
                        try {
                            this.onProjectileArrive(p);
                        } catch (e) {
                            console.error('[PixiFx] onProjectileArrive 回调错误:', e);
                        }
                    }
                    // 命中特效（按类型）
                    if (p.target && p.target.alive) {
                        var hitColor = p.color;
                        if (p.type === 'fireball' || p.type === 'meteor' || p.type === 'meteor_storm') {
                            this.addEffect(p.tx, p.ty, 'explosion', hitColor, 1.0);
                            this.addParticles(p.tx, p.ty, hitColor, 8);
                            this.addParticles(p.tx, p.ty, '#ffaa00', 5);
                        } else if (p.type === 'frost' || p.type === 'frost_nova') {
                            this.addEffect(p.tx, p.ty, 'nova', hitColor, 1.0, true);
                            this.addParticles(p.tx, p.ty, hitColor, 8);
                        } else if (p.type === 'blade_slash' || p.type === 'multi_slash') {
                            this.addEffect(p.tx, p.ty, 'slash', hitColor, 1.0);
                            this.addParticles(p.tx, p.ty, hitColor, 5);
                        } else {
                            this.addEffect(p.tx, p.ty, 'hit', hitColor, 0.9);
                            this.addParticles(p.tx, p.ty, hitColor, 4);
                        }
                    }
                }
                if (this.projectileLayer) this.projectileLayer.removeChild(p.sprite);
                p.sprite.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }
            // 位置插值
            var px = p.sx + (p.tx - p.sx) * p.progress;
            var py = p.sy + (p.ty - p.sy) * p.progress;
            p.sprite.x = px;
            p.sprite.y = py;
            // 旋转
            p.sprite.rotation += p._spinSpeed * dt / 1000;
            // 拖尾粒子（每 60ms 撒 1 个）
            p.trailTimer += dt;
            if (p.trailTimer >= 60) {
                p.trailTimer = 0;
                var t = new PIXI.Graphics();
                t.beginFill(this._hexToInt(p.color), 0.5);
                t.drawCircle(0, 0, 2 + Math.random() * 1.5);
                t.endFill();
                t.x = px;
                t.y = py;
                t.alpha = 0.6;
                this.projectileLayer.addChild(t);
                p.trail.push({ sprite: t, life: 300, maxLife: 300 });
            }
            // 拖尾渐隐
            for (var ti = p.trail.length - 1; ti >= 0; ti--) {
                var tr = p.trail[ti];
                tr.life -= dt;
                if (tr.life <= 0) {
                    if (this.projectileLayer) this.projectileLayer.removeChild(tr.sprite);
                    tr.sprite.destroy();
                    p.trail.splice(ti, 1);
                    continue;
                }
                var lr = tr.life / tr.maxLife;
                tr.sprite.alpha = lr * 0.6;
                tr.sprite.scale.set(0.4 + lr * 0.6);
            }
        }
    },

    _drawStar: function(g, cx, cy, outerR, points, color) {
        var innerR = outerR * 0.45;
        g.beginFill(color, 0.8);
        for (var i = 0; i < points * 2; i++) {
            var r = (i % 2 === 0) ? outerR : innerR;
            var a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            var x = cx + Math.cos(a) * r;
            var y = cy + Math.sin(a) * r;
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.closePath();
        g.endFill();
    },

    _drawPolygon: function(g, cx, cy, r, sides, color, alpha) {
        g.beginFill(color, alpha);
        for (var i = 0; i < sides; i++) {
            var a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            var x = cx + Math.cos(a) * r;
            var y = cy + Math.sin(a) * r;
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.closePath();
        g.endFill();
    },

    /** 调试：报告当前粒子/特效数 */
    getStats: function() {
        return {
            particles: this.particles.length,
            effects: this.effects.length,
            initialized: this.initialized
        };
    }
};