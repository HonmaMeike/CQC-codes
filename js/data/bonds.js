// ========== 羁绊效果数据 ==========

var BOND_DATA = [
    {
        id: 'arcane_resonance',
        name: '奥术共鸣',
        desc: '上阵2名法师，全队法术伤害+10%',
        icon: '\u{1F300}',
        condition: { type: 'class_count', classId: 'mage', count: 2 },
        effects: { dmgBonus: 0.10 }
    },
    {
        id: 'iron_wall',
        name: '钢铁壁垒',
        desc: '上阵2名坦克（骑士/战士），全队防御+15%',
        icon: '\u{1F6E1}',
        condition: { type: 'role_count', role: 'tank', count: 2 },
        effects: { defBonus: 0.15 }
    },
    {
        id: 'shadow_assassins',
        name: '暗影刺客',
        desc: '上阵2名刺客/剑客，全队暴击率+8%，暴击伤害+15%',
        icon: '\u{1F5E1}',
        condition: { type: 'class_ids', classIds: ['assassin', 'swordsman'], count: 2 },
        effects: { critBonus: 8, critDmgBonus: 15 }
    },
    {
        id: 'holy_light',
        name: '圣光庇佑',
        desc: '上阵贤者+骑士，全队每秒恢复1%生命',
        icon: '\u{2728}',
        condition: { type: 'class_pair', classIds: ['sage', 'knight'] },
        effects: { hpRegen: 0.01 }
    },
    {
        id: 'dark_alliance',
        name: '黑暗同盟',
        desc: '上阵亡灵法师+召唤师，全队伤害+12%',
        icon: '\u{2620}',
        condition: { type: 'class_ids', classIds: ['necromancer', 'summoner'], count: 2 },
        effects: { dmgBonus: 0.12 }
    },
    {
        id: 'elemental_fury',
        name: '元素之怒',
        desc: '上阵法师+亡灵法师，全队元素精通+20',
        icon: '\u{1F525}',
        condition: { type: 'class_ids', classIds: ['mage', 'necromancer'], count: 2 },
        effects: { elemMasteryBonus: 20 }
    },
    {
        id: 'vanguard',
        name: '先锋队',
        desc: '上阵3种不同职业，全队攻击+10%',
        icon: '\u{2694}',
        condition: { type: 'class_diversity', minCount: 3 },
        effects: { atkBonus: 0.10 }
    },
    {
        id: 'full_team',
        name: '完美阵容',
        desc: '4人全部上阵，全队生命+10%',
        icon: '\u{1F465}',
        condition: { type: 'team_full' },
        effects: { hpBonus: 0.10 }
    }
];

// 计算当前队伍触发的羁绊
function calcActiveBonds(teamHeroes) {
    // teamHeroes: 包含4个位置的英雄数据（可能为空）
    var activeHeroes = [];
    for (var ai = 0; ai < teamHeroes.length; ai++) {
        if (teamHeroes[ai] != null) activeHeroes.push(teamHeroes[ai]);
    }
    var bonds = [];

    if (activeHeroes.length < 2) return bonds;

    var classIds = [];
    var roles = [];
    for (var ri = 0; ri < activeHeroes.length; ri++) {
        classIds.push(activeHeroes[ri].classId);
        var cd = getClassData(activeHeroes[ri].classId);
        roles.push(cd ? cd.role : null);
    }

    for (var bi = 0; bi < BOND_DATA.length; bi++) {
        var bond = BOND_DATA[bi];
        var activated = false;
        var cond = bond.condition;

        switch (cond.type) {
            case 'class_count':
                var cnt = 0;
                for (var ci = 0; ci < classIds.length; ci++) {
                    if (classIds[ci] === cond.classId) cnt++;
                }
                activated = cnt >= cond.count;
                break;
            case 'role_count':
                var rcnt = 0;
                for (var rci = 0; rci < roles.length; rci++) {
                    if (roles[rci] === cond.role) rcnt++;
                }
                activated = rcnt >= cond.count;
                break;
            case 'class_ids':
                var matchCount = 0;
                for (var mi = 0; mi < cond.classIds.length; mi++) {
                    for (var mj = 0; mj < classIds.length; mj++) {
                        if (cond.classIds[mi] === classIds[mj]) { matchCount++; break; }
                    }
                }
                activated = matchCount >= cond.count;
                break;
            case 'class_pair':
                activated = true;
                for (var pi = 0; pi < cond.classIds.length; pi++) {
                    var found = false;
                    for (var pj = 0; pj < classIds.length; pj++) {
                        if (cond.classIds[pi] === classIds[pj]) { found = true; break; }
                    }
                    if (!found) { activated = false; break; }
                }
                break;
            case 'class_diversity':
                var uniqueMap = {};
                for (var ui = 0; ui < classIds.length; ui++) uniqueMap[classIds[ui]] = true;
                var uniqueSize = 0;
                for (var uk in uniqueMap) uniqueSize++;
                activated = uniqueSize >= cond.minCount;
                break;
            case 'team_full':
                activated = activeHeroes.length === 4;
                break;
        }

        if (activated) bonds.push(bond);
    }

    return bonds;
}
