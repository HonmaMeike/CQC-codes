// ========== 此文件已废弃 ==========
// LOTTERY_CONFIG 实际由 ui/lotteryUI.js 定义并覆盖。
// 本文件中的旧数据因加载顺序问题从未生效，保留为历史参考。
// 如需修改抽奖配置，请编辑 ui/lotteryUI.js。
var LOTTERY_CONFIG_DEPRECATED = true;

// ========== 抽奖配置 v6.2 ==========
// 替代旧"装备副本"系统
// 两类抽奖：普通（1 抽奖石/次） / 高级（10 抽奖石/次）
// 都有单抽和十连抽
// 概率（用户决策）：
//   普通: 白 50% / 绿 30% / 蓝 15% / 紫 4% / 橙 1%
//   高级: 蓝 45% / 紫 35% / 橙 18% / 金 2%   ★ v2.6.4 Round 7.3 调整 (玩家反馈橙金太容易)
//   十连保底：普通十连 ≥1 紫 / 高级十连 ≥1 橙
//   附加奖励 (金币/重铸石/宝石): v2.6.4 Round 7.3 减半 (玩家反馈太多)

var LOTTERY_CONFIG = {
    normal: {
        name: '普通抽奖',
        costPerDraw: 1,         // 单次消耗抽奖石
        costPerTenDraw: 10,     // 十连抽消耗（= 10 × 单价）
        pityTier: 3,            // 十连保底：至少 1 个紫（MIRACLE = 3）
        pityTierName: '紫装',
        // 装备品质概率（必须按品质从低到高累加，最后 fallback 兜底）
        equipTierRates: [
            { tier: 0, name: '白', rate: 0.50, minEquipLevel: 1, maxEquipLevel: 5 },
            { tier: 1, name: '绿', rate: 0.30, minEquipLevel: 3, maxEquipLevel: 8 },
            { tier: 2, name: '蓝', rate: 0.15, minEquipLevel: 5, maxEquipLevel: 12 },
            { tier: 3, name: '紫', rate: 0.04, minEquipLevel: 8, maxEquipLevel: 18 },
            { tier: 4, name: '橙', rate: 0.01, minEquipLevel: 12, maxEquipLevel: 25 }
        ],
        // 附加奖励（每次都掉）— v2.6.4 Round 7.3 减半
        bonusReward: {
            goldMin: 50, goldMax: 250,
            stoneMin: 1, stoneMax: 3
        }
    },
    advanced: {
        name: '高级抽奖',
        costPerDraw: 10,
        costPerTenDraw: 100,
        pityTier: 4,            // 至少 1 个橙（MYTHIC = 4）
        pityTierName: '橙装',
        // ★ v2.6.4 Round 7.3: 高级抽奖品质调整
        //   旧: 蓝 5% / 紫 40% / 橙 40% / 金 15% (橙金太容易, 数值爆炸)
        //   新: 蓝 45% / 紫 35% / 橙 18% / 金 2%
        equipTierRates: [
            { tier: 2, name: '蓝', rate: 0.45, minEquipLevel: 8,  maxEquipLevel: 15 },
            { tier: 3, name: '紫', rate: 0.35, minEquipLevel: 10, maxEquipLevel: 22 },
            { tier: 4, name: '橙', rate: 0.18, minEquipLevel: 15, maxEquipLevel: 35 },
            { tier: 5, name: '金', rate: 0.02, minEquipLevel: 22, maxEquipLevel: 50 }
        ],
        // 附加奖励（每次都掉）— v2.6.4 Round 7.3 减半
        bonusReward: {
            goldMin: 500, goldMax: 2500,
            stoneMin: 5, stoneMax: 25,
            gemChance: 0.25,    // 50% → 25% (减半)
            gemLevel: 3
        }
    }
};

// 抽奖历史记录最大条数（节省内存）
var LOTTERY_HISTORY_MAX = 50;
