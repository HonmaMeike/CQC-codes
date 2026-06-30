// ========== 敌人技能数据 ==========
// 用于给怪物添加技能，使其不再只有普通攻击

var ENEMY_SKILLS = {
    // === 火系技能 ===
    fire_breath: {
        id: 'fire_breath', name: '火焰吐息', icon: '🔥',
        multiplier: 1.5, cd: 5,
        projectile: 'fireball', color: '#ff6600',
        statusEffect: 'burn', statusChance: 0.4, statusDuration: 4000,
        effect: 'explosion',
        chance: 0.5,
        desc: '喷吐火焰，燃烧敌人'
    },
    fire_blast: {
        id: 'fire_blast', name: '爆裂火球', icon: '🔥',
        multiplier: 2.0, cd: 8,
        projectile: 'fireball', color: '#ff4400',
        statusEffect: 'burn', statusChance: 0.6, statusDuration: 5000,
        aoe: true,
        chance: 0.3,
        desc: '发射大火球，爆炸灼烧周围敌人'
    },

    // === 冰系技能 ===
    ice_shard: {
        id: 'ice_shard', name: '冰锥术', icon: '❄️',
        multiplier: 1.4, cd: 5,
        projectile: 'frost', color: '#4fc3f7',
        statusEffect: 'freeze', statusChance: 0.3, statusDuration: 2000,
        chance: 0.4,
        desc: '发射冰锥，冰冻敌人'
    },
    blizzard: {
        id: 'blizzard', name: '暴风雪', icon: '❄️',
        multiplier: 1.3, cd: 10,
        effect: 'nova', color: '#4fc3f7',
        statusEffect: 'slow', statusChance: 0.5, statusDuration: 4000,
        aoe: true,
        chance: 0.25,
        desc: '召唤暴风雪，减速所有敌人'
    },

    // === 暗影系技能 ===
    shadow_bolt: {
        id: 'shadow_bolt', name: '暗影箭', icon: '🌑',
        multiplier: 1.6, cd: 4,
        projectile: 'dark_bolt', color: '#9c27b0',
        statusEffect: 'atk_debuff', statusChance: 0.3, statusDuration: 5000,
        chance: 0.5,
        desc: '发射暗影箭，降低目标攻击力'
    },
    life_drain: {
        id: 'life_drain', name: '生命汲取', icon: '🩸',
        multiplier: 1.3, cd: 8,
        effect: 'dark', color: '#7c0050',
        statusEffect: 'poison', statusChance: 0.5, statusDuration: 6000,
        selfBuff: 'regen', buffDuration: 4000,
        chance: 0.3,
        desc: '吸取生命，使目标中毒并治疗自身'
    },

    // === 物理系技能 ===
    heavy_strike: {
        id: 'heavy_strike', name: '重击', icon: '💥',
        multiplier: 2.0, cd: 6,
        effect: 'explosion', color: '#ffaa44',
        statusEffect: 'stun', statusChance: 0.25, statusDuration: 1500,
        isCrit: true,
        chance: 0.4,
        desc: '重击目标，有概率眩晕'
    },
    roar: {
        id: 'roar', name: '咆哮', icon: '📢',
        multiplier: 1.2, cd: 9,
        effect: 'buff', color: '#ff9800',
        selfBuff: 'atk_up', buffDuration: 6000,
        chance: 0.3,
        aiCondition: 'hp_low',
        desc: '咆哮提升自身攻击力'
    },

    // === 毒系技能 ===
    poison_spit: {
        id: 'poison_spit', name: '毒液喷吐', icon: '☠️',
        multiplier: 1.2, cd: 5,
        effect: 'hit', color: '#7c4d00',
        statusEffect: 'poison', statusChance: 0.6, statusDuration: 6000,
        aoe: true,
        chance: 0.35,
        desc: '喷吐毒液，使敌人中毒'
    },

    // === 雷系技能 ===
    lightning_bolt: {
        id: 'lightning_bolt', name: '闪电链', icon: '⚡',
        multiplier: 1.7, cd: 7,
        effect: 'explosion', color: '#bb86fc',
        statusEffect: 'shock', statusChance: 0.4, statusDuration: 4000,
        aoe: true,
        chance: 0.3,
        desc: '释放闪电，使敌人感电'
    },

    // === 防御系 ===
    iron_hide: {
        id: 'iron_hide', name: '铁皮', icon: '🛡️',
        cd: 12,
        effect: 'shield', color: '#4fc3f7',
        selfBuff: 'def_up', buffDuration: 6000,
        chance: 0.25,
        aiCondition: 'hp_low',
        desc: '提升自身防御力'
    },

    // === BOSS专属技能 ===
    boss_earthquake: {
        id: 'boss_earthquake', name: '地震', icon: '🌋',
        multiplier: 1.8, cd: 15,
        effect: 'explosion', color: '#ff8800',
        statusEffect: 'stun', statusChance: 0.5, statusDuration: 1500,
        aoe: true,
        chance: 0.35,
        desc: '猛踏地面，全体眩晕+伤害'
    },
    boss_enrage: {
        id: 'boss_enrage', name: '狂暴', icon: '💢',
        cd: 20,
        effect: 'buff', color: '#ff1744',
        selfBuff: 'atk_up', buffDuration: 8000,
        chance: 0.25,
        aiCondition: 'hp_low',
        desc: '激发狂暴状态，攻击力大幅提升'
    },
    boss_charge: {
        id: 'boss_charge', name: '冲锋', icon: '💨',
        multiplier: 2.5, cd: 12,
        effect: 'hit', color: '#ff5722',
        statusEffect: 'stun', statusChance: 0.3, statusDuration: 1000,
        isCrit: true,
        chance: 0.3,
        desc: '蓄力冲锋，造成巨额伤害'
    }
};

// 为怪物分配技能（根据怪物特征）
function getMonsterSkills(monsterId, isElite) {
    var skills = [];
    var name = monsterId || '';
    // 火系怪物
    if (name.indexOf('dragon') !== -1 || name.indexOf('hell') !== -1 || name.indexOf('phoenix') !== -1) {
        skills.push('fire_breath');
        if (isElite) skills.push('fire_blast');
    }
    // 冰系怪物
    if (name.indexOf('frost') !== -1 || name.indexOf('ice') !== -1) {
        skills.push('ice_shard');
        if (isElite) skills.push('blizzard');
    }
    // 暗影系怪物
    if (name.indexOf('dark') !== -1 || name.indexOf('lich') !== -1 || name.indexOf('wraith') !== -1 || name.indexOf('void') !== -1 || name.indexOf('shadow') !== -1) {
        skills.push('shadow_bolt');
        if (isElite) skills.push('life_drain');
    }
    // 物理系/野兽
    if (name.indexOf('golem') !== -1 || name.indexOf('stone') !== -1 || name.indexOf('titan') !== -1 || name.indexOf('behemoth') !== -1) {
        skills.push('heavy_strike');
        if (isElite) skills.push('roar');
    }
    // 毒系
    if (name.indexOf('poison') !== -1 || name.indexOf('basilisk') !== -1 || name.indexOf('chimera') !== -1 || name.indexOf('hydra') !== -1) {
        skills.push('poison_spit');
    }
    // 雷系
    if (name.indexOf('lightning') !== -1 || name.indexOf('thunder') !== -1 || name.indexOf('archangel') !== -1) {
        skills.push('lightning_bolt');
    }
    // 精英通用：额外技能
    if (isElite && skills.length === 0) {
        // 没有专属技能的精英怪给通用技能
        var genericSkills = ['heavy_strike', 'shadow_bolt', 'fire_breath', 'ice_shard'];
        skills.push(randPick(genericSkills));
        if (skills.length < 2) skills.push('roar');
    }
    // 普通怪至少1个技能
    if (skills.length === 0) {
        var commonSkills = ['heavy_strike', 'shadow_bolt', 'fire_breath', 'ice_shard', 'poison_spit'];
        skills.push(randPick(commonSkills));
    }
    return skills;
}
