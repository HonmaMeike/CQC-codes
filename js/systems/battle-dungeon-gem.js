// ====== 宝石副本（独立模块）======

(function() {
    BattleManager._dungeonConfigs = BattleManager._dungeonConfigs || {};
    BattleManager._dungeonRewards = BattleManager._dungeonRewards || {};

    BattleManager._dungeonConfigs.gem = function(level) {
        var maxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
        this.stage = Math.max(1, Math.floor(maxStage * 0.6));
        this.waveNumber = 1;
        this.waveSpawnCount = getDungeonEnemyCount(level, maxStage);
        this.dungeonEnemyMult = getDungeonEnemyMult(level, maxStage);
    };

    BattleManager._dungeonRewards.gem = function(level) {
        var maxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
        var count = getDungeonGemCount(level, maxStage);
        var gemLv = getDungeonGemLevel(level, maxStage);
        for (var i = 0; i < count; i++) {
            var gt = randPick(GEM_TYPES);
            addGemToInventory({ gemTypeId: gt.id, level: gemLv, count: 1 });
        }
        this.addBattleLog('✦ 宝石副本 Lv.' + level + ' 通关！获得 ' + count + ' 颗 Lv.' + gemLv + ' 宝石', 'reward');
        showToast('宝石副本 Lv.' + level + ' 通关！获得' + count + '颗宝石', 'success');
        return { gemCount: count, gemLevel: gemLv };
    };
})();
