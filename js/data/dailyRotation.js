// ========== 每日地下城轮转系统 ==========
// 根据当前星期几应用不同的增益效果
// 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

var DAILY_BONUS_CONFIG = {
    // 周一：金币之日
    1: {
        id: 'gold',
        name: '金币之日',
        icon: '💰',
        desc: '金币掉落 ×3',
        bannerBg: 'linear-gradient(135deg,#ff8f00, #ff6f00)',
        goldMult: 3,
        equipDropRateMult: 1,
        equipQualityBoost: 0,
        expMult: 1
    },
    // 周三：装备之日
    3: {
        id: 'equip',
        name: '装备之日',
        icon: '⚔',
        desc: '装备掉落率 ×2，品质 +1 阶',
        bannerBg: 'linear-gradient(135deg,#7c4dff, #651fff)',
        goldMult: 1,
        equipDropRateMult: 2,
        equipQualityBoost: 1,
        expMult: 1
    },
    // 周五：经验之日
    5: {
        id: 'exp',
        name: '经验之日',
        icon: '⭐',
        desc: '英雄经验 ×2',
        bannerBg: 'linear-gradient(135deg,#00c853, #00e676)',
        goldMult: 1,
        equipDropRateMult: 1,
        equipQualityBoost: 0,
        expMult: 2
    }
};

// 默认无增益
var DEFAULT_DAILY_BONUS = {
    id: 'normal',
    name: '普通日',
    icon: '📅',
    desc: '今日无特殊增益',
    bannerBg: 'linear-gradient(135deg,#555, #444)',
    goldMult: 1,
    equipDropRateMult: 1,
    equipQualityBoost: 0,
    expMult: 1
};

// 获取当前星期几的增益配置
function getDailyBonus() {
    var day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return DAILY_BONUS_CONFIG[day] || DEFAULT_DAILY_BONUS;
}
