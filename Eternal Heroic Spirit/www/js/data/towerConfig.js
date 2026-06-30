// ========== 爬塔·无尽 v4.0 配置 ==========
// 取代旧的 4 副本系统（金币/重铸石/宝石/装备）
// 设计：3 副本（金币/重铸石/宝石）合并 + 装备改抽奖系统

// 楼层类型常量
var TOWER_FLOOR_TYPE = {
    NORMAL: 'normal',  // 普通层
    ELITE:  'elite',   // 精英层（每 5 层）
    BOSS:   'boss'     // BOSS 层（每 10 层）
};

// 楼层类型判定（10 层一循环）
//   mod 10: 0 → BOSS, 5 → ELITE, 其他 → NORMAL
function getTowerFloorType(floor) {
    if (floor <= 0) return TOWER_FLOOR_TYPE.NORMAL;
    var mod = floor % 10;
    if (mod === 0) return TOWER_FLOOR_TYPE.BOSS;
    if (mod === 5) return TOWER_FLOOR_TYPE.ELITE;
    return TOWER_FLOOR_TYPE.NORMAL;
}

// 楼层类型显示名
var TOWER_FLOOR_TYPE_NAME = {
    normal: { name: '普通层', icon: '⚔', color: '#9e9e9e' },
    elite:  { name: '精英层', icon: '★', color: '#ff9800' },
    boss:   { name: 'BOSS 层', icon: '👑', color: '#ff5722' }
};

// 难度倍率：每层 +5% （用户原话"每爬一层怪物属性+5%，奖励+5%"）
//   floor=1 → 1.0, floor=10 → 1.45, floor=50 → 3.45, floor=100 → 5.95
function getTowerFloorMult(floor) {
    return 1 + Math.max(0, floor - 1) * 0.05;
}

// 楼层 → 章节映射（用于原版怪池）
//   floor 1-9 → stage 1, floor 10-19 → stage 2, ... → stage=ceil(floor/10)
//   之后用 getMonstersForStage(stage) 拿对应怪池
function getTowerStageForFloor(floor) {
    return Math.max(1, Math.ceil(floor / 10));
}

// ========== 楼层基础奖励（楼层 1 基线）============
// 用户决策：BOSS 层 2 抽奖石保底（其他层不给）
// 楼层 1 普通: 500 金币 + 0 重铸石
// 楼层 1 精英: 1500 金币 + 50 重铸石 + 30% 概率 1 Lv.1 宝石
// 楼层 1 BOSS:  4000 金币 + 200 重铸石 + 2 Lv.2 宝石 + 2 抽奖石

var TOWER_BASE_REWARD = {
    normal: {
        gold: 500,
        reforgestone: 0,
        lotteryStone: 0,
        gem: null  // { minLevel, maxLevel, count, chance }
    },
    elite: {
        gold: 1500,
        reforgestone: 50,
        lotteryStone: 0,
        gem: { minLevel: 1, maxLevel: 1, count: 1, chance: 0.30 }  // 30% 概率 1 个 Lv.1 宝石
    },
    boss: {
        gold: 4000,
        reforgestone: 200,
        lotteryStone: 2,   // 用户决策：BOSS 层 2 抽奖石保底
        petEggStone: 2,    // v5.0: BOSS 层 2 宠物蛋石
        gem: { minLevel: 2, maxLevel: 2, count: 2, chance: 1.0 }  // 100% 2 个 Lv.2 宝石
    }
};

// 计算指定楼层的具体奖励
function calcTowerReward(floor) {
    var type = getTowerFloorType(floor);
    var base = TOWER_BASE_REWARD[type];
    var mult = getTowerFloorMult(floor);
    // 应用每日增益
    var daily = (typeof getDailyBonus === 'function') ? getDailyBonus() : null;
    var goldDailyMult = (daily && daily.goldMult) ? daily.goldMult : 1;
    var reward = {
        gold: Math.floor(base.gold * mult * goldDailyMult),
        reforgestone: Math.floor(base.reforgestone * mult),
        lotteryStone: base.lotteryStone,
        petEggStone: base.petEggStone || 0,
        upgradeStone: 0,
        gems: []
    };
    // ★ 楼层特定奖励
    if (floor === 5) {
        reward.lotteryStone += 2;
        reward.petEggStone += 2;
    }
    if (floor === 10) {
        reward.lotteryStone = 10;
        reward.petEggStone = 5;
    }
    // BOSS层额外给1个升级石
    if (type === TOWER_FLOOR_TYPE.BOSS) {
        reward.upgradeStone = 1;
    }
    // 宝石：按概率决定是否掉
    if (base.gem && base.gem.chance > 0) {
        var dropChance = base.gem.chance;
        if (Math.random() < dropChance) {
            for (var i = 0; i < base.gem.count; i++) {
                reward.gems.push({
                    level: base.gem.minLevel,  // 简化：取 minLevel
                    count: 1
                });
            }
        }
    }
    return reward;
}

// 体力消耗（每层固定 5 点，匹配原副本消耗）
function getTowerStaminaCost() {
    return 5;
}

// 初始化 tower 字段
function initTowerState() {
    return {
        currentFloor: 1,    // 下一层要挑战的层（默认从 1 开始）
        maxFloor: 1,         // 历史最高通关层
        bestFloor: 1,        // 同 maxFloor（保留字段做未来扩展）
        totalRuns: 0,        // 总挑战次数
        totalDeaths: 0,      // 总失败次数
        lastReward: null     // 上次挑战奖励（用于动画展示）
    };
}
