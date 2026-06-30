// ========== 职业体系 ==========

var CLASS_DATA = [
    {
        id: 'knight',
        name: '骑士',
        icon: '\u{1F6E1}',
        desc: '坚不可摧的钢铁防线',
        role: 'tank',
        position: 'front',
        baseStats: { atk: 15, def: 30, hp: 225, spd: 120, crit: 8, critDmg: 225 },
        // v3.x 平衡调整：
        //   atk 0.333 → 0.6   — 修复骑士 atk 转化率仅 1/3、毫无输出的问题
        //   spd 0.571 → 0.7   — 速度收敛，避免与刺客差距 3 倍
        statMultipliers: { atk: 0.6, def: 1.0, hp: 1.0, spd: 0.7 },
        baseMp: 120,
        mpRegen: 3,
        weaponType: 'sword',
        offhandType: 'shield',
        skills: ['shield_bash', 'holy_shield', 'war_cry', 'iron_wall', 'holy_armor', 'sacred_shield', 'holy_taunt'],
        unlocked: true, // 初始免费
        cost: 0
    },
    {
        id: 'mage',
        name: '法师',
        icon: '\u{1F9D9}',
        desc: '毁灭性的元素掌控者',
        role: 'dps',
        position: 'back',
        baseStats: { atk: 38, def: 8, hp: 105, spd: 150, crit: 15, critDmg: 270 },
        statMultipliers: { atk: 0.844, def: 0.267, hp: 0.467, spd: 0.714 },
        baseMp: 240,
        mpRegen: 8,
        weaponType: 'staff',
        offhandType: 'orb',
        skills: ['fireball', 'frost_nova', 'arcane_blast', 'mana_shield', 'arcane_power', 'meteor_storm'],
        unlocked: true, // 初始免费
        cost: 0
    },
    {
        id: 'assassin',
        name: '刺客',
        icon: '\u{1F5E1}',
        desc: '暗影中的致命利刃',
        role: 'dps',
        position: 'back',
        baseStats: { atk: 45, def: 5, hp: 83, spd: 210, crit: 38, critDmg: 330 },
        statMultipliers: { atk: 1.0, def: 0.167, hp: 0.369, spd: 1.0 },
        baseMp: 140,
        mpRegen: 5,
        weaponType: 'dagger',
        offhandType: 'dagger',
        skills: ['backstab', 'poison_blade', 'shadow_step', 'death_mark', 'assassins_mark', 'fan_of_knives', 'shadow_mastery'],
        unlocked: false,
        cost: 10000
    },
    {
        id: 'summoner',
        name: '召唤师',
        icon: '\u{1F500}',
        desc: '异界生灵的支配者',
        role: 'support',
        position: 'back',
        baseStats: { atk: 27, def: 12, hp: 120, spd: 135, crit: 12, critDmg: 240 },
        statMultipliers: { atk: 0.6, def: 0.4, hp: 0.533, spd: 0.643 },
        baseMp: 200,
        mpRegen: 6,
        weaponType: 'tome',
        offhandType: 'tome',
        skills: ['summon_wolf', 'dark_pact', 'soul_link', 'summon_phoenix', 'summoners_will', 'summon_elemental', 'summon_shield'],
        unlocked: false,
        cost: 10000
    },
    {
        id: 'warrior',
        name: '战士',
        icon: '\u{2694}',
        desc: '嗜血狂怒的战场主宰',
        role: 'tank',
        position: 'front',
        baseStats: { atk: 27, def: 23, hp: 195, spd: 143, crit: 12, critDmg: 255 },
        statMultipliers: { atk: 0.6, def: 0.767, hp: 0.867, spd: 0.681 },
        baseMp: 100,
        mpRegen: 3,
        weaponType: 'axe',
        offhandType: 'shield',
        skills: ['whirlwind', 'blood_thirst', 'charge', 'berserk', 'warriors_soul', 'earthquake'],
        unlocked: false,
        cost: 10000
    },
    {
        id: 'sage',
        name: '贤者',
        icon: '\u{1F4DC}',
        desc: '智慧与治愈的化身',
        role: 'healer',
        position: 'back',
        baseStats: { atk: 18, def: 15, hp: 135, spd: 128, crit: 8, critDmg: 225 },
        statMultipliers: { atk: 0.4, def: 0.5, hp: 0.6, spd: 0.610 },
        baseMp: 220,
        mpRegen: 7,
        weaponType: 'staff',
        offhandType: 'orb',
        skills: ['heal', 'blessing', 'purify', 'divine_light', 'holy_grace', 'mass_heal', 'resurrection'],
        unlocked: false,
        cost: 10000
    },
    {
        id: 'necromancer',
        name: '亡灵法师',
        icon: '\u{2620}',
        desc: '死亡之力的操纵者',
        role: 'dps',
        position: 'back',
        baseStats: { atk: 42, def: 6, hp: 98, spd: 143, crit: 18, critDmg: 285 },
        statMultipliers: { atk: 0.933, def: 0.2, hp: 0.436, spd: 0.681 },
        baseMp: 200,
        mpRegen: 6,
        weaponType: 'scythe',
        offhandType: 'tome',
        skills: ['death_bolt', 'raise_dead', 'curse', 'soul_drain', 'death_aura', 'soul_storm', 'undead_power'],
        unlocked: false,
        cost: 10000
    },
    {
        id: 'swordsman',
        name: '剑客',
        icon: '\u{1F5E1}',
        desc: '剑术至极的武道大师',
        role: 'dps',
        position: 'front',
        baseStats: { atk: 33, def: 18, hp: 150, spd: 180, crit: 23, critDmg: 300 },
        // v3.x 平衡调整：spd 0.857 → 0.7  — 速度收敛，保留剑客"中速"定位
        statMultipliers: { atk: 0.733, def: 0.6, hp: 0.667, spd: 0.7 },
        baseMp: 160,
        mpRegen: 5,
        weaponType: 'katana',
        offhandType: 'katana',
        skills: ['sword_dance', 'quick_slash', 'counter', 'final_strike', 'blade_mastery', 'heavenly_slash'],
        unlocked: false,
        cost: 10000
    }
];

function getClassData(id) {
    var _es5_3=null;for(var _es5_2=0;_es5_2<CLASS_DATA.length;_es5_2++){if(CLASS_DATA[_es5_2].id === id){_es5_3=CLASS_DATA[_es5_2];break;}}return _es5_3;
}

function getUnlockedClasses() {
    return CLASS_DATA.filter(function(c) { return c.unlocked; });
}
