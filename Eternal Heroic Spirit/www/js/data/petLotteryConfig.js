// ========== 此文件已废弃 ==========
// PET_LOTTERY_CONFIG 实际由 ui/petLotteryUI.js 定义并覆盖。
// 本文件中的旧数据因加载顺序问题从未生效，保留为历史参考。
// 如需修改宠物抽奖配置，请编辑 ui/petLotteryUI.js。
var PET_LOTTERY_CONFIG_DEPRECATED = true;

// ========== 宠物蛋抽奖 v5.0 配置 ==========
// 替代三蛋品阶，改为两个池子：普通抽奖 / 高级抽奖
// 参考 LOTTERY_CONFIG 结构

var PET_LOTTERY_CONFIG = {
    normal: {
        name: '普通抽蛋',
        costPerDraw: 1,         // 单抽消耗宠物蛋石
        costPerTenDraw: 10,     // 十连消耗
        pityTier: 'epic',       // 十连保底至少1史诗
        pityTierName: '史诗',
        // 蛋品阶概率 → 孵化后按池出宠
        // 直接产出「宠物」而非蛋（抽到即得宠）
        petTierRates: [
            { tier: 'normal',  name: '普通', rate: 0.80 },
            { tier: 'rare',    name: '稀有', rate: 0.18 },
            { tier: 'epic',    name: '史诗', rate: 0.02 }
        ]
    },
    advanced: {
        name: '高级抽蛋',
        costPerDraw: 5,
        costPerTenDraw: 50,
        pityTier: 'legend',
        pityTierName: '传说',
        petTierRates: [
            { tier: 'epic',    name: '史诗', rate: 0.65 },
            { tier: 'legend',  name: '传说', rate: 0.30 },
            { tier: 'mythic',  name: '神化', rate: 0.05 }
        ]
    }
};

var PET_LOTTERY_HISTORY_MAX = 50;
