// ========== 抽奖大厅 UI v4.0 ==========
// 入口：dungeonUI.js 的"抽奖大厅"卡 → openLotteryScreen()
// 页面分两块：抽奖控制台 + 概率预览 + 中奖记录
/* global GameState */

// 打开抽奖大厅
function openLotteryScreen() {
    if (typeof _checkInBattle === 'function' && !_checkInBattle('抽奖')) return;
    // 关闭可能残留的副本战斗 modal
    var battleModal = document.getElementById('dungeon-battle-modal');
    if (battleModal) battleModal.style.display = 'none';
    // 用一个全屏 modal（类似副本 modal）
    var modal = document.getElementById('lottery-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'lottery-modal';
        modal.className = 'lottery-modal';
        modal.innerHTML = '<div class="lottery-panel" id="lottery-panel-body"></div>';
        document.body.appendChild(modal);
        // 点击空白关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeLotteryScreen();
        });
    }
    modal.style.display = 'flex';
    renderLotteryPanel();
}

// 关闭抽奖大厅
function closeLotteryScreen() {
    var modal = document.getElementById('lottery-modal');
    if (modal) modal.style.display = 'none';
    // 回到 dungeon 页面
    if (typeof switchScreen === 'function') switchScreen('dungeon');
}

// 渲染抽奖面板
function renderLotteryPanel() {
    var body = document.getElementById('lottery-panel-body');
    if (!body) return;
    if (!gameState) return;
    var stones = GameState.get("lotteryStone") || 0;
    var history = GameState.get("lotteryHistory") || [];

    body.innerHTML =
        '<div class="lottery-panel-header">' +
            '<button class="back-btn" onclick="closeLotteryScreen()">← 返回</button>' +
            '<h2>🎰 抽奖大厅</h2>' +
            '<div class="lottery-stone-pill">🎫 ' + stones + '</div>' +
        '</div>' +
        '<div class="lottery-panel-body">' +
            renderLotteryTier('normal') +
            renderLotteryTier('advanced') +
            renderLotteryRates() +
        '</div>' +
        '<div class="lottery-history">' +
            '<div class="lh-title">📜 最近中奖记录（最近 ' + history.length + ' 条）</div>' +
            renderLotteryHistory() +
        '</div>';
}

// 渲染单个抽奖类型卡
function renderLotteryTier(tierType) {
    var cfg = LOTTERY_CONFIG[tierType];
    if (!cfg) return '';
    var stones = (gameState && GameState.get("lotteryStone")) || 0;
    var canSingle = stones >= cfg.costPerDraw;
    var canTen = stones >= cfg.costPerTenDraw;
    var tierClass = tierType === 'normal' ? 'lottery-tier-normal' : 'lottery-tier-advanced';
    return '<div class="lottery-tier-card ' + tierClass + '">' +
        '<div class="ltc-name">' + cfg.name + '</div>' +
        '<div class="ltc-cost">单抽 <span class="lottery-cost-pill">' + cfg.costPerDraw + ' 🎫</span>  ·  十连 <span class="lottery-cost-pill">' + cfg.costPerTenDraw + ' 🎫</span></div>' +
        '<div class="ltc-pity">十连保底：≥1 件' + cfg.pityTierName + '</div>' +
        '<div class="ltc-btns">' +
            '<button class="btn btn-primary ltc-btn" ' + (canSingle ? '' : 'disabled') + ' onclick="doLotteryAction(\'' + tierType + '\', false)">单 抽</button>' +
            '<button class="btn btn-gold ltc-btn" ' + (canTen ? '' : 'disabled') + ' onclick="doLotteryAction(\'' + tierType + '\', true)">十 连 抽</button>' +
        '</div>' +
    '</div>';
}

// 渲染概率预览
function renderLotteryRates() {
    var html = '<div class="lottery-rates-card">' +
        '<div class="lrc-title">📊 概率预览</div>';
    var tiers = ['normal', 'advanced'];
    for (var i = 0; i < tiers.length; i++) {
        var t = tiers[i];
        var cfg = LOTTERY_CONFIG[t];
        html += '<div class="lrc-tier"><div class="lrc-tier-name">' + cfg.name + '</div><div class="lrc-rates">';
        for (var j = 0; j < cfg.equipTierRates.length; j++) {
            var r = cfg.equipTierRates[j];
            var pct = Math.round(r.rate * 100);
            var color = getQualityColor(r.tier);
            html += '<span class="lrc-rate" style="color:' + color + ';">' + r.name + ' ' + pct + '%</span>';
        }
        html += '</div></div>';
    }
    html += '</div>';
    return html;
}

// 渲染中奖历史
function renderLotteryHistory() {
    var history = (gameState && GameState.get("lotteryHistory")) || [];
    if (history.length === 0) {
        return '<div class="lh-empty">暂无抽奖记录</div>';
    }
    var html = '<div class="lh-list">';
    var max = Math.min(20, history.length);
    for (var i = 0; i < max; i++) {
        var h = history[i];
        var color = getQualityColor(h.tier);
        var pityTag = h.isPity ? '<span class="lh-pity">保底</span>' : '';
        var dateStr = new Date(h.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        html += '<div class="lh-item">' +
            '<span class="lh-quality-dot" style="background:' + color + ';"></span>' +
            '<span class="lh-tier" style="color:' + color + ';">' + h.tierName + '</span>' +
            '<span class="lh-name">' + (h.equipName || '?') + '</span>' +
            pityTag +
            '<span class="lh-date">' + dateStr + '</span>' +
        '</div>';
    }
    html += '</div>';
    return html;
}

// 触发抽奖
function doLotteryAction(tierType, isTenDraw) {
    if (!gameState) return;
    if (typeof doLottery !== 'function') {
        if (typeof showToast === 'function') showToast('抽奖系统未就绪', 'error');
        return;
    }
    var result = doLottery(tierType, isTenDraw);
    if (!result.ok) {
        if (result.reason === 'not_enough_stone') {
            if (typeof showToast === 'function') showToast('抽奖石不足！需要 ' + result.need + '，当前 ' + result.have, 'warning');
        } else if (result.reason === 'invalid_type') {
            if (typeof showToast === 'function') showToast('未知的抽奖类型', 'error');
        }
        return;
    }
    // 通知更新
    if (typeof updateResources === 'function') updateResources();
    // 抽奖结果提示
    var msg = (isTenDraw ? '十连抽' : '单抽') + ' 完成！';
    if (result.totalGold > 0) msg += ' 💰+' + result.totalGold;
    if (result.totalStone > 0) msg += ' ◇+' + result.totalStone;
    if (result.gems && result.gems.length > 0) msg += ' 💎+' + result.gems.length;
    if (typeof showToast === 'function') showToast(msg, 'success', 2500);
    // 重新渲染
    renderLotteryPanel();
    // 触发抽奖动画（显示最高品质结果）
    showLotteryAnimation(result);
}

// 显示抽奖结果动画（重做 v4.1：单抽 1 大卡 / 十连抽 10 卡片逐张翻牌）
//   每张卡片有：背面（？）→ 翻牌 → 正面（按品质渐变/光晕/粒子/全屏光柱）
function showLotteryAnimation(result) {
    if (!result || !result.results || result.results.length === 0) return;

    // 找出最高品质（决定最终特效强度）
    var best = null;
    for (var i = 0; i < result.results.length; i++) {
        var r = result.results[i];
        if (!best || r.tier > best.tier) best = r;
    }
    var bestColor = getQualityColor(best.tier);
    var isTenDraw = !!result.isTenDraw;
    var isPity = result.results.some(function(r) { return r.isPity; });

    // 创建动画容器（全屏）
    var stage = document.createElement('div');
    stage.className = 'lottery-anim-stage';
    if (best.tier >= 5) stage.classList.add('is-gold');         // 金装 → 触发屏幕光柱
    if (best.tier >= 4) stage.classList.add('is-mythic');      // 橙装 → 触发金光
    if (isPity) stage.classList.add('is-pity');                // 保底 → 触发紫光
    stage.innerHTML =
        '<div class="la-backdrop"></div>' +
        '<div class="la-light-beam"></div>' +
        '<div class="la-content">' +
            '<div class="la-title">抽奖中…</div>' +
            '<div class="la-grid ' + (isTenDraw ? 'is-ten' : 'is-single') + '"></div>' +
            '<div class="la-summary"></div>' +
            '<button class="la-close-btn">收下奖励 (3)</button>' +
        '</div>';
    document.body.appendChild(stage);

    // 渲染卡片
    var grid = stage.querySelector('.la-grid');
    for (var k = 0; k < result.results.length; k++) {
        var r = result.results[k];
        var color = getQualityColor(r.tier);
        var card = document.createElement('div');
        card.className = 'la-card tier-' + r.tier + (r.isPity ? ' is-pity' : '');
        card.style.setProperty('--tier-color', color);
        card.innerHTML =
            '<div class="la-card-inner">' +
                '<div class="la-card-face la-card-back"><div class="la-card-question">?</div></div>' +
                '<div class="la-card-face la-card-front">' +
                    '<div class="la-card-glow"></div>' +
                    (r.equip ? '<div class="la-card-icon">' + r.equip.slotIcon + '</div>' : '') +
                    '<div class="la-card-name">' + (r.equip ? r.equip.name : '???') + '</div>' +
                    '<div class="la-card-tier" style="color:' + color + ';">' + r.tierName + (r.isPity ? ' ✦' : '') + '</div>' +
                '</div>' +
            '</div>';
        grid.appendChild(card);
    }

    // 翻牌动画（依次，每张间隔 200ms）
    var cards = stage.querySelectorAll('.la-card');
    for (var j = 0; j < cards.length; j++) {
        (function(card, idx) {
            setTimeout(function() {
                card.classList.add('flipped');
                // 高品质额外特效
                var tierMatch = card.className.match(/tier-(\d+)/);
                if (tierMatch) {
                    var t = parseInt(tierMatch[1], 10);
                    if (t >= 3) {
                        // 紫装及以上：粒子爆发
                        burstParticles(card, color);
                    }
                    if (t >= 4) {
                        // 橙装及以上：屏幕震动
                        shakeScreen(6, 200);
                    }
                    if (t === 5) {
                        // 金装：超大光柱
                        burstParticles(card, '#ffd700', 30);
                    }
                }
            }, 300 + idx * 200);
        })(cards[j], j);
    }

    // 更新标题 + 倒计时关闭
    var totalCards = cards.length;
    var totalDuration = 300 + totalCards * 200 + 1200;
    setTimeout(function() {
        var titleEl = stage.querySelector('.la-title');
        if (titleEl) titleEl.textContent = '恭喜获得 ' + (isTenDraw ? totalCards + ' 件装备' : '装备');
    }, totalDuration - 800);

    // 总结区
    setTimeout(function() {
        var summary = stage.querySelector('.la-summary');
        if (summary) {
            var gold = result.totalGold || 0;
            var stone = result.totalStone || 0;
            var gemCount = (result.gems || []).length;
            var lines = [];
            if (gold > 0) lines.push('<span class="las-item">💰 +' + gold + '</span>');
            if (stone > 0) lines.push('<span class="las-item">◇ +' + stone + '</span>');
            if (gemCount > 0) lines.push('<span class="las-item">💎 +' + gemCount + '</span>');
            lines.push('<span class="las-best" style="color:' + bestColor + ';">最高：' + best.tierName + (isPity ? ' (保底)' : '') + '</span>');
            summary.innerHTML = lines.join('');
        }
    }, totalDuration - 500);

    // 倒计时关闭按钮
    var closeBtn = stage.querySelector('.la-close-btn');
    var countdown = 3;
    var cdInterval = setInterval(function() {
        countdown--;
        if (countdown <= 0) {
            clearInterval(cdInterval);
            closeBtn.textContent = '收下奖励';
            closeBtn.classList.add('ready');
        } else {
            closeBtn.textContent = '收下奖励 (' + countdown + ')';
        }
    }, 1000);
    // 自动关闭
    var autoClose = setTimeout(function() {
        closeLotteryAnim(stage);
    }, totalDuration + 3000);
    // 手动关闭
    closeBtn.addEventListener('click', function() {
        clearTimeout(autoClose);
        clearInterval(cdInterval);
        closeLotteryAnim(stage);
    });
}

function closeLotteryAnim(stage) {
    if (!stage) return;
    stage.classList.add('la-closing');
    setTimeout(function() {
        if (stage.parentNode) stage.parentNode.removeChild(stage);
    }, 400);
}

// 粒子爆发（卡片周围）
function burstParticles(targetEl, color, count) {
    count = count || 15;
    var rect = targetEl.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    for (var i = 0; i < count; i++) {
        var p = document.createElement('div');
        p.className = 'la-particle';
        p.style.background = color || '#ffd700';
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        var angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        var dist = 60 + Math.random() * 80;
        p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        document.body.appendChild(p);
        setTimeout(function() {
            if (p.parentNode) p.parentNode.removeChild(p);
        }, 800);
    }
}

// 屏幕震动（轻量版）
function shakeScreen(intensity, duration) {
    intensity = intensity || 5;
    duration = duration || 200;
    var canvas = document.getElementById('dungeon-battle-canvas') || document.getElementById('battle-canvas');
    if (!canvas) return;
    var start = Date.now();
    function loop() {
        var elapsed = Date.now() - start;
        if (elapsed > duration) { canvas.style.transform = ''; return; }
        var dx = (Math.random() - 0.5) * intensity;
        var dy = (Math.random() - 0.5) * intensity;
        canvas.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        requestAnimationFrame(loop);
    }
}