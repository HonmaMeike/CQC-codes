// ========== 技能定义 ==========

var SKILL_DATA = {
    // === 骑士技能 ===
    shield_bash: {
        id: 'shield_bash', name: '盾击', icon: '\u{1F6E1}',
        desc: '用盾牌猛击敌人，造成150%攻击力的物理伤害',
        type: 'active', target: 'enemy_single', cd: 3,
        multiplier: 1.5, dmgType: 'physical',
        mpCost: 15,
        aiPriority: 'front_enemy'
    },
    holy_shield: {
        id: 'holy_shield', name: '圣盾', icon: '\u2728',
        desc: '为自己套上白甲，吸收骑士自身最大生命80%的伤害，持续5秒',
        type: 'active', target: 'self', cd: 8,
        shieldPct: 0.8, duration: 5000,
        mpCost: 30,
        aiPriority: 'hp_low_self'
    },
    war_cry: {
        id: 'war_cry', name: '战吼', icon: '\u{1F4A2}',
        desc: '发出战吼，提升全队20%攻击力，持续8秒',
        type: 'active', target: 'team', cd: 12,
        atkBuff: 0.2, duration: 8000,
        mpCost: 40,
        aiPriority: 'start'
    },
    iron_wall: {
        id: 'iron_wall', name: '铁壁', icon: '\u{1F9E1}',
        desc: '被动：受到的伤害降低15%',
        type: 'passive',
        dmgReduction: 0.15
    },

    // === 法师技能 ===
    fireball: {
        id: 'fireball', name: '火球术', icon: '\u{1F525}',
        desc: '发射火球，造成200%攻击力的法术伤害',
        type: 'active', target: 'enemy_single', cd: 3,
        multiplier: 2.0, dmgType: 'magical',
        mpCost: 20,
        aiPriority: 'front_enemy'
    },
    frost_nova: {
        id: 'frost_nova', name: '冰霜新星', icon: '\u{2744}',
        desc: '释放冰环，对所有敌人造成120%攻击力的法术伤害并减速50%',
        type: 'active', target: 'enemy_all', cd: 8,
        multiplier: 1.2, dmgType: 'magical',
        mpCost: 35,
        aiPriority: 'enemy_dense'
    },
    arcane_blast: {
        id: 'arcane_blast', name: '奥术冲击', icon: '\u{1F300}',
        desc: '聚集奥术能量，造成 250% 攻击力的法术伤害',
        // v3.x 平衡调整：multiplier 3.0→2.5，cd 6→7（高倍率降温）
        type: 'active', target: 'enemy_single', cd: 7,
        multiplier: 2.5, dmgType: 'magical',
        mpCost: 40,
        aiPriority: 'elite_enemy'
    },
    mana_shield: {
        id: 'mana_shield', name: '法力护盾', icon: '\u{1F9EE}',
        desc: '被动：将受到伤害的20%转化为法力值（回复MP）',
        type: 'passive',
        dmgToMana: 0.2
    },

    // === 刺客技能 ===
    backstab: {
        id: 'backstab', name: '背刺', icon: '\u{1F5E1}',
        desc: '从背后攻击，造成 220% 攻击力的物理伤害，暴击率+20%',
        // v3.x 平衡调整：multiplier 2.5→2.2，critBonus 30→20（高倍率降温）
        type: 'active', target: 'enemy_single', cd: 4,
        multiplier: 2.2, dmgType: 'physical', critBonus: 20,
        mpCost: 20,
        aiPriority: 'back_enemy'
    },
    poison_blade: {
        id: 'poison_blade', name: '淬毒', icon: '\u{1F340}',
        desc: '使武器带毒，攻击附带每秒20%攻击力的毒伤，持续5秒',
        type: 'active', target: 'self', cd: 6,
        poisonDmg: 0.2, poisonDur: 5000,
        mpCost: 25,
        aiPriority: 'start'
    },
    shadow_step: {
        id: 'shadow_step', name: '暗影步', icon: '\u{1F464}',
        desc: '遁入暗影，闪避下一次受到的伤害',
        type: 'active', target: 'self', cd: 10,
        dodgeNext: true,
        mpCost: 30,
        aiPriority: 'hp_low_self'
    },
    death_mark: {
        id: 'death_mark', name: '死亡标记', icon: '\u{2620}',
        desc: '标记一个敌人，使其受到的伤害增加30%，持续8秒',
        type: 'active', target: 'enemy_single', cd: 10,
        vulnDebuff: 0.3, duration: 8000,
        mpCost: 35,
        aiPriority: 'elite_enemy'
    },

    // === 召唤师技能 ===
    summon_wolf: {
        id: 'summon_wolf', name: '召唤灵狼', icon: '\u{1F43A}',
        desc: '召唤一只灵狼协助战斗，继承50%攻击力和100%生命',
        type: 'active', target: 'summon', cd: 15,
        summonAtk: 0.5, summonHp: 1.0,
        mpCost: 45,
        aiPriority: 'start'
    },
    dark_pact: {
        id: 'dark_pact', name: '黑暗契约', icon: '\u{1F5E1}',
        desc: '牺牲召唤物，恢复全队20%生命',
        type: 'active', target: 'team', cd: 12,
        healPct: 0.2,
        mpCost: 50,
        aiPriority: 'team_hp_low'
    },
    soul_link: {
        id: 'soul_link', name: '灵魂链接', icon: '\u{1F517}',
        desc: '链接全队，分担受到的伤害（每人10%）',
        type: 'active', target: 'team', cd: 15,
        dmgShare: 0.1, duration: 10000,
        mpCost: 50,
        aiPriority: 'start'
    },
    summon_phoenix: {
        id: 'summon_phoenix', name: '召唤凤凰', icon: '\u{1F525}',
        desc: '召唤一只凤凰，造成100%攻击力的范围法伤并灼烧敌人',
        type: 'active', target: 'summon', cd: 60,
        summonAtk: 0.8, summonHp: 0.6, aoe: true,
        mpCost: 70,
        aiPriority: 'elite_enemy'
    },

    // === 战士技能 ===
    whirlwind: {
        id: 'whirlwind', name: '旋风斩', icon: '\u{1F300}',
        desc: '旋转攻击，对所有敌人造成130%攻击力的物理伤害',
        type: 'active', target: 'enemy_all', cd: 5,
        multiplier: 1.3, dmgType: 'physical',
        mpCost: 30,
        aiPriority: 'enemy_dense'
    },
    blood_thirst: {
        id: 'blood_thirst', name: '嗜血', icon: '\u{2764}',
        desc: '攻击时恢复造成伤害的15%生命，持续8秒',
        type: 'active', target: 'self', cd: 10,
        lifeSteal: 0.15, duration: 8000,
        mpCost: 25,
        aiPriority: 'hp_low_self'
    },
    charge: {
        id: 'charge', name: '冲锋', icon: '\u{1F4A5}',
        desc: '冲向敌人，造成180%攻击力的物理伤害并眩晕2秒',
        type: 'active', target: 'enemy_single', cd: 7,
        multiplier: 1.8, dmgType: 'physical', stun: 2000,
        mpCost: 30,
        aiPriority: 'back_enemy'
    },
    berserk: {
        id: 'berserk', name: '狂怒', icon: '\u{1F4AA}',
        desc: '被动：生命低于30%时，攻击力提升50%',
        type: 'passive',
        berserkAtk: 0.5, berserkHp: 0.3
    },

    // === 贤者技能 ===
    //   v3.x 平衡调整：治疗公式从「按 atk 计算」改为「按目标 maxHp 百分比」
    //   原因：sage base atk 仅 18，按 2.0× 计算 = 36 治疗，奶不动坦克起步 225 HP
    //   新公式：healMult × 目标 maxHp = 0.4 × 坦克 maxHp，奶量稳定
    heal: {
        id: 'heal', name: '治愈术', icon: '\u{1F49A}',
        desc: '恢复一名队友 40% 最大生命值',
        type: 'active', target: 'ally_lowest_hp', cd: 4,
        healMult: 0.4, healStat: 'maxHp',
        mpCost: 25,
        aiPriority: 'ally_low_hp'
    },
    blessing: {
        id: 'blessing', name: '祝福', icon: '\u{2728}',
        desc: '提升全队15%防御和15%攻击，持续10秒',
        type: 'active', target: 'team', cd: 12,
        atkBuff: 0.15, defBuff: 0.15, duration: 10000,
        mpCost: 45,
        aiPriority: 'start'
    },
    purify: {
        id: 'purify', name: '净化', icon: '\u{1F4A7}',
        desc: '移除全队的负面效果并恢复10%生命',
        type: 'active', target: 'team', cd: 10,
        healPct: 0.1, cleanse: true,
        mpCost: 35,
        aiPriority: 'team_debuff'
    },
    divine_light: {
        id: 'divine_light', name: '圣光', icon: '\u{2600}',
        desc: '被动：每秒恢复全队1%生命',
        type: 'passive',
        regenPct: 0.01, interval: 1000
    },

    // === 亡灵法师技能 ===
    death_bolt: {
        id: 'death_bolt', name: '死亡之箭', icon: '\u{1F480}',
        desc: '发射死亡能量，造成220%攻击力的暗影伤害',
        type: 'active', target: 'enemy_single', cd: 3,
        multiplier: 2.2, dmgType: 'magical',
        mpCost: 20,
        aiPriority: 'front_enemy'
    },
    raise_dead: {
        id: 'raise_dead', name: '亡灵复生', icon: '\u{1FAA6}',
        desc: '复活一个阵亡的敌人成为己方骷髅，持续15秒',
        type: 'active', target: 'dead_enemy', cd: 20,
        mpCost: 60,
        aiPriority: 'elite_enemy'
    },
    curse: {
        id: 'curse', name: '诅咒', icon: '\u{1F52E}',
        desc: '诅咒所有敌人，降低20%攻击力和防御力，持续10秒',
        type: 'active', target: 'enemy_all', cd: 10,
        atkDebuff: 0.2, defDebuff: 0.2, duration: 10000,
        mpCost: 40,
        aiPriority: 'start'
    },
    soul_drain: {
        id: 'soul_drain', name: '灵魂汲取', icon: '\u{1F0CF}',
        desc: '吸取目标生命，造成150%攻击力伤害并恢复等量生命',
        type: 'active', target: 'enemy_single', cd: 6,
        multiplier: 1.5, dmgType: 'magical', lifeSteal: 1.0,
        mpCost: 30,
        aiPriority: 'hp_low_self'
    },

    // === 剑客技能 ===
    sword_dance: {
        id: 'sword_dance', name: '剑舞', icon: '\u{1F6E1}',
        desc: '连续攻击3次，每次造成80%攻击力的物理伤害',
        type: 'active', target: 'enemy_single', cd: 5,
        multiHit: 3, multiplier: 0.8, dmgType: 'physical',
        mpCost: 25,
        aiPriority: 'front_enemy'
    },
    quick_slash: {
        id: 'quick_slash', name: '居合斩', icon: '\u{26E8}',
        desc: '极速拔刀，造成 230% 攻击力的物理伤害，暴击率+10%',
        // v3.x 平衡调整：multiplier 3.0→2.3，critBonus 20→10（高倍率降温）
        type: 'active', target: 'enemy_single', cd: 7,
        multiplier: 2.3, dmgType: 'physical', critBonus: 10,
        mpCost: 35,
        aiPriority: 'elite_enemy'
    },
    counter: {
        id: 'counter', name: '反击', icon: '\u{1F500}',
        desc: '进入反击姿态，闪避下一次攻击并立即反击200%伤害',
        type: 'active', target: 'self', cd: 8,
        counterDmg: 2.0,
        mpCost: 25,
        aiPriority: 'hp_low_self'
    },
    final_strike: {
        id: 'final_strike', name: '绝命一击', icon: '\u{1F4A5}',
        desc: '被动：生命低于20%时，暴击伤害提升100%',
        type: 'passive',
        finalCritDmg: 1.0, finalHp: 0.2
    },

    // === 新增技能 ===
    // 骑士新增
    holy_armor: {
        id: 'holy_armor', name: '圣光护甲', icon: '\u{1F9E1}',
        desc: '被动：防御力提升20%',
        type: 'passive',
        defBonusPct: 0.2
    },
    sacred_shield: {
        id: 'sacred_shield', name: '神圣壁垒', icon: '\u{1F6E1}',
        desc: '为全队套上白甲，每名队员获得骑士自身最大生命30%的护盾值，持续6秒',
        type: 'active', target: 'team', cd: 12,
        shieldPct: 0.3, duration: 6000,
        mpCost: 50,
        aiPriority: 'team_hp_low'
    },

    // 骑士新增群体嘲讽
    holy_taunt: {
        id: 'holy_taunt', name: '神圣嘲讽', icon: '\u{1F6E1}',
        desc: '嘲讽所有敌人，强制敌人攻击自己6秒，并提升自身50%防御',
        type: 'active', target: 'self', cd: 15,
        tauntDuration: 6000, defBuff: 0.5, duration: 6000,
        mpCost: 35,
        aiPriority: 'start'
    },

    // 法师新增
    arcane_power: {
        id: 'arcane_power', name: '奥术之力', icon: '\u{1F31F}',
        desc: '被动：攻击力提升15%',
        type: 'passive',
        atkBonusPct: 0.15
    },
    meteor_storm: {
        id: 'meteor_storm', name: '流星风暴', icon: '\u{2604}',
        desc: '召唤流星攻击所有敌人，造成250%攻击力的法术伤害',
        type: 'active', target: 'enemy_all', cd: 10,
        multiplier: 2.5, dmgType: 'magical',
        mpCost: 60,
        aiPriority: 'enemy_dense'
    },

    // 刺客新增
    assassins_mark: {
        id: 'assassins_mark', name: '刺客印记', icon: '\u{1F3AF}',
        desc: '被动：暴击率提升10%',
        type: 'passive',
        critBonusPct: 10
    },
    fan_of_knives: {
        id: 'fan_of_knives', name: '飞刀乱舞', icon: '\u{1F5E1}',
        desc: '投掷大量飞刀攻击所有敌人，造成150%攻击力的物理伤害',
        type: 'active', target: 'enemy_all', cd: 7,
        multiplier: 1.5, dmgType: 'physical',
        mpCost: 30,
        aiPriority: 'enemy_dense'
    },

    // 召唤师新增
    summoners_will: {
        id: 'summoners_will', name: '召唤意志', icon: '\u{1F4A1}',
        desc: '被动：召唤物攻击力提升30%',
        type: 'passive',
        summonAtkBonus: 0.3
    },
    summon_elemental: {
        id: 'summon_elemental', name: '召唤元素', icon: '\u{1F525}',
        desc: '召唤一只元素精灵，对全体敌人造成80%攻击力的法术伤害',
        type: 'active', target: 'summon', cd: 30,
        summonAtk: 0.6, summonHp: 0.5, aoe: true,
        mpCost: 55,
        aiPriority: 'elite_enemy'
    },

    // 战士新增
    warriors_soul: {
        id: 'warriors_soul', name: '战士之魂', icon: '\u{1F4AA}',
        desc: '被动：生命上限提升20%',
        type: 'passive',
        hpBonusPct: 0.2
    },
    earthquake: {
        id: 'earthquake', name: '地震', icon: '\u{1F30D}',
        desc: '猛踏地面，对所有敌人造成160%攻击力的物理伤害并眩晕1秒',
        type: 'active', target: 'enemy_all', cd: 10,
        multiplier: 1.6, dmgType: 'physical', stun: 1000,
        mpCost: 40,
        aiPriority: 'enemy_dense'
    },

    // 贤者新增
    holy_grace: {
        id: 'holy_grace', name: '圣恩', icon: '\u{1F54A}',
        desc: '被动：治疗效果提升20%',
        type: 'passive',
        healBonusPct: 0.2
    },
    //   v3.x 平衡调整：群体治疗同样改为按 maxHp 百分比
    mass_heal: {
        id: 'mass_heal', name: '群体治愈', icon: '\u{1F49A}',
        desc: '恢复全队 30% 最大生命值',
        type: 'active', target: 'team', cd: 10,
        healMult: 0.3, healStat: 'maxHp',
        mpCost: 50,
        aiPriority: 'team_hp_low'
    },
    resurrection: {
        id: 'resurrection', name: '复活术', icon: '✨',
        desc: '被动：每回合自动复活一名阵亡队友(30%HP)，Lv10可触发2次，Lv20可触发3次。贤者阵亡后失效。',
        type: 'passive',
        reviveHpPct: 0.3,
        maxTriggersBase: 1,
        maxTriggersLv10: 2,
        maxTriggersLv20: 3
    },

    // 亡灵法师新增
    death_aura: {
        id: 'death_aura', name: '死亡光环', icon: '\u{2622}',
        desc: '被动：法力值上限提升20%',
        type: 'passive',
        mpBonusPct: 0.2
    },
    soul_storm: {
        id: 'soul_storm', name: '灵魂风暴', icon: '\u{1F300}',
        desc: '释放灵魂能量风暴，对所有敌人造成200%攻击力的暗影伤害',
        type: 'active', target: 'enemy_all', cd: 10,
        multiplier: 2.0, dmgType: 'magical',
        mpCost: 55,
        aiPriority: 'enemy_dense'
    },

    // 剑客新增
    blade_mastery: {
        id: 'blade_mastery', name: '剑术大师', icon: '\u{2694}',
        desc: '被动：暴击伤害提升30%',
        type: 'passive',
        critDmgBonus: 30
    },
    heavenly_slash: {
        id: 'heavenly_slash', name: '天翔斩', icon: '\u2601',
        desc: '跃起向下劈斩，对所有敌人造成120%攻击力的物理伤害',
        type: 'active', target: 'enemy_all', cd: 6,
        multiplier: 1.2, dmgType: 'physical',
        mpCost: 25,
        aiPriority: 'enemy_dense'
    },

    // === v5.1 新增被动技能 ===
    // 刺客：暗影精通
    shadow_mastery: {
        id: 'shadow_mastery', name: '暗影精通', icon: '\u{1F464}',
        desc: '被动：速度提升12%',
        type: 'passive',
        spdBonusPct: 0.12
    },
    // 召唤师：召唤护盾
    summon_shield: {
        id: 'summon_shield', name: '召唤护盾', icon: '\u{1F6E1}',
        desc: '被动：召唤物生命上限提升40%',
        type: 'passive',
        summonHpBonus: 0.4
    },
    // 亡灵法师：亡灵之力
    undead_power: {
        id: 'undead_power', name: '亡灵之力', icon: '\u{2620}',
        desc: '被动：暗影伤害提升25%',
        type: 'passive',
        shadowDmgBonus: 0.25
    }
};

function getSkillData(id) {
    return SKILL_DATA[id];
}
