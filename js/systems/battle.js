/* global Formulas, AudioManager, PixiFx, ConfigLoader, GameState, BattleConfig, BattleUtils */
/* exported BattleManager */

// ========== 战斗系统 ==========

// 战斗管理器
var BattleManager = {
    canvas: null,
    ctx: null,
    allies: [],
    enemies: [],
    waveNumber: 1,
    stage: 1,
    isRunning: false,
    animFrame: null,
    lastTime: 0,
    battleWidth: 0,
    battleHeight: 0,
    
    // 波次系统
    waveState: 'resting',     // 'active' | 'resting'
    waveSpawnCount: 5,        // 本波总怪物数
    waveSpawned: 0,           // 已生成数
    restTimer: 1000,          // 休息倒计时(ms)，初始1秒后出第一波
    restDuration: 3000,       // 波间休息3秒
    heroRegenPct: 0.3,        // 休息时回复30%HP
    
    spawnTimer: 0,
    spawnInterval: 1500,      // 生成间隔1.5秒（引用 BattleConfig.SPAWN_INTERVAL_NORMAL）
    maxEnemies: 5,            // 同屏最大怪物数
    battleLog: [],
    maxBattleLog: 200,
    // 日志筛选激活状态（默认全部为 true）
    _activeLogTypes: null,
    // 弹道系统
    projectiles: [],
    // 状态效果管理
    statusEffectTimer: 0,
    speed: 1,
    autoBattle: true,       // 自动战斗开关
    waitingNextChapter: false, // 等待点击下一章

    // ★ v5.0: 战斗数据统计
    _battleStats: { damageDealt: 0, damageTaken: 0, kills: {}, healing: 0, startTime: 0 },

    // 副本模式
    isDungeon: false,
    dungeonType: null,      // 'gold'/'stone'/'gem'/'equip'
    dungeonLevel: 1,
    savedNormalState: null,
    // ★ BUG#1 终极修复：主战场 canvas 备份
    // 进入副本时把 canvas/ctx/battleWidth/battleHeight 切到副本独立 canvas，
    // 退出时切回，实现"独立战斗画面"完全视觉隔离
    _mainCanvas: null,
    _mainCtx: null,
    _mainBattleWidth: 0,
    _mainBattleHeight: 0,
    _mainBattlePaused: false,  // 退出副本后主战场处于暂停状态，需玩家点"继续战斗"

    // 切换到指定 canvas（用于副本/主战场互切）
    switchCanvas: function(targetCanvas) {
        if (!targetCanvas) return;
        this.canvas = targetCanvas;
        this.ctx = targetCanvas.getContext('2d');
        var dpr = window.devicePixelRatio || 1;
        var rect = targetCanvas.getBoundingClientRect();
        // 如果目标 canvas 还没设置尺寸（width/height 为 0 或 NaN），用 container 尺寸兜底
        var w = rect.width || (targetCanvas.parentElement ? targetCanvas.parentElement.getBoundingClientRect().width : 0);
        var h = rect.height || (targetCanvas.parentElement ? targetCanvas.parentElement.getBoundingClientRect().height : 0);
        if (w <= 0) w = targetCanvas.width || 800;
        if (h <= 0) h = targetCanvas.height || 400;
        targetCanvas.width = w * dpr;
        targetCanvas.height = h * dpr;
        this.battleWidth = w;
        this.battleHeight = h;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // ★ BUG#9 修复：切换 canvas 后必须重新同步 ally 位置
        //   副本 canvas 与主战场 canvas 尺寸通常不同，之前 allies[].x/y 是基于主战场 (可能是 0×0 兜底值)
        //   计算的，现在要按新尺寸重置才能在副本中正确显示。
        this._resyncAllyPositions();
    },

    // 把 canvas 引用切回主战场（恢复视觉隔离前的状态）
    restoreMainCanvas: function() {
        if (this._mainCanvas) {
            this.canvas = this._mainCanvas;
            this.ctx = this._mainCtx;
            this.battleWidth = this._mainBattleWidth;
            this.battleHeight = this._mainBattleHeight;
        }
    },

    // ★ v2.6.2 BUG 修复：PixiFx 是单例绑定一个 canvas 的（init() 有 if(this.initialized) return 守卫）。
    //   副本战斗会把 PixiFx 绑到 dungeon-pixi-overlay-canvas（隐藏）上，退出副本时如果不重新
    //   切回主战场 canvas，PixiFx.app.ticker 会继续在隐藏 canvas 上每帧 WebGL 渲染 + 拖尾粒子
    //   累积，吃光 GPU/CPU，导致主战场画面视觉"卡死"（gameLoop 实际还在跑，但渲染被严重拖慢）。
    //   这里集中管理 destroy+init，副本切换流程都走这个 helper。
    //   注意：PixiFx.onProjectileArrive 闭包挂在 PixiFx 对象上（不是 app），所以 destroy 后
    //   重新 init 不会丢，弹道到达回调依然能命中 self.projectiles。
    _reinitPixiFx: function(targetCanvas, width, height) {
        if (typeof PixiFx === 'undefined') return;
        if (!targetCanvas) return;
        // 先把已有 PixiFx 实例彻底拆掉（不只 clearAll，要 destroy，否则 ticker 不停）
        if (PixiFx.initialized) {
            try { PixiFx.destroy(); } catch (e) { console.warn('[Battle] PixiFx.destroy 异常:', e); }
        }
        var dpr = window.devicePixelRatio || 1;
        targetCanvas.width = (width || 600) * dpr;
        targetCanvas.height = (height || 400) * dpr;
        targetCanvas.style.width = (width || 600) + 'px';
        targetCanvas.style.height = (height || 400) + 'px';
        PixiFx.init(targetCanvas, width || 600, height || 400);
    },

    // 从副本继续主战场战斗（玩家点"继续战斗"按钮时调用）
    resumeMainBattle: function() {
        if (this._mainBattlePaused) {
            this._mainBattlePaused = false;
            // 恢复主战场 canvas 引用
            this.restoreMainCanvas();
            // 隐藏主战场的"继续战斗"按钮
            var resumeBtn = document.getElementById('btn-resume-main-battle');
            if (resumeBtn) resumeBtn.style.display = 'none';
            // ★ v2.6.2: 兜底 — 如果 exitDungeon 当时没成功 reinit（如 dungeon modal 是被外部关掉的），
            //   这里强制把 PixiFx 切回主战场 canvas，避免主战场战斗跑起来时粒子全打到隐藏 canvas 上。
            var mainPixi = document.getElementById('pixi-overlay-canvas');
            if (mainPixi && typeof PixiFx !== 'undefined' && PixiFx.initialized && PixiFx.app && PixiFx.app.view && PixiFx.app.view !== mainPixi) {
                this._reinitPixiFx(mainPixi, this.battleWidth || this._mainBattleWidth || 600, this.battleHeight || this._mainBattleHeight || 400);
            }
            // 重启主战场
            this.waveState = 'resting';
            this.restTimer = 1000;
            this.startBattle();
        }
    },

    // ★ BUG#8 修复：玩家手动暂停/恢复主战场战斗（与阵容修改配套）
    togglePause: function() {
        if (this.isDungeon) {
            showToast('副本中无法暂停', 'warning');
            return;
        }
        if (!this.isRunning) {
            showToast('当前没有进行中的战斗', 'info');
            return;
        }
        this._mainBattlePaused = !this._mainBattlePaused;
        // 恢复时重置休息计时，避免暂停期间被跳过的帧
        if (!this._mainBattlePaused) {
            this.restTimer = 1000;
        }
        // 同步主战场的"继续战斗"按钮
        var resumeBtn = document.getElementById('btn-resume-main-battle');
        if (resumeBtn) resumeBtn.style.display = this._mainBattlePaused ? 'inline-block' : 'none';
        // 同步 wave-status 提示文字
        var statusEl = document.getElementById('wave-status');
        if (statusEl && this._mainBattlePaused) {
            statusEl.textContent = '已暂停 · 修改阵容请先点击“继续战斗”重启';
        }
        if (typeof showToast === 'function') {
            showToast(this._mainBattlePaused ? '⏸️ 战斗已暂停' : '▶️ 战斗已恢复', 'info');
        }
        AudioManager.play('click');
    },

    // ★ BUG#8 修复：公开读取暂停状态
    isPaused: function() {
        return this.isRunning && this._mainBattlePaused === true;
    },

    // ★ BUG#8 修复：阵容变化后重置当前关卡（保持暂停状态）
    //   - 重置所有友方状态：满血/满蓝/清状态/清技能CD
    //   - 重置波次：敌人清空、休息计时重置
    //   - 不启动 gameLoop，保持暂停状态
    resetForTeamChange: function() {
        if (this.isDungeon) return false;
        if (!this._mainBattlePaused) return false;

        // 重置波次状态
        this.enemies = [];
        var levelIdx = ((this.waveNumber - 1) % 20) + 1;
        this.waveSpawnCount = this.calculateLevelMonsterCount(this.stage, levelIdx);
        this.waveSpawned = 0;
        this.waveState = 'resting';
        this.restTimer = 1000;
        this.spawnTimer = 0;
        this.deathTimerInit = false;
        this.projectiles = [];

        // 重置所有友方（满血满蓝，清状态）
        for (var i = 0; i < this.allies.length; i++) {
            var ally = this.allies[i];
            ally.alive = true;
            ally.hp = ally.maxHp;
            ally.mp = ally.maxMp;
            ally.shieldHp = 0;
            ally.atkTimer = 0;
            ally.skillCd = {};
            ally.buffs = [];
            ally.statusEffects = [];
            ally.target = null;
        }

        // 同步 UI
        document.getElementById('wave-number').textContent = this.getLevelDisplay();
        document.getElementById('monster-count').textContent = '怪物: 0/' + this.waveSpawnCount;
        document.getElementById('wave-status').textContent = '阵容已更换，关卡已重置';
        this.addBattleLog('阵容已更换，当前关卡已重置', 'info');

        // 渲染一帧静止画面（不能走 startBattle，否则会启动 gameLoop 跳出暂停）
        if (typeof this.render === 'function') {
            this.render();
        }
        return true;
    },

    // 过场动画遮罩
    reviveFlash: 0,          // 复活闪光倒计时(ms)
    
    // 日志类型 → 图标 映射表
    _logIconMap: {
        info: '💬', attack: '⚔️', skill: '✨', crit: '💥', heal: '💚',
        shield: '🛡️', buff: '⬆️', debuff: '⬇️', death: '💀', boss: '👑',
        loot: '🎁', level: '🌟', victory: '🏆', defeat: '💔', revive: '✨'
    },
    // 初始化日志筛选默认状态（全部激活）
    _initLogFilter: function() {
        if (this._activeLogTypes) return;
        this._activeLogTypes = {
            info: true, attack: true, skill: true, crit: true, heal: true,
            shield: true, buff: true, debuff: true, death: true, boss: true,
            loot: true, level: true, victory: true, defeat: true, revive: true
        };
    },
    // 添加战斗日志（精致显示：时间戳 + 类型图标 + 卡片式，增量更新避免闪屏）
    addBattleLog: function(msg, type) {
        if (!type) type = 'info';
        this._initLogFilter();
        var now = new Date();
        var hh = (now.getHours() < 10 ? '0' : '') + now.getHours();
        var mm = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
        var ss = (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();
        var timeStr = hh + ':' + mm + ':' + ss;
        this.battleLog.unshift({ msg: msg, type: type, time: timeStr });
        if (this.battleLog.length > this.maxBattleLog) {
            this.battleLog.pop();
        }
        // 增量更新 DOM（只创建新项，不重写全部 - 避免闪屏）
        var logEl = document.getElementById('battle-log');
        if (logEl) {
            var li = this._logIconMap[type] || this._logIconMap.info;
            var item = document.createElement('div');
            item.className = 'log-item log-' + type;
            item.setAttribute('data-log-type', type);
            // ★ v2.6.4 Round 12: 加 data-log-msg 给搜索用, data-log-key 给"关键"tab 用
            item.setAttribute('data-log-msg', msg);
            var isKey = (type === 'attack' || type === 'crit' || type === 'skill' || type === 'boss' || type === 'loot' || type === 'level' || type === 'victory' || type === 'defeat');
            if (isKey) item.setAttribute('data-log-key', '1');
            // 转义 msg 防止 XSS（用 textContent 而非 innerHTML 拼接）
            var timeSpan = document.createElement('span');
            timeSpan.className = 'log-time';
            timeSpan.textContent = timeStr;
            var iconSpan = document.createElement('span');
            iconSpan.className = 'log-icon';
            iconSpan.textContent = li;
            var msgSpan = document.createElement('span');
            msgSpan.className = 'log-msg';
            msgSpan.textContent = msg;
            item.appendChild(timeSpan);
            item.appendChild(iconSpan);
            item.appendChild(msgSpan);
            // 应用当前筛选状态
            this._applyItemVisibility(item, type, isKey);
            // 插入到顶部（不触发现有项的动画，避免闪屏）
            if (logEl.firstChild) {
                logEl.insertBefore(item, logEl.firstChild);
            } else {
                logEl.appendChild(item);
            }
            // 限制 DOM 节点数（超出删除末尾项）
            var maxDom = 200;
            while (logEl.children.length > maxDom) {
                logEl.removeChild(logEl.lastChild);
            }
            // 更新统计
            this._refreshLogStats();
        }
    },
    // ★ BUG#3b 修复：BOSS/精英出场横幅
    // 从屏幕中央滑入，显示 2.5 秒后滑出，给足出场逼格
    showMonsterBanner: function(enemy) {
        if (!enemy) return;
        // 同一 BOSS 只弹一次（用特殊ID去重）
        if (this._bannerMonsterIds && this._bannerMonsterIds[enemy.id]) return;
        if (!this._bannerMonsterIds) this._bannerMonsterIds = {};
        this._bannerMonsterIds[enemy.id] = true;

        // 创建横幅
        var banner = document.createElement('div');
        var isBoss = !!enemy.isBoss;
        banner.className = 'monster-banner ' + (isBoss ? 'is-boss' : 'is-elite');
        var tagText = isBoss ? '⚠ BOSS ⚠' : '✦ 精英 ✦';
        var name = enemy.specialName || enemy.name || '???';
        var desc = enemy.specialDesc || '';
        var icon = enemy.icon || (isBoss ? '👑' : '★');
        banner.innerHTML = [
            '<span class="banner-tag">' + tagText + '</span>',
            '<span class="banner-icon">' + icon + '</span>',
            '<div class="banner-name">' + name + '</div>',
            desc ? '<div class="banner-desc">' + desc + '</div>' : ''
        ].join('');
        document.body.appendChild(banner);
        // 强制重绘后加动画 class
        setTimeout(function() { banner.classList.add('banner-show'); }, 10);
        // 2.5秒后滑出
        setTimeout(function() {
            banner.classList.remove('banner-show');
            banner.classList.add('banner-hide');
            setTimeout(function() { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 500);
        }, 2500);
    },
    // 切换某个类型的日志筛选
    toggleLogFilter: function(type) {
        this._initLogFilter();
        if (type === 'all') {
            // 点击「全部」：检测是否全部已激活
            var allOn = true;
            for (var k in this._activeLogTypes) {
                if (this._activeLogTypes[k] === false) { allOn = false; break; }
            }
            var newState = !allOn;
            for (var k2 in this._activeLogTypes) {
                this._activeLogTypes[k2] = newState;
            }
        } else if (type === 'key') {
            // ★ v2.6.4 Round 12: "关键" tab — 切换关键事件 (attack/crit/skill/boss/loot/level/victory/defeat) 可见
            // 简化: 关键 = attack + crit + boss + loot + level + victory + defeat (skill 不算关键, 太频繁)
            var keyTypes = ['attack', 'crit', 'boss', 'loot', 'level', 'victory', 'defeat'];
            var allKeyOn = true;
            for (var i = 0; i < keyTypes.length; i++) {
                if (this._activeLogTypes[keyTypes[i]] === false) { allKeyOn = false; break; }
            }
            // 点 key 时: 如果都开 → 关掉所有关键类型; 否则 → 开启所有关键类型 (但保持其他不变)
            var wantState = !allKeyOn;
            for (var j = 0; j < keyTypes.length; j++) {
                this._activeLogTypes[keyTypes[j]] = wantState;
            }
        } else {
            this._activeLogTypes[type] = !this._activeLogTypes[type];
        }
        // 更新筛选按钮视觉
        this._refreshLogFilterUI();
        // 更新所有现有项的可见性
        this._refreshLogItems();
    },
    // 刷新筛选按钮的 active 态
    _refreshLogFilterUI: function() {
        var self = this;
        var btns = document.querySelectorAll('#log-filter-bar .log-filter-btn');
        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            var t = btn.getAttribute('data-type');
            if (t === 'all') {
                var allOn = true;
                for (var k in self._activeLogTypes) {
                    if (self._activeLogTypes[k] === false) { allOn = false; break; }
                }
                if (allOn) btn.classList.add('active', 'all-active');
                else btn.classList.remove('active', 'all-active');
            } else if (t === 'key') {
                // 关键 tab 显示: 至少 1 个关键类型是开的
                var keyTypes = ['attack', 'crit', 'boss', 'loot', 'level', 'victory', 'defeat'];
                var anyKeyOn = false;
                for (var ki = 0; ki < keyTypes.length; ki++) {
                    if (self._activeLogTypes[keyTypes[ki]] !== false) { anyKeyOn = true; break; }
                }
                if (anyKeyOn) btn.classList.add('active');
                else btn.classList.remove('active');
            } else {
                if (self._activeLogTypes[t] === false) btn.classList.remove('active');
                else btn.classList.add('active');
            }
        }
    },
    // 刷新所有现有 .log-item 的可见性
    _refreshLogItems: function() {
        var self = this;
        var items = document.querySelectorAll('#battle-log .log-item');
        for (var i = 0; i < items.length; i++) {
            var t = items[i].getAttribute('data-log-type');
            var isKey = items[i].getAttribute('data-log-key') === '1';
            if (!t) continue;
            // 同时受类型筛选 + 关键词搜索影响
            self._applyItemVisibility(items[i], t, isKey);
        }
        self._refreshLogStats();
    },
    // 应用单项可见性: 类型筛选 + 关键词搜索
    _applyItemVisibility: function(item, type, isKey) {
        var typeVisible = this._activeLogTypes[type] !== false;
        var kw = this._logKeyword || '';
        var kwVisible = true;
        if (kw) {
            var msg = item.getAttribute('data-log-msg') || '';
            kwVisible = (msg.toLowerCase().indexOf(kw.toLowerCase()) >= 0);
        }
        if (typeVisible && kwVisible) item.classList.remove('log-hidden');
        else item.classList.add('log-hidden');
    },
    // 按关键词筛选
    filterLogByKeyword: function(kw) {
        this._logKeyword = kw || '';
        this._refreshLogItems();
    },
    // 复制全部日志到剪贴板
    copyBattleLog: function() {
        if (!this.battleLog || this.battleLog.length === 0) {
            if (typeof showToast === 'function') showToast('日志为空', 'info');
            return;
        }
        // battleLog 是 unshift 进去的 (新→旧), 复制时倒序变回时间正序
        var lines = [];
        for (var i = this.battleLog.length - 1; i >= 0; i--) {
            var entry = this.battleLog[i];
            lines.push('[' + entry.time + '] ' + entry.msg);
        }
        var text = lines.join('\n');
        var self = this;
        var done = function() {
            if (typeof showToast === 'function') showToast('已复制 ' + self.battleLog.length + ' 条日志', 'success');
        };
        // 优先 navigator.clipboard (现代浏览器), fallback execCommand
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function() {
                self._copyFallback(text); done();
            });
        } else {
            this._copyFallback(text); done();
        }
    },
    _copyFallback: function(text) {
        var ta = document.createElement('textarea');
        ta.className = 'copy-textarea';
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
        document.body.removeChild(ta);
    },
    // 清空日志
    clearBattleLog: function() {
        this.battleLog = [];
        var logEl = document.getElementById('battle-log');
        if (logEl) logEl.innerHTML = '';
        this._refreshLogStats();
        if (typeof showToast === 'function') showToast('日志已清空', 'info');
    },
    // 刷新统计: "X 条" (显示当前可见 / 总数)
    _refreshLogStats: function() {
        var statsEl = document.getElementById('log-stats');
        if (!statsEl) return;
        var total = this.battleLog ? this.battleLog.length : 0;
        var visible = 0;
        var items = document.querySelectorAll('#battle-log .log-item');
        for (var i = 0; i < items.length; i++) {
            if (!items[i].classList.contains('log-hidden')) visible++;
        }
        if (visible === total) statsEl.textContent = total + ' 条';
        else statsEl.textContent = visible + '/' + total;
    },

    // 初始化
    init: function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        // ★ BUG#1 终极修复：备份主战场 canvas 引用（用于副本独立战斗画面的视觉隔离）
        this._mainCanvas = this.canvas;
        this._mainCtx = this.ctx;
        this.resize();
        // ★ v2.6.1: 初始化 PixiJS 特效层（透明 WebGL canvas 叠加，吃 addParticles/addEffect）
        var pixiCanvas = document.getElementById('pixi-overlay-canvas');
        if (pixiCanvas && typeof PixiFx !== 'undefined') {
            PixiFx.init(pixiCanvas, this.battleWidth, this.battleHeight);
            // 注册弹道到达回调（PixiFx 接管位置/到达/特效，业务侧标记已处理）
            PixiFx.onProjectileArrive = (function(self) {
                return function(p) {
                    // 标记 battle 侧 projectile 为已到达，updateProjectiles 会清理数组
                    for (var i = 0; i < self.projectiles.length; i++) {
                        if (self.projectiles[i]._fxRef === p) {
                            self.projectiles[i]._fxArrived = true;
                            break;
                        }
                    }
                };
            })(this);
        }
        var self = this;
        window.addEventListener('resize', function() { self.resize(); });
    },

    // ★ BUG#9 修复：canvas 父元素隐藏时（默认进入家园界面时 screen-main 是 display:none），
    //             getBoundingClientRect 返回 0×0，会导致所有位置计算到 (0,0) 而看不到任何角色/怪物。
    //             这里用 viewport 兜底尺寸，确保 battleWidth/battleHeight 始终有合理值。
    //   实际可用区域 = viewport - 顶部栏(44px) - 底部导航(56px) = viewport - 100px
    _getFallbackSize: function() {
        var navHeight = 56;          // --nav-height
        var headerHeight = 44;       // --header-height
        var reserved = navHeight + headerHeight;
        var w, h;
        if (typeof window !== 'undefined') {
            w = (window.innerWidth || document.documentElement.clientWidth || 800);
            // max-width: 480px（main.css #app 限制）
            if (w > 480) w = 480;
            h = (window.innerHeight || document.documentElement.clientHeight || 600) - reserved;
        } else {
            w = 480;
            h = 400;
        }
        if (w < 320) w = 480;
        if (h < 200) h = 400;
        return { w: w, h: h };
    },

    resize: function() {
        var container = this.canvas ? this.canvas.parentElement : null;
        var rect = container ? container.getBoundingClientRect() : { width: 0, height: 0 };
        var dpr = window.devicePixelRatio || 1;
        var w = rect.width;
        var h = rect.height;

        // ★ BUG#9 修复：父元素隐藏时 rect 为 0×0 → 使用 viewport 兜底尺寸
        if (w <= 0 || h <= 0) {
            var fb = this._getFallbackSize();
            w = fb.w;
            h = fb.h;
        }

        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.battleWidth = w;
        this.battleHeight = h;
        // ★ BUG#1 终极修复：备份主战场尺寸（副本 modal canvas 切换时不会被覆盖）
        if (this.canvas === this._mainCanvas) {
            this._mainBattleWidth = this.battleWidth;
            this._mainBattleHeight = this.battleHeight;
        }
        if (this.ctx) {
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        // ★ v2.6.1: 同步调整 PixiJS overlay canvas 尺寸
        var pixiCanvas = document.getElementById('pixi-overlay-canvas');
        if (pixiCanvas && typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            pixiCanvas.width = w * dpr;
            pixiCanvas.height = h * dpr;
            pixiCanvas.style.width = w + 'px';
            pixiCanvas.style.height = h + 'px';
            PixiFx.resize(w, h);
        }

        // ★ BUG#9 修复：尺寸变化后重新同步 allies 站位（之前用 0×0 计算的位置现在要按新尺寸重置）
        this._resyncAllyPositions();
        // ★ v7.x 修复：同样同步敌人站位（切换画面后怪物消失的根因）
        this._resyncEnemyPositions();
    },

    // ★ BUG#9 修复：重新同步所有友方的站位（用于 resize 后 / canvas 切换后）
    //   注意：敌人位置由 spawnEnemy 实时计算（基于 aliveEnemies.length），不需要重置；
    //   友方位置由 setTeam 写入后再没更新过，所以 resize/canvas 切换后必须重置才能正确显示。
    _resyncAllyPositions: function() {
        if (!this.allies || this.allies.length === 0) return;
        var positions = this.getAllyPositions();
        for (var i = 0; i < this.allies.length; i++) {
            if (this.allies[i] && positions[i]) {
                this.allies[i].x = positions[i].x;
                this.allies[i].y = positions[i].y;
            }
        }
    },

    // ★ v7.x 修复：resize 后重新同步敌人站位（切换画面后怪物消失的根因）
    //   敌人位置在 spawn 时固定写入 x/y，resize 改变 battleWidth/battleHeight 后位置失效
    _resyncEnemyPositions: function() {
        if (!this.enemies || this.enemies.length === 0) return;
        var aliveEnemies = this.enemies.filter(function(e) { return e.alive; });
        for (var i = 0; i < this.enemies.length; i++) {
            if (!this.enemies[i] || !this.enemies[i].alive) continue;
            var idx = aliveEnemies.indexOf(this.enemies[i]);
            if (idx < 0) continue;
            var pos = this.getEnemyPosition(idx);
            this.enemies[i].x = pos.x;
            this.enemies[i].y = pos.y;
        }
    },

    // 设置队伍
    setTeam: function(heroes) {
        this.allies = [];
        if (this.summons) this.summons = [];   // v2.6.1: 换队伍时清空召唤物
        var positions = this.getAllyPositions();
        for (var i = 0; i < heroes.length; i++) {
            var h = heroes[i];
            if (!h) continue;
            var pos = positions[i] || { x: 0, y: 0 };
            var clsData = getClassData(h.classId);
            if (!clsData) continue;

            var stats = this.calcAllyStats(h, clsData);
            var passives = [], skillIds = h.skills || clsData.skills || [];
            for (var si = 0; si < skillIds.length; si++) {
                var sk = SKILL_DATA[skillIds[si]];
                if (sk && sk.type === "passive") {
                    var slv = (h.skillLevels && h.skillLevels[skillIds[si]]) || 0;
                    if (slv > 0) passives.push(sk);
                }
            }
            var finalMaxMp = clsData.baseMp || 80;
            for (var pi = 0; pi < passives.length; pi++) {
                if (passives[pi].mpBonusPct) finalMaxMp += Math.floor(finalMaxMp * passives[pi].mpBonusPct);
            }
            this.allies.push({
                id: h.id,
                name: h.name || clsData.name,
                classId: h.classId,
                role: clsData.role,
                icon: clsData.icon,
                x: pos.x,
                y: pos.y,
                maxHp: stats.hp,
                hp: stats.hp,
                shieldHp: 0,
                shieldMax: 0,
                // v2.6.1: 程序化骨骼(8 职业通用骨架,5 套程序化动画:idle/attack/hit/die/spawn)
                skeleton: (typeof buildClassSkeleton === 'function')
                    ? buildClassSkeleton(h.classId, { color: '#4fc3f7', isAlly: true, scale: 1 })
                    : null,
                maxMp: finalMaxMp,
                mp: finalMaxMp,
                mpRegen: clsData.mpRegen || 5,
                atk: stats.atk,
                def: stats.def,
                spd: stats.spd,
                crit: stats.crit,
                critDmg: stats.critDmg,
                effectHit: stats.effectHit || 0,
                effectRes: stats.effectRes || 0,
                dmgBonus: stats.dmgBonus || 0,
                dmgReduction: stats.dmgReduction || 0,
                healRate: stats.healRate || 0,
                // v2.6.1: 把 stats.healBonus / summonAtkBonus 同步到 ally（贤者圣恩 passive 走 healBonus 通道）
                healBonus: stats.healBonus || 0,
                summonAtkBonus: stats.summonAtkBonus || 0,
                isAlly: true,
                alive: true,
                level: h.level || 1,
                exp: h.exp || 0,
                expToNext: h.expToNext || 50,
                target: null,
                skillCd: {},
                equip: h.equip || {},
                buffs: [],
                passives: passives,
                // ===== 套装效果运行时状态 =====
                _activeSetEffects: stats._setEffects || { setId: null, pieceCount: 0, has2pc: false, has4pc: false },
                // 暗影套：标记目标ID（被暴击击中后标记）
                _shadowMark: null,
                // 圣光套：护盾计时器
                _holyShieldTimer: 0,
                // 狂战套：狂暴状态
                _berserkerActive: false,
                _berserkerTimer: 0,
                // 龙鳞套：反弹追踪
                _dragonReflectPending: false
            });
        }
    },

    // 计算英雄最终属性（含装备和天赋加成）
    // v3 严谨化（2.1.4+）：装备词条/宝石/天赋/被动技能的累加委托给 Formulas 统一实现
    //   - 优势：公式调整只改 Formulas.js，战斗系统自动跟随
    //   - 安全：Formulas 不可用时保留原内联回退
    // =====================================================================
    // ADDITIVE STAT MODEL (v6.0)
    // =====================================================================
    // Previously each system (equipment affixes, gems, passives, talents,
    // set effects, pets, rebirth, level bonus) MULTIPLIED a running
    // cumulative total, producing exponential growth that was impossible
    // to balance — a single percentage affix on top of already-multiplied
    // stats would compound into 20-30x multipliers at endgame.
    //
    // In the ADDITIVE model, ALL percentage-based bonuses reference the
    // hero's "level base stats" as their independent anchor:
    //
    //   levelBaseStat = clsData.baseStats[stat] * (1 + level * 0.02)
    //
    // Each system calculates its flat contribution independently and
    // adds it to the accumulator.  This means a +15% ATK affix always
    // gives exactly 0.15 * levelBaseAtk regardless of how many other
    // bonuses are stacked — eliminating exponential runaway.
    //
    // Calculation order (v6.7.7 — ADDITIVE model, all %-based bonuses
    // anchored to levelBaseStat):
    //   1. Level base stats (anchor for all %-based systems)
    //          levelBase[stat] = clsData.baseStats[stat] × (1 + level × 0.02)
    //   2. Equipment base stats (flat, × enhanceMult)
    //   3. Equipment affixes (fixed × eqLevelMult, or % × levelBaseStat)
    //   4. Gem bonuses (% × levelBaseStat × classMult, or fixed × classMult)
    //   5. Talent bonuses (isPct → _talentPct deferred; non-pct → flat)
    //   6. Passive skill bonuses (% × accumulatedStat × skillScale)
    //   7. [mid-pipeline] Ensure positive minimums
    //   8. Talent pct bonuses applied (flat values added after all %-based systems)
    //   9. Set effects 2pc (% × levelBaseStat)
    //  10. Rebirth bonuses (multiply FINAL accumulated stats × 1+rebirthPct)
    //  11. Pet bonuses (% × levelBaseStat for core; % × accumulated for non-core)
    //  12. Soft caps (limit atk/def/hp/spd overflow)
    //  13. Final rounding + positive flooring
    // =====================================================================
    calcAllyStats: function(hero, clsData) {
        var level = hero.level || 1;

        // ---------- Step 1: 等级基础属性 (the anchor) ----------
        var lvlFactor = 1 + level * 0.02;
        var levelBase = {};
        levelBase.atk = clsData.baseStats.atk * lvlFactor;
        levelBase.def = clsData.baseStats.def * lvlFactor;
        levelBase.hp  = clsData.baseStats.hp  * lvlFactor;
        levelBase.spd = clsData.baseStats.spd * lvlFactor;
        levelBase.maxMp = (clsData.baseMp || clsData.baseStats.maxMp || clsData.baseStats.mp || 80) * lvlFactor;

        // Helper: get level base for a stat (falls back to baseStats for non-core)
        function _lvlBase(stat) {
            return levelBase.hasOwnProperty(stat) ? levelBase[stat] : (clsData.baseStats[stat] || 0);
        }

        // ---------- Initialize stats accumulator ----------
        var stats = {};
        for (var _k in clsData.baseStats) {
            if (clsData.baseStats.hasOwnProperty(_k)) {
                // 核心属性从 levelBase 起步，其他保持原值
                if (_k === 'atk')  stats[_k] = levelBase.atk;
                else if (_k === 'def')  stats[_k] = levelBase.def;
                else if (_k === 'hp')   stats[_k] = levelBase.hp;
                else if (_k === 'spd')  stats[_k] = levelBase.spd;
                else stats[_k] = clsData.baseStats[_k];
            }
        }
        stats.effectHit = stats.effectHit || 0;
        stats.effectRes = stats.effectRes || 0;
        stats.expBonus = stats.expBonus || 0;
        stats.lootBonus = stats.lootBonus || 0;
        stats.maxMp = levelBase.maxMp || 80;  // 法力值（baseMp 不在 baseStats 内）

        // Formulas delegation helpers
        var _applyAffix = (typeof Formulas !== 'undefined' && Formulas.applyAffix)
            ? Formulas.applyAffix : null;
        var _applyGem = (typeof Formulas !== 'undefined' && Formulas.applyGem)
            ? Formulas.applyGem : null;
        var _applyTalentStat = (typeof Formulas !== 'undefined' && Formulas.applyTalentStat)
            ? Formulas.applyTalentStat : null;
        var _applyPassiveBonus = (typeof Formulas !== 'undefined' && Formulas.applyPassiveBonus)
            ? Formulas.applyPassiveBonus : null;

        // ---------- Step 2: 装备加成 ----------
        var equipSlots = hero.equip || {};
        for (var slot in equipSlots) {
            var eq = equipSlots[slot];
            if (!eq) continue;

            // 装备等级缩放系数 (equipment level, NOT hero level)
            var eqLevelMult = 1 + ((eq.level || 1) - 1) * 0.02;
            // 槽位强化等级
            var enhanceLvl = (typeof getSlotEnhanceLevel === 'function') ? getSlotEnhanceLevel(hero.id, slot) : 0;
            var enhanceMult = 1 + enhanceLvl * 0.05;

            // 装备基础属性 (flat add, × enhanceMult only)
            if (eq.baseStats && Array.isArray(eq.baseStats) && eq.baseStats.length > 0) {
                for (var bi = 0; bi < eq.baseStats.length; bi++) {
                    var bs = eq.baseStats[bi];
                    if (bs && bs.stat && bs.value > 0) {
                        var enhancedVal = Math.round(bs.value * enhanceMult);
                        stats[bs.stat] = (stats[bs.stat] || 0) + enhancedVal;
                    }
                }
            } else {
                var baseStatData = getEquipBaseStat(eq.slot, eq.level, eq.quality);
                if (baseStatData && baseStatData.value > 0) {
                    var enhancedVal = Math.round(baseStatData.value * enhanceMult);
                    stats[baseStatData.stat] = (stats[baseStatData.stat] || 0) + enhancedVal;
                }
            }

            // ★ 计算装备基础总值（用于后续%系统的锚点放大）
            var equipBaseTotal = {}; equipBaseTotal.atk = 0; equipBaseTotal.def = 0; equipBaseTotal.hp = 0; equipBaseTotal.spd = 0;
            for (var _ebi = 0; _ebi < 4; _ebi++) {
                var _ebk = ['atk','def','hp','spd'][_ebi];
                equipBaseTotal[_ebk] = Math.max(0, (stats[_ebk] || 0) - levelBase[_ebk]);
            }
            // ★ 装备基础总值纳入锚点（%系统使用 levelBase + equipBaseTotal）
            var fullAnchor = { atk: levelBase.atk + equipBaseTotal.atk, def: levelBase.def + equipBaseTotal.def, hp: levelBase.hp + equipBaseTotal.hp, spd: levelBase.spd + equipBaseTotal.spd };
            
            // 装备词条 (delegates to Formulas.applyAffix, fallback inline)
            var affixes = eq.affixes || [];
            for (var a = 0; a < affixes.length; a++) {
                if (_applyAffix) {
                    _applyAffix(stats, affixes[a], eqLevelMult, fullAnchor);
                } else {
                    var aff = affixes[a];
                    var scaledVal = Math.floor((aff.value || 0) * eqLevelMult);
                    if (aff.type === 'pct') {
                        // Additive: levelBaseStat × scaledVal / 100
                        var lbAff = fullAnchor.hasOwnProperty(aff.stat) ? fullAnchor[aff.stat] : _lvlBase(aff.stat);
                        stats[aff.stat] = (stats[aff.stat] || 0) + (lbAff * scaledVal / 100);
                    } else {
                        // Fixed value: flat add
                        stats[aff.stat] = (stats[aff.stat] || 0) + scaledVal;
                    }
                }
            }

            // 宝石加成 (delegates to Formulas.applyGem, fallback inline)
            if (eq.gems) {
                for (var g = 0; g < eq.gems.length; g++) {
                    var gem = eq.gems[g];
                    if (!gem) continue;
                    var gt=null;var _es5_12=GEM_TYPES;for(var _es5_13=0;_es5_13<_es5_12.length;_es5_13++){if(_es5_12[_es5_13].id === gem.gemTypeId){gt=_es5_12[_es5_13];break;}};
                    if (!gt) continue;
                    var classMult = clsData.statMultipliers && clsData.statMultipliers[gt.stat]
                        ? clsData.statMultipliers[gt.stat] : 1;
                    if (_applyGem) {
                        _applyGem(stats, gem, gt, classMult, fullAnchor);
                    } else {
                        var gemPct = getGemValue(gt, gem.level);
                        if (gemPct <= 0) continue;
                        if (gt.statType === 'pct') {
                            // Additive: levelBaseStat × gemPct × classMult / 100
                            var lbGem = fullAnchor.hasOwnProperty(gt.stat) ? fullAnchor[gt.stat] : _lvlBase(gt.stat);
                            stats[gt.stat] = (stats[gt.stat] || 0) + (lbGem * gemPct * classMult / 100);
                        } else {
                            stats[gt.stat] = (stats[gt.stat] || 0) + (gemPct * classMult);
                        }
                        if (gt.isCompound && gt.extraStat) {
                            var extraVal = getGemExtraValue(gt, gem.level);
                            stats[gt.extraStat] = (stats[gt.extraStat] || 0) + extraVal;
                        }
                    }
                }
            }
        }

        // ---------- Step 3: 天赋加成 ----------
        if (gameState && GameState.get('talents')) {
            var localTalents = GameState.get('talents');
            var talentLevels = GameState.get('talentLevels') || {};
            for (var t = 0; t < localTalents.length; t++) {
                var tid = localTalents[t];
                var td=null;var _es5_14=TALENT_DATA;for(var _es5_15=0;_es5_15<_es5_14.length;_es5_15++){if(_es5_14[_es5_15].id === tid){td=_es5_14[_es5_15];break;}};
                if (!td || td.type !== 'stat') continue;
                var talentLvl = talentLevels[tid] || 1;
                if (_applyTalentStat) {
                    _applyTalentStat(stats, td, talentLvl, fullAnchor);
                } else {
                    var perLvl = (typeof getTalentValue === 'function') ? getTalentValue(td) : (td.value || 0);
                    var isPctFallback = (typeof getTalentIsPct === 'function') ? getTalentIsPct(td) : (td.isPct || false);
                    var bonus = perLvl * talentLvl;
                    if (isPctFallback) {
                        // Percentage: levelBaseStat × bonus / 100 → store as flat value
                        if (!stats._talentPct) stats._talentPct = {};
                        var lbTal = fullAnchor.hasOwnProperty(td.stat) ? fullAnchor[td.stat] : _lvlBase(td.stat);
                        stats._talentPct[td.stat] = (stats._talentPct[td.stat] || 0) + (lbTal * bonus / 100);
                    } else {
                        // Fixed value: flat add
                        if (td.stat === 'hp') stats.hp += bonus;
                        else if (td.stat === 'atk') stats.atk += bonus;
                        else if (td.stat === 'def') stats.def += bonus;
                        else if (td.stat === 'spd') stats.spd += bonus;
                        else if (td.stat === 'crit') stats.crit += bonus;
                        else if (td.stat === 'critDmg') stats.critDmg += bonus;
                    }
                }
            }
        }

        // ---------- Step 4: 被动技能加成 ----------
        var heroPassiveSkills = hero.skills || clsData.skills || [];
        for (var psi = 0; psi < heroPassiveSkills.length; psi++) {
            var psk = SKILL_DATA[heroPassiveSkills[psi]];
            if (!psk || psk.type !== "passive") continue;
            var pslv = (hero.skillLevels && hero.skillLevels[heroPassiveSkills[psi]]) || 0;
            if (pslv === 0) continue;
            if (_applyPassiveBonus) {
                _applyPassiveBonus(stats, psk, pslv, fullAnchor);
            } else {
                var _psScale = 1 + (pslv - 1) * 0.1;
                // Additive: levelBaseStat × pct × skillScale
                if (psk.defBonusPct)    stats.def    += (fullAnchor.def * psk.defBonusPct    * _psScale);
                if (psk.atkBonusPct)    stats.atk    += (fullAnchor.atk * psk.atkBonusPct    * _psScale);
                if (psk.hpBonusPct)     stats.hp     += Math.floor(fullAnchor.hp  * psk.hpBonusPct     * _psScale);
                if (psk.spdBonusPct)    stats.spd    += (fullAnchor.spd * psk.spdBonusPct    * _psScale);
                if (psk.mpBonusPct)     stats.maxMp  += (fullAnchor.maxMp || levelBase.maxMp || 80) * psk.mpBonusPct * _psScale;
                if (psk.critBonusPct)   stats.crit   += Math.round(psk.critBonusPct   * _psScale);
                if (psk.critDmgBonus)   stats.critDmg+= Math.round(psk.critDmgBonus   * _psScale);
                if (psk.healBonusPct)   stats.healBonus   = (stats.healBonus   ||0) + ((psk.healBonusPct   ||0) * 100 * _psScale);
                if (psk.summonAtkBonus) stats.summonAtkBonus = (stats.summonAtkBonus||0) + Math.round((psk.summonAtkBonus||0) * 100 * _psScale) / 100;
                if (psk.summonHpBonus)  stats.summonHpBonus  = (stats.summonHpBonus ||0) + Math.round((psk.summonHpBonus ||0) * 100 * _psScale) / 100;
                if (psk.shadowDmgBonus) stats.shadowDmgBonus = (stats.shadowDmgBonus||0) + Math.round((psk.shadowDmgBonus||0) * 100 * _psScale) / 100;
            }
        }

        // NOTE: Old lvlBonus (hero level multiplier at end of pipeline) REMOVED.
        // Level scaling is now baked into levelBaseStat at Step 1 — all
        // percentage-based systems automatically scale with hero level.

        // Ensure positive minimums
        stats.hp  = Math.max(1, stats.hp);
        stats.atk = Math.max(1, stats.atk);
        stats.def = Math.max(0, stats.def);
        stats.spd = Math.max(1, stats.spd);

        // Apply talent pct bonuses (before set/reborn/pets/cap — always full benefit)
        if (stats._talentPct) {
            for (var tp in stats._talentPct) {
                if (stats._talentPct.hasOwnProperty(tp)) {
                    stats[tp] = (stats[tp] || 0) + stats._talentPct[tp];
                }
            }
            delete stats._talentPct;
        }

        // Clean up internal temporary fields
        if (stats._pctApplied) delete stats._pctApplied;

        // ---------- 套装效果 (additive: levelBaseStat × setPct) ----------
        var setEffects = this.getActiveSetEffects(hero);
        if (setEffects.setId) {
            var sd = SET_DATA[setEffects.setId];
            if (sd) {
                if (setEffects.has2pc) {
                    if (sd.bonus2.defBonus) stats.def += (fullAnchor.def * sd.bonus2.defBonus);
                    if (sd.bonus2.atkBonus) stats.atk += (fullAnchor.atk * sd.bonus2.atkBonus);
                    if (sd.bonus2.critBonus) stats.crit = (stats.crit || 0) + sd.bonus2.critBonus;
                    if (sd.bonus2.hpBonus) stats.hp += (fullAnchor.hp * sd.bonus2.hpBonus);
                    if (sd.bonus2.healBonus) stats.healBonus = (stats.healBonus || 0) + sd.bonus2.healBonus;
                    if (sd.bonus2.spdBonus && !sd.bonus2.defBonus && !sd.bonus2.atkBonus) stats.spd += (fullAnchor.spd * sd.bonus2.spdBonus);
                    if (sd.bonus2.hpPctBonus) stats.hp += (fullAnchor.hp * sd.bonus2.hpPctBonus);
                    if (sd.bonus2.atkPctBonus) stats.atk += (fullAnchor.atk * sd.bonus2.atkPctBonus);
                    if (sd.bonus2.defPctBonus) stats.def += (fullAnchor.def * sd.bonus2.defPctBonus);
                    if (sd.bonus2.dmgBonus) stats.dmgBonus = (stats.dmgBonus || 0) + sd.bonus2.dmgBonus;
                    if (sd.bonus2.dmgReduction) stats.dmgReduction = (stats.dmgReduction || 0) + sd.bonus2.dmgReduction;
                }
            }
        }
        stats._setEffects = setEffects;

        // ---------- Step 7: 转生加成 (multiplicative on final stats) ----------
        var rebirthBonuses = getRebirthBonuses();
        if (rebirthBonuses.atkPct > 0) {
            var rebirthMult = 1 + rebirthBonuses.atkPct / 100;
            stats.atk = Math.floor(stats.atk * rebirthMult);
            stats.def = Math.floor(stats.def * rebirthMult);
            stats.hp  = Math.floor(stats.hp  * rebirthMult);
            stats.spd = Math.floor(stats.spd * rebirthMult);
        }

        // ---------- Step 8: 宠物加成 (additive: levelBaseStat × petBonus) ----------
        if (typeof gameState !== 'undefined' && gameState && GameState.get('activePets') && GameState.get('pets')) {
            var localPets = GameState.get('pets') || [];
            var localActivePets = GameState.get('activePets') || [];
            var activePetsData = [];
            for (var _pi = 0; _pi < localPets.length; _pi++) {
                if (localActivePets.indexOf(localPets[_pi].id) !== -1) {
                    activePetsData.push({ id: localPets[_pi].id, level: localPets[_pi].level });
                }
            }
            if (activePetsData.length > 0) {
                var _petBonus = calcPetBonus(activePetsData);
                if (_petBonus && _petBonus._isCombined) {
                    if (_petBonus.all) {
                        stats.atk += (fullAnchor.atk * _petBonus.all);
                        stats.def += (fullAnchor.def * _petBonus.all);
                        stats.hp  += Math.floor(fullAnchor.hp  * _petBonus.all);
                        stats.spd += (fullAnchor.spd * _petBonus.all);
                    }
                    for (var _ps in _petBonus) {
                        if (_ps === '_isCombined' || _ps === 'all') continue;
                        if (_ps === 'crit') {
                            stats.crit = (stats.crit || 0) + Math.round(_petBonus[_ps] * 100);
                        } else if (_ps === 'healBonus') {
                            // _petBonus.healBonus 是 pct (0.15 = 15%) → 百分点 = pct * 100
                            //   修复前误写为 *1000（多了 10×）
                            stats.healBonus = (stats.healBonus || 0) + Math.round(_petBonus[_ps] * 100);
                        } else if (_ps === 'atk' || _ps === 'def' || _ps === 'hp' || _ps === 'spd') {
                            // Core stats: additive via levelBaseStat
                            stats[_ps] += (fullAnchor.hasOwnProperty(_ps) ? fullAnchor[_ps] * _petBonus[_ps] : _lvlBase(_ps) * _petBonus[_ps]);
                        } else {
                            // Non-core stats: keep multiplicative (legacy)
                            stats[_ps] = Math.floor((stats[_ps] || 0) * (1 + _petBonus[_ps]));
                        }
                    }
                }
            }
        }
        // 软上限已移除（v6.8.6）

        // 最终取整
        for (var _rk in stats) {
            if (stats.hasOwnProperty(_rk) && typeof stats[_rk] === 'number') {
                stats[_rk] = Math.round(stats[_rk]);
            }
        }
        // 确保正值
        stats.hp = Math.max(1, stats.hp);
        stats.atk = Math.max(1, stats.atk);
        stats.def = Math.max(0, stats.def);
        stats.spd = Math.max(1, stats.spd);

        return stats;
    },

    // ===== 套装效果辅助：统计英雄穿戴的套装件数 =====
    // 返回: { setId, pieceCount, has2pc, has4pc }
    //       setId=null 表示没有完整套装
    getActiveSetEffects: function(hero) {
        if (!hero || !hero.equip) return { setId: null, pieceCount: 0, has2pc: false, has4pc: false };
        var equip = hero.equip;
        var counts = {};
        // 遍历所有装备槽位，统计各套装的件数
        for (var slot in equip) {
            var eq = equip[slot];
            if (!eq) continue;
            if (eq.setId) {
                counts[eq.setId] = (counts[eq.setId] || 0) + 1;
            }
        }
        // 找到件数最多的套装（一件装备最多属于一个套装）
        var bestSetId = null;
        var bestCount = 0;
        for (var sid in counts) {
            if (counts[sid] > bestCount) {
                bestCount = counts[sid];
                bestSetId = sid;
            }
        }
        if (!bestSetId) return { setId: null, pieceCount: 0, has2pc: false, has4pc: false };
        var sd = SET_DATA[bestSetId];
        if (!sd) return { setId: null, pieceCount: 0, has2pc: false, has4pc: false };
        // pieces 字段表示该套装的总件数分段 (2pc/4pc)
        var has2pc = bestCount >= 2;
        var has4pc = bestCount >= 4;
        return {
            setId: bestSetId,
            pieceCount: bestCount,
            has2pc: has2pc,
            has4pc: has4pc
        };
    },

    // 获取友方站位（1前3后阵型）- 更紧凑的布局
    getAllyPositions: function() {
        var w = this.battleWidth;
        var h = this.battleHeight;
        // ★ v7.5.6 加大间距，后排上下分散
        var frontX = w * 0.40;
        var backX = w * 0.20;
        var centerY = h * 0.42;
        var spacingY = h * 0.18;
        return [
            { x: frontX, y: centerY },                       // 前排（居中靠前）
            { x: backX, y: centerY - spacingY },             // 后排1（上）与中排间距加大
            { x: backX, y: centerY },                        // 后排2（中）
            { x: backX, y: centerY + spacingY }              // 后排3（下）
        ];
    },

    // 获取敌人位置 - 更紧凑的纵向间距
    getEnemyPosition: function(index) {
        var w = this.battleWidth;
        var h = this.battleHeight;
        // 前3后2排列，增加随机偏移避免堆叠
        var firstRow = Math.min(index, 2);
        var secondRow = index > 2 ? index - 3 : -1;
        var baseX = w * 0.68;
        var baseY = h * 0.30;
        var xOff = (Math.random() - 0.5) * 30;
        var yOff = (Math.random() - 0.5) * 20;
        if (index < 3) {
            return { x: baseX + firstRow * 45 + xOff, y: baseY + firstRow * h * 0.14 + yOff };
        } else {
            return { x: baseX + 25 + secondRow * 45 + xOff, y: baseY + h * 0.07 + secondRow * h * 0.14 + yOff };
        }
    },

    // 开始战斗
    startBattle: function() {
        if (this.isRunning) return;
        this.isRunning = true;
        this._passiveReviveCount = {};  // 重置复活计数器
        // 副本模式：使用 startDungeonBattle 已设置的参数，不要覆盖
        if (!this.isDungeon) {
            var levelIdx = ((this.waveNumber - 1) % 20) + 1;
            this.waveSpawnCount = this.calculateLevelMonsterCount(this.stage, levelIdx);
        }
        this.waveSpawned = 0;
        this.waveState = 'resting';
        this.restTimer = 1000;
        this.enemies = [];
        this.summons = [];   // v2.6.1: 召唤物列表（独立于 allies 和 enemies，独立 AI 攻击）
        this.spawnTimer = 0;
        // ★ v2.6.4 Round 6.1 防御: 重置 BOSS 标志 (startNewWave 也会重设, 但 startBattle 入口
        //   防御一次, 防止某些路径下 (玩家从 pause 直接 startBattle 跳 update 前) 残留 BOSS 怪)
        this.isBossWave = false;
        this.isEliteWave = false;
        this.elitesRemaining = 0;
        this.bossSpawnedThisWave = false;
        // spawnInterval 兜底 (爬塔 1000 改回 1500, 防御)
        this.spawnInterval = 1500;
        // ★ bannerMonsterIds 重置 (防止 BOSS 横幅跨场泄漏)
        this._bannerMonsterIds = {};
        var self = this;
        this.lastTime = performance.now();
        
        // 更新初始显示
        document.getElementById('wave-number').textContent = this.getLevelDisplay();
        document.getElementById('monster-count').textContent = '怪物: 0/' + this.waveSpawnCount;
        document.getElementById('wave-status').textContent = '准备中...';
        // 同步自动按钮文字
        if (typeof updateAutoButtonText === 'function') updateAutoButtonText();
        this.addBattleLog('战斗开始! 队伍已就绪', 'info');
        // ★ v3.0: 新手教程 — 检测战斗开始
        if (typeof checkTutorialTrigger === 'function' && !window._tutorialBattleFired) {
            window._tutorialBattleFired = true;
            setTimeout(function() { checkTutorialTrigger('battle_start_ch1'); }, 1500);
        }

        // 重置战斗统计数据
        this._battleStats = { damageDealt: 0, damageTaken: 0, kills: {}, healing: 0, startTime: performance.now() };

        // 记录战斗开始时间
        var battleStartTime = performance.now();
        for (var ai = 0; ai < this.allies.length; ai++) {
            this.allies[ai]._battleStartTime = battleStartTime;
        }

        function gameLoop(time) {
            // ★ v2.6.3 BUG#F 修复: update/render 必须包 try/catch,
            //   否则任何一处抛错都会中断 rAF 链,战斗卡死
            try {
                var dt = time - self.lastTime;
                self.lastTime = time;
                self.update(dt);
                self.render();
            } catch (e) {
                if (typeof console !== 'undefined' && console.error) {
                    console.error('[Battle] gameLoop frame 异常 (已吞,继续下一帧):', e);
                }
            }
            if (self.isRunning) {
                self.animFrame = requestAnimationFrame(gameLoop);
            }
        }
        this.animFrame = requestAnimationFrame(gameLoop);
    },

    // 停止战斗
    stopBattle: function() {
        this.isRunning = false;
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        // ★ v3.5.1 清空所有粒子/弹道/特效
        this.particles = [];
        this.projectiles = [];
        this.effects = [];
        // 清空 PixiFx 层（不清毁 canvas，只清除粒子/特效）
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            try { PixiFx.clearAll(); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
        }
        // 清除画布
        if (this.ctx && this.battleWidth > 0 && this.battleHeight > 0) {
            this.ctx.clearRect(0, 0, this.battleWidth, this.battleHeight);
        }
    },

    // 重置关卡（waveNumber可选，不传则从本章第1关开始）
    restartAtStage: function(stage, waveNumber) {
        this.stopBattle();
        // ★ 切换章节前同步最新角色属性
        this.syncAllyStats();
        this.stage = stage;
        if (waveNumber === undefined) {
            waveNumber = (stage - 1) * 20 + 1;
        }
        if (gameState) {
            GameState.set('stage', stage);
            GameState.set('wave', waveNumber);
        }
        this.waveNumber = waveNumber;
        var restartLevelIdx = ((waveNumber - 1) % 20) + 1;
        this.waveSpawnCount = this.calculateLevelMonsterCount(stage, restartLevelIdx);
        this.waveSpawned = 0;
        this.waveState = 'resting';
        this.restTimer = 1000;
        this.enemies = [];
        this.spawnTimer = 0;
        this.deathTimerInit = false;
        // ★ v2.6.4 BUG#H 修复: 重启关卡时清 BOSS/精英标志, 防止:
        //   - 爬塔 BOSS 失败 → exitDungeon (清一次) → resumeMainBattle → restartAtStage
        //     如果 restartAtStage 不重置,startNewWave 重新设 isBossWave 是 OK
        //     但 elitesRemaining 残留会让第一只生成的怪是精英 (在非精英关) 导致 BOSS 残留错觉
        this.isBossWave = false;
        this.isEliteWave = false;
        this.elitesRemaining = 0;
        // 重置友方HP/MP
        for (var i = 0; i < this.allies.length; i++) {
            var ally = this.allies[i];
            ally.alive = true;
            ally.hp = ally.maxHp;
            ally.mp = ally.maxMp;
            ally.atkTimer = 0;
            ally.skillCd = {};
            ally.buffs = [];
        }
        // 更新章节显示
        var stageName = getStageName(stage);
        var recPower = getRecommendedPower(stage);
        // v3.x 战力显示格式化（K/M/B 缩写）
        document.getElementById('stage-info').textContent = '第 ' + stage + ' 章 - ' + stageName + ' [推荐战力:' + (typeof formatNumber === 'function' ? formatNumber(recPower) : recPower) + ']';
        document.getElementById('wave-number').textContent = this.getLevelDisplay();
        document.getElementById('monster-count').textContent = '怪物: 0/' + this.waveSpawnCount;
        document.getElementById('wave-status').textContent = '准备开始...';
        this.addBattleLog('切换到 第' + stage + '章 - ' + stageName + ' (' + this.getLevelDisplay() + ')', 'info');
        this.startBattle();
    },

    // 更新战斗
    update: function(dt) {
        if (!this.isRunning) return;

        // ★ BUG#1 终极修复：主战场处于暂停状态（退出副本后），gameLoop 仍跑但不做任何推进
        // 玩家点"继续战斗"后才推进
        if (!this.isDungeon && this._mainBattlePaused) {
            // 仅让 render 保留一帧静止画面（不要动）
            return;
        }

        // 应用战斗速度倍率
        dt = dt * (this.speed || 1);
        // 累积游戏时长
        if (gameState) GameState.mutate('totalPlayTime', function(v) { return (v || 0) + dt; });

        // 检测全灭
        var aliveAllies = this.allies.filter(function(a) { return a.alive; });
        if (this._handleModeDeath(aliveAllies)) return;
        if (aliveAllies.length === 0) {
            if (!this.deathTimerInit) {
                this.addBattleLog('队伍全灭！重置关卡...', 'info');
                this.deathTimer = 10000;
                this.deathTimerInit = true;
                AudioManager.play('defeat');
                if (typeof AudioManager !== 'undefined' && AudioManager.playBGM) {
                    AudioManager.playBGM('defeat');
                }
                this.enemies = [];
                document.getElementById('monster-count').textContent = '怪物: 0/0';
            }
            this.deathTimer -= dt;
            document.getElementById('wave-status').textContent = '全灭！重置关卡... (' + Math.ceil(this.deathTimer / 1000) + 's)';
            if (this.deathTimer <= 0) {
                this.syncAllyStats();
                for (var i = 0; i < this.allies.length; i++) {
                    this.allies[i].alive = true;
                    this.allies[i].hp = this.allies[i].maxHp;
                    this.allies[i].mp = this.allies[i].maxMp;
                }
                this.deathTimerInit = false;
                this.enemies = [];
                if (this.summons) this.summons = [];
                this.projectiles = [];
                this.particles = [];
                this.effects = [];
                if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
                    try { PixiFx.clearAll(); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
                }
                this.waveState = 'active';
                this.startNewWave();
                this.addBattleLog('队伍复活！' + this.getLevelDisplay() + ' 重新开始', 'info');
            }
            return;
        } else {
            this.deathTimerInit = false;
        }

        // 魔王/副本计时器
        if (this._handleModeTimer(dt)) return;

        if (this.waveState === 'resting') {
            // 等待点击下一章时不推进
            if (this.waitingNextChapter) {
                document.getElementById('wave-status').textContent = '章节完成！点击[进入下一章]';
                return;
            }
            // 休息阶段：英雄回血回蓝
            this.restTimer -= dt;
            var regenPct = this.heroRegenPct * dt / this.restDuration;
            for (var i = 0; i < this.allies.length; i++) {
                var ally = this.allies[i];
                if (!ally.alive) continue;
                ally.hp = Math.min(ally.maxHp, ally.hp + Math.floor(ally.maxHp * regenPct));
                ally.mp = Math.min(ally.maxMp, ally.mp + Math.floor(ally.maxMp * regenPct));
            }
            document.getElementById('wave-status').textContent = '休息中... (' + Math.ceil(this.restTimer / 1000) + 's)';

            if (this.restTimer <= 0) {
                this.startNewWave();
            }
            return;
        }

        // 战斗阶段：生成敌人
        this.spawnTimer += dt;
        var aliveEnemies = this.enemies.filter(function(e) { return e.alive; });
        if (aliveEnemies.length < this.maxEnemies && this.waveSpawned < this.waveSpawnCount && this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        // 更新所有单位
        this.updateAllies(dt);
        // v2.6.1: 召唤物 AI（独立于 allies，独立攻击 + 到期消散）
        this.updateSummons(dt);
        this.updateEnemies(dt);
        // v2.6.1: 推进所有单位的程序化骨骼动画(idle/attack/hit/die/spawn)
        this.updateAllSkeletons(dt);
        // ★ v5.0: 套装效果每帧处理（护盾计时、狂暴计时等）
        this._processSetEffects(dt);

        // 检查波次是否完成（所有怪物已生成且全部死亡）
        if (this.waveSpawned >= this.waveSpawnCount) {
            if (this.enemies.filter(function(e) { return e.alive; }).length === 0) {
                // 波次完成，进入休息
                this.waveState = 'resting';
                this.restTimer = this.restDuration;
                this.onWaveComplete();
            }
        }

        // 更新动画状态
        this.updateAnimations(dt);
        // 更新状态效果
        this.updateStatusEffects(dt);
        // 更新特效
        this.updateEffects(dt);
    },

    // 计算关卡怪物数量（按章节递增：第1章10只，每章+2，最多50只）
    calculateLevelMonsterCount: function(stage, levelIdx) {
        var baseCount = Math.min(50, 10 + (stage - 1) * 2);
        if (stage >= 5) {
            // 第5章起每关+额外怪物（5-1: +1, 5-2: +2...）
            return Math.min(200, baseCount + (levelIdx || 1));
        }
        return baseCount;
    },

    // 计算当前关卡在章节内的序号（1-20）
    getLevelIndex: function() {
        return ((this.waveNumber - 1) % 20) + 1;
    },

    // 获取关卡显示名（1-1格式，每章20关）
    getLevelDisplay: function() {
        var stageIdx = Math.floor((this.waveNumber - 1) / 20) + 1;
        var levelIdx = ((this.waveNumber - 1) % 20) + 1;
        return stageIdx + '-' + levelIdx;
    },

    // 开始新一波
    startNewWave: function() {
        AudioManager.play('wave_start');
        this.waveState = 'active';
        this.waveSpawned = 0;
        this.waveSpawnCount = this.calculateLevelMonsterCount(this.stage);
        // ★ v2.6.4 BUG#J 治本: 每波 BOSS spawn dedup 计数器
        //   防止残留状态 (爬塔 BOSS 失败 / restartAtStage 等) 导致 5 个怪都被判 isLastSpawn=true
        this.bossSpawnedThisWave = false;
        var levelIdx = ((this.waveNumber - 1) % 20) + 1;
        // v2.6.2: 波次开始特效(中央光柱 + 4角金色粒子)
        this._playWaveStartEffect(this.waveNumber);
        // v2.6.2: 章节切换大特效(每 20 波 = 1 章)
        //   注意:此处 this.stage 还没更新,需要用新 waveNumber 算
        var newStage = Math.floor((this.waveNumber - 1) / 20) + 1;
        if (newStage > this.stage) {
            this._playChapterChangeEffect();
        }
        // ★ BUG#3b 修复：副本模式 BOSS/精英 更频繁出现
        // 副本中每 3 波出现 BOSS（最后一波必定 BOSS），每波都携精英怪
        if (this.isDungeon) {
            // 副本模式 BOSS：每 3 波 + 末波
            this.isBossWave = (this.waveNumber % 3 === 0) || (this.waveNumber === this.totalDungeonWaves);
            // 副本模式精英：每波都携
            this.isEliteWave = true;
        } else {
            // 野外模式：BOSS关=第10/20关，精英关=第5/15关（保持原有逻辑）
            this.isBossWave = (levelIdx === 10 || levelIdx === 20);
            this.isEliteWave = (levelIdx === 5 || levelIdx === 15);
        }
        // 精英怪数量
        if (this.isBossWave) {
            // BOSS关：最后一只出BOSS，其余为普通怪+精英
            this.elitesRemaining = Math.min(5, Math.floor(this.waveSpawnCount * 0.3));
        } else if (this.isEliteWave) {
            // 精英关：出1只精英怪
            this.elitesRemaining = 1;
        } else if (this.stage >= 2) {
            // 第2章起每关混入精英
            this.elitesRemaining = Math.max(1, Math.floor(this.waveSpawnCount * 0.15));
        } else {
            this.elitesRemaining = 0;
        }
        // ★ BUG#3b 强化：副本模式 精英数量提升 + 每波都有精英
        if (this.isDungeon && !this.isBossWave) {
            this.elitesRemaining = Math.max(2, Math.floor(this.waveSpawnCount * 0.25));
        }
        if (this.isDungeon && this.isBossWave) {
            // BOSS波：除了BOSS还有精英护航
            this.elitesRemaining = Math.max(2, Math.floor((this.waveSpawnCount - 1) * 0.3));
        }
        // 清空残留敌人
        this.enemies = [];
        this.spawnTimer = 0;
        // ★ bannerMonsterIds 重置 (每波允许 BOSS/精英横幅重新弹出)
        this._bannerMonsterIds = {};
        
        var display = this.getLevelDisplay();
        var waveTitle = display;
        if (this.isBossWave) {
            waveTitle = '⚔ BOSS ⚔ ' + display;
        } else if (this.isEliteWave) {
            waveTitle = '✦ 精英 ✦ ' + display;
        }
        document.getElementById('wave-number').textContent = waveTitle;
        
        // 构建状态描述
        var statusParts = ['战斗中... (' + this.waveSpawnCount + '只怪物)'];
        if (this.isBossWave) statusParts.push('[BOSS]');
        if (this.isEliteWave) statusParts.push('[精英]');
        if (this.elitesRemaining > 0) statusParts.push('[' + this.elitesRemaining + '精英]');
        document.getElementById('wave-status').textContent = statusParts.join(' ');
        this.addBattleLog('=== ' + waveTitle + ' (' + this.waveSpawnCount + '只怪物)' + (this.elitesRemaining > 0 ? ', ' + this.elitesRemaining + '精英' : '') + ' ===', 'info');

        // BGM 切换：BOSS 关用 boss 主题，其它用 battle 主题
        if (typeof AudioManager !== 'undefined' && AudioManager.playBGM) {
            AudioManager.playBGM(this.isBossWave ? 'boss' : 'battle');
        }

        // 同屏最大怪物数
        this.maxEnemies = Math.min(this.waveSpawnCount, 5);
        // ★ v3.5.1 新波次清空残余粒子/特效
        this.particles = [];
        this.projectiles = [];
        this.effects = [];
        // 清空 PixiFx 层
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            try { PixiFx.clearAll(); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
        }
    },

    // 生成敌人
    spawnEnemy: function() {
        var levelIdx = ((this.waveNumber - 1) % 20) + 1;
        var isLastSpawn = (this.waveSpawned + 1 >= this.waveSpawnCount);
        var isBossSpawn = false;
        var isEliteSpawn = false;

        // ★ 爬塔模式：根据楼层类型强制设置 isBoss / isElite
        //   10 的倍数 → BOSS, 5 的倍数 → 精英
        if (this.isTower && typeof getTowerFloorType === 'function') {
            var ft = getTowerFloorType(this.towerFloor);
            if (ft === 'boss') isBossSpawn = true;
            else if (ft === 'elite') isEliteSpawn = true;
        } else {
            // BOSS关最后一只一定是BOSS
            if (this.isBossWave && isLastSpawn && !this.bossSpawnedThisWave) {
                isBossSpawn = true;
                this.bossSpawnedThisWave = true;
            } else if (this.elitesRemaining > 0) {
                isEliteSpawn = true;
                this.elitesRemaining--;
            }
        }
        
        var monster = createMonsterInstance(this.stage, levelIdx, isBossSpawn, isEliteSpawn);
        var aliveEnemies = this.enemies.filter(function(e) { return e.alive; });
        var pos = this.getEnemyPosition(aliveEnemies.length);
        // ★ v7.5.5 防守：怪物生成时强制 alive=true，防止 sage 被动干扰
        var enemy = {
            id: 'enemy_' + Date.now(),
            name: monster.name,
            icon: monster.icon,
            x: pos.x,
            y: pos.y,
            // v2.6.1: 怪物骨架(简化 6 骨:body+head+双臂+双腿,带 idle/attack/hit/die/spawn 动画)
            skeleton: (typeof buildMonsterSkeleton === 'function')
                ? buildMonsterSkeleton(monster, { scale: 1 })
                : null,
            maxHp: monster.maxHp,
            hp: monster.hp,
            shieldHp: 0,
            shieldMax: 0,
            maxMp: Math.floor(monster.maxHp * 0.5),
            mp: Math.floor(monster.maxHp * 0.3),
            atk: monster.atk,
            def: monster.def,
            spd: monster.spd,
            exp: monster.exp,
            gold: monster.gold,
            isAlly: false,
            alive: true,
            target: null,
            elite: monster.elite || isEliteSpawn || isBossSpawn,
            isBoss: monster.isBoss || false,
            specialDesc: monster.specialDesc || '',
            targetX: pos.x - 30,
            targetY: pos.y,
            spawnTime: Date.now(),
            buffs: [],
            statusEffects: [],
            monsterSkills: monster.skills || [],
            skillCd: {},
            isFriend: monster.friend || false,
            // ★ HOME_5 联动：记录原版怪物 key（用于图鉴 + 家园展示联动）
            monsterKey: monster.id || monster.key || monster.name
        };
        // 副本模式：应用难度系数
        if (this.isDungeon && this.dungeonEnemyMult) {
            var mult = this.dungeonEnemyMult;
            enemy.maxHp = Math.floor(enemy.maxHp * mult);
            enemy.hp = enemy.maxHp;
            enemy.atk = Math.floor(enemy.atk * mult);
            enemy.def = Math.floor(enemy.def * mult);
            enemy.exp = 0;
            enemy.gold = 0;
        }
        this.enemies.push(enemy);
        this.waveSpawned++;

        // BOSS/精英出现日志 + 横幅
        if (enemy.isBoss) {
            this.addBattleLog('⚠️ BOSS出现: ' + enemy.name + ' HP:' + enemy.maxHp, 'boss');
            // ★ BUG#3b 修复：BOSS 出现弹横幅（包含网友怪物描述）
            this.showMonsterBanner(enemy);
            // v2.6.2: BOSS 出场大特效(红黑漩涡 + 警告粒子扩散)
            this._playBossEntranceEffect(enemy);
        } else if (enemy.elite) {
            this.addBattleLog('★ 精英出现: ' + enemy.name, 'boss');
            // ★ BUG#3b 修复：精英出现弹横幅（如果是网友怪物则展示描述）
            if (enemy.isFriend) this.showMonsterBanner(enemy);
            // v2.6.2: 精英出场中等特效(金环 + 紫粒子)
            this._playEliteEntranceEffect(enemy);
        }

        // ★ HOME_5 联动：玩家遇到原版怪物时同步到家园候选池
        //   - 原版怪物 (非 friend、非 elite/boss) 加入 gameState.unlockedMonsters
        //   - HomeSystem.start() 会读这个列表优先展示
        if (typeof HomeSystem !== 'undefined' && HomeSystem && typeof HomeSystem.notifyCodexUnlocked === 'function' && enemy.monsterKey) {
            HomeSystem.notifyCodexUnlocked(enemy.monsterKey);
        }

        var count = this.enemies.filter(function(e) { return e.alive; }).length;
        document.getElementById('monster-count').textContent = '怪物: ' + count + '/' + this.waveSpawnCount
    },

    // 更新友方
    updateAllies: function(dt) {
        for (var i = 0; i < this.allies.length; i++) {
            var ally = this.allies[i];
            if (!ally.alive) continue;

            // 状态效果更新
            this.updateUnitStatusEffects(ally, dt);

            // MP自动回复
            ally.mp = Math.min(ally.maxMp, ally.mp + (ally.mpRegen || 5) * dt / 1000);
            // 被动：圣光回复(divine_light) — v2.6.1 修复：原本只回自身, 现在按 desc 改全队
            //   遍历所有队友，对每个还活着的施加 1%/秒 的最大生命回复
            if (ally.passives) {
                var hasDivineLight = false;
                for (var pj = 0; pj < ally.passives.length; pj++) {
                    if (ally.passives[pj].regenPct) { hasDivineLight = true; break; }
                }
                if (hasDivineLight) {
                    var divineLightPct = 0;
                    for (var pk = 0; pk < ally.passives.length; pk++) {
                        if (ally.passives[pk].regenPct) { divineLightPct = ally.passives[pk].regenPct; break; }
                    }
                    for (var pti = 0; pti < this.allies.length; pti++) {
                        var pt = this.allies[pti];
                        if (!pt || !pt.alive) continue;
                        // 按目标自身 maxHp 计算（更公平，前排后排回血量比例相同）
                        var amt = Math.floor(pt.maxHp * divineLightPct * dt / 1000);
                        pt.hp = Math.min(pt.maxHp, pt.hp + amt);
                    }
                }
            }

            // 嘲讽计时衰退
            if (ally.tauntTimer > 0) {
                ally.tauntTimer -= dt;
                if (ally.tauntTimer < 0) ally.tauntTimer = 0;
            }

            // 检查控制效果（麻痹/冰冻阻止行动）
            var hasCC = false;
            if (ally.statusEffects) {
                for (var sci = 0; sci < ally.statusEffects.length; sci++) {
                    var se = ally.statusEffects[sci];
                    if (se.id === 'stun' || se.id === 'freeze') { hasCC = true; break; }
                }
            }
            if (hasCC) continue;

            // 选择目标（仇恨机制：优先攻击前排敌人）
            var frontEnemies = this.enemies.filter(function(e) { return e.alive; });
            if (frontEnemies.length === 0) continue;

            // 坦克优先攻击最近的敌人，后排优先攻击精英
            if (ally.role === 'tank') {
                ally.target = frontEnemies[0];
            } else {
                var elites = frontEnemies.filter(function(e) { return e.elite; });
                ally.target = elites.length > 0 ? elites[0] : frontEnemies[0];
            }

            // 自动攻击
            var atkSpeed = 1000 / (ally.spd / 100);
            ally.atkTimer = (ally.atkTimer || 0) + dt;
            if (ally.atkTimer >= atkSpeed) {
                ally.atkTimer = 0;
                this.doAttack(ally, ally.target);
            }

            // 技能释放（简单AI）
            this.tryCastSkill(ally, dt);
        }
    },

    // 更新敌人
    updateEnemies: function(dt) {
        for (var i = 0; i < this.enemies.length; i++) {
            var enemy = this.enemies[i];
            if (!enemy.alive) continue;

            // 状态效果更新
            this.updateUnitStatusEffects(enemy, dt);

            // 检查控制效果
            var hasCC = false;
            if (enemy.statusEffects) {
                for (var sci = 0; sci < enemy.statusEffects.length; sci++) {
                    var se = enemy.statusEffects[sci];
                    if (se.id === 'stun' || se.id === 'freeze') { hasCC = true; break; }
                }
            }

            // 敌人移动（基于delta-time，~30px/s）
            if (!hasCC && enemy.x > enemy.targetX) {
                enemy.x -= Math.min(enemy.x - enemy.targetX, 30 * dt / 1000);
            }

            // 选择目标（优先攻击被嘲讽的前排，否则取最近目标 allies + summons）
            //   v2.6.1: 召唤物也作为敌人可选目标（避免永远只打 allies 没人管 summon）
            var frontAllies = this.allies.filter(function(a) { return a.alive; });
            var aliveSummons = this.summons ? this.summons.filter(function(s) { return s.alive; }) : [];
            var candidates = frontAllies.concat(aliveSummons);
            if (candidates.length === 0) continue;
            var taunted = null;
            for (var tai = 0; tai < frontAllies.length; tai++) {
                if (frontAllies[tai].tauntTimer > 0) {
                    taunted = frontAllies[tai];
                    break;
                }
            }
            if (taunted) {
                enemy.target = taunted;
            } else {
                // 距离最近目标（召唤物位置靠前会被优先打）
                var bestTgt = frontAllies[0];
                var bestDist = Math.abs(bestTgt.x - enemy.x) + Math.abs(bestTgt.y - enemy.y);
                for (var cti = 1; cti < candidates.length; cti++) {
                    var ct = candidates[cti];
                    var d = Math.abs(ct.x - enemy.x) + Math.abs(ct.y - enemy.y);
                    if (d < bestDist) { bestDist = d; bestTgt = ct; }
                }
                enemy.target = bestTgt;
            }

            // 敌人技能释放
            this.tryCastEnemySkill(enemy, dt);

            // 攻击（被控制则不攻击）
            if (!hasCC) {
                var atkSpeed = 1500 / (enemy.spd / 50);
                enemy.atkTimer = (enemy.atkTimer || 0) + dt;
                if (enemy.atkTimer >= atkSpeed) {
                    enemy.atkTimer = 0;
                    // 敌人攻击动画
                    enemy.attackAnim = { progress: 0, duration: 150 };
                    enemy.target.hitFlash = 100;
                    // v2.6.1: 触发 PixiJS 程序化动画光环
                    if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
                        PixiFx.addUnitAttackAnim('enemy_' + enemy.id + '_' + Date.now(), enemy.x, enemy.y, '#ff4444', false, 180);
                        PixiFx.addUnitHurtAnim('ally_' + enemy.target.id + '_' + Date.now(), enemy.target.x, enemy.target.y, '#ff6666');
                    }
                    this.addEffect(enemy.target.x, enemy.target.y, 'hit', '#ff6666', 1);
                    this.addParticles(enemy.target.x, enemy.target.y, '#ff6666', 3);
                    // 计算伤害
                    // ★ BUG 修复：确保 enemy.atk / enemy.target.def 不为 undefined 避免 NaN 传播
                    var eAtk = enemy.atk || 0;
                    var tDef = enemy.target.def || 0;
                    var dmg = Math.max(1, eAtk - tDef);
                    // 被动：iron_wall 减伤 + mana_shield 法力转化
                    if (enemy.target.passives) {
                        for (var pl = 0; pl < enemy.target.passives.length; pl++) {
                            var tpas = enemy.target.passives[pl];
                            if (tpas.dmgReduction) dmg = Math.max(1, Math.floor(dmg * (1 - tpas.dmgReduction)));
                            if (tpas.dmgToMana) enemy.target.mp = Math.min(enemy.target.maxMp, enemy.target.mp + Math.floor(dmg * tpas.dmgToMana));
                        }
                    }
                    if (chance(0.1)) {
                        dmg = Math.floor(dmg * 1.5);
                        this.showDmgNum(enemy.target, dmg, true);
                    } else {
                        this.showDmgNum(enemy.target, dmg, false);
                    }
                    // 优先扣除白甲护盾
                    dmg = this._consumeShield(enemy.target, dmg);
                    enemy.target.hp -= dmg;
                    // ★ 召唤物死亡检查（enemy 攻击不会走 _dealDamage 的死亡逻辑）
                    if (enemy.target.isSummon && enemy.target.hp <= 0) {
                        enemy.target.alive = false;
                        enemy.target.hp = 0;
                        this.addEffect(enemy.target.x, enemy.target.y, 'buff', '#9c27b0', 0.8);
                        this.addParticles(enemy.target.x, enemy.target.y, '#ce93d8', 6);
                    }
                    // 战斗统计：追踪所受伤害
                    this._battleStats.damageTaken += dmg;

                    // ===== 套装效果：龙鳞套 — 伤害反弹 =====
                    if (enemy.target.isAlly && enemy.target._activeSetEffects && enemy.target._activeSetEffects.setId) {
                        var targetSe = enemy.target._activeSetEffects;
                        if (targetSe.setId === 'dragon_set' && targetSe.has4pc) {
                            var sd = SET_DATA.dragon_set;
                            var reflectChance = sd.bonus4.reflectChance || 0.25;
                            var reflectPct = sd.bonus4.reflectPct || 0.30;
                            if (chance(reflectChance)) {
                                var reflectDmg = Math.max(1, Math.floor(dmg * reflectPct));
                                enemy.hp -= reflectDmg;
                                // 红色反弹粒子特效
                                this.addParticles(enemy.target.x, enemy.target.y, '#ff1744', 8);
                                this.addEffect(enemy.x, enemy.y, 'hit', '#ff1744', 1.5);
                                this.addParticles(enemy.x, enemy.y, '#ff1744', 6);
                                this.showDmgNum(enemy, reflectDmg, false);
                                this.addBattleLog(enemy.target.name + ' [龙鳞套] 反弹 ' + reflectDmg + ' 伤害给 ' + enemy.name + '!', 'shield');
                                if (enemy.hp <= 0) {
                                    enemy.hp = 0;
                                    enemy.alive = false;
                                    AudioManager.play('kill');
                                }
                            }
                        }
                    }

                    if (enemy.target.hp <= 0) {
                        enemy.target.hp = 0;
                        enemy.target.alive = false;
                        AudioManager.play('death_hero');
                    }
                }
            }
        }

        // 清理死亡敌人（延迟移除）
        this.enemies = this.enemies.filter(function(e) {
            return e.alive || (Date.now() - e.spawnTime < 2000);
        });
    },

    // 扣除目标的护盾值，返回未被护盾吸收的剩余伤害
    // 护盾被击穿时不再会续报伤，且会刷新 shieldMax / shieldHp
    _consumeShield: function(target, dmg) {
        if (!target || target.shieldMax <= 0 || target.shieldHp <= 0 || dmg <= 0) return dmg;
        if (dmg <= target.shieldHp) {
            target.shieldHp -= dmg;
            return 0;
        }
        var absorbed = target.shieldHp;
        target.shieldHp = 0;
        // 护盾破裂特效
        this.addEffect(target.x, target.y, 'shield_break', '#ffffff', 0.8);
        this.addParticles(target.x, target.y, '#ffffff', 4);
        return dmg - absorbed;
    },

    // 执行攻击
    doAttack: function(attacker, target) {
        if (!target || !target.alive) return;

        // 攻击前冲动画
        attacker.attackAnim = { progress: 0, duration: 150 };
        // 目标受击闪烁
        // v2.6.1: 触发 PixiJS 程序化动画光环
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            var atkColor = attacker.isAlly ? '#4fc3f7' : '#ff4444';
            var tgtColor = attacker.isAlly ? '#ff6666' : '#4fc3f7';
            PixiFx.addUnitAttackAnim('atk_' + attacker.id + '_' + Date.now(), attacker.x, attacker.y, atkColor, attacker.isAlly, 180);
            PixiFx.addUnitHurtAnim('hit_' + target.id + '_' + Date.now(), target.x, target.y, tgtColor);
        }
        target.hitFlash = 100;

        // 暴击判定（封顶 100% — 防止天赋满级时 crit>100 概率溢出）
        var isCrit = chance(Math.min(1, attacker.crit / 100));
        var effectiveAtk = attacker.atk || 0;
        var effectiveCritDmg = attacker.critDmg || 150;
        // 被动加成
        if (attacker.passives) {
            for (var pk = 0; pk < attacker.passives.length; pk++) {
                var pas = attacker.passives[pk];
                if (pas.berserkAtk && attacker.hp / attacker.maxHp <= pas.berserkHp) effectiveAtk += Math.floor(attacker.atk * pas.berserkAtk);
                if (pas.finalCritDmg && attacker.hp / attacker.maxHp <= pas.finalHp) effectiveCritDmg += pas.finalCritDmg;
            }
        }
        var tgtDef = target.def || 0;
        var dmg = Math.max(1, effectiveAtk - tgtDef * 0.5);
        if (isCrit) {
            dmg = Math.floor(dmg * (effectiveCritDmg / 100));
        }
        dmg = Math.floor(dmg * (0.9 + Math.random() * 0.2));

        // 宝石伤害减免（目标）
        var reduct = (target.dmgReduction || 0);
        if (reduct > 0) {
            dmg = Math.floor(dmg * (1 - reduct / 100));
        }

        // ===== 套装效果：攻击方伤害加成 =====
        if (attacker.isAlly && attacker._activeSetEffects && attacker._activeSetEffects.setId) {
            var se = attacker._activeSetEffects;
            var sd = SET_DATA[se.setId];
            if (sd && se.has4pc) {
                // 狂战套：狂暴状态 +40% 伤害
                if (se.setId === 'berserker_set' && attacker._berserkerActive) {
                    var berserkDmgBonus = sd.bonus4.berserkDmgBonus || 0.40;
                    var bonusDmg = Math.floor(dmg * berserkDmgBonus);
                    dmg += bonusDmg;
                    // 红色狂暴粒子 (爆裂)
                    this.addParticles(attacker.x, attacker.y, '#ff4400', 4);
                    this.addEffect(target.x, target.y, 'slash', '#ff2200', 1.5);
                }
                // 暗影套：标记追击 — 目标被标记时额外50%伤害
                if (se.setId === 'shadow_assassin_set' && attacker._shadowMark === target.id) {
                    var markBonus = sd.bonus4.markBonusDmg || 0.50;
                    var markDmg = Math.floor(dmg * markBonus);
                    dmg += markDmg;
                    // 紫色标记追击特效
                    this.addParticles(target.x, target.y, '#9c27b0', 10);
                    this.addEffect(target.x, target.y, 'slash', '#9c27b0', 1.8);
                    this.addBattleLog(attacker.name + ' [暗影套] 追击标记! 额外 +' + markDmg + ' 伤害', 'crit');
                    // 消耗标记（一次性）
                    attacker._shadowMark = null;
                }
            }
        }

        // 命中特效
        var hitColor = isCrit ? '#ff5722' : '#fff';
        this.addEffect(target.x, target.y, isCrit ? 'slash' : 'hit', hitColor, isCrit ? 1.3 : 1);
        this.addParticles(target.x, target.y, hitColor, isCrit ? 10 : 5);
        AudioManager.play('hit');

        // ===== 套装效果：暗影套 — 暴击标记 =====
        if (isCrit && attacker.isAlly && attacker._activeSetEffects && attacker._activeSetEffects.setId) {
            var se = attacker._activeSetEffects;
            if (se.setId === 'shadow_assassin_set' && se.has4pc) {
                // 标记目标（覆盖旧标记）
                attacker._shadowMark = target.id;
                // 紫色标记粒子
                this.addParticles(target.x, target.y, '#7c4dff', 6);
                this.addEffect(target.x, target.y, 'buff', '#7c4dff', 1.2);
                this.addBattleLog(attacker.name + ' [暗影套] 标记了 ' + target.name + '!', 'debuff');
            }
        }

        // 优先扣除白甲护盾
        dmg = this._consumeShield(target, dmg);
        target.hp -= dmg;
        this.showDmgNum(target, dmg, isCrit);
        // 战斗统计：追踪伤害
        if (attacker.isAlly) {
            this._battleStats.damageDealt += dmg;
            // 成就追踪：累计总伤害
            GameState.mutate('totalDamageDealt', function(v) { return (v || 0) + dmg; });
            // 魔王副本：累积伤害
            if (this.isDungeon && this.dungeonType === 'demonking') {
                this.demonKingDamage = (this.demonKingDamage || 0) + dmg;
                // 无限血量保护
                if (target.hp < 1) target.hp = 1;
            }
        } else {
            this._battleStats.damageTaken += dmg;
        }

        if (target.hp <= 0) {
            // 魔王副本：魔王不死亡
            if (this.isDungeon && this.dungeonType === 'demonking') {
                target.hp = 1;
            } else {
            target.hp = 0;
            target.alive = false;
            if (!target.isAlly) {
                AudioManager.play('kill');
                // 击杀爆炸粒子
                this.addEffect(target.x, target.y, 'explosion', '#ff9800', 1.5);
                this.addParticles(target.x, target.y, '#ff5722', 15);
                var loot = generateBattleLoot(this.stage, 0);
                this.onMonsterKilled(target, loot, attacker);
                this.addBattleLog(attacker.name + ' 击败了 ' + target.name + (isCrit ? ' (暴击!)' : ''), 'death');

                // ===== 套装效果：星辰套 — 击杀回蓝 =====
                if (attacker.isAlly && attacker._activeSetEffects && attacker._activeSetEffects.setId) {
                    var se = attacker._activeSetEffects;
                    var sd = SET_DATA[se.setId];
                    if (sd && se.has4pc && se.setId === 'star_set') {
                        var manaPct = sd.bonus4.killManaPct || 0.15;
                        var manaRestore = Math.floor(attacker.maxMp * manaPct);
                        attacker.mp = Math.min(attacker.maxMp, attacker.mp + manaRestore);
                        // 蓝色火花粒子
                        this.addParticles(attacker.x, attacker.y, '#42a5f5', 10);
                        this.addEffect(attacker.x, attacker.y, 'buff', '#42a5f5', 1.3);
                        this.addBattleLog(attacker.name + ' [星辰套] 击杀恢复 ' + manaRestore + ' 法力!', 'skill');
                    }
                }
            }
            } // end else (not demonking)
        } else {
            this.addBattleLog(attacker.name + ' 对 ' + target.name + ' 造成 ' + dmg + ' 点伤害' + (isCrit ? ' (暴击!)' : ''), isCrit ? 'crit' : 'attack');
        }
    },

    // 技能AI释放
    // ★ v3.5.0 优化：全职业智能技能释放
    //    - buff 持续时间追踪，不重复释放已有增益
    //    - 所有 AI 判定改为确定性阈值（移除 Math.random()）
    //    - 每类技能按实际战场状态决定优先级
    tryCastSkill: function(ally, dt) {
        var clsData = getClassData(ally.classId);
        if (!clsData) return;
        var skills = clsData.skills || [];
        var now = Date.now();

        // 初始化 buff 追踪
        if (!ally._activeSkillBuffs) ally._activeSkillBuffs = {};
        // 清理过期 buff
        for (var bId in ally._activeSkillBuffs) {
            if (ally._activeSkillBuffs[bId] < now) delete ally._activeSkillBuffs[bId];
        }

        var aliveEnemies = this.enemies.filter(function(e) { return e.alive; });
        var aliveAllies = this.allies.filter(function(a) { return a.alive; });
        var aliveSummons = this.summons ? this.summons.filter(function(s) { return s.alive; }) : [];
        var enemyCount = aliveEnemies.length;

        // ★ 被动：贤者复活术 — 每回合自动触发（整块try-catch防止任何异常）
        try {
        if (!this._passiveReviveCount) this._passiveReviveCount = {};
        var sage = null;
        for (var si = 0; si < aliveAllies.length; si++) {
            if (aliveAllies[si].classId === 'sage') { sage = aliveAllies[si]; break; }
        }
        if (sage) {
            var sk = SKILL_DATA['resurrection'];
            var sl = (sage.skillLevels && sage.skillLevels['resurrection']) || 0;
            if (sl > 0 && sk) {
                var maxTriggers = sk.maxTriggersBase || 1;
                if (sl >= 20) maxTriggers = sk.maxTriggersLv20 || 3;
                else if (sl >= 10) maxTriggers = sk.maxTriggersLv10 || 2;
                var revKey = sage.id;
                if (!this._passiveReviveCount[revKey]) this._passiveReviveCount[revKey] = 0;
                
                if (this._passiveReviveCount[revKey] < maxTriggers) {
                    var deadAllies = this.allies.filter(function(a) { return !a.alive && a.id !== sage.id; });
                    if (deadAllies.length > 0) {
                        var target = deadAllies[0];
                        target.alive = true;
                        target.hp = Math.floor(target.maxHp * (sk.reviveHpPct || 0.3));
                        target.mp = Math.floor(target.maxMp * 0.3);
                        this._passiveReviveCount[revKey]++;
                        this.addBattleLog('✦ [被动] ' + sage.name + ' 的复活术触发！' + target.name + ' 复活了（' + target.hp + '/' + target.maxHp + ' HP）', 'reward');
                        this.addEffect(target.x, target.y, 'shield', '#ffd700', 1.5);
                        this.addEffect(target.x, target.y, 'shield', '#fff8e1', 1.0);
                        this.addParticles(target.x, target.y, '#ffd700', 12);
                        aliveAllies = this.allies.filter(function(a) { return a.alive; });
                    }
                }
            }
        }
        } catch(e) { if (typeof console !== 'undefined' && console.warn) console.warn('[Sage] 复活术异常:', e); }

        // 优先检查是否有人阵亡（复活术最高优先）
        var hasDeadAlly = false;
        for (var da = 0; da < this.allies.length; da++) {
            if (this.allies[da] && !this.allies[da].alive) { hasDeadAlly = true; break; }
        }

        // 判断当前战场态势
        var avgEnemyHpPct = 0;
        if (enemyCount > 0) {
            for (var ei = 0; ei < aliveEnemies.length; ei++) avgEnemyHpPct += aliveEnemies[ei].hp / aliveEnemies[ei].maxHp;
            avgEnemyHpPct /= enemyCount;
        }
        var allyHpPct = ally.hp / ally.maxHp;

        // 从前到后：先释放高优先级技能，每 tick 只放 1 个
        for (var s = 0; s < skills.length; s++) {
            var skillId = skills[s];
            var skill = SKILL_DATA[skillId];
            if (!skill || skill.type !== 'active') continue;

            // 冷却检查
            if (!ally.skillCd) ally.skillCd = {};
            var cdKey = skillId;
            ally.skillCd[cdKey] = (ally.skillCd[cdKey] || 0) + dt;
            var hero=null;var _es5_16=(GameState.get('heroes') || []);for(var _es5_17=0;_es5_17<_es5_16.length;_es5_17++){if(_es5_16[_es5_17].id === ally.id){hero=_es5_16[_es5_17];break;}};
            var skillLevel = (hero && hero.skillLevels) ? (hero.skillLevels[skillId] || 0) : 0;
            if (skillLevel === 0) continue; // 未加点不可用
            var actualCd = Math.max(0.5, skill.cd - skillLevel * 0.1);
            if (ally.skillCd[cdKey] < actualCd * 1000) continue;

            // MP 检查
            var mpCost = skill.mpCost || 0;
            if ((ally.mp || 0) < mpCost) continue;

            // ===== 技能释放判定 =====
            var shouldCast = false;
            var castReason = '';

            // 1. 自身治疗/护盾/buff（HP 阈值判定）
            if (skill.target === 'self') {
                // 是否 buff 类技能（护盾/减伤/增益/反击）
                var isSelfBuff = !!(skill.shieldPct || skill.dodgeNext || skill.lifeSteal || skill.defBuff ||
                                   skill.tauntDuration || skill.counterDmg || skill.poisonDmg);
                if (isSelfBuff) {
                    // 检查 buff 是否已激活
                    var buffActive = ally._activeSkillBuffs[skillId] && ally._activeSkillBuffs[skillId] > now;
                    if (!buffActive) {
                        // 坦克类使用 75% 阈值，其他职业 55%
                        var selfHpThreshold = (ally.classId === 'knight' || ally.classId === 'warrior') ? 0.8 : 0.55;
                        if (allyHpPct < selfHpThreshold) {
                            shouldCast = true;
                            castReason = '保命';
                        }
                    }
                }
            }
            // 2. 群体 buff/护盾（团队增益）
            if (skill.target === 'team') {
                var isTeamBuff = !!(skill.atkBuff || skill.defBuff || skill.shieldPct || skill.healPct || skill.dmgShare);
                if (isTeamBuff) {
                    var buffActive = ally._activeSkillBuffs[skillId] && ally._activeSkillBuffs[skillId] > now;
                    if (!buffActive) {
                        // 战斗开始优先放，或队友平均 HP < 75% 时放护盾/治疗
                        if (skill.healPct) {
                            var avgTeamHp = aliveAllies.reduce(function(s, a) { return s + a.hp / a.maxHp; }, 0) / Math.max(1, aliveAllies.length);
                            if (avgTeamHp < 0.75) { shouldCast = true; castReason = '群疗'; }
                        } else if (skill.shieldPct || skill.dmgShare) {
                            var avgTeamHp2 = aliveAllies.reduce(function(s, a) { return s + a.hp / a.maxHp; }, 0) / Math.max(1, aliveAllies.length);
                            if (avgTeamHp2 < 0.85 || enemyCount >= 2) { shouldCast = true; castReason = '群盾'; }
                        } else {
                            // 纯增益（战吼/祝福）— 战斗开始或 CD 转好就放
                            shouldCast = true;
                            castReason = '团队增益';
                        }
                    }
                }
            }
            // 3. 治疗队友（最低 HP 队友 < 阈值）
            if (skill.target === 'ally_lowest_hp') {
                var lowestHpAlly = null;
                var lowestHpPct = 1;
                for (var ai = 0; ai < aliveAllies.length; ai++) {
                    var hpPct = aliveAllies[ai].hp / aliveAllies[ai].maxHp;
                    if (hpPct < lowestHpPct) { lowestHpPct = hpPct; lowestHpAlly = aliveAllies[ai]; }
                }
                if (lowestHpAlly && lowestHpPct < 0.7) {
                    shouldCast = true;
                    castReason = '治疗';
                }
            }
            // 5. 召唤
            if (skill.target === 'summon') {
                // 场上召唤物少于 2 时释放
                if (aliveSummons.length < 2) {
                    shouldCast = true;
                    castReason = '召唤';
                }
            }
            // 6. 群体攻击
            if (skill.target === 'enemy_all') {
                if (enemyCount >= 2) {
                    shouldCast = true;
                    castReason = '群攻(' + enemyCount + '敌)';
                } else if (enemyCount === 1 && avgEnemyHpPct < 0.3) {
                    shouldCast = true;  // 残血时收尾
                    castReason = '收尾';
                }
            }
            // 7. 单体攻击 + debuff
            if (skill.target === 'enemy_single') {
                if (skill.aiPriority === 'elite_enemy') {
                    // 优先打精英/BOSS
                    var elite=null;var _es5_18=aliveEnemies;for(var _es5_19=0;_es5_19<_es5_18.length;_es5_19++){if(_es5_18[_es5_19].elite || _es5_18[_es5_19].boss){elite=_es5_18[_es5_19];break;}} if (!elite) elite = aliveEnemies[0];
                    if (elite) { shouldCast = true; castReason = '精英'; }
                } else if (skill.aiPriority === 'back_enemy') {
                    // 单攻 — 有敌人就放
                    if (enemyCount > 0) { shouldCast = true; castReason = '单攻'; }
                } else if (skill.aiPriority === 'front_enemy') {
                    // 默认单体
                    if (enemyCount > 0) { shouldCast = true; castReason = '攻击'; }
                } else {
                    // 含 debuff 的单体（如死亡标记）
                    if (enemyCount > 0) {
                        // 检查是否已有标记
                        var hasDebuff = false;
                        for (var edi = 0; edi < aliveEnemies.length; edi++) {
                            if (aliveEnemies[edi]._vulnDebuff && aliveEnemies[edi]._vulnDebuff > now) {
                                hasDebuff = true; break;
                            }
                        }
                        if (!hasDebuff) { shouldCast = true; castReason = '标记'; }
                    }
                }
            }
            // 8. 操控死敌
            if (skill.target === 'dead_enemy') {
                if (enemyCount > 0) { shouldCast = true; castReason = '操控'; }
            }

            if (!shouldCast) continue;

            // === 释放技能 ===
            ally.skillCd[cdKey] = 0;
            ally.mp -= mpCost;

            // 记录 buff 过期时间
            if (skill.duration) {
                ally._activeSkillBuffs[skillId] = now + skill.duration * 0.7; // 70% 时长后允许刷新
            }
            // 记录特殊 debuff
            if (skill.vulnDebuff && skill.duration) {
                // 找目标记录 debuff（在 castSkill 里处理）
            }

            this.showSkillName(ally, skill.name);
            this.castSkill(ally, skill);
            break; // 每 tick 只放 1 个技能
        }
    },

    // 评估技能AI（保留供 castSkill 等地方调用，主逻辑已内联到 tryCastSkill）
    evaluateSkillAI: function(skill, caster) {
        var priority = skill.aiPriority || 'front_enemy';
        switch (priority) {
            case 'start':
                return true; // 已由 tryCastSkill 的 buff 追踪处理
            case 'hp_low_self':
                return caster.hp / caster.maxHp < 0.65;
            case 'ally_low_hp':
                var lowAlly=null;var _es5_20=this.allies;for(var _es5_21=0;_es5_21<_es5_20.length;_es5_21++){if(_es5_20[_es5_21].alive && _es5_20[_es5_21].hp / _es5_20[_es5_21].maxHp < 0.75){lowAlly=_es5_20[_es5_21];break;}};
                return lowAlly !== undefined;
            case 'team_hp_low':
                var avgHp = this.allies.filter(function(a) { return a.alive; }).reduce(function(s, a) { return s + a.hp / a.maxHp; }, 0);
                var aliveCount = this.allies.filter(function(a) { return a.alive; }).length;
                return aliveCount > 0 && avgHp / aliveCount < 0.75;
            case 'elite_enemy':
                return this.enemies.some(function(e) { return e.alive && e.elite; });
            case 'enemy_dense':
                return this.enemies.filter(function(e) { return e.alive; }).length >= 3;
            case 'back_enemy':
                return this.enemies.filter(function(e) { return e.alive; }).length >= 2;
            case 'team_debuff':
                return Math.random() < 0.2;
            case 'dead_ally':
                for (var dai = 0; dai < this.allies.length; dai++) {
                    if (this.allies[dai] && !this.allies[dai].alive) return true;
                }
                return false;
            default:
                return this.enemies.some(function(e) { return e.alive; });
        }
    },

    // 释放技能
    castSkill: function(caster, skill) {
        var target = null;
        switch (skill.target) {
            case 'dead_ally':
                // 复活阵亡队友（贤者复活术）
                var deadAlly = null;
                for (var di = 0; di < this.allies.length; di++) {
                    if (this.allies[di] && !this.allies[di].alive) {
                        deadAlly = this.allies[di];
                        break;
                    }
                }
                if (!deadAlly) return;
                var revivePct = skill.reviveHpPct || 0.5;
                deadAlly.alive = true;
                deadAlly.hp = Math.floor(deadAlly.maxHp * revivePct);
                deadAlly.mp = Math.floor(deadAlly.maxMp * 0.3);
                deadAlly.statusEffects = [];
                deadAlly.buffs = [];
                deadAlly.tauntTimer = 0;
                deadAlly.atkTimer = 0;
                deadAlly.skillCd = {};
                // 复活特效（金色光环 + 上升粒子）
                this.addEffect(deadAlly.x, deadAlly.y, 'heal', '#ffd700', 1.5);
                this.addEffect(deadAlly.x, deadAlly.y, 'buff', '#ffe066', 1.2);
                this.addParticles(deadAlly.x, deadAlly.y, '#ffd700', 12);
                caster.skillFlash = 300;
                this.addBattleLog('✦ ' + caster.name + ' 使用 ' + skill.name + '，' + deadAlly.name + ' 复活了！', 'reward');
                // 复活后显示绿色HP数字
                this.showDmgNum(deadAlly, deadAlly.hp, false, true);
                break;
            case 'enemy_single':
            case 'enemy_all':
                var aliveEnemies = this.enemies.filter(function(e) { return e.alive; });
                if (aliveEnemies.length === 0) return;
                this.addBattleLog(caster.name + ' 释放 ' + skill.name + ' 攻击 ' + (skill.target === 'enemy_all' ? '全体敌人' : ''), 'info');
                if (skill.target === 'enemy_all') {
                    for (var i = 0; i < aliveEnemies.length; i++) {
                        this._launchSkillProjectile(caster, aliveEnemies[i], skill);
                        this.doSkillDamage(caster, aliveEnemies[i], skill);
                        this._applySkillStatusEffect(caster, aliveEnemies[i], skill);
                    }
                    return;
                }
                var elites = aliveEnemies.filter(function(e) { return e.elite; });
                target = elites.length > 0 ? elites[0] : aliveEnemies[0];
                this._launchSkillProjectile(caster, target, skill);
                this.doSkillDamage(caster, target, skill);
                this._applySkillStatusEffect(caster, target, skill);
                break;
            case 'ally_lowest_hp':
                var lowest = null;
                var lowestHp = 1;
                for (var i = 0; i < this.allies.length; i++) {
                    var a = this.allies[i];
                    if (!a.alive) continue;
                    var hpPct = a.hp / a.maxHp;
                    if (hpPct < lowestHp) {
                        lowestHp = hpPct;
                        lowest = a;
                    }
                }
                if (lowest) {
                    // v3.x 平衡调整：healStat 决定治疗基准
                    //   'atk'    (旧): 治疗量 = healMult × caster.atk
                    //   'maxHp'  (新): 治疗量 = healMult × 目标.maxHp   — 让治疗量稳定不依赖 atk 堆叠
                    // v2.6.1: 补 healBonus 与 healRate 叠加（gear affix + 圣恩 passive 都加到 stats.healBonus）
                    var healMult = (skill.healMult || 1) * (1 + ((caster.healRate || 0) + (caster.healBonus || 0)) / 100);
                    var healAmt;
                    if (skill.healStat === 'maxHp') {
                        healAmt = Math.floor(healMult * (lowest.maxHp || 0));
                    } else {
                        healAmt = Math.floor(healMult * (caster.atk || 100));
                    }
                    lowest.hp = Math.min(lowest.maxHp, lowest.hp + healAmt);
                    this.showDmgNum(lowest, healAmt, false, true);
                    // 战斗统计：追踪治疗量
                    this._battleStats.healing += healAmt;
                    this.addBattleLog(caster.name + ' 释放 ' + skill.name + '，为 ' + lowest.name + ' 恢复 ' + healAmt + ' 点生命', 'reward');
                    // 治疗特效
                    this.addEffect(lowest.x, lowest.y, 'heal', '#4caf50', 1.2);
                    this.addParticles(lowest.x, lowest.y, '#66ff66', 8);
                    // 施加缓慢回血效果
                    this.applyStatusEffect(lowest, 'regen', caster, 5000, 0.8);
                    caster.skillFlash = 200;
                }
                break;
            case 'self':
            case 'team':
                // 增益/护盾效果
                caster.skillFlash = 200;
                if (skill.shieldPct) {
                    // 护盾值 = 骑士自身当前最大生命 × 百分比（仅取新值替换，不叠加）
                    var shieldAmt = Math.floor((caster.maxHp || 0) * skill.shieldPct);
                    var shieldDuration = skill.duration || 5000;
                    var shieldTargets = skill.target === 'team' ? this.allies.filter(function(a) { return a.alive; }) : [caster];
                    for (var sti = 0; sti < shieldTargets.length; sti++) {
                        var st = shieldTargets[sti];
                        // 覆盖在 HP 之上的独立白甲：取新值替换
                        st.shieldMax = shieldAmt;
                        st.shieldHp = shieldAmt;
                        this.showDmgNum(st, shieldAmt, false, true, '#ffffff');
                        this.applyStatusEffect(st, 'shield', caster, shieldDuration, 1.0);
                    }
                    if (shieldTargets.length > 1) {
                        this.addBattleLog(caster.name + ' 释放 ' + skill.name + '，全队获得 ' + shieldAmt + ' 点白甲护盾（5秒）', 'info');
                    } else {
                        this.addBattleLog(caster.name + ' 释放 ' + skill.name + '，获得 ' + shieldAmt + ' 点白甲护盾（5秒）', 'info');
                    }
                    this.addEffect(caster.x, caster.y, 'shield', '#ffffff', 1);
                    this.addParticles(caster.x, caster.y, '#ffffff', 6);
                }
                if (skill.healPct) {
                    // v2.6.1: 全员治愈也吃 healRate + healBonus 加成（与单目标治愈一致）
                    var healPctMult = 1 + ((caster.healRate || 0) + (caster.healBonus || 0)) / 100;
                    var realHealPct = skill.healPct * healPctMult;
                    // v2.6.1: dark_pact 牺牲召唤物 — 杀死本 caster 的召唤, 然后大幅治疗
                    var sacrificed = false;
                    if (skill.id === 'dark_pact' && this.summons) {
                        for (var dsi = this.summons.length - 1; dsi >= 0; dsi--) {
                            if (this.summons[dsi].casterId === caster.id && this.summons[dsi].alive) {
                                var dyingSummon = this.summons[dsi];
                                this.addEffect(dyingSummon.x, dyingSummon.y, 'explosion', '#aa66ff', 1.2);
                                this.addParticles(dyingSummon.x, dyingSummon.y, '#9c27b0', 14);
                                this.addBattleLog('\u{1F480} ' + caster.name + ' 牺牲了 ' + dyingSummon.name, 'warning');
                                dyingSummon.alive = false;
                                sacrificed = true;
                                break;
                            }
                        }
                    }
                    var healLogPct = sacrificed ? realHealPct * 2 : realHealPct;  // 牺牲后治疗量翻倍（视觉反馈）
                    this.addBattleLog(caster.name + ' 释放 ' + skill.name + '，全员恢复 ' + Math.floor(healLogPct * 100) + '% 生命', 'reward');
                    for (var i = 0; i < this.allies.length; i++) {
                        if (this.allies[i].alive) {
                            var heal = Math.floor(this.allies[i].maxHp * healLogPct);
                            this.allies[i].hp = Math.min(this.allies[i].maxHp, this.allies[i].hp + heal);
                            this.showDmgNum(this.allies[i], heal, false, true);
                            // 战斗统计：追踪治疗量
                            this._battleStats.healing += heal;
                            this.addEffect(this.allies[i].x, this.allies[i].y, 'heal', '#4caf50', 0.8);
                            if (skill.healPct >= 0.15) {
                                this.applyStatusEffect(this.allies[i], 'regen', caster, 4000, 0.6);
                            }
                        }
                    }
                }
                if (skill.atkBuff || skill.defBuff) {
                    var buffNames = [];
                    if (skill.atkBuff) buffNames.push('攻击提升');
                    if (skill.defBuff) buffNames.push('防御提升');
                    this.addBattleLog(caster.name + ' 释放 ' + skill.name + '，全员获得 ' + buffNames.join('+') + ' 效果！', 'info');
                    for (var i = 0; i < this.allies.length; i++) {
                        if (this.allies[i].alive) {
                            this.addEffect(this.allies[i].x, this.allies[i].y, 'buff', '#ffd700', 0.8);
                            if (skill.atkBuff) {
                                this.applyStatusEffect(this.allies[i], 'atk_up', caster, skill.duration || 6000, 0.9);
                            }
                            if (skill.defBuff) {
                                this.applyStatusEffect(this.allies[i], 'def_up', caster, skill.duration || 6000, 0.9);
                            }
                        }
                    }
                }
                // 嘲讽效果：给施法者添加嘲讽标记，强制敌人攻击自己
                if (skill.tauntDuration) {
                    caster.tauntTimer = skill.tauntDuration;
                    this.addBattleLog('\u{1F6E1} ' + caster.name + ' 释放 ' + skill.name + '，强制敌人攻击自己 ' + (skill.tauntDuration / 1000).toFixed(0) + ' 秒！', 'warning');
                    this.addEffect(caster.x, caster.y, 'buff', '#ff4444', 1.2);
                    this.addParticles(caster.x, caster.y, '#ff4444', 10);
                    this.applyStatusEffect(caster, 'taunt', caster, skill.tauntDuration, 1.0);
                }
                break;
            // ★ v2.6.1: 召唤师技能 — 生成/替换召唤物
            case 'summon':
                this._spawnSummon(caster, skill);
                break;
        }
    },

    // ★ v2.6.1: 召唤物生成（每个 caster 同时只保留 1 只, 再召替换旧）
    _spawnSummon: function(caster, skill) {
        if (!this.summons) this.summons = [];
        // 1. 同 caster 已有召唤 → 移除旧的
        for (var oi = this.summons.length - 1; oi >= 0; oi--) {
            if (this.summons[oi].casterId === caster.id) {
                this.addEffect(this.summons[oi].x, this.summons[oi].y, 'buff', '#9c27b0', 0.8);
                this.summons.splice(oi, 1);
            }
        }
        // 2. 按 skill.id 决定召唤物类型
        var summonName, summonType, spriteKey;
        if (skill.id === 'summon_wolf')      { summonName = '灵狼';       summonType = 'wolf';       spriteKey = 'wolf_summon'; }
        else if (skill.id === 'summon_phoenix')  { summonName = '凤凰';       summonType = 'phoenix';    spriteKey = 'phoenix_summon'; }
        else if (skill.id === 'summon_elemental'){ summonName = '元素精灵';   summonType = 'elemental';  spriteKey = 'elemental_summon'; }
        else                                       { summonName = '召唤物';     summonType = 'generic';    spriteKey = ''; }
        // 3. 计算属性（summonAtk% × caster.atk, 含 summonAtkBonus passive 加成）
        var summonAtkMult = (skill.summonAtk || 0.5) * (1 + (caster.summonAtkBonus || 0));
        var summonHpMult  = (skill.summonHp  || 0.6);
        var summonAtk = Math.max(1, Math.floor((caster.atk || 100) * summonAtkMult));
        var summonMaxHp = Math.max(50, Math.floor((caster.maxHp || 200) * summonHpMult));
        // 4. 召唤位置（前排上下位，与中排错开避免重叠）
        var w = this.battleWidth || 600;
        var h = this.battleHeight || 400;
        var usedSpots = {};
        for (var oi = 0; oi < this.summons.length; oi++) {
            if (this.summons[oi].alive) usedSpots[this.summons[oi]._spot] = true;
        }
        var spots = ['top', 'bottom'];
        var spot = spots[0];
        for (var sp = 0; sp < spots.length; sp++) {
            if (!usedSpots[spots[sp]]) { spot = spots[sp]; break; }
            if (sp === spots.length - 1) spot = spots[this.summons.length % 2];
        }
        var frontX = w * 0.35;
        var spawnX = frontX + (Math.random() - 0.5) * 10;
        var spawnY = spot === 'top' ? h * 0.30 : h * 0.60;
        summon._spot = spot;
        // 5. 创建召唤物
        var summon = {
            id: spriteKey + '_' + Date.now(),
            name: summonName,
            type: summonType,
            spriteKey: spriteKey,
            x: spawnX,
            y: spawnY,
            // v2.6.1: 召唤物骨架(简化 6 骨,带紫色 idle/attack/hit/die/spawn 动画)
            skeleton: (typeof buildSummonSkeleton === 'function')
                ? buildSummonSkeleton({ type: summonType }, { scale: 0.9 })
                : null,
            spawnX: spawnX,
            spawnY: spawnY,
            hp: summonMaxHp,
            maxHp: summonMaxHp,
            atk: summonAtk,
            def: Math.floor((caster.def || 0) * 0.5),
            spd: caster.spd || 100,
            alive: true,
            isSummon: true,
            casterId: caster.id,
            casterName: caster.name,
            target: null,
            atkTimer: 0,
            atkInterval: 1800,   // 召唤物攻速（比 allies 慢，因为是额外单位）
            isAlly: true,        // 视为友方（不互相攻击）
            aoe: !!skill.aoe,    // phoenix / elemental 是 AOE
            // 召唤物天生携带生命值/攻击力享受 caster 的部分加成
            hitFlash: 0,
            skillFlash: 300,     // 入场闪光
            attackAnim: null,
            statusEffects: [],
            buffs: [],
            expiresAt: 0,        // 0 = 永久；>0 = 到期时间戳（ms）
            summonName: summonName
        };
        // 凤凰 / 元素精灵带持续时间
        if (skill.id === 'summon_phoenix')   summon.expiresAt = Date.now() + 15000;
        if (skill.id === 'summon_elemental') summon.expiresAt = Date.now() + 20000;
        // 召唤师自身召唤永久（summon_wolf 默认永久，dark_pact 可牺牲）
        this.summons.push(summon);
        // v2.6.1: 标记新生成,触发 spawn 动画
        summon._justSpawned = true;
        summon._spawnAnimTime = 0;
        // 6. 视觉/日志反馈
        caster.skillFlash = 300;
        this.addEffect(spawnX, spawnY, 'buff', '#9c27b0', 1.2);
        this.addParticles(spawnX, spawnY, '#ce93d8', 12);
        // v2.6.1: 召唤物出场光环（彩色环 + 粒子爆发）
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            PixiFx.addSpawnAura(spawnX, spawnY, '#ce93d8');
        }
        this.addBattleLog('\u2728 ' + caster.name + ' 召唤了 ' + summonName + '（ATK:' + summonAtk + ' HP:' + summonMaxHp + '）', 'reward');
        AudioManager.play('skill');
    },

    // ★ v2.6.1: 召唤物 AI 更新（独立 loop, 类似 allies 但更简单：自动找最近敌人并攻击）
    updateSummons: function(dt) {
        if (!this.summons || this.summons.length === 0) return;
        for (var i = this.summons.length - 1; i >= 0; i--) {
            var s = this.summons[i];
            if (!s.alive) { this.summons.splice(i, 1); continue; }
            // 到期销毁（phoenix / elemental）
            if (s.expiresAt > 0 && Date.now() >= s.expiresAt) {
                this.addEffect(s.x, s.y, 'buff', '#fff', 1.0);
                this.addParticles(s.x, s.y, '#ffeb3b', 8);
                this.addBattleLog(s.name + ' 到期消散了', 'info');
                s.alive = false;
                continue;
            }
            // 状态效果更新（如果有）
            if (s.statusEffects && s.statusEffects.length > 0) {
                this.updateUnitStatusEffects(s, dt);
            }
            // 闪烁衰减
            if (s.hitFlash > 0) s.hitFlash = Math.max(0, s.hitFlash - dt);
            if (s.skillFlash > 0) s.skillFlash = Math.max(0, s.skillFlash - dt);
            // 找最近存活敌人
            var nearest = null;
            var nearestDist = Infinity;
            for (var ei = 0; ei < this.enemies.length; ei++) {
                var e = this.enemies[ei];
                if (!e || !e.alive) continue;
                var d = Math.abs(e.x - s.x) + Math.abs(e.y - s.y);
                if (d < nearestDist) { nearestDist = d; nearest = e; }
            }
            if (!nearest) continue;  // 没有敌人, 待机
            s.target = nearest;
            // 攻击计时
            s.atkTimer = (s.atkTimer || 0) + dt;
            if (s.atkTimer >= s.atkInterval) {
                s.atkTimer = 0;
                // 攻击动画（前冲 100ms）
                s.attackAnim = { progress: 0, duration: 150 };
                // v2.6.1: 召唤物攻击光环
                if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
                    PixiFx.addUnitAttackAnim('summon_atk_' + s.id + '_' + Date.now(), s.x, s.y, s.type === 'phoenix' ? '#ff5722' : '#ce93d8', true, 160);
                }
                // 伤害计算
                if (s.aoe) {
                    // AOE: 对所有存活敌人造成伤害
                    for (var ai = 0; ai < this.enemies.length; ai++) {
                        var ae = this.enemies[ai];
                        if (!ae || !ae.alive) continue;
                        this._summonHitEnemy(s, ae);
                    }
                    // AOE 特效
                    this.addEffect(s.x, s.y, 'explosion', s.type === 'phoenix' ? '#ff5722' : '#ce93d8', 1.0);
                } else {
                    // 单体: 灵狼
                    this._summonHitEnemy(s, nearest);
                }
                // 弹道 / 命中特效
                this.addEffect(nearest.x, nearest.y, 'hit', '#ff8800', 0.8);
                this.addParticles(nearest.x, nearest.y, '#ff8800', 4);
                AudioManager.play('hit');
            }
        }
    },

    // 召唤物命中敌人
    _summonHitEnemy: function(summon, enemy) {
        var dmg = Math.max(1, summon.atk - Math.floor((enemy.def || 0) * 0.4));
        enemy.hp -= dmg;
        enemy.hitFlash = 80;
        this.showDmgNum(enemy, dmg, false);
        if (enemy.hp <= 0) {
            enemy.hp = 0;
            enemy.alive = false;
            AudioManager.play('death_enemy');
        }
    },

    // ★ v2.6.1: 渲染召唤物（在 enemies 和 allies 之间）
    drawSummons: function(ctx) {
        if (!this.summons) return;
        for (var i = 0; i < this.summons.length; i++) {
            var s = this.summons[i];
            if (!s.alive) continue;
            // 复用 drawUnit 的渲染逻辑（血条/名字/受击闪烁），但走 isAlly=true 颜色
            this.drawUnit(ctx, s, '#ce93d8', true);
            // 召唤物专属: 紫色光环 + 名字前加"✦"
            var x = s.x, y = s.y;
            var r = 18;
            var t = Date.now() / 500;
            ctx.strokeStyle = 'rgba(206,147,216,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y - 6, r + 4 + Math.sin(t) * 2, 0, Math.PI * 2);
            ctx.stroke();
            // 名字前缀
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = '#ce93d8';
            ctx.fillText('\u2726 ' + s.name, x, y - r - 18);
            // 到期倒计时（phoenix / elemental）
            if (s.expiresAt > 0) {
                var left = Math.max(0, s.expiresAt - Date.now());
                ctx.font = 'bold 8px sans-serif';
                ctx.fillStyle = left < 3000 ? '#ff5722' : '#fff';
                ctx.fillText(Math.ceil(left / 1000) + 's', x, y + r + 16);
            }
        }
    },

    // 发射技能弹道（按技能ID精确匹配弹道类型和颜色）
    _launchSkillProjectile: function(caster, target, skill) {
        if (!caster || !target) return;
        var skillId = skill.id || '';
        // 精确按技能ID匹配弹道类型（每种技能独特的弹道表现）
        switch (skillId) {
            // 法师 - 火系
            case 'fireball':
                this.addProjectile(caster, target, 'fireball', '#ff6600');
                break;
            case 'meteor_storm':
                this.addProjectile(caster, target, 'meteor_storm', '#ff4400');
                break;
            // 法师 - 冰系
            case 'frost_nova':
                this.addProjectile(caster, target, 'frost_nova', '#4fc3f7');
                break;
            // 法师 - 奥术
            case 'arcane_blast':
                this.addProjectile(caster, target, 'arcane_blast', '#bb86fc');
                break;
            // 刺客
            case 'backstab':
                this.addProjectile(caster, target, 'shadow_blade', '#4a148c');
                break;
            case 'death_mark':
                this.addProjectile(caster, target, 'mark_x', '#c62828');
                // 记录易伤 debuff 到目标（供 tryCastSkill 复用检测 + 伤害放大）
                if (target && target.alive) {
                    target._vulnDebuff = Date.now() + (skill.duration || 8000);
                }
                break;
            case 'fan_of_knives':
                this.addProjectile(caster, target, 'fan_knives', '#b0bec5');
                break;
            // 战士
            case 'whirlwind':
                this.addProjectile(caster, target, 'whirlwind', '#ffaa44');
                break;
            case 'charge':
                this.addProjectile(caster, target, 'charge_burst', '#d32f2f');
                break;
            case 'earthquake':
                this.addProjectile(caster, target, 'earth_crack', '#795548');
                break;
            // 亡灵法师
            case 'death_bolt':
                this.addProjectile(caster, target, 'dark_bolt', '#9c27b0');
                break;
            case 'soul_drain':
                this.addProjectile(caster, target, 'soul_drain', '#7b1fa2');
                break;
            case 'soul_storm':
                this.addProjectile(caster, target, 'soul_storm', '#6a1b9a');
                break;
            case 'curse':
                this.addProjectile(caster, target, 'curse_wave', '#4a148c');
                break;
            case 'raise_dead':
                this.addProjectile(caster, target, 'death_scythe', '#37474f');
                break;
            // 骑士
            case 'shield_bash':
                this.addProjectile(caster, target, 'shield_aura', '#4fc3f7');
                break;
            // 剑客
            case 'sword_dance':
                this.addProjectile(caster, target, 'multi_slash', '#e0e0e0');
                break;
            case 'quick_slash':
                this.addProjectile(caster, target, 'blade_slash', '#bbdefb');
                break;
            case 'heavenly_slash':
                this.addProjectile(caster, target, 'blade_slash', '#90caf9');
                break;
            default:
                // 未识别的攻击型技能，使用默认火球
                this.addProjectile(caster, target, 'fireball', '#ff6600');
                break;
        }
    },

    // 应用技能附带状态效果
    _applySkillStatusEffect: function(caster, target, skill) {
        if (!target || !target.alive) return;
        var skillId = skill.id || '';
        // 火焰技能 → 灼烧
        if (skillId.indexOf('fireball') !== -1 || skillId.indexOf('fire') !== -1 || skillId.indexOf('meteor') !== -1) {
            this.applyStatusEffect(target, 'burn', caster, 4000, 0.4);
        }
        // 冰霜技能 → 冰冻或减速
        if (skillId.indexOf('frost') !== -1 || skillId.indexOf('nova') !== -1 || skillId.indexOf('ice') !== -1) {
            this.applyStatusEffect(target, 'freeze', caster, 2000, 0.3);
            var hasFreeze = (target.statusEffects || []).some(function(e) { return e.id === 'freeze'; });
            if (!hasFreeze) {
                this.applyStatusEffect(target, 'slow', caster, 3000, 0.4);
            }
        }
        // 奥术/电弧 → 感电
        if (skillId.indexOf('arcane') !== -1 || skillId.indexOf('shock') !== -1 || skillId.indexOf('blast') !== -1) {
            this.applyStatusEffect(target, 'shock', caster, 4000, 0.35);
        }
        // 暗影/诅咒 → 攻击降低/防御降低
        if (skillId.indexOf('death') !== -1 || skillId.indexOf('soul') !== -1 || skillId.indexOf('dark') !== -1 || skillId.indexOf('curse') !== -1) {
            if (skill.target === 'enemy_all') {
                this.applyStatusEffect(target, 'atk_debuff', caster, 5000, 0.5);
                this.applyStatusEffect(target, 'def_debuff', caster, 5000, 0.5);
            } else {
                this.applyStatusEffect(target, 'atk_debuff', caster, 5000, 0.4);
            }
        }
        // 冲锋 → 眩晕
        if (skillId.indexOf('charge') !== -1) {
            this.applyStatusEffect(target, 'stun', caster, 1500, 0.5);
        }
        // 地震 → 眩晕
        if (skillId.indexOf('earthquake') !== -1) {
            this.applyStatusEffect(target, 'stun', caster, 1000, 0.4);
        }
        // 毒素技能
        if (skillId.indexOf('poison') !== -1) {
            this.applyStatusEffect(target, 'poison', caster, 5000, 0.5);
        }
    },

    // 技能伤害
    doSkillDamage: function(caster, target, skill) {
        if (!target || !target.alive) return;

        // 技能特效：按技能ID精确匹配效果类型（每种技能独特表现）
        var skillId = skill.id || '';
        var effType = 'explosion';
        var effColor = '#ff6600';
        switch (skillId) {
            // 法师 - 火系
            case 'fireball':
                effType = 'explosion'; effColor = '#ff6600'; break;
            case 'meteor_storm':
                effType = 'explosion'; effColor = '#ff4400'; break;
            // 法师 - 冰系
            case 'frost_nova':
                effType = 'nova'; effColor = '#4fc3f7'; break;
            // 法师 - 奥术
            case 'arcane_blast':
                effType = 'explosion'; effColor = '#bb86fc'; break;
            // 刺客
            case 'backstab':
                effType = 'slash'; effColor = '#4a148c'; break;
            case 'poison_blade':
                effType = 'buff'; effColor = '#76ff03'; break;
            case 'shadow_step':
                effType = 'buff'; effColor = '#9c27b0'; break;
            case 'death_mark':
                effType = 'hit'; effColor = '#c62828'; break;
            case 'fan_of_knives':
                effType = 'slash'; effColor = '#b0bec5'; break;
            // 战士
            case 'whirlwind':
                effType = 'slash'; effColor = '#ffaa44'; break;
            case 'blood_thirst':
                effType = 'buff'; effColor = '#d32f2f'; break;
            case 'charge':
                effType = 'explosion'; effColor = '#d32f2f'; break;
            case 'earthquake':
                effType = 'explosion'; effColor = '#795548'; break;
            // 亡灵法师
            case 'death_bolt':
                effType = 'dark'; effColor = '#9c27b0'; break;
            case 'raise_dead':
                effType = 'dark'; effColor = '#37474f'; break;
            case 'curse':
                effType = 'dark'; effColor = '#4a148c'; break;
            case 'soul_drain':
                effType = 'dark'; effColor = '#7b1fa2'; break;
            case 'soul_storm':
                effType = 'dark'; effColor = '#6a1b9a'; break;
            // 骑士
            case 'shield_bash':
                effType = 'shield'; effColor = '#4fc3f7'; break;
            case 'holy_shield':
                effType = 'shield'; effColor = '#ffd700'; break;
            case 'war_cry':
                effType = 'buff'; effColor = '#ff9800'; break;
            case 'sacred_shield':
                effType = 'shield'; effColor = '#ffd700'; break;
            case 'holy_taunt':
                effType = 'buff'; effColor = '#d32f2f'; break;
            // 剑客
            case 'sword_dance':
                effType = 'slash'; effColor = '#e0e0e0'; break;
            case 'quick_slash':
                effType = 'slash'; effColor = '#bbdefb'; break;
            case 'counter':
                effType = 'buff'; effColor = '#90a4ae'; break;
            case 'heavenly_slash':
                effType = 'slash'; effColor = '#90caf9'; break;
            // 贤者 - 治疗与辅助
            case 'heal':
                effType = 'heal'; effColor = '#66ff66'; break;
            case 'blessing':
                effType = 'buff'; effColor = '#ffd700'; break;
            case 'purify':
                effType = 'heal'; effColor = '#aaeaff'; break;
            case 'mass_heal':
                effType = 'heal'; effColor = '#66ff66'; break;
            case 'resurrection':
                effType = 'heal'; effColor = '#ffd700'; break;
            // 召唤师
            case 'summon_wolf':
                effType = 'buff'; effColor = '#9c27b0'; break;
            case 'dark_pact':
                effType = 'heal'; effColor = '#aa66ff'; break;
            case 'soul_link':
                effType = 'buff'; effColor = '#7b1fa2'; break;
            case 'summon_phoenix':
                effType = 'buff'; effColor = '#ff5722'; break;
            case 'summon_elemental':
                effType = 'buff'; effColor = '#00bcd4'; break;
            default:
                // 未识别的技能使用默认火球
                effType = 'explosion'; effColor = '#ff6600';
        }

        // 施法者闪光
        caster.skillFlash = 200;
        AudioManager.play('skill');
        // 目标受击
        target.hitFlash = 120;
        // 特效和粒子
        this.addEffect(target.x, target.y, effType, effColor, 1.3);
        this.addParticles(target.x, target.y, effColor, 12);
        // v2.6.2: 招牌技能大特效（多段式组合,仅 showcase 技能有自定义,其他走默认）
        this._playSkillBigEffect(caster, target, skillId);

        var mult = skill.multiplier || 1;
        // 技能等级加成（每级+10%倍率）
        var skillLevel = 0;
        var casterHero=null;var _es5_22=(GameState.get('heroes') || []);for(var _es5_23=0;_es5_23<_es5_22.length;_es5_23++){if(_es5_22[_es5_23].id === caster.id){casterHero=_es5_22[_es5_23];break;}};
        if (casterHero && casterHero.skillLevels) {
            skillLevel = casterHero.skillLevels[skill.id] || 0;
        }
        var levelBonus = 1 + skillLevel * 0.1;
        mult *= levelBonus;
        var dmg = Math.max(1, Math.floor(caster.atk * mult - target.def * 0.3));
        // 易伤 debuff 放大（死亡标记等）
        if (target._vulnDebuff && target._vulnDebuff > Date.now()) {
            var vulnAmp = 1.3; // 基础 +30%
            dmg = Math.floor(dmg * vulnAmp);
        }
        // 宝石伤害加成
        var bonusDmg = (caster.dmgBonus || 0);
        if (bonusDmg > 0) {
            dmg = Math.floor(dmg * (1 + bonusDmg / 100));
        }
        if (skill.critBonus) {
            if (chance((caster.crit + skill.critBonus) / 100)) {
                dmg = Math.floor(dmg * (caster.critDmg / 100));
                this.showDmgNum(target, dmg, true);
            } else {
                this.showDmgNum(target, dmg, false);
            }
        } else {
            this.showDmgNum(target, dmg, false);
        }
        // 优先扣除白甲护盾
        dmg = this._consumeShield(target, dmg);
        target.hp -= dmg;
        if (target.hp <= 0) {
            target.hp = 0;
            target.alive = false;
            if (!target.isAlly) {
                AudioManager.play('kill');
                var loot = generateBattleLoot(this.stage, 0);
                this.onMonsterKilled(target, loot, caster);
            }
        }
    },

    // ======================== 弹道系统 ========================

    // 弹道速度映射表（按类型决定飞行速度）
    _projectileSpeedMap: {
        fireball: 0.045, frost: 0.045, meteor: 0.03, meteor_storm: 0.035,
        dark_bolt: 0.045, arrow: 0.055, shadow_blade: 0.06, blade_slash: 0.075,
        whirlwind: 0.05, charge_burst: 0.08, earth_crack: 0.045, soul_drain: 0.05,
        arcane_blast: 0.055, shield_aura: 0.06, frost_nova: 0.05, fan_knives: 0.06,
        multi_slash: 0.06, mark_x: 0.045, soul_storm: 0.04, curse_wave: 0.05,
        death_scythe: 0.045
    },

    // 发射弹道
    //   v2.6.1: 委托给 PixiFx（GPU 渲染 + 拖尾），保留 this.projectiles 数组作为业务跟踪
    addProjectile: function(caster, target, type, color) {
        if (!caster || !target) return;
        var speed = this._projectileSpeedMap[type] || 0.045;
        var data = {
            sx: caster.x,
            sy: caster.y,
            tx: target.x,
            ty: target.y,
            type: type || 'fireball',
            color: color || '#ff6600',
            progress: 0,
            speed: speed,
            target: target,
            caster: caster,
            arrived: false
        };
        // 注册 PixiFx 弹道（GPU 渲染 + 拖尾粒子）
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            var fxData = PixiFx.addProjectile(data.sx, data.sy, data.tx, data.ty, data.type, data.color, data.target, data.caster);
            if (fxData) data._fxRef = fxData;
        }
        // ★ v2.6.4 Round 6.1 防御: 弹道上限 (3 倍速下疯狂 push 时保护内存)
        if (this.projectiles.length > 80) {
            var oldProj = this.projectiles.shift();
            if (oldProj && oldProj._fxRef && typeof PixiFx !== 'undefined' && PixiFx.removeProjectile) {
                try { PixiFx.removeProjectile(oldProj._fxRef); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
            }
        }
        this.projectiles.push(data);
    },

    // ========================================================================
    // v2.6.2 招牌技能大特效（8 个展示技能，多段式 PixiFx 组合）
    //   火球 / 冰霜 / 陨石 / 治疗 / 复活 / 暗影 / 旋风 / 地震
    //   每个技能在命中点触发 2-4 段特效（爆炸+余烬+烟雾环 / 冰刺+霜雾 / 圣光柱+光环 / 等）
    // ========================================================================
    _playSkillBigEffect: function(caster, target, skillId) {
        if (!target || typeof PixiFx === 'undefined' || !PixiFx.initialized) return;
        var tx = target.x, ty = target.y;
        try {
            this._playSkillBigEffectImpl(caster, target, skillId, tx, ty);
        } catch (e) {
            if (window.__DEBUG_SKEL__) console.error('[big skill effect error]', skillId, e);
        }
        // v1.0: 增强视觉特效 — 调用 SkillEffects（多层粒子 + 形状组合，不干扰原有效果）
        try {
            if (typeof SkillEffects !== 'undefined' && typeof SkillEffects[skillId] === 'function') {
                SkillEffects[skillId](caster, target, tx, ty);
            }
        } catch (e) {
            if (window.__DEBUG_SKEL__) console.error('[skillEffects error]', skillId, e);
        }
    },
_playSkillBigEffectImpl: function(caster, target, skillId, tx, ty) {
        // v2.6.2: 全 50 技能专属大特效,每种技能调用 this.addEffect / this.addParticles（双轨路由 PixiFx + Canvas2D）
        switch (skillId) {
            // ============ 法师 - 火系 ============
            case 'fireball':
                this.addEffect(tx, ty, 'explosion', '#ff6600', 1.4);
                this.addParticles(tx, ty, '#ff6600', 8);
                this.addParticles(tx, ty, '#ffaa00', 5);
                this.addParticles(tx, ty, '#888888', 6);
                break;
            case 'meteor_storm':
                this.addEffect(tx, ty, 'explosion', '#ff4400', 2.0);
                this.addEffect(tx, ty, 'explosion', '#ffaa00', 1.4);
                this.addParticles(tx, ty, '#ff4400', 16);
                this.addParticles(tx, ty, '#ffaa00', 12);
                this.addParticles(tx, ty, '#666666', 8);
                break;
            case 'arcane_power':
                // 奥术强化（buff，自身位置，金紫双环）
                this.addEffect(caster.x, caster.y, 'buff', '#bb86fc', 1.6);
                this.addEffect(caster.x, caster.y, 'nova', '#d1b3ff', 1.2);
                this.addParticles(caster.x, caster.y, '#bb86fc', 14);
                this.addParticles(caster.x, caster.y, '#e1bee7', 10);
                break;

            // ============ 法师 - 冰/奥术 ============
            case 'frost_nova':
                for (var di = 0; di < 6; di++) {
                    var ang = di * Math.PI / 3;
                    var dx2 = Math.cos(ang) * 30;
                    var dy2 = Math.sin(ang) * 30;
                    this.addEffect(tx + dx2, ty + dy2, 'nova', '#4fc3f7', 0.6);
                }
                this.addEffect(tx, ty, 'nova', '#b3e5fc', 1.6);
                this.addParticles(tx, ty, '#4fc3f7', 12);
                this.addParticles(tx, ty, '#e1f5fe', 8);
                break;
            case 'arcane_blast':
                // 奥术爆炸（紫爆 + 紫色粒子 + 蓝白闪光）
                this.addEffect(tx, ty, 'explosion', '#bb86fc', 1.5);
                this.addEffect(tx, ty, 'nova', '#d1b3ff', 1.3);
                this.addParticles(tx, ty, '#bb86fc', 14);
                this.addParticles(tx, ty, '#9c27b0', 8);
                this.addParticles(tx, ty, '#e1bee7', 8);
                break;
            case 'mana_shield':
                // 法力护盾（自身位置，蓝色双层护盾环）
                this.addEffect(caster.x, caster.y, 'shield', '#4fc3f7', 1.6);
                this.addEffect(caster.x, caster.y, 'shield', '#81d4fa', 1.2);
                this.addParticles(caster.x, caster.y, '#4fc3f7', 10);
                this.addParticles(caster.x, caster.y, '#b3e5fc', 6);
                break;

            // ============ 刺客 ============
            case 'backstab':
                // 背刺（紫色斩击 + 紫黑粒子）
                this.addEffect(tx, ty, 'slash', '#4a148c', 1.3);
                this.addEffect(tx, ty, 'hit', '#6a1b9a', 1.0);
                this.addParticles(tx, ty, '#4a148c', 10);
                this.addParticles(tx, ty, '#7b1fa2', 6);
                break;
            case 'poison_blade':
                // 毒刃（绿色 buff + 毒雾 + 黄绿粒子）
                this.addEffect(tx, ty, 'buff', '#76ff03', 1.2);
                this.addEffect(tx, ty, 'nova', '#aeea00', 1.0);
                this.addParticles(tx, ty, '#76ff03', 10);
                this.addParticles(tx, ty, '#aeea00', 6);
                break;
            case 'shadow_step':
                // 暗影步（紫黑暗爆 + 12 紫黑粒子）
                this.addEffect(tx, ty, 'dark', '#7b1fa2', 1.4);
                this.addEffect(tx, ty, 'dark', '#4a148c', 1.0);
                this.addParticles(tx, ty, '#9c27b0', 12);
                this.addParticles(tx, ty, '#4a148c', 8);
                break;
            case 'death_mark':
                // 死亡标记（暗红 hit + 紫红粒子 + 诅咒环）
                this.addEffect(tx, ty, 'hit', '#c62828', 1.4);
                this.addEffect(tx, ty, 'dark', '#7b1fa2', 1.0);
                this.addParticles(tx, ty, '#c62828', 8);
                this.addParticles(tx, ty, '#7b1fa2', 6);
                break;
            case 'fan_of_knives':
                // 飞刀（5 方向斩击 + 灰粒子）
                for (var fi = 0; fi < 5; fi++) {
                    var fang = (fi - 2) * 0.25;
                    var fdx = Math.sin(fang) * 30;
                    var fdy = -Math.abs(Math.cos(fang)) * 15 + 10;
                    this.addEffect(tx + fdx, ty + fdy, 'slash', '#b0bec5', 0.7);
                }
                this.addEffect(tx, ty, 'slash', '#b0bec5', 1.0);
                this.addParticles(tx, ty, '#b0bec5', 12);
                this.addParticles(tx, ty, '#90a4ae', 6);
                break;
            case 'assassins_mark':
                // 刺客标记（暗红 nova + 紫黑粒子）
                this.addEffect(tx, ty, 'nova', '#c62828', 1.3);
                this.addEffect(tx, ty, 'hit', '#b71c1c', 1.0);
                this.addParticles(tx, ty, '#c62828', 10);
                this.addParticles(tx, ty, '#7b1fa2', 6);
                break;

            // ============ 召唤师 ============
            case 'summon_wolf':
                // 召唤狼（自身位置，紫黑召唤环 + 紫粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#9c27b0', 1.8);
                this.addEffect(caster.x, caster.y, 'nova', '#ba68c8', 1.3);
                this.addParticles(caster.x, caster.y, '#9c27b0', 12);
                this.addParticles(caster.x, caster.y, '#ba68c8', 8);
                break;
            case 'dark_pact':
                // 黑暗契约（紫黑 heal + 紫白粒子）
                this.addEffect(caster.x, caster.y, 'heal', '#aa66ff', 1.8);
                this.addEffect(caster.x, caster.y, 'dark', '#7b1fa2', 1.2);
                this.addParticles(caster.x, caster.y, '#aa66ff', 14);
                this.addParticles(caster.x, caster.y, '#7b1fa2', 8);
                break;
            case 'soul_link':
                // 灵魂链接（紫黑 buff + 紫色连线感粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#7b1fa2', 1.5);
                this.addEffect(caster.x, caster.y, 'nova', '#9c27b0', 1.0);
                this.addParticles(caster.x, caster.y, '#7b1fa2', 10);
                this.addParticles(caster.x, caster.y, '#ba68c8', 6);
                break;
            case 'summon_phoenix':
                // 召唤凤凰（自身位置，红橙召唤环 + 火红粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#ff5722', 2.0);
                this.addEffect(caster.x, caster.y, 'nova', '#ff7043', 1.5);
                this.addEffect(caster.x, caster.y, 'explosion', '#ff9800', 1.0);
                this.addParticles(caster.x, caster.y, '#ff5722', 16);
                this.addParticles(caster.x, caster.y, '#ff9800', 10);
                break;
            case 'summon_elemental':
                // 召唤元素（自身位置，青蓝召唤环 + 蓝白粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#00bcd4', 1.8);
                this.addEffect(caster.x, caster.y, 'nova', '#4dd0e1', 1.4);
                this.addParticles(caster.x, caster.y, '#00bcd4', 12);
                this.addParticles(caster.x, caster.y, '#4dd0e1', 8);
                break;
            case 'summoners_will':
                // 召唤师意志（自身位置，紫光大环 + 紫色粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#9c27b0', 1.6);
                this.addEffect(caster.x, caster.y, 'nova', '#ce93d8', 1.3);
                this.addParticles(caster.x, caster.y, '#9c27b0', 12);
                this.addParticles(caster.x, caster.y, '#e1bee7', 8);
                break;

            // ============ 战士 ============
            case 'whirlwind':
                for (var wi = 0; wi < 4; wi++) {
                    var wang = wi * Math.PI / 2 + Math.PI / 4;
                    var wdx = Math.cos(wang) * 25;
                    var wdy = Math.sin(wang) * 25;
                    this.addEffect(tx + wdx, ty + wdy, 'slash', '#ffaa44', 0.9);
                }
                this.addEffect(tx, ty, 'slash', '#ffaa44', 1.2);
                this.addEffect(tx, ty, 'nova', '#ffaa44', 0.8);
                this.addParticles(tx, ty, '#ffaa44', 14);
                break;
            case 'blood_thirst':
                // 嗜血（红色 buff + 红黑粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#d32f2f', 1.5);
                this.addEffect(caster.x, caster.y, 'nova', '#f44336', 1.2);
                this.addParticles(caster.x, caster.y, '#d32f2f', 12);
                this.addParticles(caster.x, caster.y, '#b71c1c', 6);
                break;
            case 'charge':
                // 冲锋（红色冲击线 + 红色粒子）
                this.addEffect(tx, ty, 'explosion', '#d32f2f', 1.4);
                this.addEffect(tx, ty, 'hit', '#f44336', 1.0);
                this.addParticles(tx, ty, '#d32f2f', 10);
                this.addParticles(tx, ty, '#ff8a80', 6);
                break;
            case 'berserk':
                // 狂战（自身位置，红黑 buff + 红色粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#d32f2f', 1.8);
                this.addEffect(caster.x, caster.y, 'nova', '#ff5722', 1.3);
                this.addParticles(caster.x, caster.y, '#d32f2f', 14);
                this.addParticles(caster.x, caster.y, '#ff5722', 8);
                break;
            case 'warriors_soul':
                // 战士之魂（自身位置，橙红 buff + 暖色粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#ff7043', 1.5);
                this.addEffect(caster.x, caster.y, 'nova', '#ffab91', 1.2);
                this.addParticles(caster.x, caster.y, '#ff7043', 12);
                this.addParticles(caster.x, caster.y, '#ffccbc', 8);
                break;
            case 'earthquake':
                this.addEffect(tx - 30, ty + 10, 'explosion', '#795548', 1.2);
                this.addEffect(tx, ty + 8, 'explosion', '#a1887f', 1.5);
                this.addEffect(tx + 30, ty + 10, 'explosion', '#795548', 1.2);
                this.addEffect(tx, ty, 'nova', '#a1887f', 0.9);
                this.addParticles(tx, ty, '#8d6e63', 16);
                this.addParticles(tx, ty, '#bcaaa4', 10);
                break;

            // ============ 剑客 ============
            case 'sword_dance':
                // 剑舞（多道斩击 + 白色粒子）
                for (var sd = 0; sd < 6; sd++) {
                    var sdang = sd * Math.PI / 3;
                    this.addEffect(tx + Math.cos(sdang) * 18, ty + Math.sin(sdang) * 18, 'slash', '#e0e0e0', 0.6);
                }
                this.addEffect(tx, ty, 'slash', '#ffffff', 1.2);
                this.addParticles(tx, ty, '#e0e0e0', 14);
                this.addParticles(tx, ty, '#ffffff', 8);
                break;
            case 'quick_slash':
                // 疾风斩（淡蓝斩击 + 蓝白粒子）
                this.addEffect(tx, ty, 'slash', '#bbdefb', 1.4);
                this.addEffect(tx, ty, 'slash', '#90caf9', 1.0);
                this.addParticles(tx, ty, '#90caf9', 12);
                this.addParticles(tx, ty, '#e3f2fd', 6);
                break;
            case 'counter':
                // 反击（蓝灰 buff + 蓝粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#90a4ae', 1.4);
                this.addEffect(caster.x, caster.y, 'shield', '#90a4ae', 1.0);
                this.addParticles(caster.x, caster.y, '#90a4ae', 10);
                break;
            case 'final_strike':
                // 终结斩（大斩击 + 多色混合粒子）
                this.addEffect(tx, ty, 'slash', '#ffffff', 1.8);
                this.addEffect(tx, ty, 'slash', '#ffd700', 1.4);
                this.addParticles(tx, ty, '#ffffff', 14);
                this.addParticles(tx, ty, '#ffd700', 10);
                this.addParticles(tx, ty, '#e0e0e0', 6);
                break;
            case 'blade_mastery':
                // 剑道精通（自身位置，银白 buff + 银粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#bdbdbd', 1.5);
                this.addEffect(caster.x, caster.y, 'nova', '#e0e0e0', 1.2);
                this.addParticles(caster.x, caster.y, '#bdbdbd', 12);
                this.addParticles(caster.x, caster.y, '#ffffff', 8);
                break;
            case 'heavenly_slash':
                // 天剑（淡蓝大斩 + 蓝光粒子）
                this.addEffect(tx, ty, 'slash', '#90caf9', 1.5);
                this.addEffect(tx, ty, 'nova', '#bbdefb', 1.2);
                this.addParticles(tx, ty, '#90caf9', 12);
                this.addParticles(tx, ty, '#e3f2fd', 8);
                break;

            // ============ 骑士 ============
            case 'shield_bash':
                // 盾击（蓝色盾击 + 蓝白粒子）
                this.addEffect(tx, ty, 'shield', '#4fc3f7', 1.5);
                this.addEffect(tx, ty, 'hit', '#29b6f6', 1.0);
                this.addParticles(tx, ty, '#4fc3f7', 10);
                this.addParticles(tx, ty, '#b3e5fc', 6);
                break;
            case 'holy_shield':
                // 神圣护盾（自身位置，金盾 + 金白粒子）
                this.addEffect(caster.x, caster.y, 'shield', '#ffd700', 1.6);
                this.addEffect(caster.x, caster.y, 'shield', '#ffffff', 1.2);
                this.addParticles(caster.x, caster.y, '#ffd700', 12);
                this.addParticles(caster.x, caster.y, '#ffffff', 8);
                break;
            case 'war_cry':
                // 战吼（自身位置，金红 buff + 金色冲击波）
                this.addEffect(caster.x, caster.y, 'buff', '#ff9800', 1.6);
                this.addEffect(caster.x, caster.y, 'nova', '#ffd700', 1.3);
                this.addParticles(caster.x, caster.y, '#ff9800', 14);
                this.addParticles(caster.x, caster.y, '#ffd700', 10);
                break;
            case 'iron_wall':
                // 铁壁（自身位置，深蓝盾 + 灰粒子）
                this.addEffect(caster.x, caster.y, 'shield', '#37474f', 1.6);
                this.addEffect(caster.x, caster.y, 'shield', '#546e7a', 1.2);
                this.addParticles(caster.x, caster.y, '#37474f', 10);
                this.addParticles(caster.x, caster.y, '#90a4ae', 6);
                break;
            case 'holy_armor':
                // 神圣铠甲（自身位置，金色 armor + 金白粒子）
                this.addEffect(caster.x, caster.y, 'shield', '#ffd700', 1.8);
                this.addEffect(caster.x, caster.y, 'buff', '#ffd700', 1.4);
                this.addParticles(caster.x, caster.y, '#ffd700', 14);
                this.addParticles(caster.x, caster.y, '#ffffff', 8);
                break;
            case 'sacred_shield':
                // 圣盾（自身位置，金色 shield）
                this.addEffect(caster.x, caster.y, 'shield', '#ffd700', 1.5);
                this.addEffect(caster.x, caster.y, 'nova', '#ffeb3b', 1.2);
                this.addParticles(caster.x, caster.y, '#ffd700', 10);
                this.addParticles(caster.x, caster.y, '#fff9c4', 6);
                break;
            case 'holy_taunt':
                // 神圣嘲讽（自身位置，红 buff + 红粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#d32f2f', 1.5);
                this.addEffect(caster.x, caster.y, 'nova', '#f44336', 1.2);
                this.addParticles(caster.x, caster.y, '#d32f2f', 12);
                this.addParticles(caster.x, caster.y, '#ffcdd2', 6);
                break;

            // ============ 贤者 - 治疗与辅助 ============
            case 'heal':
            case 'mass_heal':
                this.addEffect(tx, ty, 'heal', '#66ff66', 1.5);
                this.addEffect(tx, ty, 'heal', '#ffff66', 1.2);
                this.addParticles(tx, ty, '#ffff00', 12);
                this.addParticles(tx, ty, '#ffffff', 6);
                break;
            case 'blessing':
                // 祝福（自身位置，金 buff + 金粒子）
                this.addEffect(caster.x, caster.y, 'buff', '#ffd700', 1.5);
                this.addEffect(caster.x, caster.y, 'nova', '#ffeb3b', 1.2);
                this.addParticles(caster.x, caster.y, '#ffd700', 12);
                this.addParticles(caster.x, caster.y, '#fff59d', 8);
                break;
            case 'purify':
                // 净化（淡蓝 heal + 白光粒子）
                this.addEffect(tx, ty, 'heal', '#aaeaff', 1.4);
                this.addEffect(tx, ty, 'nova', '#e1f5fe', 1.2);
                this.addParticles(tx, ty, '#aaeaff', 10);
                this.addParticles(tx, ty, '#ffffff', 8);
                break;
            case 'divine_light':
                // 神圣之光（金光柱 + 12 上升光点 + 中央 heal 环）
                this.addEffect(tx, ty, 'heal', '#ffd700', 1.8);
                this.addEffect(tx, ty, 'heal', '#ffeb3b', 1.4);
                this.addParticles(tx, ty, '#ffd700', 14);
                this.addParticles(tx, ty, '#ffeb3b', 8);
                break;
            case 'resurrection':
                this.addEffect(tx, ty, 'heal', '#ffd700', 2.0);
                this.addEffect(tx, ty, 'heal', '#ffffff', 1.6);
                this.addEffect(tx, ty, 'buff', '#ffd700', 1.4);
                this.addParticles(tx, ty, '#ffd700', 16);
                this.addParticles(tx, ty, '#ffffff', 8);
                break;
            case 'holy_grace':
                // 神圣恩典（自身位置，金 heal + 白粒子）
                this.addEffect(caster.x, caster.y, 'heal', '#ffd700', 1.6);
                this.addEffect(caster.x, caster.y, 'buff', '#ffd700', 1.3);
                this.addParticles(caster.x, caster.y, '#ffd700', 12);
                this.addParticles(caster.x, caster.y, '#ffffff', 8);
                break;

            // ============ 亡灵法师 ============
            case 'death_bolt':
                this.addEffect(tx, ty, 'dark', '#7b1fa2', 1.4);
                this.addEffect(tx, ty, 'dark', '#4a148c', 1.0);
                this.addParticles(tx, ty, '#9c27b0', 12);
                this.addParticles(tx, ty, '#4a148c', 8);
                break;
            case 'raise_dead':
                // 复活亡灵（暗紫召唤环 + 暗黑粒子）
                this.addEffect(tx, ty, 'dark', '#37474f', 1.6);
                this.addEffect(tx, ty, 'nova', '#4a148c', 1.3);
                this.addParticles(tx, ty, '#37474f', 10);
                this.addParticles(tx, ty, '#7b1fa2', 8);
                break;
            case 'curse':
                // 诅咒（暗紫爆 + 紫红粒子）
                this.addEffect(tx, ty, 'dark', '#4a148c', 1.4);
                this.addEffect(tx, ty, 'hit', '#7b1fa2', 1.0);
                this.addParticles(tx, ty, '#4a148c', 10);
                this.addParticles(tx, ty, '#ce93d8', 6);
                break;
            case 'soul_drain':
                // 灵魂吸取（暗紫 heal + 紫黑粒子）
                this.addEffect(tx, ty, 'dark', '#7b1fa2', 1.4);
                this.addEffect(tx, ty, 'dark', '#4a148c', 1.0);
                this.addParticles(tx, ty, '#9c27b0', 12);
                this.addParticles(tx, ty, '#4a148c', 8);
                break;
            case 'death_aura':
                // 死亡光环（自身位置，暗紫 buff + 黑雾）
                this.addEffect(caster.x, caster.y, 'dark', '#7b1fa2', 1.6);
                this.addEffect(caster.x, caster.y, 'nova', '#4a148c', 1.3);
                this.addParticles(caster.x, caster.y, '#7b1fa2', 12);
                this.addParticles(caster.x, caster.y, '#311b92', 8);
                break;
            case 'soul_storm':
                // 灵魂风暴（大暗紫爆 + 紫黑粒子）
                this.addEffect(tx, ty, 'dark', '#6a1b9a', 1.8);
                this.addEffect(tx, ty, 'dark', '#4a148c', 1.4);
                this.addParticles(tx, ty, '#6a1b9a', 14);
                this.addParticles(tx, ty, '#4a148c', 10);
                break;

            default:
                break;
        }
    },

    // 绘制弹道
    //   v2.6.1: 委托给 PixiFx（GPU 渲染 + 拖尾粒子），跳过 Canvas2D 版本
    drawProjectiles: function(ctx) {
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) return;
        for (var i = 0; i < this.projectiles.length; i++) {
            var p = this.projectiles[i];
            var px = p.sx + (p.tx - p.sx) * p.progress;
            var py = p.sy + (p.ty - p.sy) * p.progress;
            var size = 4 + p.progress * 4;

            switch (p.type) {
                case 'fireball':
                    // 火球：发光圆球
                    var grad = ctx.createRadialGradient(px, py, 0, px, py, size * 2);
                    grad.addColorStop(0, 'rgba(255,255,200,0.9)');
                    grad.addColorStop(0.3, p.color);
                    grad.addColorStop(1, 'rgba(255,100,0,0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 2, 0, Math.PI * 2);
                    ctx.fill();
                    // 尾迹
                    ctx.fillStyle = 'rgba(255,150,50,' + (0.3 * (1 - p.progress)) + ')';
                    var trailX = p.sx + (p.tx - p.sx) * Math.max(0, p.progress - 0.05);
                    var trailY = p.sy + (p.ty - p.sy) * Math.max(0, p.progress - 0.05);
                    ctx.beginPath();
                    ctx.arc((px + trailX) / 2, (py + trailY) / 2, size * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'frost':
                    // 冰霜弹：蓝色旋转冰晶
                    ctx.fillStyle = p.color;
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(p.progress * Math.PI * 2);
                    for (var s = 0; s < 4; s++) {
                        var a = s * Math.PI / 2;
                        ctx.beginPath();
                        ctx.arc(Math.cos(a) * size, Math.sin(a) * size, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                    ctx.strokeStyle = 'rgba(79,195,247,' + (0.5 * (1 - p.progress * 0.3)) + ')';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'meteor':
                    // 陨石：从上坠落
                    var meteorX = p.tx + Math.sin(p.progress * Math.PI * 3) * 10;
                    var meteorY = p.sy + (p.ty - p.sy) * p.progress;
                    var mgrad = ctx.createRadialGradient(meteorX, meteorY, 0, meteorX, meteorY, size * 3);
                    mgrad.addColorStop(0, 'rgba(255,255,200,0.8)');
                    mgrad.addColorStop(0.2, p.color);
                    mgrad.addColorStop(0.6, '#ff4400');
                    mgrad.addColorStop(1, 'rgba(200,50,0,0)');
                    ctx.fillStyle = mgrad;
                    ctx.beginPath();
                    ctx.arc(meteorX, meteorY, size * 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    // 燃烧尾迹
                    ctx.fillStyle = 'rgba(255,100,0,' + (0.2 * (1 - p.progress)) + ')';
                    for (var t = 0; t < 3; t++) {
                        var tp = Math.max(0, p.progress - 0.03 * (t + 1));
                        var tx = p.tx + Math.sin(tp * Math.PI * 3) * 10;
                        var ty = p.sy + (p.ty - p.sy) * tp;
                        ctx.beginPath();
                        ctx.arc(tx, ty, size * (1.5 - t * 0.3), 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                case 'meteor_storm':
                    // 流星风暴：多枚陨石同时坠落
                    var msCenterX = px;
                    var msCenterY = py;
                    for (var mi = 0; mi < 4; mi++) {
                        var moffX = Math.sin(p.progress * Math.PI * 4 + mi * 1.5) * 12;
                        var moffY = (mi - 2) * 8;
                        var mx = msCenterX + moffX;
                        var my = msCenterY + moffY;
                        var msg = ctx.createRadialGradient(mx, my, 0, mx, my, size * 2);
                        msg.addColorStop(0, 'rgba(255,255,180,0.9)');
                        msg.addColorStop(0.3, p.color);
                        msg.addColorStop(1, 'rgba(200,50,0,0)');
                        ctx.fillStyle = msg;
                        ctx.beginPath();
                        ctx.arc(mx, my, size * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                case 'dark_bolt':
                    // 暗影弹：紫色扭曲弹道
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(100,0,150,0.3)';
                    ctx.beginPath();
                    var wobbleX = p.sx + (p.tx - p.sx) * p.progress + Math.sin(p.progress * Math.PI * 6) * 6;
                    var wobbleY = p.sy + (p.ty - p.sy) * p.progress + Math.cos(p.progress * Math.PI * 5) * 4;
                    ctx.arc(wobbleX, wobbleY, size * 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'arrow':
                    // 物理飞行道具
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(px - size, py);
                    ctx.lineTo(px + size, py);
                    ctx.stroke();
                    // 箭头
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.moveTo(px + size * 1.3, py);
                    ctx.lineTo(px + size * 0.3, py - 3);
                    ctx.lineTo(px + size * 0.3, py + 3);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'shadow_blade':
                    // 暗影刃：黑色月牙弧线（背刺）
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(p.progress * Math.PI);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 1.5, Math.PI * 0.8, Math.PI * 1.6);
                    ctx.stroke();
                    // 内层亮线
                    ctx.strokeStyle = 'rgba(200,150,255,0.8)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 1.2, Math.PI * 0.85, Math.PI * 1.55);
                    ctx.stroke();
                    ctx.restore();
                    // 拖尾
                    ctx.fillStyle = 'rgba(74,20,140,0.25)';
                    ctx.beginPath();
                    ctx.arc(px, py, size * 2.2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'blade_slash':
                    // 剑光：白蓝弧形剑气（居合斩/天翔斩）
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(p.progress * Math.PI * 1.2);
                    var bsg = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
                    bsg.addColorStop(0, 'rgba(255,255,255,0.9)');
                    bsg.addColorStop(0.3, p.color);
                    bsg.addColorStop(1, 'rgba(150,200,255,0)');
                    ctx.fillStyle = bsg;
                    ctx.beginPath();
                    ctx.moveTo(0, -size * 0.4);
                    ctx.quadraticCurveTo(size * 2.5, -size * 1.2, size * 3, 0);
                    ctx.quadraticCurveTo(size * 2.5, size * 1.2, 0, size * 0.4);
                    ctx.quadraticCurveTo(size * 1.2, 0, 0, -size * 0.4);
                    ctx.fill();
                    ctx.restore();
                    break;
                case 'multi_slash':
                    // 多次斩击：剑舞（多道残留弧线）
                    ctx.save();
                    ctx.translate(px, py);
                    for (var msi = 0; msi < 3; msi++) {
                        var msRot = p.progress * Math.PI * 2 + msi * Math.PI * 0.5;
                        ctx.save();
                        ctx.rotate(msRot);
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.arc(0, 0, size * (1.5 + msi * 0.3), Math.PI * 0.2, Math.PI * 0.8);
                        ctx.stroke();
                        ctx.restore();
                    }
                    ctx.restore();
                    break;
                case 'whirlwind':
                    // 旋风：旋转气流环
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(p.progress * Math.PI * 3);
                    for (var wi = 0; wi < 6; wi++) {
                        var wa = wi * Math.PI / 3;
                        var wx = Math.cos(wa) * size * 1.3;
                        var wy = Math.sin(wa) * size * 0.6;
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(wx, wy, size * 0.7, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    // 中心涡旋
                    var wg = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                    wg.addColorStop(0, 'rgba(255,255,200,0.4)');
                    wg.addColorStop(1, 'rgba(255,170,68,0)');
                    ctx.fillStyle = wg;
                    ctx.beginPath();
                    ctx.arc(0, 0, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    break;
                case 'charge_burst':
                    // 冲锋：地面冲击波
                    var cbg = ctx.createRadialGradient(px, py, 0, px, py, size * 2.5);
                    cbg.addColorStop(0, 'rgba(255,255,200,0.9)');
                    cbg.addColorStop(0.3, p.color);
                    cbg.addColorStop(1, 'rgba(180,30,30,0)');
                    ctx.fillStyle = cbg;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 2.2, 0, Math.PI * 2);
                    ctx.fill();
                    // 尖刺
                    for (var csi = 0; csi < 5; csi++) {
                        var csRot = csi * Math.PI * 2 / 5 + p.progress * Math.PI;
                        var csx = px + Math.cos(csRot) * size * 1.8;
                        var csy = py + Math.sin(csRot) * size * 1.8;
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(csx, csy);
                        ctx.stroke();
                    }
                    break;
                case 'earth_crack':
                    // 地震：地面裂纹扩散
                    for (var ei = 0; ei < 4; ei++) {
                        var erot = ei * Math.PI / 2 + Math.sin(p.progress * 3) * 0.3;
                        var elen = size * 1.5 * (0.5 + p.progress * 0.5);
                        var ex1 = px + Math.cos(erot) * elen;
                        var ey1 = py + Math.sin(erot) * elen;
                        var ex2 = px - Math.cos(erot) * elen;
                        var ey2 = py - Math.sin(erot) * elen;
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(ex1, ey1);
                        ctx.lineTo(ex2, ey2);
                        ctx.stroke();
                    }
                    // 尘埃
                    var ecg = ctx.createRadialGradient(px, py, 0, px, py, size * 2);
                    ecg.addColorStop(0, 'rgba(180,150,100,0.5)');
                    ecg.addColorStop(1, 'rgba(120,80,40,0)');
                    ctx.fillStyle = ecg;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 1.8, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'soul_drain':
                    // 灵魂链：紫色锁链
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(p.progress * Math.PI);
                    for (var li = 0; li < 3; li++) {
                        var lx = (li - 1) * size * 0.8;
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(lx, -size * 1.5);
                        ctx.quadraticCurveTo(lx + Math.sin(p.progress * 5 + li) * 3, 0, lx, size * 1.5);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // 暗影圈
                    var sdg = ctx.createRadialGradient(px, py, 0, px, py, size * 1.5);
                    sdg.addColorStop(0, 'rgba(123,31,162,0.5)');
                    sdg.addColorStop(1, 'rgba(60,0,90,0)');
                    ctx.fillStyle = sdg;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'soul_storm':
                    // 灵魂风暴：暗紫能量球
                    var ssCenterX = px;
                    var ssCenterY = py;
                    for (var si2 = 0; si2 < 5; si2++) {
                        var ssa = si2 * Math.PI * 2 / 5 + p.progress * Math.PI * 2;
                        var ssx = ssCenterX + Math.cos(ssa) * size * 1.2;
                        var ssy = ssCenterY + Math.sin(ssa) * size * 1.2;
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(ssx, ssy, size * 0.8, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    var ssg = ctx.createRadialGradient(ssCenterX, ssCenterY, 0, ssCenterX, ssCenterY, size);
                    ssg.addColorStop(0, 'rgba(180,100,255,0.6)');
                    ssg.addColorStop(1, 'rgba(60,0,90,0)');
                    ctx.fillStyle = ssg;
                    ctx.beginPath();
                    ctx.arc(ssCenterX, ssCenterY, size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'curse_wave':
                    // 诅咒：暗紫波纹
                    for (var ci = 0; ci < 3; ci++) {
                        var cwr = size * (1 + ci * 0.5) * p.progress;
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 1.5;
                        ctx.globalAlpha = 1 - p.progress - ci * 0.2;
                        ctx.beginPath();
                        ctx.arc(px, py, cwr, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                    // 骷髅点
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'death_scythe':
                    // 死灵镰刀：暗色弧线
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(p.progress * Math.PI * 1.5);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 1.8, Math.PI * 0.1, Math.PI * 0.9);
                    ctx.stroke();
                    // 内核
                    ctx.fillStyle = 'rgba(50,50,50,0.7)';
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    break;
                case 'shield_aura':
                    // 盾击：蓝白光环
                    var sag = ctx.createRadialGradient(px, py, 0, px, py, size * 2.5);
                    sag.addColorStop(0, 'rgba(255,255,255,0.8)');
                    sag.addColorStop(0.4, p.color);
                    sag.addColorStop(1, 'rgba(79,195,247,0)');
                    ctx.fillStyle = sag;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 2.2, 0, Math.PI * 2);
                    ctx.fill();
                    // 盾牌轮廓
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 1.3, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'frost_nova':
                    // 冰霜新星：旋转的冰环
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(p.progress * Math.PI * 2);
                    for (var fni = 0; fni < 8; fni++) {
                        var fna = fni * Math.PI / 4;
                        var fnx = Math.cos(fna) * size * 1.3;
                        var fny = Math.sin(fna) * size * 1.3;
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(fnx, fny, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    // 中心光圈
                    var fng = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                    fng.addColorStop(0, 'rgba(180,230,255,0.4)');
                    fng.addColorStop(1, 'rgba(79,195,247,0)');
                    ctx.fillStyle = fng;
                    ctx.beginPath();
                    ctx.arc(0, 0, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    break;
                case 'arcane_blast':
                    // 奥术冲击：紫色奥术球
                    var abg = ctx.createRadialGradient(px, py, 0, px, py, size * 2.5);
                    abg.addColorStop(0, 'rgba(220,200,255,0.95)');
                    abg.addColorStop(0.3, p.color);
                    abg.addColorStop(0.7, 'rgba(100,50,180,0.4)');
                    abg.addColorStop(1, 'rgba(60,20,120,0)');
                    ctx.fillStyle = abg;
                    ctx.beginPath();
                    ctx.arc(px, py, size * 2.2, 0, Math.PI * 2);
                    ctx.fill();
                    // 魔法符文
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(p.progress * Math.PI);
                    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    for (var abi = 0; abi < 6; abi++) {
                        var aba = abi * Math.PI / 3;
                        var abx = Math.cos(aba) * size;
                        var aby = Math.sin(aba) * size;
                        if (abi === 0) ctx.moveTo(abx, aby);
                        else ctx.lineTo(abx, aby);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                    break;
                case 'mark_x':
                    // 死亡标记：红色X标记
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(Math.PI / 4);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(-size, -size);
                    ctx.lineTo(size, size);
                    ctx.moveTo(size, -size);
                    ctx.lineTo(-size, size);
                    ctx.stroke();
                    // 边框
                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(-size * 1.2, -size * 1.2, size * 2.4, size * 2.4);
                    ctx.restore();
                    break;
                case 'fan_knives':
                    // 飞刀乱舞：多把飞刀扇形
                    for (var fki = 0; fki < 5; fki++) {
                        var fkrot = (fki - 2) * 0.3 + p.progress * Math.PI * 0.5;
                        ctx.save();
                        ctx.translate(px, py);
                        ctx.rotate(fkrot);
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(-size, 0);
                        ctx.lineTo(size, 0);
                        ctx.stroke();
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.moveTo(size * 1.3, 0);
                        ctx.lineTo(size * 0.4, -2);
                        ctx.lineTo(size * 0.4, 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                    }
                    break;
                default:
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();
            }
        }
    },

    // v2.6.1: 推进所有单位的骨骼动画
    //   - 死亡单位 → die 动画
    //   - 刚生成 → spawn 动画
    //   - attackAnim 触发 → attack 动画(单次)
    //   - hitFlash 触发 → hit 动画(单次)
    //   - 其余 → idle(默认循环)
    updateAllSkeletons: function(dt) {
        var dtSec = dt / 1000;
        // allies
        for (var i = 0; i < this.allies.length; i++) {
            this._tickUnitSkeleton(this.allies[i], dtSec);
        }
        // enemies
        for (var j = 0; j < this.enemies.length; j++) {
            this._tickUnitSkeleton(this.enemies[j], dtSec);
        }
        // summons
        if (this.summons) {
            for (var k = 0; k < this.summons.length; k++) {
                this._tickUnitSkeleton(this.summons[k], dtSec);
            }
        }

    },

    // ★ v3.5.0 恢复：更新动画状态（attackAnim/hitFlash/skillFlash/reviveFlash）
    updateAnimations: function(dt) {
        var list = (this.allies || []).concat(this.enemies || []).concat(this.summons || []);
        for (var i = 0; i < list.length; i++) {
            var u = list[i];
            if (!u) continue;
            // 攻击前冲动画
            if (u.attackAnim) {
                u.attackAnim.progress = (u.attackAnim.progress || 0) + dt;
                if (u.attackAnim.progress >= (u.attackAnim.duration || 150)) {
                    u.attackAnim = null;
                }
            }
            // 受击闪烁
            if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt);
            // 技能施放闪光
            if (u.skillFlash > 0) u.skillFlash = Math.max(0, u.skillFlash - dt);
            // 复活闪光
            if (u.reviveFlash > 0) u.reviveFlash = Math.max(0, u.reviveFlash - dt);
        }
    },

    _tickUnitSkeleton: function(unit, dtSec) {
        if (!unit || !unit.skeleton) return;
        var sk = unit.skeleton;
        // 优先级: 死亡 > 生成刚生成 > attackAnim > hitFlash > idle
        if (!unit.alive) {
            if (sk.currentAnimName !== 'die') sk.playAnimation('die');
        } else if (unit._justSpawned) {
            if (sk.currentAnimName !== 'spawn') sk.playAnimation('spawn');
            unit._spawnAnimTime = (unit._spawnAnimTime || 0) + dtSec;
            if (unit._spawnAnimTime > 0.4) {
                unit._justSpawned = false;
                sk.playAnimation('idle');
            }
        } else if (unit.attackAnim && unit.attackAnim.progress === 0) {
            // 攻击刚触发
            if (sk.currentAnimName !== 'attack') sk.playAnimation('attack');
            unit._attackAnimTime = 0;
        } else if (unit._attackAnimTime != null) {
            unit._attackAnimTime += dtSec;
            if (unit._attackAnimTime >= 0.45) {
                unit._attackAnimTime = null;
                sk.playAnimation('idle');
            }
        } else if (unit.hitFlash && unit.hitFlash > 80) {
            // 刚被击中
            if (sk.currentAnimName !== 'hit') sk.playAnimation('hit');
            unit._hitAnimTime = 0;
        } else if (unit._hitAnimTime != null) {
            unit._hitAnimTime += dtSec;
            if (unit._hitAnimTime >= 0.3) {
                unit._hitAnimTime = null;
                sk.playAnimation('idle');
            }
        } else if (sk.currentAnimName !== 'idle') {
            sk.playAnimation('idle');
        }
        sk.update(dtSec);
    },

    // 更新弹道
    //   v2.6.1: 位置/特效/到达全部委托 PixiFx（GPU ticker 驱动 + 拖尾）
    //   本函数只负责清理 this.projectiles 中已被 PixiFx 销毁的条目（同步两个数组）
    updateProjectiles: function(dt) {
        // PixiFx 接管时,位置/到达/特效都在它那边，本函数只同步数组
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            // 清理本数组中已到达的（_fxRef.arrived 为 true 表示 PixiFx 已处理）
            for (var i = this.projectiles.length - 1; i >= 0; i--) {
                if (this.projectiles[i]._fxArrived) {
                    this.projectiles.splice(i, 1);
                }
            }
            return;
        }
        // 兜底（PixiFx 未初始化时走原 Canvas2D 路径）
        for (var j = this.projectiles.length - 1; j >= 0; j--) {
            var p = this.projectiles[j];
            p.progress += p.speed;
            if (p.progress >= 1) {
                if (p.target && p.target.alive) {
                    var hitColor = p.color;
                    switch (p.type) {
                        case 'fireball':
                            this.addEffect(p.target.x, p.target.y, 'explosion', '#ff6600', 1.3);
                            this.addParticles(p.target.x, p.target.y, '#ff6600', 12);
                            break;
                        case 'frost':
                            this.addEffect(p.target.x, p.target.y, 'nova', '#4fc3f7', 1.2);
                            this.addParticles(p.target.x, p.target.y, '#4fc3f7', 10);
                            break;
                        case 'meteor':
                            this.addEffect(p.target.x, p.target.y, 'explosion', '#ff4400', 1.8);
                            this.addParticles(p.target.x, p.target.y, '#ff4400', 20);
                            break;
                        case 'meteor_storm':
                            this.addEffect(p.target.x, p.target.y, 'explosion', '#ff4400', 2.0);
                            this.addParticles(p.target.x, p.target.y, '#ff6600', 24);
                            this.addParticles(p.target.x, p.target.y, '#ffaa00', 16);
                            break;
                        case 'frost_nova':
                            this.addEffect(p.target.x, p.target.y, 'nova', '#4fc3f7', 1.6);
                            this.addEffect(p.target.x, p.target.y, 'nova', '#b3e5fc', 1.2);
                            this.addParticles(p.target.x, p.target.y, '#4fc3f7', 16);
                            break;
                        case 'arcane_blast':
                            this.addEffect(p.target.x, p.target.y, 'explosion', '#bb86fc', 1.5);
                            this.addEffect(p.target.x, p.target.y, 'nova', '#d1b3ff', 1.3);
                            this.addParticles(p.target.x, p.target.y, '#bb86fc', 16);
                            break;
                        case 'shadow_blade':
                            this.addEffect(p.target.x, p.target.y, 'slash', '#4a148c', 1.3);
                            this.addParticles(p.target.x, p.target.y, '#4a148c', 10);
                            break;
                        case 'blade_slash':
                            this.addEffect(p.target.x, p.target.y, 'slash', '#bbdefb', 1.4);
                            this.addParticles(p.target.x, p.target.y, '#90caf9', 12);
                            break;
                        case 'multi_slash':
                            this.addEffect(p.target.x, p.target.y, 'slash', '#e0e0e0', 1.4);
                            this.addEffect(p.target.x, p.target.y, 'slash', '#ffffff', 1.2);
                            this.addParticles(p.target.x, p.target.y, '#e0e0e0', 14);
                            break;
                        case 'whirlwind':
                            this.addEffect(p.target.x, p.target.y, 'slash', '#ffaa44', 1.5);
                            this.addEffect(p.target.x, p.target.y, 'nova', '#ffaa44', 1.3);
                            this.addParticles(p.target.x, p.target.y, '#ffaa44', 14);
                            break;
                        case 'charge_burst':
                            this.addEffect(p.target.x, p.target.y, 'explosion', '#d32f2f', 1.5);
                            this.addParticles(p.target.x, p.target.y, '#d32f2f', 14);
                            break;
                        case 'earth_crack':
                            this.addEffect(p.target.x, p.target.y, 'explosion', '#795548', 1.5);
                            this.addEffect(p.target.x, p.target.y, 'nova', '#a1887f', 1.2);
                            this.addParticles(p.target.x, p.target.y, '#795548', 16);
                            break;
                        case 'soul_drain':
                            this.addEffect(p.target.x, p.target.y, 'dark', '#7b1fa2', 1.4);
                            this.addParticles(p.target.x, p.target.y, '#7b1fa2', 12);
                            break;
                        case 'soul_storm':
                            this.addEffect(p.target.x, p.target.y, 'dark', '#6a1b9a', 1.7);
                            this.addEffect(p.target.x, p.target.y, 'explosion', '#9c27b0', 1.4);
                            this.addParticles(p.target.x, p.target.y, '#6a1b9a', 18);
                            break;
                        case 'curse_wave':
                            this.addEffect(p.target.x, p.target.y, 'dark', '#4a148c', 1.4);
                            this.addParticles(p.target.x, p.target.y, '#4a148c', 12);
                            break;
                        case 'death_scythe':
                            this.addEffect(p.target.x, p.target.y, 'slash', '#37474f', 1.4);
                            this.addEffect(p.target.x, p.target.y, 'dark', '#263238', 1.2);
                            this.addParticles(p.target.x, p.target.y, '#37474f', 12);
                            break;
                        case 'shield_aura':
                            this.addEffect(p.target.x, p.target.y, 'shield', '#4fc3f7', 1.4);
                            this.addParticles(p.target.x, p.target.y, '#4fc3f7', 12);
                            break;
                        case 'mark_x':
                            this.addEffect(p.target.x, p.target.y, 'hit', '#c62828', 1.3);
                            this.addParticles(p.target.x, p.target.y, '#c62828', 10);
                            break;
                        case 'fan_knives':
                            this.addEffect(p.target.x, p.target.y, 'slash', '#b0bec5', 1.3);
                            this.addParticles(p.target.x, p.target.y, '#b0bec5', 12);
                            break;
                        case 'dark_bolt':
                            this.addEffect(p.target.x, p.target.y, 'dark', '#9c27b0', 1.3);
                            this.addParticles(p.target.x, p.target.y, '#9c27b0', 12);
                            break;
                        default:
                            this.addEffect(p.target.x, p.target.y, 'hit', '#fff', 1);
                            this.addParticles(p.target.x, p.target.y, '#fff', 6);
                    }
                }
                this.projectiles.splice(j, 1);
            }
        }
    },

    // ======================== 状态效果系统 ========================

    // 应用状态效果
    applyStatusEffect: function(target, effectId, caster, durationOverride, baseChance) {
        if (!target || !target.alive || !STATUS_EFFECTS[effectId]) return;
        var effDef = STATUS_EFFECTS[effectId];
        if (!target.statusEffects) target.statusEffects = [];

        // 计算命中率
        var hitChance = baseChance || 0.3;
        if (caster && caster.isAlly) {
            // 友方施加：使用效果命中
            var casterHit = caster.effectHit !== undefined ? caster.effectHit : 0;
            var targetRes = target.effectRes !== undefined ? target.effectRes : 0;
            hitChance = (baseChance || 0.3) * (1 + casterHit / 100) * (1 - targetRes / 100);
        } else if (caster && !caster.isAlly) {
            // 敌方施加：敌人基础命中30%
            var targetRes = target.effectRes !== undefined ? target.effectRes : 0;
            hitChance = (baseChance || 0.3) * (1 - targetRes / 100);
        }
        hitChance = Math.max(0.05, Math.min(0.95, hitChance));
        if (Math.random() > hitChance) return;

        var duration = durationOverride || effDef.duration || 3000;

        if (effDef.stackable) {
            // 可叠加效果（如中毒）
            var existing = null;
            for (var i = 0; i < target.statusEffects.length; i++) {
                if (target.statusEffects[i].id === effectId) {
                    existing = target.statusEffects[i];
                    break;
                }
            }
            if (existing) {
                existing.stacks = Math.min(existing.stacks + 1, effDef.maxStacks || 3);
                existing.duration = duration;
                existing.timer = duration;
            } else {
                target.statusEffects.push({
                    id: effectId,
                    timer: duration,
                    duration: duration,
                    tickTimer: 0,
                    stacks: 1
                });
            }
        } else {
            // 不可叠加效果：刷新持续时间
            var existing = null;
            for (var i = 0; i < target.statusEffects.length; i++) {
                if (target.statusEffects[i].id === effectId) {
                    existing = target.statusEffects[i];
                    break;
                }
            }
            if (existing) {
                existing.timer = duration;
                existing.duration = duration;
                existing.tickTimer = 0;
            } else {
                target.statusEffects.push({
                    id: effectId,
                    timer: duration,
                    duration: duration,
                    tickTimer: 0,
                    stacks: 1
                });
            }
        }
        // 状态效果日志
        var effCasterLabel = (caster && caster.name) ? caster.name : '';
        if (caster && caster.isAlly) {
            this.addBattleLog(effCasterLabel + ' 对 ' + target.name + ' 施加了 ' + effDef.name + ' 效果', 'info');
        } else {
            this.addBattleLog(target.name + ' 被施加了 ' + effDef.name + ' 效果', 'info');
        }
    },

    // 更新单个单位的状态效果
    updateUnitStatusEffects: function(unit, dt) {
        if (!unit.statusEffects || unit.statusEffects.length === 0) return;
        for (var i = unit.statusEffects.length - 1; i >= 0; i--) {
            var eff = unit.statusEffects[i];
            var effDef = STATUS_EFFECTS[eff.id];
            if (!effDef) { unit.statusEffects.splice(i, 1); continue; }

            eff.timer -= dt;
            eff.tickTimer += dt;

            // 周期性效果
            if (effDef.tickInterval > 0 && eff.tickTimer >= effDef.tickInterval) {
                eff.tickTimer = 0;
                // 伤害效果
                if (effDef.tickDmg) {
                    // 燃烧/中毒伤害基于敌人的atk（若为debuff）或施法者相关的atk
                    // 这里使用单位最大HP的百分比
                    var dmg = Math.max(1, Math.floor(unit.maxHp * effDef.tickDmg * eff.stacks));
                    // 优先扣除白甲护盾
                    dmg = this._consumeShield(unit, dmg);
                    unit.hp -= dmg;
                    this.showDmgNum(unit, dmg, false);
                    this.addEffect(unit.x, unit.y, 'hit', effDef.color, 0.5);
                    if (unit.hp <= 0) {
                        unit.hp = 0;
                        unit.alive = false;
                        if (unit.isAlly) {
                            this.addBattleLog(unit.name + ' 因状态效果死亡', 'death');
                        }
                    }
                }
                // 治疗效果
                if (effDef.tickHeal) {
                    var heal = Math.max(1, Math.floor(unit.maxHp * effDef.tickHeal));
                    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
                    this.addEffect(unit.x, unit.y, 'heal', '#4caf50', 0.5);
                }
            }

            // 过期移除
            if (eff.timer <= 0) {
                unit.statusEffects.splice(i, 1);
            }
        }
    },

    // 更新所有单位的状态效果（总调度）
    updateStatusEffects: function(dt) {
        // 状态效果已通过 updateUnitStatusEffects 在 updateAllies/updateEnemies 中更新
        // 此函数可用于未来的全局状态效果处理
    },

    // ★ v5.0: 套装效果每帧处理
    //   处理: 圣光套护盾计时、狂战套狂暴计时、暗影套标记过期
    _processSetEffects: function(dt) {
        for (var i = 0; i < this.allies.length; i++) {
            var ally = this.allies[i];
            if (!ally.alive) continue;
            var se = ally._activeSetEffects;
            if (!se || !se.setId || !se.has4pc) continue;

            var sd = SET_DATA[se.setId];
            if (!sd || !sd.bonus4) continue;

            switch (se.setId) {
                // ===== 圣光套：每10秒全队护盾 =====
                case 'holy_set': {
                    ally._holyShieldTimer = (ally._holyShieldTimer || 0) + dt;
                    if (ally._holyShieldTimer >= (sd.bonus4.interval || 10000)) {
                        ally._holyShieldTimer = 0;
                        // 给全队施加护盾
                        var shieldAmt = Math.floor(ally.maxHp * (sd.bonus4.shieldPct || 0.05));
                        for (var j = 0; j < this.allies.length; j++) {
                            var tgt = this.allies[j];
                            if (!tgt || !tgt.alive) continue;
                            tgt.shieldHp = shieldAmt;
                            tgt.shieldMax = shieldAmt;
                            // 金色护盾特效
                            this.addEffect(tgt.x, tgt.y, 'shield', '#ffd700', 1.5);
                            this.addParticles(tgt.x, tgt.y, '#ffd700', 6);
                        }
                        this.addBattleLog(ally.name + ' [圣光套] 全队获得' + shieldAmt + '点护盾!', 'shield');
                    }
                    break;
                }
                // ===== 狂战套：HP检测 + 狂暴计时 =====
                case 'berserker_set': {
                    if (ally._berserkerActive) {
                        ally._berserkerTimer -= dt;
                        if (ally._berserkerTimer <= 0) {
                            ally._berserkerActive = false;
                            ally._berserkerTimer = 0;
                            this.addBattleLog(ally.name + ' 狂暴效果结束', 'info');
                        }
                    } else {
                        // HP < 30% 时触发狂暴
                        var hpPct = ally.hp / ally.maxHp;
                        if (hpPct <= (sd.bonus4.berserkHpPct || 0.30)) {
                            ally._berserkerActive = true;
                            ally._berserkerTimer = sd.bonus4.berserkDuration || 5000;
                            // 红色狂暴特效
                            this.addEffect(ally.x, ally.y, 'buff', '#ff2200', 2.0);
                            this.addParticles(ally.x, ally.y, '#ff2200', 12);
                            this.addBattleLog(ally.name + ' [狂战套] 进入狂暴状态! 伤害+40%持续5秒', 'buff');
                        }
                    }
                    break;
                }
                // ===== 暗影套：标记过期 =====
                case 'shadow_assassin_set': {
                    // 标记在 _shadowMark 中存储目标ID，每次攻击时检查
                    // 标记在攻击后消费（标记是一次性的）
                    break;
                }
            }
        }
    },

    // ======================== 敌人技能系统 ========================

    tryCastEnemySkill: function(enemy, dt) {
        if (!enemy.monsterSkills || enemy.monsterSkills.length === 0) return;
        if (!enemy.skillCd) enemy.skillCd = {};

        for (var si = 0; si < enemy.monsterSkills.length; si++) {
            var skillId = enemy.monsterSkills[si];
            var skill = ENEMY_SKILLS[skillId];
            if (!skill) continue;

            var cdKey = 'enemy_' + skillId;
            enemy.skillCd[cdKey] = (enemy.skillCd[cdKey] || 0) + dt;
            if (enemy.skillCd[cdKey] < skill.cd * 1000) continue;

            // AI条件
            if (skill.aiCondition === 'hp_low' && enemy.hp / enemy.maxHp > 0.3) continue;
            if (skill.aiCondition === 'enemy_dense') {
                var aliveAllies = this.allies.filter(function(a) { return a.alive; }).length;
                if (aliveAllies < 2) continue;
            }
            if (Math.random() > (skill.chance || 0.4)) continue;

            enemy.skillCd[cdKey] = 0;
            this.castEnemySkill(enemy, skill);
        }
    },

    castEnemySkill: function(enemy, skill) {
        var target = enemy.target;
        if (!target || !target.alive) {
            var frontAllies = this.allies.filter(function(a) { return a.alive; });
            if (frontAllies.length === 0) return;
            target = frontAllies[0];
        }

        enemy.skillFlash = 200;
        this.addBattleLog(enemy.name + ' 使用了 ' + skill.name, 'info');
        this.showSkillName(enemy, skill.name);

        // 多段伤害
        var dmg = 0;
        if (skill.multiplier) {
            dmg = Math.max(1, Math.floor(enemy.atk * skill.multiplier - (target.def || 0) * 0.3));
        } else if (skill.flatDmg) {
            dmg = skill.flatDmg;
        }

        // 弹道效果
        if (skill.projectile) {
            this.addProjectile(enemy, target, skill.projectile, skill.color || '#ff6666');
        } else {
            // 直接命中特效
            target.hitFlash = 120;
            var effType = skill.effect || 'hit';
            this.addEffect(target.x, target.y, effType, skill.color || '#ff6666', 1.2);
            this.addParticles(target.x, target.y, skill.color || '#ff6666', 8);
        }

        if (dmg > 0) {
            if (skill.isCrit && chance(0.2)) {
                dmg = Math.floor(dmg * 1.5);
                this.showDmgNum(target, dmg, true);
                this.addBattleLog(enemy.name + ' 的 ' + skill.name + ' 对 ' + target.name + ' 造成 ' + dmg + ' 点伤害（暴击！）', 'damage');
            } else {
                this.showDmgNum(target, dmg, false);
                this.addBattleLog(enemy.name + ' 的 ' + skill.name + ' 对 ' + target.name + ' 造成 ' + dmg + ' 点伤害', 'damage');
            }
            // 优先扣除白甲护盾
            dmg = this._consumeShield(target, dmg);
            target.hp -= dmg;
            if (target.hp <= 0) {
                target.hp = 0;
                target.alive = false;
            }
        }

        // 状态效果附加
        if (skill.statusEffect) {
            this.applyStatusEffect(target, skill.statusEffect, enemy, skill.statusDuration, skill.statusChance);
        }
        // 范围效果
        if (skill.aoe) {
            var allies = this.allies.filter(function(a) { return a.alive && a.id !== target.id; });
            if (skill.statusEffect) {
                for (var i = 0; i < Math.min(allies.length, 2); i++) {
                    this.applyStatusEffect(allies[i], skill.statusEffect, enemy, skill.statusDuration, skill.statusChance * 0.5);
                }
            }
        }
        // 自我增益
        if (skill.selfBuff) {
            this.applyStatusEffect(enemy, skill.selfBuff, enemy, skill.buffDuration);
            var selfEffDef = STATUS_EFFECTS[skill.selfBuff];
            if (selfEffDef) {
                this.addBattleLog(enemy.name + ' 获得 ' + selfEffDef.name + ' 效果！', 'info');
            }
        }
    },

    // 显示伤害/治疗数字
    showDmgNum: function(unit, val, isCrit, isHeal, customColor) {
        var area = document.getElementById('battle-area');
        var el = document.createElement('div');
        if (isHeal) {
            el.className = 'dmg-number heal';
            el.textContent = '+' + val;
            el.style.color = customColor || '#4caf50';
        } else {
            el.className = 'dmg-number' + (isCrit ? ' critical' : '');
            el.textContent = '-' + val + (isCrit ? '!' : '');
            el.style.color = customColor || (isCrit ? '#ff5722' : '#fff');
        }
        el.style.left = unit.x + 'px';
        el.style.top = unit.y + 'px';
        area.appendChild(el);
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
    },

    // 显示技能名称
    showSkillName: function(unit, skillName) {
        var el = document.createElement('div');
        el.className = 'skill-name';
        el.textContent = skillName;
        el.style.left = unit.x + 'px';
        el.style.top = (unit.y - 40) + 'px';
        document.getElementById('battle-area').appendChild(el);
        var self = this;
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
    },

    // 显示掉落
    showLootDrop: function(text, x, y) {
        var area = document.getElementById('battle-area');
        var el = document.createElement('div');
        el.className = 'loot-drop';
        el.textContent = text;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        area.appendChild(el);
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1500);
    },

    // 怪物击杀事件
    onMonsterKilled: function(monster, loot, attacker) {
        // 经验分配：击杀者获得70%，其他存活队友平分30%
        // 注意：只给 this.allies（上阵英雄）分配经验，未上阵的英雄不获得经验
        var aliveAllies = this.allies.filter(function(a) { return a.alive; });
        // 应用转生经验加成
        var rebirthBonuses = (typeof getRebirthBonuses === 'function') ? getRebirthBonuses() : { expGain: 0 };
        // 应用每日轮转加成（周五经验×2）
        var dailyBonus = (typeof getDailyBonus === 'function') ? getDailyBonus() : null;
        var dailyExpMult = (dailyBonus && dailyBonus.expMult) ? dailyBonus.expMult : 1;
        var expMult = (1 + (rebirthBonuses.expGain || 0) / 100) * dailyExpMult;
        var totalExp = Math.floor((monster.exp || 0) * expMult);
        if (attacker && aliveAllies.length > 1) {
            // 有明确击杀者且多人存活，按7:3分配
            var killerExp = Math.floor(totalExp * 0.7);
            var restExp = totalExp - killerExp;
            var restPerHero = Math.floor(restExp / (aliveAllies.length - 1));
            for (var i = 0; i < aliveAllies.length; i++) {
                var ally = aliveAllies[i];
                var hero=null;var _es5_24=(GameState.get('heroes') || []);for(var _es5_25=0;_es5_25<_es5_24.length;_es5_25++){if(_es5_24[_es5_25].id === ally.id){hero=_es5_24[_es5_25];break;}};
                if (hero) {
                    var expGain = (ally.id === attacker.id) ? killerExp : restPerHero;
                    var oldLevel = hero.level;
                    hero.exp = (hero.exp || 0) + expGain;
                    checkLevelUp(hero);
                    if (hero.level > oldLevel) {
                        this.addBattleLog('🌟 ' + hero.name + ' 升级！Lv.' + oldLevel + ' → Lv.' + hero.level, 'level');
                    }
                    ally.level = hero.level;
                    ally.exp = hero.exp;
                    ally.expToNext = hero.expToNext;
                }
            }
        } else {
            // 没有击杀者信息或只剩一人，均分
            var expPerHero = aliveAllies.length > 0 ? Math.floor(totalExp / aliveAllies.length) : 0;
            for (var i = 0; i < aliveAllies.length; i++) {
                var ally = aliveAllies[i];
                var hero=null;var _es5_26=(GameState.get('heroes') || []);for(var _es5_27=0;_es5_27<_es5_26.length;_es5_27++){if(_es5_26[_es5_27].id === ally.id){hero=_es5_26[_es5_27];break;}};
                if (hero) {
                    var oldLevel2 = hero.level;
                    hero.exp = (hero.exp || 0) + expPerHero;
                    checkLevelUp(hero);
                    if (hero.level > oldLevel2) {
                        this.addBattleLog('🌟 ' + hero.name + ' 升级！Lv.' + oldLevel2 + ' → Lv.' + hero.level, 'level');
                    }
                    ally.level = hero.level;
                    ally.exp = hero.exp;
                    ally.expToNext = hero.expToNext;
                }
            }
        }
        // 战斗统计：击杀数追踪
        if (attacker && attacker.isAlly) {
            var killerName = attacker.name || '未知';
            this._battleStats.kills[killerName] = (this._battleStats.kills[killerName] || 0) + 1;
        }
        // 加金币
        if (gameState) {
            // 应用转生金币加成
            var rebirthBonuses = (typeof getRebirthBonuses === 'function') ? getRebirthBonuses() : { goldFind: 0 };
            // 应用每日轮转加成（周一金币×3）
            var dailyBonus = (typeof getDailyBonus === 'function') ? getDailyBonus() : null;
            var dailyGoldMult = (dailyBonus && dailyBonus.goldMult) ? dailyBonus.goldMult : 1;
            var goldMult = (1 + (rebirthBonuses.goldFind || 0) / 100) * dailyGoldMult;
            var finalGold = Math.floor(loot.gold * goldMult);
            var activeCampBuff = GameState.get('activeCampBuff');
            if (gameState && activeCampBuff && activeCampBuff.expiry > Date.now() &&
                activeCampBuff.buff && activeCampBuff.buff.stat === 'goldBonus') {
                finalGold = Math.floor(finalGold * (1 + (activeCampBuff.buff.pct || 0)));
            }
            GameState.mutate('gold', function(g) { return (g || 0) + finalGold; });
            GameState.mutate('monstersKilled', function(v) { return (v || 0) + 1; });
            if (typeof GameState.get('dailyKills') === 'number') GameState.mutate('dailyKills', function(v) { return v + 1; });
            // 成就追踪
            GameState.mutate('totalKills', function(v) { return (v || 0) + 1; });
            var newTotalKills = GameState.get('totalKills') || 0;
            GameState.mutate('totalGoldEarned', function(v) { return (v || 0) + finalGold; });
            var newTotalGoldEarned = GameState.get('totalGoldEarned') || 0;
            // ★ v3.5.0 每日任务：金币累计
            if (typeof GameState.get('dailyGoldEarned') === 'number') GameState.mutate('dailyGoldEarned', function(v) { return v + finalGold; });
            checkAchievements('totalKills', newTotalKills);
            checkAchievements('totalGold', newTotalGoldEarned);
            updateResources();
            updateMainTeamPower();

            // 掉落物
            if (loot.equipDrop) {
                if (addToInventory(loot.equipDrop)) {
                    // 成就追踪
                    GameState.mutate('totalEquipObtained', function(v) { return (v || 0) + 1; });
                    checkAchievements('totalEquip', GameState.get('totalEquipObtained') || 0);
                    checkAchievements('qualityOwn', loot.equipDrop.quality);
                    this.showLootDrop('装备+' + loot.equipDrop.name, monster.x, monster.y);
                    this.addBattleLog('获得装备: ' + getQualityName(loot.equipDrop.quality) + ' ' + loot.equipDrop.name + ' (评分:' + loot.equipDrop.score + ')', 'loot');
                }
            }
            if (loot.gemDrop) {
                if (addGemToInventory(loot.gemDrop)) {
                    this.showLootDrop('宝石+' + loot.gemDrop.gemType.name, monster.x, monster.y);
                    this.addBattleLog('获得宝石: ' + loot.gemDrop.gemType.name + ' Lv.' + loot.gemDrop.level, 'loot');
                }
            }

            // 宠物食物掉落 (8%概率, 1-2个)
            if (chance(0.08)) {
                var foodAmt = 1 + Math.floor(Math.random() * 2);
                GameState.mutate('petFood', function(v) { return (v || 0) + foodAmt; });
                this.showLootDrop('🍖+' + foodAmt, monster.x, monster.y + 36);
                this.addBattleLog('🍖 宠物食物 +' + foodAmt);
            }
            
            // 金币和经验日志
            if (loot.gold > 0 || loot.exp > 0) {
                this.addBattleLog('击杀 ' + monster.name + '，获得经验+' + loot.exp + ' 金币+' + finalGold, 'reward');
            }
        }

        // 更新怪物计数
        var count = this.enemies.filter(function(e) { return e.alive; }).length;
        document.getElementById('monster-count').textContent = '怪物: ' + count + '/' + this.waveSpawnCount
    },

    // 关卡完成
    onWaveComplete: function() {
        // ★ v3.0: 新手教程 — 第一波完成
        if (typeof checkTutorialTrigger === 'function' && this.waveNumber <= 2 && !this.isDungeon) {
            checkTutorialTrigger('first_wave_clear');
        }
        // 全灭等待中：跳过胜利 BGM 与奖励，避免与失败 BGM/状态冲突
        if (this.deathTimerInit) return;
        // 副本模式：通关发放奖励后退出
        if (this.isDungeon) {
            if (this._handleModeWaveComplete()) return;
        }
        AudioManager.play('victory');
        // BGM：胜利短曲（2.5s 后自动回到和平）
        if (typeof AudioManager !== 'undefined' && AudioManager.playBGM) {
            AudioManager.playBGM('victory');
        }

        // 判断是否为章节完成（当前waveNumber是20的倍数）
        var isChapterEnd = (this.waveNumber % 20 === 0);

        if (isChapterEnd && !this.autoBattle) {
            // 手动模式 + 章节完成：暂停等待点击下一章
            this.waitingNextChapter = true;
            var btn = document.getElementById('btn-next-chapter');
            if (btn) btn.style.display = 'block';
            document.getElementById('wave-status').textContent = '✦ 章节完成！点击[进入下一章] ✦';
            var display = this.getLevelDisplay();
            document.getElementById('wave-number').textContent = display + '（完成）';
            this.addBattleLog('✦ 章节完成！点击[进入下一章]进入下一章', 'reward');
            // 仍然恢复角色状态但不推进关卡
            this.healSurvivors();
            processAutoLoot();
            return;
        }

        // 自动模式 或 非章节边界：正常推进关卡
        if (!isChapterEnd && !this.autoBattle) {
            // 手动模式非章节边界：重复当前关卡（waveNumber不变）
            this.addBattleLog('✓ 关卡完成！重复当前关卡', 'info');
        } else {
            // 自动模式：正常推进
            this.waveNumber++;
        }

        if (gameState) {
            GameState.set('wave', this.waveNumber);
            // 每20关一章
            var newStage = Math.floor((this.waveNumber - 1) / 20) + 1;
            GameState.set('stage', newStage);
            this.stage = newStage;
            // 更新已通关最大章节
            var maxStage = GameState.get('maxStage');
            if (maxStage === undefined) GameState.set('maxStage', 1);
            GameState.set('maxStage', Math.max(GameState.get('maxStage') || 1, newStage));
            // 成就追踪
            if (typeof checkAchievements === 'function') {
                checkAchievements('stage', GameState.get('maxStage'));
            }
            // 更新章节信息
            var stageName = getStageName(newStage);
            var recPower = getRecommendedPower(newStage);
            document.getElementById('stage-info').textContent = '第 ' + newStage + ' 章 - ' + stageName + ' [推荐战力:' + (typeof formatNumber === 'function' ? formatNumber(recPower) : recPower) + ']';
            // 更新主界面队伍战力
            updateMainTeamPower();
        }

        // 恢复角色状态
        this.healSurvivors();

        var display = this.getLevelDisplay();
        var count = this.calculateLevelMonsterCount(this.stage);
        document.getElementById('wave-status').textContent = '关卡完成！';
        document.getElementById('wave-number').textContent = display + '（准备）';
        this.addBattleLog('✓ 关卡完成！下一关 ' + display + ' 即将来袭 (' + count + '只怪物)', 'info');
        // 关卡完成后自动处理装备
        processAutoLoot();
        // 显示战斗统计简表
        this._showBattleStatsOverlay();
    },

    // 战斗统计简表（波次完成后弹出，3秒自动消失）
    _showBattleStatsOverlay: function() {
        var stats = this._battleStats;
        if (!stats || !stats.startTime) return;
        // 移除旧的 overlay
        var old = document.getElementById('battle-stats-overlay');
        if (old) old.remove();

        var elapsed = ((performance.now() - stats.startTime) / 1000).toFixed(1);
        var killEntries = [];
        for (var name in stats.kills) {
            killEntries.push(name + ':' + stats.kills[name]);
        }
        var killStr = killEntries.length > 0 ? killEntries.join(' ') : '无';
        var totalKills = 0;
        for (var k in stats.kills) totalKills += stats.kills[k];

        var overlay = document.createElement('div');
        overlay.id = 'battle-stats-overlay';
        overlay.innerHTML =
            '<div style="font-size:12px;color:#ffd700;font-weight:bold;margin-bottom:4px;">⚔ 战斗统计</div>' +
            '<div style="font-size:11px;color:#ccc;">伤害输出: <span style="color:#ff5252;font-weight:bold;">' + (typeof formatNumber === 'function' ? formatNumber(stats.damageDealt) : stats.damageDealt) + '</span></div>' +
            '<div style="font-size:11px;color:#ccc;">承受伤害: <span style="color:#ff9800;font-weight:bold;">' + (typeof formatNumber === 'function' ? formatNumber(stats.damageTaken) : stats.damageTaken) + '</span></div>' +
            '<div style="font-size:11px;color:#ccc;">击杀: <span style="color:#4caf50;font-weight:bold;">' + totalKills + '</span> | 治疗: <span style="color:#66ff66;font-weight:bold;">' + (typeof formatNumber === 'function' ? formatNumber(stats.healing) : stats.healing) + '</span></div>' +
            '<div style="font-size:10px;color:#888;margin-top:3px;">耗时 ' + elapsed + 's ｜ 点击关闭</div>';
        overlay.addEventListener('click', function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); });
        document.body.appendChild(overlay);
        // 3秒自动消失
        setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 3000);
    },

    // 详细战斗统计弹窗
    showDetailedBattleStats: function() {
        var stats = this._battleStats;
        if (!stats || !stats.startTime) {
            if (typeof showToast === 'function') showToast('尚无战斗数据', 'info');
            return;
        }
        var elapsed = ((performance.now() - stats.startTime) / 1000).toFixed(1);
        var killEntries = [];
        for (var name in stats.kills) {
            killEntries.push('<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12px;"><span>' + name + '</span><span style="color:#ffd700;font-weight:bold;">' + stats.kills[name] + ' 击杀</span></div>');
        }
        var killHtml = killEntries.length > 0 ? killEntries.join('') : '<div style="font-size:12px;color:#888;text-align:center;">暂无击杀</div>';

        var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="max-width:320px;border:1px solid rgba(255,215,0,0.4);border-radius:12px;position:relative;">' +
            '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span>' +
            '<h3 style="text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:8px;">📊 详细战斗统计</h3>' +
            '<div style="padding:6px 0;">' +
            '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;"><span>⏱ 战斗耗时</span><span style="color:#fff;font-weight:bold;">' + elapsed + 's</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;"><span>⚔ 伤害输出</span><span style="color:#ff5252;font-weight:bold;">' + (typeof formatNumber === 'function' ? formatNumber(stats.damageDealt) : stats.damageDealt) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;"><span>🛡 承受伤害</span><span style="color:#ff9800;font-weight:bold;">' + (typeof formatNumber === 'function' ? formatNumber(stats.damageTaken) : stats.damageTaken) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;"><span>💚 总治疗量</span><span style="color:#66ff66;font-weight:bold;">' + (typeof formatNumber === 'function' ? formatNumber(stats.healing) : stats.healing) + '</span></div>' +
            '</div>' +
            '<div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">' +
            '<div style="font-size:12px;color:#aaa;margin-bottom:4px;">击杀详情</div>' +
            killHtml +
            '</div>' +
            '<button class="btn" style="width:100%;margin-top:10px;" onclick="this.closest(\'.modal-overlay\').remove()">关闭</button>' +
            '</div></div>';
        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
    },

    // 通关后恢复角色状态（全员复活 + 满血满蓝）+ 同步最新属性
    healSurvivors: function() {
        // ★ 同步战斗中的角色属性与 gameState 保持一致（升级/换装/宝石/天赋变更后）
        this.syncAllyStats();
        
        var revivedCount = 0;
        for (var r = 0; r < this.allies.length; r++) {
            var a = this.allies[r];
            if (!a) continue;
            if (!a.alive) {
                revivedCount++;
                a.alive = true;
            }
            a.hp = a.maxHp;
            a.mp = a.maxMp;
            a.statusEffects = [];
            a.buffs = [];
            // ★ v2.6.4 BUG#G 修复: 章节通关后重置白甲(临时护盾 = holy_shield / shield_bash / mana_shield
            //   加的 shieldHp / shieldMax, 持续 5 秒, 通关后新关卡不该继承). 之前只清 statusEffects/buffs
            //   但没清 shieldHp, 玩家反馈 "骑士的白甲没有被重置掉"
            a.shieldHp = 0;
            a.shieldMax = 0;
            a.tauntTimer = 0;
            a.atkTimer = 0;
            a.skillCd = {};
        }
        if (revivedCount > 0) {
            this.addBattleLog('✦ 休整阶段：全员复活，生命/法力全满（复活了 ' + revivedCount + '名英雄）', 'reward');
        } else {
            this.addBattleLog('✦ 休整阶段：全员生命/法力全满', 'reward');
        }
    },

    // ★ 同步战斗中的角色属性（每次休整时调用，确保升级/换装/宝石/天赋变更后属性及时更新）
    syncAllyStats: function() {
        if (!gameState || !GameState.get('heroes') || !this.allies) return;
        for (var i = 0; i < this.allies.length; i++) {
            var ally = this.allies[i];
            if (!ally) continue;
            var hero=null;var _es5_28=(GameState.get('heroes') || []);for(var _es5_29=0;_es5_29<_es5_28.length;_es5_29++){if(_es5_28[_es5_29].id === ally.id){hero=_es5_28[_es5_29];break;}};
            if (!hero) continue;
            var clsData = getClassData(hero.classId);
            if (!clsData) continue;
            
            // 保留当前 HP/MP 百分比
            var hpPct = ally.maxHp > 0 ? ally.hp / ally.maxHp : 1;
            var mpPct = ally.maxMp > 0 ? ally.mp / ally.maxMp : 1;
            
            // 重新计算属性
            var stats = this.calcAllyStats(hero, clsData);
            
            // 重新计算最大法力（含被动加成）
            var skillIds = hero.skills || clsData.skills || [];
            var finalMaxMp = clsData.baseMp || 80;
            for (var si = 0; si < skillIds.length; si++) {
                var sk = SKILL_DATA[skillIds[si]];
                if (sk && sk.type === 'passive') {
                    var slv = (hero.skillLevels && hero.skillLevels[skillIds[si]]) || 0;
                    if (slv > 0 && sk.mpBonusPct) {
                        finalMaxMp += Math.floor(finalMaxMp * sk.mpBonusPct);
                    }
                }
            }
            
            // 更新战斗角色属性
            ally.level = hero.level || 1;
            ally.exp = hero.exp || 0;
            ally.expToNext = hero.expToNext || 50;
            ally.maxHp = stats.hp;
            ally.maxMp = finalMaxMp;
            ally.atk = stats.atk;
            ally.def = stats.def;
            ally.spd = stats.spd;
            ally.crit = stats.crit;
            ally.critDmg = stats.critDmg;
            ally.effectHit = stats.effectHit || 0;
            ally.effectRes = stats.effectRes || 0;
            ally.equip = hero.equip || {};
            
            // 按比例调整当前 HP/MP（适应新的最大值）
            ally.hp = Math.min(ally.hp, Math.floor(ally.maxHp * Math.min(hpPct, 1)));
            ally.mp = Math.min(ally.mp, Math.floor(ally.maxMp * Math.min(mpPct, 1)));
            ally.hp = Math.max(1, Math.min(ally.hp, ally.maxHp));
            ally.mp = Math.max(0, Math.min(ally.mp, ally.maxMp));
        }
    },

    // 进入下一章
    advanceToNextChapter: function() {
        this.waitingNextChapter = false;
        // BGM：进入新章节前先播放和平
        if (typeof AudioManager !== 'undefined' && AudioManager.playBGM) {
            AudioManager.playBGM('peace');
        }
        // 隐藏下一章按钮
        var btn = document.getElementById('btn-next-chapter');
        if (btn) btn.style.display = 'none';

        // 推进到下一章
        this.waveNumber++;
        this._passiveReviveCount = {};  // 重置复活术计数器

        if (gameState) {
            GameState.set('wave', this.waveNumber);
            var newStage = Math.floor((this.waveNumber - 1) / 20) + 1;
            GameState.set('stage', newStage);
            this.stage = newStage;
            var maxStage = GameState.get('maxStage');
            if (maxStage === undefined) GameState.set('maxStage', 1);
            GameState.set('maxStage', Math.max(GameState.get('maxStage') || 1, newStage));
            // 成就追踪
            if (typeof checkAchievements === 'function') {
                checkAchievements('stage', GameState.get('maxStage'));
            }
            var stageName = getStageName(newStage);
            var recPower = getRecommendedPower(newStage);
            document.getElementById('stage-info').textContent = '第 ' + newStage + ' 章 - ' + stageName + ' [推荐战力:' + (typeof formatNumber === 'function' ? formatNumber(recPower) : recPower) + ']';
            updateMainTeamPower();
        }

        // 恢复角色状态
        this.healSurvivors();

        this.addBattleLog('✦ 进入 ' + this.getLevelDisplay() + '！', 'reward');
        // 立即开始新波次
        this.waveState = 'resting';
        this.restTimer = 1000;
        document.getElementById('wave-status').textContent = '进入下一章...';
    },

    // ======================== 副本模式 ========================

    // 开始副本战斗
    startDungeonBattle: function(type, level) {
        if (this.isDungeon) { console.warn('[Battle] 已在地牢中,忽略重复进入'); return; }
        // ★ BUG#1 修复强化：进入副本时彻底停止主战场 gameLoop，
        // 避免主战场 update 干扰副本战斗（之前仅保存状态，但主战场循环仍会跑）
        if (this.isRunning) {
            this.stopBattle();
        }

        // 保存当前正常战斗状态
        // 备份主线统计数据
        this._savedBattleStats = this._battleStats;
        this._battleStats = { damageDealt: 0, damageTaken: 0, kills: {}, healing: 0, startTime: Date.now() };
        this.savedNormalState = {
            waveNumber: this.waveNumber,
            stage: this.stage,
            waveSpawnCount: this.waveSpawnCount,
            waveSpawned: this.waveSpawned,
            waveState: this.waveState,
            restTimer: this.restTimer,
            deathTimerInit: this.deathTimerInit,
            autoBattle: this.autoBattle,
            waitingNextChapter: this.waitingNextChapter,
            enemies: this.enemies.slice()  // 保留副本进场时主战场残敌
        };

        this.isDungeon = true;
        this.dungeonType = type;
        this.dungeonLevel = level;

        // 重置副本战斗状态
        this.enemies = [];
        this.waveSpawned = 0;
        this.waveState = 'resting';
        this.restTimer = 500;
        this.deathTimerInit = false;

        // ★ BUG#1 终极修复：把 canvas 引用切到副本独立 canvas
        // （openDungeonBattleModal 已经创建并显示了副本独立 canvas）
        var dungeonCanvas = document.getElementById('dungeon-battle-canvas');
        if (dungeonCanvas) {
            this.switchCanvas(dungeonCanvas);
            var self = this;
            requestAnimationFrame(function() {
                try { self.resize(); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
            });
        }
        // 标记主战场为暂停（退出副本后需要玩家手动点"继续战斗"）
        this._mainBattlePaused = true;

        // 为友方恢复满状态
        for (var di = 0; di < this.allies.length; di++) {
            var a = this.allies[di];
            a.alive = true;
            a.hp = a.maxHp;
            a.mp = a.maxMp;
            a.statusEffects = [];
            a.buffs = [];
            a.atkTimer = 0;
            a.skillCd = {};
        }

        // 根据副本类型和难度设置波次参数（v3 平衡：奖励/效率曲线平滑化）
        var enemyCount, enemyMult;

        // 金币/重铸石/宝石副本使用标准怪物，但属性按难度缩放
        //   v3.3 动态化：怪物数量与属性倍率都随 maxStage 实时调整
        //   详细公式见 js/data/dungeonBalance.js：
        //     resCounts = base[lv] + ⌊maxStage × countGrowth[lv]⌋
        //     resMults  = base[lv] + ⌊maxStage × multGrowth[lv]⌋
        //   maxStage=1 时与旧版完全一致；maxStage=10 时挑战性显著提升。
        if (type === 'gold' || type === 'stone' || type === 'gem') {
            // ★ BUG#2 修复：副本难度以"已通关最大章节 maxStage"为准，不受玩家手动切章影响
            // 避免低章节挑战高难副本的作弊行为
            var maxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
            var dbStage = Math.max(1, Math.floor(maxStage * 0.6));
            this.stage = dbStage;
            this.waveNumber = 1;
            // v3.3 动态化：使用 dungeonBalance.js 全局函数
            enemyCount = getDungeonEnemyCount(level, maxStage);
            enemyMult  = getDungeonEnemyMult(level, maxStage);
            this.waveSpawnCount = enemyCount;
        } else if (type === 'equip') {
            // ★ BUG#3 修复：装备副本难度调整
            // 一级本 难度×2 (倍军 25→50)
            // 二级本 难度×4 (倍军 70→280)
            // 三级本 难度×8 (倍军 130→1040)
            // ★ BUG#2 修复同步：装备副本以玩家已通关最大章节为基准
            var maxStageEquip = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
            this.stage = maxStageEquip;
            this.waveNumber = 1;
            var eqCounts = [18, 32, 40];
            var eqMults = [50, 280, 1040];  // ×2/×4/×8 平衡调整
            enemyCount = eqCounts[level - 1] || 18;
            enemyMult = eqMults[level - 1] || 50;
            this.waveSpawnCount = enemyCount;
        }

        // 设置UI标题
        var typeNames = { gold: '金币副本', stone: '重铸石副本', gem: '宝石副本', equip: '装备副本' };
        var title = typeNames[type] || '副本';
        document.getElementById('wave-status').textContent = title + ' Lv.' + level + ' 开始！';
        document.getElementById('wave-number').textContent = title + ' Lv.' + level;
        this.addBattleLog('✦ 进入 ' + title + ' Lv.' + level + '，消耗 ' + this.getDungeonStaminaCost(type, level) + ' 体力', 'reward');

        // 标记副本敌人强度系数
        this.dungeonEnemyMult = enemyMult;

        this.startBattle();
    },

    // 获取副本体力消耗
    getDungeonStaminaCost: function(type, level) {
        if (type === 'equip') {
            return level === 1 ? 10 : (level === 2 ? 15 : 20);
        }
        return 5;
    },

    // 副本通关奖励
    dungeonReward: function() {
        GameState.set('dailyDungeons', (GameState.get('dailyDungeons') || 0) + 1);
        var type = this.dungeonType;
        var level = this.dungeonLevel;
        var typeNames = { gold: '金币副本', stone: '重铸石副本', gem: '宝石副本', equip: '装备副本' };
        var title = typeNames[type] || '副本';
        var goldReward = 0, stoneReward = 0, gemCount = 0, gemLevel = 1, equipCount = 0;

        // 副本通关奖励（v3.3 随 maxStage 动态调整）
        //   金币/重铸石/宝石都按当前通关最大章节实时缩放
        //   公式：奖励 = base[lv] × (1 + maxStage × scale[lv])
        //   详见 js/data/dungeonBalance.js
        var dungeonRewardMaxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
        var rewardMult = 1;

        if (type === 'gold') {
            // v3.3 动态化: getDungeonGoldReward() 返回金库= base×(1+maxStage×scale)
            //   举例 Lv.5 @ maxStage=1:  60000×3.2 = 192000金
            //   举例 Lv.5 @ maxStage=10: 60000×23 = 1380000金
            var goldReward = getDungeonGoldReward(level, dungeonRewardMaxStage);
            GameState.mutate('gold', function(g) { return (g || 0) + goldReward; });
            this.addBattleLog('✦ ' + title + ' Lv.' + level + ' 通关！获得金币 +' + goldReward, 'reward');
            showToast(title + ' Lv.' + level + ' 通关！金币+' + goldReward, 'success');
        } else if (type === 'stone') {
            // v3.3 动态化: getDungeonStoneReward() 按 1颗重铸石 ≈1000金币同步设计
            var stoneReward = getDungeonStoneReward(level, dungeonRewardMaxStage);
            GameState.mutate('reforgestone', function(v) { return (v || 0) + stoneReward; });
            this.addBattleLog('✦ ' + title + ' Lv.' + level + ' 通关！获得重铸石 +' + stoneReward, 'reward');
            showToast(title + ' Lv.' + level + ' 通关！重铸石+' + stoneReward, 'success');
        } else if (type === 'gem') {
            // v3.3 动态化: 宝石数量与等级都随 maxStage 动态调整
            //   getDungeonGemCount() = base[lv] × (1 + maxStage × countScale[lv])
            //   getDungeonGemLevel() = base[lv] + ⌊maxStage × levelScale[lv]⌋ （上限5）
            var gemCount = getDungeonGemCount(level, dungeonRewardMaxStage);
            var gemLevel = getDungeonGemLevel(level, dungeonRewardMaxStage);
            for (var gi = 0; gi < gemCount; gi++) {
                var gemType = randPick(GEM_TYPES);
                var gemDrop = { gemTypeId: gemType.id, level: gemLevel, count: 1 };
                addGemToInventory(gemDrop);
            }
            this.addBattleLog('✦ ' + title + ' Lv.' + level + ' 通关！获得 ' + gemCount + ' 颗 Lv.' + gemLevel + ' 宝石', 'reward');
            showToast(title + ' Lv.' + level + ' 通关！获得' + gemCount + '颗宝石', 'success');
        } else if (type === 'equip') {
            // 平衡后: Lv.1 紫 3-5件 70%紫 30%橙 | Lv.2 橙 3-5件 80%橙 20%金 | Lv.3 金 2-3件
            var equipCount = 0;
            if (level === 1) {
                // 紫色 3-5 件（原 2-5）
                equipCount = 3 + Math.floor(Math.random() * 3);
                for (var ei = 0; ei < equipCount; ei++) {
                    // 品质: 蓝 50% / 紫 30% / 橙 20%
                    var eqRoll1 = Math.random();
                    var eqQuality = eqRoll1 < 0.5 ? 2 : (eqRoll1 < 0.8 ? 3 : 4);
                    this._addDungeonEquip(eqQuality);
                }
            } else if (level === 2) {
                // 橙色 3-5 件，20% 金（原 1%）
                equipCount = 3 + Math.floor(Math.random() * 3);
                for (var ei = 0; ei < equipCount; ei++) {
                    // 品质: 紫 50% / 橙 45% / 金 5%
                    var eqRoll2 = Math.random();
                    var eqQuality = eqRoll2 < 0.5 ? 3 : (eqRoll2 < 0.95 ? 4 : 5);
                    this._addDungeonEquip(eqQuality);
                }
            } else if (level === 3) {
                // 金色 2-3 件（原 1-2）
                equipCount = 2 + Math.floor(Math.random() * 2);
                for (var ei = 0; ei < equipCount; ei++) {
                    // 品质: 橙 85% / 金 15%
                    var eqQuality = Math.random() < 0.85 ? 4 : 5;
                    this._addDungeonEquip(eqQuality);
                }
            }
            this.addBattleLog('✦ ' + title + ' Lv.' + level + ' 通关！获得 ' + equipCount + ' 件装备', 'reward');
            showToast(title + ' Lv.' + level + ' 通关！获得' + equipCount + '件装备', 'success');
        }

        updateResources();
        updateMainTeamPower();

        // 成就追踪：副本通关
        GameState.mutate('dailyDungeonTotal', function(v) { return (v || 0) + 1; });

        // 结算卡片弹窗
        this._showDungeonRewardCard(title, level, type, goldReward, stoneReward, gemCount, gemLevel, equipCount);
        // 清理副本状态（modal 由结算卡片确认按钮关闭）
        this.isDungeon = false;
        this.dungeonType = null;
        this.dungeonLevel = 1;
        this.stopBattle();
    },

    // 副本结算卡片
    _showDungeonRewardCard: function(title, level, type, gold, stone, gems, gemLv, equipCount) {
        var fn = (typeof formatNumber === 'function') ? formatNumber : function(x) { return x; };
        var rows = '';
        if (gold && gold > 0) rows += '<div class="dkr-row"><span class="dkr-icon">💰</span><span class="dkr-name">金币</span><span class="dkr-val">+' + fn(gold) + '</span></div>';
        if (stone && stone > 0) rows += '<div class="dkr-row"><span class="dkr-icon">◇</span><span class="dkr-name">重铸石</span><span class="dkr-val">+' + stone + '</span></div>';
        if (gems && gems > 0) rows += '<div class="dkr-row"><span class="dkr-icon">💎</span><span class="dkr-name">Lv.' + gemLv + ' 宝石</span><span class="dkr-val">×' + gems + '</span></div>';
        if (equipCount && equipCount > 0) rows += '<div class="dkr-row"><span class="dkr-icon">🗡</span><span class="dkr-name">装备</span><span class="dkr-val">+' + equipCount + '件</span></div>';

        // 战斗时长
        var elapsed = Math.floor(((performance.now() - this._battleStats.startTime) / 1000));
        if (elapsed < 1) elapsed = 1;
        var mins = Math.floor(elapsed / 60);
        var secs = elapsed % 60;
        var timeStr = mins > 0 ? (mins + '分' + secs + '秒') : (secs + '秒');

        // 注入样式（复用魔王卡片的 dkr-card-style）
        if (!document.getElementById('dk-card-style')) {
            var style = document.createElement('style');
            style.id = 'dk-card-style';
            style.textContent = '@keyframes dkCardIn{0%{opacity:0;transform:scale(0.7) translateY(40px)}100%{opacity:1;transform:scale(1) translateY(0)}}.dkr-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)}.dkr-row:last-child{border-bottom:none}.dkr-icon{font-size:16px;width:24px;text-align:center}.dkr-name{flex:1;font-size:13px;color:#ccc}.dkr-val{font-size:13px;font-weight:bold;color:#ffd700}';
            document.head.appendChild(style);
        }

        // 类型图标
        var icons = { gold: '💰', stone: '💠', gem: '💎', equip: '🗡' };
        var icon = icons[type] || '📦';
        var color = type === 'gold' ? '#ff8f00' : (type === 'stone' ? '#ce93d8' : (type === 'gem' ? '#42a5f5' : '#66bb6a'));

        var card = document.createElement('div');
        card.id = 'dk-reward-card';
        card.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);';
        card.innerHTML =
            '<div style="background:linear-gradient(180deg,#1a1520,#0d0a10);border:2px solid ' + color + '80;border-radius:20px;padding:24px 20px;width:88vw;max-width:380px;text-align:center;box-shadow:0 0 40px ' + color + '40;animation:dkCardIn 0.4s cubic-bezier(0.34,1.56,0.64,1);">' +
                '<div style="font-size:40px;margin-bottom:4px;">' + icon + '</div>' +
                '<div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:2px;">' + title + '</div>' +
                '<div style="font-size:12px;color:#888;margin-bottom:12px;">Lv.' + level + ' · ' + timeStr + '</div>' +
                '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:12px;margin:8px 0;text-align:left;">' +
                    rows +
                '</div>' +
                '<button onclick="closeDungeonRewardCard()" style="width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,' + (type === 'gold' ? '#ff8f00,#ff6f00' : type === 'stone' ? '#7b1fa2,#6a1b9a' : type === 'gem' ? '#1565c0,#0d47a1' : '#2e7d32,#1b5e20') + ');color:#fff;font-size:15px;font-weight:bold;cursor:pointer;margin-top:8px;">✅ 确认领取</button>' +
            '</div>';

        // 覆盖 dungeon-battle-modal 自动关闭的行为：先不关 modal，等用户点确认
        document.body.appendChild(card);
    },

    // 辅助：生成副本装备（基于已上阵职业可穿戴的装备类型）
    _addDungeonEquip: function(quality) {
        var slots = ['weapon', 'offhand', 'helm', 'armor', 'boots'];
        var slotId = randPick(slots);
        var eq = createEquipInstance(slotId, quality, GameState.get('stage') || 1);
        if (eq) {
            GameState.mutate('inventory', function(inv) {
                if (!inv) inv = [];
                inv.push(eq);
                var cap = (typeof getWarehouseCapacity === 'function') ? getWarehouseCapacity() : (GameState.get('maxInventory') || 100);
                while (inv.length > cap) inv.shift();
                return inv;
            });
        }
    },

    // 退出副本模式
    exitDungeon: function() {
        this.isDungeon = false;
        this.dungeonType = null;
        // 清空地牢战斗日志
        this.battleLog = [];
        var logEl = document.getElementById('battle-log');
        if (logEl) logEl.innerHTML = '';
        this.dungeonLevel = 1;
        this.dungeonEnemyMult = null;

        // ★ BUG#3 修复：重置波次类型标志（防止爬塔退出后章节战斗走错 BOSS/精英 分支）
        this.isBossWave = false;
        this.isEliteWave = false;
        this.elitesRemaining = 0;

        // ★ v2.6.4 BUG#I 紧急修复: 重置 spawnInterval (爬塔模式会改成 100ms, 不重置导致主战场
        //   1.5s 节奏失效, 玩家点"继续战斗"后 5 只怪 0.5s 刷出, BOSS 关时 5 个怪都被
        //   判 isLastSpawn=true → 5 个 BOSS 同时出现)
        this.spawnInterval = 1500;

        // ★ BUG#1 修复强化：先彻底停止副本战场 gameLoop
        // 这样副本退出时不会留下任何 update 循环副作用
        if (this.isRunning) {
            this.stopBattle();
        }

        // ★ BUG#1 修复：退出时清空副本内残留敌人（不含在 savedNormalState 里）
        //   防止退出时战场还有上一只死亡动画未完成，上一章节状态被污染
        this.enemies = [];

        // ★ BUG#1 终极修复：把 canvas 引用切回主战场 canvas
        // 实现副本战斗画面与主战场完全隔离
        this.restoreMainCanvas();

        // ★ v2.6.2 BUG 修复：副本战斗时 PixiFx 已被切到 dungeon-pixi-overlay-canvas（隐藏），
        //   退出副本必须 destroy+reinit 到主战场 canvas，否则 PixiFx 持续在隐藏 canvas 上
        //   跑 ticker 渲染 + 拖尾粒子累积，吃光 GPU/CPU 导致主战场视觉卡死。
        var mainPixiCanvas = document.getElementById('pixi-overlay-canvas');
        if (mainPixiCanvas) {
            this._reinitPixiFx(mainPixiCanvas, this.battleWidth || this._mainBattleWidth || 600, this.battleHeight || this._mainBattleHeight || 400);
        } else if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            // 兜底：找不到主 canvas 时至少 destroy 掉隐藏实例，避免 GPU 占用
            try { PixiFx.destroy(); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
        }
        // 恢复主战场状态
        if (this.savedNormalState) {
            this.waveNumber = this.savedNormalState.waveNumber || 1;
            this.stage = this.savedNormalState.stage || 1;
            this.waveSpawnCount = this.savedNormalState.waveSpawnCount || 5;
            this.waveSpawned = this.savedNormalState.waveSpawned || 0;
            this.waveState = this.savedNormalState.waveState || 'resting';
            this.restTimer = this.savedNormalState.restTimer || 1000;
            this.deathTimerInit = !!this.savedNormalState.deathTimerInit;
            this.autoBattle = this.savedNormalState.autoBattle || false;
            this.waitingNextChapter = !!this.savedNormalState.waitingNextChapter;
            // ★ BUG#1 修复：不要恢复 enemies 数组 —— savedNormalState 里的 enemies
            //   是旧的、可能已经死亡/无效的实例，恢复后会导致战场出现残留怪物或空引用
            //   统一在这里用 this.enemies = [] 兜底清空
            this.enemies = [];
            this.savedNormalState = null;
        // 恢复主线统计数据
        if (this._savedBattleStats) {
            this._battleStats = this._savedBattleStats;
            this._savedBattleStats = null;
        }
        }

        // 同步自动战斗按钮文字（按原状态）
        if (typeof updateAutoButtonText === 'function') updateAutoButtonText();

        // 恢复角色状态（副本期间可能死了队员）
        this.healSurvivors();

        // ★ BUG#1 终极修复：切回主战斗屏幕后，不要自动重启主战场
        // 让玩家手动点"继续战斗"按钮，避免在打不过的关卡被跳过
        // _mainBattlePaused 已经在 startDungeonBattle 设为 true
        switchScreen('main');
        // 显示"继续战斗"按钮
        var resumeBtn = document.getElementById('btn-resume-main-battle');
        if (resumeBtn) resumeBtn.style.display = 'inline-block';
        // 同步显示当前关卡与状态
        this.restoreNormalUI();
        // 提示玩家主战场已暂停
        if (typeof showToast === 'function') {
            showToast('副本结束！主战场已暂停，点击【继续战斗】开始', 'info');
        }
        // 关闭副本战斗 modal（v4.0 爬塔走这个流程时也要关）
        var battleModal = document.getElementById('dungeon-battle-modal');
        if (battleModal) battleModal.style.display = 'none';
    },

    // ======================== 爬塔·无尽 v4.0 ========================
    // 取代旧的 4 副本系统（金币/重铸石/宝石/装备）
    // 流程：startTowerBattle(floor) → onWaveComplete → towerReward + exitTower

    // 标记当前正在爬塔
    isTower: false,
    towerFloor: 1,            // 当前层数

    // 开始爬塔战斗
    startTowerBattle: function(floor) {
        if (this.isDungeon) { console.warn('[Battle] 已在地牢/爬塔中,忽略'); return; }
        if (typeof getTowerFloorType !== 'function' || typeof createMonsterInstance !== 'function') {
            if (typeof showToast === 'function') showToast('爬塔系统未就绪', 'error');
            return;
        }

        // ★ 彻底停止主战场循环
        if (this.isRunning) {
            this.stopBattle();
        }

        // 保存主战场状态
        this.savedNormalState = {
            waveNumber: this.waveNumber,
            stage: this.stage,
            waveSpawnCount: this.waveSpawnCount,
            waveSpawned: this.waveSpawned,
            waveState: this.waveState,
            restTimer: this.restTimer,
            deathTimerInit: this.deathTimerInit,
            autoBattle: this.autoBattle,
            waitingNextChapter: this.waitingNextChapter,
            enemies: this.enemies.slice()
        };

        this.isDungeon = true;          // 复用副本标志（用于奖励/退出流程）
        this.isTower = true;            // 爬塔专属标志
        this.towerFloor = floor;
        this.dungeonType = 'tower';     // 占位（旧 dungeonReward 不再调用）

        // 重置战斗状态
        this.enemies = [];
        this.waveSpawned = 0;
        this.waveState = 'resting';
        this.restTimer = 500;
        this.deathTimerInit = false;

        // 切换 canvas 到副本独立 canvas
        var dungeonCanvas = document.getElementById('dungeon-battle-canvas');
        if (dungeonCanvas) {
            this.switchCanvas(dungeonCanvas);
            // ★ v7.3.2: rAF 后强制 resize，确保 modal layout 完成后 canvas 尺寸正确
            var self = this;
            requestAnimationFrame(function() {
                try { self.resize(); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
            });
        }
        this._mainBattlePaused = true;

        // 友方满状态
        for (var di = 0; di < this.allies.length; di++) {
            var a = this.allies[di];
            a.alive = true;
            a.hp = a.maxHp;
            a.mp = a.maxMp;
            a.statusEffects = [];
            a.buffs = [];
            a.atkTimer = 0;
            a.skillCd = {};
        }

        // 设置爬塔参数
        var floorType = getTowerFloorType(floor);
        var stage = getTowerStageForFloor(floor);
        var mult = getTowerFloorMult(floor);

        this.stage = stage;
        this.waveNumber = floor;
        this.waveSpawnCount = 1;   // 每层 1 只怪
        this.dungeonEnemyMult = mult;  // 复用：怪物属性 × mult

        // 标题
        var typeName = TOWER_FLOOR_TYPE_NAME[floorType] || { name: '?', icon: '?' };
        var titleStr = typeName.name + ' - 第 ' + floor + ' 层';
        document.getElementById('wave-status').textContent = titleStr;
        document.getElementById('wave-number').textContent = '第 ' + floor + ' 层';
        this.addBattleLog('⚔ 进入 ' + titleStr + '（难度 ×' + mult.toFixed(2) + '）', 'reward');

        // 入场特效（按楼层类型）
        this._showFloorIntro(floor, floorType);

        this.startBattle();
        // ★ 覆盖：爬塔每层 1 只怪 + 跳过初始休息期
        //   startBattle 内部会重置 waveSpawnCount/waveState/restTimer/...
        this.waveSpawnCount = 1;
        this.maxEnemies = 1;
        this.waveState = 'active';
        this.restTimer = 0;
        this.spawnTimer = 0;
        // ★ v2.6.4: 100ms 太激进 (一帧调 6 次, 跟 update 锁竞争), 改 1000ms 留 1 怪/s
        this.spawnInterval = 1000;  // 1s 1 怪 (仅爬塔期间, exitDungeon 会重置回 1500)
        this.enemies = [];
        this.waveSpawned = 0;
        this.bossSpawnedThisWave = false;
        // 立即强制 spawn 一只
        this.spawnEnemy();
    },

    // ====== 魔王副本：无限血量 + 限时 + 伤害累积 ======
    startDemonKingBattle: function() {
        if (this.isDungeon) { console.warn('[Battle] 已在副本中,忽略'); return; }
        if (this.isRunning) { this.stopBattle(); }

        // 保存主战场状态
        this.savedNormalState = {
            waveNumber: this.waveNumber, stage: this.stage,
            waveSpawnCount: this.waveSpawnCount, waveSpawned: this.waveSpawned,
            waveState: this.waveState, restTimer: this.restTimer,
            deathTimerInit: this.deathTimerInit, autoBattle: this.autoBattle,
            waitingNextChapter: this.waitingNextChapter, enemies: this.enemies.slice()
        };

        this.isDungeon = true;
        this.dungeonType = 'demonking';
        this.dungeonLevel = 1;

        // 魔王战斗状态
        this.demonKingDamage = 0;
        this.demonKingTimer = 60000;  // 60秒
        this.demonKingStartTime = Date.now();

        // 切换 canvas
        var dungeonCanvas = document.getElementById('dungeon-battle-canvas');
        if (dungeonCanvas) {
            this.switchCanvas(dungeonCanvas);
            var self = this;
            requestAnimationFrame(function() { try { self.resize(); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); } });
        }
        this._mainBattlePaused = true;
        this.isRunning = false;

        // 友方满状态
        for (var di = 0; di < this.allies.length; di++) {
            var a = this.allies[di];
            a.alive = true; a.hp = a.maxHp; a.mp = a.maxMp;
            a.statusEffects = []; a.buffs = []; a.atkTimer = 0; a.skillCd = {};
        }

        // 刷新 ally 属性
        var teamHeroes = getTeamHeroes();
        this.setTeam(teamHeroes);

        // 设置战斗参数
        this.stage = 6;  // 使用竹林场景
        this.waveNumber = 1;
        this.enemies = [];
        this.waveSpawned = 0;
        this.waveState = 'active';
        this.restTimer = 0;
        this.deathTimerInit = false;
        this.maxEnemies = 1;
        this.waveSpawnCount = 1;
        this.spawnInterval = 999999;  // 不再生成新怪
        this.spawnTimer = 0;

        // 更新标题
        var headerEl = document.querySelector('.dungeon-battle-name');
        if (headerEl) headerEl.textContent = '魔王·竹林深处';
        document.getElementById('wave-status').textContent = '⏱ 60秒限时挑战';
        document.getElementById('wave-number').textContent = '魔王战';
        this.addBattleLog('👹 魔王降临！竹林深处，无限血量的试炼开始！', 'boss');
        this.addBattleLog('⏱ 限时60秒，造成尽可能多的伤害吧！', 'info');

        // 入场特效
        this.shakeCanvas(10, 400);
        this.flashScreen('#ff1744', 300, 0.3);

        // 启动战斗（startBattle 会清空 enemies，所以先生成战斗循环再 spawn 魔王）
        this.startBattle();
        this.autoBattle = true;

        // ★ startBattle 会重置 enemies/waveState/spawnInterval
        //   必须在 startBattle 之后设置，否则被覆盖
        this.enemies = [];
        this.waveState = 'active';
        this.restTimer = 0;
        this.spawnInterval = 999999;
        this.maxEnemies = 1;
        this.waveSpawnCount = 1;
        this.spawnTimer = 0;
        this.waveSpawned = 0;
        this._spawnDemonKing();
    },

    // 生成魔王
    _spawnDemonKing: function() {
        var w = this.battleWidth || 480;
        var h = this.battleHeight || 400;
        var x = w * 0.72;
        var y = h * 0.42;
        var INF_HP = 999999999;
        // 手动创建魔王（不经过怪物池随机）
        var boss = {
            id: 'demon_king_' + Date.now(),
            name: '世界之主·芦笋',
            monsterKey: 'bamboo_shoot_boss',
            x: x, y: y,
            alive: true, isBoss: true, elite: true,
            renderScale: 2.5,
            maxHp: INF_HP, hp: INF_HP,
            atk: 80,   // 低攻击，避免秒杀
            def: 40,   // 中低防御
            spd: 35, atkTimer: 0,
            target: this.allies[0] || null
        };
        boss.skeleton = (typeof buildMonsterSkeleton === 'function')
            ? buildMonsterSkeleton(boss, { scale: 2.5 })
            : null;
        this.enemies.push(boss);
        this.addBattleLog('👹 ' + boss.name + ' 出现了！血量：∞', 'boss');
        // BOSS 出场特效
        // ★ v7.4.1 修复:之前写错函数名 PixiFx.addParticle(单数),正确是 addParticles(复数)。
        //   导致 TypeError,_spawnDemonKing 中断,modal 标题没改 + startBattle 没跑 + gameLoop 没启动 → canvas 黑屏。
        //   同时简化:一次 addParticles 调用生成 30 个粒子,比循环 30 次 addParticles 性能更好(单次 PIXI 批量渲染)。
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            try {
                PixiFx.addParticles(x, y, '#ff1744', 30, {
                    sizeMin: 2, sizeMax: 6,
                    lifeMin: 600, lifeMax: 1400,
                    speed: 4, upBias: 1.5
                });
            } catch (e) {
                if (typeof console !== 'undefined' && console.warn) console.warn('[DemonKing] BOSS 出场粒子异常:', e);
            }
        }
        this.addEffect(x, y, 'nova', '#ff1744', 2.5);
        this.addEffect(x, y, 'nova', '#7b1fa2', 2.0);
    },

    // 魔王奖励计算 + 结算卡片弹窗
    demonKingReward: function() {
        var dmg = this.demonKingDamage || 0;
        var record = GameState.get('demonKingRecord') || 0;
        var newRecord = dmg > record;

        if (newRecord) {
            GameState.set('demonKingRecord', dmg);
        }

        // 成就追踪：魔王击杀
        GameState.mutate('demonKingKills', function(v) { return (v || 0) + 1; });

        // ★ 幂率平滑曲线：全奖励从0到上限连续增长，10亿拿满
        //   10000伤害时: 抽奖石1+宝石1+蛋石1+升级石1+重铸石10
        //   gold = 500 + (100万-500) × ratio^0.66
        //   dust = 200 + (20万-200) × ratio^0.565
        //   石头 = 上限 × ratio^指数
        var ratio = Math.max(0.000001, dmg / 1000000000);
        var gold = Math.min(1000000, Math.floor(500 + 999500 * Math.pow(ratio, 0.66)));
        var dust = Math.min(200000, Math.floor(200 + 199800 * Math.pow(ratio, 0.565)));
        var lottery = Math.min(1000, Math.floor(1000 * Math.pow(ratio, 0.60)));
        var gems = Math.min(1000, Math.floor(1000 * Math.pow(ratio, 0.60)));
        var eggs = Math.min(1000, Math.floor(1000 * Math.pow(ratio, 0.60)));
        var upgrade = Math.min(1000, Math.floor(1000 * Math.pow(ratio, 0.60)));
        var reforgestone = Math.min(5000, Math.floor(5000 * Math.pow(ratio, 0.54)));
        var gemLevel = Math.min(5, 1 + Math.floor(4 * Math.pow(ratio, 0.7)));

        // 发放奖励
        GameState.mutate('gold', function(g) { return (g || 0) + gold; });
        GameState.mutate('forgeDust', function(d) { return (d || 0) + dust; });
        if (lottery > 0) GameState.mutate('lotteryStone', function(v) { return (v || 0) + lottery; });
        if (eggs > 0) GameState.mutate('petEggStones', function(v) { return (v || 0) + eggs; });
        if (upgrade > 0) GameState.mutate('upgradeStone', function(v) { return (v || 0) + upgrade; });
        if (reforgestone > 0) GameState.mutate('reforgestone', function(v) { return (v || 0) + reforgestone; });
        if (gems > 0) {
            for (var gi = 0; gi < gems; gi++) {
                var gt = randPick(GEM_TYPES);
                if (typeof addGemToInventory === 'function') {
                    addGemToInventory({ gemTypeId: gt.id, level: gemLevel, count: 1 });
                }
            }
        }

        // 计算战斗时长
        var elapsed = Math.floor(((Date.now() - (this.demonKingStartTime || Date.now())) / 1000));
        if (elapsed < 1) elapsed = 1;
        var minutes = Math.floor(elapsed / 60);
        var seconds = elapsed % 60;
        var timeStr = minutes > 0 ? (minutes + '分' + seconds + '秒') : (seconds + '秒');

        var fn = (typeof formatNumber === 'function') ? formatNumber : function(x) { return x; };
        var recStr = newRecord ? '<div style="color:#ffd700;font-size:14px;margin-top:6px;">🏆 新纪录！</div>' : '';

        // 构建奖励行
        var rewardRows = '';
        if (gold > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">💰</span><span class="dkr-name">金币</span><span class="dkr-val">+' + fn(gold) + '</span></div>';
        if (dust > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">💠</span><span class="dkr-name">锻造粉尘</span><span class="dkr-val">+' + fn(dust) + '</span></div>';
        if (lottery > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">🎫</span><span class="dkr-name">抽奖石</span><span class="dkr-val">+' + lottery + '</span></div>';
        if (gems > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">💎</span><span class="dkr-name">Lv.' + gemLevel + ' 宝石</span><span class="dkr-val">×' + gems + '</span></div>';
        if (eggs > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">🥚</span><span class="dkr-name">宠物蛋石</span><span class="dkr-val">+' + eggs + '</span></div>';
        if (upgrade > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">🔷</span><span class="dkr-name">升级石</span><span class="dkr-val">+' + upgrade + '</span></div>';
        if (reforgestone > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">◇</span><span class="dkr-name">重铸石</span><span class="dkr-val">+' + reforgestone + '</span></div>';

        // 结算卡片
        var card = document.createElement('div');
        card.id = 'demonking-reward-card';
        card.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);';
        card.innerHTML =
            '<div style="background:linear-gradient(180deg,#1a0a20,#0d0510);border:2px solid rgba(244,67,54,0.5);border-radius:20px;padding:24px 20px;width:88vw;max-width:380px;text-align:center;box-shadow:0 0 60px rgba(244,67,54,0.3);animation:dkCardIn 0.4s cubic-bezier(0.34,1.56,0.64,1);">' +
                '<div style="font-size:40px;margin-bottom:4px;">👹</div>' +
                '<div style="font-size:20px;font-weight:900;color:#ff5252;margin-bottom:4px;">魔王战 · 结算</div>' +
                '<div style="font-size:12px;color:#888;margin-bottom:14px;">世界之主·芦笋</div>' +
                '<div style="display:flex;justify-content:center;gap:24px;margin-bottom:14px;">' +
                    '<div style="text-align:center;"><div style="font-size:10px;color:#888;">持续时间</div><div style="font-size:15px;color:#ffd700;font-weight:bold;">' + timeStr + '</div></div>' +
                    '<div style="text-align:center;"><div style="font-size:10px;color:#888;">累计伤害</div><div style="font-size:15px;color:#ff5252;font-weight:bold;">' + fn(dmg) + '</div></div>' +
                '</div>' +
                recStr +
                '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:12px;margin:10px 0;text-align:left;">' +
                    rewardRows +
                '</div>' +
                '<button onclick="var c=document.getElementById(\'demonking-reward-card\');if(c)c.remove();if(typeof switchScreen===\'function\')switchScreen(\'dungeon\');if(typeof showDungeonScreen===\'function\')showDungeonScreen();" style="width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#d32f2f,#7b1fa2);color:#fff;font-size:15px;font-weight:bold;cursor:pointer;margin-top:8px;">✅ 确认领取</button>' +
            '</div>';

        // 注入动画CSS
        if (!document.getElementById('dk-card-style')) {
            var style = document.createElement('style');
            style.id = 'dk-card-style';
            style.textContent = '@keyframes dkCardIn{0%{opacity:0;transform:scale(0.7) translateY(40px)}100%{opacity:1;transform:scale(1) translateY(0)}}.dkr-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)}.dkr-row:last-child{border-bottom:none}.dkr-icon{font-size:16px;width:24px;text-align:center}.dkr-name{flex:1;font-size:13px;color:#ccc}.dkr-val{font-size:13px;font-weight:bold;color:#ffd700}';
            document.head.appendChild(style);
        }

        document.body.appendChild(card);
        updateResources();
        updateMainTeamPower();
    },

    // 入场特效：按楼层类型决定
    _showFloorIntro: function(floor, floorType) {
        // 1) 通用：层号横幅
        this._showFloorBanner(floor, floorType);
        // 2) 特殊层：额外效果
        if (floorType === 'elite') {
            // 红色脉冲（精英警告）
            this.shakeCanvas(8, 250);
            this.flashScreen('#ff5252', 220, 0.25);
        } else if (floorType === 'boss') {
            // BOSS：屏幕震动 + 全屏红光
            this.shakeCanvas(15, 400);
            this.flashScreen('#ff1744', 350, 0.4);
            if (typeof AudioManager !== 'undefined' && AudioManager.playBGM) {
                AudioManager.playBGM('boss');
            }
        }
    },

    // 层号横幅
    _showFloorBanner: function(floor, floorType) {
        // 注入 CSS（如果未注入）
        if (!document.getElementById('floor-banner-style')) {
            var s = document.createElement('style');
            s.id = 'floor-banner-style';
            s.textContent = [
                '@keyframes floorBannerIn{0%{opacity:0;transform:translateX(-50%) translateY(60px) scale(0.6);}60%{opacity:1;transform:translateX(-50%) translateY(-10px) scale(1.05);}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}}',
                '@keyframes floorBannerOut{0%{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}100%{opacity:0;transform:translateX(-50%) translateY(60px) scale(0.6);}}'
            ].join('');
            document.head.appendChild(s);
        }
        var cfg = TOWER_FLOOR_TYPE_NAME[floorType] || TOWER_FLOOR_TYPE_NAME.normal;
        var banner = document.createElement('div');
        banner.className = 'floor-banner is-' + floorType;
        banner.innerHTML = [
            '<div class="fb-floor">第</div>',
            '<div class="fb-num">' + floor + '</div>',
            '<div class="fb-type" style="background:' + cfg.color + ';">' + cfg.icon + ' ' + cfg.name + '</div>'
        ].join('');
        document.body.appendChild(banner);
        var self = this;
        setTimeout(function() { banner.classList.add('banner-show'); }, 10);
        setTimeout(function() {
            banner.classList.remove('banner-show');
            banner.classList.add('banner-hide');
            setTimeout(function() { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 450);
        }, 1800);
    },

    // 屏幕震动（durationMs, intensity 像素）
    shakeCanvas: function(intensity, duration) {
        intensity = intensity || 8;
        duration = duration || 250;
        var canvas = this.canvas || document.getElementById('battle-canvas');
        if (!canvas) return;
        var start = Date.now();
        var self = this;
        function loop() {
            var elapsed = Date.now() - start;
            if (elapsed > duration) {
                canvas.style.transform = '';
                return;
            }
            var dx = (Math.random() - 0.5) * intensity;
            var dy = (Math.random() - 0.5) * intensity;
            canvas.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            requestAnimationFrame(loop);
        }
        loop();
    },

    // 屏幕闪色（color, durationMs, maxOpacity）
    flashScreen: function(color, duration, maxOpacity) {
        maxOpacity = maxOpacity || 0.3;
        var flash = document.createElement('div');
        flash.className = 'battle-flash';
        flash.style.background = color;
        flash.style.opacity = maxOpacity;
        flash.style.transition = 'opacity ' + (duration / 2) + 'ms ease-out';
        document.body.appendChild(flash);
        setTimeout(function() { flash.style.opacity = '0'; }, 50);
        setTimeout(function() { if (flash.parentNode) flash.parentNode.removeChild(flash); }, duration + 100);
    },

    // 爬塔通关奖励
    towerReward: function(floor) {
        if (typeof calcTowerReward !== 'function') return;
        if (!gameState) return;
        var reward = calcTowerReward(floor);
        // 累加货币
        GameState.mutate('gold', function(g) { return (g || 0) + reward.gold; });
        if (reward.reforgestone > 0) GameState.mutate('reforgestone', function(v) { return (v || 0) + reward.reforgestone; });
        if (reward.lotteryStone > 0) GameState.mutate('lotteryStone', function(v) { return (v || 0) + reward.lotteryStone; });
        if (reward.upgradeStone > 0) GameState.mutate('upgradeStone', function(v) { return (v || 0) + reward.upgradeStone; });
        if (reward.petEggStone > 0) GameState.mutate('petEggStones', function(v) { return (v || 0) + reward.petEggStone; });
        // 宝石入仓库(随机选个 GEM_TYPES,用 gemTypeId 正确传参)
        for (var gi = 0; gi < (reward.gems || []).length; gi++) {
            if (typeof addGemToInventory === 'function' && typeof GEM_TYPES !== 'undefined' && GEM_TYPES.length) {
                var rgt = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
                addGemToInventory({ gemTypeId: rgt.id, level: reward.gems[gi].level });
            }
        }
        // 更新进度
        var towerData = GameState.get('tower') || {};
        towerData.currentFloor = floor + 1;
        if (floor > (towerData.maxFloor || 0)) towerData.maxFloor = floor;
        if (floor > (towerData.bestFloor || 0)) towerData.bestFloor = floor;
        towerData.totalRuns = (towerData.totalRuns || 0) + 1;
        towerData.lastReward = reward;
        GameState.set('tower', towerData);
        // 成就追踪
        var maxTowerFloor = GameState.get('maxTowerFloor') || 0;
        if (floor > maxTowerFloor) {
            GameState.set('maxTowerFloor', floor);
            if (typeof checkAchievements === 'function') {
                checkAchievements('towerFloor', floor);
            }
        }
        // 通知 UI
        if (typeof updateResources === 'function') updateResources();
        // 横幅通知
        var lines = [];
        lines.push('⚔ 第 ' + floor + ' 层 通关！');
        if (reward.gold > 0) lines.push('💰 +' + reward.gold + ' 金币');
        if (reward.reforgestone > 0) lines.push('◇ +' + reward.reforgestone + ' 重铸石');
        if (reward.lotteryStone > 0) lines.push('🎫 +' + reward.lotteryStone + ' 抽奖石');
        if (reward.upgradeStone > 0) lines.push('🔷 +' + reward.upgradeStone + ' 升级石');
        if (reward.gems && reward.gems.length > 0) lines.push('💎 +' + reward.gems.length + ' 宝石');
        if (typeof showToast === 'function') showToast(lines.join('  '), 'success', 3500);
        if (this.addBattleLog) this.addBattleLog('⚔ 第 ' + floor + ' 层通关：' + lines.slice(1).join(' / '), 'reward');

        // 完成特效
        this._showFloorComplete(floor, reward);
    },

    // 完成特效
    _showFloorComplete: function(floor, reward) {
        // 屏幕中心闪绿色 + "层 N 完成！"
        var flash = document.createElement('div');
        flash.className = 'floor-complete-flash';
        flash.textContent = '✓ 第 ' + floor + ' 层 完成！';
        document.body.appendChild(flash);
        setTimeout(function() {
            flash.style.transition = 'opacity 0.3s, transform 0.3s';
            flash.style.opacity = '1';
            flash.style.transform = 'translate(-50%,-50%) scale(1.1)';
        }, 20);
        setTimeout(function() {
            flash.style.opacity = '0';
            flash.style.transform = 'translate(-50%,-50%) scale(0.8)';
            setTimeout(function() { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 350);
        }, 1500);
    },

    // 退出爬塔
    exitTower: function() {
        this.isTower = false;
        this.towerFloor = 0;
        this.exitDungeon();   // 复用退出逻辑（恢复主战场）
        // 爬塔专属：跳回 dungeon 页面并刷新
        if (typeof switchScreen === 'function') switchScreen('dungeon');
        if (typeof showDungeonScreen === 'function') showDungeonScreen();
    },

    // 恢复正常UI显示
    restoreNormalUI: function() {
        if (gameState) {
            var stageName = getStageName(this.stage);
            var recPower = getRecommendedPower(this.stage);
            document.getElementById('stage-info').textContent = '第 ' + this.stage + ' 章 - ' + stageName + ' [推荐战力:' + (typeof formatNumber === 'function' ? formatNumber(recPower) : recPower) + ']';
            document.getElementById('wave-number').textContent = this.getLevelDisplay();
            document.getElementById('wave-status').textContent = '副本结束，返回主界面';
            var count = this.calculateLevelMonsterCount(this.stage);
            document.getElementById('monster-count').textContent = '怪物: 0/' + count;
            this.addBattleLog('副本结束，返回主界面', 'info');
        }
    },

    // 渲染
    render: function() {
        // ★ 主战场暂停时不渲染（退出副本后保静止画面由其他机制处理）
        if (!this.isDungeon && this._mainBattlePaused) return;
        var ctx = this.ctx;
        var w = this.battleWidth;
        var h = this.battleHeight;
        if (!ctx) return;

        // 高DPI适配
        var dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // ★ v3.5.1 确保尺寸有效，防止 clearRect 无效导致画面叠加变绿
        if (w <= 0 || h <= 0) { w = this.battleWidth = this.canvas ? this.canvas.width / dpr : 360; h = this.battleHeight = this.canvas ? this.canvas.height / dpr : 640; }
        ctx.clearRect(0, 0, w, h);
        
        // 绘制场景背景
        this.drawSceneBackground(ctx, w, h);

        // 绘制敌人
        var enemyCount_ = 0;
        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            if (!e || !e.alive) continue;
            enemyCount_++;
            try {
                this.drawUnit(ctx, e, '#f44336', false);
            } catch (_ed) {
                // 静默容错 - 防止 sprite 绘制抛错导致整个画面空白
                ctx.fillStyle = '#f44336';
                ctx.beginPath();
                ctx.arc((e.x||0), (e.y||0), 10, 0, Math.PI*2);
                ctx.fill();
            }
        }
        // [DEBUG] 显示当前敌人数
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('敌:' + this.enemies.filter(function(x){return x&&x.alive;}).length + ' 绘:' + enemyCount_, 4, 14);

        // 绘制友方
        for (var i = 0; i < this.allies.length; i++) {
            var a = this.allies[i];
            if (!a.alive) continue;
            this.drawUnit(ctx, a, '#4fc3f7', true);
        }

        // v2.6.1: 绘制召唤物（在 allies 之后，敌人之前，紫色光环标识）
        this.drawSummons(ctx);
        
        // ★ v4.1 宠物上阵显示（右上角图标，最多3个）
        if (typeof gameState !== 'undefined' && gameState && GameState.get('activePets') && typeof getPetData === 'function') {
            var localActivePets = GameState.get('activePets') || [];
            var _petIcons = [];
            var _petColors = [];
            for (var _psi = 0; _psi < localActivePets.length; _psi++) {
                var _spId = localActivePets[_psi];
                if (!_spId) continue;
                var _sp = getPetData(_spId);
                if (_sp) {
                    _petIcons.push(_sp.icon);
                    var _tierCfg = getPetTier(_sp.tier);
                    _petColors.push(_tierCfg ? _tierCfg.color : '#9e9e9e');
                }
            }
            if (_petIcons.length > 0) {
                var _startX = w - 20 - (_petIcons.length - 1) * 32;
                ctx.save();
                for (var _psi2 = 0; _psi2 < _petIcons.length; _psi2++) {
                    var _px = _startX + _psi2 * 32, _py = 18;
                    ctx.beginPath();
                    ctx.arc(_px, _py, 12, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.45)';
                    ctx.fill();
                    ctx.strokeStyle = _petColors[_psi2];
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.font = '12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(_petIcons[_psi2], _px, _py + 1);
                }
                ctx.restore();
            }
        }
        
        // 绘制特效和粒子
        this.drawEffects(ctx);
        
        // ===== 屏幕遮罩/过场动画 =====
        
        // 1. 全灭红色遮罩
        if (this.deathTimerInit) {
            var pulse = Math.sin(Date.now() / 300) * 0.08 + 0.16;
            ctx.fillStyle = 'rgba(180,20,20,' + pulse + ')';
            ctx.fillRect(0, 0, w, h);
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,80,80,0.95)';
            ctx.fillText('全军覆没！', w / 2, h * 0.32);
            ctx.font = 'bold 20px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(Math.ceil(this.deathTimer / 1000) + '秒后重置', w / 2, h * 0.52);
        }
        
        // 2. 通关/休整遮罩
        if (this.waveState === 'resting' && !this.deathTimerInit) {
            var restProgress = 1 - this.restTimer / this.restDuration;
            if (restProgress < 0.25) {
                // 刚完成关卡 - 金色闪光
                var flashAlpha = (1 - restProgress / 0.25) * 0.35;
                ctx.fillStyle = 'rgba(255,215,0,' + flashAlpha + ')';
                ctx.fillRect(0, 0, w, h);
                // 大号文字淡出
                var textAlpha = (1 - restProgress / 0.25);
                ctx.font = 'bold 26px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255,215,0,' + (textAlpha * 0.95) + ')';
                ctx.fillText('关卡完成！', w / 2, h * 0.35);
            } else {
                // 休整中 - 绿色淡遮罩
                ctx.fillStyle = 'rgba(20,120,20,0.08)';
                ctx.fillRect(0, 0, w, h);
                ctx.font = '18px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(100,255,100,0.45)';
                ctx.fillText('休整中... ' + Math.ceil(this.restTimer / 1000) + 's', w / 2, h * 0.5);
            }
        }
        
        // 3. 复活白色闪光
        if (this.reviveFlash && this.reviveFlash > 0) {
            var flashAlpha = Math.min(0.55, (this.reviveFlash / 500) * 0.55);
            ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha + ')';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(0,220,0,' + (flashAlpha * 0.5) + ')';
            ctx.fillRect(0, 0, w, h);
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,255,0,' + flashAlpha + ')';
            ctx.fillText('队伍复活！', w / 2, h * 0.35);
        }
        
        // 关卡标签
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(this.getLevelDisplay(), 4, 4);
    },

    // ========== 特效系统 ==========

    effects: [],
    particles: [],

    // 添加打击/技能特效
    //   v2.6.1: 委托 PixiFx（WebGL），Canvas2D 旧版已废弃
    addEffect: function(x, y, type, color, size) {
    // ★ v2.6.3 修复特效变老: PixiFx 走通时不 push Canvas2D 数组,
    //   否则 this.effects 一直累积 (内存泄漏), 某些 race 条件下 drawEffects
    //   走到 Canvas2D fallback 画老特效。PixiFx 不可用时再 push
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            try {
            var isGlowType = (type === 'buff' || type === 'shield' || type === 'heal' || type === 'nova');
            PixiFx.addEffect(x, y, type, color, size || 1, isGlowType);
            return;
            } catch (e) {
                if (typeof console !== 'undefined' && console.warn) console.warn('[Battle] PixiFx.addEffect 异常:', e);
            }
        }
        // 兼容旧版 Canvas2D 数组（如果 PixiFx 没初始化，至少不报错）
        if (!this.effects) this.effects = [];
        // ★ v2.6.4 Round 6.1 防御: 数组上限 (Canvas2D fallback 模式下, 某些 race 条件
        //   会疯狂 push, 加上限 100 防止内存泄漏 + 卡顿)
        if (this.effects.length > 100) this.effects.shift();
        this.effects.push({
            x: x, y: y,
            type: type || 'hit',
            color: color || '#fff',
            timer: 300,
            duration: 300,
            scale: size || 1
        });
    },

    // 添加粒子爆炸
    //   v2.6.1: 委托 PixiFx（WebGL），可承载 2000+ 粒子不掉帧
    addParticles: function(x, y, color, count) {
    // ★ v2.6.3 修复特效变老: PixiFx 走通时不 push Canvas2D 数组
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            try {
            PixiFx.addParticles(x, y, color, count);
            return;
            } catch (e) {
                if (typeof console !== 'undefined' && console.warn) console.warn('[Battle] PixiFx.addParticles 异常:', e);
            }
        }
        // 兼容旧版 Canvas2D 数组（兜底）
        if (!this.particles) this.particles = [];
        // ★ v2.6.4 Round 6.1 防御: 数组上限 (Canvas2D fallback 模式下加防御)
        while (this.particles.length > 200) this.particles.shift();
        for (var i = 0; i < (count || 8); i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1 + Math.random() * 3;
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                color: color || '#fff',
                life: 250 + Math.random() * 300,
                maxLife: 550,
                size: 1.5 + Math.random() * 2.5
            });
        }
    },

    // 绘制特效
    drawEffects: function(ctx) {
        // v2.6.1: 弹道仍走 Canvas2D（轨道需要精确坐标插值）
        this.drawProjectiles(ctx);
        // v2.6.1: 粒子/特效已委托给 PixiFx（WebGL 渲染），跳过 Canvas2D 版本避免双重渲染
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) return;
        // 兜底（PixiFx 未初始化时用 Canvas2D 渲染，兼容旧环境）
        // 绘制粒子
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            var alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 绘制特效
        for (var i = this.effects.length - 1; i >= 0; i--) {
            var eff = this.effects[i];
            var progress = 1 - eff.timer / eff.duration;
            var alpha = Math.max(0, Math.min(1, progress * 2) * (1 - progress * 0.5));
            ctx.globalAlpha = alpha * 0.8;
            var r = eff.scale;

            switch (eff.type) {
                case 'hit':
                    // 白色十字斩痕
                    ctx.strokeStyle = eff.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(eff.x - 8*r*progress, eff.y - 8*r*progress);
                    ctx.lineTo(eff.x + 8*r*progress, eff.y + 8*r*progress);
                    ctx.moveTo(eff.x + 8*r*progress, eff.y - 8*r*progress);
                    ctx.lineTo(eff.x - 8*r*progress, eff.y + 8*r*progress);
                    ctx.stroke();
                    // 冲击环
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y, 10*r*progress, 0, Math.PI * 2);
                    ctx.strokeStyle = eff.color + '88';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;
                case 'slash':
                    // 弧形斩
                    ctx.strokeStyle = eff.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y, 15*r*progress, -1.2, 1.2);
                    ctx.stroke();
                    break;
                case 'explosion':
                    // 爆炸火球
                    var grad = ctx.createRadialGradient(eff.x, eff.y, 0, eff.x, eff.y, 20*r*progress);
                    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
                    grad.addColorStop(0.2, eff.color);
                    grad.addColorStop(1, 'rgba(255,100,0,0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y, 20*r*progress, 0, Math.PI*2);
                    ctx.fill();
                    break;
                case 'nova':
                    // 冰霜环
                    ctx.strokeStyle = eff.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y, 12*r*progress, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y, 8*r*progress, 0, Math.PI*2);
                    ctx.strokeStyle = '#ffffff88';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    // 冰晶粒子
                    for (var s = 0; s < 6; s++) {
                        var angle = s * Math.PI/3 + progress * 3;
                        var dist = 18*r*progress;
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(eff.x + Math.cos(angle)*dist, eff.y + Math.sin(angle)*dist, 2.5 * (1-progress*0.5), 0, Math.PI*2);
                        ctx.fill();
                    }
                    break;
                case 'heal':
                    // 绿色治疗光
                    ctx.fillStyle = eff.color;
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y, 8*r*progress, 0, Math.PI*2);
                    ctx.fill();
                    // 十字
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(eff.x, eff.y - 10*r*progress);
                    ctx.lineTo(eff.x, eff.y + 10*r*progress);
                    ctx.moveTo(eff.x - 10*r*progress, eff.y);
                    ctx.lineTo(eff.x + 10*r*progress, eff.y);
                    ctx.stroke();
                    break;
                case 'buff':
                    // 金色上升光环
                    ctx.strokeStyle = eff.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y - 5*progress, 5*r + 10*r*progress, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y - 5*progress, 3*r + 8*r*progress, 0, Math.PI*2);
                    ctx.strokeStyle = '#ffd70088';
                    ctx.stroke();
                    break;
                case 'shield':
                    // 蓝色护盾
                    ctx.strokeStyle = eff.color;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y, 16*r*progress, 0, Math.PI*2);
                    ctx.stroke();
                    break;
                case 'dark':
                    // 暗黑爆炸
                    var dgrad = ctx.createRadialGradient(eff.x, eff.y, 0, eff.x, eff.y, 18*r*progress);
                    dgrad.addColorStop(0, 'rgba(100,0,150,0.8)');
                    dgrad.addColorStop(0.5, eff.color);
                    dgrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = dgrad;
                    ctx.beginPath();
                    ctx.arc(eff.x, eff.y, 18*r*progress, 0, Math.PI*2);
                    ctx.fill();
                    // 紫色闪电
                    ctx.strokeStyle = '#bb86fc';
                    ctx.lineWidth = 1.5;
                    for (var z = 0; z < 3; z++) {
                        var zx = eff.x + (Math.random()-0.5)*20;
                        var zy = eff.y + (Math.random()-0.5)*20;
                        ctx.beginPath();
                        ctx.moveTo(eff.x, eff.y);
                        ctx.lineTo(zx, zy);
                        ctx.stroke();
                    }
                    break;
            }
            ctx.globalAlpha = 1;
        }
    },

    // 更新特效
    updateEffects: function(dt) {
        // 更新弹道
        this.updateProjectiles(dt);
        // 更新粒子
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        // 更新特效
        for (var i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].timer -= dt;
            if (this.effects[i].timer <= 0) {
                this.effects.splice(i, 1);

            }
        }
    },

    // ★ v3.5.0 DPS 测试模式（木桩）
    startDummyTest: function(duration, callback) {
        var self = this;
        var savedEnemies = self.enemies;
        var savedProjectiles = self.projectiles;
        var savedParticles = self.particles;
        var savedEffects = self.effects;
        self.projectiles = [];
        self.particles = [];
        self.effects = [];
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            try { PixiFx.clearAll(); } catch(e) { /* systems/battle.js */ console.warn("⚠ [catch]",e&&e.message); }
        }
        self.enemies = [{
            id: 'dummy_0', name: '训练木桩', alive: true,
            hp: 99999999, maxHp: 99999999, atk: 0, def: 50, spd: 0,
            x: 300, y: 150, targetX: 300, targetY: 150,
            isAlly: false, elite: false, boss: false, atkTimer: 999999, spawnTime: Date.now()
        }];
        var stats = { hits: 0, totalDmg: 0, crits: 0, skillsUsed: 0, skills: {} };
        var origShowDmg = self.showDmgNum;
        self.showDmgNum = function(t, d, c) { stats.hits++; stats.totalDmg += d; if (c) stats.crits++; origShowDmg.call(self, t, d, c); };
        var origLog = self.addBattleLog;
        self.addBattleLog = function(){};
        var restoreLog = function() { self.addBattleLog = origLog; };
        var origTry = self.tryCastSkill;
        self.tryCastSkill = function(ally, dt) {
            var origCast = self.castSkill;
            self.castSkill = function(caster, s) {
                stats.skillsUsed++; if(!stats.skills[s.name]) stats.skills[s.name]=0; stats.skills[s.name]++;
                origCast.call(self, caster, s);
            };
            origTry.call(self, ally, dt);
            self.castSkill = origCast;
        };
        restoreLog();
        // 启动战斗循环
    }
};

// 全局：关闭副本奖励卡片
function closeDungeonRewardCard() {
    var c = document.getElementById('dk-reward-card');
    if (c) c.remove();
    if (typeof closeDungeonBattleModal === 'function') {
        try { closeDungeonBattleModal(); } catch(e) {
            console.warn('[catch]', e && e.message);
        }
    }
}