// ========== 抽奖系统 ==========
// v6.2 副本抽奖，由抽奖石消耗驱动
// 普通抽奖：1 抽奖石/次
// 高级抽奖：10 抽奖石/次
// 都有"单抽"和"十连抽"
// 概率（用户决策）：
//   普通: 白 50% / 绿 30% / 蓝 15% / 紫 4% / 橙 1%
//   高级: 蓝 5% / 紫 40% / 橙 40% / 金 15%
// 十连保底：普通十连 ≥1 紫 / 高级十连 ≥1 橙
/* global GameState */

// 单抽一次（内部用，不带保底）
//   返回 { tier, equip, gold, reforgestone, gem }
function rollLotteryOnce(tierType) {
    var cfg = LOTTERY_CONFIG[tierType];
    if (!cfg) return null;
    var r = Math.random();
    var cumulative = 0;
    var pickedTier = cfg.equipTierRates[cfg.equipTierRates.length - 1]; // fallback
    for (var i = 0; i < cfg.equipTierRates.length; i++) {
        cumulative += cfg.equipTierRates[i].rate;
        if (r < cumulative) {
            pickedTier = cfg.equipTierRates[i];
            break;
        }
    }
    // 随机选一个装备槽
    var slots = (typeof EQUIP_SLOTS !== 'undefined' && EQUIP_SLOTS) ?
        EQUIP_SLOTS.map(function(s) { return s.id; }) :
        ['weapon', 'offhand', 'helm', 'armor', 'boots'];
    var slotId = slots[Math.floor(Math.random() * slots.length)];
    // 装备等级（按 tier 区间随机）
    var eqLevel = Math.floor(Math.random() * (pickedTier.maxEquipLevel - pickedTier.minEquipLevel + 1)) + pickedTier.minEquipLevel;
    // 生成装备实例
    var equip = null;
    if (typeof createEquipInstance === 'function') {
        equip = createEquipInstance(slotId, pickedTier.tier, eqLevel);
    }
    // 附加奖励
    var bonus = cfg.bonusReward;
    var gold = Math.floor(Math.random() * (bonus.goldMax - bonus.goldMin + 1)) + bonus.goldMin;
    var stone = Math.floor(Math.random() * (bonus.stoneMax - bonus.stoneMin + 1)) + bonus.stoneMin;
    var gem = null;
    if (bonus.gemChance && Math.random() < bonus.gemChance) {
        gem = { level: bonus.gemLevel || 3, count: 1 };
    }
    return {
        tier: pickedTier.tier,
        tierName: pickedTier.name,
        equip: equip,
        gold: gold,
        reforgestone: stone,
        gem: gem
    };
}

// 执行单抽（type: 'normal' / 'advanced'）
//   返回 { ok, cost, results: [{tier, equip, gold, ...}], bonus: {gold, reforgestone, gem} }
function doLottery(tierType, isTenDraw) {
    var cfg = LOTTERY_CONFIG[tierType];
    if (!cfg) return { ok: false, reason: 'invalid_type' };
    if (!GameState.getAll()) return { ok: false, reason: 'no_gamestate' };

    var cost = isTenDraw ? cfg.costPerTenDraw : cfg.costPerDraw;
    var drawCount = isTenDraw ? 10 : 1;

    // 检查抽奖石
    if ((GameState.get('lotteryStone') || 0) < cost) {
        return { ok: false, reason: 'not_enough_stone', need: cost, have: GameState.get('lotteryStone') || 0 };
    }

    // 扣费
    GameState.mutate('lotteryStone', function(v) { return (v || 0) - cost; });

    // 抽 N 次
    var results = [];
    for (var i = 0; i < drawCount; i++) {
        results.push(rollLotteryOnce(tierType));
    }

    // 十连抽保底：检查是否至少 1 个 pityTier
    if (isTenDraw) {
        var hasPity = results.some(function(r) { return r.tier >= cfg.pityTier; });
        if (!hasPity) {
            // 把最后一次结果替换为 pityTier 的随机品质（直接构造一个）
            var slots = (typeof EQUIP_SLOTS !== 'undefined' && EQUIP_SLOTS) ?
                EQUIP_SLOTS.map(function(s) { return s.id; }) :
                ['weapon', 'offhand', 'helm', 'armor', 'boots'];
            var slotId = slots[Math.floor(Math.random() * slots.length)];
            var pityTierCfg=null;var _es5_33=cfg.equipTierRates;for(var _es5_34=0;_es5_34<_es5_33.length;_es5_34++){if(_es5_33[_es5_34].tier === cfg.pityTier){pityTierCfg=_es5_33[_es5_34];break;}};
            if (pityTierCfg && typeof createEquipInstance === 'function') {
                var eqLvl = Math.floor(Math.random() * (pityTierCfg.maxEquipLevel - pityTierCfg.minEquipLevel + 1)) + pityTierCfg.minEquipLevel;
                results[results.length - 1] = {
                    tier: pityTierCfg.tier,
                    tierName: pityTierCfg.name,
                    equip: createEquipInstance(slotId, pityTierCfg.tier, eqLvl),
                    gold: 0, reforgestone: 0, gem: null,
                    isPity: true
                };
            }
        }
    }

    // 累加附加奖励（金币/重铸石/宝石）
    var totalGold = 0, totalStone = 0;
    var gems = [];
    for (var j = 0; j < results.length; j++) {
        var r = results[j];
        totalGold += r.gold || 0;
        totalStone += r.reforgestone || 0;
        if (r.gem) gems.push(r.gem);
    }
    if (totalGold > 0) GameState.mutate('gold', function(v) { return (v || 0) + totalGold; });
    if (totalStone > 0) GameState.mutate('reforgestone', function(v) { return (v || 0) + totalStone; });

    // 装备入背包
    for (var k = 0; k < results.length; k++) {
        if (results[k].equip) {
            GameState.mutate('inventory', function(arr) {
                if (!Array.isArray(arr)) arr = [];
                arr.push(results[k].equip);
                return arr;
            });
        }
    }

    // 宝石入仓库(随机选个 GEM_TYPES)
    for (var g = 0; g < gems.length; g++) {
        if (typeof addGemToInventory === 'function' && typeof GEM_TYPES !== 'undefined' && GEM_TYPES.length) {
            var lgt = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
            addGemToInventory({ gemTypeId: lgt.id, level: gems[g].level });
        }
    }

    // 记录历史
    var history = GameState.get('lotteryHistory');
    if (!Array.isArray(history)) history = [];
    for (var h = 0; h < results.length; h++) {
        var rec = results[h];
        if (rec.equip) {
            history.unshift({
                timestamp: Date.now(),
                type: tierType,
                tier: rec.tier,
                tierName: rec.tierName,
                equipName: rec.equip.name,
                equipSlot: rec.equip.slot,
                isPity: !!rec.isPity
            });
        }
    }
    // 限制历史长度
    if (history.length > (typeof LOTTERY_HISTORY_MAX !== 'undefined' ? LOTTERY_HISTORY_MAX : 50)) {
        history = history.slice(0, LOTTERY_HISTORY_MAX);
    }
    GameState.set('lotteryHistory', history);

    return {
        ok: true,
        cost: cost,
        type: tierType,
        isTenDraw: !!isTenDraw,
        results: results,
        totalGold: totalGold,
        totalStone: totalStone,
        gems: gems
    };
}
