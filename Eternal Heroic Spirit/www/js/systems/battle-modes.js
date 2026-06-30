// ====== 战斗模式处理（从 battle.js update() 提取）v1 ======
// 处理魔王/副本/爬塔/主战场的死亡、计时、通关分支逻辑

(function() {

// ---------- 死亡处理 ----------
BattleManager._handleModeDeath = function(aliveAllies) {
    if (aliveAllies.length > 0) return false;

    // 魔王：全灭算奖励，直接关弹窗回副本大厅
    if (this.isDungeon && this.dungeonType === 'demonking') {
        try { this.demonKingReward(); } catch(e) { /* battle-modes */ console.warn("⚠ [catch]",e&&e.message); }
        this.isDungeon = false;
        this.dungeonType = null;
        this.stopBattle();
        var bm = document.getElementById('dungeon-battle-modal');
        if (bm) bm.style.display = 'none';
        if (typeof switchScreen === 'function') switchScreen('dungeon');
        return true;
    }

    // 副本：全灭直接退出（无奖励）
    if (this.isDungeon) {
        this.exitDungeon();
        return true;
    }

    return false; // 主战场死亡由原逻辑处理
};

// ---------- 计时器/状态显示 ----------
BattleManager._handleModeTimer = function(dt) {
    // 魔王：限时倒计时
    if (this.isDungeon && this.dungeonType === 'demonking') {
        this.demonKingTimer -= dt;
        var remaining = Math.max(0, Math.ceil(this.demonKingTimer / 1000));
        var dmgDisplay = (typeof formatNumber === 'function') ? formatNumber(this.demonKingDamage || 0) : (this.demonKingDamage || 0);
        var timerEl = document.getElementById('dungeon-timer-text');
        var dmgEl = document.getElementById('dungeon-damage-text');
        if (timerEl) timerEl.textContent = '⏱ 剩余 ' + remaining + '秒';
        if (dmgEl) dmgEl.textContent = '⚔ 伤害: ' + dmgDisplay;

        if (this.demonKingTimer <= 0) {
            this.addBattleLog('⏱ 时间到！魔王战结束', 'info');
            try { this.demonKingReward(); } catch(e) { /* battle-modes */ console.warn("⚠ [catch]",e&&e.message); }
            this.isDungeon = false;
            this.dungeonType = null;
            this.stopBattle();
            var bm2 = document.getElementById('dungeon-battle-modal');
            if (bm2) bm2.style.display = 'none';
            if (typeof switchScreen === 'function') switchScreen('dungeon');
            return true;
        }
        return false;
    }

    // 普通副本：显示已用时间和累计伤害
    if (this.isDungeon && this.dungeonType !== 'tower') {
        var elapsed = Math.floor(((performance.now() - this._battleStats.startTime) / 1000));
        var mins = Math.floor(elapsed / 60);
        var secs = elapsed % 60;
        var timeStr = mins > 0 ? (mins + '分' + secs + '秒') : (secs + '秒');
        var dmgEl2 = document.getElementById('dungeon-damage-text');
        var timerEl2 = document.getElementById('dungeon-timer-text');
        if (timerEl2) timerEl2.textContent = '⏱ ' + timeStr;
        if (dmgEl2) dmgEl2.textContent = '⚔ 伤害: ' + (typeof formatNumber === 'function' ? formatNumber(this._battleStats.damageDealt || 0) : (this._battleStats.damageDealt || 0));
    }
    return false;
};

// ---------- 波次完成处理 ----------
BattleManager._handleModeWaveComplete = function() {
    if (!this.isDungeon) return false; // 主战场走原逻辑

    // 爬塔
    if (this.isTower && typeof this.towerReward === 'function') {
        this.towerReward(this.towerFloor);
        this.exitTower();
    } else if (this.dungeonType === 'demonking') {
        // 魔王已由独立逻辑处理
        return true;
    } else {
        // 普通副本奖励
        this.dungeonReward();
    }
    return true;
};

})();
