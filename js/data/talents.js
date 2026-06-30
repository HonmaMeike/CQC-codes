// ========== 天赋树数据 v3.x（差异化升级规则）==========
/* global GameState */
// 用户原话："点满攻击加成1、2、3、4、5后总加成是200%，其他的加成同理"
// 即"整族"总加成 = 5 节点全部 max 时该属性获得的总加成
//
// 分类规则：
//   1. 攻击 / 生命 / 防御（主战属性）
//      - 升级次数：20 次/节点（5 节点链总计 100 次升级）
//      - 单次价值：+2%/级（20 级 × 5 节点满 = +200% 整族）
//      - 金币基础价：原版 × 2（翻倍）
//   2. 速度 / 暴击（次要属性）
//      - 升级次数：5 次/节点（5 节点链总计 25 次升级）
//      - 单次价值：+1.2%/级（5 级 × 5 节点满 = +30% 整族）
//      - 金币基础价：原版 × 3（翻两倍）
//   3. 暴伤（特殊属性）
//      - 升级次数：100 次/节点（5 节点链总计 500 次升级，长期养成）
//      - 单次价值：+0.6%/级（100 级 × 5 节点满 = +300% 整族）
//      - 金币基础价：原版（不变）
//
// 应用层：
//   - isPct=true（atk/def/hp/spd）：走天赋独立 pct 通道（_talentPct）
//   - isPct=false（crit/critDmg）：flat 加成（+1 = +1% 暴击率/暴伤）
//
// 已删除：t_exp1~3、t_loot1~3（经验/掉落加成）
// 已删除：t_inv1~2（背包扩容 — 游戏只有仓库没有背包）
// 保留：t_slot3~4、t_wh1~4（上阵位、仓库扩容）

// 天赋节点类型
var TALENT_TYPES = {
    STAT: 'stat',         // 属性加成
    FUNCTION: 'function'  // 功能解锁
};

// 全局最大等级（默认 100，用于暴伤类）
//   v3.x：每节点有独立 maxLevel 字段（差异化分类）
var TALENT_MAX_LEVEL = 100;

// ========== 分类参数表（用户 v3.x 定制）============
// 用户原话："点满攻击加成1、2、3、4、5后总加成是200%，其他的加成同理"
// 即：5 节点全部 max 时，**整族**的总加成为目标值
//
// 攻击/生命/防御：5×20=100 次 / 200% 整族 → 2%/级
// 速度/暴击：5×5=25 次 / 30% 整族 → 1.2%/级
// 暴伤：5×100=500 次 / 300% 整族 → 0.6%/级
//
// 金币倍数仍按用户原意：攻/血/防 ×2、速/暴击 ×3、暴伤 ×1
var TALENT_CATEGORY_CONFIG = {
    'atk':     { maxLevel: 20, valuePerLvl: 2,   costMult: 2, isPct: true,  categoryName: '主战属性' },
    'def':     { maxLevel: 20, valuePerLvl: 2,   costMult: 2, isPct: true,  categoryName: '主战属性' },
    'hp':      { maxLevel: 20, valuePerLvl: 2,   costMult: 2, isPct: true,  categoryName: '主战属性' },
    'spd':     { maxLevel: 5,  valuePerLvl: 1.2, costMult: 3, isPct: true,  categoryName: '次要属性' },
    'crit':    { maxLevel: 5,  valuePerLvl: 1.2, costMult: 3, isPct: false, categoryName: '次要属性' },
    'critDmg': { maxLevel: 100, valuePerLvl: 0.6, costMult: 1, isPct: false, categoryName: '特殊属性' }
};

// 基础价（原版）— 按节点序号
var TALENT_BASE_COST = [200, 600, 1600, 2800, 6000];

var TALENT_DATA = [
    // ========== 攻击强化（5 节点，20 次/级，10%/级，金币 ×2）============
    { id: 't_atk1',  name: '攻击强化·I',   icon: '⚔', type: TALENT_TYPES.STAT, stat: 'atk',  category: 'atk',     prereq: [] },
    { id: 't_atk2',  name: '攻击强化·II',  icon: '⚔', type: TALENT_TYPES.STAT, stat: 'atk',  category: 'atk',     prereq: ['t_atk1'] },
    { id: 't_atk3',  name: '攻击强化·III', icon: '⚔', type: TALENT_TYPES.STAT, stat: 'atk',  category: 'atk',     prereq: ['t_atk2'] },
    { id: 't_atk4',  name: '攻击强化·IV',  icon: '⚔', type: TALENT_TYPES.STAT, stat: 'atk',  category: 'atk',     prereq: ['t_atk3'] },
    { id: 't_atk5',  name: '攻击强化·V',   icon: '⚔', type: TALENT_TYPES.STAT, stat: 'atk',  category: 'atk',     prereq: ['t_atk4'] },

    // ========== 防御强化（5 节点，20 次/级，10%/级，金币 ×2）============
    { id: 't_def1',  name: '防御强化·I',   icon: '🛡', type: TALENT_TYPES.STAT, stat: 'def',  category: 'def',     prereq: [] },
    { id: 't_def2',  name: '防御强化·II',  icon: '🛡', type: TALENT_TYPES.STAT, stat: 'def',  category: 'def',     prereq: ['t_def1'] },
    { id: 't_def3',  name: '防御强化·III', icon: '🛡', type: TALENT_TYPES.STAT, stat: 'def',  category: 'def',     prereq: ['t_def2'] },
    { id: 't_def4',  name: '防御强化·IV',  icon: '🛡', type: TALENT_TYPES.STAT, stat: 'def',  category: 'def',     prereq: ['t_def3'] },
    { id: 't_def5',  name: '防御强化·V',   icon: '🛡', type: TALENT_TYPES.STAT, stat: 'def',  category: 'def',     prereq: ['t_def4'] },

    // ========== 生命强化（5 节点，20 次/级，10%/级，金币 ×2）============
    { id: 't_hp1',   name: '生命强化·I',   icon: '❤', type: TALENT_TYPES.STAT, stat: 'hp',   category: 'hp',      prereq: [] },
    { id: 't_hp2',   name: '生命强化·II',  icon: '❤', type: TALENT_TYPES.STAT, stat: 'hp',   category: 'hp',      prereq: ['t_hp1'] },
    { id: 't_hp3',   name: '生命强化·III', icon: '❤', type: TALENT_TYPES.STAT, stat: 'hp',   category: 'hp',      prereq: ['t_hp2'] },
    { id: 't_hp4',   name: '生命强化·IV',  icon: '❤', type: TALENT_TYPES.STAT, stat: 'hp',   category: 'hp',      prereq: ['t_hp3'] },
    { id: 't_hp5',   name: '生命强化·V',   icon: '❤', type: TALENT_TYPES.STAT, stat: 'hp',   category: 'hp',      prereq: ['t_hp4'] },

    // ========== 速度强化（5 节点，5 次/级，6%/级，金币 ×3）============
    { id: 't_spd1',  name: '速度强化·I',   icon: '⚡', type: TALENT_TYPES.STAT, stat: 'spd',  category: 'spd',     prereq: [] },
    { id: 't_spd2',  name: '速度强化·II',  icon: '⚡', type: TALENT_TYPES.STAT, stat: 'spd',  category: 'spd',     prereq: ['t_spd1'] },
    { id: 't_spd3',  name: '速度强化·III', icon: '⚡', type: TALENT_TYPES.STAT, stat: 'spd',  category: 'spd',     prereq: ['t_spd2'] },
    { id: 't_spd4',  name: '速度强化·IV',  icon: '⚡', type: TALENT_TYPES.STAT, stat: 'spd',  category: 'spd',     prereq: ['t_spd3'] },
    { id: 't_spd5',  name: '速度强化·V',   icon: '⚡', type: TALENT_TYPES.STAT, stat: 'spd',  category: 'spd',     prereq: ['t_spd4'] },

    // ========== 暴击强化（5 节点，5 次/级，6%/级，金币 ×3）============
    { id: 't_crit1', name: '暴击强化·I',   icon: '💥', type: TALENT_TYPES.STAT, stat: 'crit', category: 'crit',    prereq: [] },
    { id: 't_crit2', name: '暴击强化·II',  icon: '💥', type: TALENT_TYPES.STAT, stat: 'crit', category: 'crit',    prereq: ['t_crit1'] },
    { id: 't_crit3', name: '暴击强化·III', icon: '💥', type: TALENT_TYPES.STAT, stat: 'crit', category: 'crit',    prereq: ['t_crit2'] },
    { id: 't_crit4', name: '暴击强化·IV',  icon: '💥', type: TALENT_TYPES.STAT, stat: 'crit', category: 'crit',    prereq: ['t_crit3'] },
    { id: 't_crit5', name: '暴击强化·V',   icon: '💥', type: TALENT_TYPES.STAT, stat: 'crit', category: 'crit',    prereq: ['t_crit4'] },

    // ========== 暴伤强化（5 节点，100 次/级，3%/级，金币 ×1）============
    { id: 't_critdmg1', name: '暴伤强化·I',   icon: '🔥', type: TALENT_TYPES.STAT, stat: 'critDmg', category: 'critDmg', prereq: [] },
    { id: 't_critdmg2', name: '暴伤强化·II',  icon: '🔥', type: TALENT_TYPES.STAT, stat: 'critDmg', category: 'critDmg', prereq: ['t_critdmg1'] },
    { id: 't_critdmg3', name: '暴伤强化·III', icon: '🔥', type: TALENT_TYPES.STAT, stat: 'critDmg', category: 'critDmg', prereq: ['t_critdmg2'] },
    { id: 't_critdmg4', name: '暴伤强化·IV',  icon: '🔥', type: TALENT_TYPES.STAT, stat: 'critDmg', category: 'critDmg', prereq: ['t_critdmg3'] },
    { id: 't_critdmg5', name: '暴伤强化·V',   icon: '🔥', type: TALENT_TYPES.STAT, stat: 'critDmg', category: 'critDmg', prereq: ['t_critdmg4'] },

    // ========== 功能解锁（一次性，价格高）============
    // 上阵位 3：取消前置（无门槛）
    { id: 't_slot3', name: '第三上阵位',   icon: '👥', type: TALENT_TYPES.FUNCTION, function: 'unlock_slot', slotIndex: 2, cost: 200000, row: 1, col: 2, prereq: [] },
    // 上阵位 4：需 t_slot3 已激活
    { id: 't_slot4', name: '第四上阵位',   icon: '👥', type: TALENT_TYPES.FUNCTION, function: 'unlock_slot', slotIndex: 3, cost: 500000, row: 2, col: 2, prereq: ['t_slot3'] },

    // 仓库扩容 I：取消前置（无门槛）
    { id: 't_wh1',   name: '仓库扩容·I',   icon: '🏠', type: TALENT_TYPES.FUNCTION, function: 'expand_warehouse', pageAdd: 1, cost: 150000, row: 1, col: 1, prereq: [] },
    // 仓库扩容 II：需 仓库I已激活
    { id: 't_wh2',   name: '仓库扩容·II',  icon: '🏠', type: TALENT_TYPES.FUNCTION, function: 'expand_warehouse', pageAdd: 1, cost: 250000, row: 1, col: 0, prereq: ['t_wh1'] },
    // 仓库扩容 III：需 仓库II已激活 + 暴击III满级
    { id: 't_wh3',   name: '仓库扩容·III', icon: '🏠', type: TALENT_TYPES.FUNCTION, function: 'expand_warehouse', pageAdd: 1, cost: 350000, row: 1, col: 2, prereq: ['t_wh2', 't_crit3'] },
    // 仓库扩容 IV：需 仓库III已激活 + 生命IV满级
    { id: 't_wh4',   name: '仓库扩容·IV',  icon: '🏠', type: TALENT_TYPES.FUNCTION, function: 'expand_warehouse', pageAdd: 1, cost: 500000, row: 2, col: 0, prereq: ['t_wh3', 't_hp4'] },

    // ★ v2.6.4 Round 12: 离线奖励天赋链
    // 离线效率 (3 节点): 基础 60% → +25%/+25%/+50% 最多 160% 效率
    // 玩家离线 6h 拿满 → 6h × 60% × 1.6 = 5.76h 等效在线
    { id: 't_off_eff1', name: '离线效率·I',  icon: '💤', type: TALENT_TYPES.FUNCTION, function: 'offline_efficiency', pctAdd: 25, cost: 200000, row: 3, col: 0, prereq: [] },
    { id: 't_off_eff2', name: '离线效率·II', icon: '💤', type: TALENT_TYPES.FUNCTION, function: 'offline_efficiency', pctAdd: 25, cost: 350000, row: 3, col: 1, prereq: ['t_off_eff1'] },
    { id: 't_off_eff3', name: '离线效率·III', icon: '💤', type: TALENT_TYPES.FUNCTION, function: 'offline_efficiency', pctAdd: 50, cost: 600000, row: 3, col: 2, prereq: ['t_off_eff2'] },
    // 离线时长 (4 节点): 基础 6h → +2h/+2h/+2h/+2h 最多 14h
    { id: 't_off_time1', name: '离线时长·I',  icon: '⏰', type: TALENT_TYPES.FUNCTION, function: 'offline_time', hourAdd: 2, cost: 250000, row: 4, col: 0, prereq: [] },
    { id: 't_off_time2', name: '离线时长·II', icon: '⏰', type: TALENT_TYPES.FUNCTION, function: 'offline_time', hourAdd: 2, cost: 400000, row: 4, col: 1, prereq: ['t_off_time1'] },
    { id: 't_off_time3', name: '离线时长·III', icon: '⏰', type: TALENT_TYPES.FUNCTION, function: 'offline_time', hourAdd: 2, cost: 700000, row: 4, col: 2, prereq: ['t_off_time2'] },
    { id: 't_off_time4', name: '离线时长·IV', icon: '⏰', type: TALENT_TYPES.FUNCTION, function: 'offline_time', hourAdd: 2, cost: 1200000, row: 5, col: 0, prereq: ['t_off_time3'] },

    // ========== 宠物槽位天赋 ==========
    { id: 't_pet_slot1', name: '宠物上阵位·I', icon: '🐾', type: TALENT_TYPES.FUNCTION, function: 'unlock_pet_slot', slotAdd: 1, cost: 100000, requiredChapter: 5, prereq: [] },
    { id: 't_pet_slot2', name: '宠物上阵位·II', icon: '🐾', type: TALENT_TYPES.FUNCTION, function: 'unlock_pet_slot', slotAdd: 1, cost: 300000, requiredChapter: 15, prereq: [] }
];

// 计算天赋节点的最大等级（差异化）
//   v3.x：每节点按 category 取 TALENT_CATEGORY_CONFIG.maxLevel
//   默认 fallback 到 TALENT_MAX_LEVEL（100）
function getTalentMaxLevel(talent) {
    if (!talent) return TALENT_MAX_LEVEL;
    if (talent.maxLevel) return talent.maxLevel;
    if (talent.category && TALENT_CATEGORY_CONFIG[talent.category]) {
        return TALENT_CATEGORY_CONFIG[talent.category].maxLevel;
    }
    return TALENT_MAX_LEVEL;
}

// 获取天赋节点的单次升级价值（差异化）
function getTalentValue(talent) {
    if (!talent) return 0;
    if (talent.value !== undefined) return talent.value;
    if (talent.category && TALENT_CATEGORY_CONFIG[talent.category]) {
        return TALENT_CATEGORY_CONFIG[talent.category].valuePerLvl;
    }
    return 0;
}

// 获取天赋节点的金币倍数
function getTalentCostMult(talent) {
    if (!talent) return 1;
    if (talent.category && TALENT_CATEGORY_CONFIG[talent.category]) {
        return TALENT_CATEGORY_CONFIG[talent.category].costMult;
    }
    return 1;
}

// 获取天赋节点基础价（按节点序号 0-4 取原版价格，再乘 costMult）
function getTalentBaseCost(talent) {
    if (!talent) return 0;
    if (talent.type === 'function') return talent.cost;  // 功能型直接用 cost
    // 找节点在 5 节点链中的位置（I=0, II=1, III=2, IV=3, V=4）
    // 匹配 id 末尾的 1-5 数字
    var match = talent.id.match(/([1-5])$/);
    var idx = match ? parseInt(match[1], 10) - 1 : 0;
    if (idx < 0 || idx >= TALENT_BASE_COST.length) idx = 0;
    return TALENT_BASE_COST[idx] * getTalentCostMult(talent);
}

// 获取节点是否为百分比加成（atk/def/hp/spd 走 pct 通道，crit/critDmg 走 flat）
function getTalentIsPct(talent) {
    if (!talent) return false;
    if (talent.isPct !== undefined) return talent.isPct;
    if (talent.category && TALENT_CATEGORY_CONFIG[talent.category]) {
        return TALENT_CATEGORY_CONFIG[talent.category].isPct;
    }
    return false;
}

// 计算天赋当前等级的下一次购买成本
//   - 功能型：直接返回 cost（一次性购买）
//   - 属性型：基础价 × (当前次数 + 1)（线性增长）
function getTalentCost(talent, currentLevel) {
    if (talent.type === 'function') {
        return talent.cost;
    }
    return Math.floor(getTalentBaseCost(talent) * (currentLevel + 1));
}

// 计算天赋购买总成本（用于回退/预览等场景）
//   - 属性型：基础价 × (1 + 2 + ... + N) = 基础价 × N × (N + 1) / 2
function getTalentTotalCost(talent, totalLevels) {
    if (talent.type === 'function') {
        return totalLevels > 0 ? talent.cost : 0;
    }
    return Math.floor(getTalentBaseCost(talent) * totalLevels * (totalLevels + 1) / 2);
}

// 判断天赋是否可购买：
//   - 功能型：未激活 + 前置条件全部满足（前置可能是 stat 或 function）
//   - 属性型：未点满 + 前置条件全部满足
//     v3.x：每节点 maxLevel 独立（按 category），前置节点只需"激活"（Lv ≥ 1）即可解锁
function isTalentAvailable(talentId, activatedTalents, talentLevels) {
    var talent=null;var _es5_7=TALENT_DATA;for(var _es5_8=0;_es5_8<_es5_7.length;_es5_8++){if(_es5_7[_es5_8].id === talentId){talent=_es5_7[_es5_8];break;}};
    if (!talent) return false;

    var maxLevel = getTalentMaxLevel(talent);

    // 已点满：不可再点
    if (talent.type === 'function') {
        if (activatedTalents.indexOf(talentId) !== -1) return false;
    } else {
        var lv = (talentLevels && talentLevels[talentId]) || 0;
        if (lv >= maxLevel) return false;
    }

    // 根节点无前置
    if (talent.prereq.length === 0) {
        // 检查章节前置
        if (talent.requiredChapter && typeof gameState !== 'undefined' && gameState) {
            var maxSt = GameState.get("maxStage") || 0;
            if (maxSt < talent.requiredChapter) return false;
        }
        return true;
    }

    // 全部前置需满足
    for (var i = 0; i < talent.prereq.length; i++) {
        var pId = talent.prereq[i];
        var pTalent=null;var _es5_9=TALENT_DATA;for(var _es5_10=0;_es5_10<_es5_9.length;_es5_10++){if(_es5_9[_es5_10].id === pId){pTalent=_es5_9[_es5_10];break;}};
        if (!pTalent) return false;
        if (pTalent.type === 'function') {
            // 功能型前置：必须已激活
            if (activatedTalents.indexOf(pId) === -1) return false;
        } else {
            // v3.x：属性型前置：Lv ≥ 1 即可（即"激活"）
            var pLv = (talentLevels && talentLevels[pId]) || 0;
            if (pLv < 1) return false;
        }
    }
    return true;
}

// v3.x：按 stat 类型计算该族天赋累计加成 %
//   用于 UI 显示每行"当前加成：+X%"
//   公式：sum(talent.value * currentLevel) for all talents in stat group
function getTalentStatBonusPct(stat, talentLevels) {
    var total = 0;
    for (var i = 0; i < TALENT_DATA.length; i++) {
        var t = TALENT_DATA[i];
        if (t.type === TALENT_TYPES.STAT && t.stat === stat) {
            var lv = (talentLevels && talentLevels[t.id]) || 0;
            if (lv > 0) {
                total += getTalentValue(t) * lv;
            }
        }
    }
    return total;
}

// v3.x：获取 6 组属性天赋的当前加成（用于 UI 显示每行"当前加成"）
//   返回 [{stat, name, icon, bonusPct, activatedCount, totalCount, maxLevel, totalPct}, ...]
function getTalentGroupSummary(talentLevels) {
    var groups = [
        { stat: 'atk',     name: '攻击强化', icon: '⚔', category: 'atk' },
        { stat: 'def',     name: '防御强化', icon: '🛡', category: 'def' },
        { stat: 'hp',      name: '生命强化', icon: '❤', category: 'hp' },
        { stat: 'spd',     name: '速度强化', icon: '⚡', category: 'spd' },
        { stat: 'crit',    name: '暴击强化', icon: '💥', category: 'crit' },
        { stat: 'critDmg', name: '暴伤强化', icon: '🔥', category: 'critDmg' }
    ];
    for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        g.bonusPct = getTalentStatBonusPct(g.stat, talentLevels);
        g.maxLevel = TALENT_CATEGORY_CONFIG[g.category].maxLevel;
        g.valuePerLvl = TALENT_CATEGORY_CONFIG[g.category].valuePerLvl;
        g.totalPct = g.maxLevel * g.valuePerLvl * 5;  // 5 节点链满级总加成
        var activated = 0;
        for (var j = 0; j < TALENT_DATA.length; j++) {
            var t = TALENT_DATA[j];
            if (t.type === TALENT_TYPES.STAT && t.stat === g.stat) {
                var lv = (talentLevels && t.id in talentLevels) ? (talentLevels[t.id] || 0) : 0;
                if (lv > 0) activated++;
            }
        }
        g.activatedCount = activated;
        g.totalCount = 5;
    }
    return groups;
}
