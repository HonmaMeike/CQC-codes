// ====== 战斗扩展模块（魔王副本 + 爬塔）v1 ======
// 从 battle.js 提取的独立方法，使用 Object.assign 合并回 BattleManager
// 保持原有 this 调用链不变

(function() {

// ====== 爬塔·无尽 ======

BattleManager.startTowerBattle = function(floor) {
    if (this.isDungeon) { console.warn('[Battle] 已在地牢/爬塔中,忽略'); return; }
    if (typeof getTowerFloorType !== 'function' || typeof createMonsterInstance !== 'function') {
        if (typeof showToast === 'function') showToast('爬塔系统未就绪', 'error');
        return;
    }

    if (this.isRunning) this.stopBattle();

    this.savedNormalState = {
        waveNumber: this.waveNumber, stage: this.stage,
        waveSpawnCount: this.waveSpawnCount, waveSpawned: this.waveSpawned,
        waveState: this.waveState, restTimer: this.restTimer,
        deathTimerInit: this.deathTimerInit, autoBattle: this.autoBattle,
        waitingNextChapter: this.waitingNextChapter, enemies: this.enemies.slice()
    };

    this.isDungeon = true;
    this.isTower = true;
    this.towerFloor = floor;
    this.dungeonType = 'tower';
    this.enemies = [];
    this.waveSpawned = 0;
    this.waveState = 'resting';
    this.restTimer = 500;
    this.deathTimerInit = false;

    var dc = document.getElementById('dungeon-battle-canvas');
    if (dc) { this.switchCanvas(dc);
        var self = this;
        requestAnimationFrame(function() { try { self.resize(); } catch(e) { /* battle-ext */ console.warn("⚠ [catch]",e&&e.message); } });
    }
    this._mainBattlePaused = true;

    // 友方满状态
    for (var i = 0; i < this.allies.length; i++) {
        var a = this.allies[i]; a.alive = true; a.hp = a.maxHp;
        a.mp = a.maxMp; a.statusEffects = []; a.buffs = [];
        a.atkTimer = 0; a.skillCd = {};
    }

    var floorType = getTowerFloorType(floor);
    var stage = getTowerStageForFloor(floor);
    var mult = getTowerFloorMult(floor);
    this.stage = stage;
    this.waveNumber = 1;
    this.dungeonEnemyMult = mult;

    var isBoss = floorType === 'boss';
    this.waveSpawnCount = isBoss ? 2 : (BattleConfig ? BattleConfig.TOWER_FLOOR_ENEMY_BASE : 3);
    this.spawnInterval = BattleConfig ? BattleConfig.TOWER_SPAWN_INTERVAL : 1000;

    document.getElementById('wave-status').textContent = (isBoss ? '👹 BOSS层！' : '🏗') + ' 塔·第' + floor + '层';
    this.addBattleLog('✦ 进入爬塔·第' + floor + '层' + (isBoss ? '（BOSS层！）' : ''), 'reward');

    this._setTowerFloorType(floorType);
    this._mainBattlePaused = false;
    this.startBattle();
};

// 爬塔通关奖励
BattleManager.towerReward = function(floor) {
    if (typeof calcTowerReward !== 'function') return;
    var reward = calcTowerReward(floor);
    GameState.mutate('gold', function(g) { return (g || 0) + (reward.gold || 0); });
    GameState.mutate('reforgestone', function(v) { return (v || 0) + (reward.reforgestone || 0); });
    GameState.mutate('lotteryStone', function(v) { return (v || 0) + (reward.lotteryStone || 0); });

    var towerData = GameState.get('tower') || {};
    towerData.currentFloor = floor + 1;
    if (floor > (towerData.maxFloor || 0)) towerData.maxFloor = floor;
    if (floor > (towerData.bestFloor || 0)) towerData.bestFloor = floor;
    towerData.totalRuns = (towerData.totalRuns || 0) + 1;
    towerData.lastReward = reward;
    GameState.set('tower', towerData);

    var maxTowerFloor = GameState.get('maxTowerFloor') || 0;
    if (floor > maxTowerFloor) {
        GameState.set('maxTowerFloor', floor);
        if (typeof checkAchievements === 'function') checkAchievements('towerFloor', floor);
    }

    if (typeof showToast === 'function') showToast('🏗 第' + floor + '层通关！金币+' + (reward.gold || 0), 'success');
    this.addBattleLog('🏗 第' + floor + '层通关！', 'reward');
};

// 退出爬塔
BattleManager.exitTower = function() {
    this.isTower = false;
    this.towerFloor = 0;
    this.exitDungeon();
    if (typeof switchScreen === 'function') switchScreen('dungeon');
    if (typeof showDungeonScreen === 'function') showDungeonScreen();
};

// ====== 魔王副本 ======

BattleManager.startDemonKingBattle = function() {
    if (this.isDungeon) { console.warn('[Battle] 已在副本中,忽略'); return; }
    if (this.isRunning) this.stopBattle();

    this.savedNormalState = {
        waveNumber: this.waveNumber, stage: this.stage,
        waveSpawnCount: this.waveSpawnCount, waveSpawned: this.waveSpawned,
        waveState: this.waveState, restTimer: this.restTimer,
        deathTimerInit: this.deathTimerInit, autoBattle: this.autoBattle,
        waitingNextChapter: this.waitingNextChapter, enemies: this.enemies.slice()
    };

    this.isDungeon = true;
    this.dungeonType = 'demonking';
    this.dungeonLevel = 1;
    this.demonKingDamage = 0;
    this.demonKingTimer = (BattleConfig && BattleConfig.DEMON_KING_TIME_LIMIT) || 60000;
    this.demonKingStartTime = Date.now();

    this.enemies = []; this.waveSpawned = 0;
    this.waveState = 'resting'; this.restTimer = 500; this.deathTimerInit = false;

    var dc = document.getElementById('dungeon-battle-canvas');
    if (dc) { this.switchCanvas(dc); this.resize(); }
    this._mainBattlePaused = true;

    for (var i = 0; i < this.allies.length; i++) {
        var a = this.allies[i]; a.alive = true; a.hp = a.maxHp;
        a.mp = a.maxMp; a.statusEffects = []; a.buffs = [];
        a.atkTimer = 0; a.skillCd = {};
    }

    document.getElementById('wave-status').textContent = '⏱ ' + ((BattleConfig && BattleConfig.DEMON_KING_TIME_LIMIT) || 60000)/1000 + '秒限时挑战';
    document.getElementById('wave-number').textContent = '👹 魔王·' + ((BattleConfig && BattleConfig.DEMON_KING_BOSS_NAME) || '世界之主');
    var headerEl = document.querySelector('.dungeon-battle-name');
    if (headerEl) headerEl.textContent = '魔王·竹林深处';
    this.addBattleLog('⏱ 限时' + ((BattleConfig && BattleConfig.DEMON_KING_TIME_LIMIT) || 60000)/1000 + '秒，造成尽可能多的伤害吧！', 'info');

    this._mainBattlePaused = false;
    this.startBattle();
    this._spawnDemonKing();
};

// 生成魔王BOSS
BattleManager._spawnDemonKing = function() {
    try {
        var boss = createMonsterInstance('eternal_dragon');
        if (boss) {
            boss.name = (BattleConfig && BattleConfig.DEMON_KING_BOSS_NAME) || '世界之主·芦笋';
            boss.maxHp = 99999999; boss.hp = 99999999;
            boss.atk = 5000; boss.def = 200;
            boss.isBoss = true; boss.isDemonKing = true;
            boss.elite = true;
            boss.alive = true;
            this.enemies = [boss];
            if (this.renderer && this.renderer.addEnemy) this.renderer.addEnemy(boss);
            this.addBattleLog('👹 魔王 ' + boss.name + ' 降临！', 'boss');
            if (typeof PixiFx !== 'undefined' && PixiFx.addParticles) {
                PixiFx.addParticles('boss_appear', { x: 0.5, y: 0.3 });
            }
        }
    } catch(e) { /* battle-ext */ console.warn('[DemonKing] BOSS出场异常:', e&&e.message); }
};

// 魔王奖励
BattleManager.demonKingReward = function() {
    var dmg = this.demonKingDamage || 0;
    var record = GameState.get('demonKingRecord') || 0;
    var newRecord = dmg > record;
    if (newRecord) GameState.set('demonKingRecord', dmg);
    GameState.mutate('demonKingKills', function(v) { return (v || 0) + 1; });

    var ratio = dmg / 1000000000; // 10亿拿满
    ratio = Math.min(1, Math.max(0, ratio));

    var caps = (BattleConfig && BattleConfig.DK_REWARD_CAPS) || {};
    var gold = Math.floor(500 + ((caps.gold || 1000000) - 500) * Math.pow(ratio, 0.66));
    var dust = Math.floor(200 + ((caps.dust || 200000) - 200) * Math.pow(ratio, 0.565));
    var lottery = Math.min(caps.lotteryStone || 1000, Math.floor((caps.lotteryStone || 1000) * Math.pow(ratio, 0.6)));
    var gems = Math.min(caps.gem || 1000, Math.floor((caps.gem || 1000) * Math.pow(ratio, 0.6)));
    var eggs = Math.min(caps.petEggStones || 1000, Math.floor((caps.petEggStones || 1000) * Math.pow(ratio, 0.6)));
    var upgrade = Math.min(caps.upgradeStone || 1000, Math.floor((caps.upgradeStone || 1000) * Math.pow(ratio, 0.6)));
    var reforgestone = Math.min(caps.reforgestone || 5000, Math.floor((caps.reforgestone || 5000) * Math.pow(ratio, 0.54)));
    var gemLevel = Math.min(caps.gemLevel || 5, 1 + Math.floor(4 * Math.pow(ratio, 0.7)));

    GameState.mutate('gold', function(g) { return (g || 0) + gold; });
    GameState.mutate('forgeDust', function(v) { return (v || 0) + dust; });
    GameState.mutate('lotteryStone', function(v) { return (v || 0) + lottery; });
    var gemTypes = ['ruby', 'sapphire', 'emerald', 'topaz'];
    for (var gi = 0; gi < gems; gi++) {
        GameState.mutate('gems', function(arr) { if (!arr) arr = []; arr.push({ type: gemTypes[gi % 4], level: gemLevel }); return arr; });
    }
    GameState.mutate('petEggStones', function(v) { return (v || 0) + eggs; });
    GameState.mutate('upgradeStone', function(v) { return (v || 0) + upgrade; });
    GameState.mutate('reforgestone', function(v) { return (v || 0) + reforgestone; });

    this.stopBattle();
    this.isDungeon = false; this.dungeonType = null;

    var fn = (typeof formatNumber === 'function') ? formatNumber : function(x) { return x; };
    var elapsed = Math.floor(((Date.now() - (this.demonKingStartTime || Date.now())) / 1000));
    var mins = Math.floor(elapsed / 60); var secs = elapsed % 60;
    var timeStr = mins > 0 ? (mins + '分' + secs + '秒') : (secs + '秒');

    if (!document.getElementById('dk-card-style')) {
        var s = document.createElement('style'); s.id = 'dk-card-style';
        s.textContent = '@keyframes dkCardIn{0%{opacity:0;transform:scale(0.7) translateY(40px)}100%{opacity:1;transform:scale(1) translateY(0)}}.dkr-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)}.dkr-row:last-child{border-bottom:none}.dkr-icon{font-size:16px;width:24px;text-align:center}.dkr-name{flex:1;font-size:13px;color:#ccc}.dkr-val{font-size:13px;font-weight:bold;color:#ffd700}';
        document.head.appendChild(s);
    }

    var rewardRows = '';
    if (gold > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">💰</span><span class="dkr-name">金币</span><span class="dkr-val">+' + fn(gold) + '</span></div>';
    if (dust > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">💠</span><span class="dkr-name">锻造粉尘</span><span class="dkr-val">+' + fn(dust) + '</span></div>';
    if (lottery > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">🎫</span><span class="dkr-name">抽奖石</span><span class="dkr-val">+' + lottery + '</span></div>';
    if (gems > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">💎</span><span class="dkr-name">Lv.' + gemLevel + ' 宝石</span><span class="dkr-val">×' + gems + '</span></div>';
    if (eggs > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">🥚</span><span class="dkr-name">蛋石</span><span class="dkr-val">+' + eggs + '</span></div>';
    if (upgrade > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">🔷</span><span class="dkr-name">升级石</span><span class="dkr-val">+' + upgrade + '</span></div>';
    if (reforgestone > 0) rewardRows += '<div class="dkr-row"><span class="dkr-icon">◇</span><span class="dkr-name">重铸石</span><span class="dkr-val">+' + reforgestone + '</span></div>';

    var card = document.createElement('div');
    card.id = 'demonking-reward-card';
    card.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);';
    card.innerHTML =
        '<div style="background:linear-gradient(180deg,#1a0a10,#0d0508);border:2px solid #f4433680;border-radius:20px;padding:24px 20px;width:88vw;max-width:380px;text-align:center;box-shadow:0 0 40px #f4433640;animation:dkCardIn 0.4s cubic-bezier(0.34,1.56,0.64,1);">' +
            '<div style="font-size:40px;margin-bottom:4px;">👹</div>' +
            '<div style="font-size:16px;font-weight:900;color:#f44336;margin-bottom:2px;">魔王战·结算</div>' +
            '<div style="font-size:11px;color:#888;margin-bottom:8px;">' + ((BattleConfig && BattleConfig.DEMON_KING_BOSS_NAME) || '世界之主·芦笋') + '</div>' +
            '<div style="display:flex;justify-content:space-around;margin:8px 0;"><div style="text-align:center;"><div style="font-size:11px;color:#888;">持续时间</div><div style="font-size:14px;color:#ffd700;">' + timeStr + '</div></div><div style="text-align:center;"><div style="font-size:11px;color:#888;">累计伤害</div><div style="font-size:14px;color:#ffd700;">' + fn(dmg) + '</div></div></div>' +
            (newRecord ? '<div style="font-size:12px;color:#f44336;margin-bottom:8px;">🏆 新纪录！</div>' : '') +
            '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:12px;margin:8px 0;text-align:left;">' + rewardRows + '</div>' +
            '<button onclick="closeDemonKingRewardCard()" style="width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#f44336,#d32f2f);color:#fff;font-size:15px;font-weight:bold;cursor:pointer;margin-top:8px;">✅ 确认领取</button>' +
        '</div>';
    document.body.appendChild(card);
};

// 全局：关闭魔王奖励卡片
function closeDemonKingRewardCard() {
    var c = document.getElementById('demonking-reward-card');
    if (c) c.remove();
    if (typeof closeDungeonBattleModal === 'function') try { closeDungeonBattleModal(); } catch(e) {}
    if (typeof switchScreen === 'function') switchScreen('dungeon');
}

})();
