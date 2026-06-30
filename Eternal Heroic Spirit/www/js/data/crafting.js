// ========== 营地烹饪／宝石工坊配方 ==========
// 篝火烹饪系统

var CAMP_RECIPES = [
    // === 营地食物（消耗草药/矿石，非金币）===
    { id: 'grilled_fish',  name: '烤鱼',     icon: '🐟', cost: 0,  herb: 3, ore: 0,
      desc: '队伍攻击力 +10%，持续10分钟',
      buff: { stat: 'atk', pct: 0.10, dur: 600000 } },
    { id: 'herbal_soup',  name: '草药汤',   icon: '🍵', cost: 0,  herb: 5, ore: 0,
      desc: '队伍防御力 +15%，持续10分钟',
      buff: { stat: 'def', pct: 0.15, dur: 600000 } },
    { id: 'energy_tea',   name: '体力茶',   icon: '🧋', cost: 0,  herb: 4, ore: 1,
      desc: '战斗经验获取 +30%，持续10分钟',
      buff: { stat: 'expBonus', pct: 0.30, dur: 600000 } },
    { id: 'lucky_pie',    name: '幸运派',   icon: '🥧', cost: 0,  herb: 6, ore: 2,
      desc: '金币掉落 +25%，持续10分钟',
      buff: { stat: 'goldBonus', pct: 0.25, dur: 600000 } },
    { id: 'spirit_wine',  name: '灵酒',     icon: '🍷', cost: 0,  herb: 3, ore: 3,
      desc: '暴击率 +8%，持续10分钟',
      buff: { stat: 'crit', pct: 8, dur: 600000, isFlat: true } },
    { id: 'iron_stew',    name: '铁甲炖',   icon: '🥘', cost: 0,  herb: 8, ore: 5,
      desc: '生命上限 +20%，持续10分钟',
      buff: { stat: 'hp', pct: 0.20, dur: 600000 } },
];

// 获取当前可烹饪列表（根据玩家资源判断）
function getAvailableRecipes() {
    return CAMP_RECIPES;
}

// 获取配方
function getCampRecipe(id) {
    var _es5_6=null;for(var _es5_5=0;_es5_5<CAMP_RECIPES.length;_es5_5++){if(CAMP_RECIPES[_es5_5].id === id){_es5_6=CAMP_RECIPES[_es5_5];break;}}return _es5_6;
}
