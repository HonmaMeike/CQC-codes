// ========== 自动更新检测 v1.0 ==========
var UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/HonmaMeike/CQC-codes/main/version.json';
var UPDATE_CHECK_INTERVAL = 30 * 60 * 1000; // 30分钟检测一次
var _updateCheckTimer = null;

function getGameVersion() {
    // 从设置页版本号读取（优先用 ID 精确查找）
    var el = document.getElementById('stat-game-version');
    if (!el) {
        // 兜底：查找 "游戏版本" 标签后面的 span
        var labels = document.querySelectorAll('.settings-stat-label');
        for (var i = 0; i < labels.length; i++) {
            if (labels[i].textContent === '游戏版本') {
                var next = labels[i].nextElementSibling;
                if (next) { el = next; break; }
            }
        }
    }
    if (el && el.textContent) {
        var m = el.textContent.match(/v?(\d+\.\d+\.\d+)/);
        if (m) return m[1];
    }
    return '0.0.0';
}

function checkForUpdate(silent) {
    fetch(UPDATE_CHECK_URL + '?t=' + Date.now(), { cache: 'no-store' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.version) return;
            var latest = data.version;
            var current = getGameVersion();
            
            // 比较版本号
            var curParts = current.split('.').map(Number);
            var newParts = latest.split('.').map(Number);
            var hasUpdate = false;
            for (var i = 0; i < 3; i++) {
                if (newParts[i] > curParts[i]) { hasUpdate = true; break; }
                if (newParts[i] < curParts[i]) break;
            }
            
            if (hasUpdate) {
                var msg = '🆕 发现新版本 v' + latest + '！当前: v' + current;
                if (data.note) msg += '\n' + data.note;
                showUpdateNotification(msg, data.url || '');
            } else if (!silent) {
                showToast('✅ 已是最新版本 (v' + current + ')', 'info');
            }
        })
        .catch(function(e) {
            if (!silent) showToast('⚠ 更新检测失败', 'warning');
        });
}

function showUpdateNotification(msg, url) {
    var banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:linear-gradient(135deg,#ff6f00,#ff9800);color:#fff;padding:16px 20px;font-size:13px;text-align:center;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.5);cursor:pointer;max-width:320px;';
    banner.innerHTML = msg.replace(/\n/g, '<br>');
    banner.onclick = function() { banner.remove(); };
    document.body.appendChild(banner);
    
    // 3秒后自动消失
    setTimeout(function() {
        if (banner.parentNode) banner.remove();
    }, 3000);
}

function startAutoUpdateCheck() {
    // 启动后 10 秒首次检测（静默），之后每 30 分钟
    if (_updateCheckTimer) clearInterval(_updateCheckTimer);
    setTimeout(function() {
        checkForUpdate(true);
        _updateCheckTimer = setInterval(function() { checkForUpdate(true); }, UPDATE_CHECK_INTERVAL);
    }, 10000);
}

function stopAutoUpdateCheck() {
    if (_updateCheckTimer) {
        clearInterval(_updateCheckTimer);
        _updateCheckTimer = null;
    }
}
