// ========== 宝石数据 ==========

// 单属性宝石 1-15级百分比值
var GEM_SINGLE_VALUES = [
    1.5, 3, 6, 12, 18,       // L1-L5
    27, 40.5, 60.7, 91.1, 136.6,  // L6-L10
    205, 307.5, 461.2, 691.9, 1037.9  // L11-L15
];

// 复合属性宝石 1-15级百分比值
var GEM_COMPOUND_VALUES = [
    1, 2, 4.5, 10, 15.5,     // L1-L5
    24, 37, 56.7, 86.6, 131.6,  // L6-L10
    199.5, 301.5, 454.7, 684.9, 1030.4  // L11-L15
];

var GEM_TYPES = [
    // 单属性宝石 (★ v2.6.4 Round 4.3 加 order 字段, 用于宝石工坊"类型"排序)
    { id: 'ruby', order: 0, name: '红宝石', icon: '\u{1F534}', stat: 'atk', statType: 'pct', isCompound: false, color: '#f44336' },
    { id: 'sapphire', order: 1, name: '蓝宝石', icon: '\u{1F535}', stat: 'def', statType: 'pct', isCompound: false, color: '#2196f3' },
    { id: 'topaz', order: 2, name: '黄宝石', icon: '\u{1F7E1}', stat: 'spd', statType: 'pct', isCompound: false, color: '#ffeb3b' },
    { id: 'emerald', order: 3, name: '绿宝石', icon: '\u{1F7E2}', stat: 'hp', statType: 'pct', isCompound: false, color: '#4caf50' },
    { id: 'diamond', order: 4, name: '钻石', icon: '\u{1F48E}', stat: 'critDmg', statType: 'pct', isCompound: false, color: '#e91e63' },
    // 复合属性宝石
    { id: 'obsidian', order: 5, name: '黑曜石', icon: '\u{26AB}', stat: 'atk', statType: 'pct', isCompound: true, extraStat: 'dmgBonus', extraPerLevel: 0.1, extraUnit: '%', color: '#212121' },
    { id: 'moonstone', order: 6, name: '月光石', icon: '\u{1F319}', stat: 'def', statType: 'pct', isCompound: true, extraStat: 'dmgReduction', extraPerLevel: 0.1, extraUnit: '%', color: '#b0bec5' },
    { id: 'amethyst', order: 7, name: '紫水晶', icon: '\u{1F7E3}', stat: 'spd', statType: 'pct', isCompound: true, extraStat: 'crit', extraPerLevel: 0.2, extraUnit: '%', color: '#9c27b0' },
    { id: 'amber', order: 8, name: '琥珀', icon: '\u{1F7E0}', stat: 'hp', statType: 'pct', isCompound: true, extraStat: 'healRate', extraPerLevel: 0.4, extraUnit: '%', color: '#ff9800' },
    { id: 'jade', order: 9, name: '翡翠', icon: '\u{1F7E9}', stat: 'effectHit', statType: 'pct', isCompound: false, color: '#00e676' },
    { id: 'onyx', order: 10, name: '缟玛瑙', icon: '\u{26AA}', stat: 'atk', statType: 'pct', isCompound: true, extraStat: 'lootBonus', extraPerLevel: 0.15, extraUnit: '%', color: '#424242' },
    { id: 'aquamarine', order: 11, name: '海蓝石', icon: '\u{1F7E6}', stat: 'def', statType: 'pct', isCompound: true, extraStat: 'expBonus', extraPerLevel: 0.2, extraUnit: '%', color: '#00bcd4' }
];

// 宝石等级对应的百分比数值
// ★ v3.x 平衡调整：L10+ 宝石加成受收益递减规则影响
//   L1-L10：正常 100%
//   L11-L15：仅 50% 有效（原值 L15=1037.9% → 实际值 ≈518.9%）
//   防止高等级宝石导致数值指数级爆炸
function getGemValue(gemType, level) {
    if (level < 1 || level > 15) return 0;
    var table = gemType.isCompound ? GEM_COMPOUND_VALUES : GEM_SINGLE_VALUES;
    var raw = table[level - 1];
    // 收益递减：L10 以上仅 50% 有效
    if (level > 10) {
        var baseValue = table[9]; // L10 的值
        var overValue = raw - baseValue;
        return baseValue + overValue * 0.5;
    }
    return raw;
}

// 获取复合宝石额外属性值
function getGemExtraValue(gemType, level) {
    if (!gemType.isCompound || !gemType.extraPerLevel) return 0;
    return gemType.extraPerLevel * level;
}

// 共鸣等级阈值
var GEM_RESONANCE_THRESHOLDS = [
    { totalLevel: 10, bonus: 0.05, name: '初级共鸣' },
    { totalLevel: 25, bonus: 0.10, name: '中级共鸣' },
    { totalLevel: 50, bonus: 0.15, name: '高级共鸣' },
    { totalLevel: 80, bonus: 0.20, name: '顶级共鸣' },
    { totalLevel: 120, bonus: 0.30, name: '究极共鸣' }
];
