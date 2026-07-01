// ====== 装备副本（独立模块）======

(function() {
    BattleManager._dungeonConfigs = BattleManager._dungeonConfigs || {};
    BattleManager._dungeonRewards = BattleManager._dungeonRewards || {};

    BattleManager._dungeonConfigs.equip = function(level) {
        var maxStage = Math.max(1, GameState.get('maxStage') || GameState.get('stage') || 1);
        this.stage = maxStage;
        this.waveNumber = 1;
        var counts = [18, 32, 40];
        var mults = [50, 280, 1040];
        this.waveSpawnCount = counts[level - 1] || 18;
        this.dungeonEnemyMult = mults[level - 1] || 50;
    };

    BattleManager._dungeonRewards.equip = function(level) {
        var count = 0;
        if (level === 1) {
            count = 3 + Math.floor(Math.random() * 3);
            for (var i = 0; i < count; i++) {
                var r = Math.random();
                this._addDungeonEquip(r < 0.5 ? 2 : (r < 0.8 ? 3 : 4));
            }
        } else if (level === 2) {
            count = 3 + Math.floor(Math.random() * 3);
            for (var i = 0; i < count; i++) {
                var r = Math.random();
                this._addDungeonEquip(r < 0.5 ? 3 : (r < 0.95 ? 4 : 5));
            }
        } else if (level === 3) {
            count = 2 + Math.floor(Math.random() * 2);
            for (var i = 0; i < count; i++) {
                this._addDungeonEquip(Math.random() < 0.85 ? 4 : 5);
            }
        }
        this.addBattleLog('✦ 装备副本 Lv.' + level + ' 通关！获得 ' + count + ' 件装备', 'reward');
        showToast('装备副本 Lv.' + level + ' 通关！获得' + count + '件装备', 'success');
        return { equipCount: count };
    };
})();
