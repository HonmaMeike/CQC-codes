// ========== 家园系统（HOME_1.2）==========
/* global GameState */
// 草原营地场景：
//   - 上阵角色在地图上游走 + 随机说话
//   - 5~8 个网友定制怪物在地图上闲逛（友好）
//   - 60 秒检查，不足 5 个则补充
//   - 玩家在右上角点"进入战斗"才进入战斗

var HomeSystem = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    running: false,
    rafId: 0,
    lastTs: 0,
    characters: [],
    // 上阵角色
    monsters: [],
    // 网友怪物 5~8 个
    // 装饰区域（帐篷、营火等，点击触发互动）
    decorAreas: [],
    // 当前帐篷对话气泡 { text, timer, maxTimer, x, y }
    decorDialog: null,
    // 已选中实体（点击实体显示信息面板）
    selectedEntity: null,
    // 家园图片缓存
    _images: null,
    _ensureImages: function() {
        if (this._images) return;
        this._images = {};
        var names = ['tent', 'campfire', 'roast_lamb', 'quest_board', 'target', 'cauldron', 'fawn'];
        for (var i = 0; i < names.length; i++) {
            var img = new Image();
            img.src = 'assets/images/home/' + names[i] + '.png?v=' + Date.now();
            this._images[names[i]] = img;
        }
    },

    // ★ HOME_5 多个场景配置（目前仅实现草原营地）
    currentScene: 'meadow',
    scenes: {
        meadow: { name: '草原营地', icon: '🌾', unlocked: true },
        // ★ v3.5.0 多场景解锁
        snow: { name: '雪山营地', icon: '❄️', unlocked: false, unlockStage: 20 },
        forest: { name: '森林营地', icon: '🌲', unlocked: false, unlockStage: 40 },
        volcano: { name: '火山营地', icon: '🌋', unlocked: false, unlockStage: 60 }
    },

    // 玩家已解锁的图鉴怪物（从 gameState 同步）
    unlockedMonsters: [],
    // 玩家是否在战斗/副本中解锁过新图鉴（触发动画）
    _codexNewUnlocks: 0,

    // 视觉资源
    bgOffset: 0,      // 远景云层缓慢平移
    fireTimer: 0,     // 篝火闪烁
    particles: [],    // 篝火星星

    // 行为参数
    cfg: {
        minMonsters: 5,
        maxMonsters: 8,
        refreshCheckMs: 60000,  // 每 60 秒检查
        charSpeed: 22,          // 角色速度 px/s
        monsterSpeed: 14,       // 怪物速度 px/s
        sayIntervalMs: 4500,    // 角色每 4.5s 候选说一句
        sayShowMs: 3200,        // 气泡显示 3.2s
        repathIntervalMs: [3000, 6000]  // 重新选点间隔
    },

    // 30+ 句对话气泡
    SAY_TEXTS: {
        char: [
            '今天天气真不错~', '准备好出发了吗？', '在这里休息一下也不错',
            '背包里还有恢复药~', '再喝口水就出发', '小心前面那只史莱姆',
            '听说有宝藏埋在这附近', '我去做饭了', '夜里要小心野兽',
            '想升级装备了', '得攒钱买药', '我的剑已饥渴难耐',
            '火堆真暖和', '你看见我的护身符了吗？', '今晚轮到谁守夜？',
            '空气中有魔物的气息', '把剑磨利一点', '别忘了回城补给',
            '我希望下一关掉个橙装', '体力不够了', '去副本刷点宝石吧',
            '注意走位', '记得检查技能加点', '我先去前面探探路'
        ],
        monster: [
            '哇，前面有人！', '嗯？今天的风儿好喧嚣', '今天也想偷懒呢',
            '嘎嘎嘎！', '肚子有点饿了…', '想找个朋友一起玩',
            '主人在哪里？', '刚睡醒心情好~', '这边的风景真美',
            '听说营地很暖和', '别过来！我很凶的！', '今天也要努力装可爱',
            '诶嘿~', '今天想吃点什么呢？', '站岗真的好无聊啊',
            '咕噜咕噜…', '我只是一只路过的', '别打我，我投降！',
            '营地好热闹！', '想去看篝火', '今天又是和平的一天'
        ]
    },

    // ====== 启动 ======
    start: function() {
        this.canvas = document.getElementById('home-canvas');
        if (!this.canvas) {
            console.warn('[HomeSystem] #home-canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.characters = [];
        this.monsters = [];
        this.particles = [];
        this.bgOffset = 0;
        this.fireTimer = 0;
        this.decorDialog = null;
        this.selectedEntity = null;
        this._loadCharacters();
        // ★ HOME_5 修复：优先使用玩家解锁的图鉴怪物（monsterCodexUI 解锁的怪物）
        this._loadUnlockedMonsters();
        this._addMonsters(this.cfg.maxMonsters);
        // ★ HOME_5 新增：初始化装饰区域（两个帐篷 + 营火），供点击互动
        this._initDecorAreas();
        // ★ HOME_5 新增：绑定点击事件（点击帐篷/角色/怪物）
        var self = this;
        var onTap = function(ev) {
            var x, y;
            if (ev.touches && ev.touches.length > 0) {
                var t = ev.touches[0];
                var rect = self.canvas.getBoundingClientRect();
                x = t.clientX - rect.left;
                y = t.clientY - rect.top;
            } else {
                var rect2 = self.canvas.getBoundingClientRect();
                x = ev.clientX - rect2.left;
                y = ev.clientY - rect2.top;
            }
            self._handleClick(x, y);
        };
        this.canvas.onclick = onTap;
        this.canvas.ontouchstart = function(ev) { onTap(ev); ev.preventDefault(); };
        this.running = true;
        this.lastTs = performance.now();
        this._loop();
    },

    stop: function() {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    },

    resize: function() {
        if (!this.canvas) return;
        var wrap = this.canvas.parentElement;
        var w = wrap ? wrap.clientWidth : 0;
        var h = wrap ? wrap.clientHeight : 0;
        if (w < 100) w = window.innerWidth;
        if (h < 100) h = Math.max(360, window.innerHeight - 200);
        var dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = w;
        this.height = h;
    },

    // ====== 数据加载 ======
    _loadCharacters: function() {
        var team = GameState.get('team') || {};
        var positions = ['front', 'back1', 'back2', 'back3'];
        for (var i = 0; i < positions.length; i++) {
            var h = team[positions[i]];
            if (!h) continue;
            this._addCharacter(h);
        }
    },

    _addCharacter: function(hero) {
        if (!hero || !hero.id) return;
        var cls = (typeof getClassData === 'function') ? getClassData(hero.classId) : null;
        var ent = {
            kind: 'char',
            id: hero.id,
            classId: hero.classId,  // for PNG sprite lookup
            name: (cls && cls.name) || hero.classId || '英雄',
            icon: (cls && cls.icon) || '🛡',
            level: hero.level || 1,
            x: 80 + Math.random() * Math.max(80, this.width - 160),
            y: this.height * 0.5 + (Math.random() - 0.5) * (this.height * 0.3),
            vx: 0,
            vy: 0,
            targetX: 0,
            targetY: 0,
            speed: this.cfg.charSpeed * (0.85 + Math.random() * 0.3),
            state: 'walk',  // walk | idle | say
            idleTimer: 0,
            sayText: '',
            sayTimer: 0,
            sayIntervalMs: 2500 + Math.random() * 3000
        };
        this._pickRandomTarget(ent);
        this.characters.push(ent);
    },

    _addMonsters: function(count) {
        if (typeof MONSTER_DATA === 'undefined') return;
        // ★ HOME_5 修复：优先展示玩家在图鉴中解锁过的怪物
        //   1. gameState.unlockedMonsters 包含玩家在战斗中解锁/遇到的图鉴怪物
        //   2. 不够时用全 friend 池补充
        var pool = MONSTER_DATA.filter(function(m) { return m && m.friend === true; });
        if (pool.length === 0) return;
        var unlockedIds = this.unlockedMonsters || [];
        var unlockedPool = pool.filter(function(m) { return unlockedIds.indexOf(m.id) >= 0; });
        // 默认池 = 解锁过的 + 其他网友怪物去重
        var combinedPool = unlockedPool.length > 0 ? unlockedPool.concat(pool) : pool;
        var usedIds = {};
        for (var i = 0; i < this.monsters.length; i++) {
            usedIds[this.monsters[i].id] = true;
        }
        for (var n = 0; n < count; n++) {
            // 随机抽不重复的怪物
            var pick = null;
            for (var tryI = 0; tryI < 8; tryI++) {
                var cand = combinedPool[Math.floor(Math.random() * combinedPool.length)];
                if (cand && !usedIds[cand.id]) { pick = cand; break; }
            }
            if (!pick) pick = combinedPool[Math.floor(Math.random() * combinedPool.length)];
            if (!pick) break;
            usedIds[pick.id] = true;
            this._addMonster(pick);
        }
        // ★ v7.9 家园装饰：小鹿（可爱吉祥物）
        this._addFawn();
    },

    // ★ HOME_5 联动：同步玩家在图鉴中解锁的怪物
    _loadUnlockedMonsters: function() {
        var gs = GameState.getAll() || {};
        var list = [];
        // 1. GameState.get('unlockedMonsters') 列表
        var unlockedMonsters = GameState.get('unlockedMonsters');
        if (unlockedMonsters && unlockedMonsters.length) {
            for (var i = 0; i < unlockedMonsters.length; i++) {
                list.push(unlockedMonsters[i]);
            }
        }
        // 2. 怪物图鉴中 marked="unlocked" 的也计算
        var monsterCodex = GameState.get('monsterCodex');
        if (monsterCodex && monsterCodex.length) {
            for (var j = 0; j < monsterCodex.length; j++) {
                var e = monsterCodex[j];
                if (e && e.unlocked && list.indexOf(e.id) < 0) list.push(e.id);
            }
        }
        this.unlockedMonsters = list;
    },

    // ★ HOME_5 记录玩家解锁新图鉴（供战斗逻辑调用）
    notifyCodexUnlocked: function(monsterId) {
        if (!monsterId) return;
        if (!this.unlockedMonsters) this.unlockedMonsters = [];
        if (this.unlockedMonsters.indexOf(monsterId) < 0) {
            this.unlockedMonsters.push(monsterId);
            this._codexNewUnlocks++;
        }
        // 同步到 gameState
        var unlockedMonsters = GameState.get('unlockedMonsters') || [];
        if (unlockedMonsters.indexOf(monsterId) < 0) {
            unlockedMonsters.push(monsterId);
            GameState.set('unlockedMonsters', unlockedMonsters);
        }
    },

    _addMonster: function(m) {
        var ent = {
            kind: 'monster',
            id: m.id,
            name: m.name,
            icon: m.icon,
            x: 60 + Math.random() * Math.max(60, this.width - 120),
            y: this.height * 0.45 + (Math.random() - 0.5) * (this.height * 0.4),
            vx: 0,
            vy: 0,
            targetX: 0,
            targetY: 0,
            speed: this.cfg.monsterSpeed * (0.7 + Math.random() * 0.5),
            state: 'walk',
            idleTimer: 0,
            sayText: '',
            sayTimer: 0,
            sayIntervalMs: 3000 + Math.random() * 4000
        };
        this._pickRandomTarget(ent);
        this.monsters.push(ent);
    },

    // ★ v7.9 添加小鹿吉祥物
    _addFawn: function() {
        var ent = {
            kind: 'fawn',
            id: 'fawn',
            name: '小鹿',
            icon: '🦌',
            x: 60 + Math.random() * Math.max(60, this.width - 120),
            y: this.height * 0.42 + (Math.random() - 0.5) * (this.height * 0.35),
            vx: 0, vy: 0, targetX: 0, targetY: 0,
            speed: 20 + Math.random() * 15,
            state: 'walk', idleTimer: 0,
            sayText: '', sayTimer: 0,
            sayIntervalMs: 5000 + Math.random() * 6000
        };
        this._pickRandomTarget(ent);
        this.monsters.push(ent);
    },

    _pickRandomTarget: function(ent) {
        ent.targetX = 60 + Math.random() * Math.max(60, this.width - 120);
        ent.targetY = this.height * 0.4 + (Math.random() - 0.5) * (this.height * 0.35);
        ent.state = 'walk';
    },

    // ★ HOME_5 新增：初始化装饰区域（两个帐篷 + 营火）★ v3.5.0 新增告示牌+木桩+资源点
    _initDecorAreas: function() {
        var w = this.width;
        var h = this.height;
        var grassTop = h * 0.55;
        // 根据当前场景调整颜色
        var sceneColors = this._getSceneColors();
        this.decorAreas = [
            {
                kind: 'tent',
                subId: 'left',
                x: w * 0.18, y: grassTop + 10, w: 80, h: 60,
                color: sceneColors.tentLeft,
                dialogs: [],
                action: 'menu'
            },
            {
                kind: 'tent',
                subId: 'right',
                x: w * 0.82, y: grassTop + 30, w: 90, h: 70,
                color: sceneColors.tentRight,
                dialogs: [],
                action: 'menu'
            },
            {
                kind: 'fire',
                subId: 'campfire',
                x: w * 0.5, y: h * 0.78,
                radius: 32,
                dialogs: [],
                action: 'cook'
            },
            {
                kind: 'lamb',
                subId: 'roastlamb',
                x: w * 0.5 + 80, y: h * 0.78 + 5,
                w: 80, h: 80,
                dialogs: [
                    '好香啊，再烤一会儿...',
                    '外酥里嫩，绝了！',
                    '这火候刚刚好~',
                    '撒点孜然更香！',
                    '闻着就饿了！',
                    '今天的晚餐有着落了',
                    '可惜没有辣椒面...',
                    '再来一只！',
                    '这羊肥得很，赚到了',
                    '谁把调料藏起来了？'
                ],
                action: 'lamb',
                label: '🍖'
            },
            {
                kind: 'sign',
                subId: 'quest',
                x: w * 0.05, y: grassTop - 5, w: 50, h: 65,
                dialogs: [],
                action: 'quests',
                label: '📋'
            },
            {
                kind: 'dummy',
                subId: 'training',
                x: w * 0.68, y: grassTop + 15, w: 35, h: 55,
                dialogs: [],
                action: 'dps',
                label: '🎯'
            },
            // 资源采集点（草药 + 矿石）
            {
                kind: 'resource',
                subId: 'herbs',
                x: w * 0.35, y: h * 0.65, w: 28, h: 28,
                action: 'collect_herb',
                label: '🌿',
                respawnTimer: 0
            },
            {
                kind: 'resource',
                subId: 'ore',
                x: w * 0.58, y: h * 0.70, w: 26, h: 26,
                action: 'collect_ore',
                label: '🪨',
                respawnTimer: 0
            },
            // ★ v7.9 新增：魔法锅（点击互动）
            {
                kind: 'cauldron',
                subId: 'cauldron',
                x: w * 0.5 - 90, y: h * 0.75,
                w: 48, h: 48,
                dialogs: ['咕嘟咕嘟...', '冒泡泡了~', '闻起来像魔法药水'],
                action: 'cauldron',
                label: '🔮'
            }
        ];
    },

    // ★ v3.5.0 场景颜色配置
    _getSceneColors: function() {
        var sc = this.currentScene || 'meadow';
        var colors = {
            meadow: { sky: ['#3a2540','#a85a4a','#ffb347'], mountain: '#3a3a52', grass: ['#5a8a3a','#3a6a26','#1f4014'],
                      tentLeft: '#c25a3a', tentRight: '#3a6aa0', fire: '#ff7733' },
            snow:   { sky: ['#1a2a3a','#3a5a6a','#8ab4c8'], mountain: '#6a7a8a', grass: ['#8a9a8a','#6a7a6a','#4a5a4a'],
                      tentLeft: '#8a3a2a', tentRight: '#2a5a8a', fire: '#ff8844' },
            forest: { sky: ['#1a3a1a','#3a5a2a','#6a8a4a'], mountain: '#3a5a3a', grass: ['#3a6a2a','#2a4a1a','#1a3a0a'],
                      tentLeft: '#6a4a2a', tentRight: '#2a5a4a', fire: '#ff6622' },
            volcano:{ sky: ['#3a1a1a','#6a2a1a','#9a4a2a'], mountain: '#4a2a1a', grass: ['#5a3a2a','#4a2a1a','#2a1a0a'],
                      tentLeft: '#9a3a2a', tentRight: '#4a3a6a', fire: '#ff4422' }
        };
        return colors[sc] || colors.meadow;
    },

    // ★ HOME_5 新增：点击事件分发
    _handleClick: function(x, y) {
        if (typeof AudioManager !== 'undefined' && AudioManager.play) AudioManager.play('click');
        // 1. 优先检查装饰物（帐篷/营火）
        if (this._checkDecorClick(x, y)) return;
        // 2. 其次检查实体（角色/怪物）
        if (this._checkEntityClick(x, y)) return;
        // 3. 空白处 → 清除选中状态
        this.selectedEntity = null;
    },

    // ★ HOME_5 新增：检测点击装饰物 ★ v3.5.0 路由到 campUI 功能
    _checkDecorClick: function(x, y) {
        for (var i = 0; i < this.decorAreas.length; i++) {
            var a = this.decorAreas[i];
            if (a.kind === 'fire') {
                var dx = x - a.x, dy = y - a.y;
                if (dx * dx + dy * dy <= a.radius * a.radius) {
                    if (typeof openCookingUI === 'function') openCookingUI();
                    else this._showDecorDialog(a);
                    return true;
                }
            } else if (a.kind === 'lamb') {
                // 烤全羊
                if (x >= a.x - 30 && x <= a.x + a.w + 10 && y >= a.y - 30 && y <= a.y + a.h) {
                    this._showDecorDialog(a);
                    return true;
                }
            } else if (a.kind === 'sign' || a.kind === 'dummy') {
                // 告示牌/木桩：使用更小命中框
                if (x >= a.x - 20 && x <= a.x + a.w + 20 && y >= a.y - 10 && y <= a.y + a.h + 10) {
                    if (a.action === 'quests' && typeof openQuestBoard === 'function') openQuestBoard();
                    else if (a.action === 'dps' && typeof startDPSTest === 'function') startDPSTest(15000);
                    return true;
                }
            } else if (a.kind === 'resource') {
                // 资源点：圆形命中
                var rdx = x - (a.x + a.w / 2), rdy = y - (a.y + a.h / 2);
                var r = Math.max(a.w, a.h) / 2 + 8;
                if (rdx * rdx + rdy * rdy <= r * r) {
                    this._collectResource(a);
                    return true;
                }
            } else {
                // 帐篷：矩形
                if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) {
                    if (typeof openTentMenu === 'function') openTentMenu(a.subId);
                    else this._showDecorDialog(a);
                    return true;
                }
            }
        }
        return false;
    },

    // ★ HOME_5 新增：检测点击实体（角色/怪物）
    _checkEntityClick: function(x, y) {
        var hitRadius = 22;
        // 优先检查角色（通常更显眼）
        for (var i = 0; i < this.characters.length; i++) {
            var c = this.characters[i];
            if (!c) continue;
            var dx = x - c.x, dy = y - c.y;
            if (dx * dx + dy * dy <= hitRadius * hitRadius) {
                this._showEntityDialog(c, 'char');
                return true;
            }
        }
        for (var j = 0; j < this.monsters.length; j++) {
            var m = this.monsters[j];
            if (!m) continue;
            var dx2 = x - m.x, dy2 = y - m.y;
            if (dx2 * dx2 + dy2 * dy2 <= hitRadius * hitRadius) {
                this._showEntityDialog(m, 'monster');
                return true;
            }
        }
        return false;
    },

    // ★ HOME_5 新增：显示装饰物对话
    _showDecorDialog: function(area) {
        if (!area || !area.dialogs || !area.dialogs.length) return;
        var text = area.dialogs[Math.floor(Math.random() * area.dialogs.length)];
        var maxTimer = 4000;
        this.decorDialog = {
            text: text,
            timer: maxTimer,
            maxTimer: maxTimer,
            x: area.x + (area.w ? area.w / 2 : 0),
            y: area.y - 10
        };
    },

    // ★ v3.5.0 采集资源点（存储到材料仓库）
    _collectResource: function(area) {
        if (!area || !area.subId) return;
        if (area.respawnTimer > 0) {
            if (typeof showToast === 'function') showToast('资源还未刷新', 'info');
            return;
        }
        var mats = GameState.get('materials');
        if (!mats) {
            mats = { herb: 0, ore: 0, forgeDust: 0, reforgestone: 0, lotteryStone: 0, upgradeStone: 0, gem: 0 };
            GameState.set('materials', mats);
        }
        var amount = 1 + Math.floor(Math.random() * 2);
        var label = '';
        if (area.subId === 'herbs') {
            mats.herb = (mats.herb || 0) + amount;
            GameState.set('materials', mats);
            label = '🌿 草药 x' + amount;
        } else if (area.subId === 'ore') {
            mats.ore = (mats.ore || 0) + amount;
            GameState.set('materials', mats);
            label = '🪨 矿石 x' + amount;
        }
        area.respawnTimer = 10000 + Math.random() * 5000;
        if (typeof showToast === 'function') showToast('采集成功！' + label, 'success');
    },

    // ★ v3.5.0 场景切换（自动解锁检测）
    checkSceneUnlock: function() {
        var maxStage = GameState.get('maxStage') || GameState.get('stage') || 1;
        for (var sc in this.scenes) {
            var s = this.scenes[sc];
            if (!s.unlocked && s.unlockStage && maxStage >= s.unlockStage) {
                s.unlocked = true;
                if (typeof showToast === 'function') showToast('🏔️ 新场景已解锁：' + s.name, 'success');
            }
        }
    },
    _showEntityDialog: function(ent, kind) {
        if (!ent) return;
        var info = (ent.name || '未知') + (ent.level ? ' Lv.' + ent.level : '');
        if (kind === 'monster' && ent.id) {
            var md=null;if(typeof MONSTER_DATA !== 'undefined'){for(var _es5_94=0;_es5_94<MONSTER_DATA.length;_es5_94++){if(MONSTER_DATA[_es5_94].id===ent.id){md=MONSTER_DATA[_es5_94];break;}}}
            if (md && md.desc) info += '\n' + md.desc;
            else info += '\n来自草原的友好小怪';
        } else if (kind === 'char') {
            info += '\n' + (ent.name || '英雄') + ' 已准备好战斗';
        }
        var maxTimer = 5000;
        this.selectedEntity = {
            ent: ent,
            timer: maxTimer,
            maxTimer: maxTimer
        };
    },

    // ★ HOME_5 多个场景切换 API（暂只实现草原营地，其他锁定）
    setScene: function(sceneId) {
        if (!this.scenes[sceneId]) return;
        if (!this.scenes[sceneId].unlocked) {
            if (typeof showToast === 'function') showToast('该场景尚未解锁', 'info');
            return;
        }
        this.currentScene = sceneId;
        if (typeof showToast === 'function') showToast('已切换到 ' + this.scenes[sceneId].name, 'info');
        // 重新初始化装饰 + 实体
        this._initDecorAreas();
    },
    getSceneList: function() {
        var self = this;
        return Object.keys(this.scenes).map(function(k) {
            return { id: k, name: self.scenes[k].name, icon: self.scenes[k].icon, unlocked: self.scenes[k].unlocked };
        });
    },

    // ====== 主循环 ======
    _loop: function() {
        if (!this.running) return;
        var now = performance.now();
        var dt = Math.min(50, now - this.lastTs);
        this.lastTs = now;
        this.update(dt);
        this.render();
        this.rafId = requestAnimationFrame(this._loop.bind(this));
    },

    update: function(dt) {
        var dtSec = dt / 1000;
        this.bgOffset = (this.bgOffset + dtSec * 6) % this.width;
        this.fireTimer += dt;

        // 篝火星星
        if (this.fireTimer > 120) {
            this.fireTimer = 0;
            this._spawnFireParticle();
        }
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dtSec;
            p.y += p.vy * dtSec;
            p.vy -= 18 * dtSec;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // 角色 + 怪物行为
        var list = this.characters.concat(this.monsters);
        for (var k = 0; k < list.length; k++) {
            var ent = list[k];
            if (ent.state === 'walk') {
                var dx = ent.targetX - ent.x;
                var dy = ent.targetY - ent.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 4) {
                    ent.state = 'idle';
                    ent.idleTimer = 1500 + Math.random() * 2500;
                    ent.vx = 0;
                    ent.vy = 0;
                } else {
                    ent.vx = (dx / dist) * ent.speed;
                    ent.vy = (dy / dist) * ent.speed;
                    ent.x += ent.vx * dtSec;
                    ent.y += ent.vy * dtSec;
                }
            } else if (ent.state === 'idle') {
                ent.idleTimer -= dt;
                if (ent.idleTimer <= 0) {
                    this._pickRandomTarget(ent);
                }
            }
            // 说话
            ent.sayIntervalMs -= dt;
            if (ent.sayIntervalMs <= 0 && ent.sayTimer <= 0) {
                var pool = ent.kind === 'char' ? this.SAY_TEXTS.char : this.SAY_TEXTS.monster;
                ent.sayText = pool[Math.floor(Math.random() * pool.length)];
                ent.sayTimer = this.cfg.sayShowMs;
                ent.sayIntervalMs = 4000 + Math.random() * 6000;
            }
            if (ent.sayTimer > 0) {
                ent.sayTimer -= dt;
                if (ent.sayTimer <= 0) ent.sayText = '';
            }
        }

        // 简单避让：同类型之间不重叠
        this._simpleSeparate(this.characters, 36);
        this._simpleSeparate(this.monsters, 40);

        // ★ v3.5.0 资源点刷新倒计时
        for (var di = 0; di < this.decorAreas.length; di++) {
            var da = this.decorAreas[di];
            if (da.kind === 'resource' && da.respawnTimer > 0) {
                da.respawnTimer -= dt;
                if (da.respawnTimer < 0) da.respawnTimer = 0;
            }
        }

        // ★ HOME_5 修复：装饰物对话气泡 + 实体查看面板的倒计时
        if (this.decorDialog && this.decorDialog.timer > 0) {
            this.decorDialog.timer -= dt;
            if (this.decorDialog.timer <= 0) this.decorDialog = null;
        }
        if (this.selectedEntity && this.selectedEntity.timer > 0) {
            this.selectedEntity.timer -= dt;
            if (this.selectedEntity.timer <= 0) this.selectedEntity = null;
        }
    },

    _simpleSeparate: function(arr, minDist) {
        for (var i = 0; i < arr.length; i++) {
            for (var j = i + 1; j < arr.length; j++) {
                var a = arr[i];
                var b = arr[j];
                var dx = b.x - a.x;
                var dy = b.y - a.y;
                var d2 = dx * dx + dy * dy;
                if (d2 < minDist * minDist && d2 > 0.01) {
                    var d = Math.sqrt(d2);
                    var push = (minDist - d) * 0.5;
                    var nx = dx / d;
                    var ny = dy / d;
                    a.x -= nx * push;
                    a.y -= ny * push;
                    b.x += nx * push;
                    b.y += ny * push;
                }
            }
        }
    },

    _spawnFireParticle: function() {
        // 篝火中心位置
        var cx = this.width * 0.5;
        var cy = this.height * 0.78;
        this.particles.push({
            x: cx + (Math.random() - 0.5) * 18,
            y: cy,
            vx: (Math.random() - 0.5) * 24,
            vy: -30 - Math.random() * 30,
            life: 800 + Math.random() * 400,
            maxLife: 1200,
            color: Math.random() < 0.5 ? '#ffaa44' : '#ff6644'
        });
    },

    // ====== 渲染 ======
    render: function() {
        if (!this.ctx) return;
        var ctx = this.ctx;
        var w = this.width;
        var h = this.height;

        // 天空（黄昏渐变）★ v3.5.0 场景颜色
        var sc = this._getSceneColors();
        var grassTop = h * 0.55;
        var campBg = (typeof BgLoader !== 'undefined') ? BgLoader.getCamp(this.currentScene || 'meadow') : null;
        if (campBg) {
            // ★ 图片背景优先
            ctx.drawImage(campBg, 0, 0, w, h);
        } else {
            // 旧版程序化绘制（图片未加载时兜底）
            var skyColors = sc.sky;
            var sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
            sky.addColorStop(0, skyColors[0]);
            sky.addColorStop(0.5, skyColors[1]);
            sky.addColorStop(1, skyColors[2]);
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, h);

            // 远山轮廓
            this._drawMountains(ctx, w, h);

            // 草地（场景配色）
            var grassColors = sc.grass;
            var grass = ctx.createLinearGradient(0, grassTop, 0, h);
            grass.addColorStop(0, grassColors[0]);
            grass.addColorStop(0.5, grassColors[1]);
            grass.addColorStop(1, grassColors[2]);
            ctx.fillStyle = grass;
            ctx.fillRect(0, grassTop, w, h - grassTop);
        }

        // 帐篷 × 2
        this._drawTent(ctx, w * 0.18, grassTop + 10, 80, 60, '#c25a3a');
        this._drawTent(ctx, w * 0.82, grassTop + 30, 90, 70, '#3a6aa0');

        // 灌木 × 4
        for (var g = 0; g < 4; g++) {
            var gx = (w * 0.1) + g * (w * 0.25) + (g % 2 === 0 ? 20 : -20);
            var gy = h - 50 + (g % 2 === 0 ? 0 : 8);
            this._drawBush(ctx, gx, gy, 22 + (g % 3) * 6);
        }

        // 篝火（中心）
        this._drawFire(ctx, w * 0.5, h * 0.78);
        // 烤全羊
        this._ensureImages();
        var lambImg = this._images['roast_lamb'];
        if (lambImg && lambImg.complete && lambImg.naturalWidth > 0) {
            ctx.drawImage(lambImg, w * 0.5 + 80 - 40, (h * 0.78 + 5) - 40, 80, 80);
        } else { (function() {
            var cx = w * 0.5 + 80, cy = h * 0.78 + 5;
            // === 支架（Y型木桩）===
            ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 4;
            // 左桩
            ctx.beginPath(); ctx.moveTo(cx-35, cy+20); ctx.lineTo(cx-35, cy-30); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx-35, cy-30); ctx.lineTo(cx-40, cy-42); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx-35, cy-30); ctx.lineTo(cx-28, cy-42); ctx.stroke();
            // 右桩
            ctx.beginPath(); ctx.moveTo(cx+35, cy+20); ctx.lineTo(cx+35, cy-30); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx+35, cy-30); ctx.lineTo(cx+40, cy-42); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx+35, cy-30); ctx.lineTo(cx+28, cy-42); ctx.stroke();
            // 横杆（烤签）
            ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(cx-48, cy-28); ctx.lineTo(cx+48, cy-28); ctx.stroke();
            ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx-48, cy-28); ctx.lineTo(cx+48, cy-28); ctx.stroke();
            
            // === 羊身（椭圆形，金棕色烤制）===
            var bodyGrad = ctx.createLinearGradient(cx, cy-10, cx, cy+10);
            bodyGrad.addColorStop(0, '#d4a057'); bodyGrad.addColorStop(0.5, '#c4863b'); bodyGrad.addColorStop(1, '#8b5e3c');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath(); ctx.ellipse(cx, cy-5, 28, 14, 0, 0, Math.PI*2); ctx.fill();
            // 烤焦纹理
            ctx.fillStyle = 'rgba(80,40,10,0.4)';
            ctx.beginPath(); ctx.ellipse(cx+2, cy-8, 20, 8, 0.15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(100,50,15,0.25)';
            ctx.beginPath(); ctx.ellipse(cx-4, cy-2, 18, 6, -0.1, 0, Math.PI*2); ctx.fill();
            
            // === 羊头（朝右）===
            ctx.fillStyle = '#c49650';
            ctx.beginPath(); ctx.ellipse(cx+30, cy-18, 10, 8, 0.4, 0, Math.PI*2); ctx.fill();
            // 耳朵
            ctx.fillStyle = '#a07040';
            ctx.beginPath(); ctx.ellipse(cx+35, cy-24, 5, 3, 0.5, 0, Math.PI*2); ctx.fill();
            // 嘴巴
            ctx.fillStyle = '#e8c890';
            ctx.beginPath(); ctx.ellipse(cx+36, cy-15, 4, 3, 0.3, 0, Math.PI*2); ctx.fill();
            // 眼睛（闭眼，烤制状态）
            ctx.strokeStyle = '#4a3520'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx+33, cy-20, 1.5, Math.PI, 0); ctx.stroke();
            
            // === 四条腿（朝上绑在烤签上）===
            ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 3;
            var legPositions = [{x: cx-16, a: -0.6}, {x: cx-6, a: -0.3}, {x: cx+6, a: 0.3}, {x: cx+16, a: 0.6}];
            for (var li=0; li<4; li++) {
                var lx = legPositions[li].x;
                ctx.beginPath();
                ctx.moveTo(lx, cy+6);
                ctx.quadraticCurveTo(lx + legPositions[li].a*8, cy-15, lx + legPositions[li].a*5, cy-26);
                ctx.stroke();
                // 蹄子
                ctx.fillStyle = '#3e2723';
                ctx.beginPath();
                ctx.arc(lx + legPositions[li].a*5, cy-26, 2.5, 0, Math.PI*2);
                ctx.fill();
            }
            
            // === 绑绳（在烤签和腿之间）===
            ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 1;
            for (var bi=0; bi<4; bi++) {
                ctx.beginPath();
                ctx.arc(cx-16+bi*10, cy-28, 4, 0, Math.PI*2);
                ctx.stroke();
            }
            
            // === 尾巴 ===
            ctx.fillStyle = '#f5f5dc';
            ctx.beginPath(); ctx.arc(cx-28, cy-12, 4, 0, Math.PI*2); ctx.fill();
            
            // === 下方火焰 ===
            for (var fi=0; fi<5; fi++) {
                var fx = cx-20 + fi*10 + Math.sin(Date.now()/300+fi)*2;
                var fy = cy+16;
                var fh = 8 + Math.random()*10 + Math.abs(Math.cos(Date.now()/200+fi))*6;
                var flameGrad = ctx.createLinearGradient(fx, fy, fx, fy-fh);
                flameGrad.addColorStop(0, 'rgba(255,60,0,0.9)');
                flameGrad.addColorStop(0.4, 'rgba(255,150,0,0.7)');
                flameGrad.addColorStop(0.8, 'rgba(255,220,50,0.3)');
                flameGrad.addColorStop(1, 'rgba(255,255,200,0)');
                ctx.fillStyle = flameGrad;
                ctx.beginPath();
                ctx.moveTo(fx-3, fy);
                ctx.quadraticCurveTo(fx-2, fy-fh*0.7, fx, fy-fh);
                ctx.quadraticCurveTo(fx+2, fy-fh*0.7, fx+3, fy);
                ctx.fill();
            }
            
            // === 烟/香气 ===
            ctx.fillStyle = 'rgba(180,180,180,0.15)';
            for (var si=0; si<3; si++) {
                var sx = cx-8+si*12 + Math.sin(Date.now()/400+si)*4;
                var sy = cy-30 - si*6 - Math.cos(Date.now()/350+si)*5;
                ctx.beginPath(); ctx.arc(sx, sy, 4+si, 0, Math.PI*2); ctx.fill();
            }
        })(); }

        // 怪物（在远处 / 草地上）
        for (var mi = 0; mi < this.monsters.length; mi++) {
            this._drawMonster(ctx, this.monsters[mi]);
        }

        // 角色（在篝火附近）
        for (var ci = 0; ci < this.characters.length; ci++) {
            this._drawCharacter(ctx, this.characters[ci]);
        }

        // ★ v3.5.0 新装饰：告示牌 + 木桩 + 资源点
        this._drawSign(ctx, w * 0.05, grassTop - 5, 50, 65);
        this._drawDummy(ctx, w * 0.68, grassTop + 15, 35, 55);
        this._drawResourcePoints(ctx);
        // ★ v7.9 魔法锅
        this._drawCauldron(ctx);

        // 篝火星星（最后画，盖在所有东西上）
        this._drawParticles(ctx);

        // ★ HOME_5 修复：最后绘制装饰对话气泡 + 实体查看面板
        this._drawDecorDialogOverlay(ctx);
        this._drawSelectedEntityPanel(ctx);
    },

    // ★ v3.5.0 绘制告示牌
    _drawSign: function(ctx, x, y, w, h) {
        this._ensureImages();
        var img = this._images['quest_board'];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x - 5, y - 8, w + 10, h + 12);
            return;
        }
        // 木柱
        ctx.fillStyle = '#5a3a2a';
        ctx.fillRect(x + w * 0.45, y + h * 0.4, 5, h * 0.6);
        // 告示板
        ctx.fillStyle = '#6a4a2a';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, w, h * 0.55, 4) : ctx.rect(x, y, w, h * 0.55);
        ctx.fill();
        ctx.strokeStyle = '#8a6a3a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 图标
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📋', x + w / 2, y + h * 0.28);
    },

    // ★ v3.5.0 绘制训练木桩（dps 测试）
    _drawDummy: function(ctx, x, y, w, h) {
        this._ensureImages();
        var img = this._images['target'];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x - 8, y - 8, w + 16, h + 16);
            return;
        }
        // 木桩，程序化回退
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(x + w * 0.4, y + h * 0.5, 6, h * 0.5);
        // 靶心
        ctx.fillStyle = '#8a5a3a';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.3, w * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 靶心红点
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.3, w * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // 文字
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DPS', x + w / 2, y + h * 0.7);
    },

    // ★ v7.9 绘制魔法锅
    _drawCauldron: function(ctx) {
        this._ensureImages();
        var img = this._images['cauldron'];
        for (var i = 0; i < this.decorAreas.length; i++) {
            var a = this.decorAreas[i];
            if (a.kind !== 'cauldron') continue;
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, a.x - a.w/2, a.y - a.h/2, a.w, a.h);
            } else {
                ctx.fillStyle = '#3a2a1a';
                ctx.beginPath(); ctx.arc(a.x, a.y, a.w/2, 0, Math.PI*2); ctx.fill();
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🔮', a.x, a.y);
            }
        }
    },

    // ★ v3.5.0 绘制资源采集点
    _drawResourcePoints: function(ctx) {
        for (var i = 0; i < this.decorAreas.length; i++) {
            var a = this.decorAreas[i];
            if (a.kind !== 'resource') continue;
            if (a.respawnTimer > 0) continue; // 刷新中不显示
            var cx = a.x + a.w / 2;
            var cy = a.y + a.h / 2;
            // 光晕
            var glow = Math.sin(this.lastTs * 0.004) * 0.3 + 0.7;
            ctx.fillStyle = a.subId === 'herbs' ? 'rgba(76,175,80,' + glow * 0.3 + ')' : 'rgba(158,158,158,' + glow * 0.3 + ')';
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(a.w, a.h) * 0.7, 0, Math.PI * 2);
            ctx.fill();
            // 图标
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(a.label, cx, cy);
        }
    },

    _drawMountains: function(ctx, w, h) {
        var yBase = h * 0.45;
        ctx.fillStyle = '#3a3a52';
        ctx.beginPath();
        ctx.moveTo(0, yBase);
        for (var x = 0; x <= w; x += 32) {
            var peakY = yBase - 30 - Math.abs(Math.sin(x * 0.012)) * 50;
            ctx.lineTo(x, peakY);
        }
        ctx.lineTo(w, yBase);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#5a4a52';
        ctx.beginPath();
        ctx.moveTo(0, yBase + 14);
        for (var x2 = 0; x2 <= w; x2 += 28) {
            var p2 = yBase + 14 - 18 - Math.abs(Math.cos(x2 * 0.018)) * 28;
            ctx.lineTo(x2, p2);
        }
        ctx.lineTo(w, yBase + 14);
        ctx.closePath();
        ctx.fill();
    },

    _drawTent: function(ctx, x, y, w, h, color) {
        this._ensureImages();
        var img = this._images['tent'];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x - 10, y - 15, w + 20, h + 20);
            return;
        }
        // 回退：程序化绘制
        // 主体三角
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();
        // 边线
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 门
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.42, y + h);
        ctx.lineTo(x + w * 0.5, y + h * 0.45);
        ctx.lineTo(x + w * 0.58, y + h);
        ctx.closePath();
        ctx.fill();
        // 旗杆
        ctx.strokeStyle = '#5a3a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y - 14);
        ctx.stroke();
    },

    _drawBush: function(ctx, x, y, r) {
        ctx.fillStyle = '#2a4a1a';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.arc(x + r * 0.7, y - r * 0.2, r * 0.8, 0, Math.PI * 2);
        ctx.arc(x - r * 0.6, y - r * 0.1, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.arc(x - r * 0.2, y - r * 0.4, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawFire: function(ctx, x, y) {
        this._ensureImages();
        var img = this._images['campfire'];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x - 32, y - 36, 64, 54);
            return;
        }
        // 回退：灰烬堆
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.ellipse(x, y + 4, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // 火焰
        var flicker = Math.sin(this.lastTs * 0.012) * 3;
        ctx.fillStyle = '#ff7733';
        ctx.beginPath();
        ctx.moveTo(x - 14, y);
        ctx.quadraticCurveTo(x - 6, y - 28 - flicker, x, y - 36 - flicker);
        ctx.quadraticCurveTo(x + 6, y - 28 - flicker, x + 14, y);
        ctx.closePath();
        ctx.fill();
        // 内焰
        ctx.fillStyle = '#ffdd66';
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 2);
        ctx.quadraticCurveTo(x - 3, y - 16 - flicker * 0.6, x, y - 22 - flicker * 0.6);
        ctx.quadraticCurveTo(x + 3, y - 16 - flicker * 0.6, x + 7, y - 2);
        ctx.closePath();
        ctx.fill();
    },

    _drawParticles: function(ctx) {
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            var alpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5 + alpha * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    _drawCharacter: function(ctx, ent) {
        var x = ent.x;
        var y = ent.y;
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 18, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 使用 PNG 精灵绘制角色
        var bob = ent.state === 'walk' ? Math.sin(this.lastTs * 0.008) * 1.2 : 0;
        if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer._tryDrawClassImage) {
            SpriteRenderer._ensureImages();
            if (!SpriteRenderer._tryDrawClassImage(ctx, ent.classId, 'idle', x, y + bob, 14)) {
                // 回退：圆形 + 表情
                ctx.fillStyle = '#3a5a8a';
                ctx.beginPath();
                ctx.arc(x, y + bob, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ent.icon, x, y + bob);
            }
        } else {
            ctx.fillStyle = '#3a5a8a';
            ctx.beginPath();
            ctx.arc(x, y + bob, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ent.icon, x, y + bob);
        }

        // 名字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textBaseline = 'top';
        var nameText = ent.name + ' Lv.' + ent.level;
        var tw = ctx.measureText(nameText).width;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x - tw / 2 - 4, y - 30, tw + 8, 14);
        ctx.fillStyle = '#ffd';
        ctx.fillText(nameText, x, y - 28);

        // 气泡
        if (ent.sayText) {
            this._drawBubble(ctx, x, y - 50, ent.sayText);
        }
    },

    _drawMonster: function(ctx, ent) {
        var x = ent.x;
        var y = ent.y;
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 18, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        var bob = ent.state === 'walk' ? Math.sin(this.lastTs * 0.006 + ent.x) * 1.4 : 0;
        // ★ v7.9 小鹿：使用家园专属PNG
        if (ent.kind === 'fawn') {
            this._ensureImages();
            var fawnImg = this._images['fawn'];
            if (fawnImg && fawnImg.complete && fawnImg.naturalWidth > 0) {
                ctx.drawImage(fawnImg, x - 22, y + bob - 24, 44, 44);
            } else {
                ctx.fillStyle = '#5a3a6a';
                ctx.beginPath(); ctx.arc(x, y + bob, 16, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🦌', x, y + bob);
            }
            // 名字
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textBaseline = 'top';
            var nameText = ent.name;
            var tw = ctx.measureText(nameText).width;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(x - tw / 2 - 4, y - 30, tw + 8, 14);
            ctx.fillStyle = '#ffd';
            ctx.fillText(nameText, x, y - 28);
            return;
        }
        // 使用 PNG 精灵绘制怪物
        if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer._tryDrawMonsterImage) {
            SpriteRenderer._ensureImages();
            if (!SpriteRenderer._tryDrawMonsterImage(ctx, ent.name, x, y + bob, 14, false)) {
                // 回退：圆形 + 表情
                ctx.fillStyle = '#5a3a6a';
                ctx.beginPath();
                ctx.arc(x, y + bob, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#8a5aaa';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ent.icon, x, y + bob);
            }
        } else {
            ctx.fillStyle = '#5a3a6a';
            ctx.beginPath();
            ctx.arc(x, y + bob, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8a5aaa';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ent.icon, x, y + bob);
        }
        // 名字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textBaseline = 'top';
        var tw = ctx.measureText(ent.name).width;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x - tw / 2 - 4, y - 30, tw + 8, 12);
        ctx.fillStyle = '#ddd';
        ctx.fillText(ent.name, x, y - 28);
        // 气泡
        if (ent.sayText) {
            this._drawBubble(ctx, x, y - 48, ent.sayText);
        }
    },

    _drawBubble: function(ctx, x, y, text) {
        ctx.font = '11px sans-serif';
        var padX = 6, padY = 4;
        var tw = ctx.measureText(text).width;
        var w = tw + padX * 2;
        var h = 16;
        var bx = x - w / 2;
        var by = y - h;
        // 背景
        ctx.fillStyle = 'rgba(255, 250, 220, 0.95)';
        ctx.strokeStyle = 'rgba(80,60,30,0.7)';
        ctx.lineWidth = 1.2;
        this._roundRect(ctx, bx, by, w, h, 6);
        ctx.fill();
        ctx.stroke();
        // tail
        ctx.fillStyle = 'rgba(255, 250, 220, 0.95)';
        ctx.beginPath();
        ctx.moveTo(x - 5, by + h);
        ctx.lineTo(x, by + h + 6);
        ctx.lineTo(x + 5, by + h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,60,30,0.7)';
        ctx.stroke();
        // 文字
        ctx.fillStyle = '#2a1a0a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, by + h / 2);
    },

    _roundRect: function(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    },

    // ★ HOME_5 修复：绘制装饰物对话气泡（点击帐篷/营火后弹出）
    _drawDecorDialogOverlay: function(ctx) {
        if (!this.decorDialog) return;
        var d = this.decorDialog;
        var padX = 10, padY = 6, lineH = 18;
        ctx.font = '12px sans-serif';
        // ★ HOME_5 修复：先按 \n 拆行，再对单行内超长文字自动换行
        var maxBoxW = Math.min(260, this.width - 24);
        var innerMaxW = maxBoxW - padX * 2;
        var wrapText = function(text, maxW) {
            ctx.font = '12px sans-serif';
            var lines = [];
            var current = '';
            for (var i = 0; i < text.length; i++) {
                var ch = text[i];
                var test = current + ch;
                var w = ctx.measureText(test).width;
                if (w > maxW && current.length > 0) {
                    lines.push(current);
                    current = ch;
                } else {
                    current = test;
                }
            }
            if (current.length > 0) lines.push(current);
            return lines;
        };
        var rawLines = (d.text || '').split('\n');
        var lines = [];
        for (var ri = 0; ri < rawLines.length; ri++) {
            var sub = wrapText(rawLines[ri], innerMaxW);
            for (var si = 0; si < sub.length; si++) lines.push(sub[si]);
        }
        // 限制最多 4 行，避免面板太高
        var maxLines = 4;
        if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            var lastLine = lines[maxLines - 1];
            if (lastLine.length > 1) lines[maxLines - 1] = lastLine.slice(0, -1) + '…';
            else lines[maxLines - 1] = '…';
        }
        var boxW = maxBoxW;
        var boxH = lines.length * lineH + padY * 2;
        // 绑定坐标 (d.x/d.y 是装饰中心上方) - 如果超出左/右则调整
        var bx = d.x - boxW / 2;
        if (bx < 8) bx = 8;
        if (bx + boxW > this.width - 8) bx = this.width - 8 - boxW;
        var by = d.y - boxH - 8;
        if (by < 8) by = 8;
        // 背景
        ctx.fillStyle = 'rgba(20, 10, 5, 0.92)';
        ctx.strokeStyle = '#ffaa55';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, bx, by, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();
        // tail
        ctx.fillStyle = 'rgba(20, 10, 5, 0.92)';
        ctx.beginPath();
        var tailX = d.x;
        if (tailX < bx + 14) tailX = bx + 14;
        if (tailX > bx + boxW - 14) tailX = bx + boxW - 14;
        ctx.moveTo(tailX - 6, by + boxH);
        ctx.lineTo(tailX, by + boxH + 8);
        ctx.lineTo(tailX + 6, by + boxH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 文字
        ctx.fillStyle = '#ffe8c8';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (var k = 0; k < lines.length; k++) {
            ctx.fillText(lines[k], bx + padX, by + padY + k * lineH);
        }
        ctx.textAlign = 'center';
    },

    // ★ HOME_5 修复：绘制实体查看面板（点击角色/怪物后弹出）
    _drawSelectedEntityPanel: function(ctx) {
        if (!this.selectedEntity || !this.selectedEntity.ent) return;
        var se = this.selectedEntity;
        var ent = se.ent;
        var label = (ent.name || '未知') + (ent.level ? ' Lv.' + ent.level : '');
        var desc = '';
        if (ent.kind === 'monster' && typeof MONSTER_DATA !== 'undefined') {
            var md=null;var _es5_95=MONSTER_DATA;for(var _es5_96=0;_es5_96<_es5_95.length;_es5_96++){if(_es5_95[_es5_96].id === ent.id){md=_es5_95[_es5_96];break;}};
            if (md) {
                desc = md.desc || '来自草原的友好小怪';
                // 显示职业定位
                if (md.role) desc = '【' + (md.role === 'tank' ? '坦克' : md.role === 'dps' ? '输出' : md.role === 'heal' ? '治疗' : '辅助') + '】' + desc;
            } else {
                desc = '来自草原的友好小怪';
            }
        } else if (ent.kind === 'char') {
            desc = '你的上阵英雄，随时准备战斗';
        }
        var padX = 12, padY = 8, lineH = 18;
        // ★ HOME_5 修复：面板宽度不能超过屏幕宽度 30% （太宽不好看）
        var maxBoxW = Math.min(280, this.width - 24);
        var innerMaxW = maxBoxW - padX * 2;

        // ★ HOME_5 修复：文字自动换行（中英文按字符）
        var wrapText = function(text, maxW) {
            ctx.font = '11px sans-serif';
            var lines = [];
            var current = '';
            for (var i = 0; i < text.length; i++) {
                var ch = text[i];
                var test = current + ch;
                var w = ctx.measureText(test).width;
                if (w > maxW && current.length > 0) {
                    lines.push(current);
                    current = ch;
                } else {
                    current = test;
                }
            }
            if (current.length > 0) lines.push(current);
            return lines;
        };
        var descLines = wrapText(desc, innerMaxW);
        // 限制最多显示行数（避免面板太高，限制 5 行）
        var maxDescLines = 5;
        if (descLines.length > maxDescLines) {
            descLines = descLines.slice(0, maxDescLines);
            var last = descLines[maxDescLines - 1];
            if (last.length > 1) descLines[maxDescLines - 1] = last.slice(0, -1) + '…';
            else descLines[maxDescLines - 1] = '…';
        }

        var boxW = maxBoxW;
        var boxH = (1 + descLines.length) * lineH + padY * 2 + 6; // +6 for 进度条间距
        // 显示在选中实体的右侧（屏幕右半区）
        var bx = ent.x + 24;
        if (bx + boxW > this.width - 8) bx = this.width - 8 - boxW;
        var by = ent.y - boxH - 18;
        if (by < 8) by = ent.y + 18;
        // 背景
        ctx.fillStyle = 'rgba(15, 25, 45, 0.92)';
        ctx.strokeStyle = '#5a8aaa';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, bx, by, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();
        // 文字
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#ffd';
        ctx.fillText(label, bx + padX, by + padY);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#cde';
        for (var k = 0; k < descLines.length; k++) {
            ctx.fillText(descLines[k], bx + padX, by + padY + (k + 1) * lineH);
        }
        // 倒计时条
        var ratio = Math.max(0, Math.min(1, se.timer / se.maxTimer));
        var barW = boxW - padX * 2;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(bx + padX, by + boxH - 4, barW, 2);
        ctx.fillStyle = ratio > 0.3 ? '#7aff7a' : '#ff7a7a';
        ctx.fillRect(bx + padX, by + boxH - 4, barW * ratio, 2);
        ctx.textAlign = 'center';
    }
};

// 暴露给全局
window.HomeSystem = HomeSystem;
