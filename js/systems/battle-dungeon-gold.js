// ====== 金币副本（独立模块）======
// 注册到 BattleManager._dungeonConfigs / _dungeonRewards

(function() {
    BattleManager._dungeonConfigs = BattleManager._dungeonConfigs || {};
    BattleManager._dungeonRewards = BattleManager._dungeonRewards || {};

    BattleManager._dungeonConfigs.gold = function(level) {
        var maxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
        this.stage = Math.max(1, Math.floor(maxStage * 0.6));
        this.waveNumber = 1;
        this.waveSpawnCount = getDungeonEnemyCount(level, maxStage);
        this.dungeonEnemyMult = getDungeonEnemyMult(level, maxStage);
    };

    BattleManager._dungeonRewards.gold = function(level) {
        var maxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
        var gold = getDungeonGoldReward(level, maxStage);
        GameState.mutate('gold', function(g) { return (g || 0) + gold; });
        this.addBattleLog('✦ 金币副本 Lv.' + level + ' 通关！获得金币 +' + gold, 'reward');
        showToast('金币副本 Lv.' + level + ' 通关！金币+' + gold, 'success');
        return { gold: gold };
    };
})();
