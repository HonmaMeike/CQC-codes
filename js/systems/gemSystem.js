// ========== 宝石合成系统 ==========

// 合成宝石（3合1）
function synthesizeGems(gemTypeId, level, count) {
    if (count < 3) return null;
    if (level >= 16) return null; // 最高16级

    var newLevel = level + 1;
    var newCount = Math.floor(count / 3);
    return { gemTypeId: gemTypeId, level: newLevel, count: newCount };
}

// 计算宝石共鸣等级
function calcGemResonance(equippedGems) {
    var totalLevel = 0;
    for (var i = 0; i < equippedGems.length; i++) {
        var gem = equippedGems[i];
        if (gem && gem.level) {
            totalLevel += gem.level;
        }
    }

    var activeResonance = null;
    for (var r = GEM_RESONANCE_THRESHOLDS.length - 1; r >= 0; r--) {
        var threshold = GEM_RESONANCE_THRESHOLDS[r];
        if (totalLevel >= threshold.totalLevel) {
            activeResonance = threshold;
            break;
        }
    }

    return { totalLevel: totalLevel, resonance: activeResonance };
}

// 镶嵌宝石到装备
function inlayGem(equip, gemSlotIndex, gemData) {
    if (!equip || !gemData) return false;
    if (gemSlotIndex >= equip.sockets) return false;
    if (!equip.gems) equip.gems = [];
    equip.gems[gemSlotIndex] = gemData;
    return true;
}

// 移除宝石
function removeGem(equip, gemSlotIndex) {
    if (!equip || !equip.gems) return null;
    var gem = equip.gems[gemSlotIndex];
    if (!gem) return null;
    equip.gems[gemSlotIndex] = null;
    return gem;
}
