// ========== 掉落系统 ==========

// 词条品质：受装备品质影响（高品质装备出高品质词条概率更高）
function rollAffixQuality(equipQuality) {
    var r = Math.random() * 100;
    var boost = equipQuality * 2; // 白0, 绿2, 蓝4, 紫6, 橙8, 金10
    if (r < 40 - boost) return QUALITY.COMMON;
    if (r < 70 - boost * 0.6) return QUALITY.RARE;
    if (r < 88 + boost * 0.25) return QUALITY.LEGENDARY;
    if (r < 96 + boost * 0.12) return QUALITY.MIRACLE;
    if (r < 99 + boost * 0.03) return QUALITY.MYTHIC;
    return QUALITY.IMMORTAL;
}

// 生成一个装备实例
function createEquipInstance(slotId, quality, level) {
    if (!slotId || quality === undefined) return null;
    level = level || 1;
    var slot=null;var _es5_31=EQUIP_SLOTS;for(var _es5_32=0;_es5_32<_es5_31.length;_es5_32++){if(_es5_31[_es5_32].id === slotId){slot=_es5_31[_es5_32];break;}};
    if (!slot) return null;

    var maxAffixes = QUALITY_MAX_AFFIX[quality];
    var sockets = QUALITY_SOCKETS[quality];

    var eq = {
        id: 'eq_' + Date.now() + '_' + randInt(1000, 9999),
        slot: slotId,
        slotName: slot.name,
        slotIcon: slot.icon,
        name: '未知装备',
        quality: quality,
        level: level,
        weaponType: null,
        armorType: null,
        affixes: [],
        sockets: sockets,
        gems: [],
        score: 0
    };
    
    // 武器/副手分配随机类型并取对应名称
    if (slotId === 'weapon' || slotId === 'offhand') {
        var types = WEAPON_TYPES_BY_SLOT[slotId] || [];
        if (types.length > 0) {
            eq.weaponType = randPick(types);
            eq.name = getRandomWeaponName(slotId, eq.weaponType);
        } else {
            eq.weaponType = 'sword';
            eq.name = getRandomWeaponName(slotId, 'sword');
        }
    } else {
        // 防具分配随机护甲类型并取对应名称
        var armorTypes = ['heavy', 'mage', 'light', 'universal'];
        eq.armorType = randPick(armorTypes);
        eq.name = getRandomArmorName(slotId, eq.armorType);
    }

    for (var i = 0; i < maxAffixes; i++) {
        // 允许重复词条类型，直接从词条池加权抽取
        var affix = weightedPick(AFFIX_POOL);
        // 词条品质受装备品质影响（高品质装备出高品质词条概率更高）
        var affixQuality = rollAffixQuality(quality);
        var baseVal = randInt(affix.min[affixQuality], affix.max[affixQuality]);
        // ★ v2.6.4 Round 9.2 词条数值随装备等级温和缩放
        //   旧 1 + 0.04*level: LV37=2.48x, LV50=3x, LV100=5x → 与 battle.js:609 levelMult 叠加仍偏大
        //   新 1 + (level-1) * 0.02: LV37=1.72x, LV50=1.98x, LV100=2.98x
        //   与 forge.js:74 (重铸) + battle.js:609 (应用) 保持一致 — 三处统一
        var val = Math.floor(baseVal * (1 + ((level || 1) - 1) * 0.02));
        eq.affixes.push({
            id: affix.id,
            name: affix.name,
            value: val,
            stat: affix.stat,
            type: affix.type,
            affixQuality: affixQuality
        });
    }

    // ★ v5.0 Change 2: 装备获得第二个随机基础属性
    //   主属性已由 EQUIP_SLOTS.baseStat 确定，次属性从 ['hp','def','atk','spd'] 中随机选择不同的
    var primaryStat = slot.baseStat ? slot.baseStat.stat : 'atk';
    var secondaryPool = ['hp', 'def', 'atk', 'spd'];
    // 移除主属性
    var filteredPool = [];
    for (var si = 0; si < secondaryPool.length; si++) {
        if (secondaryPool[si] !== primaryStat) {
            filteredPool.push(secondaryPool[si]);
        }
    }
    var secondaryStat = randPick(filteredPool);

    // 调整主属性值（略微降低以容纳副属性）
    // 旧的主属性值通过 getEquipBaseStat 计算: basePerLvl * level * qMult
    // 主属性保留 70%，副属性给 ~70% 的另一种属性的等效比例
    var qMult2 = getQualityMultiplier();
    var qm = qMult2[quality] || 1.0;
    var slotData = null;
    for (var edi = 0; edi < EQUIP_SLOTS.length; edi++) {
        if (EQUIP_SLOTS[edi].id === slotId) { slotData = EQUIP_SLOTS[edi]; break; }
    }
    var primaryValue = 0;
    var secondaryValue = 0;
    if (slotData && slotData.baseStat) {
        var bs = slotData.baseStat;
        primaryValue = Math.floor(bs.basePerLvl * (level || 1) * qm * 0.7);
        // 根据副属性类型确定比例
        var SECONDARY_RATIO = {
            hp: 4,   // HP 每点价值低，给高数值
            atk: 1,
            def: 1,
            spd: 1
        };
        var ratio = SECONDARY_RATIO[secondaryStat] || 1;
        secondaryValue = Math.floor((bs.basePerLvl || 1) * (level || 1) * qm * 0.7 * ratio);
    } else {
        primaryValue = Math.floor(10 * (level || 1) * qm * 0.7);
        secondaryValue = Math.floor(10 * (level || 1) * qm * 0.7);
    }

    // 存储为 baseStats 数组
    eq.baseStats = [
        { stat: primaryStat, value: Math.max(1, primaryValue) },
        { stat: secondaryStat, value: Math.max(1, secondaryValue) }
    ];

    eq.score = calcEquipScore(eq);
    return eq;
}

// 战斗结束后生成掉落物
function generateBattleLoot(stage, bonus) {
    if (!stage) stage = 1;
    bonus = bonus || 0;

    // ★ 应用每日轮转加成（周三装备掉落×2 + 品质+1）
    var dailyBonus = (typeof getDailyBonus === 'function') ? getDailyBonus() : null;
    var dailyDropRateMult = (dailyBonus && dailyBonus.equipDropRateMult) ? dailyBonus.equipDropRateMult : 1;
    var dailyQualityBoost = (dailyBonus && dailyBonus.equipQualityBoost) ? dailyBonus.equipQualityBoost : 0;

    // 经验：提高基础值和缩放，增加随机波动
    var expBase = 20 + stage * 8;
    var exp = Math.floor(expBase * (0.8 + Math.random() * 0.7));

    // 金币：提高基础值和缩放，增加随机波动
    var goldBase = 10 + stage * 5;
    var gold = Math.floor(goldBase * (0.8 + Math.random() * 0.7));

    var equipDrop = null;
    // 应用转生品质加成
    var rebirthBonuses = (typeof getRebirthBonuses === 'function') ? getRebirthBonuses() : { qualityBonus: 0 };
    var qualityBonus = rebirthBonuses.qualityBonus || 0;
    // ★ v3.x 修复：应用每日轮转加成（周三掉落率×2 + 品质+1）
    var equipChance = (0.12 + bonus * 0.005) * dailyDropRateMult;
    if (chance(equipChance)) {
        // v3.x修复：防御空数组/未加载场景（file://协议 fetch 受限时 FALLBACK 可能没生效）
        if (EQUIP_SLOTS && EQUIP_SLOTS.length >0) {
            var slot = randPick(EQUIP_SLOTS);
            if (slot) {
                var quality = rollQualityWithBonus(Math.floor(stage /2) + qualityBonus + dailyQualityBoost);
                // ★ v2.6.3 主线不刷橙/金装备 (橙色以上只能抽奖获得)
                // MYTHIC (橙) →紫色, IMMORTAL (金) →紫色
                if (typeof QUALITY !== 'undefined' && quality >= (QUALITY.MYTHIC ||4)) {
                    quality = (typeof QUALITY !== 'undefined' && QUALITY.MIRACLE !== undefined) ? QUALITY.MIRACLE :3; //紫色
                }
                equipDrop = createEquipInstance(slot.id, quality, stage);
            }
        }
    }

    var gemDrop = null;
    if (chance(0.05 + bonus * 0.002)) {
        // v3.x 修复：同样防御空数组
        if (GEM_TYPES && GEM_TYPES.length > 0) {
            var gemType = randPick(GEM_TYPES);
            if (gemType) {
                var level = 1;
                gemDrop = {
                    type: 'gem',
                    gemTypeId: gemType.id,
                    gemType: gemType,
                    level: level,
                    count: 1
                };
            }
        }
    }

    return { exp: exp, gold: gold, equipDrop: equipDrop, gemDrop: gemDrop };
}
