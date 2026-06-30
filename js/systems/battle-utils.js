// ====== 战斗工具函数（从 battle.js 提取）v1 ======
// 纯函数，不依赖 BattleManager 状态

window.BattleUtils = {

    // ------ 伤害计算 ------
    calcDamage: function(atk, def, crit, critDmg, isCrit) {
        var c = (isCrit !== undefined) ? isCrit : (Math.random() * 100 < (crit || 0));
        var mult = c ? (critDmg || 200) / 100 : 1;
        return {
            dmg: Math.max(1, Math.floor((atk * mult - def * 0.5))),
            isCrit: c,
        };
    },

    // ------ 格式化数字 ------
    formatNumber: function(n) {
        if (typeof formatNumber === 'function') return formatNumber(n);
        if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
        if (n >= 10000) return (n / 10000).toFixed(1) + '万';
        return String(n);
    },

    // ------ 波次生成配置 ------
    getWaveEnemyCount: function(stage, isDungeon) {
        if (isDungeon) return 10;
        return Math.min(18, Math.max(5, 5 + Math.floor(stage / 3)));
    },

    // ------ 副本消耗 ------
    getDungeonCost: function(type) {
        var cfg = window.BattleConfig;
        return cfg.DUNGEON_STAMINA_COST[type] || 5;
    },
};
