// ========== 装备属性视图层 (ES5) ==========
// 解决问题：装备在 hero.equip / 仓库 inventory / 角色选择 selected 之间存在多份引用
// 设计原则：装备实例都是对象（带唯一 id 或 templateId），通过引用直接读取，不重复拷贝
/* global GameState */

(function(global) {
    'use strict';

    // v3 统一架构：装备 _resolve 委托给 window.ViewBase.resolveEquip
    //   ViewBase 负责在 GameState.get("inventory") + GameState.get("heroes").equip 中按 id 查找
    //   本 View 文件不再维护独立的查找循环
    function _resolve(equipOrId) {
        if (typeof ViewBase !== 'undefined' && ViewBase.resolveEquip) {
            return ViewBase.resolveEquip(equipOrId);
        }
        // 兜底：ViewBase 未加载时的最小实现
        if (!equipOrId) return null;
        if (typeof equipOrId === 'object') return equipOrId;
        return null;
    }

    var QUALITY_NAMES = {
        1: '普通', 2: '优秀', 3: '稀有', 4: '史诗', 5: '传说', 6: '神话'
    };
    var QUALITY_COLORS = {
        1: '#9e9e9e', 2: '#4caf50', 3: '#9c27b0',
        4: '#ff9800', 5: '#ffd700', 6: '#f44336'
    };
    var SLOT_NAMES = {
        weapon: '武器', offhand: '副手', helmet: '头盔',
        armor: '护甲', belt: '腰带', legs: '护腿',
        boots: '鞋子', ring: '戒指', amulet: '项链'
    };

    var EquipView = {
        // ---------- 主源访问 ----------

        // 通过 id 找装备（搜索仓库 + 所有英雄穿戴）
        byId: function(equipId) { return _resolve(equipId); },

        // 英雄穿戴中某槽位的装备
        onHero: function(heroOrId, slot) {
            var hero = (typeof HeroView !== 'undefined') ? HeroView.byId(heroOrId) : null;
            if (!hero || !hero.equip) return null;
            return hero.equip[slot] || null;
        },

        // 全部穿戴中装备（数组形式）
        allWorn: function(heroOrId) {
            var hero = (typeof HeroView !== 'undefined') ? HeroView.byId(heroOrId) : null;
            if (!hero || !hero.equip) return [];
            var result = [];
            for (var slot in hero.equip) {
                if (hero.equip[slot]) result.push({ slot: slot, equip: hero.equip[slot] });
            }
            return result;
        },

        // 仓库全部装备
        inventory: function() {
            return (gameState && Array.isArray(GameState.get("inventory"))) ? GameState.get("inventory") : [];
        },

        // 按品质筛选
        byQuality: function(q) {
            return this.inventory().filter(function(eq) { return eq && eq.quality === q; });
        },

        // 按槽位筛选
        bySlot: function(slot) {
            return this.inventory().filter(function(eq) { return eq && eq.slot === slot; });
        },

        // 按职业筛选（防具可用职业）
        forClass: function(classId) {
            if (typeof getArmorCompatibleClasses === 'function') {
                return this.inventory().filter(function(eq) {
                    if (!eq) return false;
                    if (!eq.slot || ['weapon', 'offhand'].indexOf(eq.slot) !== -1) {
                        return eq.classId === classId;  // 武器/副手按职业
                    }
                    // 防具按兼容职业
                    var compat = getArmorCompatibleClasses(eq);
                    return compat && compat.indexOf(classId) !== -1;
                });
            }
            return this.inventory();
        },

        // ---------- 基础属性 ----------

        // 装备名称
        name: function(equipOrId) {
            var eq = _resolve(equipOrId);
            return eq ? (eq.name || '未知道装备') : '';
        },

        // 品质名称
        qualityName: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return '';
            return (typeof getQualityName === 'function') ? getQualityName(eq.quality) : (QUALITY_NAMES[eq.quality] || '普通');
        },

        // 品质颜色
        qualityColor: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return '#999';
            return (typeof getQualityColor === 'function') ? getQualityColor(eq.quality) : (QUALITY_COLORS[eq.quality] || '#999');
        },

        // 槽位中文名
        slotName: function(equipOrSlot) {
            var slot = equipOrSlot;
            if (typeof equipOrSlot === 'object' && equipOrSlot) slot = equipOrSlot.slot;
            return SLOT_NAMES[slot] || slot || '';
        },

        // 装备等级
        level: function(equipOrId) {
            var eq = _resolve(equipOrId);
            return eq ? (eq.level || 1) : 1;
        },

        // 装备评分
        score: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return 0;
            if (eq.score != null) return eq.score;
            if (typeof calcEquipScore === 'function') {
                try { return calcEquipScore(eq); } catch(e) { return 0; }
            }
            return 0;
        },

        // 装备售价/价值
        value: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return 0;
            if (eq.value != null) return eq.value;
            if (typeof calcEquipValue === 'function') {
                try { return calcEquipValue(eq); } catch(e) { return 0; }
            }
            return 0;
        },

        // 词条列表
        affixes: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return [];
            return Array.isArray(eq.affixes) ? eq.affixes : [];
        },

        // 镶嵌宝石列表
        gems: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return [];
            return Array.isArray(eq.gems) ? eq.gems : [];
        },

        // 装备是否被收藏/加锁
        isLocked: function(equipOrId) {
            var eq = _resolve(equipOrId);
            return eq ? !!eq.locked : false;
        },

        isFavorite: function(equipOrId) {
            var eq = _resolve(equipOrId);
            return eq ? !!eq.favorite : false;
        },

        // 装备战力贡献（含宝石加成）
        powerContribution: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return 0;
            if (typeof calcEquipScore === 'function') {
                try { return calcEquipScore(eq); } catch(e) { return 0; }
            }
            return 0;
        },

        // 英雄所有穿戴装备的总战力
        totalPowerForHero: function(heroOrId) {
            var worn = this.allWorn(heroOrId);
            var total = 0;
            for (var i = 0; i < worn.length; i++) {
                total += this.powerContribution(worn[i].equip);
            }
            return total;
        },

        // ---------- 修改操作（带 UI 刷新）----------

        // 装备（带全套 UI 刷新）
        equipTo: function(heroOrId, equipId, slot) {
            var hero = (typeof HeroView !== 'undefined') ? HeroView.byId(heroOrId) : null;
            if (!hero) return false;
            var eq = this.byId(equipId);
            if (!eq) return false;
            if (!hero.equip) hero.equip = {};
            // 卸下原装备回仓库
            var old = hero.equip[slot];
            if (old && old.id !== equipId) {
                if (Array.isArray(GameState.get("inventory"))) GameState.get("inventory").push(old);
            }
            hero.equip[slot] = eq;
            if (typeof HeroView !== 'undefined') HeroView.notifyChanged();
            return true;
        },

        // 卸下装备
        unequip: function(heroOrId, slot) {
            var hero = (typeof HeroView !== 'undefined') ? HeroView.byId(heroOrId) : null;
            if (!hero || !hero.equip) return null;
            var old = hero.equip[slot];
            if (!old) return null;
            delete hero.equip[slot];
            if (Array.isArray(GameState.get("inventory"))) GameState.get("inventory").push(old);
            if (typeof HeroView !== 'undefined') HeroView.notifyChanged();
            return old;
        },

        // 切换加锁
        toggleLock: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return false;
            eq.locked = !eq.locked;
            if (typeof refreshInventoryUI === 'function') refreshInventoryUI();
            return eq.locked;
        },

        // 切换收藏
        toggleFavorite: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return false;
            eq.favorite = !eq.favorite;
            if (typeof refreshInventoryUI === 'function') refreshInventoryUI();
            return eq.favorite;
        },

        // 分解装备（添加到粉尘）
        decompose: function(equipOrId) {
            var eq = _resolve(equipOrId);
            if (!eq) return null;
            if (eq.locked) return null;  // 加锁的不能分解
            // 从仓库中移除
            if (Array.isArray(GameState.get("inventory"))) {
                var idx = GameState.get("inventory").indexOf(eq);
                if (idx !== -1) GameState.get("inventory").splice(idx, 1);
            }
            // 从所有英雄穿戴中移除
            if (Array.isArray(GameState.get("heroes"))) {
                for (var h = 0; h < GameState.get("heroes").length; h++) {
                    var hero = GameState.get("heroes")[h];
                    if (hero && hero.equip) {
                        for (var slot in hero.equip) {
                            if (hero.equip[slot] === eq) delete hero.equip[slot];
                        }
                    }
                }
            }
            // 粉尘奖励
            var dust = (eq.quality || 1) * 5 + (eq.level || 1) * 2;
            GameState.mutate("forgeDust", function(v) { return (v||0) + dust; });
            if (typeof HeroView !== 'undefined') HeroView.notifyChanged();
            return { equip: eq, dust: dust };
        }
    };

    global.EquipView = EquipView;
})(typeof window !== 'undefined' ? window : this);