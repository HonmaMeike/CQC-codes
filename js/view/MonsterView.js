// ========== 怪物属性视图层 (ES5) ==========
// 解决问题：怪物在 BattleManager.enemies[] / 图鉴 codex / 友方 monster 之间存在多份引用
// 设计原则：怪物模板从 MONSTERS 主源读取，实例属性从 BattleManager 实时状态读取

(function(global) {
    'use strict';

    // 章节 → 场景（与 battle.js _stageSceneMap 保持一致）
    function _sceneForStage(stage) {
        if (typeof STAGE_NAMES === 'undefined' || !Array.isArray(STAGE_NAMES)) return 'plain';
        var name = STAGE_NAMES[Math.max(0, (stage || 1) - 1)] || '';
        return _sceneForName(name);
    }

    function _sceneForName(name) {
        if (!name) return 'plain';
        if (name.indexOf('森林') !== -1 || name.indexOf('林') !== -1) return 'forest';
        if (name.indexOf('墓') !== -1) return 'graveyard';
        if (name.indexOf('火') !== -1 || name.indexOf('熔') !== -1) return 'volcano';
        if (name.indexOf('冰') !== -1 || name.indexOf('霜') !== -1) return 'ice';
        if (name.indexOf('遗迹') !== -1 || name.indexOf('城') !== -1 || name.indexOf('要塞') !== -1) return 'ruins';
        if (name.indexOf('深渊') !== -1 || name.indexOf('魔') !== -1) return 'abyss';
        if (name.indexOf('龙') !== -1) return 'dragon';
        if (name.indexOf('神') !== -1 || name.indexOf('圣') !== -1) return 'divine';
        if (name.indexOf('虚空') !== -1 || name.indexOf('回廊') !== -1) return 'void';
        if (name.indexOf('星') !== -1) return 'star';
        if (name.indexOf('海') !== -1 || name.indexOf('水') !== -1) return 'sea';
        if (name.indexOf('沙') !== -1) return 'desert';
        if (name.indexOf('雷') !== -1 || name.indexOf('风暴') !== -1) return 'storm';
        if (name.indexOf('暗影') !== -1 || name.indexOf('暗') !== -1) return 'shadow';
        if (name.indexOf('水晶') !== -1) return 'crystal';
        if (name.indexOf('草原') !== -1) return 'plain';
        if (name.indexOf('雪') !== -1) return 'snow';
        if (name.indexOf('战场') !== -1) return 'battlefield';
        if (name.indexOf('沼泽') !== -1) return 'swamp';
        if (name.indexOf('迷宫') !== -1) return 'labyrinth';
        if (name.indexOf('塔') !== -1) return 'tower';
        if (name.indexOf('井') !== -1 || name.indexOf('湖') !== -1) return 'lake';
        if (name.indexOf('时') !== -1) return 'time';
        return 'plain';
    }

    var MonsterView = {
        // ---------- 主源访问 ----------

        // 怪物模板（只读，从 MONSTERS 主源）
        template: function(monsterKey) {
            if (typeof MONSTERS === 'undefined') return null;
            return MONSTERS[monsterKey] || null;
        },

        // 通过章节获取怪物列表
        byChapter: function(chapter) {
            if (typeof MONSTERS === 'undefined') return [];
            var list = [];
            var prefix = 'c' + chapter + '_';
            for (var k in MONSTERS) {
                if (k && k.indexOf(prefix) === 0) list.push(MONSTERS[k]);
            }
            return list;
        },

        // 所有怪物模板
        all: function() {
            if (typeof MONSTERS === 'undefined') return [];
            var list = [];
            for (var k in MONSTERS) {
                if (MONSTERS[k]) list.push(MONSTERS[k]);
            }
            return list;
        },

        // 战斗中所有怪物
        battleMonsters: function() {
            if (typeof BattleManager === 'undefined' || !Array.isArray(BattleManager.enemies)) return [];
            return BattleManager.enemies;
        },

        // 战斗中某怪物
        battleById: function(monsterId) {
            var list = this.battleMonsters();
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].id === monsterId) return list[i];
            }
            return null;
        },

        // 友方召唤的怪物（如骑士的召唤物、贤者的援军等）
        friendMonsters: function() {
            if (typeof BattleManager === 'undefined' || !Array.isArray(BattleManager.friends)) return [];
            return BattleManager.friends;
        },

        // ---------- 基础属性 ----------

        // 怪物名
        name: function(monsterKeyOrObj) {
            if (!monsterKeyOrObj) return '???';
            if (typeof monsterKeyOrObj === 'string') {
                var t = this.template(monsterKeyOrObj);
                return t ? (t.name || monsterKeyOrObj) : monsterKeyOrObj;
            }
            return monsterKeyOrObj.name || '???';
        },

        // 怪物图标
        icon: function(monsterKeyOrObj) {
            if (typeof monsterKeyOrObj === 'string') {
                var t = this.template(monsterKeyOrObj);
                return t ? (t.icon || '👹') : '👹';
            }
            return monsterKeyOrObj.icon || '👹';
        },

        // 章节名
        stageName: function(stage) {
            if (typeof getStageName === 'function') return getStageName(stage);
            if (typeof STAGE_NAMES !== 'undefined' && STAGE_NAMES[stage - 1]) return STAGE_NAMES[stage - 1];
            return '第' + stage + '章';
        },

        // 场景（用于背景）
        sceneForStage: function(stage) {
            if (typeof BattleManager !== 'undefined' && BattleManager._stageSceneMap) {
                var name = this.stageName(stage);
                return BattleManager._stageSceneMap[name] || _sceneForName(name);
            }
            return _sceneForStage(stage);
        },

        // 战力推荐
        recommendedPower: function(stage) {
            if (typeof getRecommendedPower === 'function') return getRecommendedPower(stage);
            return 100 * Math.pow(1.5, (stage || 1) - 1);
        },

        // 战斗怪物 HP 百分比
        battleHpPct: function(monsterOrId) {
            var m = (typeof monsterOrId === 'string') ? this.battleById(monsterOrId) : monsterOrId;
            if (!m || !m.maxHp) return 0;
            return Math.max(0, Math.min(1, m.hp / m.maxHp));
        },

        // 是否 BOSS
        isBoss: function(monsterOrKey) {
            if (typeof monsterOrKey === 'string') {
                var t = this.template(monsterOrKey);
                return t ? !!t.isBoss : false;
            }
            return monsterOrKey ? !!monsterOrKey.isBoss : false;
        },

        // 是否精英
        isElite: function(monsterOrKey) {
            if (typeof monsterOrKey === 'string') {
                var t = this.template(monsterOrKey);
                return t ? !!t.isElite : false;
            }
            return monsterOrKey ? !!monsterOrKey.isElite : false;
        },

        // 怪物说明（图鉴）
        description: function(monsterKey) {
            if (typeof monsterKey !== 'string') return '';
            var t = this.template(monsterKey);
            if (!t) return '';
            if (t.desc) return t.desc;
            // 兜底：使用 monsterCodexUI.getMonsterDescription
            if (typeof getMonsterDescription === 'function') {
                try { return getMonsterDescription(t); } catch(e) { return ''; }
            }
            return '';
        }
    };

    global.MonsterView = MonsterView;
})(typeof window !== 'undefined' ? window : this);
