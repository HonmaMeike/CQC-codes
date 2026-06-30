// ========== 状态效果数据 ==========

var STATUS_EFFECTS = {
    // === 负面效果（红色图标） ===
    burn: {
        id: 'burn',
        name: '燃烧',
        icon: '🔥',
        color: '#ff4400',
        type: 'debuff',
        tickInterval: 1000,
        duration: 5000,
        tickDmg: 0.05,       // 每tick造成攻击力5%伤害
        stackable: false,
        desc: '每1秒受到火焰伤害'
    },
    poison: {
        id: 'poison',
        name: '中毒',
        icon: '☠️',
        color: '#7c4d00',
        type: 'debuff',
        tickInterval: 1000,
        duration: 6000,
        tickDmg: 0.04,       // 每tick造成攻击力4%伤害
        stackable: true,
        maxStacks: 3,
        desc: '每1秒受到中毒伤害（可叠加）'
    },
    stun: {
        id: 'stun',
        name: '麻痹',
        icon: '⚡',
        color: '#ffaa00',
        type: 'debuff',
        tickInterval: 0,
        duration: 2000,
        tickDmg: 0,
        stackable: false,
        desc: '无法行动'
    },
    freeze: {
        id: 'freeze',
        name: '冰冻',
        icon: '❄️',
        color: '#4fc3f7',
        type: 'debuff',
        tickInterval: 0,
        duration: 2500,
        tickDmg: 0,
        stackable: false,
        slowPct: 0.5,        // 减速50%
        desc: '无法行动，解冻后减速'
    },
    shock: {
        id: 'shock',
        name: '感电',
        icon: '⚡',
        color: '#bb86fc',
        type: 'debuff',
        tickInterval: 1000,
        duration: 4000,
        tickDmg: 0.03,
        stackable: false,
        vulnPct: 0.2,        // 易伤20%
        desc: '每1秒受到伤害且受到的伤害增加'
    },
    slow: {
        id: 'slow',
        name: '减速',
        icon: '🐢',
        color: '#90caf9',
        type: 'debuff',
        tickInterval: 0,
        duration: 3000,
        tickDmg: 0,
        stackable: false,
        slowPct: 0.4,
        desc: '移动和攻击速度降低'
    },
    // === 正向效果（彩色图标） ===
    regen: {
        id: 'regen',
        name: '回血',
        icon: '💚',
        color: '#4caf50',
        type: 'buff',
        tickInterval: 1000,
        duration: 5000,
        tickHeal: 0.03,      // 每tick恢复最大HP的3%
        stackable: false,
        desc: '每1秒恢复生命'
    },
    atk_up: {
        id: 'atk_up',
        name: '攻击提升',
        icon: '🗡️',
        color: '#ff9800',
        type: 'buff',
        tickInterval: 0,
        duration: 6000,
        statBuff: 'atk',
        buffPct: 0.2,         // 攻击+20%
        stackable: false,
        desc: '攻击力提升'
    },
    def_up: {
        id: 'def_up',
        name: '防御提升',
        icon: '🛡️',
        color: '#2196f3',
        type: 'buff',
        tickInterval: 0,
        duration: 6000,
        statBuff: 'def',
        buffPct: 0.2,
        stackable: false,
        desc: '防御力提升'
    },
    spd_up: {
        id: 'spd_up',
        name: '加速',
        icon: '💨',
        color: '#00e676',
        type: 'buff',
        tickInterval: 0,
        duration: 5000,
        statBuff: 'spd',
        buffPct: 0.3,
        stackable: false,
        desc: '速度提升'
    },
    atk_debuff: {
        id: 'atk_debuff',
        name: '攻击降低',
        icon: '⬇️',
        color: '#e91e63',
        type: 'debuff',
        tickInterval: 0,
        duration: 5000,
        statDebuff: 'atk',
        debuffPct: 0.2,
        stackable: false,
        desc: '攻击力降低'
    },
    def_debuff: {
        id: 'def_debuff',
        name: '防御降低',
        icon: '⬇️',
        color: '#f44336',
        type: 'debuff',
        tickInterval: 0,
        duration: 5000,
        statDebuff: 'def',
        debuffPct: 0.2,
        stackable: false,
        desc: '防御力降低'
    },

    // === 护盾效果 ===
    shield: {
        id: 'shield',
        name: '护盾',
        icon: '🛡',
        color: '#4fc3f7',
        type: 'buff',
        tickInterval: 0,
        duration: 5000,
        stackable: false,
        desc: '受到护盾保护'
    },

    // === 嘲讽效果 ===
    taunt: {
        id: 'taunt',
        name: '嘲讽',
        icon: '🤯',
        color: '#ff4444',
        type: 'buff',
        tickInterval: 0,
        duration: 6000,
        stackable: false,
        desc: '强制敌人攻击自己'
    }
};
