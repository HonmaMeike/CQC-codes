// ========== 云存档系统（GitHub 存储）v1.2 ==========
var CLOUD_SAVE_CONFIG_KEY = 'cqc_cloud_save_config';

// ★ Token 分段拼接防直接提取
var _GH_TOKEN = (function() {
    var p = 'Z2hw' + 'XzBpaUJl' + 'Q1ZQTmszbHNiREVM' + 'SGJ0SFRTNXFJVVVHdzJ6UzNrdw';
    try { return atob(p); } catch(e) { return ''; }
})();
var _GH_OWNER = 'HonmaMeike';
var _GH_REPO = 'CQC-codes';

function getCloudConfig() {
    try { return JSON.parse(localStorage.getItem(CLOUD_SAVE_CONFIG_KEY)) || {}; } catch(e) { return {}; }
}
function saveCloudConfig(cfg) { localStorage.setItem(CLOUD_SAVE_CONFIG_KEY, JSON.stringify(cfg)); }

function closeCloudSaveModal() {
    var m = document.getElementById('cloud-save-modal');
    if (m) m.remove();
}

function openCloudSaveModal() {
    var cfg = getCloudConfig();
    var hasPin = cfg.pin && cfg.pin.length >= 4;
    var html = '<div class="modal-overlay" id="cloud-save-modal" onclick="if(event.target===this)closeCloudSaveModal()">' +
        '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:360px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #4fc3f7;border-radius:14px;padding:0;overflow:hidden;">' +
        '<div style="background:linear-gradient(135deg,#1565c0,#0d47a1);padding:10px 14px;text-align:center;position:relative;">' +
        '<span style="font-size:16px;cursor:pointer;position:absolute;top:6px;right:10px;color:rgba(255,255,255,0.6);" onclick="closeCloudSaveModal()">\u2716</span>' +
        '<div style="font-size:15px;font-weight:bold;color:#fff;">\u2601 \u4e91\u5b58\u6863</div>' +
        '<div style="font-size:9px;color:rgba(255,255,255,0.5);">GitHub \u5b58\u50a8 \u00b7 PIN \u7801\u4fdd\u62a4</div></div>' +
        '<div style="padding:12px;">' +
        '<label style="font-size:10px;color:#888;">PIN \u7801\uff084\u4f4d\u4ee5\u4e0a \u00b7 \u533a\u5206\u73a9\u5bb6\uff09</label>' +
        '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
        '<input id="cs-pin" type="password" placeholder="\u5982: 1234" maxlength="10" value="' + (cfg.pin || '') + '" style="flex:1;padding:8px 10px;border-radius:6px;border:1px solid rgba(79,195,247,0.3);background:rgba(0,0,0,0.4);color:#fff;font-size:14px;outline:none;letter-spacing:4px;text-align:center;">' +
        '<button class="btn" style="background:linear-gradient(135deg,#1565c0,#0d47a1);color:#fff;border:none;padding:6px 10px;font-size:11px;border-radius:6px;" onclick="saveCloudPin()">\u4fdd\u5b58</button></div>' +
        '<div id="cs-status" style="font-size:11px;color:#888;text-align:center;margin-bottom:8px;min-height:16px;">' +
        (!hasPin ? '\u26a0\ufe0f \u8bf7\u8bbe\u7f6e\u60a8\u7684 PIN \u7801' : '\u2705 \u5df2\u5c31\u7eea \u00b7 \u53ef\u4e0a\u4f20/\u4e0b\u8f7d') +
        '</div>' +
        '<div style="display:flex;gap:4px;">' +
        '<button class="btn" style="flex:1;background:' + (hasPin ? 'linear-gradient(135deg,#2e7d32,#1b5e20)' : 'rgba(255,255,255,0.06)') + ';border:none;color:#fff;padding:8px;font-size:12px;font-weight:bold;border-radius:8px;' + (hasPin ? '' : 'opacity:0.4;') + '" onclick="' + (hasPin ? 'uploadCloudSave()' : '') + '">\u2601 \u4e0a\u4f20</button>' +
        '<button class="btn" style="flex:1;background:' + (hasPin ? 'linear-gradient(135deg,#e65100,#bf360c)' : 'rgba(255,255,255,0.06)') + ';border:none;color:#fff;padding:8px;font-size:12px;font-weight:bold;border-radius:8px;' + (hasPin ? '' : 'opacity:0.4;') + '" onclick="' + (hasPin ? 'downloadCloudSave()' : '') + '">\u2601 \u4e0b\u8f7d</button>' +
        '<button class="btn" style="flex:inherit;background:transparent;border:1px solid #f44336;color:#f44336;padding:8px 4px;font-size:10px;font-weight:normal;border-radius:8px;" onclick="askDeleteCloud()">\u2716</button></div>' +
        '<div style="font-size:9px;color:#555;margin-top:8px;line-height:1.5;">\ud83d\udca1 \u4e0a\u4f20 = \u4fdd\u5b58\u5f53\u524d\u8fdb\u5ea6\u5230\u4e91\u7aef<br>\ud83d\udca1 \u4e0b\u8f7d = \u8986\u76d6\u672c\u5730\u8fdb\u5ea6\uff08\u8bf7\u5148\u5907\u4efd\uff09<br>\ud83d\udca1 \u4e0d\u540c PIN \u7801\u4e92\u4e0d\u53ef\u89c1</div>' +
        '</div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}



function saveCloudPin() {
    var pin = (document.getElementById('cs-pin') || {}).value || '';
    var cfg = getCloudConfig();
    cfg.pin = pin;
    saveCloudConfig(cfg);
    var st = document.getElementById('cs-status');
    if (st) st.innerHTML = '\u2705 \u5df2\u5c31\u7eea \u00b7 \u53ef\u4e0a\u4f20/\u4e0b\u8f7d';
    if (typeof showToast === 'function') showToast('PIN \u5df2\u4fdd\u5b58', 'success');
    closeCloudSaveModal();
    openCloudSaveModal();
}

function uploadCloudSave() {
    var cfg = getCloudConfig();
    if (!cfg.pin) { if(typeof showToast==='function')showToast('\u8bf7\u5148\u8bbe\u7f6e PIN \u7801', 'warning'); return; }
    var st = document.getElementById('cs-status');
    if (st) st.innerHTML = '<span style="color:#4fc3f7;">\u23f3 \u4e0a\u4f20\u4e2d...</span>';
    
    // Get save data
    var saveData = null;
    try { saveData = localStorage.getItem('cqc_idle_rpg_save_v3'); } catch(e) {}
    if (!saveData) {
        if (st) st.innerHTML = '\u274c \u6ca1\u6709\u5b58\u6863\u6570\u636e';
        return;
    }
    var content = typeof saveData === 'string' ? saveData : JSON.stringify(saveData);
    var encoded = btoa(unescape(encodeURIComponent(content)));
    
    var path = 'saves/' + cfg.pin + '.json';
    var api = 'https://api.github.com/repos/' + _GH_OWNER + '/' + _GH_REPO + '/contents/' + path;
    var headers = { 'Authorization': 'token ' + _GH_TOKEN, 'Accept': 'application/vnd.github.v3+json' };
    
    // First check if file exists (get SHA)
    fetch(api + '?ref=main', { headers: headers })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var body = {
                message: '\u4e0a\u4f20\u5b58\u6863 ' + cfg.pin + ' - ' + new Date().toLocaleString(),
                content: encoded,
                branch: 'main'
            };
            if (data && data.sha) body.sha = data.sha;
            
            return fetch(api, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(body)
            });
        })
        .then(function(r) { return r.json(); })
        .then(function(result) {
            if (result && result.content) {
                if (st) st.innerHTML = '\u2705 \u4e0a\u4f20\u6210\u529f\uff01';
                if (typeof showToast === 'function') showToast('\u2601 \u4e0a\u4f20\u6210\u529f\uff01', 'success');
            } else {
                if (st) st.innerHTML = '\u274c \u4e0a\u4f20\u5931\u8d25: ' + (result.message || '\u672a\u77e5\u9519\u8bef');
            }
        })
        .catch(function(e) { 
            if (st) st.innerHTML = '\u274c \u7f51\u7edc\u9519\u8bef: ' + (e.message || ''); 
        });
}

function downloadCloudSave() {
    var cfg = getCloudConfig();
    if (!cfg.pin) { if(typeof showToast==='function')showToast('\u8bf7\u5148\u8bbe\u7f6e PIN \u7801', 'warning'); return; }
    var st = document.getElementById('cs-status');
    if (st) st.innerHTML = '<span style="color:#4fc3f7;">\u23f3 \u4e0b\u8f7d\u4e2d...</span>';
    
    var path = 'saves/' + cfg.pin + '.json';
    var api = 'https://api.github.com/repos/' + _GH_OWNER + '/' + _GH_REPO + '/contents/' + path;
    var headers = { 'Authorization': 'token ' + _GH_TOKEN, 'Accept': 'application/vnd.github.v3+json' };
    
    fetch(api + '?ref=main', { headers: headers })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.content) {
                if (st) st.innerHTML = '\u274c \u672a\u627e\u5230\u4e91\u7aef\u5b58\u6863';
                if (typeof showToast === 'function') showToast('\u672a\u627e\u5230\u4e91\u7aef\u5b58\u6863', 'warning');
                return;
            }
            try {
                var decoded = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
                localStorage.setItem('cqc_idle_rpg_save_v3', decoded);
                
                if (st) st.innerHTML = '\u2705 \u4e0b\u8f7d\u6210\u529f\uff01\u6e38\u620f\u5df2\u66f4\u65b0';
                if (typeof showToast === 'function') showToast('\u2601 \u4e0b\u8f7d\u6210\u529f\uff01', 'success');
                
                // Reload after brief delay
                setTimeout(function() { location.reload(); }, 1000);
            } catch(e) {
                if (st) st.innerHTML = '\u274c \u89e3\u6790\u5931\u8d25: ' + (e.message || '');
            }
        })
        .catch(function(e) {
            if (st) st.innerHTML = '\u274c \u7f51\u7edc\u9519\u8bef: ' + (e.message || '');
        });
}

function askDeleteCloud() {
    if (confirm('\u786e\u5b9a\u5220\u9664\u4e91\u7aef\u5b58\u6863\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u6062\u590d\uff01')) {
        deleteCloudSave();
    }
}

function deleteCloudSave() {
    var cfg = getCloudConfig();
    if (!cfg.pin) { if(typeof showToast==='function')showToast('\u8bf7\u5148\u8bbe\u7f6e PIN \u7801', 'warning'); return; }
    var st = document.getElementById('cs-status');
    if (st) st.innerHTML = '<span style="color:#f44336;">\u23f3 \u5220\u9664\u4e2d...</span>';
    var path = 'saves/' + cfg.pin + '.json';
    var api = 'https://api.github.com/repos/' + _GH_OWNER + '/' + _GH_REPO + '/contents/' + path;
    var headers = { 'Authorization': 'token ' + _GH_TOKEN, 'Accept': 'application/vnd.github.v3+json' };
    fetch(api + '?ref=main', { headers: headers })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data || !data.sha) {
                if(st)st.innerHTML='\u274c \u672a\u627e\u5230\u4e91\u7aef\u5b58\u6863';
                if(typeof showToast==='function')showToast('\u672a\u627e\u5230\u4e91\u7aef\u5b58\u6863', 'warning');
                return;
            }
            fetch(api, {
                method: 'DELETE',
                headers: (function(){var _es5_30={};for(var _k in headers){if(headers.hasOwnProperty(_k))_es5_30[_k]=headers[_k];}for(var _k in { 'Content-Type': 'application/json' }){if({ 'Content-Type': 'application/json' }.hasOwnProperty(_k))_es5_30[_k]={ 'Content-Type': 'application/json' }[_k];}return _es5_30;})(),
                body: JSON.stringify({ message: '\u5220\u9664\u5b58\u6863 ' + cfg.pin, sha: data.sha, branch: 'main' })
            })
            .then(function(r) { return r.json(); })
            .then(function(result) {
                if (result && !result.message) {
                    if(st)st.innerHTML='\u2705 \u4e91\u7aef\u5b58\u6863\u5df2\u5220\u9664';
                    if(typeof showToast==='function')showToast('\u2601 \u4e91\u7aef\u5b58\u6863\u5df2\u5220\u9664', 'success');
                } else {
                    if(st)st.innerHTML='\u274c \u5220\u9664\u5931\u8d25: ' + (result.message || '\u672a\u77e5\u9519\u8bef');
                }
            })
            .catch(function(e) { if(st)st.innerHTML='\u274c \u7f51\u7edc\u9519\u8bef'; });
        })
        .catch(function(e) { if(st)st.innerHTML='\u274c \u7f51\u7edc\u9519\u8bef'; });
}
