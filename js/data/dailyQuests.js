// ========== 家园告示牌（每日任务）==========

var DAILY_QUESTS = [
    { id: 'kill_monsters',   name: '怪物猎人',   icon: '⚔', desc: '击杀 100 只怪物',
      target: 100, reward: { gold: 5000, lotteryStone: 1 },
      trackKey: 'dailyKills', },
    { id: 'clear_stages',    name: '章节推进',   icon: '📖', desc: '通关 10 波战斗',
      target: 10,  reward: { gold: 3000, reforgestone: 1 },
      trackKey: 'dailyStages' },
    { id: 'dungeon_runs',    name: '副本挑战',   icon: '🏛', desc: '完成 3 次副本',
      target: 3,   reward: { gold: 8000, lotteryStone: 2 },
      trackKey: 'dailyDungeons' },
    { id: 'equip_decompose', name: '装备分解',   icon: '🔨', desc: '分解 5 件装备',
      target: 5,   reward: { forgeDust: 200, reforgestone: 2 },
      trackKey: 'dailyDecompose' },
    { id: 'collect_gold',    name: '财富累积',   icon: '💰', desc: '累计获得 20000 金币',
      target: 20000, reward: { gem: 50 },
      trackKey: 'dailyGoldEarned' },
];

// 获取每日任务列表
function getDailyQuests() {
    return DAILY_QUESTS;
}

// 检查每日任务是否重置（跨天）
function checkDailyReset(state) {
    if (!state) return;
    var today = new Date().toDateString();
    if (state._dailyQuestDate !== today) {
        // 重置所有任务进度
        DAILY_QUESTS.forEach(function(q) {
            if (state[q.trackKey] !== undefined) state[q.trackKey] = 0;
        });
        // 重置已完成标记
        if (state._dailyQuestClaimed) state._dailyQuestClaimed = {};
        state._dailyQuestDate = today;
    }
}
