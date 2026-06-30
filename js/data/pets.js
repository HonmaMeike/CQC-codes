// ========== 宠物系统 - 数据定义 ==========
// 5品阶：普通、稀有、史诗、传说、神化
// 新增：升星系统、碎片系统、抽奖孵化系统
/* global GameState */

var PET_TIERS = {
    normal:    { name: '普通', color: '#9e9e9e', hatchMin: 30, statMult: 0.8, maxLv: 100, foodCost: 30 },
    rare:      { name: '稀有', color: '#2196f3', hatchMin: 60, statMult: 1.0, maxLv: 100, foodCost: 50 },
    epic:      { name: '史诗', color: '#9c27b0', hatchMin: 120, statMult: 1.3, maxLv: 100, foodCost: 70 },
    legend:    { name: '传说', color: '#ff9800', hatchMin: 240, statMult: 1.6, maxLv: 100, foodCost: 100 },
    mythic:    { name: '神化', color: '#f44336', hatchMin: 480, statMult: 2.0, maxLv: 100, foodCost: 150 },
    lucky:     { name: '幸运', color: '#ffd700', hatchMin: 120, statMult: 1.5, maxLv: 100, foodCost: 100 },
};

// 升星倍率: 0星→5星
var STAR_MULTIPLIERS = [1.0, 1.2, 1.5, 1.9, 2.4, 3.0];

// 升星碎片消耗: 0→1, 1→2, 2→3, 3→4, 4→5
var STAR_UP_COSTS = [10, 20, 40, 80, 160];

// 重复宠物转碎片数量
var SHARD_DUPE_AMOUNTS = {
    normal: 5,
    rare: 10,
    epic: 25,
    legend: 50,
    mythic: 100
};

var PET_DATA = [
    // ========== 普通 (5) ==========
    { id:'pet_slime',   name:'史莱姆',   icon:'🟢', tier:'normal',  baseStat:'atk', baseVal:2, desc:'软绵绵的果冻状生物'},
    { id:'pet_mouse',   name:'小老鼠',   icon:'🐭', tier:'normal',  baseStat:'spd', baseVal:2, desc:'行动敏捷的小家伙'},
    { id:'pet_rabbit',  name:'白兔',     icon:'🐰', tier:'normal',  baseStat:'hp',  baseVal:2, desc:'温顺可爱的长耳朵'},
    { id:'pet_sloth',   name:'树懒',     icon:'🦥', tier:'normal',  baseStat:'def', baseVal:2, desc:'慢吞吞但防御不错'},
    { id:'pet_chick',   name:'小鸡',     icon:'🐤', tier:'normal',  baseStat:'healBonus', baseVal:1, desc:'毛茸茸的小家伙'},

    // ========== 稀有 (5) ==========
    { id:'pet_fox',     name:'火狐',     icon:'🦊', tier:'rare',    baseStat:'atk', baseVal:3, desc:'皮毛如火焰般赤红'},
    { id:'pet_turtle',  name:'岩龟',     icon:'🐢', tier:'rare',    baseStat:'def', baseVal:3, desc:'背甲坚硬如岩石'},
    { id:'pet_owl',     name:'夜枭',     icon:'🦉', tier:'rare',    baseStat:'crit',baseVal:2, desc:'黑夜中的无声猎手'},
    { id:'pet_cat',     name:'影猫',     icon:'🐈‍⬛',tier:'rare',    baseStat:'spd', baseVal:3, desc:'暗影中的优雅猎手'},
    { id:'pet_frog',    name:'水母蛙',   icon:'🐸', tier:'rare',    baseStat:'hp',  baseVal:3, desc:'湿滑的沼泽居民'},

    // ========== 史诗 (6) ==========
    { id:'pet_wolf',    name:'苍狼',     icon:'🐺', tier:'epic',    baseStat:'atk', baseVal:5, desc:'雪原狼王的后裔'},
    { id:'pet_serpent', name:'灵蛇',     icon:'🐍', tier:'epic',    baseStat:'spd', baseVal:5, desc:'缠绕着幽蓝光芒'},
    { id:'pet_panda',   name:'铁甲熊',   icon:'🐻', tier:'epic',    baseStat:'def', baseVal:5, desc:'皮糙肉厚的森林霸主'},
    { id:'pet_wind_wolf',  name:'风狼',   icon:'🐺', tier:'epic',    baseStat:'atk', baseVal:5, desc:'御风而行的疾风之狼'},
    { id:'pet_thunder_leopard', name:'雷豹', icon:'🐆', tier:'epic', baseStat:'spd', baseVal:5, desc:'身披雷电的猎豹'},
    { id:'pet_fire_bear', name:'炎熊',     icon:'🐻', tier:'epic',   baseStat:'def', baseVal:5, desc:'浑身燃烧着烈焰'},

    // ========== 传说 (8) ==========
    { id:'pet_phoenix', name:'凤凰',     icon:'🦅', tier:'legend',  baseStat:'atk', baseVal:8, desc:'浴火重生的不死鸟'},
    { id:'pet_dragon',  name:'幼龙',     icon:'🐉', tier:'legend',  baseStat:'all', baseVal:5, desc:'龙族最后的血脉'},
    { id:'pet_kirin',   name:'麒麟',     icon:'🦄', tier:'legend',  baseStat:'healBonus', baseVal:8, desc:'祥瑞之兽，圣光加护'},
    { id:'pet_ice_phoenix', name:'冰凤', icon:'🦅', tier:'legend',  baseStat:'atk', baseVal:8, desc:'寒冰凤凰，冻结万物'},
    { id:'pet_light_dragon', name:'光龙', icon:'🐉', tier:'legend', baseStat:'all', baseVal:5, desc:'圣光之龙，净化一切'},
    { id:'pet_dark_crow',  name:'暗鸦',   icon:'🐦', tier:'legend', baseStat:'crit',baseVal:6, desc:'深渊之眼的化身'},
    { id:'pet_golden_monkey', name:'金猿', icon:'🐒', tier:'legend', baseStat:'atk', baseVal:8, desc:'金刚不坏之躯'},
    { id:'pet_wood_spirit', name:'木灵',  icon:'🌳', tier:'legend', baseStat:'hp',  baseVal:8, desc:'森林之灵的化身'},

    // ========== 神化 (6) ==========
    { id:'pet_phoenix_god', name:'圣凤凰', icon:'🔥', tier:'mythic', baseStat:'atk', baseVal:12, desc:'凤凰之神，焚尽万物'},
    { id:'pet_dragon_king', name:'龙王',   icon:'🐲', tier:'mythic', baseStat:'all', baseVal:8,  desc:'万龙之祖，创世之力'},
    { id:'pet_void_beast',  name:'虚空兽', icon:'👾', tier:'mythic', baseStat:'all', baseVal:8,  desc:'来自虚空的恐怖存在'},
    { id:'pet_creation_turtle', name:'创世龟', icon:'🐢', tier:'mythic', baseStat:'def', baseVal:14, desc:'背负世界的远古神龟'},
    { id:'pet_star_butterfly', name:'星辉蝶', icon:'🦋', tier:'mythic', baseStat:'healBonus', baseVal:12, desc:'星辰之辉凝成的蝶'},
    { id:'pet_sun_eagle',   name:'日鹰',   icon:'🦅', tier:'mythic', baseStat:'atk', baseVal:12, desc:'太阳神鹰，光耀万物'},
];

// 获取宠物数据
function getPetData(petId) {
    if (!petId || !PET_DATA) return null;
    for (var i = 0; i < PET_DATA.length; i++) {
        if (PET_DATA[i].id === petId) return PET_DATA[i];
    }
    return null;
}

// 获取品阶配置
function getPetTier(tierId) { return PET_TIERS[tierId] || PET_TIERS.normal; }

// 获取宠物的当前进化阶段
function getPetStage(petId, level) {
    if (level >= 20) return 2;
    if (level >= 10) return 1;
    return 0;
}

// 获取宠物升星倍率
function getStarMultiplier(star) {
    if (typeof star !== 'number' || star < 0) star = 0;
    if (star >= STAR_MULTIPLIERS.length) star = STAR_MULTIPLIERS.length - 1;
    return STAR_MULTIPLIERS[star] || 1.0;
}

// 获取升星碎片消耗 (star: 当前星数, 返回升到下一级需要的碎片)
function getStarUpCost(star) {
    if (typeof star !== 'number' || star < 0 || star >= STAR_UP_COSTS.length) return -1;
    return STAR_UP_COSTS[star];
}

// 计算宠物属性加成（支持数组，返回合并后的加成）
// 参数：(petId, level, star) 单个宠物 或 ([{id, level, star}, ...]) 多个宠物
function calcPetBonus(petId, level, star) {
    // 检查是否数组调用
    if (Array.isArray(petId)) {
        var pets = petId;
        if (pets.length === 0) return null;
        var combined = {};
        for (var pi = 0; pi < pets.length; pi++) {
            var single = calcPetBonus(pets[pi].id, pets[pi].level, pets[pi].star);
            if (!single) continue;
            if (single.stat === 'all') {
                combined.all = (combined.all || 0) + single.rawPct;
            } else {
                combined[single.stat] = (combined[single.stat] || 0) + single.rawPct;
            }
        }
        var result = {};
        for (var st in combined) {
            result[st] = combined[st];
        }
        result._isCombined = true;
        return result;
    }
    // 原始单个宠物逻辑
    var data = getPetData(petId);
    if (!data || !level) return null;
    var tier = getPetTier(data.tier);
    var lvMult = 1 + (level - 1) * 0.05;  // 每级+5%
    var starMult = getStarMultiplier(star);
    var val = data.baseVal * lvMult * tier.statMult * starMult;
    return {
        stat: data.baseStat,
        value: Math.round(val * 10) / 10,
        rawPct: val / 100
    };
}

// 获取主动宠加成文本（支持多宠+升星）
function getActivePetBonusText() {
    if (!gameState || !GameState.get("activePets") || GameState.get("activePets").length === 0) return '无';
    var statNames = { atk:'攻击', def:'防御', spd:'速度', hp:'生命', crit:'暴击', healBonus:'治疗', all:'全属性' };
    var activePetsData = [];
    for (var i = 0; i < GameState.get("pets").length; i++) {
        if (GameState.get("activePets").indexOf(GameState.get("pets")[i].id) !== -1) {
            var p = GameState.get("pets")[i];
            var star = (GameState.get("petStars") && GameState.get("petStars")[p.id]) || 0;
            activePetsData.push({ id: p.id, level: p.level, star: star });
        }
    }
    if (activePetsData.length === 0) return '无';
    var bonus = calcPetBonus(activePetsData);
    if (!bonus || !bonus._isCombined) return '无';
    var parts = [];
    if (bonus.all) {
        parts.push('全属性 +' + Math.round(bonus.all * 100) + '%');
    }
    for (var s in bonus) {
        if (s === '_isCombined' || s === 'all') continue;
        parts.push((statNames[s] || s) + ' +' + Math.round(bonus[s] * 100) + '%');
    }
    var names = [];
    for (var ni = 0; ni < activePetsData.length; ni++) {
        var d = getPetData(activePetsData[ni].id);
        if (d) names.push(d.name);
    }
    return names.join('+') + ': ' + parts.join(' ');
}

// 获取当前可用宠物槽位数
function getAvailablePetSlots() {
    var base = 1;
    var fromTalent = (gameState && GameState.get("petSlotsFromTalent")) || 0;
    return Math.min(3, base + fromTalent);
}

// ========== 碎片系统 ==========

// 添加宠物碎片
function addPetShards(petId, amount) {
    if (!GameState.get("petShards")) GameState.set("petShards", {});
    GameState.get("petShards")[petId] = (GameState.get("petShards")[petId] || 0) + amount;
}

// 获取碎片数量
function getPetShards(petId) {
    if (!GameState.get("petShards")) return 0;
    return GameState.get("petShards")[petId] || 0;
}

// 尝试升星宠物
function tryStarUpPet(petId) {
    if (!GameState.get("petStars")) GameState.set("petStars", {});
    var currentStar = GameState.get("petStars")[petId] || 0;
    if (currentStar >= 5) {
        showToast('该宠物已满星!', 'warning');
        return false;
    }
    var cost = getStarUpCost(currentStar);
    var shards = getPetShards(petId);
    if (shards < cost) {
        showToast('碎片不足! 需要 ' + cost + ' 碎片, 当前 ' + shards, 'warning');
        return false;
    }
    GameState.get("petShards")[petId] = shards - cost;
    GameState.get("petStars")[petId] = currentStar + 1;
    var data = getPetData(petId);
    showToast('🎉 ' + data.name + ' 升星成功! ★' + (currentStar + 1), 'success');
    return true;
}

// ========== 孵化系统 ==========

// 获取孵化池配置
function getEggPool(tier) {
    if (tier === 'normal') {
        return { normal: 80, rare: 20 };
    } else if (tier === 'rare') {
        return { rare: 60, epic: 25, legend: 15 };
    } else if (tier === 'epic') {
        return { epic: 10, legend: 30, rare: 60 };
    } else if (tier === 'legend') {
        return { legend: 15, epic: 30, rare: 55 };
    } else if (tier === 'mythic') {
        return { mythic: 20, legend: 40, epic: 40 };
    } else if (tier === 'lucky') {
        return { normal: 120, rare: 56, epic: 20, legend: 3, mythic: 1 };
    }
    return { normal: 55, rare: 30, epic: 11, legend: 3, mythic: 1 };
}

// 从孵化池中随机抽一个品阶
function rollTierFromPool(pool) {
    var poolArr = [];
    for (var t in pool) {
        var weight = pool[t];
        for (var i = 0; i < weight; i++) {
            poolArr.push(t);
        }
    }
    return poolArr[Math.floor(Math.random() * poolArr.length)];
}

// 从指定品阶中随机选一个宠物
function randomPetFromTier(tierId) {
    var candidates = [];
    for (var i = 0; i < PET_DATA.length; i++) {
        if (PET_DATA[i].tier === tierId) candidates.push(PET_DATA[i]);
    }
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

// 领取孵化槽位 - 核心孵化函数
function hatchPetEggForSlot(slotIndex) {
    if (!GameState.get("petIncubators") || !GameState.get("petIncubators")[slotIndex]) return null;
    var slot = GameState.get("petIncubators")[slotIndex];
    if (!slot.tier || Date.now() < slot.hatchTime) return null;

    var pool = getEggPool(slot.tier);
    var chosenTier = rollTierFromPool(pool);
    var petData = randomPetFromTier(chosenTier);
    if (!petData) return null;

    // 检查是否重复
    var existing = null;
    for (var j = 0; j < GameState.get("pets").length; j++) {
        if (GameState.get("pets")[j].id === petData.id) {
            existing = GameState.get("pets")[j];
            break;
        }
    }

    if (existing) {
        // 重复 → 转碎片
        var shardAmount = SHARD_DUPE_AMOUNTS[petData.tier] || 5;
        addPetShards(petData.id, shardAmount);
        showToast('重复宠物! 转化为 ' + shardAmount + ' 碎片', 'info');
        slot.tier = null;
        slot.hatchTime = 0;
        return { duplicate: true, petId: petData.id, shards: shardAmount };
    } else {
        // 新宠物
        GameState.get("pets").push({ id: petData.id, level: 1, exp: 0 });
        showToast('🎉 孵化出 ' + petData.name + '! [' + getPetTier(petData.tier).name + ']', 'success');
        slot.tier = null;
        slot.hatchTime = 0;
        return { duplicate: false, petId: petData.id };
    }
}

// 喂养宠物（消耗食物升1级）
function feedPet(petIndex, foodAmount) {
    if (!gameState || !GameState.get("pets") || !GameState.get("pets")[petIndex]) return false;
    var pet = GameState.get("pets")[petIndex];
    if (pet._upgrading) return false; // 防止重复触发
    pet._upgrading = true;
    var data = getPetData(pet.id);
    if (!data) { pet._upgrading = false; return false; }
    var tier = getPetTier(data.tier);
    var cost = tier.foodCost;
    var maxLv = tier.maxLv;
    if (pet.level >= maxLv) { showToast('该宠物已满级!', 'warning'); pet._upgrading = false; return false; }
    if ((GameState.get("petFood") || 0) < cost) { showToast('宠物食物不足!', 'warning'); pet._upgrading = false; return false; }
    GameState.mutate("petFood", function(v) { return (v||0) - cost; });
    pet.level++;
    GameState.mutate("pets", function(arr) {
        if (arr && arr[petIndex]) arr[petIndex].level = pet.level;
        return arr ? arr.slice() : arr;
    });
    showToast(data.name + ' 升级到 Lv.' + pet.level + '! (' + cost + '食)', 'success');
    setTimeout(function() { pet._upgrading = false; }, 500);
    return true;
}
