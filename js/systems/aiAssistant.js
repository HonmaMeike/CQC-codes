// ========== AI 精灵助手 v1.0 ==========
// 调用 DeepSeek API，需在设置中配置 API Key

var AI_API_URL = 'https://api.deepseek.com/v1/chat/completions';
var AI_MODEL = 'deepseek-chat';

// 获取已保存的 API Key
function getAIKey() {
    try { return localStorage.getItem('cqc_ai_key') || ''; } catch(e) { return ''; }
}

// 保存 API Key
function setAIKey(key) {
    try { localStorage.setItem('cqc_ai_key', key); } catch(e) {}
}

// 系统提示词
function getAISystemPrompt() {
    return '你是一个放置挂机RPG游戏《CQC》的智能助手。游戏包含：8种职业英雄、' +
        '自动战斗系统、装备强化融合、宝石镶嵌共鸣、宠物系统（30宠物/抽奖/孵化/升星）、' +
        '爬塔副本、轮回转生、成就系统等。请用中文回答玩家问题，回答简洁实用，' +
        '给出具体攻略建议。回答中不要使用Markdown格式，使用纯文本。';
}

// 调用 DeepSeek API
function askAI(question, onSuccess, onError) {
    var key = getAIKey();
    if (!key) {
        if (onError) onError('请先在设置中配置 DeepSeek API Key');
        return;
    }
    
    // 构建消息历史
    var messages = [
        { role: 'system', content: getAISystemPrompt() },
        { role: 'user', content: question }
    ];
    
    fetch(AI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
            model: AI_MODEL,
            messages: messages,
            max_tokens: 1024,
            temperature: 0.7
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.error) {
            if (onError) onError('API错误: ' + (data.error.message || JSON.stringify(data.error)));
            return;
        }
        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (reply) {
            if (onSuccess) onSuccess(reply);
        } else {
            if (onError) onError('AI返回为空，请重试');
        }
    })
    .catch(function(e) {
        if (onError) onError('网络错误: ' + e.message);
    });
}

// 快速攻略问题
var AI_QUICK_QUESTIONS = [
    '新手怎么快速升级？',
    '装备怎么强化最好？',
    '宠物怎么获得和培养？',
    '爬塔有什么技巧？',
    '金币不够用怎么办？',
    '哪些英雄值得培养？'
];
