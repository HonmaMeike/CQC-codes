// ========== View 层基类 (ES5) ==========
// 设计目标：提取 5 个 View 文件中重复的「在 gameState 数据中按 id 查找」逻辑
// v3 统一架构：所有 View 都应通过 window.ViewBase 复用底层数据查找
//
// 当前合并的逻辑：
//   1. _findById - 通用按 id 在数组中查找
//   2. _findInHeroesEquip - 在英雄穿戴装备中按 id 找装备
//   3. _findGemInHeroesEquip - 在英雄穿戴装备的 gems[] 中按 id 找宝石
//   4. _resolveEquip - EquipView.js 的 _resolve 委托入口
//   5. _resolveGem   - GemView.js 的 _resolve 委托入口
//   6. _resolveSkill - SkillView.js 的 _resolve（数据源为 SKILL_DATA 静态字典，单独保留）
//
// 设计原则：
//   - 函数是 _ 前缀（约定为内部 API），View 通过 ViewBase.xxx 引用
//   - 不破坏现有 gameState 结构假设（仍然走 inventory / heroes / gems）
//   - ES5 兼容（var + function + IIFE）
//   - 若 gameState 不存在，安全降级返回 null
/* global GameState */
(function(global) {
    'use strict';

    /**
     * 在一个数组中按 id 查找对象（支持装备/宝石结构）
     * @param {Array} arr - 源数组（GameState.get("inventory") / GameState.get("gems") / GameState.get("heroes") 等）
     * @param {string} id - 要查找的 id
     * @param {boolean} isHeroEquip - 是否英雄 equip 对象（hero.equip 本身没有 id，需特殊处理）
     * @return {Object|null} 找到的对象
     */
    function _findById(arr, id) {
        if (!Array.isArray(arr)) return null;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] && arr[i].id === id) return arr[i];
        }
        return null;
    }

    /**
     * 在所有英雄穿戴装备中按 id 找装备
     * @param {string} id - 装备 id
     * @return {Object|null}
     */
    function _findInHeroesEquip(id) {
        if (!global.gameState || !Array.isArray(GameState.get("heroes"))) return null;
        for (var h = 0; h < GameState.get("heroes").length; h++) {
            var hero = GameState.get("heroes")[h];
            if (hero && hero.equip) {
                for (var slot in hero.equip) {
                    var eq = hero.equip[slot];
                    if (eq && eq.id === id) return eq;
                }
            }
        }
        return null;
    }

    /**
     * 在所有英雄穿戴装备的 gems[] 中按 id 找宝石
     * @param {string} id - 宝石 id
     * @return {Object|null}
     */
    function _findGemInHeroesEquip(id) {
        if (!global.gameState || !Array.isArray(GameState.get("heroes"))) return null;
        for (var h = 0; h < GameState.get("heroes").length; h++) {
            var hero = GameState.get("heroes")[h];
            if (hero && hero.equip) {
                for (var slot in hero.equip) {
                    var eq = hero.equip[slot];
                    if (eq && Array.isArray(eq.gems)) {
                        for (var g = 0; g < eq.gems.length; g++) {
                            if (eq.gems[g] && eq.gems[g].id === id) return eq.gems[g];
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * 在仓库装备的 gems[] 中按 id 找宝石
     * @param {string} id - 宝石 id
     * @return {Object|null}
     */
    function _findGemInInventory(id) {
        if (!global.gameState || !Array.isArray(GameState.get("inventory"))) return null;
        for (var i = 0; i < GameState.get("inventory").length; i++) {
            var eq = GameState.get("inventory")[i];
            if (eq && Array.isArray(eq.gems)) {
                for (var g = 0; g < eq.gems.length; g++) {
                    if (eq.gems[g] && eq.gems[g].id === id) return eq.gems[g];
                }
            }
        }
        return null;
    }

    /**
     * 装备 _resolve：string→按 id 找（仓库 + 穿戴中），object→直接返回
     * @param {string|Object|null} equipOrId
     * @return {Object|null}
     */
    function _resolveEquip(equipOrId) {
        if (!equipOrId) return null;
        if (typeof equipOrId === 'object') return equipOrId;
        if (typeof equipOrId !== 'string') return null;
        // 1. 仓库
        var found = _findById(global.gameState && GameState.get("inventory"), equipOrId);
        if (found) return found;
        // 2. 英雄穿戴中
        return _findInHeroesEquip(equipOrId);
    }

    /**
     * 宝石 _resolve：string→按 id 找（gems + inventory.gems + heroes.equip.gems），object→直接返回
     * @param {string|Object|null} gemOrId
     * @return {Object|null}
     */
    function _resolveGem(gemOrId) {
        if (!gemOrId) return null;
        if (typeof gemOrId === 'object') return gemOrId;
        if (typeof gemOrId !== 'string') return null;
        // 1. GameState.get("gems")
        var found = _findById(global.gameState && GameState.get("gems"), gemOrId);
        if (found) return found;
        // 2. 仓库装备的 gems[]
        found = _findGemInInventory(gemOrId);
        if (found) return found;
        // 3. 英雄穿戴装备的 gems[]
        return _findGemInHeroesEquip(gemOrId);
    }

    /**
     * 技能 _resolve：从 SKILL_DATA 静态字典查模板
     * 与 EquipView/GemView 不同，技能是静态模板，不在 gameState 中找实例
     * @param {string|Object|null} skillRef - 技能 id 字符串 或 {id, level} 对象
     * @return {{skill: Object, id: string, level: number}|null}
     */
    function _resolveSkill(skillRef) {
        if (!skillRef) return null;
        var SKILL_DATA = global.SKILL_DATA;
        if (typeof SKILL_DATA === 'undefined') return null;
        if (typeof skillRef === 'string') {
            if (SKILL_DATA[skillRef]) {
                return { skill: SKILL_DATA[skillRef], id: skillRef };
            }
            return null;
        }
        if (typeof skillRef === 'object' && skillRef.id) {
            var tmpl = SKILL_DATA[skillRef.id];
            if (!tmpl) return null;
            return { skill: tmpl, id: skillRef.id, level: skillRef.level || 0 };
        }
        return null;
    }

    // ====================================================================
    // 暴露到全局
    // ====================================================================
    global.ViewBase = {
        // 通用数据查找
        findById: _findById,
        findInHeroesEquip: _findInHeroesEquip,
        findGemInHeroesEquip: _findGemInHeroesEquip,
        findGemInInventory: _findGemInInventory,
        // 领域 _resolve 委托
        resolveEquip: _resolveEquip,
        resolveGem: _resolveGem,
        resolveSkill: _resolveSkill
    };
})(typeof window !== 'undefined' ? window : this);
