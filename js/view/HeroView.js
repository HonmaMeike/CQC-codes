// ========== 角色属性视图层 (ES5) ==========
// 解决问题：JSON.parse 后 team/selection/ally 多套对象引用分离，导致属性读取不同步
// 设计原则：永远从 GameState.get("heroes") 主源读取，不接受外部缓存的对象引用
/* global GameState */

(function(global) {
    'use strict';

    // 内部辅助：归一化输入为 heroId
    function _normId(heroOrId) {
        if (!heroOrId) return null;
        if (typeof heroOrId === 'string') return heroOrId;
        return heroOrId.id || null;
    }

    // 内部辅助：归一化输入为 hero 对象（最新引用）
    function _norm(heroOrId) {
        var id = _normId(heroOrId);
        if (!id) return null;
        return HeroView.byId(id);
    }

    var HeroView = {
        // ---------- 主源访问 ----------

        // 通过 id 找英雄（永远从 GameState.get("heroes") 主源获取最新引用）
        byId: function(heroId) {
            if (!gameState || !heroId) return null;
            var list = GameState.get("heroes") || [];
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].id === heroId) return list[i];
            }
            return null;
        },

        // 通过上阵位置找英雄
        byPos: function(pos) {
            if (!gameState || !GameState.get("team")) return null;
            var slot = GameState.get("team")[pos];
            if (!slot) return null;
            return this.byId(slot.id);  // 永远从 heroes 主源读取，避免分离对象
        },

        // 找英雄上阵位置，返回 'front' | 'back1' | 'back2' | 'back3' | null
        posOf: function(heroOrId) {
            var id = _normId(heroOrId);
            if (!id || !gameState || !GameState.get("team")) return null;
            var positions = ['front', 'back1', 'back2', 'back3'];
            for (var i = 0; i < positions.length; i++) {
                var slot = GameState.get("team")[positions[i]];
                if (slot && slot.id === id) return positions[i];
            }
            return null;
        },

        // 上阵位英雄列表（数组，按位置顺序）
        team: function() {
            var result = [];
            if (!gameState || !GameState.get("team")) return result;
            var positions = ['front', 'back1', 'back2', 'back3'];
            for (var i = 0; i < positions.length; i++) {
                var h = this.byPos(positions[i]);
                if (h) result.push(h);
            }
            return result;
        },

        // 全部英雄（含未上阵）
        all: function() {
            if (!gameState) return [];
            return GameState.get("heroes") || [];
        },

        // 池中未上阵的英雄
        pool: function() {
            var idsOnTeam = {};
            var positions = ['front', 'back1', 'back2', 'back3'];
            for (var i = 0; i < positions.length; i++) {
                var slot = (gameState && GameState.get("team")) ? GameState.get("team")[positions[i]] : null;
                if (slot && slot.id) idsOnTeam[slot.id] = true;
            }
            return this.all().filter(function(h) { return h && !idsOnTeam[h.id]; });
        },

        // ---------- 基础属性 ----------

        // 职业数据（从 classes.js 主源）
        classData: function(heroOrId) {
            var h = _norm(heroOrId);
            if (!h) return null;
            return (typeof getClassData === 'function') ? getClassData(h.classId) : null;
        },

        // 职业中文名
        name: function(heroOrId) {
            var h = _norm(heroOrId);
            if (!h) return '未知';
            var cls = this.classData(h);
            return (cls && cls.name) || h.name || '未知';
        },

        // 职业图标
        icon: function(heroOrId) {
            var cls = this.classData(heroOrId);
            return (cls && cls.icon) || '?';
        },

        // 职业定位（tank/dps/support/healer）
        role: function(heroOrId) {
            var cls = this.classData(heroOrId);
            return (cls && cls.role) || 'dps';
        },

        // 职业定位中文名
        roleName: function(heroOrId) {
            var role = this.role(heroOrId);
            if (typeof CLASS_ROLE_NAMES !== 'undefined' && CLASS_ROLE_NAMES[role]) {
                return CLASS_ROLE_NAMES[role];
            }
            return role;
        },

        // 等级
        level: function(heroOrId) {
            var h = _norm(heroOrId);
            return h ? (h.level || 1) : 1;
        },

        // 经验值
        exp: function(heroOrId) {
            var h = _norm(heroOrId);
            return h ? (h.exp || 0) : 0;
        },

        // 升级所需经验
        expToNext: function(heroOrId) {
            var lv = this.level(heroOrId);
            if (lv >= 999) return Infinity;
            var h = _norm(heroOrId);
            if (h && typeof h.expToNext === 'number' && h.expToNext !== Infinity && h.expToNext > 0) {
                return h.expToNext;
            }
            return (typeof getExpToNext === 'function') ? getExpToNext(lv) : 100;
        },

        // 经验百分比 0~1
        expPct: function(heroOrId) {
            var max = this.expToNext(heroOrId);
            if (!isFinite(max) || max <= 0) return 0;
            var cur = this.exp(heroOrId);
            return Math.min(1, cur / max);
        },

        // 技能点
        skillPoints: function(heroOrId) {
            var h = _norm(heroOrId);
            return h ? (h.skillPoints || 0) : 0;
        },

        // ---------- 装备/宝石 ----------

        // 装备实例（按槽位）
        equip: function(heroOrId, slot) {
            var h = _norm(heroOrId);
            if (!h || !h.equip) return null;
            return h.equip[slot] || null;
        },

        // 是否穿戴该槽位装备
        hasEquip: function(heroOrId, slot) {
            return !!this.equip(heroOrId, slot);
        },

        // 全部穿戴装备
        allEquips: function(heroOrId) {
            var h = _norm(heroOrId);
            return (h && h.equip) ? h.equip : {};
        },

        // 镶嵌的宝石（装备上的）
        equipGems: function(heroOrId, slot) {
            var eq = this.equip(heroOrId, slot);
            if (!eq) return [];
            return (eq.gems && Array.isArray(eq.gems)) ? eq.gems : [];
        },

        // 英雄个人战力
        power: function(heroOrId) {
            var h = _norm(heroOrId);
            if (!h) return 0;
            if (typeof calcHeroPower === 'function') {
                try { return calcHeroPower(h); } catch(e) { return 0; }
            }
            return 0;
        },

        // ---------- 战斗属性（瞬时计算）----------

        // 战斗属性（包含装备+天赋+宝石加成后的总属性）
        battleStats: function(heroOrId) {
            var h = _norm(heroOrId);
            if (!h) return null;
            var cls = this.classData(h);
            if (!cls) return null;
            if (typeof BattleManager !== 'undefined' && BattleManager.calcAllyStats) {
                try { return BattleManager.calcAllyStats(h, cls); } catch(e) { return null; }
            }
            return null;
        },

        // 战斗中生命值百分比（如果该英雄正在战斗）
        battleHpPct: function(heroOrId) {
            var id = _normId(heroOrId);
            if (!id || typeof BattleManager === 'undefined' || !BattleManager.allies) return null;
            for (var i = 0; i < BattleManager.allies.length; i++) {
                var a = BattleManager.allies[i];
                if (a && a.id === id && a.alive) {
                    return a.maxHp > 0 ? a.hp / a.maxHp : 0;
                }
            }
            return null;
        },

        // ---------- 修改操作（统一封装，保证 UI 同步）----------

        // 加经验（带 UI 刷新）
        addExp: function(heroOrId, amount) {
            var h = _norm(heroOrId);
            if (!h || !amount) return false;
            h.exp = (h.exp || 0) + amount;
            if (typeof checkLevelUp === 'function') {
                checkLevelUp(h);  // 内部已自动调用 refreshTeamUI/refreshHeroUI
                return true;
            }
            this.notifyChanged();
            return true;
        },

        // 设置等级（带 UI 刷新）
        setLevel: function(heroOrId, lv) {
            var h = _norm(heroOrId);
            if (!h) return false;
            h.level = lv;
            if (typeof getExpToNext === 'function') h.expToNext = getExpToNext(lv);
            this.notifyChanged();
            return true;
        },

        // 通知 UI 已变更（统一刷新入口）
        notifyChanged: function() {
            if (typeof updateResources === 'function') updateResources();
            if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
            if (typeof refreshTeamUI === 'function') refreshTeamUI();
            if (typeof refreshHeroUI === 'function') refreshHeroUI();
        }
    };

    global.HeroView = HeroView;
})(typeof window !== 'undefined' ? window : this);