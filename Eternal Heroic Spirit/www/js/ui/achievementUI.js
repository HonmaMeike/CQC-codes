// ========== 成就界面 UI ==========

// 显示成就主界面
function showAchievementUI() {
    // 防止重复弹窗
    if (document.getElementById('achievement-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'achievement-overlay';
    overlay.className = 'modal-overlay achievement-overlay';

    var stats = getAchievementStats();

    var html = ''
        + '<div class="achievement-modal">'
        +   '<div class="achievement-header" style="position:relative;">'
        +     '<span class="achievement-title">\u{1F3C6} 成就系统</span>'
        +     '<span class="achievement-stats">' + stats.unlocked + ' / ' + stats.total + ' 已达成</span>'
        +     '<button class="achievement-close" onclick="closeAchievementUI()">\u2716</button>'
        +     '<span style="position:absolute;top:6px;right:6px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;display:none;" onclick="closeAchievementUI()">✕</span>'
        +   '</div>'
        +   '<div class="achievement-progress-bar-wrap">'
        +     '<div class="achievement-progress-bar">'
        +       '<div class="achievement-progress-fill" style="width:' + (stats.total > 0 ? (stats.unlocked / stats.total * 100) : 0) + '%;"></div>'
        +     '</div>'
        +     '<span class="achievement-progress-text">' + Math.floor(stats.total > 0 ? (stats.unlocked / stats.total * 100) : 0) + '%</span>'
        +   '</div>'
        +   '<div class="achievement-grid" id="achievement-grid">'
        +   '</div>'
        + '</div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    renderAchievementGrid();
}

function closeAchievementUI() {
    var overlay = document.getElementById('achievement-overlay');
    if (overlay) overlay.remove();
}

// 渲染成就网格
function renderAchievementGrid() {
    var grid = document.getElementById('achievement-grid');
    if (!grid) return;

    var html = '';
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var ach = ACHIEVEMENTS[i];
        var progress = getAchievementProgress(ach.id);
        var isUnlocked = progress.completed;

        var cardClass = 'achievement-card';
        var borderColor = '';
        var statusText = '';
        var progressHtml = '';

        if (isUnlocked) {
            cardClass += ' achieved';
            borderColor = '#ffd700';
            statusText = '\u2714 \u5DF2\u8FBE\u6210';
        } else if (progress.current > 0) {
            cardClass += ' in-progress';
            borderColor = '#4fc3f7';
            var pct = Math.min(100, Math.floor((progress.current / progress.target) * 100));
            statusText = progress.current + ' / ' + progress.target;
            progressHtml = '<div class="ach-progress-bar"><div class="ach-progress-fill" style="width:' + pct + '%;"></div></div>';
        } else {
            cardClass += ' not-started';
            borderColor = '#444';
            statusText = '\u{1F512} \u672A\u5F00\u59CB';
        }

        // 构建奖励文本
        var rewardText = '';
        if (ach.reward) {
            var parts = [];
            if (ach.reward.gold) parts.push('💰x' + Math.min(500000, ach.reward.gold));
            if (ach.reward.gem) parts.push('💎x' + Math.min(300, ach.reward.gem));
            if (ach.reward.lotteryStone) parts.push('🎫x' + Math.min(100, ach.reward.lotteryStone));
            if (ach.reward.petEggStones) parts.push('🥚x' + Math.min(100, ach.reward.petEggStones));
            if (ach.reward.upgradeStone) parts.push('🔷x' + Math.min(100, ach.reward.upgradeStone));
            rewardText = parts.join(' ');
        }

        html += '<div class="' + cardClass + '" style="border-color:' + borderColor + ';" onclick="showAchievementDetail(\'' + ach.id + '\')">'
            +   '<div class="ach-icon">' + ach.icon + '</div>'
            +   '<div class="ach-info">'
            +     '<div class="ach-name">' + ach.name + '</div>'
            +     '<div class="ach-desc">' + ach.desc + '</div>'
            +     progressHtml
            +     '<div class="ach-status">' + statusText + '</div>'
            +   '</div>'
            + '</div>';
    }

    grid.innerHTML = html;
}

// 刷新成就UI（外部调用，比如解锁后刷新）
function refreshAchievementUI() {
    renderAchievementGrid();
    // 更新顶部统计
    var stats = getAchievementStats();
    var titleEl = document.querySelector('.achievement-stats');
    if (titleEl) titleEl.textContent = stats.unlocked + ' / ' + stats.total + ' \u5DF2\u8FBE\u6210';

    var fillEl = document.querySelector('.achievement-progress-fill');
    if (fillEl) fillEl.style.width = (stats.total > 0 ? (stats.unlocked / stats.total * 100) : 0) + '%';
    var textEl = document.querySelector('.achievement-progress-text');
    if (textEl) textEl.textContent = Math.floor(stats.total > 0 ? (stats.unlocked / stats.total * 100) : 0) + '%';
}

// 显示成就详情弹窗
function showAchievementDetail(id) {
    // 移除旧详情
    var oldDetail = document.getElementById('ach-detail-overlay');
    if (oldDetail) oldDetail.remove();

    var ach = null;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        if (ACHIEVEMENTS[i].id === id) { ach = ACHIEVEMENTS[i]; break; }
    }
    if (!ach) return;

    var progress = getAchievementProgress(id);

    var detailOverlay = document.createElement('div');
    detailOverlay.id = 'ach-detail-overlay';
    detailOverlay.className = 'modal-overlay ach-detail-overlay';

    var statusIcon = progress.completed ? '\u2705' : (progress.current > 0 ? '\u{1F3AF}' : '\u{1F512}');
    var statusText = progress.completed ? '\u5DF2\u8FBE\u6210' : '进度: ' + Math.min(progress.current, progress.target) + ' / ' + progress.target;
    var pct = progress.target > 0 ? Math.min(100, Math.floor((progress.current / progress.target) * 100)) : 0;

    var rewardHtml = '';
    if (ach.reward) {
        var parts = [];
        if (ach.reward.gold) parts.push('<span>💰 金币 x' + Math.min(500000, ach.reward.gold) + '</span>');
        if (ach.reward.gem) parts.push('<span>💎 宝石 x' + Math.min(300, ach.reward.gem) + '</span>');
        if (ach.reward.lotteryStone) parts.push('<span>🎫 抽奖石 x' + Math.min(100, ach.reward.lotteryStone) + '</span>');
        if (ach.reward.petEggStones) parts.push('<span>🥚 蛋石 x' + Math.min(100, ach.reward.petEggStones) + '</span>');
        if (ach.reward.upgradeStone) parts.push('<span>🔷 升级石 x' + Math.min(100, ach.reward.upgradeStone) + '</span>');
        rewardHtml = '<div class="ach-detail-reward-title">🎁 奖励</div>'
            + '<div class="ach-detail-rewards">'
            + parts.join('')
            + '</div>';
    }

    detailOverlay.innerHTML =
        '<div class="ach-detail-modal">'
        +   '<div class="ach-detail-header" style="position:relative;">'
        +     '<span class="ach-detail-icon">' + ach.icon + '</span>'
        +     '<span class="ach-detail-name">' + ach.name + '</span>'
        +     '<span style="position:absolute;top:4px;right:6px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>'
        +   '</div>'
        +   '<div class="ach-detail-desc">' + ach.desc + '</div>'
        +   '<div class="ach-detail-status">' + statusIcon + ' ' + statusText + '</div>'
        +   '<div class="ach-detail-progress-wrap">'
        +     '<div class="ach-detail-progress-bar">'
        +       '<div class="ach-detail-progress-fill" style="width:' + pct + '%;"></div>'
        +     '</div>'
        +     '<span class="ach-detail-pct">' + pct + '%</span>'
        +   '</div>'
        +   rewardHtml
        +   '<button class="btn ach-detail-close" onclick="this.closest(\'.modal-overlay\').remove()">\u786E\u5B9A</button>'
        + '</div>';

    document.body.appendChild(detailOverlay);
}
