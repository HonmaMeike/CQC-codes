/**
 * Formulas.js — 全游戏统一公式中心（v6.x）
 *
 * 设计原则：
 *   1. 单一来源：所有伤害/战力/经验/推荐战力的算法都集中在本文件
 *   2. 纯函数模式（v6.0+）：已消除所有 fallback 入口，所有业务方强制走 Formulas 统一入口
 *      旧代码（game.js / battle.js）中残留的重复公式已被删除，仅保留 Formulas 作为唯一来源
 *   3. 纯函数：所有 API 不持有内部状态，便于单元测试与重入
 *
 * 命名空间：window.Formulas
 *   例：Formulas.calcHeroPower(hero) / Formulas.statToPower('atk', 100)
 *
 * 不依赖外部对象（getClassData / getEquipBaseStat / BattleManager 等），
 * 通过 typeof 安全检查兼容任意调用顺序
 */
(function () {
    'use strict';

    // ====================================================================
    // ① 战力权重表（单一来源 — 替代 equipment.js POWER_WEIGHTS）
    //   5 类属性分组：
    //     - 战斗核心：atk/def/hp/spd
    //     - 暴击：crit/critDmg
    //     - 效果：effectHit/effectRes
    //     - 元素：elemMastery/physMastery/healRate/healBonus/dmgBonus/dmgReduction
    //     - 资源：expBonus/lootBonus（不直接参与战斗）
    // ====================================================================
    var POWER_WEIGHTS = {
        atk: 1.5,         // 攻击：直接伤害来源
        def: 2.2,         // 防御：v3.x 平衡调整 — 减伤公式 def×0.6 上限 85%，权重下调与实战对齐（原 3.5）
        hp: 0.25,         // 生命：数值大但边际收益递减
        spd: 1.2,         // 速度：决定出手顺序
        crit: 2.5,        // 暴击率（百分比）：触发暴击的概率
        critDmg: 0.8,     // 暴击伤害（百分比）：暴击时伤害倍数
        effectHit: 1,     // 效果命中
        effectRes: 1,     // 效果抵抗
        dmgBonus: 5,      // 伤害加成（百分比）：直接放大总伤害
        dmgReduction: 5,  // 伤害减免（百分比）：直接减免承受伤害
        elemMastery: 1,   // 元素精通：用于元素反应
        physMastery: 0.5, // 物理精通
        healRate: 1,      // 治疗率：放大治疗量
        healBonus: 1,     // 治疗加成
        expBonus: 0.3,    // 经验加成（百分比）
        lootBonus: 0.3    // 掉落加成（百分比）
    };

    // 单一属性 → 战力（替代 equipment.js statToPower）
    function statToPower(stat, value) {
        var w = POWER_WEIGHTS[stat];
        if (w === undefined) w = 1;
        return (value || 0) * w;
    }

    // 便捷接口：取属性权重
    function getStatWeight(stat) {
        var w = POWER_WEIGHTS[stat];
        return w === undefined ? 1 : w;
    }

    // ====================================================================
    // ② 英雄简化分（仅职业基础，未含装备/天赋/羁绊）
    //    替代 teamUI.js calcHeroScore
    // ====================================================================
    function calcHeroScore(hero) {
        if (!hero) return 0;
        var cls = (typeof getClassData === 'function') ? getClassData(hero.classId) : null;
        if (!cls || !cls.baseStats) return 0;
        var s = cls.baseStats;
        return (s.atk || 0) * 1.5
             + (s.def || 0) * 3.5
             + (s.hp || 0) * 0.25
             + (s.spd || 0) * 1.2
             + (s.crit || 0) * 2.5
             + (s.critDmg || 0) * 0.8
             + (s.effectHit || 0) * 1
             + (s.effectRes || 0) * 1;
    }

    // ====================================================================
    // ③ 完整英雄战力（替代 teamUI.js calcHeroPower）
    //    包含：职业基础 + 装备词条 + 宝石 + 天赋 + 被动 + 等级 + 羁绊
    //    注意：属性叠加部分委托给 BattleManager.calcAllyStats（保持单一累加器）
    //
    //    参数：
    //      hero        - 英雄对象
    //      stats       - 可选，外部预计算的属性对象（来自 BattleManager.calcAllyStats）
    //      teamHeroes  - 可选，外部预计算的队伍英雄数组（用于羁绊）
    // ====================================================================
    function calcHeroPower(hero, stats, teamHeroes) {
        if (!hero) return 0;
        var cls = (typeof getClassData === 'function') ? getClassData(hero.classId) : null;
        if (!cls) return 0;
        try {
            if (!stats && typeof BattleManager !== 'undefined' && BattleManager.calcAllyStats) {
                stats = BattleManager.calcAllyStats(hero, cls);
            }
            if (!stats) return 0;

            if (!teamHeroes) {
                teamHeroes = (typeof collectTeamHeroes === 'function') ? collectTeamHeroes() : [];
            }

            // 羁绊加法型/乘法型拆分
            var bondsAdd = { crit: 0, critDmg: 0, dmgBonus: 0, elemMastery: 0 };
            var bondsMult = { atk: 1, def: 1, hp: 1 };
            if (teamHeroes.length >= 2 && typeof calcActiveBonds === 'function') {
                try {
                    var activeBonds = calcActiveBonds(teamHeroes);
                    for (var bi = 0; bi < activeBonds.length; bi++) {
                        var eff = activeBonds[bi] && activeBonds[bi].effects;
                        if (!eff) continue;
                        if (eff.atkBonus) bondsMult.atk *= (1 + eff.atkBonus);
                        if (eff.defBonus) bondsMult.def *= (1 + eff.defBonus);
                        if (eff.hpBonus) bondsMult.hp *= (1 + eff.hpBonus);
                        if (eff.critBonus) bondsAdd.crit += eff.critBonus;
                        if (eff.critDmgBonus) bondsAdd.critDmg += eff.critDmgBonus;
                        if (eff.dmgBonus) bondsAdd.dmgBonus += eff.dmgBonus * 100;
                        if (eff.elemMasteryBonus) bondsAdd.elemMastery += eff.elemMasteryBonus;
                    }
                } catch (e) { /* 羁绊失败不阻断 */ }
            }

            // 主属性战力（应用羁绊乘算）
            var power = 0;
            power += (stats.atk || 0) * bondsMult.atk * POWER_WEIGHTS.atk;
            power += (stats.def || 0) * bondsMult.def * POWER_WEIGHTS.def;
            power += (stats.hp || 0) * bondsMult.hp * POWER_WEIGHTS.hp;
            power += (stats.spd || 0) * POWER_WEIGHTS.spd;

            // 加法型属性
            power += ((stats.crit || 0) + bondsAdd.crit) * POWER_WEIGHTS.crit;
            power += (stats.critDmg || 0) * POWER_WEIGHTS.critDmg;
            power += (stats.effectHit || 0) * POWER_WEIGHTS.effectHit;
            power += (stats.effectRes || 0) * POWER_WEIGHTS.effectRes;
            power += (stats.dmgBonus || 0) * POWER_WEIGHTS.dmgBonus;
            power += (bondsAdd.dmgBonus || 0) * POWER_WEIGHTS.dmgBonus;
            power += (stats.dmgReduction || 0) * POWER_WEIGHTS.dmgReduction;
            power += ((stats.elemMastery || 0) + bondsAdd.elemMastery) * POWER_WEIGHTS.elemMastery;
            power += (stats.physMastery || 0) * POWER_WEIGHTS.physMastery;
            power += (stats.healRate || 0) * POWER_WEIGHTS.healRate;
            power += (stats.healBonus || 0) * POWER_WEIGHTS.healBonus;
            power += (stats.expBonus || 0) * POWER_WEIGHTS.expBonus;
            power += (stats.lootBonus || 0) * POWER_WEIGHTS.lootBonus;

            return Math.floor(power);
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[Formulas.calcHeroPower]', e);
            return 0;
        }
    }

    // ====================================================================
    // ④ 装备评分（v3 严谨化 — 替代 equipment.js calcEquipScore）
    //    估算该装备对英雄战力的实际贡献
    //    公式：rawPower = (base + affixes + gems) × qualityMult × affCountMult × gemLvlMult
    //      - base     : getEquipBaseStat(slot, level, q) 已含强化等级 + 品质缩放
    //      - affixes  : 词条总和（loot 生成时已按品质范围随机）
    //      - gems     : flat 直接累加，pct 按 stat 类型差异化估算基数 × gemPct
    //      - qualityMult : 委托给 Quality.statMult（单一来源），回退 qMultFallback=[1,1.2,1.5,1.8,2.2,2.7]
    //      - affCountMult : 对数曲线 1+log10(N+1)*0.5，让多词条奖励更显著
    //      - gemLvlMult   : 平均宝石等级加成（Lv3 共鸣 ≈ ×1.5）
    // ====================================================================
    var Q_MULT_FALLBACK = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];  // v3.x 与 quality.js TIER.statMult 同步
    // pct 宝石按 stat 类型的估算基数（用于评分，非实际加成）
    var GEM_PCT_BASE = {
        hp:     function(eqLevel) { return 300 + eqLevel * 100; },  // 头盔/护甲位主词条
        atk:    function(eqLevel) { return 30 + eqLevel * 12; },   // 武器位主词条
        def:    function(eqLevel) { return 25 + eqLevel * 10; },   // 防具位主词条
        spd:    function(eqLevel) { return 10 + eqLevel * 3; },    // 鞋子位主词条
        crit:   function(eqLevel) { return 5 + eqLevel * 1; },     // 暴击率%
        critDmg:function(eqLevel) { return 50 + eqLevel * 8; },    // 暴击伤害%
        healRate: function(eqLevel) { return 20 + eqLevel * 5; },  // 治疗率%
        dmgBonus:function(eqLevel) { return 5 + eqLevel * 2; },    // 伤害加成%
        dmgReduction:function(eqLevel) { return 5 + eqLevel * 2; } // 伤害减免%
    };
    var _defaultGemBase = function(eqLevel) { return 50 + eqLevel * 20; };

    function calcEquipScore(eq) {
        if (!eq) return 0;
        var q = eq.quality || 0;
        var eqLevel = eq.level || 1;

        // 阶段 1: 基础属性战力（含强化等级 + 品质缩放）
        var rawBasePower = 0;
        var baseStatValue = 0;
        if (typeof getEquipBaseStat === 'function') {
            var baseStat = getEquipBaseStat(eq.slot, eqLevel, q);
            if (baseStat) {
                rawBasePower = statToPower(baseStat.stat, baseStat.value);
                baseStatValue = baseStat.value;
            }
        }

        // 阶段 2: 词条战力
        var affPower = 0;
        var affCount = 0;
        if (eq.affixes) {
            for (var i = 0; i < eq.affixes.length; i++) {
                var aff = eq.affixes[i];
                if (aff) {
                    affPower += statToPower(aff.stat, aff.value);
                    affCount++;
                }
            }
        }

        // 阶段 3: 宝石战力
        var gemPower = 0;
        var gemCount = 0;
        var totalGemLvl = 0;
        if (eq.gems && typeof GEM_TYPES !== 'undefined') {
            for (var gi = 0; gi < eq.gems.length; gi++) {
                var g = eq.gems[gi];
                if (!g) continue;
                gemCount++;
                totalGemLvl += (g.level || 1);
                var gt = null;
                for (var gti = 0; gti < GEM_TYPES.length; gti++) {
                    if (GEM_TYPES[gti].id === g.gemTypeId) { gt = GEM_TYPES[gti]; break; }
                }
                if (!gt || typeof getGemValue !== 'function') continue;
                var gemLvl = g.level || 1;
                var gemPct = getGemValue(gt, gemLvl);
                if (gt.statType === 'pct') {
                    // 按 stat 类型差异化估算基数
                    var baseFn = GEM_PCT_BASE[gt.stat] || _defaultGemBase;
                    var estBase = baseFn(eqLevel);
                    gemPower += statToPower(gt.stat, Math.floor(estBase * gemPct / 100));
                } else {
                    gemPower += statToPower(gt.stat, gemPct);
                }
                // 复合宝石 extraStat
                if (gt.isCompound && gt.extraStat && typeof getGemExtraValue === 'function') {
                    gemPower += statToPower(gt.extraStat, getGemExtraValue(gt, gemLvl));
                }
            }
        }

        // 阶段 4: 累加 rawPower
        var rawPower = rawBasePower + affPower + gemPower;

        // 阶段 5: 质量加权 — 委托给 Quality.statMult（单一来源）
        var qualityMult = Q_MULT_FALLBACK[q] || 1.0;
        if (typeof Quality !== 'undefined' && Quality.getStatMult) {
            qualityMult = Quality.getStatMult(q);
        }
        rawPower *= qualityMult;

        // 阶段 6: 词条数奖励（对数曲线，让多词条优势显著）
        // 1 词条×1.08 / 4 词条×1.32 / 6 词条×1.43 / 10 词条×1.68
        var affCountMult = 1 + Math.log10(Math.max(1, affCount + 1)) * 0.5;
        rawPower *= affCountMult;

        // 阶段 7: 宝石等级加成（平均宝石等级 → 共鸣价值）
        // Lv1×1.0 / Lv2×1.25 / Lv3×1.5（线性插值）
        if (gemCount > 0) {
            var avgGemLvl = totalGemLvl / gemCount;
            var gemLvlMult = 1 + (avgGemLvl - 1) * 0.25;
            rawPower *= gemLvlMult;
        }

        return Math.floor(rawPower);
    }

    // ====================================================================
    // ⑤ 统一伤害公式（替代 battle.js L936 & L1489 内联伤害计算）
    //    语义保留：物理攻击 def×0.5 减伤，技能攻击 def×0.3 减伤
    //    统一入口：调用方只关心 (attacker, target, isSkill, mult)
    // ====================================================================
    function calcDamage(attacker, target, isSkill, mult) {
        if (!attacker || !target) return 0;
        mult = (typeof mult === 'number') ? mult : 1;
        var atk = attacker.atk || 0;
        var def = target.def || 0;
        var dmg;
        if (isSkill) {
            dmg = Math.max(1, Math.floor(atk * mult - def * 0.3));
        } else {
            dmg = Math.max(1, atk - Math.floor(def * 0.5));
        }
        // 伤害加成（dmgBonus 是百分比）
        if (attacker.dmgBonus) {
            dmg = Math.floor(dmg * (1 + (attacker.dmgBonus || 0) / 100));
        }
        return dmg;
    }

    // 暴击判定：crit 为 0-100 百分比，封顶 1.0
    function isCritTriggered(crit) {
        if (!crit || crit <= 0) return false;
        var rate = crit / 100;
        if (rate > 1) rate = 1;
        return Math.random() < rate;
    }

    // 暴击伤害：基础伤害 × 暴击伤害百分比 / 100
    function calcCritDmg(baseDmg, critDmg) {
        return Math.floor(baseDmg * ((critDmg || 150) / 100));
    }

    // 减伤计算（def 转换为减伤百分比），上限 85%
    //   v3.x 平衡调整：从 def×0.5/上限 90% 改为 def×0.6/上限 85%
    //   原因：原公式 90% 上限容易让"堆 def 玩家"进入边际死区；新公式让堆 def 收益更线性
    function calcDefReduction(def, attackerLevel) {
        var rate = (def || 0) * 0.6 / 100;
        if (rate > 0.85) rate = 0.85;
        if (rate < 0) rate = 0;
        return rate;
    }

    // ====================================================================
    // ⑥ 经验公式（基础值 200，增长率 1.5/级）
    // ====================================================================
    function getExpToNext(level) {
        if (!level || level < 1) level = 1;
        if (level >= 999) return Infinity;
        return Math.floor(200 * Math.pow(1.5, level - 1));
    }

    // ====================================================================
    // ⑦ 推荐战力（替代 game.js getRecommendedPower）
    //    目标：4 人满员 30-40 秒击杀 BOSS 所需单人战力
    //    v3 严谨化（2.1.4+）：
    //      1) 先用 monsters.js BOSS 公式算 HP/ATK/DEF
    //      2) 再用与 calcHeroPower 一致的 POWER_WEIGHTS 把 BOSS 转成「战力」分数
    //      3) 推荐单人 = BOSS 战力 × 0.40（4 人队伍 + 战斗余量）
    //    这样保证推荐战力与英雄战力在同一套权重下，参考价值准确
    //
    //    ★ 与 monsters.js calcChapterMonsterStats BOSS L20 对齐
    //      baseHP   = 180 * stageBaseMult * (1 + 19*0.12) = 180 * stageBaseMult * 3.28
    //      baseATK  = 2   * stageBaseMult * (1 + 19*0.12) = 2   * stageBaseMult * 3.28
    //      baseDEF  = 3   * stageBaseMult * (1 + 19*0.10) = 3   * stageBaseMult * 2.9
    //      BOSS倍   = HP×30, ATK×3.5, DEF×3
    //    第 1 章 L20 BOSS：HP=17700, ATK=23, DEF=26
    // ====================================================================
    function getRecommendedPower(stage) {
        if (!stage || stage < 1) stage = 1;
        // 章节基础系数（与 monsters.js 一致）
        var stageBaseMult = (stage >= 5)
            ? (stage - 4) * 5
            : 1 + (stage - 1) * 0.4;
        // BOSS L20 缩放（关卡20是本章最难）
        var hpGrowth  = 1 + 19 * 0.12; // 3.28
        var atkGrowth = 1 + 19 * 0.12; // 3.28
        var defGrowth = 1 + 19 * 0.10; // 2.9
        // BOSS 基础属性
        var baseHP  = Math.floor(180 * stageBaseMult * hpGrowth  * 22);   // HP×22 (原 30, 压 25% 让推荐战力更接近实际)
        var baseATK = Math.floor(2   * stageBaseMult * atkGrowth * 3.5);  // ATK×3.5
        var baseDEF = Math.floor(3   * stageBaseMult * defGrowth * 3);    // DEF×3
        var baseSPD = 60; // BOSS 速度固定
        // 用 POWER_WEIGHTS 把 BOSS 转成战力（与 calcHeroPower 主路径一致）
        var bossPower = baseHP  * POWER_WEIGHTS.hp
                      + baseATK * POWER_WEIGHTS.atk
                      + baseDEF * POWER_WEIGHTS.def
                      + baseSPD * POWER_WEIGHTS.spd;
        // 推荐单人：4 人满员 + 战斗余量（实际战斗 30-40s，挑战有差异）
        // 系数 0.4 = 1/4 人均分 + 约 50% 余量 给控制 / 魔法
        return Math.floor(bossPower * 0.30);
    }

    // ====================================================================
    // ⑧ 通用属性累加函数（v2.1.0+ — 替代 battle.js calcAllyStats 内联累加）
    //    设计目标：把"装备词条 / 宝石 / 天赋 / 被动技能"四类数据源抽象为
    //             统一签名的累加函数，便于维护、测试、跨界面复用。
    //    调用方式：传入 stats 容器和单个数据项，原地修改并返回 stats
    //    注意：保留原地修改语义，调用方按顺序调用即可
    // ====================================================================

    // ====================================================================
    // v3.x 数值安全系统（针对玩家崩盘反馈：22 亿战力/2-3 天）
    //   根因：pct 词条 + pct 宝石 + 天赋 pct 累加是乘法叠加（1.18^N），
    //         5件装备 × 6 词条 = 30 个 pct 来源，1.18^30 ≈ 236× 单 def
    //   修复：单次 calcAllyStats 中，同 stat 的 pct 累加总和超过 MAX_PCT_PER_STAT 后丢弃
    // ====================================================================
    var MAX_PCT_PER_STAT = 3.0;   // 单次 calcAllyStats 中同 stat 的 pct 累加上限 300%

    // 数值软上限（确保高端玩家属性不无限增长，保持平衡设计有意义）
    //   但必须足够高，不限制正常升满配装的玩家
    //   v6.8.2：上调至正常值之上，使配装满后仍有余量
    var STAT_CAPS = {
        atk:  19999,   // 攻击上限（原 9999 → 19999）
        def:  29999,   // 防御上限（原 19999 → 29999）
        hp:   199999,  // 生命上限（原 99999 → 199999）
        spd:  800,     // 速度上限（原 500 → 800）
    };
    // 软上限衰减系数：超过 cap 后每超 1 点收益只有 0.01（即 1%）
    var SOFT_CAP_DECAY = 0.01;

    // 软上限处理：超过 cap 后缓慢增长
    function capStat(stat, value) {
        var cap = STAT_CAPS[stat];
        if (cap === undefined || value <= cap) return value;
        return cap + Math.floor((value - cap) * SOFT_CAP_DECAY);
    }

    // 检查并应用 pct 累加 cap（核心：避免 1.18^N 指数放大）
    //   stats._pctApplied 是累加追踪表（key=stat, value=已累加的 pct%）
    //   调用前必须确保 stats._pctApplied 已初始化（calcAllyStats 负责）
    function _applyPctWithCap(stats, stat, pctValue) {
        if (!stats._pctApplied) stats._pctApplied = {};
        var current = stats._pctApplied[stat] || 0;
        var maxAdd = MAX_PCT_PER_STAT * 100 - current;
        if (maxAdd <= 0) return false;   // 已到上限，丢弃
        var actualAdd = Math.min(pctValue, maxAdd);
        var cur = stats[stat] || 0;
        stats[stat] = cur + Math.floor(cur * actualAdd / 100);
        stats._pctApplied[stat] = current + actualAdd;
        return true;
    }

    /**
     * 应用装备词条到 stats
     *   affix 格式：{ stat: 'atk', type: 'flat'|'pct', value: number }
     *   levelMult: 装备等级缩放系数（1 + (level-1)*0.1）
     *   v3.x 修改：pct 词条累加加 cap，避免指数放大（1.18^N → 最多 1+3.0 = 4×）
     */
    function applyAffix(stats, affix, levelMult, levelBase) {
        if (!stats || !affix) return stats;
        levelMult = levelMult || 1;
        var scaledVal = (affix.value || 0) * levelMult;
        if (affix.type === 'pct') {
            if (levelBase && levelBase.hasOwnProperty(affix.stat)) {
                // Additive: levelBaseStat × scaledVal / 100
                stats[affix.stat] = (stats[affix.stat] || 0) + (levelBase[affix.stat] * scaledVal / 100);
            } else {
                _applyPctWithCap(stats, affix.stat, scaledVal);
            }
        } else {
            stats[affix.stat] = (stats[affix.stat] || 0) + scaledVal;
        }
        return stats;
    }

    /**
     * 应用宝石到 stats
     *   gem 格式：{ gemTypeId, level }
     *   gemType:  GEM_TYPES 数组中的单个元素（必须先 find 出来）
     *   classMult: 职业四维系数（clsData.statMultipliers[stat]），仅 atk/def/hp/spd 生效
     *   v6.x 修改：classMult 路径统一（无论是否走 levelBase 都按 (1+classMult) 缩放）
     */
    function applyGem(stats, gem, gemType, classMult, levelBase) {
        if (!stats || !gem || !gemType) return stats;
        var gemPct = (typeof getGemValue === 'function') ? getGemValue(gemType, gem.level) : 0;
        if (gemPct <= 0) return stats;
        var isCore = (levelBase && levelBase.hasOwnProperty(gemType.stat));
        if (gemType.statType === 'pct') {
            if (isCore) {
                // Core stat (atk/def/hp/spd): additive via levelBaseStat × classMult
                //   classMult=1.0 → 满收益；classMult=0.5 → 半收益（与设计文档一致）
                stats[gemType.stat] = (stats[gemType.stat] || 0)
                    + (levelBase[gemType.stat] * gemPct * classMult / 100);
            } else {
                // Non-core stat (crit/critDmg/dmgBonus/...): classMult 不适用
                //   直接走 _applyPctWithCap 累加（与其他非职业相关 pct 一致）
                _applyPctWithCap(stats, gemType.stat, gemPct);
            }
        } else {
            // Flat 宝石：classMult 全适用
            stats[gemType.stat] = (stats[gemType.stat] || 0) + (gemPct * classMult);
        }
        if (gemType.isCompound && gemType.extraStat) {
            var extraVal = (typeof getGemExtraValue === 'function') ? getGemExtraValue(gemType, gem.level) : 0;
            stats[gemType.extraStat] = (stats[gemType.extraStat] || 0) + extraVal;
        }
        return stats;
    }

    /**
     * 应用天赋属性加点
     *   talent 格式：{ stat: 'atk'|'hp'|..., isPct: bool, value: number, type: 'stat' }
     *   level: 该天赋的等级（默认 1）
     *   v3.x 重构：按 isPct 区分
     *     - isPct=true（atk/def/hp/spd）：走天赋独立 pct 累加通道（_talentPct）
     *       不受装备 pct cap 限制，让 5 节点满 500% 完整生效
     *       在 calcAllyStats 末尾、cap 处理之前由 applyTalentPctBuffs 一次性应用
     *     - isPct=false（crit/critDmg）：flat 加成（+1 = +1% 暴击率/暴伤）
     */
    function applyTalentStat(stats, talent, level, levelBase) {
        if (!stats || !talent) return stats;
        if (!talent.stat) return stats;
        level = level || 1;
        var perLvl = (typeof getTalentValue === 'function') ? getTalentValue(talent) : (talent.value || 0);
        var isPct  = (typeof getTalentIsPct === 'function') ? getTalentIsPct(talent) : (talent.isPct || false);
        var bonus = perLvl * level;
        if (bonus === 0) return stats;
        if (isPct) {
            if (levelBase && levelBase.hasOwnProperty(talent.stat)) {
                // Additive: pre-compute flat value from levelBase
                if (!stats._talentPct) stats._talentPct = {};
                stats._talentPct[talent.stat] = (stats._talentPct[talent.stat] || 0) + (levelBase[talent.stat] * bonus / 100);
            } else {
                if (!stats._talentPct) stats._talentPct = {};
                stats._talentPct[talent.stat] = (stats._talentPct[talent.stat] || 0) + bonus;
            }
        } else {
            // flat 加成（crit/critDmg 等本身是 % 字段的，加 1 = +1%）
            stats[talent.stat] = (stats[talent.stat] || 0) + bonus;
        }
        return stats;
    }

    /**
     * 一次性应用天赋 pct 累加（在所有 flat 累加后、cap 处理前调用）
     *   公式：stats[stat] *= (1 + totalTalentPct[stat] / 100)
     *   5 节点满级 atk +500% → atk × 6（不与装备 pct 混算，保留可预测性）
     *   清理临时表 _talentPct
     */
    function applyTalentPctBuffs(stats) {
        if (!stats._talentPct) return;
        for (var stat in stats._talentPct) {
            if (stats._talentPct.hasOwnProperty(stat) && stats[stat] !== undefined) {
                var pct = stats._talentPct[stat];
                if (pct > 0) {
                    stats[stat] = Math.floor(stats[stat] * (1 + pct / 100));
                }
            }
        }
        delete stats._talentPct;
    }

    /**
     * 应用被动技能属性加成
     *   skill: SKILL_DATA 中的被动技能对象
     *   level: 该技能的加点等级（必须 > 0 才生效）
     *   支持字段：
     *     - defBonusPct / atkBonusPct / hpBonusPct       累加到对应属性（pct 形式）
     *     - critBonusPct / critDmgBonus                  累加到 crit/critDmg
     *     - healBonusPct (v2.6.1 补)                     累加到 stats.healBonus
     *     - summonAtkBonus (v2.6.1 补)                  累加到 stats.summonAtkBonus（占位，召唤系统接入后生效）
     *   v3.x 修改：v3.0.1 临时回退到 v2.x 行为（避免战斗卡死回归）
     *   原因：applyPassiveBonus 走 _applyPctWithCap 通道后玩家测试报"过一会儿卡住"
     *   处理：保留旧版的直接累加实现，等定位战斗卡死根因后再决定是否加 cap
     */
    function applyPassiveBonus(stats, skill, level, levelBase) {
        if (!stats || !skill) return stats;
        if (!level || level <= 0) return stats;
        var scale = 1 + (level - 1) * 0.1;
        // 核心属性：加算模型，以 levelBase 为锚点
        if (skill.defBonusPct && levelBase)      stats.def     = (stats.def     || 0) + (levelBase.def * skill.defBonusPct * scale);
        if (skill.atkBonusPct && levelBase)      stats.atk     = (stats.atk     || 0) + (levelBase.atk * skill.atkBonusPct * scale);
        if (skill.hpBonusPct && levelBase)       stats.hp      = (stats.hp      || 0) + (levelBase.hp  * skill.hpBonusPct  * scale);
        if (skill.spdBonusPct && levelBase)      stats.spd     = (stats.spd     || 0) + (levelBase.spd * skill.spdBonusPct * scale);
        if (skill.mpBonusPct && levelBase)       stats.maxMp   = (stats.maxMp   || 0) + (levelBase.maxMp || stats.maxMp || 0) * skill.mpBonusPct * scale;
        // 非核心属性：保持固定值加成
        if (skill.critBonusPct)     stats.crit    = (stats.crit    || 0) + Math.round(skill.critBonusPct * scale);
        if (skill.critDmgBonus)     stats.critDmg = (stats.critDmg || 0) + Math.round(skill.critDmgBonus * scale);
        if (skill.healBonusPct)     stats.healBonus  = (stats.healBonus  || 0) + ((skill.healBonusPct  || 0) * 100 * scale);
        if (skill.summonAtkBonus)   stats.summonAtkBonus = (stats.summonAtkBonus || 0) + Math.round((skill.summonAtkBonus || 0) * 100 * scale) / 100;
        if (skill.summonHpBonus)    stats.summonHpBonus  = (stats.summonHpBonus  || 0) + Math.round((skill.summonHpBonus  || 0) * 100 * scale) / 100;
        if (skill.shadowDmgBonus)   stats.shadowDmgBonus = (stats.shadowDmgBonus || 0) + Math.round((skill.shadowDmgBonus || 0) * 100 * scale) / 100;
        return stats;
    }

    // ====================================================================
    // 暴露到全局（兼容 ES5 浏览器）
    // ====================================================================
    window.Formulas = {
        // 权重
        POWER_WEIGHTS: POWER_WEIGHTS,
        statToPower: statToPower,
        getStatWeight: getStatWeight,
        // 战力
        calcHeroScore: calcHeroScore,
        calcHeroPower: calcHeroPower,
        calcEquipScore: calcEquipScore,
        // 战斗
        calcDamage: calcDamage,
        isCritTriggered: isCritTriggered,
        calcCritDmg: calcCritDmg,
        calcDefReduction: calcDefReduction,
        // 经验/推荐
        getExpToNext: getExpToNext,
        getRecommendedPower: getRecommendedPower,
        // 属性累加（v2.1.0+）
        applyAffix: applyAffix,
        applyGem: applyGem,
        applyTalentStat: applyTalentStat,
        applyTalentPctBuffs: applyTalentPctBuffs,
        applyPassiveBonus: applyPassiveBonus,
        // v3.x 数值安全系统
        MAX_PCT_PER_STAT: MAX_PCT_PER_STAT,
        STAT_CAPS: STAT_CAPS,
        SOFT_CAP_DECAY: SOFT_CAP_DECAY,
        capStat: capStat
    };
})();
