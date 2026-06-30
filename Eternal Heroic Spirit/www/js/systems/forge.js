// ========== 装备宝石工坊/分解系统 ==========
/* global GameState */

// 分解装备 - 返回材料
function decomposeEquip(equip) {
    var quality = equip.quality;
    // v3.x 平衡调整：分解粉尘查表，让中低品质的粉尘产出大幅提升
    //   目的：给白/绿/蓝装备提供"分解 vs 一键卖"的决策空间，避免中后期全部沦为废品
    //   旧公式：dustBase = (quality+1) * 5  → 白 5-10 / 绿 10-20 / 蓝 15-30
    //   新公式（查表）   → 白 10-20 / 绿 18-36 / 蓝 30-60 / 紫 50-100 / 橙 75-150 / 金 110-220
    var DUST_BASE_TABLE = [10, 18, 30, 50, 75, 110];
    var dustBase = (quality >= 0 && quality < DUST_BASE_TABLE.length)
        ? DUST_BASE_TABLE[quality]
        : (quality + 1) * 5;
    var dust = dustBase + randInt(0, dustBase);
    // 重铸石（紫色品质以上固定产出: 紫1 橙3 金5）
    var reforgestone = 0;
    if (quality >= QUALITY.MIRACLE) {
        reforgestone = 1 + (quality - 3) * 2;
    }
    return { dust: dust, reforgestone: reforgestone };
}

// 重铸装备（重新生成附属词条，支持锁定部分词条）
function reforgeEquip(equip, lockedIndices) {
    if (!equip || equip.affixes.length === 0) return null;
    lockedIndices = lockedIndices || [];

    var newAffixes = [];
    var availableAffixes = AFFIX_POOL.slice();
    var usedIds = [];
    var maxAffixes = equip.affixes.length;

    // 先保留锁定的词条
    var lockedAffixes = [];
    for (var i = 0; i < equip.affixes.length; i++) {
        if (lockedIndices.indexOf(i) !== -1) {
            lockedAffixes.push({
                index: i,
                affix: equip.affixes[i]
            });
            usedIds.push(equip.affixes[i].id);
        }
    }

    // 重新生成未锁定的词条
    for (var i = 0; i < maxAffixes; i++) {
        // 如果是锁定词条，直接保留
        var locked = false;
        for (var li = 0; li < lockedAffixes.length; li++) {
            if (lockedAffixes[li].index === i) {
                newAffixes.push(lockedAffixes[li].affix);
                locked = true;
                break;
            }
        }
        if (locked) continue;

        // 未锁定词条重新随机
        //   v2.6.2 BUG 修复: 之前用 usedIds.includes 排除已用 ID,
        //   当 AFFIX_POOL 词条 ID 数 < maxAffixes 时,candidates 会先变空,直接 break,
        //   导致重铸后词条数量从 N 变成 < N
        //   修复: pool 用尽时 fallback 到完整 AFFIX_POOL (允许重复 stat, 但保词条数)
        var candidates = availableAffixes.filter(function(a) { return usedIds.indexOf(a.id) === -1; });
        if (candidates.length === 0) {
            // pool 用尽 → fallback 到全池(允许 stat 重复,但保证词条数不变)
            candidates = AFFIX_POOL.slice();
        }
        var affix = weightedPick(candidates);
        usedIds.push(affix.id);
        // 词条品质受装备品质影响
        var affixQuality = rollAffixQuality(equip.quality);
        // ★ v2.6.4 Round 9.2 修复: 词条数值随装备等级缩放
        //   旧 0.7 + 0.3*level: LV37 = 11.8x, LV50 = 15.7x, LV100 = 30.7x → 乘法爆炸
        //   新 1 + (level-1) * 0.02: LV37 = 1.72x, LV50 = 1.98x, LV100 = 2.98x
        //   与 battle.js:609 的 levelMult 保持一致 (生成端/应用端统一)
        var baseVal = randInt(affix.min[affixQuality], affix.max[affixQuality]);
        var val = Math.floor(baseVal * (1 + ((equip.level || 1) - 1) * 0.02));
        newAffixes.push({
            id: affix.id,
            name: affix.name,
            value: val,
            stat: affix.stat,
            type: affix.type,
            affixQuality: affixQuality
        });
    }

    equip.affixes = newAffixes;
    equip.score = calcEquipScore(equip);
    return equip;
}

// 套装效果定义 (v5 — 5套全新装备套装, 2pc/4pc 机制)
//   每套提供独特的战斗效果和视觉粒子
var SET_DATA = {
    // ===== 1. 龙鳞套 (Dragon Scale) — 坦克套 =====
    //    2pc: +10% DEF
    //    4pc: 被击时25%概率反弹30%伤害 (红色反弹粒子)
    dragon_set: {
        id: 'dragon_set',
        name: '龙鳞套',
        pieces: 4,
        desc: '2件: 防御+10% | 4件: 被击时25%概率反弹30%伤害',
        bonus2: { defBonus: 0.10 },
        bonus4: { reflectChance: 0.25, reflectPct: 0.30, effect: 'dragon_reflect' }
    },
    // ===== 2. 星辰套 (Star Set) — 法系套 =====
    //    2pc: +10% ATK
    //    4pc: 击杀恢复15% MP + 蓝色火花粒子
    star_set: {
        id: 'star_set',
        name: '星辰套',
        pieces: 4,
        desc: '2件: 攻击+10% | 4件: 击杀时恢复15%法力',
        bonus2: { atkBonus: 0.10 },
        bonus4: { killManaPct: 0.15, effect: 'star_kill_mana' }
    },
    // ===== 3. 暗影套 (Shadow Set) — 刺客套 =====
    //    2pc: +8% CRIT rate
    //    4pc: 暴击标记目标, 下次命中额外50%伤害 (紫色标记追击)
    shadow_assassin_set: {
        id: 'shadow_assassin_set',
        name: '暗影套',
        pieces: 4,
        desc: '2件: 暴击率+8% | 4件: 暴击标记目标,下次攻击追击额外50%伤害',
        bonus2: { critBonus: 8 },
        bonus4: { markBonusDmg: 0.50, effect: 'shadow_mark' }
    },
    // ===== 4. 圣光套 (Holy Set) — 奶妈套 =====
    //    2pc: +15% healing
    //    4pc: 每10秒给全队施加=5%最大HP的护盾 (金色护盾)
    holy_set: {
        id: 'holy_set',
        name: '圣光套',
        pieces: 4,
        desc: '2件: 治疗+15% | 4件: 每10秒全队获得5%最大生命护盾',
        bonus2: { healBonus: 15 },
        bonus4: { shieldPct: 0.05, interval: 10000, effect: 'holy_shield' }
    },
    // ===== 5. 狂战套 (Berserker Set) — 战士套 =====
    //    2pc: +15% HP
    //    4pc: HP<30%时, 伤害+40%持续5秒 (红色狂暴)
    berserker_set: {
        id: 'berserker_set',
        name: '狂战套',
        pieces: 4,
        desc: '2件: 生命+15% | 4件: HP低于30%时伤害+40%,持续5秒',
        bonus2: { hpBonus: 0.15 },
        bonus4: { berserkHpPct: 0.30, berserkDmgBonus: 0.40, berserkDuration: 5000, effect: 'berserker_rage' }
    }
};

// 给装备随机分配套装
function assignRandomSet(equip) {
    if (chance(0.15)) {
        var setKeys = Object.keys(SET_DATA);
        equip.setId = randPick(setKeys);
    }
    return equip;
}

// ====================================================================
// 统一分解入口（v2.1.0+ 双轨并行新增）
//   替代 forgeUI.decomposeEquipById / inventoryUI.decomposeItem 两份重复实现
//   业务方应逐步迁移到本函数
//
//   参数：
//     equipId - 装备 id
//     options - 可选配置：
//       skipLocked : true  = 检查 locked 状态，锁定则跳过 (inventoryUI 行为，默认)
//                   false = 不检查 locked，强制分解     (forgeUI 行为)
//
//   副作用：删除装备、入账粉尘/重铸石、刷新所有相关 UI
//   返回：{ dust, reforgestone } | null（未找到/已上锁）
// ====================================================================
function decomposeInventoryItem(equipId, options) {
    if (!equipId) return null;
    options = options || {};
    var skipLocked = options.skipLocked !== false; // 默认 true
    var inv = GameState.get('inventory') || [];
    var idx = -1;
    for (var i = 0; i < inv.length; i++) {
        if (inv[i] && inv[i].id === equipId) { idx = i; break; }
    }
    if (idx === -1) return null;
    var eq = inv[idx];
    if (skipLocked && eq.locked) {
        if (typeof showToast === 'function') showToast('🔒 装备已上锁，请先解锁', 'warning');
        return null;
    }
    var mats = decomposeEquip(eq);
    GameState.mutate('inventory', function(invArr) { invArr.splice(idx, 1); return invArr; });
    GameState.mutate('forgeDust', function(v) { return (v || 0) + mats.dust; });
    GameState.mutate('reforgestone', function(v) { return (v || 0) + mats.reforgestone; });
    if (typeof showToast === 'function') {
        showToast('分解获得: 粉尘x' + mats.dust + (mats.reforgestone > 0 ? ', 重铸石x' + mats.reforgestone : ''), 'success');
    }
    // 统一刷新所有相关 UI
    if (typeof refreshInventoryUI === 'function') refreshInventoryUI();
    if (typeof refreshForgeUI === 'function') refreshForgeUI();
    if (typeof updateResources === 'function') updateResources();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
    return mats;
}

// ====================================================================
// 装备强化系统（v4.x 新增）
//   - 强化等级 0-15
//   - 消耗金币, 失败不掉级/不碎装备（玩家友好）
//   - 每级 +5% 基础属性
// ====================================================================

var MAX_ENHANCE_LEVEL = 15;

// 获取强化消耗金币
//   formula: 500 × (level + 1) × (level + 2) × (1 + Math.floor(level / 5))
//   Lv0→1: 1000, Lv5→6: 31500, Lv10→11: 198000, Lv14→15: 720000
function getEnhanceCost(level) {
    var base = 500 * (level + 1) * (level + 2);
    var tierMult = 1 + Math.floor(level / 5);
    return base * tierMult;
}

// 获取强化成功率（0-1）
function getEnhanceSuccessRate(level) {
    // 0-5: 100%, 6-10: 90%, 11-13: 75%, 14-15: 50%
    if (level <= 5) return 1.0;
    if (level <= 10) return 0.9;
    if (level <= 13) return 0.75;
    return 0.5;
}

// 获取装备当前强化等级 (初始化为0)
// ★ v5.0 槽位强化: 装备等级已废弃, 使用槽位等级
//   保留旧函数作为向后兼容包装
function getEquipEnhanceLevel(equipId) {
    var levels = GameState.get('equipLevels') || {};
    return levels[equipId] || 0;
}

// 设置装备强化等级 (旧版 — 保留向后兼容)
function setEquipEnhanceLevel(equipId, level) {
    GameState.mutate('equipLevels', function(levels) {
        if (!levels) levels = {};
        levels[equipId] = Math.min(level, MAX_ENHANCE_LEVEL);
        return levels;
    });
}

// ===== v5.0 槽位强化系统 =====
// 获取槽位强化等级 (heroId + slotId)
function getSlotEnhanceLevel(heroId, slotId) {
    var slotLevels = GameState.get('slotLevels') || {};
    var heroLevels = slotLevels[heroId] || {};
    return heroLevels[slotId] || 0;
}

// 设置槽位强化等级
function setSlotEnhanceLevel(heroId, slotId, level) {
    GameState.mutate('slotLevels', function(slotLevels) {
        if (!slotLevels) slotLevels = {};
        if (!slotLevels[heroId]) slotLevels[heroId] = {};
        slotLevels[heroId][slotId] = Math.min(level, MAX_ENHANCE_LEVEL);
        return slotLevels;
    });
}

// 尝试强化槽位 (v5.0)
//   返回: { success: bool, newLevel: number, cost: number }
function enhanceSlot(heroId, slotId) {
    var currentLevel = getSlotEnhanceLevel(heroId, slotId);
    if (currentLevel >= MAX_ENHANCE_LEVEL) {
        return { success: false, newLevel: currentLevel, cost: 0, reason: '已达最高等级' };
    }

    var cost = getEnhanceCost(currentLevel);
    if ((GameState.get('gold') || 0) < cost) {
        return { success: false, newLevel: currentLevel, cost: cost, reason: '金币不足' };
    }

    var rate = getEnhanceSuccessRate(currentLevel);
    var success = Math.random() < rate;

    // 扣除金币（无论成败）
    GameState.mutate('gold', function(v) { return (v || 0) - cost; });

    var newLevel = currentLevel;
    if (success) {
        newLevel = currentLevel + 1;
        setSlotEnhanceLevel(heroId, slotId, newLevel);
    }

    // 刷新资源显示
    if (typeof updateResources === 'function') updateResources();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();

    return {
        success: success,
        newLevel: newLevel,
        cost: cost,
        rate: rate
    };
}

// 尝试强化装备 (保留旧名称作为向后兼容包装)
function enhanceEquip(equipId) {
    // 旧版按 equipId 调用 — 尝试找到这个装备所属的英雄
    // 如果找不到, 返回失败
    var heroFound = null;
    var slotFound = null;
    var heroes = GameState.get('heroes') || [];
    if (heroes.length) {
        for (var hi = 0; hi < heroes.length; hi++) {
            var h = heroes[hi];
            if (!h.equip) continue;
            for (var s in h.equip) {
                if (h.equip[s] && h.equip[s].id === equipId) {
                    heroFound = h;
                    slotFound = s;
                    break;
                }
            }
            if (heroFound) break;
        }
    }
    if (heroFound && slotFound) {
        return enhanceSlot(heroFound.id, slotFound);
    }
    // fallback: 找不到装备所属英雄时使用旧系统 (向后兼容)
    var currentLevel = getEquipEnhanceLevel(equipId);
    if (currentLevel >= MAX_ENHANCE_LEVEL) {
        return { success: false, newLevel: currentLevel, cost: 0, reason: '已达最高等级' };
    }
    var cost = getEnhanceCost(currentLevel);
    if ((GameState.get('gold') || 0) < cost) {
        return { success: false, newLevel: currentLevel, cost: cost, reason: '金币不足' };
    }
    var rate = getEnhanceSuccessRate(currentLevel);
    var success = Math.random() < rate;
    GameState.mutate('gold', function(v) { return (v || 0) - cost; });
    var newLevel = currentLevel;
    if (success) {
        newLevel = currentLevel + 1;
        setEquipEnhanceLevel(equipId, newLevel);
    }
    if (typeof updateResources === 'function') updateResources();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
    return { success: success, newLevel: newLevel, cost: cost, rate: rate };
}

// 应用强化加成到基础属性
//   stats: { atk, def, hp, spd, ... } 对象
//   level: 强化等级 (0-15)
//   每级 +5% = 乘数 (1 + level * 0.05)
function getEnhancedStats(stats, level) {
    if (!level || level <= 0) return stats;
    var multiplier = 1 + level * 0.05;
    var result = {};
    for (var key in stats) {
        if (stats.hasOwnProperty(key)) {
            result[key] = Math.floor(stats[key] * multiplier);
        }
    }
    return result;
}

// 获取强化等级对应星级显示的 HTML（★ 实心 / ☆ 空心）
function getEnhanceStarsHtml(level) {
    if (!level || level <= 0) return '';
    var filled = Math.min(level, 15);
    var empty = 15 - filled;
    var h = '';
    for (var i = 0; i < filled; i++) h += '★';
    for (var i = 0; i < empty; i++) h += '☆';
    return h;
}

// ====================================================================
// 装备升阶融合系统（v4.x 新增）
//   3 件同品质装备 → 1 件下一品质装备
//   消耗金币（按品质递增）
// ====================================================================

// 融合消耗金币公式
//   白→绿: 2000, 绿→蓝: 5000, 蓝→紫: 15000, 紫→橙: 30000, 橙→金: 100000
function getFusionCost(quality) {
    var costs = [2000, 5000, 15000, 30000, 100000];
    return (quality >= 0 && quality < costs.length) ? costs[quality] : 999999;
}

// 融合所需升级石数量
//   白→绿: 0, 绿→蓝: 2, 蓝→紫: 5, 紫→橙: 10, 橙→金: 20
function getFusionUpgradeStoneCost(quality) {
    var stones = [0, 2, 5, 10, 20];
    return (quality >= 0 && quality < stones.length) ? stones[quality] : 999;
}

// 检查 3 件装备是否可融合（同品质、未上锁、存在）
//   equipIds: 装备 ID 数组（长度为 3）
//   返回: { ok: bool, reason: string }
function canFuseEquipments(equipIds) {
    if (!equipIds || equipIds.length !== 3) {
        return { ok: false, reason: '需要选择 3 件装备' };
    }
    var inv = GameState.get('inventory') || [];
    var eqs = [];
    for (var i = 0; i < equipIds.length; i++) {
        var id = equipIds[i];
        if (!id) return { ok: false, reason: '装备槽位未填满' };
        var found = null;
        for (var j = 0; j < inv.length; j++) {
            if (inv[j] && inv[j].id === id) { found = inv[j]; break; }
        }
        if (!found) return { ok: false, reason: '装备 #' + (i+1) + ' 不存在' };
        if (found.locked) return { ok: false, reason: '装备 "' + found.name + '" 已上锁，请先解锁' };
        eqs.push(found);
    }

    // 检查同品质
    var q = eqs[0].quality;
    for (var k = 1; k < eqs.length; k++) {
        if (eqs[k].quality !== q) {
            return { ok: false, reason: '装备品质必须相同' };
        }
    }

    // 检查最高品质（金色不可再融合）
    var maxQuality = (typeof QUALITY !== 'undefined' && QUALITY.IMMORTAL !== undefined) ? QUALITY.IMMORTAL : 5;
    if (q >= maxQuality) {
        return { ok: false, reason: '金色（最高品质）装备无法继续升阶' };
    }

    // 检查金币
    var cost = getFusionCost(q);
    if ((GameState.get('gold') || 0) < cost) {
        return { ok: false, reason: '金币不足，需要 ' + cost + ' G' };
    }

    // 检查升级石（紫→橙需1个，橙→金需3个）
    var stoneCost = getFusionUpgradeStoneCost(q);
    if (stoneCost > 0 && (GameState.get('upgradeStone') || 0) < stoneCost) {
        return { ok: false, reason: '升级石不足，需要 ' + stoneCost + ' 个升级石' };
    }

    return { ok: true, reason: '', cost: cost, stoneCost: stoneCost, equipments: eqs };
}

// 执行装备融合
//   equipIds: 装备 ID 数组（长度为 3）
//   返回: { success: bool, newEquip: object|null, reason: string }
function doFuseEquipments(equipIds) {
    if (typeof _checkInBattle === 'function' && !_checkInBattle('装备融合')) {
        return { success: false, newEquip: null, reason: '战斗中无法融合' };
    }

    var check = canFuseEquipments(equipIds);
    if (!check.ok) {
        return { success: false, newEquip: null, reason: check.reason };
    }

    var eqs = check.equipments;
    var cost = check.cost;
    var stoneCost = check.stoneCost || 0;
    var sourceQuality = eqs[0].quality;
    var newQuality = sourceQuality + 1;

    // 扣除金币
    GameState.mutate('gold', function(v) { return (v || 0) - cost; });

    // 扣除升级石
    if (stoneCost > 0) {
        GameState.mutate('upgradeStone', function(v) { return (v || 0) - stoneCost; });
    }

    GameState.mutate('inventory', function(invArr) {
        for (var i = 0; i < equipIds.length; i++) {
            for (var j = invArr.length - 1; j >= 0; j--) {
                if (invArr[j] && invArr[j].id === equipIds[i]) {
                    invArr.splice(j, 1);
                    break;
                }
            }
        }
        return invArr;
    });

    // 随机选一个装备部位生成新装备
    var slot = null;
    if (typeof EQUIP_SLOTS !== 'undefined' && EQUIP_SLOTS.length > 0) {
        slot = randPick(EQUIP_SLOTS);
    }
    var slotId = slot ? slot.id : 'weapon';
    var level = Math.max(1, Math.floor((eqs[0].level || 1) * 1.1)); // 等级略微提升

    var newEquip = null;
    if (typeof createEquipInstance === 'function') {
        newEquip = createEquipInstance(slotId, newQuality, level);
    }
    if (!newEquip) {
        return { success: false, newEquip: null, reason: '装备生成失败' };
    }

    // 入库
    if (typeof addToInventory === 'function') {
        addToInventory(newEquip);
    } else {
        GameState.mutate('inventory', function(invArr) {
            if (!invArr) invArr = [];
            invArr.push(newEquip);
            return invArr;
        });
    }

    // 刷新 UI
    if (typeof updateResources === 'function') updateResources();
    if (typeof refreshInventoryUI === 'function') refreshInventoryUI();
    if (typeof refreshForgeUI === 'function') refreshForgeUI();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();

    return { success: true, newEquip: newEquip, reason: '' };
}
