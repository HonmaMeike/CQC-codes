// ========== AI 智能助手（DeepSeek 驱动）v1.0 ==========
// 调用 DeepSeek API 回答游戏相关问题
// API Key 存储在 localStorage 中

var AI_STORAGE_KEY = 'cqc_ai_config';
var AI_CHAT_KEY = 'cqc_ai_chat_history';

// DeepSeek API Key（内置，可在设置中覆盖）
var AI_DEFAULT_KEY = 'sk-f6e2e21711764d68b1c0790757eef307';

function _encryptKey(k) {
    var r = []; for(var i=0;i<k.length;i++) r.push(k.charCodeAt(i) ^ 0x5A);
    return r.join(',');
}
function _decryptKey(enc) {
    if(!enc || typeof enc !== 'string') return '';
    var r = enc.split(','), s = [];
    for(var i=0;i<r.length;i++) s.push(String.fromCharCode(parseInt(r[i]) ^ 0x5A));
    return s.join('');
}
function getAiConfig() {
    try {
        var cfg = JSON.parse(localStorage.getItem(AI_STORAGE_KEY)) || {};
        // 解密存储的 Key
        if (cfg._keyEnc) { cfg.apiKey = _decryptKey(cfg._keyEnc); delete cfg._keyEnc; }
        return cfg;
    } catch(e) { return {}; }
}

function saveAiConfig(cfg) { localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(cfg)); }

function getChatHistory() {
    try { return JSON.parse(localStorage.getItem(AI_CHAT_KEY)) || []; } catch(e) { return []; }
}

function saveChatHistory(h) { localStorage.setItem(AI_CHAT_KEY, JSON.stringify(h)); }

// 打开 AI 助手弹窗
function openAIAssistant() {
    var config = getAiConfig();
    if (!config.apiKey) {
        config.apiKey = 'sk-f6e2e21711764d68b1c0790757eef307';
        saveAiConfig(config);
    }
    var history = getChatHistory();
    
    var html = '<div class="modal-overlay" id="ai-modal" onclick="if(event.target===this)closeAIAssistant()">' +
        '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:400px;height:70vh;display:flex;flex-direction:column;padding:0;overflow:hidden;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #2196f3;border-radius:16px;">' +
        // 标题栏
        '<div style="background:linear-gradient(135deg,#1565c0,#0d47a1);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:20px;">🧠</span>' +
        '<span style="font-size:15px;font-weight:bold;color:#fff;">AI 小精灵</span>' +
        '<span style="font-size:9px;color:rgba(255,255,255,0.5);">DeepSeek</span></div>' +
        '<div style="display:flex;gap:4px;">' +
        (!config.apiKey 
            ? '<button class="btn" style="padding:3px 8px;font-size:9px;border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);" onclick="openAiSettings()">⚙ Key</button>'
            : '<span style="font-size:9px;color:rgba(76,175,80,0.8);">✅已配置</span>') +
        '<span style="font-size:18px;cursor:pointer;color:rgba(255,255,255,0.6);padding:0 4px;" onclick="closeAIAssistant()">✕</span></div></div>' +
        // 对话区域
        '<div id="ai-chat-area" style="flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;">' +
        renderChatMessages(history) +
        '</div>' +
        // 快捷问题
        '<div id="ai-quick-questions" style="padding:0 12px 8px;display:flex;flex-wrap:wrap;gap:4px;flex-shrink:0;">' +
        renderQuickQuestions() +
        '</div>' +
        // 输入区
        '<div style="padding:8px 12px 12px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-shrink:0;">' +
        '<input id="ai-input" type="text" placeholder="\u8f93\u5165\u4f60\u7684\u95ee\u9898..." style="flex:1;padding:8px 12px;border-radius:20px;border:1px solid rgba(33,150,243,0.3);background:rgba(0,0,0,0.4);color:#fff;font-size:13px;outline:none;" onkeydown="if(event.key===13)sendAiQuestion()">' +
        '<button class="btn" style="background:linear-gradient(135deg,#2196f3,#1565c0);border:none;color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:bold;" onclick="sendAiQuestion()">发送</button></div></div></div>';
    
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
    
    // 滚动到底部
    setTimeout(function() {
        var area = document.getElementById('ai-chat-area');
        if (area) area.scrollTop = area.scrollHeight;
        var input = document.getElementById('ai-input');
        if (input) input.focus();
    }, 100);
}

function closeAIAssistant() {
    var m = document.getElementById('ai-modal');
    if (m) m.remove();
}

function renderChatMessages(history) {
    if (!history || history.length === 0) {
        return '<div style="text-align:center;padding:30px 10px;color:#555;font-size:12px;margin-top:auto;">' +
            '<div style="font-size:40px;margin-bottom:8px;">🧠</div>' +
            '<div>问我关于 CQC 游戏的问题</div>' +
            '<div style="font-size:10px;color:#444;margin-top:4px;">装备、宠物、副本、天赋...都可以问</div></div>';
    }
    var html = '';
    for (var i = 0; i < history.length; i++) {
        var msg = history[i];
        if (msg.role === 'user') {
            html += '<div style="display:flex;justify-content:flex-end;margin-bottom:4px;">' +
                '<div style="background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.2);border-radius:12px 4px 12px 12px;padding:8px 12px;max-width:85%;font-size:12px;color:#e0e0e0;word-break:break-word;">' +
                msg.content + '</div></div>';
        } else {
            html += '<div style="display:flex;justify-content:flex-start;margin-bottom:4px;">' +
                '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px 12px 12px 12px;padding:8px 12px;max-width:85%;font-size:12px;color:#b0bec5;word-break:break-word;">' +
                msg.content + '</div></div>';
        }
    }
    // 加载动画占位
    if (history._loading) {
        html += '<div id="ai-loading" style="display:flex;align-items:center;gap:6px;padding:8px 12px;font-size:11px;color:#888;">' +
            '<span style="display:inline-block;width:8px;height:8px;background:#2196f3;border-radius:50%;animation:aiBounce 0.6s infinite;"></span>' +
            '<span style="display:inline-block;width:8px;height:8px;background:#2196f3;border-radius:50%;animation:aiBounce 0.6s 0.2s infinite;"></span>' +
            '<span style="display:inline-block;width:8px;height:8px;background:#2196f3;border-radius:50%;animation:aiBounce 0.6s 0.4s infinite;"></span>' +
            ' 思考中...</div>';
    }
    return html;
}

function renderQuickQuestions() {
    var questions = [
        '宠物怎么获得',
        '装备怎么强化',
        '爬塔奖励有什么',
        '天赋怎么加点'
    ];
    var html = '';
    for (var i = 0; i < questions.length; i++) {
        html += '<span id="ai-q-' + i + '" style="font-size:9px;color:#64b5f6;background:rgba(33,150,243,0.08);border:1px solid rgba(33,150,243,0.15);border-radius:12px;padding:3px 10px;cursor:pointer;">' +
            questions[i] + '</span>';
    }
    setTimeout(function() {
        for (var qi = 0; qi < questions.length; qi++) {
            var el = document.getElementById('ai-q-' + qi);
            if (el) el.onclick = function() {
                var inp = document.getElementById('ai-input');
                if (inp) { inp.value = this.textContent; sendAiQuestion(); }
            };
        }
    }, 50);
    return html;
}

// 发送问题到 DeepSeek
function sendAiQuestion() {
    var input = document.getElementById('ai-input');
    if (!input) return;
    var question = input.value.trim();
    if (!question) return;
    
    var config = getAiConfig();
    if (!config.apiKey) {
        // 使用内置默认 Key
        config.apiKey = AI_DEFAULT_KEY;
        saveAiConfig(config);
    }
    
    input.value = '';
    input.disabled = true;
    
    // 添加用户消息
    var history = getChatHistory();
    history.push({ role: 'user', content: question });
    saveChatHistory(history);
    
    // 清空并显示加载
    var area = document.getElementById('ai-chat-area');
    if (area) {
        history._loading = true;
        area.innerHTML = renderChatMessages(history);
        area.scrollTop = area.scrollHeight;
    }
    
    // 设置发送按钮为加载状态
    var sendBtn = document.querySelector('#ai-modal .btn:last-child');
    if (sendBtn) { sendBtn.textContent = '...'; sendBtn.disabled = true; }
    
    // 构建消息历史（只传最近 10 条）
    var messages = [
        { role: 'system', content: '你是 CQC 放置挂机刷宝 RPG 游戏的智能助手。游戏包含：8大职业英雄、装备强化融合、宝石镶嵌合成共鸣、爬塔副本抽奖、宠物系统（30种宠物抽奖孵化升星碎片）、天赋系统、轮回转生等。用中文简短回答玩家问题，每次回答不超过200字。' }
    ];
    var recentHistory = history.slice(-10);
    for (var i = 0; i < recentHistory.length; i++) {
        messages.push({ role: recentHistory[i].role, content: recentHistory[i].content });
    }
    
    // 调用 DeepSeek API
    var startTime = Date.now();
    
    fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + config.apiKey
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
        })
    })
    .then(function(response) {
        if (!response.ok) {
            return response.json().then(function(err) {
                throw new Error(err.error ? err.error.message : 'HTTP ' + response.status);
            });
        }
        return response.json();
    })
    .then(function(data) {
        var reply = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
        if (!reply) reply = '抱歉，我没有理解你的问题，请换个方式再问一次。';
        
        // 保存回复
        history.push({ role: 'assistant', content: reply });
        saveChatHistory(history);
        
        // 更新界面
        delete history._loading;
        var area2 = document.getElementById('ai-chat-area');
        if (area2) {
            area2.innerHTML = renderChatMessages(history);
            area2.scrollTop = area2.scrollHeight;
        }
    })
    .catch(function(error) {
        delete history._loading;
        var area3 = document.getElementById('ai-chat-area');
        if (area3) {
            history.push({ role: 'assistant', content: '❌ ' + error.message });
            saveChatHistory(history);
            area3.innerHTML = renderChatMessages(history);
            area3.scrollTop = area3.scrollHeight;
        }
    })
    .finally(function() {
        input.disabled = false;
        input.focus();
        if (sendBtn) { sendBtn.textContent = '发送'; sendBtn.disabled = false; }
    });
}

// AI 设置弹窗（配置 API Key）
function openAiSettings() {
    var config = getAiConfig();
    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()">' +
        '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:380px;">' +
        '<h3 style="text-align:center;margin-bottom:14px;">⚙ AI 小精灵设置</h3>' +
        '<label>DeepSeek API Key</label>' +
        '<input id="ai-key-input" type="password" placeholder="sk-..." value="' + (config.apiKey || '') + '" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.4);color:#fff;font-size:13px;outline:none;margin-bottom:10px;">' +
        '<div style="font-size:10px;color:#555;margin-bottom:12px;">Key 仅保存在浏览器本地存储中，不会上传到第三方。可在 <a href="https://platform.deepseek.com" target="_blank" style="color:#4fc3f7;">platform.deepseek.com</a> 获取。</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn" style="flex:1;background:rgba(255,255,255,0.08);color:#aaa;border:1px solid rgba(255,255,255,0.15);" onclick="closeModal()">取消</button>' +
        '<button class="btn btn-gold" style="flex:2;margin-top:0;" onclick="saveAiKey()">💾 保存并打开</button></div></div></div>';
    
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
    
    setTimeout(function() {
        var input = document.getElementById('ai-key-input');
        if (input) input.focus();
    }, 100);
}

function saveAiKey() {
    var input = document.getElementById('ai-key-input');
    if (!input) return;
    var key = input.value.trim();
    if (key) {
        var cfg = getAiConfig();
        cfg.apiKey = key;
        cfg._keyEnc = _encryptKey(cfg.apiKey); delete cfg.apiKey; saveAiConfig(cfg);
    }
    // 关闭设置弹窗
    var modal = document.getElementById('ai-key-input') ? document.getElementById('ai-key-input').closest('.modal-overlay') : null;
    if (modal) modal.remove();
    // 打开 AI 助手（已有则刷新）
    var existing = document.getElementById('ai-modal');
    if (existing) { closeAIAssistant(); }
    setTimeout(function() { openAIAssistant(); }, 200);
}

// 初始化 CSS 动画
(function() {
    if (typeof window !== 'undefined' && !document.getElementById('ai-style')) {
        var style = document.createElement('style');
        style.id = 'ai-style';
        style.textContent = '@keyframes aiBounce { 0%,100% { opacity:0.3;transform:translateY(0); } 50% { opacity:1;transform:translateY(-4px); } }';
        document.head.appendChild(style);
    }
})();


// ★ 绑定家园界面 AI 按钮点击事件
(function() {
    function bindAIButton() {
        var btn = document.getElementById('ai-home-btn');
        if (btn) {
            btn.onclick = function() { openAIAssistant(); };
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindAIButton);
    } else {
        bindAIButton();
    }
    // HomeSystem 可能会重建 DOM，加个延时兜底
    setTimeout(bindAIButton, 1000);
    setTimeout(bindAIButton, 3000);
})();
