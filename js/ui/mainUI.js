// ========== 主界面UI ==========

// 屏幕切换
function switchScreen(screenId) {
    AudioManager.play('click');
    // 切换前：如果是高占用屏，停止其他系统
    var prevActive = document.querySelector('.screen.active');
    if (prevActive && prevActive.id === 'screen-home' && screenId !== 'home') {
        if (typeof HomeSystem !== 'undefined' && HomeSystem && typeof HomeSystem.stop === 'function') {
            HomeSystem.stop();
        }
    }
    if (prevActive && prevActive.id !== 'screen-home' && screenId === 'home') {
        // 切到家园 → 停止主战场战斗动画
        if (typeof BattleManager !== 'undefined' && BattleManager && typeof BattleManager.stopBattle === 'function') {
            // 仅在未在其他业务屏时停止（如 team/hero 等不会影响战斗）
        }
    }

    document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.remove('active');
    });
    document.getElementById('screen-' + screenId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.screen === screenId);
    });

    // 刷新UI
    if (screenId === 'team') refreshTeamUI();
    if (screenId === 'hero') refreshHeroUI();
    if (screenId === 'inventory') refreshInventoryUI();
    if (screenId === 'talent') refreshTalentUI();
    if (screenId === 'forge') switchForgeTab('synthesize');
    if (screenId === 'settings') refreshSettingsUI();
    if (screenId === 'dungeon') showDungeonScreen();
    if (screenId === 'home') {
        // 启动家园场景
        if (typeof HomeSystem !== 'undefined' && HomeSystem && typeof HomeSystem.start === 'function') {
            HomeSystem.start();
        }
        // 同步家园资源显示
        syncHomeResources();
        // ★ HOME_5 修复：多个家园场景tab渲染
        renderHomeSceneTabs();
    }
    if (screenId === 'main') {
        if (typeof BattleManager !== 'undefined' && BattleManager) {
            // ★ v7.x 修复：用 rAF 替代 setTimeout(0)，确保 layout 完成后再 resize
            //   setTimeout(0) 是宏任务，可能在浏览器 layout 之前执行 → canvas 仍为 0×0
            //   requestAnimationFrame 在下一帧绘制前执行，layout 已稳定
            if (typeof BattleManager.resize === 'function') {
                requestAnimationFrame(function() {
                    try { BattleManager.resize(); } catch(e) {}
                    // 二次兜底：100ms 后再 resize 一次，确保绝对没问题
                    setTimeout(function() {
                        try { BattleManager.resize(); } catch(e) {}
                    }, 100);
                });
            }
            // ★ v2.6.2 BUG#10 修复：PixiFx.init 必须在 canvas 可见时才能成功创建 WebGL 上下文
            //   页面加载时 screen-main 是 display:none,这时 init 会失败但 PixiFx.init 有 try/catch 静默吞错
            //   导致 PixiFx.initialized=false,所有特效都不显示（直到进副本重 init 才生效）
            //   切到 main 屏时 canvas 已经可见,补一次 init
            setTimeout(function() {
                try {
                    if (typeof PixiFx !== 'undefined' && !PixiFx.initialized) {
                        var pixiCanvas = document.getElementById('pixi-overlay-canvas');
                        if (pixiCanvas) {
                            PixiFx.init(pixiCanvas, BattleManager.battleWidth || 480, BattleManager.battleHeight || 320);
                        }
                    }
                } catch (e) {
                    console.error('[PixiFx] 延后初始化失败:', e);
                }
            }, 50);
            // ★ HOME_5 修复：从 home 主动跳到 main 才启动战斗
            //   - 从 home 来：玩家点过"进入战斗"按钮，希望立即开始战斗
            //   - 从其他屏幕来：仅是查看/调整阵容，战斗保持 paused 状态
            var fromHome = prevActive && prevActive.id === 'screen-home';
            if (fromHome) {
                // 从家园进入 → 启动战斗 + 恢复 paused 状态
                if (BattleManager._mainBattlePaused) {
                    BattleManager._mainBattlePaused = false;
                    var resumeBtn = document.getElementById('btn-resume-main-battle');
                    if (resumeBtn) resumeBtn.style.display = 'none';
                }
                if (!BattleManager.isRunning && typeof BattleManager.startBattle === 'function') {
                    BattleManager.startBattle();
                }
            }
            // 从其他屏幕来：保持 paused 状态 + 显示"继续战斗"按钮
            if (BattleManager._mainBattlePaused && BattleManager.enemies && BattleManager.enemies.length === 0) {
                var resumeBtn2 = document.getElementById('btn-resume-main-battle');
                if (resumeBtn2) resumeBtn2.style.display = 'inline-block';
            }
        }
    }
    // 转生屏：刷新界面
    if (screenId === 'rebirth') {
        if (typeof refreshRebirthUI === 'function') refreshRebirthUI();
    }
    // 宠物屏：刷新界面
    if (screenId === 'pet') {
        if (typeof showPetScreen === 'function') showPetScreen();
        // ★ v6.0 内存泄漏修复：切换到宠物屏时启动孵化倒计时定时器，离开时停止
        if (typeof startPetIncubationTimer === 'function') startPetIncubationTimer();
    }
    // ★ v6.0 内存泄漏修复：离开宠物屏时停止孵化倒计时定时器
    if (prevActive && prevActive.id === 'screen-pet' && screenId !== 'pet') {
        if (typeof stopPetIncubationTimer === 'function') stopPetIncubationTimer();
    }
}

// 同步家园顶栏资源
function syncHomeResources() {
    if (typeof gameState === 'undefined' || !gameState) return;
    var goldEl = document.getElementById('home-gold-display');
    if (goldEl) goldEl.textContent = Math.floor(gameState.gold || 0);
    var gemEl = document.getElementById('home-gem-count');
    if (gemEl) gemEl.textContent = (gameState.gems && gameState.gems.length) || 0;
    var staminaEl = document.getElementById('home-stamina-display');
    if (staminaEl) {
        if (typeof StaminaManager !== 'undefined' && StaminaManager && StaminaManager.get) {
            staminaEl.textContent = StaminaManager.get();
            // ★ v3.5.0 材料资源显示
    var resEl = document.getElementById('home-info-resources');
    if (resEl && gameState.materials) {
        /* resources moved to cooking window */
    }
    renderHomeSceneTabs();
} else if (gameState) {
            staminaEl.textContent = Math.floor(gameState.stamina || 0);
        } else {
            staminaEl.textContent = 60;
        }
    }
}

// ★ HOME_5 修复：渲染家园场景tab → 改为点击弹卡片切换
function renderHomeSceneTabs() {
    var wrap = document.getElementById('home-scene-tabs');
    if (!wrap) return;
    if (typeof HomeSystem === 'undefined' || !HomeSystem || typeof HomeSystem.getSceneList !== 'function') {
        wrap.innerHTML = '';
        return;
    }
    var list = HomeSystem.getSceneList();
    var current = null;
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === HomeSystem.currentScene) { current = list[i]; break; }
    }
    if (!current) { wrap.innerHTML = ''; return; }
    // 显示当前场景名称，点击弹出卡片选择
    wrap.innerHTML = '<span class="home-scene-current" onclick="showSceneCardPopup()" style="cursor:pointer;font-size:12px;color:#ffd700;' +
        'background:rgba(255,215,0,0.12);padding:3px 10px;border-radius:12px;border:1px solid rgba(255,215,0,0.25);white-space:nowrap;">' +
        current.icon + ' ' + current.name + ' <span style="font-size:10px;color:#888;">▼</span></span>';
}

// ★ v3.5.0 场景切换卡片弹窗
function showSceneCardPopup() {
    if (typeof HomeSystem === 'undefined' || !HomeSystem || typeof HomeSystem.getSceneList !== 'function') return;
    var list = HomeSystem.getSceneList();
    var current = HomeSystem.currentScene;
    var html = '<div class="modal-overlay" onclick="if(event.target===this)closeModal()">' +
        '<div class="modal-content" style="max-width:380px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ffd700;border-radius:14px;padding:0;overflow:hidden;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#ffd700,#ff9800);padding:10px 14px;text-align:center;">' +
        '<div style="font-size:15px;font-weight:bold;color:#1a1a2e;">🏔️ 选择营地场景</div>' +
        '<div style="font-size:10px;color:rgba(0,0,0,0.6);margin-top:2px;">随章节推进解锁新场景</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeModal()">✕</span>' +
        '</div><div style="padding:12px;">';
    for (var i = 0; i < list.length; i++) {
        var s = list[i];
        var isActive = s.id === current;
        var sceneDesc = '';
        switch (s.id) {
            case 'meadow': sceneDesc = '🌾 宁静的草原，初始营地'; break;
            case 'snow': sceneDesc = '❄️ 白雪皑皑，Ch.20 解锁'; break;
            case 'forest': sceneDesc = '🌲 密林深处，Ch.40 解锁'; break;
            case 'volcano': sceneDesc = '🌋 熔岩之地，Ch.60 解锁'; break;
        }
        html += '<div class="scene-card" onclick="' + (s.unlocked ? 'selectSceneFromCard(\'' + s.id + '\')' : '') + '" style="' +
            'display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:6px;' +
            'background:' + (isActive ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)') + ';' +
            'border:1px solid ' + (isActive ? 'rgba(255,215,0,0.4)' : (s.unlocked ? 'rgba(255,255,255,0.08)' : 'rgba(85,85,85,0.3)')) + ';' +
            'border-radius:8px;cursor:' + (s.unlocked ? 'pointer' : 'default') + ';' +
            'opacity:' + (s.unlocked ? '1' : '0.4') + ';">' +
            '<span style="font-size:24px;">' + s.icon + '</span>' +
            '<div style="flex:1;"><div style="font-size:13px;font-weight:bold;color:' + (isActive ? '#ffd700' : (s.unlocked ? '#fff' : '#666')) + ';">' + s.name + '</div>' +
            '<div style="font-size:10px;color:#888;">' + (s.unlocked ? sceneDesc : '🔒 未解锁') + '</div></div>' +
            (isActive ? '<span style="font-size:12px;color:#ffd700;">✓ 当前</span>' : '') +
            '</div>';
    }
    html += '</div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

function selectSceneFromCard(sceneId) {
    if (typeof HomeSystem !== 'undefined' && HomeSystem && HomeSystem.setScene) {
        HomeSystem.setScene(sceneId);
    }
    renderHomeSceneTabs();
    closeModal();
}

// 从家园进入战斗（HOME_2.2 新增）
function enterBattleFromHome() {
    console.log('[CQC][diag] enterBattleFromHome START, isInBattle=' + (typeof isInBattle === 'function' ? isInBattle() : '?'));
    if (typeof AudioManager !== 'undefined' && AudioManager.play) AudioManager.play('click');
    // 检查是否已在战斗中
    if (typeof isInBattle === 'function' && isInBattle()) {
        console.log('[CQC][diag] 已在战斗中,直接切屏');
        if (typeof showToast === 'function') showToast('当前正在战斗中', 'warning');
        switchScreen('main');
        return;
    }
    // 停止家园
    if (typeof HomeSystem !== 'undefined' && HomeSystem && typeof HomeSystem.stop === 'function') {
        HomeSystem.stop();
    }
    switchScreen('main');
    var curStage = (typeof gameState !== 'undefined' && gameState && gameState.stage) || 1;
    if (typeof showToast === 'function') {
        showToast('⚔ 进入战斗 · 第 ' + curStage + ' 章', 'info');
    }
    // ★ vConsole 诊断补丁：进入战斗时强制 setTeam + 重置 battle paused 状态
    //   修复因 paused/loading 残留导致 startBattle 不被调用、allies 为空的 bug
    setTimeout(function() {
        try {
            if (typeof BattleManager === 'undefined' || !BattleManager) {
                console.error('[CQC][diag] BattleManager 不存在');
                return;
            }
            // 强制 team → allies
            var heroes = (typeof getTeamHeroes === 'function') ? getTeamHeroes() : [];
            console.log('[CQC][diag] getTeamHeroes count=' + heroes.length + ', team=' + JSON.stringify({
                front: gameState.team && gameState.team.front && gameState.team.front.id,
                back1: gameState.team && gameState.team.back1 && gameState.team.back1.id,
                back2: gameState.team && gameState.team.back2 && gameState.team.back2.id,
                back3: gameState.team && gameState.team.back3 && gameState.team.back3.id
            }));
            if (heroes.length > 0) {
                BattleManager.setTeam(heroes);
                console.log('[CQC][diag] BattleManager.setTeam 完成, allies.length=' + BattleManager.allies.length);
            } else {
                console.warn('[CQC][diag] team 为空,无法 setTeam');
            }
            // 解除 paused
            if (BattleManager._mainBattlePaused) {
                BattleManager._mainBattlePaused = false;
                console.log('[CQC][diag] 解除 _mainBattlePaused');
                var rb = document.getElementById('btn-resume-main-battle');
                if (rb) rb.style.display = 'none';
            }
            // 强制启动战斗
            if (!BattleManager.isRunning && typeof BattleManager.startBattle === 'function') {
                console.log('[CQC][diag] 调用 startBattle');
                BattleManager.startBattle();
            } else {
                console.log('[CQC][diag] 跳过 startBattle (isRunning=' + BattleManager.isRunning + ')');
            }
        } catch (e) {
            console.error('[CQC][diag] enterBattleFromHome 后置补丁异常:', e);
        }
    }, 200);
}

// 返回家园（HOME_2.2 新增）
function returnToHome() {
    if (typeof AudioManager !== 'undefined' && AudioManager.play) AudioManager.play('click');
    if (typeof isInBattle === 'function' && isInBattle()) {
        // 副本中拦截
        if (typeof isInDungeon === 'function' && isInDungeon()) {
            if (typeof showToast === 'function') showToast('副本中无法返回家园', 'warning');
            return;
        }
        // 弹窗确认（关卡会被重置）
        var curStage = (typeof gameState !== 'undefined' && gameState && gameState.stage) || 1;
        var curWave = (typeof BattleManager !== 'undefined' && BattleManager && BattleManager.waveNumber) || 1;
        var levelIdx = ((curWave - 1) % 20) + 1;
        var msg = '当前战斗将被停止，<br><span style="color:#ff7766;">关卡进度会重置到第 ' + curStage + ' 章第 1 关</span>。<br>确定要返回家园吗？';
        if (typeof showConfirm === 'function') {
            showConfirm('返回家园', msg, function() { doReturnToHome(); });
        } else if (confirm('当前关卡会被重置，确定返回家园吗？')) {
            doReturnToHome();
        }
        return;
    }
    // 不在战斗 → 直接返回
    doReturnToHome();
}

function doReturnToHome() {
    // 停止战斗动画
    if (typeof BattleManager !== 'undefined' && BattleManager && typeof BattleManager.stopBattle === 'function') {
        BattleManager.stopBattle();
    }
    // 切到家园
    switchScreen('home');
    if (typeof showToast === 'function') showToast('🏕 已返回家园', 'info');
}

// 更新资源显示

// ====== 家园商人 ======
function openMerchant() {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = function(e) { if (e.target === this) this.remove(); };
    
    var magicCore = GameState.get('magicCore') || 0;
    var gemCount = magicCore;
    
    var items = [
        { id: 'lotteryStone', name: '抽奖石', icon: '🎫', price: 20, desc: '用于抽奖召唤宠物/装备' },
        { id: 'forgeDust', name: '锻造粉尘', icon: '💠', price: 5, desc: '用于打造装备', count: 500 },
        { id: 'reforgestone', name: '重铸石', icon: '◇', price: 5, desc: '用于重铸装备词条', count: 50 },
        { id: 'upgradeStone', name: '升级石', icon: '🔷', price: 10, desc: '用于装备升阶' },
        { id: 'petFood', name: '宠物食物', icon: '🍖', price: 10, desc: '宠物口粮', count: 200 },
        { id: 'petEggStones', name: '蛋石', icon: '🥚', price: 15, desc: '宠物蛋石' },
        { id: 'stamina', name: '体力', icon: '⚡', price: 10, desc: '副本挑战体力', count: 60 },
    ];
    
    var html = '<div class="modal-content" style="max-width:400px;background:linear-gradient(135deg,#1a1a2e,#2a1030);border:2px solid rgba(255,152,0,0.4);border-radius:16px;padding:20px;max-height:80vh;overflow-y:auto;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
        '<div><span style="font-size:24px;">🧑‍🌾</span><span style="color:#ffb300;font-size:18px;font-weight:bold;margin-left:8px;">商人</span></div>' +
        '<div style="font-size:12px;color:#ff6f00;">🧬 魔核: ' + gemCount + '</div>' +
        '<span style="font-size:20px;color:rgba(255,255,255,0.4);cursor:pointer;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span></div>' +
        '<div style="font-size:11px;color:#aaa;margin-bottom:14px;">用魔核兑换各种稀有物资</div>' +
        // 广告获取条（入口，不加载实际SDK）
        '<div style="display:flex;align-items:center;gap:8px;padding:10px;background:linear-gradient(135deg,rgba(33,150,243,0.1),rgba(33,150,243,0.05));border:1px solid rgba(33,150,243,0.3);border-radius:12px;margin-bottom:12px;">' +
        '<span style="font-size:20px;">📺</span>' +
        '<span style="flex:1;font-size:12px;color:#64b5f6;">观看广告可获得魔核</span>' +
        '<button class="btn" style="font-size:11px;padding:4px 12px;background:linear-gradient(135deg,#64b5f6,#1e88e5);border:none;color:#fff;font-weight:bold;" onclick="watchAdForMagicCore()">看广告</button>' +
        '</div>';
    
    for (var mi = 0; mi < items.length; mi++) {
        var it = items[mi];
        var canBuy = gemCount >= it.price;
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,152,0,0.15);border-radius:10px;margin-bottom:6px;">' +
            '<span style="font-size:20px;">' + it.icon + '</span>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:13px;color:#fff;font-weight:bold;">' + it.name + '</div>' +
            '<div style="font-size:10px;color:#888;">' + it.desc + '</div></div>' +
            '<div style="font-size:10px;color:#ff6f00;white-space:nowrap;">🧬' + it.price + '</div>' +
            (canBuy ? '<button class="btn" style="font-size:10px;padding:4px 10px;background:rgba(255,152,0,0.2);border:1px solid #ff9800;color:#ff9800;" onclick="buyFromMerchant(\'' + it.id + '\', ' + it.price + ', ' + (it.count || 1) + ')">购买</button>' : 
            '<span style="font-size:10px;color:#666;">不足</span>') +
        '</div>';
    }
    
    html += '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}

function buyFromMerchant(itemId, price, count) {
    var mc = GameState.get('magicCore') || 0;
    if (mc < price) { showToast('魔核不足!', 'warning'); return; }
    
    // 消耗魔核
    GameState.set('magicCore', mc - price);
    
    // 发放物品
    if (itemId === 'stamina') {
        GameState.mutate('stamina', function(v) { return (v || 0) + count; });
    } else {
        GameState.mutate(itemId, function(v) { return (v || 0) + count; });
    }
    
    if (typeof updateResources === 'function') updateResources();
    showToast('✅ 购买成功: ' + (count > 1 ? (count + ' ') : '') + itemId, 'success');
    
    // 刷新商人面板
    var old = document.querySelector('.modal-overlay');
    if (old) old.remove();
    openMerchant();
}

// ====== 广告获取魔核（入口 + 空壳，待接入真实广告SDK）======
// ★ 设计：
//   1. 目前为模拟模式：点击"看广告"直接获得魔核（模拟奖励）
//   2. 接入真实广告SDK时替换 watchAd() 内部逻辑即可
//   3. 广告类型推荐：激励视频（Rewarded Video）— 看完完整广告发放奖励
//   4. 广告平台推荐：Unity Ads / AdMob / Vungle（国内用穿山甲/优量汇）
//
//   接入步骤：
//     ① 在 Android 工程接入 SDK（如 Unity Ads）
//     ② Capacitor 插件桥接原生广告 API
//     ③ 替换 watchAd() 中的 Capacitor 插件调用
//     ④ 设置每日观看上限（防刷）

// 每日可观看次数
var MAX_DAILY_ADS = 10;
// 每次观看获得魔核数
var AD_REWARD_AMOUNT = 10;

function watchAdForMagicCore() {
    // 1. 检查每日上限
    var today = new Date().toDateString();
    var adData = GameState.get('adWatchData') || {};
    var dailyCount = adData.date === today ? (adData.count || 0) : 0;
    
    if (dailyCount >= MAX_DAILY_ADS) {
        showToast('⚠ 今日观看次数已用完（上限 ' + MAX_DAILY_ADS + ' 次）', 'warning');
        return;
    }
    
    // 2. 调起广告（当前模拟）
    AdBridge.showRewardedVideo(function(success) {
        if (success) {
            // 3. 发放奖励
            GameState.mutate('magicCore', function(v) { return (v || 0) + AD_REWARD_AMOUNT; });
            
            // 4. 更新每日计数
            var newAdData = { date: today, count: dailyCount + 1 };
            GameState.set('adWatchData', newAdData);
            
            if (typeof updateResources === 'function') updateResources();
            showToast('📺 感谢观看！获得 ' + AD_REWARD_AMOUNT + ' 魔核（今日 ' + (dailyCount + 1) + '/' + MAX_DAILY_ADS + ' 次）', 'success');
        } else {
            showToast('❌ 广告加载失败', 'error');
        }
        // 刷新商人面板
        var old = document.querySelectorAll('.modal-overlay');
        for (var oi = 0; oi < old.length; oi++) old[oi].remove();
        openMerchant();
    });
}

// ====== 广告桥接（空壳） ======
// 当前为模拟模式。接入真实广告SDK后替换：
//   - rewardedVideoAd.load() → 加载激励视频
//   - rewardedVideoAd.show() → 展示
//   - onAdReward() → 回调发放奖励
var AdBridge = {
    // 当前模式: 'mock'（模拟）| 'unity' | 'admob' | 'pangle'（穿山甲）
    mode: 'mock',
    
    // 展示激励视频广告
    showRewardedVideo: function(callback) {
        if (AdBridge.mode === 'mock') {
            // ★ 模拟广告：500ms 后模拟用户看完广告
            console.log('[AdBridge] 模拟激励视频广告播放...');
            setTimeout(function() {
                var watched = Math.random() > 0.1;  // 90% 模拟成功
                callback(watched);
            }, 1500);
            return;
        }
        
        // ==== 以下为真实广告SDK接入模板 ====
        /*
        // Unity Ads 示例
        if (AdBridge.mode === 'unity') {
            UnityAds.showRewardedVideo({
                placementId: 'Rewarded_Android',
            }).then(function() {
                callback(true);
            }).catch(function() {
                callback(false);
            });
        }
        
        // AdMob 示例
        if (AdBridge.mode === 'admob') {
            AdMob.prepareRewardVideoAd().then(function() {
                AdMob.showRewardVideoAd().then(function() {
                    callback(true);
                });
            }).catch(function() {
                callback(false);
            });
        }
        
        // 穿山甲（Pangle）示例
        if (AdBridge.mode === 'pangle') {
            Pangle.loadRewardVideo('placement_id').then(function() {
                Pangle.showRewardVideo().then(function(reward) {
                    callback(reward.verified);
                });
            }).catch(function() {
                callback(false);
            });
        }
        */
        
        // 无SDK时走模拟
        console.warn('[AdBridge] 未配置真实广告SDK，使用模拟模式');
        setTimeout(function() { callback(true); }, 1500);
    },
    
    // 获取每日剩余次数
    getRemainingDailyCount: function() {
        var today = new Date().toDateString();
        var adData = GameState.get('adWatchData') || {};
        if (adData.date !== today) return MAX_DAILY_ADS;
        return Math.max(0, MAX_DAILY_ADS - (adData.count || 0));
    }
};
function updateResources() {
    if (!gameState) return;
    document.getElementById('gold-display').textContent = Math.floor(gameState.gold || 0);
    if (document.getElementById('talent-gold')) {
        document.getElementById('talent-gold').textContent = Math.floor(gameState.gold || 0);
    }
    // 家园顶栏同步 (syncHomeResources 内有 if 守卫, DOM 不存在时是 noop)
    if (typeof syncHomeResources === 'function') syncHomeResources();
}

// ★ v6.0: 用 GameState.on 注册响应式绑定，字段变化时自动刷新 UI
//   当代码改用 GameState.set('gold', ...) / GameState.mutate('gold', fn) 后，
//   updateResources 会被自动触发，不再需要到处手动调用。
//   旧代码直接修改 gameState.gold 时不受影响（不会触发监听），
//   两种模式可共存，逐步迁移。
(function() {
    if (typeof GameState === 'undefined') return;
    GameState.on('gold', function() { updateResources(); });
    GameState.on('gems', function() { updateResources(); });
    GameState.on('stamina', function() { updateResources(); });
    GameState.on('forgeDust', function() { updateResources(); });
    GameState.on('reforgestone', function() { updateResources(); });
    GameState.on('upgradeStone', function() { updateResources(); });
    GameState.on('lotteryStone', function() { updateResources(); });
    GameState.on('petFood', function() { updateResources(); if (typeof updatePetResources === 'function') updatePetResources(); });
    GameState.on('petEggStones', function() { updateResources(); if (typeof updatePetResources === 'function') updatePetResources(); });
    GameState.on('pets', function() { if (typeof showPetScreen === 'function') showPetScreen(); });
    GameState.on('inventory', function() { updateResources(); });
    GameState.on('heroes', function() {
        updateResources();
        if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
        if (typeof refreshTeamUI === 'function') refreshTeamUI();
    });
    console.log('[GameState] 响应式 UI 绑定已注册 (gold/gems/stamina/forgeDust/reforgestone/heroes)');
})();

// 检查升级（单英雄独立升级，每5级给2技能点）
function checkLevelUp(hero) {
    if (!hero) return;
    var leveled = false;
    while (hero.level < 999 && hero.exp >= (hero.expToNext || getExpToNext(hero.level))) {
        hero.exp -= (hero.expToNext || getExpToNext(hero.level));
        hero.level++;
        hero.expToNext = getExpToNext(hero.level);
        // 每5级给1技能点
        var clsName = getClassData(hero.classId);
        var name = clsName ? clsName.name : hero.classId;
        if (hero.level % 5 === 0) {
            hero.skillPoints = (hero.skillPoints || 0) + 1;
            showToast(name + ' 达到 Lv.' + hero.level + '，获得1点技能点!', 'success');
        } else {
            showToast(name + ' 升级! 达到 Lv.' + hero.level, 'success');
        }
        leveled = true;
    }
    if (leveled) {
        AudioManager.play('levelup');
        updateResources();
        updateMainTeamPower();
        // 关键修复：升级后立即同步队伍/角色详情界面，避免 UI 显示 stale data
        if (typeof refreshTeamUI === 'function') refreshTeamUI();
        if (typeof refreshHeroUI === 'function') refreshHeroUI();
        // v2.6.2: 升级特效(金光柱 + 上升光点)
        if (typeof BattleManager !== 'undefined' && BattleManager._playLevelUpEffect) {
            BattleManager._playLevelUpEffect();
        }
    }
}

// 显示章节选择弹窗
function showStageSelect() {
    var overlay = document.getElementById('stage-select-overlay');
    if (!overlay) return;
    var list = document.getElementById('stage-list');
    if (!list) return;
    
    var maxStage = gameState.maxStage || 1;
    var currentStage = gameState.stage || 1;
    var html = '';
    
    for (var i = 1; i <= maxStage + 1; i++) {
        var stageName = getStageName(i);
        var recPower = getRecommendedPower(i);
        var isCompleted = i < maxStage;
        var isCurrent = i === currentStage;
        var isLocked = i > maxStage;
        
        var cls = 'stage-item';
        if (isCurrent) cls += ' current';
        else if (isCompleted) cls += ' completed';
        else if (isLocked) cls += ' locked';
        
        var checkHtml = '';
        if (isCurrent) checkHtml = '<span class="stage-item-check">▷</span>';
        else if (isCompleted) checkHtml = '<span class="stage-item-check">✔</span>';
        else if (isLocked) checkHtml = '<span class="stage-item-check">🔒</span>';
        
        var infoText = '';
        if (isCurrent) infoText = '当前';
        else if (isCompleted) infoText = '已通关';
        else if (isLocked) infoText = '未解锁';
        
        html += '<div class="' + cls + '" ' +
            (isLocked ? '' : 'onclick="selectStage(' + i + ')"') + '>' +
            checkHtml +
            '<span class="stage-item-name">第' + i + '章 ' + stageName + '</span>' +
            '<span class="stage-item-info">' + infoText + '</span>' +
            '<span class="stage-item-power">战力' + (typeof formatNumber === 'function' ? formatNumber(recPower) : recPower) + '</span>' +
            '</div>';
    }
    
    list.innerHTML = html;
    overlay.style.display = 'flex';
}

function hideStageSelect() {
    var overlay = document.getElementById('stage-select-overlay');
    if (overlay) overlay.style.display = 'none';
}

function selectStage(stage) {
    if (stage > (gameState.maxStage || 1)) {
        showToast('该章节未解锁', 'warning');
        return;
    }
    hideStageSelect();
    BattleManager.restartAtStage(stage);
    showToast('切换到第' + stage + '章', 'info');
}

// 初始化快捷键
function initUI() {
    // 导航按钮
    // ★ HOME_5 修复：战斗按钮（data-screen=main）需智能切换
    //   - 当前在 main 屏（战斗中）→ 点击切到 home（返回家园）
    //   - 当前在 home 屏 → 点击切到 main（进入战斗）
    //   - 在其他屏幕（team/hero等）→ 点击切到 main（查看主战场）
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = this.dataset.screen;
            if (target === 'main') {
                var cur = document.querySelector('.screen.active');
                if (cur && cur.id === 'screen-main') {
                    // 在 main 屏中点战斗按钮 → 返回家园
                    returnToHome();
                    return;
                }
                if (cur && cur.id === 'screen-home') {
                    // 在家园屏中点战斗按钮 → 进入战斗
                    enterBattleFromHome();
                    return;
                }
            }
            switchScreen(target);
        });
    });
    // HOME_2.1：启动时进入家园屏 → 启动 HomeSystem
    var homeActive = document.getElementById('screen-home');
    if (homeActive && homeActive.classList.contains('active')) {
        if (typeof HomeSystem !== 'undefined' && HomeSystem && typeof HomeSystem.start === 'function') {
            // 下一帧再启动，确保 layout 稳定
            setTimeout(function() { HomeSystem.start(); }, 0);
        }
        syncHomeResources();
        // ★ HOME_5 修复：首次进入游戏时战斗需处于 paused 状态
        //   默认显示家园屏，战斗不应自动进行。
        //   玩家必须点“进入战斗”或主战场的“继续战斗”按钮才会启动。
        if (typeof BattleManager !== 'undefined' && BattleManager) {
            BattleManager._mainBattlePaused = true;
            // 同步波浪状态提示
            var ws = document.getElementById('wave-status');
            if (ws) ws.textContent = '⏸ 战斗暂停中 — 进入家园休息，或点“继续战斗”开始';
            // 显示主战场的“继续战斗”按钮
            var resumeBtn = document.getElementById('btn-resume-main-battle');
            if (resumeBtn) resumeBtn.style.display = 'inline-block';
        }
    }
    // 窗口尺寸变化时同步 canvas
    window.addEventListener('resize', function() {
        if (typeof HomeSystem !== 'undefined' && HomeSystem && HomeSystem.running && typeof HomeSystem.resize === 'function') {
            HomeSystem.resize();
        }
    });

    // ★ 启动 3 秒后自动检查更新（CDN 缓存可能 5-10 分钟才能拉到新版本）
    //   启动延迟 3 秒: 避免阻塞主流程 + 主页 UI 先渲染
    setTimeout(function() {
        if (typeof checkForUpdate === 'function') {
            checkForUpdate(true);  // true = 弹 toast/confirm 反馈
        }
    }, 3000);
}

// 检查转生按钮可见性（通关第100章后显示轮回导航按钮）
function checkRebirthUnlock() {
    if (!window.gameState && !gameState) return;
    var gs = gameState || window.gameState || {};
    if (!gs || !gs.stage) return;
    var navBtn = document.getElementById('nav-btn-rebirth');
    if (!navBtn) return;
    var stage = gameState.stage || 1;
    // 通关第100章或已转生过就显示
    if (stage >= 100 || gameState.hasRebirthed) {
        navBtn.style.display = '';
    } else {
        navBtn.style.display = 'none';
    }
}


