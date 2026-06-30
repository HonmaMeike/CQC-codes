/**
 * StaminaManager.js — 统一体力管理单例（v6.x）
 *
 * 设计原则：
 *   1. 单一来源：所有 stamina 相关入口集中在本文件
 *   2. 双轨并行：保留 game.js / dungeonUI.js 的旧函数作为回退
 *      业务方可逐步迁移到 window.StaminaManager
 *   3. 集中常量：MAX=240 / REGEN_INTERVAL=120000ms / INITIAL=60 单一位置管理
 *
 * 命名空间：window.StaminaManager
 *   - MAX, REGEN_INTERVAL, INITIAL       常量
 *   - get() / getPct() / getCountdown()  查询
 *   - regen() / spend(amount)            操作
 *   - getCost(dungeonType, level)        副本消耗
 *   - updateUI()                         同步显示
 *
 * 整合的分散函数（2 处）：
 *   - game.js            regenStamina/spendStamina/getStaminaPct
 *   - ui/dungeonUI.js    getStaminaCountdown/updateDungeonStaminaUI + DUNGEON_CONFIG.staminaCost
 */
/* global GameState */
(function () {
    'use strict';

    var MAX = 240;
    var REGEN_INTERVAL = 120000;  // 2 分钟恢复 1 点
    var INITIAL = 60;

    // ====================================================================
    // 内部：调用 game.js / dungeonUI.js 旧函数（向后兼容）
    // ====================================================================
    function _call(fnName, args) {
        if (typeof window === 'undefined') return null;
        var fn = window[fnName];
        if (typeof fn !== 'function') return null;
        try { return fn.apply(null, args || []); } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[StaminaManager.' + fnName + ']', e);
            return null;
        }
    }

    // ====================================================================
    // ① 体力查询
    // ====================================================================
    function get() {
        if (!GameState.getAll()) return 0;
        return Math.floor(GameState.get('stamina') || 0);
    }
    function getPct() {
        // 委托给旧 getStaminaPct（含自动 regen）
        if (typeof window.getStaminaPct === 'function') {
            try { return window.getStaminaPct(); } catch (e) { /* 回退 */ }
        }
        var stamina = GameState.get('stamina');
        return (stamina != null) ? (stamina / MAX) : 0;
    }
    function getCountdown() {
        if (typeof window.getStaminaCountdown === 'function') {
            try { return window.getStaminaCountdown(); } catch (e) { /* 回退 */ }
        }
        var stamina = GameState.get('stamina');
        if (stamina == null || stamina >= MAX) return '已满';
        var elapsed = Date.now() - (GameState.get('lastStaminaTime') || Date.now());
        var remaining = REGEN_INTERVAL - (elapsed % REGEN_INTERVAL);
        var seconds = Math.ceil(remaining / 1000);
        var min = Math.floor(seconds / 60);
        var sec = seconds % 60;
        return min + '分' + sec + '秒后恢复';
    }
    function isFull() {
        return get() >= MAX;
    }
    function canSpend(amount) {
        return get() >= amount;
    }

    // ====================================================================
    // ② 体力操作
    // ====================================================================
    function regen() {
        return _call('regenStamina', []);
    }
    function spend(amount) {
        return _call('spendStamina', [amount]);
    }
    function reset(newVal) {
        if (!GameState.getAll()) return false;
        GameState.set('stamina', (typeof newVal === 'number') ? newVal : INITIAL);
        GameState.set('lastStaminaTime', Date.now());
        return true;
    }

    // ====================================================================
    // ③ 副本消耗
    //    DUNGEON_CONFIG.staminaCost 固定消耗
    //    DUNGEON_CONFIG.staminaCosts[level] 等级数组（按难度递增）
    // ====================================================================
    function getCost(dungeonType, level) {
        if (typeof window.DUNGEON_CONFIG === 'undefined' || !window.DUNGEON_CONFIG) return 0;
        var cfg = window.DUNGEON_CONFIG[dungeonType];
        if (!cfg) return 0;
        if (cfg.staminaCosts && typeof level === 'number') {
            var idx = level - 1;
            if (idx >= 0 && idx < cfg.staminaCosts.length) return cfg.staminaCosts[idx];
        }
        return cfg.staminaCost || 0;
    }

    // ====================================================================
    // ④ UI 同步（委托给 dungeonUI.js updateDungeonStaminaUI）
    // ====================================================================
    function updateUI() {
        return _call('updateDungeonStaminaUI', []);
    }
    function colorForPct(pct) {
        if (pct > 0.3) return '#4caf50';
        if (pct > 0.1) return '#ff9800';
        return '#f44336';
    }

    // ====================================================================
    // ⑤ 启动时初始化（如果 gameState 不存在则跳过）
    // ====================================================================
    function init() {
        if (!GameState.getAll()) return false;
        if (typeof GameState.get('stamina') !== 'number') {
            GameState.set('stamina', INITIAL);
            GameState.set('lastStaminaTime', Date.now());
        }
        return true;
    }

    // ====================================================================
    // 暴露到全局
    // ====================================================================
    window.StaminaManager = {
        // 常量
        MAX: MAX,
        REGEN_INTERVAL: REGEN_INTERVAL,
        INITIAL: INITIAL,
        // 查询
        get: get,
        getPct: getPct,
        getCountdown: getCountdown,
        isFull: isFull,
        canSpend: canSpend,
        // 操作
        regen: regen,
        spend: spend,
        reset: reset,
        // 副本
        getCost: getCost,
        // UI
        updateUI: updateUI,
        colorForPct: colorForPct,
        // 初始化
        init: init
    };
})();
