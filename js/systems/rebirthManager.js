// ========== 转生系统 (Rebirth/Prestige System) ==========
// 当玩家通关第100章后解锁转生，重置大部分进度获得轮回点数
// 可在轮回商店兑换永久加成
/* global GameState */

// 轮回商店配置
var REBIRTH_SHOP = [
    { id: 'atkPct',    name: '全属性加成', desc: '所有英雄攻击/防御/生命/速度 +5%', icon: '⚔', costPerLevel: 1, maxLevel: 10, valuePerLevel: 5 },
    { id: 'goldFind',  name: '金币获取',   desc: '金币获取 +10%',                    icon: '💰', costPerLevel: 1, maxLevel: 10, valuePerLevel: 10 },
    { id: 'expGain',   name: '经验加成',   desc: '经验获取 +5%',                     icon: '✨', costPerLevel: 1, maxLevel: 10, valuePerLevel: 5 },
    { id: 'qualityBonus', name: '品质加成', desc: '装备掉落品质 +1%',                 icon: '⭐', costPerLevel: 1, maxLevel: 5,  valuePerLevel: 1 },
    { id: 'extraSlots',   name: '额外上阵', desc: '额外上阵位 +1',                   icon: '👥', costPerLevel: 1, maxLevel: 3,  valuePerLevel: 1 }
];

// 判断是否可以转生（第100章第20关完成）
function canRebirth() {
    if (!GameState.getAll()) return false;
    return GameState.get('stage') >= 100 && GameState.get('waveNumber') >= 20;
}

// 计算本次转生可获得的总轮回点数
function calcRebirthPoints() {
    var points = 0;
    if (!GameState.getAll()) return points;

    // Base: 每10章1点，最多10点（章100封顶）
    var chaptersCleared = Math.min(GameState.get('maxStage') || GameState.get('stage') || 1, 100);
    // 但浪数也考虑：如果是100章但还没打通，按实际浪数折算
    var actualCh = GameState.get('stage') || 1;
    if (actualCh > 100) actualCh = 100;
    var basePoints = Math.floor(actualCh / 10);
    if (basePoints > 10) basePoints = 10;
    points += basePoints;

    // Bonus: 每10强化等级 +1 点（所有装备总强化等级）
    var enhanceTotal = 0;
    var heroes = GameState.get('heroes') || [];
    for (var i = 0; i < heroes.length; i++) {
        var hero = heroes[i];
        if (!hero || !hero.equip) continue;
        for (var slot in hero.equip) {
            var eq = hero.equip[slot];
            if (eq && eq.level) {
                enhanceTotal += eq.level;
            }
        }
    }
    points += Math.floor(enhanceTotal / 10);

    // Bonus: 每50塔层 +1 点
    var towerFloors = GameState.get('maxTowerFloor') || 0;
    var tower = GameState.get('tower');
    if (!towerFloors && tower && tower.bestFloor) towerFloors = tower.bestFloor;
    points += Math.floor(towerFloors / 50);

    // Bonus: 完成所有成就 +5 点（检查成就完成度）
    var allAchievementsDone = false;
    var achievements = GameState.get('achievements') || {};
    if (typeof ACHIEVEMENTS !== 'undefined' && ACHIEVEMENTS) {
        var totalAchievements = ACHIEVEMENTS.length || 0;
        var completedAchievements = 0;
        for (var i = 0; i < totalAchievements; i++) {
            var achId = ACHIEVEMENTS[i].id;
            if (achievements[achId]) {
                completedAchievements++;
            }
        }
        if (totalAchievements > 0 && completedAchievements >= totalAchievements) {
            allAchievementsDone = true;
        }
    }
    if (allAchievementsDone) {
        points += 5;
    }

    return points;
}

// 执行转生
function doRebirth() {
    if (!canRebirth()) {
        showToast('需要在第100章第20关后才能转生', 'warning');
        return false;
    }

    // 计算可获得点数
    var earnedPoints = calcRebirthPoints();

    // 保存转生前数据用于统计
    var oldStage = GameState.get('stage');
    var oldWave = GameState.get('wave') || GameState.get('waveNumber') || 1;

    // === 保留字段 ===
    var preserved = {
        gems: GameState.get('gems') || [],
        magicCore: GameState.get('magicCore') || 0,
        totalKills: GameState.get('totalKills') || 0,
        achievements: GameState.get('achievements') || {},
        equipCodex: GameState.get('equipCodex') || {},
        highestEnhanceLevel: GameState.get('highestEnhanceLevel') || 0,
        rebirthPoints: (GameState.get('rebirthPoints') || 0) + earnedPoints,
        rebirthBonuses: GameState.get('rebirthBonuses') || {},
        rebirthCount: (GameState.get('rebirthCount') || 0) + 1,
        hasRebirthed: true,
        lastSaveTime: Date.now(),
        // 保留音效设置
        soundMuted: GameState.get('soundMuted') || false,
        bgmEnabled: GameState.get('bgmEnabled') !== false,
        bgmVolume: GameState.get('bgmVolume') || 0.5,
        sfxEnabled: GameState.get('sfxEnabled') !== false,
        sfxVolume: GameState.get('sfxVolume') || 0.7
    };

    // 重新初始化游戏状态
    var fresh = initGameState();

    // 覆盖保留字段
    fresh.gems = preserved.gems;
    fresh.magicCore = preserved.magicCore;
    fresh.totalKills = preserved.totalKills;
    fresh.achievements = preserved.achievements;
    fresh.equipCodex = preserved.equipCodex;
    fresh.highestEnhanceLevel = preserved.highestEnhanceLevel;
    fresh.rebirthPoints = preserved.rebirthPoints;
    fresh.rebirthBonuses = preserved.rebirthBonuses;
    fresh.rebirthCount = preserved.rebirthCount;
    fresh.hasRebirthed = preserved.hasRebirthed;
    fresh.lastSaveTime = preserved.lastSaveTime;
    fresh.soundMuted = preserved.soundMuted;
    fresh.bgmEnabled = preserved.bgmEnabled;
    fresh.bgmVolume = preserved.bgmVolume;
    fresh.sfxEnabled = preserved.sfxEnabled;
    fresh.sfxVolume = preserved.sfxVolume;

    // 应用重生加成：额外上阵位
    if (fresh.rebirthBonuses.extraSlots) {
        fresh.unlockedSlots = 2 + fresh.rebirthBonuses.extraSlots;
        if (fresh.unlockedSlots > 4) fresh.unlockedSlots = 4;
    }

    // Assign fresh state to gameState
    gameState = fresh;
    GameState.sync();

    // 阵容：初始英雄自动上阵
    var heroes = GameState.get('heroes') || [];
    GameState.set('team', { front: heroes[0], back1: heroes[1], back2: undefined, back3: undefined });

    // 保存
    if (typeof saveGame === 'function') saveGame(GameState.getAll());

    // 刷新UI
    if (typeof initUI === 'function') initUI();
    if (typeof updateResources === 'function') updateResources();
    if (typeof refreshTeamUI === 'function') refreshTeamUI();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();

    // 重设战斗
    if (typeof BattleManager !== 'undefined' && BattleManager) {
        BattleManager.restartAtStage(1, 1);
        BattleManager.stopBattle();
        BattleManager._mainBattlePaused = true;
        var resumeBtn = document.getElementById('btn-resume-main-battle');
        if (resumeBtn) resumeBtn.style.display = 'inline-block';
        var ws = document.getElementById('wave-status');
        if (ws) ws.textContent = '🔄 已转生！从第1章重新开始' + (earnedPoints > 0 ? '，获得 ' + earnedPoints + ' 轮回点数' : '');
    }

    showToast('🔄 转生成功！获得 ' + earnedPoints + ' 轮回点数，从第1章重新开始！', 'success');

    // 触发成就检查
    if (typeof checkAchievements === 'function') {
        checkAchievements('rebirth', GameState.get('rebirthCount'));
    }

    return true;
}

// 在轮回商店消费点数
function spendRebirthPoint(categoryId) {
    if (!GameState.getAll()) return false;
    if (!GameState.get('rebirthBonuses')) GameState.set('rebirthBonuses', {});

    var item=null;var _es5_35=REBIRTH_SHOP;for(var _es5_36=0;_es5_36<_es5_35.length;_es5_36++){if(_es5_35[_es5_36].id === categoryId){item=_es5_35[_es5_36];break;}};
    if (!item) {
        showToast('未知的轮回商品', 'error');
        return false;
    }

    var rebirthBonuses = GameState.get('rebirthBonuses') || {};
    var currentLevel = rebirthBonuses[categoryId] || 0;
    if (currentLevel >= item.maxLevel) {
        showToast(item.name + ' 已满级！', 'warning');
        return false;
    }

    var cost = item.costPerLevel;
    if ((GameState.get('rebirthPoints') || 0) < cost) {
        showToast('轮回点数不足！需要 ' + cost + ' 点', 'warning');
        return false;
    }

    GameState.mutate('rebirthPoints', function(v) { return (v || 0) - cost; });
    rebirthBonuses[categoryId] = currentLevel + 1;
    GameState.set('rebirthBonuses', rebirthBonuses);

    // 额外上阵位特殊处理：立即生效
    if (categoryId === 'extraSlots') {
        var newSlots = 2 + (rebirthBonuses.extraSlots || 0);
        if (newSlots > 4) newSlots = 4;
        GameState.set('unlockedSlots', newSlots);
    }

    // 保存
    if (typeof saveGame === 'function') saveGame(GameState.getAll());

    showToast('已购买 ' + item.name + ' Lv.' + (currentLevel + 1) + '！', 'success');

    // 刷新UI
    if (typeof updateResources === 'function') updateResources();
    if (typeof refreshRebirthUI === 'function') refreshRebirthUI();

    return true;
}

// 获取轮回加成的聚合效果（用于 stat 计算）
function getRebirthBonuses() {
    var bonuses = GameState.get('rebirthBonuses');
    if (!bonuses) {
        return { atkPct: 0, goldFind: 0, expGain: 0, qualityBonus: 0, extraSlots: 0 };
    }
    var b = bonuses;
    var result = {};
    for (var i = 0; i < REBIRTH_SHOP.length; i++) {
        var item = REBIRTH_SHOP[i];
        var lvl = b[item.id] || 0;
        result[item.id] = lvl * item.valuePerLevel;
    }
    return result;
}

// 获取轮回进度摘要
function getRebirthProgress() {
    var gs = GameState.getAll();
    if (!gs) {
        return { currentCh: 0, totalCh: 100, pointsEarned: 0, totalPoints: 0, canRebirth: false };
    }
    var currentCh = GameState.get('stage') || 1;
    var canReb = canRebirth();
    var ptsEarned = canReb ? calcRebirthPoints() : 0;
    return {
        currentCh: currentCh,
        totalCh: 100,
        pointsEarned: ptsEarned,
        totalPoints: GameState.get('rebirthPoints') || 0,
        canRebirth: canReb,
        rebirthCount: GameState.get('rebirthCount') || 0,
        bonuses: getRebirthBonuses()
    };
}
