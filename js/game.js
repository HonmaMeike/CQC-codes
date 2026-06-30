/* global Formulas, BattleManager, AudioManager, PixiFx, ConfigLoader, IconRenderer, GameState */
/* exported gameState, STAGE_NAMES, getStageName, getRecommendedPower, initGameState, initGame */

// ========== 游戏主入口 ==========

// 全局游戏状态
var gameState = null;

// 关卡名列表
var STAGE_NAMES = ['新手草原', '幽暗森林', '亡灵墓地', '火焰山谷', '冰封雪原', '远古遗迹', '深渊裂隙', '龙之巢穴', '神之领域',
    '混沌边境', '虚空回廊', '星界走廊', '时间尽头', '永恒战场', '末日火山', '风暴之眼', '暗影国度',
    '水晶洞穴', '钢铁要塞', '翡翠林地', '熔火深渊', '霜冻王座', '雷霆崖顶', '迷雾沼泽', '幻境迷宫',
    '龙骨荒原', '恶魔城堡', '天使圣殿', '万神殿', '起源之地', '星辰之塔', '无尽炼狱', '轮回之境',
    '创世之柱', '黄昏之谷', '黎明之峰', '永恒之井', '命运之轮', '混沌之源', '秩序之巅', '虚无之界',
    '初始之火', '终焉之海', '奇迹之原', '深渊之底', '苍穹之上', '万象之门', '归一之地',
    // === Ch49-60 圣光神界篇 ===
    '圣光之境', '远古神坛', '圣火祭坛', '神木圣林', '神圣泉源', '圣战遗迹',
    '光明王座', '圣光陨落', '神裔战痕', '圣堂深渊', '神谕之塔', '圣典之库',
    // === Ch61-70 时空秘境篇 ===
    '镜面之海', '倒影都市', '镜像战场', '时间漩涡', '过去之门', '未来之城',
    '时之沙海', '因果之环', '命运神殿', '时空尽头',
    // === Ch71-80 元素本源篇 ===
    '火焰本源', '寒冰本源', '雷霆本源', '暗影本源', '光明本源', '风之圣殿',
    '大地之心', '圣水之渊', '元素交汇', '元初混沌',
    // === Ch81-90 魔界深渊篇 ===
    '魔界之门', '暗影王座', '血池炼狱', '冥河之畔', '幽冥都城', '恶魔战场',
    '魔龙深渊', '混沌魔殿', '终极魔影', '魔界之心',
    // === Ch91-100 终焉与新生篇 ===
    '终焉之地', '创世残响', '虚无深渊', '星辰寂灭', '宇宙崩裂', '永恒终末',
    '涅槃之火', '重生原野', '万象归一', '创世原点'
];
function getStageName(stage) {
    return STAGE_NAMES[Math.min(stage - 1, STAGE_NAMES.length - 1)] || '未知区域';
}

/**
 * 获取推荐战力（委托 Formulas 统一公式，无 fallback）
 * @param {number} stage - 章节号
 * @returns {number} 推荐战力值
 */
function getRecommendedPower(stage) {
    if (typeof Formulas === 'undefined') {
        console.warn('Formulas not loaded, returning default power');
        return 100;
    }
    return Formulas.getRecommendedPower(stage);
}

// 初始化游戏状态
function initGameState() {
    return {
        gold: 100,
        goldPerKill: 3,
        stage: 1,
        wave: 1,
        soundMuted: false,
        // 音频独立控制（v2.1.0+）
        bgmEnabled: true,
        bgmVolume: 0.5,
        sfxEnabled: true,
        sfxVolume: 0.7,
        heroes: [
            { id: 'hero_knight', classId: 'knight', level: 1, exp: 0, expToNext: 100, skills: ['shield_bash', 'holy_shield', 'war_cry', 'iron_wall'], equip: {}, skillLevels: { shield_bash: 1 }, skillPoints: 2 },
            { id: 'hero_mage', classId: 'mage', level: 1, exp: 0, expToNext: 100, skills: ['fireball', 'frost_nova', 'arcane_blast', 'mana_shield'], equip: {}, skillLevels: { fireball: 1 }, skillPoints: 2 }
        ],
        team: { front: { id: 'hero_knight', classId: 'knight', level: 1, exp: 0, expToNext: 100, skills: ['shield_bash', 'holy_shield', 'war_cry', 'iron_wall'], equip: {}, skillLevels: { shield_bash: 1 }, skillPoints: 2 }, back1: null, back2: null, back3: null },
        unlockedSlots: 2,
        inventory: [],
        maxInventory: 100,
        // ★ v2.6.4 Round 4.4: 仓库扩容改为累加 warehouseExpandLevels
        //   (旧字段 warehousePages 已废弃, 加载时自动迁移: 旧 pages > 1 时, 把超过 1 的部分 × 1 算成 levels)
        warehouseExpandLevels: 0,
        maxStage: 1,
        talents: [],
        gems: [],
        magicCore: 0,  // 魔核（独立货币，与镶嵌宝石区分）
        forgeDust: 0,
        reforgestone: 0,
        totalPlayTime: 0,
        monstersKilled: 0,
        // ========== 成就系统 ==========
        achievements: {},
        totalKills: 0,
        totalGoldEarned: 0,
        totalEquipObtained: 0,
        totalFuse: 0,
        maxTowerFloor: 0,
        highestEnhanceLevel: 0,
        totalDamageDealt: 0,      // 累计总伤害
        demonKingKills: 0,        // 魔王击杀次数
        dailyDungeonTotal: 0,     // 副本通关次数
        totalItemsSold: 0,        // 出售装备数
        maxGemLevel: 0,           // 历史最高宝石等级
        totalPetsEvolved: 0,      // 宠物进化次数
        lastSaveTime: Date.now(),
        autoProcess: { enabled: false, qualities: [], action: 'sell' },
        stamina: 60,
        lastStaminaTime: Date.now(),
        // ========== 爬塔·无尽 + 抽奖系统 v6.2 ==========
        // 抽奖石（货币）— 由爬塔 BOSS 层掉落，用于抽奖系统
        lotteryStone: 0,
        // 升级石（用于装备升阶融合）
        upgradeStone: 0,
        // 爬塔进度
        tower: (typeof initTowerState === 'function') ? initTowerState() : { currentFloor: 1, maxFloor: 1, bestFloor: 1, totalRuns: 0, totalDeaths: 0, lastReward: null },
        // 抽奖历史
        lotteryHistory: [],
        // 装备图鉴
        equipCodex: {},
        // ========== 魔王副本 v7.3 ==========
        lastDemonKingDate: '',     // 最后挑战日期（每日限制）
        demonKingRecord: 0,        // 最高伤害记录
        // ========== 转生系统 ==========
        rebirthPoints: 0,        // 可用轮回点数
        rebirthBonuses: {},      // 已购买轮回加成 { atkPct: 0, goldFind: 0, expGain: 0, qualityBonus: 0, extraSlots: 0 }
        rebirthCount: 0,         // 总转生次数
        hasRebirthed: false,      // 是否已解锁转生
        // ========== 槽位强化系统 v6.2 ==========
        slotLevels: {},           // { heroId: { weapon: 5, armor: 3, ... } }
        // ★ v3.5.0 家园新系统
        campResources: { herbs: 0, ore: 0, lastCollectTime: 0 },
        monsterBonds: {},
        activeCampBuff: null,
        // ★ v3.5.0 材料仓库（独立容量，可叠加）
        materials: { herb: 0, ore: 0, lotteryStone: 0, upgradeStone: 0, gem: 0 },
        // ★ v3.5.0 每日任务
        dailyKills: 0,
        dailyStages: 0,
        dailyDungeons: 0,
        dailyDecompose: 0,
        dailyGoldEarned: 0,
        _dailyQuestDate: '',
        _dailyQuestClaimed: {},
        // ========== 宠物系统 v6.2 ==========
        pets: [],             // [{ id, level, exp, stage }]
        activePets: [],       // 当前上阵的宠物ID数组（最多3个）
        petFood: 0,            // 宠物食物数量
        petShards: {},         // 宠物碎片 { petId: count }
        petStars: {},          // 宠物星数 { petId: star } (0-5)
        petEggStones: 0,       // 宠物蛋石（抽奖货币）
        petIncubators: [       // 孵化槽 x3
            { tier: null, hatchTime: 0 },
            { tier: null, hatchTime: 0 },
            { tier: null, hatchTime: 0 }
        ],
        petEggStorage: []      // 蛋仓库: [{ tier: 'normal', count: 3 }]
    };
}

// 初始化游戏
// ★ v2.6.2: 宝石存档迁移（旧的 'normal' 字符串宝石补 gemTypeId）
//   老存档里 gameState.gems 可能含有 { level, gemType: 'normal' } 字符串宝石，没 gemTypeId
//   渲染时 GEM_TYPES.find(undefined) 返回 null 导致显示「未知宝石」
//   这里遍历 gameState.gems 给没 gemTypeId 的宝石随机补一个真 gemTypeId
function _migrateGemSaveData() {
    if (!gameState) return 0;
    var gems = GameState.get('gems');
    if (!gems || !gems.length) return 0;
    if (typeof GEM_TYPES === 'undefined' || !GEM_TYPES.length) return 0;
    var migrated = 0;
    for (var i = 0; i < gems.length; i++) {
        var g = gems[i];
        if (!g) { gems.splice(i, 1); i--; migrated++; continue; }
        // ★ 修复旧成就宝石 { type: 'ruby', level: 1 } → { gemTypeId, level, count, gemType }
        if (g.type && !g.gemTypeId) {
            g.gemTypeId = g.type;
            g.count = g.count || 1;
            delete g.type;
            migrated++;
        }
        // ★ 确保 count 字段存在
        if (!g.count) g.count = 1;
        // ★ 确保 gemTypeId 存在（兜底）
        if (!g.gemTypeId) {
            g.gemTypeId = 'ruby';
            g.level = g.level || 1;
            g.count = g.count || 1;
            migrated++;
        }
        // 已有有效 gemTypeId 且 gemType 不是字符串 → 跳过
        if (typeof g.gemTypeId === 'string' && typeof g.gemType !== 'string') continue;
        // 只有 gemTypeId 缺失或 gemType 是旧格式字符串时才修复
        if (typeof g.gemTypeId !== 'string' || typeof g.gemType === 'string') {
            // 尝试从 gemType 字符串反查 GEM_TYPES
            var matched = null;
            if (typeof g.gemType === 'string') {
                matched = null;
                for (var _fi = 0; _fi < GEM_TYPES.length; _fi++) {
                    if (GEM_TYPES[_fi].id === g.gemType || GEM_TYPES[_fi].name === g.gemType) {
                        matched = GEM_TYPES[_fi]; break;
                    }
                }
            }
            if (matched) {
                g.gemTypeId = matched.id;
            } else {
                // 兜底：用红宝石
                g.gemTypeId = 'ruby';
            }
            g.gemType = null;
            migrated++;
        }
    }
    if (migrated > 0) GameState.set('gems', gems);
    return migrated;
}

function initGame() {
    // 预渲染装备和宝石图标
    if (typeof IconRenderer !== 'undefined') {
        IconRenderer.preRenderAll();
    }
    
    // 初始化音效
    if (typeof AudioManager !== 'undefined') {
        AudioManager.init();
        // 移动端 Safari/Chrome 需要用户首次交互后才能创建 AudioContext
        AudioManager.bindUserGesture();
    }
    
    // 强制清除所有版本存档缓存，确保从第1章开始
    try {
    // localStorage.removeItem('cqc_idle_rpg_save'); (disabled)
    // localStorage.removeItem('cqc_idle_rpg_save_v2'); (disabled)
        console.log('已清除旧版本存档');
    } catch(e) {}
    
    // 尝试加载存档
    var saved = loadGame();
    if (saved && saved.heroes && saved.heroes.length > 0) {
        gameState = saved;
        // ★ v6.0.16 统一补齐缺失字段：用 initGameState() 的默认值填充所有不存在字段
        var defaultState = initGameState();
        for (var _key in defaultState) {
            if (typeof gameState[_key] === 'undefined') {
                gameState[_key] = defaultState[_key];
                console.log('[Save] 补全新字段: ' + _key);
            }
        }
        // 但保留旧存档的版本号
        gameState.version = saved.version || CURRENT_SAVE_VERSION;
        // 兼容旧版阵容格式 (fl/fr/bl/br -> front/back1/back2/back3)
        if (GameState.get('team') && GameState.get('team').fl !== undefined) {
            var oldTeam = GameState.get('team');
            GameState.set('team', {
                front: oldTeam.fl || null,
                back1: oldTeam.fr || null,
                back2: oldTeam.bl || null,
                back3: oldTeam.br || null
            });
        }
        // 根据存档中的关卡数计算章节（每20关一章），保留实际关编号
        var loadedStage = GameState.get('stage') || 1;
        // ★ v6.0 保留存档中的章节号，不从 wave 重算（避免 wave+stage 不同步）
        GameState.set('stage', loadedStage);
        // 重新计算所有英雄的经验上限（适配新公式）
        var heroesArr = GameState.get('heroes') || [];
        for (var mi = 0; mi < heroesArr.length; mi++) {
            heroesArr[mi].expToNext = getExpToNext(heroesArr[mi].level);
        }
        // 关键修复：JSON.parse 后 team 与 heroes 对象分离，需重建引用关系
        // 否则战斗中升级修改 heroes[i].level 时，team.front.level 不会同步（因为不是同一个对象）
        var curTeam = GameState.get('team');
        if (curTeam) {
            var _positions = ['front', 'back1', 'back2', 'back3'];
            for (var _pi = 0; _pi < _positions.length; _pi++) {
                var _slot = curTeam[_positions[_pi]];
                if (_slot && _slot.id) {
                    var _ref = null;
                    var _heroList = (GameState.get('heroes') || []);
                    for (var _fi = 0; _fi < _heroList.length; _fi++) {
                        if (_heroList[_fi].id === _slot.id) { _ref = _heroList[_fi]; break; }
                    }
                    if (_ref) curTeam[_positions[_pi]] = _ref;
                }
            }
        }
        // ★ v2.6.2: 宝石存档迁移（旧的 'normal' 字符串宝石补 gemTypeId）
        _migrateGemSaveData();
        // ★ v2.6.4 Round 4.4: 仓库容量存档迁移 (旧 warehousePages × 30 模型 → 新 100 + levels × 50)
        if (gameState.warehousePages && !gameState.warehouseExpandLevels) {
            // 旧 pages > 1 → 扩容超过 1 页 = 假设 (pages - 1) 次扩容
            gameState.warehouseExpandLevels = Math.max(0, (gameState.warehousePages || 1) - 1);
            delete gameState.warehousePages;
        }
        // 兼容成就系统新字段
        if (!gameState.achievements) gameState.achievements = {};
        if (typeof gameState.totalKills !== 'number') gameState.totalKills = gameState.monstersKilled || 0;
        if (typeof gameState.totalGoldEarned !== 'number') gameState.totalGoldEarned = gameState.gold || 0;
        if (typeof gameState.totalEquipObtained !== 'number') gameState.totalEquipObtained = 0;
        if (typeof gameState.totalFuse !== 'number') gameState.totalFuse = 0;
        if (typeof gameState.maxTowerFloor !== 'number') gameState.maxTowerFloor = (gameState.tower && gameState.tower.bestFloor) || 0;
        if (typeof gameState.highestEnhanceLevel !== 'number') gameState.highestEnhanceLevel = 0;
        // 兼容转生系统字段（旧存档没有这些字段）
        if (typeof gameState.rebirthPoints !== 'number') gameState.rebirthPoints = 0;
        if (!gameState.rebirthBonuses || typeof gameState.rebirthBonuses !== 'object') gameState.rebirthBonuses = {};
        if (typeof gameState.rebirthCount !== 'number') gameState.rebirthCount = 0;
        if (typeof gameState.hasRebirthed !== 'boolean') gameState.hasRebirthed = false;
        // ★ v5.0: 槽位强化迁移 (旧 equipLevels → 新 slotLevels)
        //   老存档: gameState.equipLevels = { 'eq_xxx': 5 }
        //   新架构: gameState.slotLevels = { 'hero_knight': { weapon: 5, armor: 3 } }
        //   迁移策略: 旧存档也有 equipLevels 可能已清空, 安全地兼容
        if (!gameState.slotLevels || typeof gameState.slotLevels !== 'object') {
            gameState.slotLevels = {};
        }
        // ★ v5.1: 升级石兼容
        if (typeof gameState.upgradeStone !== 'number') gameState.upgradeStone = 0;
        // ★ v3.5.0: 家园系统兼容
        if (!gameState.campResources || typeof gameState.campResources !== 'object') {
            gameState.campResources = { herbs: 0, ore: 0, lastCollectTime: 0 };
        }
        if (!gameState.materials || typeof gameState.materials !== 'object') {
            gameState.materials = { herb: 0, ore: 0, forgeDust: 0, reforgestone: 0, lotteryStone: 0, upgradeStone: 0, gem: 0 };
        }
        if (!gameState.monsterBonds || typeof gameState.monsterBonds !== 'object') {
            gameState.monsterBonds = {};
        }
        if (typeof gameState.dailyKills !== 'number') gameState.dailyKills = 0;
        if (typeof gameState.dailyStages !== 'number') gameState.dailyStages = 0;
        if (typeof gameState.dailyDungeons !== 'number') gameState.dailyDungeons = 0;
        if (typeof gameState.dailyDecompose !== 'number') gameState.dailyDecompose = 0;
        if (typeof gameState.dailyGoldEarned !== 'number') gameState.dailyGoldEarned = 0;
        // 每日任务重置检查
        if (typeof checkDailyReset === 'function') checkDailyReset(gameState);
        // ★ v5.0: 宠物系统字段迁移
        if (!gameState.pets || !Array.isArray(gameState.pets)) gameState.pets = [];
        // v4.1 迁移：旧存档 activePetId → activePets 数组
        if (gameState.activePetId !== undefined && !gameState.activePets) {
            gameState.activePets = gameState.activePetId ? [gameState.activePetId] : [];
            delete gameState.activePetId;
        }
        if (!gameState.activePets || !Array.isArray(gameState.activePets)) gameState.activePets = [];
        if (typeof gameState.petSlotsFromTalent !== 'number') gameState.petSlotsFromTalent = 0;
        // v5.0 新字段
        if (typeof gameState.petFood !== 'number') gameState.petFood = 0;
        // 旧存档 petEggs → 转为 petEggStones (1蛋=1蛋石)
        if (typeof gameState.petEggs === 'number' && gameState.petEggs > 0) {
            gameState.petEggStones = (gameState.petEggStones || 0) + gameState.petEggs;
            delete gameState.petEggs;
        }
        if (typeof gameState.petEggStones !== 'number') gameState.petEggStones = 0;
        // 旧存档 petEggHatchTime/_pendingHatchTier → 转为 incubator slot 0
        if (!gameState.petIncubators || !Array.isArray(gameState.petIncubators)) {
            gameState.petIncubators = [];
            for (var _isi = 0; _isi < 3; _isi++) {
                gameState.petIncubators.push({ tier: null, hatchTime: 0 });
            }
        }
        // 如果旧的孵化中，迁移到第一个槽位
        if (gameState.petEggHatchTime && gameState._pendingHatchTier) {
            var oldTierName = gameState._pendingHatchTier;
            var eggTierMap = { normal: 'basic', rare: 'basic', epic: 'intermediate', legend: 'advanced', mythic: 'advanced' };
            var mappedTier = eggTierMap[oldTierName] || 'basic';
            gameState.petIncubators[0] = { tier: mappedTier, hatchTime: gameState.petEggHatchTime };
            delete gameState.petEggHatchTime;
            delete gameState._pendingHatchTier;
        } else if (gameState.petEggHatchTime) {
            delete gameState.petEggHatchTime;
        }
        if (gameState._pendingHatchTier) {
            delete gameState._pendingHatchTier;
        }
        if (!gameState.petShards || typeof gameState.petShards !== 'object') gameState.petShards = {};
        if (!gameState.petStars || typeof gameState.petStars !== 'object') gameState.petStars = {};
        // 保留旧 equipLevels 引用用于兼容 (但新代码只走 slotLevels)
        // 旧存档可能还有 equipLevels 遗留数据，保留不动，新代码不再使用
        showToast('加载存档成功', 'info');
    } else {
        gameState = initGameState();
        // 初始英雄直接上阵
        var team = GameState.get('team') || {};
        var initHeroes = GameState.get('heroes') || [];
        team.front = initHeroes[0];
        team.back1 = initHeroes[1];
        GameState.set('team', team);
        showToast('新游戏开始!', 'success');
    }

    // 初始化UI
    initUI();
    updateResources();
    refreshTeamUI();

    // 检查所有成就（处理旧存档中已满足的条件）
    if (typeof checkAllAchievementsOnLoad === 'function') {
        checkAllAchievementsOnLoad();
    }

    // ★ v2.6.4 Round 11.4: 状态栏修复 (根治)
    //   - 旧版 setOverlaysWebView({overlay:false}) 在 Capacitor 7 Android 上行为变了:
    //     状态栏不再占位, 改为透明叠加在 WebView 上面, WebView 顶部 0,0 = 屏幕 0,0
    //   - 单纯改 capacitor.config.json 也没用, 启动时 setOverlaysWebView 又会覆盖
    //   - 修法: 启动时 setOverlaysWebView({overlay:true}) + 读 StatusBar.getInfo() 真实高度
    //     + 注入 body padding-top + 状态栏区域画深色蒙版
    try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
            var SB = window.Capacitor.Plugins.StatusBar;
            // 开 overlay: 让 WebView 内容延伸到状态栏下方, 用 CSS padding-top 避开
            if (SB.setOverlaysWebView) SB.setOverlaysWebView({ overlay: true });
            // 暗图标 (适合深色背景的游戏主题)
            SB.setStyle({ style: 'DARK' });
            // 半透明黑背景色 (状态栏区域有深色蒙版, 避免游戏彩色背景让图标看不清)
            if (SB.setBackgroundColor) SB.setBackgroundColor({ color: '#33000000' });
            // 读真实状态栏高度, 写入 CSS 变量 (终版方案)
            if (SB.getInfo) {
                SB.getInfo().then(function (info) {
                    var h = (info && info.height) ? Math.max(info.height, 30) : 30;
                    if (h > 0) {
                        // ★ v7.x: 把真实高度写入 CSS 变量，.screen { top: var(--safe-top) } 自动生效
                        document.documentElement.style.setProperty('--safe-top', h + 'px');
                        // 状态栏深色蒙版防止透明叠加露底
                        // 在状态栏区域画一个深色蒙版 div (防止透明叠加露底)
                        if (!document.getElementById('statusbar-mask')) {
                            var mask = document.createElement('div');
                            mask.id = 'statusbar-mask';
                            mask.style.cssText = 'position:fixed;top:0;left:0;right:0;height:' + h + 'px;background:rgba(0,0,0,0.2);z-index:9999;pointer-events:none;';
                            document.body.appendChild(mask);
                        }
                    }
                });
            }
        }
    } catch (e) { /* 非 Capacitor 环境 (浏览器调试) 无视 */ }

    // 初始化战斗
    BattleManager.init('battle-canvas');
    BattleManager.stage = GameState.get('stage') || 1;

    // 更新初始关卡显示
    var curStage = GameState.get('stage');
    var stageName = getStageName(curStage);
    var recPower = getRecommendedPower(curStage);
    document.getElementById('stage-info').textContent = '第 ' + curStage + ' 章 - ' + stageName + ' [推荐战力:' + (typeof formatNumber === 'function' ? formatNumber(recPower) : recPower) + ']';
    // 更新主界面战力
    updateMainTeamPower();

    // 设置队伍到战斗
    var teamHeroes = getTeamHeroes();
    BattleManager.setTeam(teamHeroes);

    // ★ HOME_5 修复：游戏启动时恢复关卡数据，但不启动战斗
    //   玩家先看到家园界面，战斗处于 paused 状态，必须主动点进入战斗或继续战斗才会启动
    //   restartAtStage 内部会调用 startBattle() 启动 gameLoop，这里要主动 stopBattle + _mainBattlePaused
    BattleManager.restartAtStage(BattleManager.stage, GameState.get('wave') || 1);
    BattleManager.stopBattle();
    BattleManager._mainBattlePaused = true;
    var _initResumeBtn = document.getElementById('btn-resume-main-battle');
    if (_initResumeBtn) _initResumeBtn.style.display = 'inline-block';
    var _initWaveStatus = document.getElementById('wave-status');
    if (_initWaveStatus) _initWaveStatus.textContent = '⏸ 战斗暂停中 — 进入家园休息，或点继续战斗开始';

    // 启动自动存档
    startAutoSave(gameState, 15000);

    // 同步 GameState 引用，让封装层感知最新 gameState
    if (typeof GameState !== 'undefined') {
        GameState.sync();
    }

    // 定期更新UI
    // ★ v2.6.3 BUG#B 修复: 暂停时直接跳过整个 interval 回调，避免无意义计算
    //   之前只在尾部 guard setTeam，但 updateResources/updateMainTeamPower/regenStamina
    //   仍然每1秒跑一次，徒耗CPU且在极端情况下可能干扰战斗逻辑
    setInterval(function() {
        // ★ 暂停时不执行任何 UI 更新逻辑
        if (BattleManager._mainBattlePaused) return;
        updateResources();
        updateMainTeamPower();
        // 体力恢复
        regenStamina();
        // 更新副本体力倒计时（如果在副本界面）
        updateDungeonStaminaUI();
        // ★ v2.6.3 BUG#A 修复: 副本进行中严禁 setTeam — 它会清空 allies / summons / 满血复活英雄,
        //   直接打乱副本战斗状态 (玩家感觉 "卡死")。同样主战场暂停时也不该自动重置 allies
        if (BattleManager.isDungeon || !BattleManager.isRunning) return;
        // 同步队伍到战斗（仅阵容变化时触发，不因阵亡复活角色）
        var heroes = getTeamHeroes();
        var needsSync = false;
        if (BattleManager.allies.length !== heroes.length) {
            needsSync = true;
        } else {
            for (var si = 0; si < heroes.length; si++) {
                var ally = BattleManager.allies[si];
                if (!ally || ally.id !== heroes[si].id) {
                    needsSync = true;
                    break;
                }
            }
        }
        if (needsSync) {
            BattleManager.setTeam(heroes);
        }
    }, 1000);

    // 每5秒检查转生解锁
    setInterval(function() {
        if (typeof checkRebirthUnlock === 'function') checkRebirthUnlock();
    }, 5000);

    // 离线收益计算
    calcOfflineReward();
    // 体力恢复计算
    regenStamina();
}

// 页面从后台恢复时重置体力计时器，防止快速领奖
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && gameState) {
        // 页面重新可见时，重置体力计时锚点避免被退后一一定时间
        if (GameState.get('lastStaminaTime')) {
            GameState.set('lastStaminaTime', Date.now());
        }
        // 恢复后立即重算离线收益
        if (GameState.get('lastSaveTime')) {
            var elapsed = Date.now() - GameState.get('lastSaveTime');
            if (elapsed > 60000) calcOfflineReward();
        }
    }
});

function getTeamHeroes() {
    var team = GameState.get('team') || {};
    var positions = ['front', 'back1', 'back2', 'back3'];
    var heroes = [];
    for (var i = 0; i < positions.length; i++) {
        if (team[positions[i]]) {
            heroes.push(team[positions[i]]);
        }
    }
    return heroes;
}

// 计算升级所需经验
// Fallback for Formulas.getExpToNext (Formulas 不可用时回退入口)
function getExpToNext(level) {
    if (level >= 999) return Infinity;
    return Math.floor(200 * Math.pow(1.5, level - 1));
}

// ★ v2.6.4 Round 12: 离线收益重写
// 1. 不再自动发放, 而是显示精美弹窗让玩家"确定"才领
// 2. 收益 = 金币/经验/粉尘/重铸石/宝石, 由 calcOfflineRewardDetail 算
// 3. 弹窗样式: 进度条 (实际离线时长 / 最大时长) + 收益列表 + 确定按钮
function calcOfflineReward() {
    if (typeof calcOfflineRewardDetail !== 'function') return;
    var detail = calcOfflineRewardDetail();
    if (!detail) {
        // ★ 诊断: 没算出 detail 通常是 < 1 分钟, 玩家可能误以为没弹是 bug
        /* 离线时间 < 1 分钟，跳过 */
        return;
    }
    // 至少离线 1 分钟且有金币/经验才弹
    if (detail.gold <= 0 && detail.exp <= 0) {
        console.log('[离线奖励] 跳过: 离线 ' + detail.elapsedMinutes + ' 分钟, 但 0 金币 0 经验');
        return;
    }
    /* [离线奖励] 弹窗: 离线 ' + detail.elapsedMinutes + ' 分钟 */
    showOfflineRewardModal(detail);
}

// 离线奖励弹窗 (精美卡片 + 进度条 + 收益明细 + 确定按钮)
// 设计: 半透明深色背景 + 金色边框 + 渐变 + 进度条 + 资源图标列表
function showOfflineRewardModal(detail) {
    // 缓存 detail 供领取时使用（防 auto-save 刷掉 lastSaveTime）
    window._lastOfflineDetail = detail;
    // 防重复弹
    if (document.getElementById('offline-reward-modal')) return;
    var hours = Math.floor(detail.actualMinutes / 60);
    var mins = detail.actualMinutes % 60;
    var timeText = hours > 0 ? (hours + ' 小时 ' + mins + ' 分钟') : (mins + ' 分钟');
    // 进度条百分比 (基于实际时长 / 最大时长)
    var maxMin = detail.maxHours * 60;
    var progressPct = Math.min(100, Math.round((detail.elapsedMinutes / maxMin) * 100));
    // 是否触顶 (实际 ≥ 最大)
    var cappedBadge = detail.capped ? '<div style="display:inline-block;background:rgba(255,111,0,0.18);color:#ffab40;padding:3px 10px;border-radius:10px;font-size:11px;margin-left:8px;border:1px solid rgba(255,111,0,0.4);">⏰ 已达上限</div>' : '';
    // 资源列表
    var rewardRows = [];
    // 数值格式化守卫 (formatNumber 是 settingsUI 内嵌函数, 不一定 global 可用)
    var _fmt = (typeof formatNumber === 'function') ? formatNumber : function(n) { return String(Math.floor(n || 0)); };
    if (detail.gold > 0) {
        rewardRows.push('<div class="offline-reward-row"><span class="offline-reward-icon">💰</span><span class="offline-reward-name">金币</span><span class="offline-reward-val">+' + _fmt(detail.gold) + '</span></div>');
    }
    if (detail.exp > 0) {
        rewardRows.push('<div class="offline-reward-row"><span class="offline-reward-icon">✨</span><span class="offline-reward-name">经验</span><span class="offline-reward-val">+' + _fmt(detail.exp) + '</span></div>');
    }
    if (detail.forgeDust > 0) {
        rewardRows.push('<div class="offline-reward-row"><span class="offline-reward-icon">🌟</span><span class="offline-reward-name">粉尘</span><span class="offline-reward-val">+' + _fmt(detail.forgeDust) + '</span></div>');
    }
    if (detail.reforgeStones > 0) {
        rewardRows.push('<div class="offline-reward-row"><span class="offline-reward-icon">🔨</span><span class="offline-reward-name">重铸石</span><span class="offline-reward-val">+' + detail.reforgeStones + ' (惊喜!)</span></div>');
    }
    if (detail.gems > 0) {
        rewardRows.push('<div class="offline-reward-row"><span class="offline-reward-icon">💎</span><span class="offline-reward-name">宝石</span><span class="offline-reward-val">+' + detail.gems + ' (惊喜!)</span></div>');
    }
    var html = ''
        + '<div class="offline-reward-card">'
        +   '<div class="offline-reward-header">'
        +     '<div class="offline-reward-title">🎁 欢迎回来!</div>'
        +     '<div class="offline-reward-subtitle">你的英雄在你离开时奋勇作战...</div>'
        +   '</div>'
        +   '<div class="offline-reward-stats">'
        +     '<div class="offline-reward-stat">'
        +       '<div class="offline-reward-stat-label">离线时长</div>'
        +       '<div class="offline-reward-stat-val">' + timeText + cappedBadge + '</div>'
        +     '</div>'
        +     '<div class="offline-reward-stat">'
        +       '<div class="offline-reward-stat-label">最大时长</div>'
        +       '<div class="offline-reward-stat-val">' + detail.maxHours + ' 小时</div>'
        +     '</div>'
        +     '<div class="offline-reward-stat">'
        +       '<div class="offline-reward-stat-label">效率加成</div>'
        +       '<div class="offline-reward-stat-val">' + detail.efficiencyPct + '%</div>'
        +     '</div>'
        +   '</div>'
        +   '<div class="offline-reward-progress-wrap">'
        +     '<div class="offline-reward-progress-label">'
        +       '<span>离线进度</span>'
        +       '<span>' + progressPct + '%</span>'
        +     '</div>'
        +     '<div class="offline-reward-progress-bar">'
        +       '<div class="offline-reward-progress-fill" style="width:' + progressPct + '%;"></div>'
        +     '</div>'
        +   '</div>'
        +   '<div class="offline-reward-list">' + rewardRows.join('') + '</div>'
        +   '<button class="offline-reward-confirm" onclick="claimOfflineReward()">领取奖励并继续 ▶</button>'
        +   '<div class="offline-reward-hint">⏰ 提高上限: 在 [天赋] → [⏰ 离线时长] 升级</div>'
        + '<span class="offline-reward-close" style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span>'
        + '</div>';
    var div = document.createElement('div');
    div.id = 'offline-reward-modal';
    div.className = 'modal-overlay offline-reward-overlay';
    div.innerHTML = html;
    document.body.appendChild(div);
}

// 玩家点确定 → 实际发放 + 关闭弹窗 + 进入游戏
function claimOfflineReward() {
    // ★ 使用弹窗时缓存的 detail，不重新计算（防 auto-save 刷掉 lastSaveTime）
    if (!window._lastOfflineDetail) return;
    var detail = window._lastOfflineDetail;
    window._lastOfflineDetail = null;
    // 发放金币
    if (detail.gold > 0) {
        GameState.mutate('gold', function(g) { return (g || 0) + detail.gold; });
    }
    // 发放经验 (给上阵英雄)
    if (detail.exp > 0) {
        var teamHeroes = (typeof getTeamHeroes === 'function') ? getTeamHeroes() : [];
        if (teamHeroes.length > 0) {
            var expPerHero = Math.floor(detail.exp / teamHeroes.length);
            for (var i = 0; i < teamHeroes.length; i++) {
                teamHeroes[i].exp = (teamHeroes[i].exp || 0) + expPerHero;
                if (typeof checkLevelUp === 'function') checkLevelUp(teamHeroes[i]);
            }
        }
    }
    // 发放粉尘
    if (detail.forgeDust > 0) {
        GameState.mutate('forgeDust', function(f) { return (f || 0) + detail.forgeDust; });
    }
    // 发放重铸石
    if (detail.reforgeStones > 0) {
        GameState.mutate('reforgestone', function(r) { return (r || 0) + detail.reforgeStones; });
    }
    // 发放宝石 (1-3 级随机)
    if (detail.gems > 0) {
        var curGems = GameState.get('gems') || [];
        for (var g = 0; g < detail.gems; g++) {
            var gemLevel = 1 + Math.floor(Math.random() * 3);  // 1-3 级
            var gemTypes = ['ruby', 'sapphire', 'emerald', 'topaz'];
            var gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
            curGems.push({ type: gemType, level: gemLevel });
        }
        GameState.set('gems', curGems);
    }
    // 关闭弹窗
    var modal = document.getElementById('offline-reward-modal');
    if (modal) modal.remove();
    // 更新 lastSaveTime 避免重复计算
    GameState.set('lastSaveTime', Date.now());
    // 刷新 UI (主战场 + 天赋页; 家园由 syncHomeResources 单独刷, 切到家园时 mainUI.js:43 会调)
    if (typeof updateResources === 'function') updateResources();
    // 保险: 玩家领完可能直接切家园, 提前刷一次 (DOM 不存在时是 noop, 不报错)
    if (typeof syncHomeResources === 'function') syncHomeResources();
    // 提示
    if (typeof showToast === 'function') {
        var _fmt2 = (typeof formatNumber === 'function') ? formatNumber : function(n) { return String(Math.floor(n || 0)); };
        showToast('领取离线奖励! 金币+' + _fmt2(detail.gold) + ' 经验+' + _fmt2(detail.exp), 'success');
    }
}

// 体力恢复计算
function regenStamina() {
    if (!gameState) return;
    if (GameState.get('stamina') >= 240) {
        GameState.set('stamina', 240);
        GameState.set('lastStaminaTime', Date.now());
        return;
    }
    var elapsed = Date.now() - (GameState.get('lastStaminaTime') || Date.now());
    var regenPoints = Math.floor(elapsed / 120000);
    if (regenPoints > 0) {
        GameState.set('lastStaminaTime', Date.now());
        GameState.set('stamina', Math.min(240, (GameState.get('stamina') || 0) + regenPoints));
    }
}

// 消耗体力
function spendStamina(amount) {
    if (!gameState) return false;
    regenStamina();
    if (GameState.get('stamina') < amount) return false;
    GameState.mutate('stamina', function(s) { return s - amount; });
    return true;
}

// 获取体力百分比
function getStaminaPct() {
    if (!gameState) return 0;
    regenStamina();
    return GameState.get('stamina') / 240;
}

// 重置游戏
function resetGame() {
    showConfirm('重置游戏', '确定要重置游戏吗？<br><span style="color:#f44336;">所有进度将丢失！此操作不可恢复！</span>', function() {
    localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem('cqc_idle_rpg_save_slot1');
        gameState = initGameState();
        var team = GameState.get('team') || {};
        var resetHeroes = GameState.get('heroes') || [];
        team.front = resetHeroes[0];
        team.back1 = resetHeroes[1];
        GameState.set('team', team);
        BattleManager.setTeam(getTeamHeroes());
        updateResources();
        refreshTeamUI();
        showToast('游戏已重置', 'info');
        setTimeout(function() { location.reload(); }, 500);
    });
}

// v6.x Escape Hatch：重置所有英雄的装备等级 + 宝石等级为 1
//   用途：玩家因为装备/宝石等级过高导致战力崩盘时，可以单独重置这部分
//        保留其他进度（英雄等级/天赋/金币/宝石数量等）
function resetEquipmentLevels() {
    showConfirm(
        '重置装备与宝石等级',
        '把所有英雄的<b>装备等级</b>和<b>宝石等级</b>全部重置为 1。<br>' +
        '<span style="color:#ff9800;">其他进度（英雄等级/天赋/金币等）保留</span><br>' +
        '<span style="color:#f44336;font-size:12px;">此操作不可撤销，请先导出存档！</span>',
        function() {
            if (!gameState || !GameState.get('heroes')) {
                showToast('没有可重置的英雄', 'error');
                return;
            }
            var eqCount = 0, gemCount = 0;
            var resetHeroesArr = GameState.get('heroes') || [];
            for (var i = 0; i < resetHeroesArr.length; i++) {
                var hero = resetHeroesArr[i];
                if (!hero || !hero.equip) continue;
                for (var slot in hero.equip) {
                    var eq = hero.equip[slot];
                    if (!eq) continue;
                    if (eq.level && eq.level > 1) {
                        eq.level = 1;
                        eqCount++;
                    }
                    if (eq.gems && eq.gems.length > 0) {
                        for (var g = 0; g < eq.gems.length; g++) {
                            if (eq.gems[g] && eq.gems[g].level && eq.gems[g].level > 1) {
                                eq.gems[g].level = 1;
                                gemCount++;
                            }
                        }
                    }
                }
            }
            // 触发存档 + UI 刷新
            if (typeof saveGame === 'function') saveGame(gameState);
            if (typeof refreshTeamUI === 'function') refreshTeamUI();
            if (typeof refreshHeroUI === 'function') refreshHeroUI();
            if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
        });
    }

// 页面加载时启动
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});
    // 启动自动更新检测
    if (typeof startAutoUpdateCheck === "function") setTimeout(function() { startAutoUpdateCheck(); }, 5000);

