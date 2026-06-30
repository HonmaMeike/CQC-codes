// ========== 转生界面 (Rebirth UI) ==========
/* global GameState */

// 显示转生屏幕
function showRebirthScreen() {
    var container = document.getElementById('rebirth-container');
    if (!container) return;

    var prog = getRebirthProgress();
    var html = '';

    // ===== 顶部信息区 =====
    html += '<div class="rebirth-header">';
    html += '  <div class="rebirth-title">🔄 转生系统 (轮回)</div>';
    html += '  <div class="rebirth-subtitle">通关第100章后解锁转生，重置大部分进度换取永久加成</div>';
    html += '</div>';

    // ===== 状态卡片 =====
    html += '<div class="rebirth-stats-card">';
    html += '  <div class="rebirth-stat-row">';
    html += '    <span class="rebirth-stat-label">当前章节</span>';
    html += '    <span class="rebirth-stat-val">' + prog.currentCh + ' / ' + prog.totalCh + '</span>';
    html += '  </div>';
    html += '  <div class="rebirth-stat-row">';
    html += '    <span class="rebirth-stat-label">转生次数</span>';
    html += '    <span class="rebirth-stat-val">' + (prog.rebirthCount || 0) + ' 次</span>';
    html += '  </div>';
    html += '  <div class="rebirth-stat-row">';
    html += '    <span class="rebirth-stat-label">可用轮回点数</span>';
    html += '    <span class="rebirth-stat-val rebirth-points-num">' + prog.totalPoints + '</span>';
    html += '  </div>';
    html += '  <div class="rebirth-stat-row">';
    html += '    <span class="rebirth-stat-label">本次可获取点数</span>';
    html += '    <span class="rebirth-stat-val" style="color:#ffd700;">' + (prog.canRebirth ? '<b>+' + prog.pointsEarned + '</b>' : '<span style="color:#888;">需要通关第100章</span>') + '</span>';
    html += '  </div>';
    html += '</div>';

    // ===== 转生按钮 =====
    html += '<div class="rebirth-action-area">';
    if (prog.canRebirth) {
        html += '  <button class="btn btn-danger rebirth-btn" onclick="confirmRebirth()" style="font-size:18px;padding:14px 24px;width:100%;">🔄 进行转生（获得 ' + prog.pointsEarned + ' 轮回点数）</button>';
    } else {
        html += '  <button class="btn rebirth-btn-disabled" disabled style="font-size:16px;padding:12px 20px;width:100%;">🔒 通关第100章第20关后解锁转生</button>';
    }
    html += '</div>';

    // ===== 轮回商店 =====
    html += '<div class="rebirth-shop-section">';
    html += '  <h3 class="rebirth-shop-title">🏪 轮回商店</h3>';
    html += '  <div class="rebirth-shop-grid">';

    for (var i = 0; i < REBIRTH_SHOP.length; i++) {
        var item = REBIRTH_SHOP[i];
        var currentLvl = GameState.get('rebirthBonuses') ? (GameState.get('rebirthBonuses')[item.id] || 0) : 0;
        var isMaxed = currentLvl >= item.maxLevel;
        var totalBonus = currentLvl * item.valuePerLevel;
        var canAfford = (GameState.get('rebirthPoints') || 0) >= item.costPerLevel;

        html += '    <div class="rebirth-shop-item' + (isMaxed ? ' maxed' : '') + '">';
        html += '      <div class="rebirth-shop-icon">' + item.icon + '</div>';
        html += '      <div class="rebirth-shop-info">';
        html += '        <div class="rebirth-shop-name">' + item.name + '</div>';
        html += '        <div class="rebirth-shop-desc">' + item.desc + '</div>';
        html += '        <div class="rebirth-shop-level">等级: ' + currentLvl + ' / ' + item.maxLevel;
        if (totalBonus > 0) {
            if (item.id === 'extraSlots') {
                html += ' &nbsp;|&nbsp; 已加成: +' + totalBonus + ' 上阵位';
            } else if (item.id === 'qualityBonus') {
                html += ' &nbsp;|&nbsp; 已加成: +' + totalBonus + '%';
            } else {
                html += ' &nbsp;|&nbsp; 已加成: +' + totalBonus + '%';
            }
        }
        html += '        </div>';
        html += '        <div class="rebirth-shop-progress-bar">';
        html += '          <div class="rebirth-shop-progress-fill" style="width:' + (currentLvl / item.maxLevel * 100) + '%;"></div>';
        html += '        </div>';
        html += '      </div>';
        html += '      <div class="rebirth-shop-action">';
        if (isMaxed) {
            html += '        <span class="rebirth-maxed-badge">已满级</span>';
        } else {
            html += '        <button class="btn btn-gold rebirth-buy-btn" onclick="spendRebirthPoint(\'' + item.id + '\')" ' + (canAfford ? '' : 'disabled') + '>';
            html += '          升级 (' + item.costPerLevel + ' 点)';
            html += '        </button>';
        }
        html += '      </div>';
        html += '    </div>';
    }

    html += '  </div>';
    html += '</div>';

    // ===== 当前加成汇总 =====
    var bonuses = getRebirthBonuses();
    html += '<div class="rebirth-bonus-summary">';
    html += '  <h4>当前轮回加成</h4>';
    html += '  <div class="rebirth-bonus-grid">';
    var hasAnyBonus = false;
    for (var k in bonuses) {
        if (bonuses[k] > 0) {
            hasAnyBonus = true;
            var shopItem=null;var _es5_109=REBIRTH_SHOP;for(var _es5_110=0;_es5_110<_es5_109.length;_es5_110++){if(_es5_109[_es5_110].id === k){shopItem=_es5_109[_es5_110];break;}};
            var label = shopItem ? shopItem.name : k;
            var unit = (k === 'extraSlots') ? ' 上阵位' : '%';
            html += '    <div class="rebirth-bonus-item"><span class="rebirth-bonus-icon">' + (shopItem ? shopItem.icon : '★') + '</span> ' + label + ': +' + bonuses[k] + unit + '</div>';
        }
    }
    if (!hasAnyBonus) {
        html += '    <div class="rebirth-bonus-item" style="color:#888;">尚未购买任何轮回加成</div>';
    }
    html += '  </div>';
    html += '</div>';

    container.innerHTML = html;
}

// 刷新转生UI（不重复创建DOM，仅更新内容）
function refreshRebirthUI() {
    showRebirthScreen();
}

// 确认转生弹窗
function confirmRebirth() {
    if (!canRebirth()) {
        showToast('条件不足，无法转生', 'warning');
        return;
    }

    var points = calcRebirthPoints();
    var msg = ''
        + '<div style="text-align:center;margin-bottom:12px;">'
        + '  <div style="font-size:48px;margin:8px 0;">🔄</div>'
        + '  <div style="font-size:18px;font-weight:bold;color:#ffd700;">确定要转生吗？</div>'
        + '</div>'
        + '<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;margin:10px 0;text-align:left;font-size:13px;line-height:1.7;">'
        + '  <div style="color:#ff6b6b;font-weight:bold;">⚠️ 转生后以下内容将被重置：</div>'
        + '  <div>• 章节进度 → 回到第1章</div>'
        + '  <div>• 所有金币 → 归零</div>'
        + '  <div>• 所有英雄等级和装备 → 重置</div>'
        + '  <div>• 所有天赋 → 重置</div>'
        + '  <div style="color:#51cf66;font-weight:bold;margin-top:8px;">✅ 保留内容：</div>'
        + '  <div>• 💎 宝石数量</div>'
        + '  <div>• 🏆 成就进度</div>'
        + '  <div>• 📖 装备图鉴</div>'
        + '  <div>• 击杀总数</div>'
        + '  <div style="color:#ffd700;font-weight:bold;margin-top:8px;">🎁 你将获得：<span style="font-size:16px;">' + points + ' 轮回点数</span></div>'
        + '</div>'
        + '<div style="color:#888;font-size:11px;margin-top:4px;">此操作不可撤销！</div>';

    showConfirm('🔄 转生确认', msg, function() {
        doRebirth();
        // 刷新当前界面
        if (typeof refreshRebirthUI === 'function') refreshRebirthUI();
        if (typeof updateResources === 'function') updateResources();
        // 切换到主界面
        if (typeof switchScreen === 'function') switchScreen('main');
    });
}
