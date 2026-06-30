// ========== 战斗日志系统（从 battle.js 拆出） ==========
(function() {
    'use strict';
    if (typeof BattleManager === 'undefined') return;
    var __methods = {
_logIconMap: {
    info: '💬', attack: '⚔️', skill: '✨', crit: '💥', heal: '💚',
    shield: '🛡️', buff: '⬆️', debuff: '⬇️', death: '💀', boss: '👑',
    loot: '🎁', level: '🌟', victory: '🏆', defeat: '💔', revive: '✨'
},
// 初始化日志筛选默认状态（全部激活）
_initLogFilter: function() {
    if (this._activeLogTypes) return;
    this._activeLogTypes = {
        info: true, attack: true, skill: true, crit: true, heal: true,
        shield: true, buff: true, debuff: true, death: true, boss: true,
        loot: true, level: true, victory: true, defeat: true, revive: true
    };
},
// 添加战斗日志（精致显示：时间戳 + 类型图标 + 卡片式，增量更新避免闪屏）
addBattleLog: function(msg, type) {
    if (!type) type = 'info';
    this._initLogFilter();
    var now = new Date();
    var hh = (now.getHours() < 10 ? '0' : '') + now.getHours();
    var mm = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    var ss = (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();
    var timeStr = hh + ':' + mm + ':' + ss;
    this.battleLog.unshift({ msg: msg, type: type, time: timeStr });
    if (this.battleLog.length > this.maxBattleLog) {
        this.battleLog.pop();
    }
    // 增量更新 DOM（只创建新项，不重写全部 - 避免闪屏）
    var logEl = document.getElementById('battle-log');
    if (logEl) {
        var li = this._logIconMap[type] || this._logIconMap.info;
        var item = document.createElement('div');
        item.className = 'log-item log-' + type;
        item.setAttribute('data-log-type', type);
        // ★ v2.6.4 Round 12: 加 data-log-msg 给搜索用, data-log-key 给"关键"tab 用
        item.setAttribute('data-log-msg', msg);
        var isKey = (type === 'attack' || type === 'crit' || type === 'skill' || type === 'boss' || type === 'loot' || type === 'level' || type === 'victory' || type === 'defeat');
        if (isKey) item.setAttribute('data-log-key', '1');
        // 转义 msg 防止 XSS（用 textContent 而非 innerHTML 拼接）
        var timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = timeStr;
        var iconSpan = document.createElement('span');
        iconSpan.className = 'log-icon';
        iconSpan.textContent = li;
        var msgSpan = document.createElement('span');
        msgSpan.className = 'log-msg';
        msgSpan.textContent = msg;
        item.appendChild(timeSpan);
        item.appendChild(iconSpan);
        item.appendChild(msgSpan);
        // 应用当前筛选状态
        this._applyItemVisibility(item, type, isKey);
        // 插入到顶部（不触发现有项的动画，避免闪屏）
        if (logEl.firstChild) {
            logEl.insertBefore(item, logEl.firstChild);
        } else {
            logEl.appendChild(item);
        }
        // 限制 DOM 节点数（超出删除末尾项）
        var maxDom = 200;
        while (logEl.children.length > maxDom) {
            logEl.removeChild(logEl.lastChild);
        }
        // 更新统计
        this._refreshLogStats();
    }
},
    };
    for (var __k in __methods) {
        BattleManager[__k] = __methods[__k];
    }
})();
