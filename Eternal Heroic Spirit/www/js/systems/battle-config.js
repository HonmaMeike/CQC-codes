// ====== 战斗系统配置（从 battle.js 提取的魔数与常量）v1 ======
// 修改战斗/副本/魔王/爬塔参数只需改此文件

window.BattleConfig = {

    // ---------- 战斗基础 ----------
    SPAWN_INTERVAL_NORMAL: 1500,        // 普通模式怪物生成间隔 (ms)
    SPAWN_INTERVAL_TOWER: 1000,         // 爬塔模式生成间隔 (ms)
    WAVE_ENEMY_COUNT_BASE: 10,          // 每波基础敌人数
    WAVE_ENEMY_COUNT_MIN: 5,
    WAVE_ENEMY_COUNT_MAX: 18,

    // ---------- 魔王副本 ----------
    DEMON_KING_TIME_LIMIT: 60000,       // 60秒限时
    DEMON_KING_REGEN: true,             // 魔王是否自动回血
    DEMON_KING_BOSS_NAME: '世界之主·芦笋',
    DEMON_KING_BOSS_EMOJI: '🌿',

    // ---------- 魔王奖励上限 ----------
    DK_REWARD_CAPS: {
        gold: 1000000,
        dust: 200000,
        lotteryStone: 1000,
        gem: 1000,
        petEggStones: 1000,
        upgradeStone: 1000,
        reforgestone: 5000,
        gemLevel: 5,
    },

    // ---------- 副本消耗 ----------
    DUNGEON_STAMINA_COST: {
        gold: 5,
        stone: 8,
        gem: 8,
        equip: 10,
        demonking: 20,
        tower: 5,
    },

    // ---------- 爬塔 ----------
    TOWER_BUFF_INTERVAL: 15,            // 每15层玩家获得buff
    TOWER_SPAWN_INTERVAL: 1000,         // 爬塔生成间隔 (ms)
    TOWER_FLOOR_ENEMY_BASE: 3,          // 每层基础怪物数
    TOWER_FLOOR_ENEMY_MAX: 8,           // 每层最大怪物数

    // ---------- 怪物难度 ----------
    BOSS_WAVE_INTERVAL: 3,              // 每3波出一只BOSS
    ELITE_PER_WAVE: 1,                  // 每波精英数
    ELITE_HP_MULT: 6,                    // 精英HP倍率
    ELITE_ATK_MULT: 2.2,
    BOSS_HP_MULT: 16,
    BOSS_ATK_MULT: 4,
};
