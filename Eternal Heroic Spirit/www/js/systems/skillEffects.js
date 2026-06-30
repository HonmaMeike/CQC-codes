// ========== 强化技能视觉特效系统 (v1.0) ==========
// 8 个职业独立特效，调用 PixiFx API 实现多层粒子 + 形状特效
// 用法: SkillEffects[skillId](caster, target, tx, ty)
// 所有方法都接收 (caster, target, tx, ty) 或 (tx, ty) 两种参数签名

var SkillEffects = {
    // ====================================================================
    // 骑士 (骑士) — 金色圣光、盾牌冲击、战争怒吼
    // ====================================================================

    shield_bash: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 主盾击：金色六边形盾击特效
        PixiFx.addEffect(tx, ty, 'shield', '#FFD700', 1.8, true);
        PixiFx.addEffect(tx, ty, 'explosion', '#FFF8E1', 1.2, true);
        // 冲击波环形粒子（向外扩散）
        PixiFx.addParticles(tx, ty, '#FFD700', 14, { speed: 4, sizeMin: 3, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 10, { speed: 3, sizeMin: 2, sizeMax: 4, gravity: 0 });
        // 金色碎片
        PixiFx.addParticles(tx, ty, '#FFF176', 8, { speed: 5, sizeMin: 2, sizeMax: 5, gravity: 0.08 });
        // 额外白色闪光点
        PixiFx.addParticles(tx, ty, '#FFFFFF', 6, { speed: 6, sizeMin: 1, sizeMax: 3, lifeMin: 300, lifeMax: 500 });
    },

    holy_shield: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 三层护盾：外金、中白、内光
        PixiFx.addEffect(cx, cy, 'shield', '#FFD700', 2.0, true);
        PixiFx.addEffect(cx, cy, 'shield', '#FFFFFF', 1.5, true);
        PixiFx.addEffect(cx, cy, 'buff', '#FFD700', 1.2, true);
        // 光柱上升粒子
        PixiFx.addParticles(cx, cy, '#FFD700', 16, { speed: 2, sizeMin: 2, sizeMax: 5, upBias: 3, gravity: -0.05 });
        PixiFx.addParticles(cx, cy, '#FFFDE7', 12, { speed: 1.5, sizeMin: 1, sizeMax: 3, upBias: 2.5, gravity: -0.03 });
        // 圣光下坠
        PixiFx.addParticles(cx, cy, '#FFFFFF', 8, { speed: 3, sizeMin: 2, sizeMax: 4, upBias: -2, gravity: 0.1 });
    },

    holy_armor: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'shield', '#FFD700', 2.2, true);
        PixiFx.addEffect(cx, cy, 'buff', '#FFE082', 1.5, true);
        PixiFx.addParticles(cx, cy, '#FFD700', 14, { speed: 2.5, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#FFFFFF', 10, { speed: 1.5, sizeMin: 1, sizeMax: 3 });
    },

    sacred_shield: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'shield', '#FFD700', 2.5, true);
        PixiFx.addEffect(cx, cy, 'nova', '#FFF9C4', 2.0, true);
        PixiFx.addEffect(cx, cy, 'shield', '#FFFFFF', 1.5, true);
        PixiFx.addParticles(cx, cy, '#FFD700', 18, { speed: 3, sizeMin: 2, sizeMax: 6 });
        PixiFx.addParticles(cx, cy, '#FFFFFF', 12, { speed: 2, sizeMin: 2, sizeMax: 4 });
    },

    holy_taunt: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 嘲讽：红色冲击波 + 金色挑衅光环
        PixiFx.addEffect(cx, cy, 'buff', '#D32F2F', 2.0, true);
        PixiFx.addEffect(cx, cy, 'nova', '#FFD700', 1.6, true);
        PixiFx.addEffect(cx, cy, 'explosion', '#FFCDD2', 1.2, true);
        PixiFx.addParticles(cx, cy, '#D32F2F', 18, { speed: 4, sizeMin: 3, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(cx, cy, '#FFD700', 12, { speed: 3, sizeMin: 2, sizeMax: 5 });
    },

    war_cry: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 战吼：金色冲击波光圈扩散
        PixiFx.addEffect(cx, cy, 'nova', '#FFD700', 2.5, true);
        PixiFx.addEffect(cx, cy, 'buff', '#FF9800', 1.8, true);
        PixiFx.addEffect(cx, cy, 'explosion', '#FFF3E0', 1.3, true);
        // 环形冲击波粒子
        PixiFx.addParticles(cx, cy, '#FFD700', 20, { speed: 5, sizeMin: 3, sizeMax: 6, gravity: 0, lifeMin: 500, lifeMax: 900 });
        PixiFx.addParticles(cx, cy, '#FF9800', 14, { speed: 4, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(cx, cy, '#FFCC80', 10, { speed: 3, sizeMin: 2, sizeMax: 4 });
    },

    iron_wall: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'shield', '#546E7A', 1.8, true);
        PixiFx.addEffect(cx, cy, 'shield', '#37474F', 1.3, true);
        PixiFx.addParticles(cx, cy, '#546E7A', 12, { speed: 2, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#90A4AE', 8, { speed: 1.5, sizeMin: 1, sizeMax: 3 });
    },

    // ====================================================================
    // 法师 (法师) — 烈焰、冰霜、奥术
    // ====================================================================

    fireball: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 主爆炸
        PixiFx.addEffect(tx, ty, 'explosion', '#FF6600', 1.6, true);
        PixiFx.addEffect(tx, ty, 'explosion', '#FFAA00', 1.2, true);
        // 烈焰粒子
        PixiFx.addParticles(tx, ty, '#FF6600', 16, { speed: 4, sizeMin: 3, sizeMax: 7, gravity: 0.03 });
        PixiFx.addParticles(tx, ty, '#FFAA00', 12, { speed: 3.5, sizeMin: 2, sizeMax: 5, gravity: 0.02 });
        PixiFx.addParticles(tx, ty, '#FFCC00', 8, { speed: 3, sizeMin: 2, sizeMax: 4 });
        // 灰烬烟雾
        PixiFx.addParticles(tx, ty, '#555555', 6, { speed: 2, sizeMin: 3, sizeMax: 6, gravity: -0.02, upBias: 2 });
        PixiFx.addParticles(tx, ty, '#888888', 4, { speed: 1.5, sizeMin: 2, sizeMax: 4, gravity: -0.01, upBias: 1.5 });
    },

    frost_nova: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 冰环散射
        for (var di = 0; di < 8; di++) {
            var ang = di * Math.PI / 4;
            var dx2 = Math.cos(ang) * 35;
            var dy2 = Math.sin(ang) * 35;
            PixiFx.addEffect(tx + dx2, ty + dy2, 'nova', '#81D4FA', 0.5, true);
        }
        PixiFx.addEffect(tx, ty, 'nova', '#4FC3F7', 2.2, true);
        PixiFx.addEffect(tx, ty, 'nova', '#B3E5FC', 1.6, true);
        // 冰晶粒子
        PixiFx.addParticles(tx, ty, '#4FC3F7', 18, { speed: 4.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#B3E5FC', 14, { speed: 3.5, sizeMin: 2, sizeMax: 4, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#E1F5FE', 10, { speed: 2.5, sizeMin: 1, sizeMax: 3 });
        // 白霜
        PixiFx.addParticles(tx, ty, '#FFFFFF', 8, { speed: 3, sizeMin: 1, sizeMax: 2, lifeMin: 400, lifeMax: 700 });
    },

    arcane_blast: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 奥术爆炸
        PixiFx.addEffect(tx, ty, 'explosion', '#9C27B0', 1.8, true);
        PixiFx.addEffect(tx, ty, 'nova', '#CE93D8', 1.5, true);
        PixiFx.addEffect(tx, ty, 'explosion', '#E1BEE7', 1.0, true);
        // 奥术漩涡粒子
        PixiFx.addParticles(tx, ty, '#9C27B0', 18, { speed: 4, sizeMin: 3, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#CE93D8', 14, { speed: 3, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#E1BEE7', 10, { speed: 2.5, sizeMin: 2, sizeMax: 4 });
        // 蓝白闪光
        PixiFx.addParticles(tx, ty, '#FFFFFF', 6, { speed: 5, sizeMin: 1, sizeMax: 3, lifeMin: 200, lifeMax: 400 });
    },

    arcane_power: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'buff', '#7E57C2', 1.8, true);
        PixiFx.addEffect(cx, cy, 'nova', '#B39DDB', 1.4, true);
        PixiFx.addParticles(cx, cy, '#7E57C2', 16, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#D1C4E9', 10, { speed: 2, sizeMin: 1, sizeMax: 3 });
    },

    mana_shield: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'shield', '#2196F3', 1.8, true);
        PixiFx.addEffect(cx, cy, 'shield', '#64B5F6', 1.4, true);
        PixiFx.addEffect(cx, cy, 'buff', '#90CAF9', 1.0, true);
        PixiFx.addParticles(cx, cy, '#2196F3', 14, { speed: 2.5, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#BBDEFB', 10, { speed: 1.5, sizeMin: 1, sizeMax: 3 });
    },

    meteor_storm: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 大范围流星爆炸
        for (var mi = 0; mi < 5; mi++) {
            var mAng = mi * Math.PI * 2 / 5;
            var mdx = Math.cos(mAng) * 30;
            var mdy = Math.sin(mAng) * 30;
            PixiFx.addEffect(tx + mdx, ty + mdy, 'explosion', '#FF4400', 1.2, true);
            PixiFx.addEffect(tx + mdx, ty + mdy, 'explosion', '#FFAA00', 0.8, true);
        }
        PixiFx.addEffect(tx, ty, 'explosion', '#FF4400', 2.5, true);
        PixiFx.addEffect(tx, ty, 'explosion', '#FF6600', 1.8, true);
        PixiFx.addEffect(tx, ty, 'nova', '#FFAB00', 1.5, true);
        PixiFx.addParticles(tx, ty, '#FF4400', 24, { speed: 5, sizeMin: 3, sizeMax: 7, gravity: 0.03 });
        PixiFx.addParticles(tx, ty, '#FF6600', 18, { speed: 4, sizeMin: 2, sizeMax: 6, gravity: 0.02 });
        PixiFx.addParticles(tx, ty, '#FFAA00', 14, { speed: 3.5, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(tx, ty, '#666666', 10, { speed: 2, sizeMin: 3, sizeMax: 6, gravity: -0.02, upBias: 2 });
    },

    // ====================================================================
    // 刺客 (刺客) — 暗影、毒刃、致命一击
    // ====================================================================

    backstab: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 暗影斩击
        PixiFx.addEffect(tx, ty, 'slash', '#6A1B9A', 1.6, true);
        PixiFx.addEffect(tx, ty, 'hit', '#CE93D8', 1.2, true);
        // 紫色暗影粒子
        PixiFx.addParticles(tx, ty, '#6A1B9A', 16, { speed: 4.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#9C27B0', 12, { speed: 3.5, sizeMin: 2, sizeMax: 4, gravity: 0 });
        // 暗影拖尾
        PixiFx.addParticles(tx, ty, '#4A148C', 8, { speed: 2, sizeMin: 3, sizeMax: 6, lifeMin: 500, lifeMax: 800 });
    },

    poison_blade: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 毒雾结界
        PixiFx.addEffect(cx, cy, 'nova', '#00E676', 1.6, true);
        PixiFx.addEffect(cx, cy, 'buff', '#76FF03', 1.3, true);
        // 毒雾粒子
        PixiFx.addParticles(cx, cy, '#76FF03', 16, { speed: 2.5, sizeMin: 3, sizeMax: 6, gravity: -0.02, upBias: 1.5 });
        PixiFx.addParticles(cx, cy, '#00E676', 12, { speed: 2, sizeMin: 2, sizeMax: 5, gravity: -0.01 });
        PixiFx.addParticles(cx, cy, '#AEEA00', 8, { speed: 1.5, sizeMin: 2, sizeMax: 4 });
    },

    shadow_step: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 暗影爆发
        PixiFx.addEffect(cx, cy, 'dark', '#4A148C', 2.0, true);
        PixiFx.addEffect(cx, cy, 'dark', '#7B1FA2', 1.5, true);
        PixiFx.addEffect(cx, cy, 'nova', '#9C27B0', 1.2, true);
        // 暗影消散
        PixiFx.addParticles(cx, cy, '#4A148C', 20, { speed: 4, sizeMin: 3, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(cx, cy, '#7B1FA2', 14, { speed: 3, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(cx, cy, '#311B92', 10, { speed: 2.5, sizeMin: 3, sizeMax: 5, lifeMin: 500, lifeMax: 900 });
    },

    death_mark: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 死亡标记
        PixiFx.addEffect(tx, ty, 'dark', '#B71C1C', 1.6, true);
        PixiFx.addEffect(tx, ty, 'hit', '#C62828', 1.2, true);
        PixiFx.addEffect(tx, ty, 'nova', '#7B1FA2', 1.0, true);
        PixiFx.addParticles(tx, ty, '#C62828', 14, { speed: 3.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#7B1FA2', 10, { speed: 2.5, sizeMin: 2, sizeMax: 4 });
        PixiFx.addParticles(tx, ty, '#B71C1C', 8, { speed: 4, sizeMin: 1, sizeMax: 3, lifeMin: 300, lifeMax: 500 });
    },

    fan_of_knives: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 扇形飞刀
        for (var fi = 0; fi < 7; fi++) {
            var fAng = (fi - 3) * 0.2;
            var fdx = Math.sin(fAng) * 35;
            var fdy = -Math.abs(Math.cos(fAng)) * 18 + 12;
            PixiFx.addEffect(tx + fdx, ty + fdy, 'slash', '#9E9E9E', 0.6, true);
        }
        PixiFx.addEffect(tx, ty, 'slash', '#B0BEC5', 1.3, true);
        PixiFx.addEffect(tx, ty, 'hit', '#FFFFFF', 0.9, true);
        PixiFx.addParticles(tx, ty, '#B0BEC5', 18, { speed: 3.5, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(tx, ty, '#90A4AE', 12, { speed: 2.5, sizeMin: 2, sizeMax: 4 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 8, { speed: 4, sizeMin: 1, sizeMax: 2 });
    },

    assassins_mark: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'nova', '#C62828', 1.5, true);
        PixiFx.addEffect(cx, cy, 'hit', '#E53935', 1.1, true);
        PixiFx.addParticles(cx, cy, '#C62828', 14, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#7B1FA2', 8, { speed: 2, sizeMin: 2, sizeMax: 4 });
    },

    // ====================================================================
    // 召唤师 (召唤师) — 召唤法阵、精灵协助
    // ====================================================================

    summon_wolf: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 召唤法阵
        PixiFx.addEffect(cx, cy, 'buff', '#7E57C2', 2.2, true);
        PixiFx.addEffect(cx, cy, 'nova', '#B39DDB', 1.6, true);
        PixiFx.addEffect(cx, cy, 'nova', '#D1C4E9', 1.1, true);
        // 紫色召唤粒子
        PixiFx.addParticles(cx, cy, '#7E57C2', 18, { speed: 3.5, sizeMin: 3, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(cx, cy, '#B39DDB', 14, { speed: 2.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(cx, cy, '#D1C4E9', 10, { speed: 2, sizeMin: 2, sizeMax: 4 });
        // 出场光环
        if (PixiFx.addSpawnAura) {
            PixiFx.addSpawnAura(cx, cy, '#7E57C2');
        }
    },

    dark_pact: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 黑暗契约
        PixiFx.addEffect(cx, cy, 'heal', '#AA66FF', 2.0, true);
        PixiFx.addEffect(cx, cy, 'dark', '#7B1FA2', 1.5, true);
        PixiFx.addEffect(cx, cy, 'explosion', '#CE93D8', 1.2, true);
        PixiFx.addParticles(cx, cy, '#AA66FF', 18, { speed: 3.5, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#7B1FA2', 12, { speed: 2.5, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#E1BEE7', 8, { speed: 2, sizeMin: 1, sizeMax: 3 });
    },

    soul_link: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 灵魂链接光环
        PixiFx.addEffect(cx, cy, 'buff', '#7B1FA2', 2.0, true);
        PixiFx.addEffect(cx, cy, 'nova', '#9C27B0', 1.4, true);
        PixiFx.addEffect(cx, cy, 'shield', '#CE93D8', 1.0, true);
        PixiFx.addParticles(cx, cy, '#7B1FA2', 14, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#BA68C8', 10, { speed: 2, sizeMin: 2, sizeMax: 4 });
    },

    summon_phoenix: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 凤凰降世
        PixiFx.addEffect(cx, cy, 'explosion', '#FF5722', 2.2, true);
        PixiFx.addEffect(cx, cy, 'nova', '#FF9800', 1.8, true);
        PixiFx.addEffect(cx, cy, 'buff', '#FF7043', 1.5, true);
        PixiFx.addEffect(cx, cy, 'explosion', '#FFCC02', 1.0, true);
        // 凤凰火焰粒子
        PixiFx.addParticles(cx, cy, '#FF5722', 22, { speed: 4.5, sizeMin: 3, sizeMax: 7, gravity: 0.02 });
        PixiFx.addParticles(cx, cy, '#FF9800', 16, { speed: 3.5, sizeMin: 2, sizeMax: 6, gravity: 0.01 });
        PixiFx.addParticles(cx, cy, '#FFCC02', 12, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#FFE0B2', 8, { speed: 2, sizeMin: 2, sizeMax: 4, gravity: -0.02, upBias: 2 });
        if (PixiFx.addSpawnAura) {
            PixiFx.addSpawnAura(cx, cy, '#FF5722');
        }
    },

    summon_elemental: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'buff', '#00BCD4', 2.0, true);
        PixiFx.addEffect(cx, cy, 'nova', '#4DD0E1', 1.5, true);
        PixiFx.addEffect(cx, cy, 'nova', '#80DEEA', 1.0, true);
        PixiFx.addParticles(cx, cy, '#00BCD4', 18, { speed: 3.5, sizeMin: 3, sizeMax: 6 });
        PixiFx.addParticles(cx, cy, '#4DD0E1', 14, { speed: 2.5, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#FFFFFF', 10, { speed: 2, sizeMin: 1, sizeMax: 3 });
        if (PixiFx.addSpawnAura) {
            PixiFx.addSpawnAura(cx, cy, '#00BCD4');
        }
    },

    summoners_will: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'buff', '#9C27B0', 1.8, true);
        PixiFx.addEffect(cx, cy, 'nova', '#CE93D8', 1.4, true);
        PixiFx.addParticles(cx, cy, '#9C27B0', 16, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#E1BEE7', 10, { speed: 2, sizeMin: 1, sizeMax: 3 });
    },

    // ====================================================================
    // 战士 (战士) — 旋风斩、冲锋、大地震颤
    // ====================================================================

    whirlwind: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 旋风斩
        for (var wi = 0; wi < 8; wi++) {
            var wAng = wi * Math.PI / 4;
            var wdx = Math.cos(wAng) * 30;
            var wdy = Math.sin(wAng) * 30;
            PixiFx.addEffect(tx + wdx, ty + wdy, 'slash', '#FF8A65', 0.8, true);
        }
        PixiFx.addEffect(tx, ty, 'slash', '#FF5722', 1.4, true);
        PixiFx.addEffect(tx, ty, 'nova', '#FFAB91', 1.2, true);
        PixiFx.addEffect(tx, ty, 'nova', '#FFCDD2', 0.8, true);
        PixiFx.addParticles(tx, ty, '#FF5722', 20, { speed: 4, sizeMin: 2, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#FF8A65', 14, { speed: 3, sizeMin: 2, sizeMax: 4, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#FFCC80', 10, { speed: 2.5, sizeMin: 2, sizeMax: 5 });
    },

    blood_thirst: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 嗜血狂暴
        PixiFx.addEffect(cx, cy, 'buff', '#D32F2F', 1.8, true);
        PixiFx.addEffect(cx, cy, 'nova', '#F44336', 1.4, true);
        PixiFx.addEffect(cx, cy, 'explosion', '#FFCDD2', 1.0, true);
        PixiFx.addParticles(cx, cy, '#D32F2F', 18, { speed: 3.5, sizeMin: 3, sizeMax: 6 });
        PixiFx.addParticles(cx, cy, '#F44336', 14, { speed: 2.5, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#FF8A80', 10, { speed: 2, sizeMin: 2, sizeMax: 4 });
    },

    charge: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 冲锋冲击
        PixiFx.addEffect(tx, ty, 'explosion', '#D32F2F', 1.8, true);
        PixiFx.addEffect(tx, ty, 'hit', '#FF8A80', 1.3, true);
        PixiFx.addEffect(tx, ty, 'nova', '#FFCDD2', 1.0, true);
        // 冲击波 + 碎片
        PixiFx.addParticles(tx, ty, '#D32F2F', 18, { speed: 5, sizeMin: 3, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#F44336', 12, { speed: 4, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#FF8A80', 10, { speed: 3, sizeMin: 2, sizeMax: 4 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 6, { speed: 6, sizeMin: 1, sizeMax: 3, lifeMin: 200, lifeMax: 400 });
    },

    berserk: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 狂怒觉醒
        PixiFx.addEffect(cx, cy, 'buff', '#B71C1C', 2.2, true);
        PixiFx.addEffect(cx, cy, 'nova', '#D32F2F', 1.7, true);
        PixiFx.addEffect(cx, cy, 'explosion', '#FF5722', 1.3, true);
        PixiFx.addParticles(cx, cy, '#B71C1C', 20, { speed: 4, sizeMin: 3, sizeMax: 6 });
        PixiFx.addParticles(cx, cy, '#D32F2F', 16, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#FF5722', 12, { speed: 2.5, sizeMin: 2, sizeMax: 4 });
    },

    warriors_soul: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'buff', '#FF7043', 1.8, true);
        PixiFx.addEffect(cx, cy, 'nova', '#FFAB91', 1.4, true);
        PixiFx.addParticles(cx, cy, '#FF7043', 16, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#FFCCBC', 10, { speed: 2, sizeMin: 1, sizeMax: 3 });
    },

    earthquake: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 地震：地面裂缝爆发
        PixiFx.addEffect(tx - 35, ty + 12, 'explosion', '#5D4037', 1.4, true);
        PixiFx.addEffect(tx, ty + 10, 'explosion', '#8D6E63', 1.8, true);
        PixiFx.addEffect(tx + 35, ty + 12, 'explosion', '#5D4037', 1.4, true);
        PixiFx.addEffect(tx, ty, 'nova', '#A1887F', 1.2, true);
        // 土石粒子
        PixiFx.addParticles(tx, ty, '#5D4037', 22, { speed: 4.5, sizeMin: 3, sizeMax: 7, gravity: 0.08 });
        PixiFx.addParticles(tx, ty, '#8D6E63', 16, { speed: 3.5, sizeMin: 2, sizeMax: 6, gravity: 0.06 });
        PixiFx.addParticles(tx, ty, '#BCAAA4', 12, { speed: 2.5, sizeMin: 2, sizeMax: 5, gravity: 0.04 });
        PixiFx.addParticles(tx, ty, '#D7CCC8', 8, { speed: 2, sizeMin: 2, sizeMax: 4 });
        // 烟雾
        PixiFx.addParticles(tx, ty, '#9E9E9E', 6, { speed: 1.5, sizeMin: 4, sizeMax: 7, gravity: -0.02, upBias: 1.5 });
    },

    // ====================================================================
    // 贤者 (贤者) — 治愈、祝福、净化、圣光
    // ====================================================================

    heal: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 治愈绿光
        PixiFx.addEffect(tx, ty, 'heal', '#69F0AE', 1.8, true);
        PixiFx.addEffect(tx, ty, 'heal', '#B9F6CA', 1.3, true);
        PixiFx.addEffect(tx, ty, 'nova', '#E8F5E9', 1.0, true);
        // 绿色生命粒子
        PixiFx.addParticles(tx, ty, '#69F0AE', 16, { speed: 3, sizeMin: 2, sizeMax: 5, upBias: 2, gravity: -0.03 });
        PixiFx.addParticles(tx, ty, '#B9F6CA', 12, { speed: 2, sizeMin: 2, sizeMax: 4, upBias: 1.5, gravity: -0.02 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 8, { speed: 1.5, sizeMin: 1, sizeMax: 3, upBias: 1 });
    },

    mass_heal: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 群体治愈
        PixiFx.addEffect(tx, ty, 'heal', '#66FF66', 2.2, true);
        PixiFx.addEffect(tx, ty, 'heal', '#B2FFB2', 1.6, true);
        PixiFx.addEffect(tx, ty, 'nova', '#E8F5E9', 1.3, true);
        PixiFx.addParticles(tx, ty, '#66FF66', 20, { speed: 3.5, sizeMin: 2, sizeMax: 5, upBias: 2.5, gravity: -0.04 });
        PixiFx.addParticles(tx, ty, '#B2FFB2', 14, { speed: 2.5, sizeMin: 2, sizeMax: 4, upBias: 1.5, gravity: -0.02 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 10, { speed: 2, sizeMin: 1, sizeMax: 3 });
    },

    blessing: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 祝福光环
        PixiFx.addEffect(cx, cy, 'buff', '#FFD700', 2.0, true);
        PixiFx.addEffect(cx, cy, 'nova', '#FFF9C4', 1.5, true);
        PixiFx.addEffect(cx, cy, 'nova', '#FFFDE7', 1.0, true);
        PixiFx.addParticles(cx, cy, '#FFD700', 18, { speed: 3, sizeMin: 2, sizeMax: 5, upBias: 1.5, gravity: -0.02 });
        PixiFx.addParticles(cx, cy, '#FFF9C4', 12, { speed: 2, sizeMin: 2, sizeMax: 4, upBias: 1 });
        PixiFx.addParticles(cx, cy, '#FFFFFF', 8, { speed: 1.5, sizeMin: 1, sizeMax: 3 });
    },

    purify: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 净化之水
        PixiFx.addEffect(tx, ty, 'heal', '#81D4FA', 1.6, true);
        PixiFx.addEffect(tx, ty, 'nova', '#B3E5FC', 1.3, true);
        PixiFx.addEffect(tx, ty, 'explosion', '#E1F5FE', 1.0, true);
        PixiFx.addParticles(tx, ty, '#81D4FA', 14, { speed: 3, sizeMin: 2, sizeMax: 5, upBias: 1.5 });
        PixiFx.addParticles(tx, ty, '#B3E5FC', 10, { speed: 2, sizeMin: 2, sizeMax: 4, upBias: 1 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 8, { speed: 2.5, sizeMin: 1, sizeMax: 3 });
    },

    divine_light: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 圣光普照
        PixiFx.addEffect(cx, cy, 'heal', '#FFD700', 2.2, true);
        PixiFx.addEffect(cx, cy, 'heal', '#FFECB3', 1.6, true);
        PixiFx.addEffect(cx, cy, 'buff', '#FFF8E1', 1.3, true);
        // 光柱粒子
        PixiFx.addParticles(cx, cy, '#FFD700', 18, { speed: 2.5, sizeMin: 2, sizeMax: 5, upBias: 3, gravity: -0.05 });
        PixiFx.addParticles(cx, cy, '#FFECB3', 14, { speed: 2, sizeMin: 2, sizeMax: 4, upBias: 2, gravity: -0.03 });
        PixiFx.addParticles(cx, cy, '#FFFFFF', 10, { speed: 1.5, sizeMin: 1, sizeMax: 3, upBias: 2.5, gravity: -0.04 });
        // 下落天使粒子
        PixiFx.addParticles(cx, cy, '#FFFDE7', 8, { speed: 3, sizeMin: 1, sizeMax: 2, upBias: -2, gravity: 0.08 });
    },

    resurrection: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 复活：金色圣光柱
        PixiFx.addEffect(tx, ty, 'heal', '#FFD700', 2.5, true);
        PixiFx.addEffect(tx, ty, 'heal', '#FFFFFF', 2.0, true);
        PixiFx.addEffect(tx, ty, 'buff', '#FFE082', 1.6, true);
        PixiFx.addEffect(tx, ty, 'nova', '#FFF9C4', 1.3, true);
        // 大范围光柱粒子
        PixiFx.addParticles(tx, ty, '#FFD700', 24, { speed: 3, sizeMin: 2, sizeMax: 6, upBias: 4, gravity: -0.06 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 16, { speed: 2, sizeMin: 2, sizeMax: 4, upBias: 3, gravity: -0.04 });
        PixiFx.addParticles(tx, ty, '#FFE082', 12, { speed: 2.5, sizeMin: 2, sizeMax: 4, upBias: 2.5, gravity: -0.03 });
        PixiFx.addParticles(tx, ty, '#FFF9C4', 10, { speed: 1.5, sizeMin: 1, sizeMax: 3, upBias: 2 });
    },

    holy_grace: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'heal', '#FFD700', 1.8, true);
        PixiFx.addEffect(cx, cy, 'buff', '#FFECB3', 1.4, true);
        PixiFx.addParticles(cx, cy, '#FFD700', 16, { speed: 2.5, sizeMin: 2, sizeMax: 5, upBias: 1.5 });
        PixiFx.addParticles(cx, cy, '#FFFFFF', 10, { speed: 1.5, sizeMin: 1, sizeMax: 3, upBias: 1 });
    },

    // ====================================================================
    // 亡灵法师 (死灵) — 暗影、骷髅、灵魂汲取
    // ====================================================================

    death_bolt: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 死亡之箭命中
        PixiFx.addEffect(tx, ty, 'dark', '#6A1B9A', 1.6, true);
        PixiFx.addEffect(tx, ty, 'dark', '#4A148C', 1.2, true);
        PixiFx.addEffect(tx, ty, 'hit', '#7B1FA2', 1.0, true);
        // 暗紫粒子
        PixiFx.addParticles(tx, ty, '#6A1B9A', 16, { speed: 4, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#9C27B0', 12, { speed: 3, sizeMin: 2, sizeMax: 4, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#4A148C', 8, { speed: 2.5, sizeMin: 3, sizeMax: 5, lifeMin: 500, lifeMax: 800 });
    },

    raise_dead: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 亡灵复生
        PixiFx.addEffect(tx, ty, 'dark', '#37474F', 2.0, true);
        PixiFx.addEffect(tx, ty, 'nova', '#4A148C', 1.5, true);
        PixiFx.addEffect(tx, ty, 'nova', '#7B1FA2', 1.1, true);
        PixiFx.addEffect(tx, ty, 'buff', '#311B92', 0.8, true);
        PixiFx.addParticles(tx, ty, '#37474F', 16, { speed: 3.5, sizeMin: 3, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#7B1FA2', 12, { speed: 2.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#4A148C', 10, { speed: 2, sizeMin: 2, sizeMax: 4 });
        if (PixiFx.addSpawnAura) {
            PixiFx.addSpawnAura(tx, ty, '#4A148C');
        }
    },

    curse: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 诅咒
        PixiFx.addEffect(tx, ty, 'dark', '#4A148C', 1.8, true);
        PixiFx.addEffect(tx, ty, 'hit', '#7B1FA2', 1.3, true);
        PixiFx.addEffect(tx, ty, 'nova', '#311B92', 1.0, true);
        // 诅咒波纹
        PixiFx.addParticles(tx, ty, '#4A148C', 18, { speed: 4, sizeMin: 3, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#7B1FA2', 14, { speed: 3, sizeMin: 2, sizeMax: 4, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#CE93D8', 8, { speed: 2, sizeMin: 2, sizeMax: 4 });
        // 暗影缠绕粒子
        PixiFx.addParticles(tx, ty, '#1A237E', 6, { speed: 2, sizeMin: 2, sizeMax: 4, lifeMin: 500, lifeMax: 900 });
    },

    soul_drain: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 灵魂汲取
        PixiFx.addEffect(tx, ty, 'dark', '#7B1FA2', 1.6, true);
        PixiFx.addEffect(tx, ty, 'dark', '#4A148C', 1.2, true);
        PixiFx.addEffect(tx, ty, 'heal', '#E040FB', 1.0, true);
        PixiFx.addParticles(tx, ty, '#9C27B0', 18, { speed: 3.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#4A148C', 12, { speed: 2.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#E040FB', 10, { speed: 3, sizeMin: 2, sizeMax: 4, upBias: 1.5 });
        // 吸取能量粒子
        PixiFx.addParticles(tx, ty, '#CE93D8', 8, { speed: 2, sizeMin: 1, sizeMax: 3, lifeMin: 400, lifeMax: 700 });
    },

    death_aura: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'dark', '#7B1FA2', 2.0, true);
        PixiFx.addEffect(cx, cy, 'nova', '#4A148C', 1.5, true);
        PixiFx.addEffect(cx, cy, 'buff', '#311B92', 1.2, true);
        PixiFx.addParticles(cx, cy, '#7B1FA2', 16, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#311B92', 12, { speed: 2, sizeMin: 2, sizeMax: 4 });
    },

    soul_storm: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 灵魂风暴
        PixiFx.addEffect(tx, ty, 'dark', '#6A1B9A', 2.2, true);
        PixiFx.addEffect(tx, ty, 'dark', '#4A148C', 1.6, true);
        PixiFx.addEffect(tx, ty, 'explosion', '#9C27B0', 1.3, true);
        PixiFx.addEffect(tx, ty, 'nova', '#CE93D8', 1.0, true);
        PixiFx.addParticles(tx, ty, '#6A1B9A', 22, { speed: 4.5, sizeMin: 3, sizeMax: 6, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#4A148C', 16, { speed: 3.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#9C27B0', 12, { speed: 3, sizeMin: 2, sizeMax: 4 });
        PixiFx.addParticles(tx, ty, '#E040FB', 8, { speed: 2.5, sizeMin: 2, sizeMax: 4, gravity: 0 });
    },

    // ====================================================================
    // 剑客 (剑士) — 剑舞、居合、反击、天翔
    // ====================================================================

    sword_dance: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 剑舞：多道斩击
        for (var sd = 0; sd < 8; sd++) {
            var sdAng = sd * Math.PI / 4;
            PixiFx.addEffect(tx + Math.cos(sdAng) * 20, ty + Math.sin(sdAng) * 20, 'slash', '#E0E0E0', 0.6, true);
        }
        PixiFx.addEffect(tx, ty, 'slash', '#FFFFFF', 1.4, true);
        PixiFx.addEffect(tx, ty, 'slash', '#BDBDBD', 1.0, true);
        PixiFx.addParticles(tx, ty, '#E0E0E0', 18, { speed: 4, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 12, { speed: 3, sizeMin: 1, sizeMax: 3, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#9E9E9E', 8, { speed: 2.5, sizeMin: 2, sizeMax: 4 });
    },

    quick_slash: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 居合斩：快速拔刀
        PixiFx.addEffect(tx, ty, 'slash', '#90CAF9', 1.8, true);
        PixiFx.addEffect(tx, ty, 'slash', '#E3F2FD', 1.3, true);
        PixiFx.addEffect(tx, ty, 'nova', '#FFFFFF', 1.0, true);
        // 居合闪光
        PixiFx.addParticles(tx, ty, '#90CAF9', 16, { speed: 4.5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#E3F2FD', 12, { speed: 3.5, sizeMin: 2, sizeMax: 4, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 10, { speed: 5, sizeMin: 1, sizeMax: 3, lifeMin: 200, lifeMax: 400 });
        // 蓝色刀光残留
        PixiFx.addParticles(tx, ty, '#42A5F5', 6, { speed: 2, sizeMin: 2, sizeMax: 4, lifeMin: 400, lifeMax: 600 });
    },

    counter: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        // 反击姿态
        PixiFx.addEffect(cx, cy, 'shield', '#90A4AE', 1.6, true);
        PixiFx.addEffect(cx, cy, 'buff', '#B0BEC5', 1.3, true);
        PixiFx.addEffect(cx, cy, 'slash', '#FFFFFF', 1.0, true);
        PixiFx.addParticles(cx, cy, '#90A4AE', 14, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#FFFFFF', 10, { speed: 2, sizeMin: 1, sizeMax: 3 });
    },

    final_strike: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 绝命一击
        PixiFx.addEffect(tx, ty, 'slash', '#FFFFFF', 2.2, true);
        PixiFx.addEffect(tx, ty, 'slash', '#FFD700', 1.7, true);
        PixiFx.addEffect(tx, ty, 'explosion', '#FFE082', 1.3, true);
        PixiFx.addEffect(tx, ty, 'nova', '#FFF9C4', 1.0, true);
        // 爆发粒子
        PixiFx.addParticles(tx, ty, '#FFFFFF', 20, { speed: 5, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#FFD700', 16, { speed: 4, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#E0E0E0', 12, { speed: 3, sizeMin: 2, sizeMax: 4 });
        PixiFx.addParticles(tx, ty, '#FFE082', 8, { speed: 3.5, sizeMin: 2, sizeMax: 4 });
    },

    blade_mastery: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        var cx = caster ? caster.x : tx, cy = caster ? caster.y : ty;
        PixiFx.addEffect(cx, cy, 'buff', '#BDBDBD', 1.6, true);
        PixiFx.addEffect(cx, cy, 'nova', '#E0E0E0', 1.3, true);
        PixiFx.addParticles(cx, cy, '#BDBDBD', 14, { speed: 3, sizeMin: 2, sizeMax: 5 });
        PixiFx.addParticles(cx, cy, '#FFFFFF', 10, { speed: 2, sizeMin: 1, sizeMax: 3 });
    },

    heavenly_slash: function(caster, target, tx, ty) {
        if (!PixiFx || !PixiFx.initialized) return;
        // 天翔斩
        PixiFx.addEffect(tx, ty, 'slash', '#90CAF9', 1.8, true);
        PixiFx.addEffect(tx, ty, 'nova', '#BBDEFB', 1.5, true);
        PixiFx.addEffect(tx, ty, 'nova', '#E3F2FD', 1.1, true);
        PixiFx.addParticles(tx, ty, '#90CAF9', 18, { speed: 4, sizeMin: 2, sizeMax: 5, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#E3F2FD', 12, { speed: 3, sizeMin: 2, sizeMax: 4, gravity: 0 });
        PixiFx.addParticles(tx, ty, '#FFFFFF', 10, { speed: 3.5, sizeMin: 1, sizeMax: 3 });
        // 风压粒子
        PixiFx.addParticles(tx, ty, '#B3E5FC', 8, { speed: 5, sizeMin: 1, sizeMax: 3, lifeMin: 200, lifeMax: 350 });
    }
};
