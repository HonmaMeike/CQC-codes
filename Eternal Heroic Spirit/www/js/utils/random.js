// ========== 随机/概率工具 ==========

// 范围随机整数 [min, max]
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 范围随机浮点数 [min, max)
function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// 从数组中随机取一个
function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 按权重随机选择
function weightedPick(items, weightKey) {
    if (weightKey === undefined) weightKey = 'weight';
    var total = 0;
    for (var i = 0; i < items.length; i++) total += items[i][weightKey];
    var r = Math.random() * total;
    for (var j = 0; j < items.length; j++) {
        r -= items[j][weightKey];
        if (r <= 0) return items[j];
    }
    return items[items.length - 1];
}

// 概率判定
function chance(prob) {
    return Math.random() < prob;
}

// 正态分布近似 (Box-Muller)
function randNormal(mean, std) {
    if (mean === undefined) mean = 0;
    if (std === undefined) std = 1;
    var u1 = Math.random();
    var u2 = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// 从概率金字塔中选取品质
// 概率: 白40%, 绿30%, 蓝18%, 紫8%, 橙3%, 金1%
function rollQuality() {
    var r = Math.random() * 100;
    if (r < 40) return QUALITY.COMMON;
    if (r < 70) return QUALITY.RARE;
    if (r < 88) return QUALITY.LEGENDARY;
    if (r < 96) return QUALITY.MIRACLE;
    if (r < 99) return QUALITY.MYTHIC;
    return QUALITY.IMMORTAL;
}

// 提升后的掉落概率（随关卡提升, bonus 系数降低防止后期泛滥）
function rollQualityWithBonus(bonus) {
    if (bonus === undefined) bonus = 0;
    // 降低 bonus 效果: 除以3, 上限15
    var b = Math.min(Math.floor(bonus / 3), 15);
    var r = Math.random() * 100;
    if (r < 40 - b) return QUALITY.COMMON;
    if (r < 70 - b * 0.8) return QUALITY.RARE;
    if (r < 88 + b * 0.4) return QUALITY.LEGENDARY;
    if (r < 96 + b * 0.2) return QUALITY.MIRACLE;
    if (r < 99 + b * 0.06) return QUALITY.MYTHIC;
    return QUALITY.IMMORTAL;
}
