// ====== 重铸石副本（独立模块）======

(function() {
    BattleManager._dungeonConfigs = BattleManager._dungeonConfigs || {};
    BattleManager._dungeonRewards = BattleManager._dungeonRewards || {};

    BattleManager._dungeonConfigs.stone = function(level) {
        var maxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
        this.stage = Math.max(1, Math.floor(maxStage * 0.6));
        this.waveNumber = 1;
        this.waveSpawnCount = getDungeonEnemyCount(level, maxStage);
        this.dungeonEnemyMult = getDungeonEnemyMult(level, maxStage);
    };

    BattleManager._dungeonRewards.stone = function(level) {
        var maxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
        var stone = getDungeonStoneReward(level, maxStage);
        GameState.mutate('reforgestone', function(v) { return (v || 0) + stone; });
        this.addBattleLog('✦ 重铸石副本 Lv.' + level + ' 通关！获得重铸石 +' + stone, 'reward');
        showToast('重铸石副本 Lv.' + level + ' 通关！重铸石+' + stone, 'success');
        return { stone: stone };
    };
})();
