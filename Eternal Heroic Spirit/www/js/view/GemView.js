// ========== 宝石属性视图层 (ES5) ==========
// 解决问题：宝石在 inventory/gems[] / 装备 eq.gems[] / 角色详情之间存在多份引用
// 设计原则：宝石通过唯一 id 跟踪，包裹在 g 对象里携带实际属性
/* global GameState */

(function(global) {
    'use strict';

    // v3 统一架构：宝石 _resolve 委托给 window.ViewBase.resolveGem
    //   ViewBase 负责在 GameState.get("gems") + GameState.get("inventory").gems + GameState.get("heroes").equip.gems 中按 id 查找
    //   本 View 文件不再维护独立的查找循环
    function _resolve(gemOrId) {
        if (typeof ViewBase !== 'undefined' && ViewBase.resolveGem) {
            return ViewBase.resolveGem(gemOrId);
        }
        // 兜底：ViewBase 未加载时的最小实现
        if (!gemOrId) return null;
        if (typeof gemOrId === 'object') return gemOrId;
        return null;
    }

    // 从 GEM_TYPES 主源获取宝石类型元数据
    function _typeMeta(typeId) {
        if (typeof GEM_TYPES === 'undefined') return null;
        if (typeof GEM_TYPES === 'object' && GEM_TYPES[typeId]) return GEM_TYPES[typeId];
        // 数组形式
        if (Array.isArray(GEM_TYPES)) {
            for (var i = 0; i < GEM_TYPES.length; i++) {
                if (GEM_TYPES[i] && GEM_TYPES[i].id === typeId) return GEM_TYPES[i];
            }
        }
        return null;
    }

    var GemView = {
        // ---------- 主源访问 ----------

        byId: function(gemId) { return _resolve(gemId); },

        // 仓库所有宝石
        inventory: function() {
            return (gameState && Array.isArray(GameState.get("gems"))) ? GameState.get("gems") : [];
        },

        // 按类型筛选
        byType: function(typeId) {
            return this.inventory().filter(function(g) { return g && g.type === typeId; });
        },

        // 按等级筛选
        byLevel: function(lv) {
            return this.inventory().filter(function(g) { return g && g.level === lv; });
        },

        // 装备上某槽位的宝石
        onEquip: function(equipOrId, slot) {
            var eq = (typeof EquipView !== 'undefined') ? EquipView.byId(equipOrId) : null;
            if (!eq) return null;
            return (eq.gems && eq.gems[slot]) || null;
        },

        // 装备上所有宝石
        allOnEquip: function(equipOrId) {
            var eq = (typeof EquipView !== 'undefined') ? EquipView.byId(equipOrId) : null;
            if (!eq || !Array.isArray(eq.gems)) return [];
            return eq.gems.filter(function(g) { return g != null; });
        },

        // ---------- 基础属性 ----------

        // 类型名（中文）
        typeName: function(gemOrIdOrType) {
            var typeId = (typeof gemOrIdOrType === 'string' && gemOrIdOrType.length < 20) ? gemOrIdOrType : (gemOrIdOrType && gemOrIdOrType.type);
            var meta = _typeMeta(typeId);
            if (meta) return meta.name || typeId;
            return typeId || '';
        },

        // 等级
        level: function(gemOrId) {
            var g = _resolve(gemOrId);
            return g ? (g.level || 1) : 1;
        },

        // 提供的属性类型（如 'atk', 'hp_pct'）
        stat: function(gemOrId) {
            var g = _resolve(gemOrId);
            if (!g) return null;
            return g.stat || (g.stats && g.stats[0]) || null;
        },

        // 提供的属性值
        value: function(gemOrId) {
            var g = _resolve(gemOrId);
            if (!g) return 0;
            return g.value || (g.stats && g.stats[1]) || 0;
        },

        // 是否已镶嵌
        inlaid: function(gemOrId) {
            var g = _resolve(gemOrId);
            if (!g) return false;
            if (g.inlaid) return true;
            // 检查是否在装备的 gems[] 中
            if (Array.isArray(GameState.get("inventory"))) {
                for (var i = 0; i < GameState.get("inventory").length; i++) {
                    if (GameState.get("inventory")[i] && Array.isArray(GameState.get("inventory")[i].gems)) {
                        if (GameState.get("inventory")[i].gems.indexOf(g) !== -1) return true;
                    }
                }
            }
            if (Array.isArray(GameState.get("heroes"))) {
                for (var h = 0; h < GameState.get("heroes").length; h++) {
                    var hero = GameState.get("heroes")[h];
                    if (hero && hero.equip) {
                        for (var slot in hero.equip) {
                            var eq = hero.equip[slot];
                            if (eq && Array.isArray(eq.gems) && eq.gems.indexOf(g) !== -1) return true;
                        }
                    }
                }
            }
            return false;
        },

        // 镶嵌的装备 ID
        inlaidOnEquipId: function(gemOrId) {
            var g = _resolve(gemOrId);
            if (!g) return null;
            if (Array.isArray(GameState.get("inventory"))) {
                for (var i = 0; i < GameState.get("inventory").length; i++) {
                    if (GameState.get("inventory")[i] && Array.isArray(GameState.get("inventory")[i].gems)) {
                        if (GameState.get("inventory")[i].gems.indexOf(g) !== -1) return GameState.get("inventory")[i].id;
                    }
                }
            }
            if (Array.isArray(GameState.get("heroes"))) {
                for (var h = 0; h < GameState.get("heroes").length; h++) {
                    var hero = GameState.get("heroes")[h];
                    if (hero && hero.equip) {
                        for (var slot in hero.equip) {
                            var eq = hero.equip[slot];
                            if (eq && Array.isArray(eq.gems) && eq.gems.indexOf(g) !== -1) return eq.id;
                        }
                    }
                }
            }
            return null;
        },

        // ---------- 修改操作（带 UI 刷新）----------

        // 镶嵌到装备
        inlay: function(gemOrId, equipOrId, slot) {
            var g = _resolve(gemOrId);
            var eq = (typeof EquipView !== 'undefined') ? EquipView.byId(equipOrId) : null;
            if (!g || !eq) return false;
            if (this.inlaid(g)) return false;  // 已镶嵌
            if (!Array.isArray(eq.gems)) eq.gems = [];
            if (eq.gems[slot]) return false;  // 槽位已占
            eq.gems[slot] = g;
            g.inlaid = true;
            if (typeof HeroView !== 'undefined') HeroView.notifyChanged();
            return true;
        },

        // 卸下宝石
        remove: function(gemOrId) {
            var g = _resolve(gemOrId);
            if (!g) return false;
            // 从所有装备的 gems[] 中移除
            var found = false;
            var searchFn = function(eq) {
                if (!eq || !Array.isArray(eq.gems)) return;
                for (var s = 0; s < eq.gems.length; s++) {
                    if (eq.gems[s] === g) { eq.gems[s] = null; found = true; }
                }
            };
            if (Array.isArray(GameState.get("inventory"))) {
                for (var i = 0; i < GameState.get("inventory").length; i++) searchFn(GameState.get("inventory")[i]);
            }
            if (Array.isArray(GameState.get("heroes"))) {
                for (var h = 0; h < GameState.get("heroes").length; h++) {
                    var hero = GameState.get("heroes")[h];
                    if (hero && hero.equip) {
                        for (var slot in hero.equip) searchFn(hero.equip[slot]);
                    }
                }
            }
            if (found) {
                g.inlaid = false;
                if (typeof HeroView !== 'undefined') HeroView.notifyChanged();
            }
            return found;
        },

        // 3 合 1 合成
        synthesize: function(gemOrId) {
            var g = _resolve(gemOrId);
            if (!g) return null;
            var sameType = this.byType(g.type).filter(function(x) {
                return x && x.level === g.level && !GemView.inlaid(x) && x !== g;
            });
            if (sameType.length < 2) return null;  // 不足 3 个
            // 移除 3 个，生成 1 个高等级的
            var gemsArr = GameState.get("gems");
            for (var i = 0; i < sameType.length && i < 2; i++) {
                var idx = gemsArr.indexOf(sameType[i]);
                if (idx !== -1) gemsArr.splice(idx, 1);
            }
            var myIdx = gemsArr.indexOf(g);
            if (myIdx !== -1) gemsArr.splice(myIdx, 1);
            // 创建新高等级宝石（递归通过 createGem 或类似函数）
            var newGem = null;
            if (typeof createGem === 'function') {
                newGem = createGem(g.type, (g.level || 1) + 1);
            } else if (typeof window.createGem === 'function') {
                newGem = window.createGem(g.type, (g.level || 1) + 1);
            } else {
                newGem = { id: 'gem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), type: g.type, level: (g.level || 1) + 1, stat: g.stat, value: g.value };
            }
            if (newGem && Array.isArray(gemsArr)) gemsArr.push(newGem);
            if (typeof HeroView !== 'undefined') HeroView.notifyChanged();
            return newGem;
        }
    };

    global.GemView = GemView;
})(typeof window !== 'undefined' ? window : this);