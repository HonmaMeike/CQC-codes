// ========== 成就系统 - 成就数据 v7.7 ==========
// 117个成就，覆盖全部系统维度
// 奖励幂率平滑分配：首成就≈2%上限 → 末成就100%上限
// 上限：金币50万/宝石300/抽奖石100/蛋石100/升级石100

var ACHIEVEMENTS = [
    // ==================== 章节里程碑 ====================
    { id: 'ch5',   name: '初入江湖',   desc: '通关第5章',   icon: '⚔', condition: { type: 'stage', target: 5 },   reward: { gold: 5000, gem: 10 } },
    { id: 'ch10',  name: '新手冒险家', desc: '通关第10章',  icon: '⚔', condition: { type: 'stage', target: 10 },  reward: { gold: 18000, gem: 20 } },
    { id: 'ch20',  name: '远征者',     desc: '通关第20章',  icon: '🛡', condition: { type: 'stage', target: 20 },  reward: { gold: 50000, gem: 60, lotteryStone: 10 } },
    { id: 'ch30',  name: '勇者之路',   desc: '通关第30章',  icon: '🛡', condition: { type: 'stage', target: 30 },  reward: { gold: 100000, gem: 100, petEggStones: 15 } },
    { id: 'ch50',  name: '屠龙者',     desc: '通关第50章',  icon: '🐉', condition: { type: 'stage', target: 50 },  reward: { gold: 180000, gem: 150, upgradeStone: 20 } },
    { id: 'ch75',  name: '位面旅者',   desc: '通关第75章',  icon: '🌌', condition: { type: 'stage', target: 75 },  reward: { gold: 320000, gem: 220, lotteryStone: 40 } },
    { id: 'ch100', name: '传奇永恒',   desc: '通关第100章', icon: '👑', condition: { type: 'stage', target: 100 }, reward: { gold: 500000, gem: 300, petEggStones: 50, upgradeStone: 50 } },

    // ==================== 装备获取 ====================
    { id: 'equip10',   name: '装备收集者', desc: '获得200件装备',  icon: '🎒', condition: { type: 'totalEquip', target: 200 },   reward: { gold: 5000, gem: 10 } },
    { id: 'equip50',   name: '军火库',     desc: '获得1000件装备',  icon: '🏪', condition: { type: 'totalEquip', target: 1000 },   reward: { gold: 30000, gem: 40, lotteryStone: 5 } },
    { id: 'equip200',  name: '武器大师',   desc: '获得4000件装备', icon: '⚜', condition: { type: 'totalEquip', target: 4000 },  reward: { gold: 90000, gem: 90, petEggStones: 15 } },
    { id: 'equip500',  name: '军械专家',   desc: '获得10000件装备', icon: '🗡', condition: { type: 'totalEquip', target: 10000 },  reward: { gold: 200000, gem: 160, upgradeStone: 25 } },
    { id: 'equip1000', name: '神兵收藏家', desc: '获得20000件装备',icon: '⚔', condition: { type: 'totalEquip', target: 20000 }, reward: { gold: 340000, gem: 230, lotteryStone: 40 } },
    { id: 'equip2000', name: '神器宝库',   desc: '获得40000件装备',icon: '👘', condition: { type: 'totalEquip', target: 40000 }, reward: { gold: 500000, gem: 300, petEggStones: 50, upgradeStone: 50 } },

    // ==================== 品质里程碑 ====================
    { id: 'legendOwn',   name: '传说之力', desc: '获得传说(橙)装备', icon: '🌟', condition: { type: 'qualityOwn', target: 4 }, reward: { gold: 10000, gem: 15 } },
    { id: 'immortalOwn', name: '不朽传奇', desc: '获得不朽(金)装备', icon: '💫', condition: { type: 'qualityOwn', target: 5 }, reward: { gold: 50000, gem: 60, lotteryStone: 10 } },
    { id: 'mythicOwn',   name: '神话降世', desc: '获得神话(红)装备', icon: '🔥', condition: { type: 'qualityOwn', target: 6 }, reward: { gold: 150000, gem: 130, petEggStones: 20 } },
    { id: 'rainbowOwn',  name: '彩虹尽头', desc: '获得虹彩(彩)装备', icon: '🌈', condition: { type: 'qualityOwn', target: 7 }, reward: { gold: 400000, gem: 260, upgradeStone: 40 } },
    { id: 'setOwn',      name: '套装收集者', desc: '凑齐1套套装',   icon: '✪', condition: { type: 'setCount', target: 1 }, reward: { gold: 20000, gem: 30 } },
    { id: 'setAll',      name: '套装之王',   desc: '凑齐5种不同套装',icon: '☯', condition: { type: 'setCount', target: 5 }, reward: { gold: 300000, gem: 200, lotteryStone: 50, upgradeStone: 50 } },

    // ==================== 击杀里程碑 ====================
    { id: 'kill100',   name: '初出茅庐', desc: '击杀2000只怪物',   icon: '💀', condition: { type: 'totalKills', target: 2000 },   reward: { gold: 3000, gem: 8 } },
    { id: 'kill500',   name: '小试牛刀', desc: '击杀10000只怪物',   icon: '💀', condition: { type: 'totalKills', target: 10000 },   reward: { gold: 15000, gem: 20 } },
    { id: 'kill2000',  name: '百人斩',   desc: '击杀40000只怪物',  icon: '☠', condition: { type: 'totalKills', target: 40000 },  reward: { gold: 40000, gem: 50, lotteryStone: 8 } },
    { id: 'kill10000', name: '弑神者',   desc: '击杀200000只怪物', icon: '☠', condition: { type: 'totalKills', target: 200000 }, reward: { gold: 100000, gem: 100, petEggStones: 15 } },
    { id: 'kill50000', name: '杀戮机器', desc: '击杀1000000只怪物', icon: '⚰', condition: { type: 'totalKills', target: 1000000 }, reward: { gold: 250000, gem: 190, upgradeStone: 30 } },
    { id: 'kill100k',  name: '死神化身', desc: '击杀2000000只怪物',icon: '💀', condition: { type: 'totalKills', target: 2000000 },reward: { gold: 500000, gem: 300, lotteryStone: 50, petEggStones: 50 } },

    // ==================== 强化里程碑 ====================
    { id: 'enhance5',  name: '初级锻造',   desc: '强化装备到+5',  icon: '🔨', condition: { type: 'enhanceLevel', target: 5 },  reward: { gold: 8000, gem: 12 } },
    { id: 'enhance10', name: '锻造大师',   desc: '强化装备到+10', icon: '⚒', condition: { type: 'enhanceLevel', target: 10 }, reward: { gold: 40000, gem: 50, lotteryStone: 8 } },
    { id: 'enhance15', name: '神器锻造师', desc: '强化装备到+15', icon: '🔱', condition: { type: 'enhanceLevel', target: 15 }, reward: { gold: 120000, gem: 110, petEggStones: 20 } },
    { id: 'enhance20', name: '天工开物',   desc: '强化装备到+20', icon: '⭐', condition: { type: 'enhanceLevel', target: 20 }, reward: { gold: 250000, gem: 190, upgradeStone: 35 } },
    { id: 'enhance25', name: '神匠之手',   desc: '强化装备到+25', icon: '✨', condition: { type: 'enhanceLevel', target: 25 }, reward: { gold: 380000, gem: 250, lotteryStone: 50 } },
    { id: 'enhance30', name: '天道酬勤',   desc: '强化装备到+30', icon: '🏆', condition: { type: 'enhanceLevel', target: 30 }, reward: { gold: 500000, gem: 300, petEggStones: 50, upgradeStone: 50 } },

    // ==================== 融合里程碑 ====================
    { id: 'fuse1',  name: '第一次融合', desc: '进行1次装备升阶',  icon: '🔄', condition: { type: 'totalFuse', target: 1 },   reward: { gold: 5000, gem: 10 } },
    { id: 'fuse5',  name: '初级炼金',   desc: '进行5次装备升阶',  icon: '⚗', condition: { type: 'totalFuse', target: 5 },   reward: { gold: 25000, gem: 35 } },
    { id: 'fuse25', name: '融合大师',   desc: '进行25次装备升阶', icon: '🧪', condition: { type: 'totalFuse', target: 25 },  reward: { gold: 90000, gem: 90, lotteryStone: 15 } },
    { id: 'fuse50', name: '元素调和者', desc: '进行50次装备升阶', icon: '🔬', condition: { type: 'totalFuse', target: 50 },  reward: { gold: 220000, gem: 170, petEggStones: 30 } },
    { id: 'fuse100',name: '炼金宗师',   desc: '进行100次装备升阶',icon: '🧬', condition: { type: 'totalFuse', target: 100 }, reward: { gold: 500000, gem: 300, upgradeStone: 50, lotteryStone: 50 } },

    // ==================== 爬塔里程碑 ====================
    { id: 'tower30',  name: '爬塔新手', desc: '爬到塔第30层',  icon: '🏗', condition: { type: 'towerFloor', target: 30 },  reward: { gold: 6000, gem: 10 } },
    { id: 'tower75',  name: '登塔者',   desc: '爬到塔第75层',  icon: '🏔', condition: { type: 'towerFloor', target: 75 },  reward: { gold: 25000, gem: 35, lotteryStone: 5 } },
    { id: 'tower150', name: '登塔勇者', desc: '爬到塔第150层', icon: '🏔', condition: { type: 'towerFloor', target: 150 }, reward: { gold: 80000, gem: 80, petEggStones: 15 } },
    { id: 'tower300', name: '通天者',   desc: '爬到塔第300层', icon: '🏰', condition: { type: 'towerFloor', target: 300 }, reward: { gold: 200000, gem: 160, upgradeStone: 25 } },
    { id: 'tower450', name: '云端漫步', desc: '爬到塔第450层', icon: '☁', condition: { type: 'towerFloor', target: 450 }, reward: { gold: 340000, gem: 230, lotteryStone: 40 } },
    { id: 'tower600', name: '穹顶之上', desc: '爬到塔第600层', icon: '🚀', condition: { type: 'towerFloor', target: 600 }, reward: { gold: 500000, gem: 300, petEggStones: 50, upgradeStone: 50 } },

    // ==================== 金币里程碑 ====================
    { id: 'gold200k',  name: '第一桶金', desc: '累计获得20万金币',   icon: '💰', condition: { type: 'totalGold', target: 200000 },    reward: { gold: 3000, gem: 8 } },
    { id: 'gold2m', name: '小有积蓄', desc: '累计获得200万金币',  icon: '💰', condition: { type: 'totalGold', target: 2000000 },   reward: { gold: 15000, gem: 20 } },
    { id: 'gold20m',   name: '百万富翁', desc: '累计获得2000万金币', icon: '💎', condition: { type: 'totalGold', target: 20000000 },  reward: { gold: 50000, gem: 60, lotteryStone: 10 } },
    { id: 'gold100m',   name: '富甲一方', desc: '累计获得1亿金币', icon: '🏦', condition: { type: 'totalGold', target: 100000000 },  reward: { gold: 120000, gem: 110, petEggStones: 20 } },
    { id: 'gold200m',  name: '富可敌国', desc: '累计获得2亿金币',icon: '🏰', condition: { type: 'totalGold', target: 200000000 }, reward: { gold: 220000, gem: 170, upgradeStone: 30 } },
    { id: 'gold1b',  name: '金山银海', desc: '累计获得10亿金币',icon: '👑', condition: { type: 'totalGold', target: 1000000000 }, reward: { gold: 500000, gem: 300, lotteryStone: 50, petEggStones: 50 } },

    // ==================== 宠物里程碑 ====================
    { id: 'pet3',  name: '宠物新手',   desc: '拥有3只宠物',     icon: '🐾', condition: { type: 'petCount', target: 3 },  reward: { gold: 5000, gem: 10 } },
    { id: 'pet10', name: '宠物爱好者', desc: '拥有10只宠物',    icon: '🐾', condition: { type: 'petCount', target: 10 }, reward: { gold: 30000, gem: 40, lotteryStone: 8 } },
    { id: 'pet20', name: '宠物大师',   desc: '拥有20只宠物',    icon: '🐾', condition: { type: 'petCount', target: 20 }, reward: { gold: 120000, gem: 110, petEggStones: 20 } },
    { id: 'pet30', name: '全图鉴',     desc: '拥有全部30只宠物',icon: '🏆', condition: { type: 'petCount', target: 30 }, reward: { gold: 500000, gem: 300, upgradeStone: 50, lotteryStone: 50 } },

    // ==================== 宠物升星 ====================
    { id: 'petStar3',  name: '三星宠物', desc: '任何宠物达到3星', icon: '⭐', condition: { type: 'petStar', target: 3 },  reward: { gold: 8000, gem: 12 } },
    { id: 'petStar5',  name: '五星至尊', desc: '任何宠物达到5星', icon: '🌟', condition: { type: 'petStar', target: 5 },  reward: { gold: 50000, gem: 60, lotteryStone: 10 } },
    { id: 'petStar7',  name: '七星耀世', desc: '任何宠物达到7星', icon: '🌠', condition: { type: 'petStar', target: 7 },  reward: { gold: 150000, gem: 130, petEggStones: 25 } },
    { id: 'petStar9',  name: '九星归一', desc: '任何宠物达到9星', icon: '☀', condition: { type: 'petStar', target: 9 },  reward: { gold: 320000, gem: 220, upgradeStone: 40 } },
    { id: 'petStar10', name: '满星传说', desc: '任何宠物达到10星',icon: '🌞', condition: { type: 'petStar', target: 10 }, reward: { gold: 500000, gem: 300, lotteryStone: 50, petEggStones: 50, upgradeStone: 50 } },

    // ==================== 宠物进化 ====================
    { id: 'evolve1',  name: '第一次进化', desc: '进化1只宠物',  icon: '🔮', condition: { type: 'totalEvolve', target: 1 },  reward: { gold: 5000, gem: 10 } },
    { id: 'evolve5',  name: '进化大师',   desc: '进化5只宠物',  icon: '⚡', condition: { type: 'totalEvolve', target: 5 },  reward: { gold: 40000, gem: 50, lotteryStone: 10 } },
    { id: 'evolve10', name: '生命升华',   desc: '进化10只宠物', icon: '🧬', condition: { type: 'totalEvolve', target: 10 }, reward: { gold: 150000, gem: 130, petEggStones: 25 } },
    { id: 'evolve20', name: '造物主',     desc: '进化20只宠物', icon: '🌱', condition: { type: 'totalEvolve', target: 20 }, reward: { gold: 500000, gem: 300, upgradeStone: 50, lotteryStone: 50 } },

    // ==================== 宝石合成 ====================
    { id: 'gemLv3',  name: '宝石学徒', desc: '合成一颗Lv.3宝石',  icon: '💎', condition: { type: 'gemLevel', target: 3 },  reward: { gold: 5000, gem: 10 } },
    { id: 'gemLv5',  name: '宝石工匠', desc: '合成一颗Lv.5宝石',  icon: '💎', condition: { type: 'gemLevel', target: 5 },  reward: { gold: 30000, gem: 40, lotteryStone: 8 } },
    { id: 'gemLv10', name: '宝石大师', desc: '合成一颗Lv.10宝石', icon: '💎', condition: { type: 'gemLevel', target: 10 }, reward: { gold: 120000, gem: 110, petEggStones: 20 } },
    { id: 'gemLv15', name: '宝石宗师', desc: '合成一颗Lv.15宝石', icon: '🔷', condition: { type: 'gemLevel', target: 15 }, reward: { gold: 400000, gem: 260, upgradeStone: 40 } },

    // ==================== 技能升级 ====================
    { id: 'skillTotal30',  name: '技能新手', desc: '技能总等级达到30',  icon: '📖', condition: { type: 'skillTotal', target: 30 },  reward: { gold: 5000, gem: 10 } },
    { id: 'skillTotal100', name: '技能学徒', desc: '技能总等级达到100', icon: '📖', condition: { type: 'skillTotal', target: 100 }, reward: { gold: 30000, gem: 40, lotteryStone: 8 } },
    { id: 'skillTotal200', name: '技能宗师', desc: '技能总等级达到200', icon: '📚', condition: { type: 'skillTotal', target: 200 }, reward: { gold: 120000, gem: 110, petEggStones: 20 } },
    { id: 'skillTotal500', name: '技能圣者', desc: '技能总等级达到500', icon: '📜', condition: { type: 'skillTotal', target: 500 }, reward: { gold: 500000, gem: 300, upgradeStone: 50, lotteryStone: 50 } },

    // ==================== 转生成就 ====================
    { id: 'rebirth1',  name: '轮回之始', desc: '转生1次',  icon: '♻', condition: { type: 'rebirth', target: 1 },  reward: { gold: 8000, gem: 12 } },
    { id: 'rebirth3',  name: '三生三世', desc: '转生3次',  icon: '🔄', condition: { type: 'rebirth', target: 3 },  reward: { gold: 50000, gem: 60, lotteryStone: 10 } },
    { id: 'rebirth5',  name: '五道轮回', desc: '转生5次',  icon: '🔁', condition: { type: 'rebirth', target: 5 },  reward: { gold: 150000, gem: 130, petEggStones: 25 } },
    { id: 'rebirth10', name: '十世修行', desc: '转生10次', icon: '♾', condition: { type: 'rebirth', target: 10 }, reward: { gold: 500000, gem: 300, upgradeStone: 50, lotteryStone: 50 } },

    // ==================== 魔王副本 ====================
    { id: 'dk1',     name: '魔王初战',   desc: '首次挑战魔王',             icon: '👹', condition: { type: 'dkDamage', target: 1 },     reward: { gold: 3000, gem: 8 } },
    { id: 'dk20k',    name: '刺破黑暗',   desc: '对魔王造成20000伤害',      icon: '⚡', condition: { type: 'dkDamage', target: 20000 },   reward: { gold: 15000, gem: 20 } },
    { id: 'dk200k',   name: '光明渐起',   desc: '对魔王造成20万伤害',       icon: '🔥', condition: { type: 'dkDamage', target: 200000 },  reward: { gold: 40000, gem: 50, lotteryStone: 8 } },
    { id: 'dk2m',  name: '人间凶器',   desc: '对魔王造成200万伤害',      icon: '💥', condition: { type: 'dkDamage', target: 2000000 }, reward: { gold: 100000, gem: 100, petEggStones: 15 } },
    { id: 'dk20m',    name: '灭世之力',   desc: '对魔王造成2000万伤害',     icon: '☄', condition: { type: 'dkDamage', target: 20000000 },reward: { gold: 220000, gem: 170, upgradeStone: 30 } },
    { id: 'dk200m',   name: '破碎虚空',   desc: '对魔王造成2亿伤害',    icon: '🌠', condition: { type: 'dkDamage', target: 200000000 },reward: { gold: 360000, gem: 240, lotteryStone: 40 } },
    { id: 'dk2b',  name: '诛仙',       desc: '对魔王造成20亿伤害',      icon: '🔱', condition: { type: 'dkDamage', target: 2000000000 },reward: { gold: 500000, gem: 300, petEggStones: 50, upgradeStone: 50 } },
    { id: 'dkKill1',   name: '初次猎魔',   desc: '击败魔王1次',   icon: '🏹', condition: { type: 'dkKills', target: 1 },   reward: { gold: 5000, gem: 10 } },
    { id: 'dkKill5',   name: '魔王猎手',   desc: '击败魔王5次',   icon: '🏹', condition: { type: 'dkKills', target: 5 },   reward: { gold: 30000, gem: 40, lotteryStone: 8 } },
    { id: 'dkKill20',  name: '弑王',       desc: '击败魔王20次',  icon: '🗡', condition: { type: 'dkKills', target: 20 },  reward: { gold: 120000, gem: 110, petEggStones: 20 } },
    { id: 'dkKill100', name: '万物屠灭者', desc: '击败魔王100次', icon: '💀', condition: { type: 'dkKills', target: 100 }, reward: { gold: 500000, gem: 300, upgradeStone: 50, lotteryStone: 50 } },
    { id: 'dkBest10k',  name: '初试锋芒', desc: '单次魔王战1万伤害',   icon: '🎯', condition: { type: 'dkBest', target: 10000 },  reward: { gold: 8000, gem: 12 } },
    { id: 'dkBest100k', name: '小有成就', desc: '单次魔王战10万伤害',  icon: '🎯', condition: { type: 'dkBest', target: 100000 }, reward: { gold: 40000, gem: 50, lotteryStone: 8 } },
    { id: 'dkBest1m',   name: '单次百万', desc: '单次魔王战100万伤害', icon: '🎯', condition: { type: 'dkBest', target: 1000000 },reward: { gold: 120000, gem: 110, petEggStones: 20 } },
    { id: 'dkBest10m',  name: '单次千万', desc: '单次魔王战1000万伤害',icon: '🎯', condition: { type: 'dkBest', target: 10000000 },reward: { gold: 300000, gem: 210, upgradeStone: 35 } },
    { id: 'dkBest100m', name: '单次破亿', desc: '单次魔王战1亿伤害',  icon: '💯', condition: { type: 'dkBest', target: 100000000 },reward: { gold: 500000, gem: 300, lotteryStone: 50, petEggStones: 50 } },

    // ==================== 副本成就 ====================
    { id: 'dungeon200',  name: '副本新手', desc: '通关副本200次',  icon: '🏛', condition: { type: 'dailyDungeon', target: 200 },   reward: { gold: 5000, gem: 10 } },
    { id: 'dungeon1k',  name: '副本达人', desc: '通关副本1000次',  icon: '🏟', condition: { type: 'dailyDungeon', target: 1000 },   reward: { gold: 30000, gem: 40, lotteryStone: 8 } },
    { id: 'dungeon2k', name: '副本精英', desc: '通关副本2000次', icon: '🏰', condition: { type: 'dailyDungeon', target: 2000 },  reward: { gold: 90000, gem: 90, petEggStones: 15 } },
    { id: 'dungeon4k', name: '副本之王', desc: '通关副本4000次', icon: '🏰', condition: { type: 'dailyDungeon', target: 4000 },  reward: { gold: 220000, gem: 170, upgradeStone: 30 } },
    { id: 'dungeon10k', name: '无尽冒险', desc: '通关副本10000次', icon: '🗿', condition: { type: 'dailyDungeon', target: 10000 },  reward: { gold: 500000, gem: 300, lotteryStone: 50, petEggStones: 50 } },

    // ==================== 伤害里程碑 ====================
    { id: 'dmg200k',  name: '初露锋芒',   desc: '累计造成20万伤害',    icon: '⚡', condition: { type: 'totalDmg', target: 200000 },   reward: { gold: 5000, gem: 10 } },
    { id: 'dmg20m',   name: '伤害破百万', desc: '累计造成2000万伤害',  icon: '💥', condition: { type: 'totalDmg', target: 20000000 }, reward: { gold: 30000, gem: 40, lotteryStone: 8 } },
    { id: 'dmg200m',  name: '伤害破千万', desc: '累计造成2亿伤害', icon: '🔥', condition: { type: 'totalDmg', target: 200000000 },reward: { gold: 100000, gem: 100, petEggStones: 15 } },
    { id: 'dmg2b', name: '亿级伤害',   desc: '累计造成20亿伤害',    icon: '💫', condition: { type: 'totalDmg', target: 2000000000 },reward: { gold: 280000, gem: 200, upgradeStone: 35 } },
    { id: 'dmg10b', name: '毁天灭地',   desc: '累计造成100亿伤害',    icon: '🌋', condition: { type: 'totalDmg', target: 10000000000 },reward: { gold: 500000, gem: 300, lotteryStone: 50, petEggStones: 50 } },

    // ==================== 出售装备 ====================
    { id: 'sell200',  name: '仓库整理', desc: '出售200件装备',   icon: '📦', condition: { type: 'sellItem', target: 200 },   reward: { gold: 3000, gem: 8 } },
    { id: 'sell1000',  name: '清仓新手', desc: '出售1000件装备',   icon: '🗑', condition: { type: 'sellItem', target: 1000 },   reward: { gold: 15000, gem: 20 } },
    { id: 'sell4000', name: '废品回收站',desc: '出售4000件装备',  icon: '🔄', condition: { type: 'sellItem', target: 4000 },  reward: { gold: 50000, gem: 60, lotteryStone: 10 } },
    { id: 'sell10k', name: '当铺老板', desc: '出售10000件装备',  icon: '🏪', condition: { type: 'sellItem', target: 10000 },  reward: { gold: 150000, gem: 130, petEggStones: 20 } },
    { id: 'sell40k',name: '商业帝国', desc: '出售40000件装备', icon: '🏢', condition: { type: 'sellItem', target: 40000 }, reward: { gold: 500000, gem: 300, upgradeStone: 50, lotteryStone: 50 } },

    // ==================== 隐藏成就 ====================
    { id: 'secret1', name: '?? 重生之始 ??', desc: '???', icon: '❓', condition: { type: 'rebirth', target: 1 },  reward: { gold: 10000 }, hidden: true },
    { id: 'secret2', name: '?? 暗影之击 ??', desc: '???', icon: '❓', condition: { type: 'totalKills', target: 66666 }, reward: { gold: 100000, gem: 80, lotteryStone: 15 }, hidden: true },
    { id: 'secret3', name: '?? 永恒不灭 ??', desc: '???', icon: '❓', condition: { type: 'totalGold', target: 6666666 }, reward: { gold: 200000, gem: 150, petEggStones: 25 }, hidden: true },
    { id: 'secret4', name: '?? 深渊凝视 ??', desc: '???', icon: '❓', condition: { type: 'stage', target: 66 }, reward: { gold: 280000, gem: 200, upgradeStone: 30 }, hidden: true },
    { id: 'secret5', name: '?? 百战不殆 ??', desc: '???', icon: '❓', condition: { type: 'dailyDungeon', target: 777 }, reward: { gold: 400000, gem: 250, lotteryStone: 40 }, hidden: true },
    { id: 'secret6', name: '?? 星辰之主 ??', desc: '???', icon: '❓', condition: { type: 'enhanceLevel', target: 33 }, reward: { gold: 500000, gem: 300, petEggStones: 50, upgradeStone: 50 }, hidden: true },
];

// 按条件类型索引
var ACHIEVEMENT_INDEX = {};
(function() {
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var a = ACHIEVEMENTS[i];
        if (!ACHIEVEMENT_INDEX[a.condition.type]) ACHIEVEMENT_INDEX[a.condition.type] = [];
        ACHIEVEMENT_INDEX[a.condition.type].push(a);
    }
})();
