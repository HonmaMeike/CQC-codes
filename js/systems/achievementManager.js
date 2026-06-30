// ========== 成就管理器 ==========
// 负责检查、解锁、发放奖励
/* global GameState */

function getAchievementProgress(id) {
    var ach = null;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        if (ACHIEVEMENTS[i].id === id) { ach = ACHIEVEMENTS[i]; break; }
    }
    if (!ach) return { current: 0, target: 0, completed: false };

    var cond = ach.condition;
    var current = 0;

    switch (cond.type) {
        case 'stage':         current = GameState.get('maxStage') || 0; break;
        case 'totalEquip':    current = GameState.get('totalEquipObtained') || 0; break;
        case 'qualityOwn':    current = hasQualityEquip(cond.target) ? 1 : 0; break;
        case 'totalKills':    current = GameState.get('totalKills') || 0; break;
        case 'enhanceLevel':  current = GameState.get('highestEnhanceLevel') || 0; break;
        case 'totalFuse':     current = GameState.get('totalFuse') || 0; break;
        case 'towerFloor':    current = GameState.get('maxTowerFloor') || 0; break;
        case 'totalGold':     current = GameState.get('totalGoldEarned') || 0; break;
        case 'rebirth':       current = GameState.get('rebirthCount') || 0; break;
        case 'petCount':      current = (GameState.get('pets') || []).length; break;
        case 'petStar':       current = getMaxPetStar(); break;
        case 'gemLevel':      current = GameState.get('maxGemLevel') || 0; break;
        case 'skillTotal':    current = getTotalSkillLevel(); break;
        case 'setCount':      current = getUniqueSetCount(); break;
        case 'dkDamage':      current = GameState.get('demonKingRecord') || 0; break;
        case 'dkKills':       current = GameState.get('demonKingKills') || 0; break;
        case 'dkBest':        current = GameState.get('demonKingRecord') || 0; break;
        case 'dailyDungeon':  current = GameState.get('dailyDungeonTotal') || 0; break;
        case 'totalDmg':      current = GameState.get('totalDamageDealt') || 0; break;
        case 'sellItem':      current = GameState.get('totalItemsSold') || 0; break;
        case 'totalEvolve':   current = GameState.get('totalPetsEvolved') || 0; break;
    }

    var achievements = GameState.get('achievements') || {};
    var completed = !!(achievements[id]);
    var target = (cond.type === 'qualityOwn' || cond.type === 'setCount') ? 1 : cond.target;
    return { current: current, target: target, completed: completed };
}

function getMaxPetStar() {
    var stars = GameState.get('petStars') || {};
    var maxStar = 0;
    for (var sk in stars) { if (stars[sk] > maxStar) maxStar = stars[sk]; }
    return maxStar;
}

function getTotalSkillLevel() {
    var heroes = GameState.get('heroes') || [];
    var total = 0;
    for (var hi = 0; hi < heroes.length; hi++) {
        var h = heroes[hi];
        if (h.skillLevels) {
            for (var slk in h.skillLevels) { total += h.skillLevels[slk]; }
        }
    }
    return total;
}

function getUniqueSetCount() {
    var inv = GameState.get('inventory') || [];
    var setIds = {};
    for (var i = 0; i < inv.length; i++) {
        var eq = inv[i];
        if (eq && eq.setId && eq.setId !== 'none') setIds[eq.setId] = true;
    }
    var heroes = GameState.get('heroes') || [];
    for (var hi = 0; hi < heroes.length; hi++) {
        var eqs = heroes[hi].equip || {};
        for (var slot in eqs) {
            if (eqs[slot] && eqs[slot].setId && eqs[slot].setId !== 'none') setIds[eqs[slot].setId] = true;
        }
    }
    return Object.keys(setIds).length;
}

// 检查某个品质的装备是否曾经获得过
function hasQualityEquip(quality) {
    var inv = GameState.get('inventory') || [];
    for (var i = 0; i < inv.length; i++) {
        if (inv[i] && inv[i].quality === quality) return true;
    }
    var heroes = GameState.get('heroes') || [];
    for (var i = 0; i < heroes.length; i++) {
        var eq = heroes[i].equip || {};
        for (var slot in eq) {
            if (eq[slot] && eq[slot].quality === quality) return true;
        }
    }
    return false;
}

// 检查特定类型的所有未完成成就
function checkAchievements(type, value) {
    if (!GameState.get('achievements')) {
        GameState.set('achievements', {});
    }
    var achievements = GameState.get('achievements') || {};

    var list = ACHIEVEMENT_INDEX[type] || [];
    for (var i = 0; i < list.length; i++) {
        var ach = list[i];
        if (achievements[ach.id]) continue;

        var conditionMet = false;
        switch (type) {
            case 'stage': case 'totalEquip': case 'totalKills': case 'enhanceLevel':
            case 'totalFuse': case 'towerFloor': case 'totalGold': case 'rebirth':
            case 'dkDamage': case 'dkKills': case 'dkBest': case 'dailyDungeon':
            case 'totalDmg': case 'sellItem': case 'totalEvolve': case 'skillTotal':
            case 'petCount': case 'gemLevel': case 'petStar':
                conditionMet = value >= ach.condition.target;
                break;
            case 'qualityOwn':
                conditionMet = hasQualityEquip(ach.condition.target);
                break;
            case 'setCount':
                conditionMet = getUniqueSetCount() >= ach.condition.target;
                break;
        }

        if (conditionMet) {
            unlockAchievement(ach.id);
        }
    }
}

// 获取成就统计
function getAchievementStats() {
    var total = ACHIEVEMENTS.length;
    var achievements = GameState.get('achievements') || {};
    var unlocked = 0;
    for (var asi = 0; asi < ACHIEVEMENTS.length; asi++) {
        if (achievements[ACHIEVEMENTS[asi].id]) unlocked++;
    }
    return { total: total, unlocked: unlocked };
}

// 解锁成就并发放奖励
function unlockAchievement(id) {
    var achievements = GameState.get('achievements') || {};
    if (achievements[id]) return false;

    var ach = null;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        if (ACHIEVEMENTS[i].id === id) { ach = ACHIEVEMENTS[i]; break; }
    }
    if (!ach) return false;

    achievements[id] = true;
    GameState.set('achievements', achievements);

    // 发放奖励
    var reward = ach.reward || {};
    if (reward.gold) {
        var goldAmt = Math.min(500000, reward.gold);
        GameState.mutate('gold', function(v) { return (v || 0) + goldAmt; });
    }
    // 成就奖励的 gem 字段（魔核）已改为仅充值获取
    if (reward.lotteryStone) {
        var lsAmt = Math.min(100, reward.lotteryStone);
        GameState.mutate('lotteryStone', function(v) { return (v || 0) + lsAmt; });
    }
    if (reward.petEggStones) {
        var peAmt = Math.min(100, reward.petEggStones);
        GameState.mutate('petEggStones', function(v) { return (v || 0) + peAmt; });
    }
    if (reward.upgradeStone) {
        var usAmt = Math.min(100, reward.upgradeStone);
        GameState.mutate('upgradeStone', function(v) { return (v || 0) + usAmt; });
    }

    // 显示解锁通知
    var rewardText = [];
    if (reward.gold) rewardText.push('金币x' + Math.min(500000, reward.gold));
    if (reward.gem) rewardText.push('魔核x' + Math.min(300, reward.gem));
    if (reward.lotteryStone) rewardText.push('抽奖石x' + Math.min(100, reward.lotteryStone));
    if (reward.petEggStones) rewardText.push('蛋石x' + Math.min(100, reward.petEggStones));
    if (reward.upgradeStone) rewardText.push('升级石x' + Math.min(100, reward.upgradeStone));

    var nameDisplay = ach.hidden ? '🔓 ' + ach.name.replace(/\?\?/g, '').trim() : ach.icon + ' ' + ach.name;
    if (typeof showToast === 'function') {
        showToast('🏆 成就达成: ' + nameDisplay + '! 奖励: ' + (rewardText.join(', ') || '无'), 'success');
    }

    // 刷新UI
    if (typeof refreshAchievementUI === 'function') refreshAchievementUI();
    if (typeof saveGame === 'function') saveGame(GameState.getAll());
}
