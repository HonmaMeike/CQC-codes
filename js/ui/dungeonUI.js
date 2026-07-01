// ========== 爬塔·无尽 + 抽奖 ==========
// 取代旧的 4 副本系统（金币/重铸石/宝石/装备副本）
// 本页面提供两个并列大卡：爬塔入口 + 抽奖入口

/* global GameState */

// ★ v7.4.1: 副本 modal 标题查表（修复硬编码只处理 tower，其他全显示"副本"）
var DUNGEON_MODAL_TITLES = {
    tower:     '爬塔·无尽',
    demonking: '魔王·竹林深处',
    gold:      '金币副本',
    stone:     '粉尘重铸石副本',
    gem:       '宝石副本',
    equip:     '装备副本'
};

// 体力恢复倒计时（保留旧 API 以兼容其他模块）
function getStaminaCountdown() {
    if (!gameState) return '';
    var smMax = (typeof StaminaManager !== 'undefined' && StaminaManager.MAX) ? StaminaManager.MAX : 240;
    if (GameState.get('stamina') >= smMax) return '已满';
    var elapsed = Date.now() - (GameState.get('lastStaminaTime') || Date.now());
    var remaining = 120000 - (elapsed % 120000);
    var seconds = Math.ceil(remaining / 1000);
    var min = Math.floor(seconds / 60);
    var sec = seconds % 60;
    return min + '分' + sec + '秒后恢复';
}

// 副本体力显示（保留旧名以兼容 game.js 的 updateResource 链）
function updateDungeonStaminaUI() {
    var el = document.getElementById('dungeon-stamina');
    if (!el) return;
    var smMax = (typeof StaminaManager !== 'undefined' && StaminaManager.MAX) ? StaminaManager.MAX : 240;
    if (!gameState) { el.textContent = '0 / ' + smMax; return; }
    el.textContent = (GameState.get('stamina') || 0) + ' / ' + smMax;
    var cd = document.getElementById('dungeon-stamina-cd');
    if (cd) cd.textContent = getStaminaCountdown();
}

// ========== 爬塔大厅渲染 ==========
function showDungeonScreen() {
    var container = document.getElementById('dungeon-container');
    if (!container) return;
    container.innerHTML = '';

    // ★ 每日增益横幅
    var daily = (typeof getDailyBonus === 'function') ? getDailyBonus() : null;
    var dailyBanner = document.createElement('div');
    dailyBanner.className = 'daily-bonus-banner';
    dailyBanner.style.cssText = 'background:' + (daily ? daily.bannerBg : 'linear-gradient(135deg,#555,#444)') + ';border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    dailyBanner.innerHTML =
        '<div style="font-size:24px;">' + (daily ? daily.icon : '📅') + '</div>' +
        '<div style="flex:1;">' +
            '<div style="font-size:14px;font-weight:bold;color:#fff;">今日: ' + (daily ? daily.name : '普通日') + '</div>' +
            '<div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px;">' + (daily ? daily.desc : '') + '</div>' +
        '</div>';
    container.appendChild(dailyBanner);

    // ★ 新版大厅：两个大卡（爬塔 + 抽奖）
    var tower = (gameState && GameState.get('tower')) || initTowerState();
    var stamina = (gameState && GameState.get('stamina')) || 0;
    var stone = (gameState && GameState.get('lotteryStone')) || 0;

    // ===== 顶部信息条 =====
    var header = document.createElement('div');
    header.className = 'dungeon-v4-header';
    header.innerHTML =
        '<div class="dungeon-v4-info">' +
            '<div class="dvi-cell">' +
                '<div class="dvi-label">最高层</div>' +
                '<div class="dvi-val tower-stat-best">' + (tower.bestFloor || 1) + '</div>' +
            '</div>' +
            '<div class="dvi-cell">' +
                '<div class="dvi-label">下一层</div>' +
                '<div class="dvi-val">' + (tower.currentFloor || 1) + '</div>' +
            '</div>' +
            '<div class="dvi-cell">' +
                '<div class="dvi-label">总挑战</div>' +
                '<div class="dvi-val">' + (tower.totalRuns || 0) + '</div>' +
            '</div>' +
            '<div class="dvi-cell">' +
                '<div class="dvi-label">💪 体力</div>' +
                '<div class="dvi-val" id="dungeon-stamina">' + stamina + ' / ' + ((typeof StaminaManager !== 'undefined' && StaminaManager.MAX) ? StaminaManager.MAX : 240) + '</div>' +
                '<div class="dvi-cd" id="dungeon-stamina-cd">' + getStaminaCountdown() + '</div>' +
            '</div>' +
        '</div>';
    container.appendChild(header);

    // ===== 卡 1: 爬塔·无尽 =====
    var towerCard = document.createElement('div');
    towerCard.className = 'tower-entry-card';
    var nextFloor = tower.currentFloor || 1;
    var nextType = getTowerFloorType(nextFloor);
    var nextTypeCfg = TOWER_FLOOR_TYPE_NAME[nextType];
    var nextMult = getTowerFloorMult(nextFloor);
    var nextReward = calcTowerReward(nextFloor);
    var costStamina = getTowerStaminaCost();
    towerCard.innerHTML =
        '<div class="tec-header">' +
            '<div class="tec-icon">🏛</div>' +
            '<div class="tec-title">' +
                '<div class="tec-name">爬塔·无尽</div>' +
                '<div class="tec-subtitle">从第 1 层开始，永无止境</div>' +
            '</div>' +
        '</div>' +
        '<div class="tec-body">' +
            '<div class="tec-floor-preview" style="border-color:' + nextTypeCfg.color + ';">' +
                '<div class="tec-floor-label">下一层</div>' +
                '<div class="tec-floor-num" style="color:' + nextTypeCfg.color + ';">' + nextFloor + '</div>' +
                '<div class="tec-floor-type" style="background:' + nextTypeCfg.color + ';">' + nextTypeCfg.icon + ' ' + nextTypeCfg.name + '</div>' +
                '<div class="tec-floor-mult">难度 ×' + nextMult.toFixed(2) + '</div>' +
            '</div>' +
            '<div class="tec-reward-preview">' +
                '<div class="trp-title">奖励预览</div>' +
                '<div class="trp-row"><span class="trp-icon">💰</span><span>+' + nextReward.gold + ' 金币</span></div>' +
                (nextReward.reforgestone > 0 ? '<div class="trp-row"><span class="trp-icon">◇</span><span>+' + nextReward.reforgestone + ' 重铸石</span></div>' : '') +
                (nextReward.lotteryStone > 0 ? '<div class="trp-row"><span class="trp-icon">🎫</span><span>+' + nextReward.lotteryStone + ' 抽奖石</span></div>' : '') +
                (nextReward.upgradeStone > 0 ? '<div class="trp-row"><span class="trp-icon">🔷</span><span>+' + nextReward.upgradeStone + ' 升级石</span></div>' : '') +
                (nextReward.petEggStone > 0 ? '<div class="trp-row"><span class="trp-icon">🥚</span><span>+' + nextReward.petEggStone + ' 宠物蛋石</span></div>' : '') + 
                (nextReward.gems && nextReward.gems.length > 0 ? '<div class="trp-row"><span class="trp-icon">💎</span><span>+' + nextReward.gems.length + ' 宝石</span></div>' : '') +
            '</div>' +
        '</div>' +
        '<div class="tec-footer">' +
            '<div class="tec-cost">消耗 <span class="stamina-pill">' + costStamina + '</span> 体力</div>' +
            '<button class="btn btn-primary tec-start-btn" onclick="enterTower(' + nextFloor + ')">⚔ 挑战第 ' + nextFloor + ' 层</button>' +
        '</div>';
    container.appendChild(towerCard);

    // ===== 楼层规则说明（放在爬塔卡下面） =====
    var rulesCard = document.createElement('div');
    rulesCard.className = 'tower-rules-card';
    rulesCard.innerHTML =
        '<div class="trc-title">📜 楼层规则</div>' +
        '<div class="trc-row"><span class="trc-tag tag-normal">普通</span><span class="trc-desc">少量金币</span></div>' +
        '<div class="trc-row"><span class="trc-tag tag-elite">精英</span><span class="trc-desc">每 5 层：金币 + 重铸石 + 2 抽奖石 + 2 宠物蛋石 + 30% 概率 Lv.1 宝石</span></div>' +
        '<div class="trc-row"><span class="trc-tag tag-boss">BOSS</span><span class="trc-desc">每 10 层：金币 + 重铸石 + 10 抽奖石 + 5 宠物蛋石 + 1 升级石 + 2 宝石</span></div>' +
        '<div class="trc-divider"></div>' +
        '<div class="trc-note">难度每层 +5% / BOSS 必出网友怪 / 精英 50% 网友怪</div>';
    container.appendChild(rulesCard);

    // ===== 卡 2: 抽奖大厅 =====
    var lotteryCard = document.createElement('div');
    lotteryCard.className = 'lottery-entry-card';
    lotteryCard.innerHTML =
        '<div class="lec-header">' +
            '<div class="lec-icon">🎰</div>' +
            '<div class="lec-title">' +
                '<div class="lec-name">抽奖大厅</div>' +
                '<div class="lec-subtitle">消耗抽奖石抽取装备与资源</div>' +
            '</div>' +
            '<div class="lec-balance">🎫 ' + stone + '</div>' +
        '</div>' +
        '<div class="lec-body">' +
            '<div class="lec-tier lec-tier-normal">' +
                '<div class="lec-tier-name">普通抽奖</div>' +
                '<div class="lec-tier-cost">1 🎫 / 次</div>' +
                '<div class="lec-tier-desc">白-橙装备 / 金币 / 重铸石</div>' +
            '</div>' +
            '<div class="lec-tier lec-tier-advanced">' +
                '<div class="lec-tier-name">高级抽奖</div>' +
                '<div class="lec-tier-cost">10 🎫 / 次</div>' +
                '<div class="lec-tier-desc">蓝-金装备 / 高级宝石 / 大量金币</div>' +
            '</div>' +
        '</div>' +
        '<div class="lec-footer">' +
            '<button class="btn btn-primary" onclick="openLotteryScreen()">🎰 进入抽奖大厅</button>' +
        '</div>';
    container.appendChild(lotteryCard);

    // ===== 卡 3: 金币副本 =====
    var goldCard = document.createElement('div');
    goldCard.className = 'dungeon-card';
    goldCard.style.cssText = 'background:linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,152,0,0.04));border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:14px;margin-bottom:12px;';
    goldCard.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="font-size:28px;">💰</div>' +
            '<div style="flex:1;">' +
                '<div style="font-size:15px;font-weight:bold;color:#ffd700;">金币副本</div>' +
                '<div style="font-size:11px;color:#888;">快速获取大量金币</div>' +
            '</div>' +
        '</div>' +
        '<div style="font-size:11px;color:#aaa;margin-bottom:10px;line-height:1.5;">' +
            '奖励：<span style="color:#ffd700;">2000~10000 金币</span>（随机）<br>' +
            '难度：最高战力角色属性 ×2 | 即时结算' +
        '</div>' +
        '<button class="btn\" style="width:100%;background:linear-gradient(135deg,#ff8f00,#ff6f00);color:#fff;border:none;padding:10px;font-size:13px;font-weight:bold;border-radius:8px;\" onclick="enterGoldDungeon()">💰 进入金币副本（5 体力）</button>';
    container.appendChild(goldCard);

    // ===== 卡 4: 粉尘重铸石副本 =====
    var dustCard = document.createElement('div');
    dustCard.className = 'dungeon-card';
    dustCard.style.cssText = 'background:linear-gradient(135deg,rgba(156,39,176,0.08),rgba(103,58,183,0.04));border:1px solid rgba(156,39,176,0.2);border-radius:12px;padding:14px;margin-bottom:12px;';
    dustCard.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="font-size:28px;">💠</div>' +
            '<div style="flex:1;">' +
                '<div style="font-size:15px;font-weight:bold;color:#ce93d8;">粉尘重铸石副本</div>' +
                '<div style="font-size:11px;color:#888;">获取锻造粉尘与重铸石</div>' +
            '</div>' +
        '</div>' +
        '<div style="font-size:11px;color:#aaa;margin-bottom:10px;line-height:1.5;">' +
            '奖励：<span style="color:#ce93d8;">200~1000 锻造粉尘 + 5~10 重铸石</span>（随机）<br>' +
            '难度：最高战力角色属性 ×2 | 即时结算' +
        '</div>' +
        '<button class="btn\" style="width:100%;background:linear-gradient(135deg,#7b1fa2,#6a1b9a);color:#fff;border:none;padding:10px;font-size:13px;font-weight:bold;border-radius:8px;\" onclick="enterDustDungeon()">💠 进入粉尘副本（8 体力）</button>';
    container.appendChild(dustCard);

    // ===== 卡 5: 魔王副本（每日1次）=====
    var today = new Date().toDateString();
    var lastDate = (gameState && GameState.get('lastDemonKingDate')) || '';
    var canChallenge = (today !== lastDate);
    var dkRecord = (gameState && GameState.get('demonKingRecord')) || 0;

    var demonCard = document.createElement('div');
    demonCard.className = 'dungeon-card';
    demonCard.style.cssText = 'background:linear-gradient(135deg,rgba(244,67,54,0.12),rgba(156,39,176,0.08));border:2px solid ' + (canChallenge ? 'rgba(244,67,54,0.5)' : 'rgba(100,100,100,0.2)') + ';border-radius:14px;padding:16px;margin-bottom:12px;position:relative;overflow:hidden;';
    demonCard.innerHTML =
        '<div style="position:absolute;top:-20px;right:-20px;font-size:80px;opacity:0.06;">👹</div>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;position:relative;z-index:1;">' +
            '<div style="font-size:36px;filter:drop-shadow(0 0 8px rgba(244,67,54,0.6));">👹</div>' +
            '<div style="flex:1;">' +
                '<div style="font-size:16px;font-weight:bold;color:#ff5252;">魔王副本 · 竹林深处</div>' +
                '<div style="font-size:11px;color:#aaa;margin-top:2px;">无限血量 · 伤害越高奖励越多</div>' +
            '</div>' +
            (canChallenge
                ? '<div style="background:rgba(244,67,54,0.2);border:1px solid rgba(244,67,54,0.4);border-radius:20px;padding:4px 10px;font-size:10px;color:#ff5252;font-weight:bold;">可挑战</div>'
                : '<div style="background:rgba(100,100,100,0.2);border:1px solid rgba(100,100,100,0.3);border-radius:20px;padding:4px 10px;font-size:10px;color:#888;">今日已挑战</div>') +
        '</div>' +
        '<div style="font-size:11px;color:#ccc;margin-bottom:10px;line-height:1.6;position:relative;z-index:1;">' +
            '<span style="color:#ff8f00;">⏱ 限时 60 秒</span> · <span style="color:#ce93d8;">📊 伤害累计计算</span> · <span style="color:#ffd700;">🎁 平滑奖励</span><br>' +
            '魔王拥有无限血量，在60秒内造成伤害越多奖励越丰厚<br>' +
            '<span style="color:#888;">最佳记录：' + (dkRecord > 0 ? (typeof formatNumber === 'function' ? formatNumber(dkRecord) : dkRecord) + ' 伤害' : '暂无') + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:6px;position:relative;z-index:1;">' +
            '<div style="flex:1;font-size:10px;color:#888;background:rgba(0,0,0,0.3);border-radius:8px;padding:6px 8px;text-align:center;">' +
                '<div style="color:#ffd700;font-size:14px;font-weight:bold;">💰</div>金币+粉尘</div>' +
            '<div style="flex:1;font-size:10px;color:#888;background:rgba(0,0,0,0.3);border-radius:8px;padding:6px 8px;text-align:center;">' +
                '<div style="color:#ce93d8;font-size:14px;font-weight:bold;">🎫</div>抽奖石+宝石</div>' +
            '<div style="flex:1;font-size:10px;color:#888;background:rgba(0,0,0,0.3);border-radius:8px;padding:6px 8px;text-align:center;">' +
                '<div style="color:#ff9800;font-size:14px;font-weight:bold;">🥚</div>蛋石+升级石</div>' +
        '</div>' +
        '<button class="btn" style="width:100%;margin-top:10px;background:' + (canChallenge ? 'linear-gradient(135deg,#d32f2f,#7b1fa2)' : '#444') + ';color:#fff;border:none;padding:11px;font-size:14px;font-weight:bold;border-radius:10px;position:relative;z-index:1;" ' +
            (canChallenge ? 'onclick="enterDemonKingDungeon()"' : 'disabled') + '>' +
            (canChallenge ? '👹 挑战魔王（20 体力）' : '⏳ 明日再来挑战') +
        '</button>';
    container.appendChild(demonCard);
}

// ========== 爬塔入口 ==========
function enterTower(floor) {
    if (!gameState) return;
    // ★ v2.6.5 修复副本卡死: 入口第一行先清理 isDungeon 残留,再守卫(原顺序守卫拦下,永远走不到清理)
    if (typeof cleanDungeonState === 'function') cleanDungeonState();
    if (typeof _checkInBattle === 'function' && !_checkInBattle('爬塔')) return;
    var cost = getTowerStaminaCost();
    if ((GameState.get('stamina') || 0) < cost) {
        if (typeof showToast === 'function') showToast('体力不足！需要 ' + cost + ' 体力', 'warning');
        return;
    }
    // 关闭可能残留的抽奖 modal
    var lotteryModal = document.getElementById('lottery-modal');
    if (lotteryModal) lotteryModal.style.display = 'none';
    // ★ v2.6.3 修复 3 倍速进副本卡死: 早 stopBattle 停主战场 gameLoop
    //   (3 倍速下主战场 200+ 怪 + 50+ 弹道一帧能卡 50ms+ 渲染). 避免 enterTower 同步
    //   流程里主战场还在跑 + PixiFx destroy/init 抢 GPU 资源
    if (typeof BattleManager !== 'undefined' && BattleManager.stopBattle) {
        BattleManager.stopBattle();
    }
    // 扣体力
    if (typeof spendStamina === 'function') {
        spendStamina(cost);
    } else {
        GameState.mutate('stamina', function(s) { return s - cost; });
        GameState.set('lastStaminaTime', Date.now());
    }
    // 开副本 modal (内部 _reinitPixiFx 切 PixiFx canvas 到副本 overlay)
    if (typeof openDungeonBattleModal === 'function') {
        // 复用 modal 框架
        openDungeonBattleModal('tower', 1);
    }
    // 启动爬塔战斗
    if (typeof BattleManager !== 'undefined' && BattleManager.startTowerBattle) {
        BattleManager.startTowerBattle(floor);
    } else {
        if (typeof showToast === 'function') showToast('战斗系统未就绪', 'error');
    }
}

// ========== 副本战斗弹窗（爬塔复用此 modal）============
function openDungeonBattleModal(type, level) {
    var modal = document.getElementById('dungeon-battle-modal');
    if (!modal) {
        // 动态创建（保持原 v3.x 行为）
        modal = document.createElement('div');
        modal.id = 'dungeon-battle-modal';
        modal.className = 'dungeon-battle-modal';
        modal.innerHTML =
            '<div class="dungeon-battle-panel">' +
                '<div class="dungeon-battle-header">' +
                    '<div class="dungeon-battle-title"><span class="dungeon-battle-icon">⚜</span><span class="dungeon-battle-name">爬塔</span></div>' +
                    '<button class="dungeon-abandon-btn" onclick="abandonDungeonBattle()">退出</button>' +
                '</div>' +
                '<div id="dungeon-battle-status" style="display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:rgba(0,0,0,0.3);font-size:12px;color:#ffd700;border-bottom:1px solid rgba(255,215,0,0.15);">' +
                    '<span id="dungeon-timer-text">⏱ 准备中...</span>' +
                    '<span id="dungeon-damage-text" style="color:#ff5252;">伤害: 0</span>' +
                '</div>' +
                '<div class="dungeon-battle-canvas-wrap">' +
                    '<canvas id="dungeon-battle-canvas"></canvas>' +
                    '<canvas id="dungeon-pixi-overlay-canvas"></canvas>' +
                '</div>' +
                '<div class="dungeon-battle-stage">⚠ 独立战斗场景，与主线关卡完全隔离</div>' +
            '</div>';
        document.body.appendChild(modal);
    }
    // 更新标题（★ v7.4.1: 用 DUNGEON_MODAL_TITLES 查表，修复硬编码只处理 tower）
    var nameEl = modal.querySelector('.dungeon-battle-name');
    if (nameEl) nameEl.textContent = DUNGEON_MODAL_TITLES[type] || '副本';
    modal.style.display = 'flex';
    // 让 canvas 自适应 modal 尺寸（★ v7.4.1: 删掉重复代码块）
    var wrap = modal.querySelector('.dungeon-battle-canvas-wrap');
    var canvas = document.getElementById('dungeon-battle-canvas');
    // ★ 防御性修复：延时一帧确保 layout 完成后再读取尺寸
    var setCanvasSize = function() {
        if (wrap && canvas) {
            var cw = wrap.clientWidth || wrap.getBoundingClientRect().width || 600;
            var ch = wrap.clientHeight || wrap.getBoundingClientRect().height || 400;
            canvas.width = Math.max(cw, 200);
            canvas.height = Math.max(ch, 200);
        }
    };
    setCanvasSize();
    // 下一帧再确保一次（应对初始 layout 未完成）
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(function() { setCanvasSize(); });
    }
    // v2.6.2: 初始化 PixiJS overlay canvas（爬塔/副本也吃 WebGL 粒子/特效/弹道）
    // 统一走 BattleManager._reinitPixiFx（destroy + init + 重绑尺寸），保证单例切换 canvas 不会有残留 ticker
    // ★ v2.6.3 修复 3 倍速进副本卡死: display:flex 同步代码 wrap.clientWidth 可能
    //   还是 0 (layout 未跑)，导致 _reinitPixiFx 创建一个 0x0 PIXI Application 失败或失败但
    //   app.ticker 仍跑 (空帧但占资源). 改用 rAF 等下一帧拿真实尺寸
    var pixiCanvas = document.getElementById('dungeon-pixi-overlay-canvas');
    var pixiInit = function() {
     var w = wrap.clientWidth || 600;
     var h = wrap.clientHeight || 400;
     if (w <= 0 || h <= 0) { w = 600; h = 400; }
     if (pixiCanvas && typeof BattleManager !== 'undefined' && BattleManager._reinitPixiFx) {
        BattleManager._reinitPixiFx(pixiCanvas, w, h);
     } else if (pixiCanvas && typeof PixiFx !== 'undefined') {
    // 兜底：BattleManager 不可用时直接走 PixiFx
    if (PixiFx.initialized) { try { PixiFx.destroy(); } catch (e) {} }
    var dpr2 = window.devicePixelRatio || 1;
    pixiCanvas.width = w * dpr2;
    pixiCanvas.height = h * dpr2;
    pixiCanvas.style.width = w + 'px';
    pixiCanvas.style.height = h + 'px';
    PixiFx.init(pixiCanvas, w, h);
     }
    };
    // 下一帧再调 (拿真实 layout 尺寸, 避免 0x0 canvas 卡死)
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(pixiInit);
    } else {
        setTimeout(pixiInit, 16);
    }
}

function abandonDungeonBattle() {
    if (typeof BattleManager !== 'undefined' && BattleManager.exitDungeon) {
        // 魔王副本：退出算奖励，直接回副本大厅
        if (BattleManager.dungeonType === 'demonking' && typeof BattleManager.demonKingReward === 'function') {
            BattleManager.demonKingReward();
            BattleManager.isDungeon = false;
            BattleManager.dungeonType = null;
            if (BattleManager.stopBattle) BattleManager.stopBattle();
            var bm3 = document.getElementById('dungeon-battle-modal');
            if (bm3) bm3.style.display = 'none';
            if (typeof switchScreen === 'function') switchScreen('dungeon');
            if (typeof showToast === 'function') showToast('已退出魔王副本', 'info');
            return;
        }
        BattleManager.isTower = false;
        BattleManager.towerFloor = 0;
        BattleManager.exitDungeon();
    }
    closeDungeonBattleModal();
    if (typeof showToast === 'function') showToast('已放弃挑战', 'info');
}

function closeDungeonBattleModal() {
    var modal = document.getElementById('dungeon-battle-modal');
    if (modal) modal.style.display = 'none';
    // v2.6.2: 退出副本时由 BattleManager.exitDungeon 统一处理 PixiFx 重建（切回主战场 canvas）。
    //   这里只 hide modal，不再做 clearAll —— 之前的 clearAll 在 exitDungeon 没接管时是兜底，
    //   但 clearAll 不停 ticker，残留拖尾粒子还是会累积，所以现在改为由 exitDungeon 主导。
    //   切回时如果 BattleManager 不可用，再兜底 destroy 一次。
    if (typeof BattleManager === 'undefined' || !BattleManager._reinitPixiFx) {
        if (typeof PixiFx !== 'undefined' && PixiFx.initialized) {
            try { PixiFx.destroy(); } catch (e) {}
        }
    }
    // 同时切回主屏
    if (typeof switchScreen === 'function') switchScreen('dungeon');
}

// ========== 旧 API 兼容（保留以防其他模块调用）============
function enterDungeon(type, level) {
    // v4.0 起 enterDungeon 已废弃，统一走 enterTower / openLotteryScreen
    if (typeof showToast === 'function') showToast('副本系统已重做为爬塔，请使用爬塔入口', 'info');
}

// ========== 金币副本 ==========
// ★ v7.4.1: 加 _checkInBattle 守卫 + 防御性清理 isDungeon 残留
// ★ v2.6.5 修复: 顺序调换 — 入口第一行先 cleanDungeonState() 清理,再 _checkInBattle 守卫
//   (原顺序守卫拦下, 永远走不到 exitDungeon 清理 → isDungeon 卡死进不去副本)
function enterGoldDungeon() {
    if (!gameState) return;
    if (typeof cleanDungeonState === 'function') cleanDungeonState();
    if (typeof _checkInBattle === 'function' && !_checkInBattle('进入金币副本')) return;
    if ((GameState.get('stamina') || 0) < 5) {
        if (typeof showToast === 'function') showToast('体力不足！需要 5 体力', 'warning');
        return;
    }
    // 扣体力
    if (typeof spendStamina === 'function') spendStamina(5);
    if (typeof openDungeonBattleModal !== 'function') return;
    openDungeonBattleModal('gold', 1);
    if (typeof BattleManager !== 'undefined' && BattleManager.startDungeonBattle) {
        BattleManager.startDungeonBattle('gold', 1);
    }
}

function getMaxHeroPower() {
    // 优先从 DOM 读取已显示的战力值（避免依赖 BattleManager 初始化状态）
    var el = document.getElementById('team-power-main');
    if (el && el.textContent) {
        var m = el.textContent.match(/[\d.]+/g);
        if (m && m.length > 0) {
            var p = 0;
            for (var i = 0; i < m.length; i++) p = Math.max(p, parseInt(m[i]) || 0);
            if (p > 0) return p;
        }
    }
    // 兜底：简单求和英雄等级
    var heroes = GameState.get('heroes') || [];
    var total = 0;
    for (var i = 0; i < heroes.length; i++) {
        total += (heroes[i].level || 1) * 100;
    }
    return total;
}

function enterDustDungeon() {
    if (!gameState) return;
    // ★ v7.4.1: 加 _checkInBattle 守卫 + 防御性清理 isDungeon 残留
    // ★ v2.6.5 修复: 顺序调换 — 入口第一行先 cleanDungeonState() 清理,再 _checkInBattle 守卫
    if (typeof cleanDungeonState === 'function') cleanDungeonState();
    if (typeof _checkInBattle === 'function' && !_checkInBattle('进入粉尘重铸石副本')) return;
    if ((GameState.get('stamina') || 0) < 8) {
        if (typeof showToast === 'function') showToast('体力不足！需要 8 体力', 'warning');
        return;
    }
    // 扣体力
    if (typeof spendStamina === 'function') spendStamina(8);
    if (typeof openDungeonBattleModal !== 'function') return;
    openDungeonBattleModal('stone', 1);
    if (typeof BattleManager !== 'undefined' && BattleManager.startDungeonBattle) {
        BattleManager.startDungeonBattle('stone', 1);
    }
}

// ========== 魔王副本 ==========
// ★ v7.4.1 重构:
//   1. 加 _checkInBattle 守卫（之前只有 enterTower 有，其他副本入口漏了）
//   2. 防御性清理 isDungeon 残留（之前调 stopBattle 不重置 isDungeon，导致下次进入被早期 return）
//   3. 启动失败时回滚体力 + 不设日期（之前白扣 20 体力 + 浪费今日次数）
function enterDemonKingDungeon() {
    if (!gameState) return;
    // ★ v2.6.5 修复副本卡死: 入口第一行先 cleanDungeonState() 清理 isDungeon 残留
    //   顺序调换 (原 _checkInBattle 守卫在前 → isDungeon=true 残留时拦下, 永远走不到 exitDungeon 清理)
    if (typeof cleanDungeonState === 'function') cleanDungeonState();
    // ★ BUG4 修复：通用 _checkInBattle 守卫（enterGoldDungeon/enterDustDungeon 同款）
    if (typeof _checkInBattle === 'function' && !_checkInBattle('挑战魔王副本')) return;

    var today = new Date().toDateString();
    var lastDate = (GameState.get('lastDemonKingDate')) || '';
    if (today === lastDate) {
        if (typeof showToast === 'function') showToast('今日已挑战过魔王副本，明天再来吧！', 'warning');
        return;
    }
    var cost = 20;
    if ((GameState.get('stamina') || 0) < cost) {
        if (typeof showToast === 'function') showToast('体力不足！需要 ' + cost + ' 体力', 'warning');
        return;
    }

    // ★ BUG1 修复：先备份原值，失败时回滚（之前是"扣体力→设日期→开 modal→启动战斗"
    //   启动失败的话体力白扣 + 今日次数白费。这次改成"扣体力→开 modal→启动战斗→
    //   全部成功才设日期"。任何一步 throw 都回滚到 preStamina / preLastDate）
    var preStamina = GameState.get('stamina') || 0;
    var preLastDate = GameState.get('lastDemonKingDate') || '';
    var success = false;
    try {
        // 1. 扣体力
        if (typeof spendStamina === 'function') {
            spendStamina(cost);
        } else {
            GameState.mutate('stamina', function(s) { return s - cost; });
            GameState.set('lastStaminaTime', Date.now());
        }
        // 2. 停止主战场
        if (typeof BattleManager !== 'undefined' && BattleManager.stopBattle) {
            BattleManager.stopBattle();
        }
        // 3. 开副本 modal
        if (typeof openDungeonBattleModal === 'function') {
            openDungeonBattleModal('demonking', 1);
        }
        // 4. 启动魔王战斗（同步，如果 throw 会被 catch）
        if (typeof BattleManager !== 'undefined' && BattleManager.startDemonKingBattle) {
            BattleManager.startDemonKingBattle();
        } else {
            throw new Error('BattleManager.startDemonKingBattle 不存在');
        }
        success = true;
    } catch (e) {
        // 失败回滚：恢复体力 + 日期
        GameState.set('stamina', preStamina);
        GameState.set('lastDemonKingDate', preLastDate);
        if (typeof showToast === 'function') {
            showToast('魔王副本启动失败，已回滚体力：' + (e.message || e), 'error');
        }
        if (typeof console !== 'undefined' && console.error) {
            console.error('[enterDemonKingDungeon] 启动失败，已回滚:', e);
        }
    }
    // 5. 全部成功才标记今日已挑战（避免之前那种"白扣次数"问题）
    if (success) {
        GameState.set('lastDemonKingDate', today);
    }
}
