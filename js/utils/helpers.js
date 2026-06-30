// ========== 通用工具函数 ==========
/* global GameState */

// Toast 通知
function showToast(msg, type) {
    if (!type) type = 'info';
    // 根据类型播放音效
    if (typeof AudioManager !== 'undefined' && AudioManager.play) {
        if (type === 'success') {
            AudioManager.play('coin');
        } else if (type === 'warning' || type === 'error') {
            AudioManager.play('error');
        }
    }
    var container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 2000);
}

// 品质等级
var QUALITY = {
    COMMON: 0, RARE: 1, LEGENDARY: 2, MIRACLE: 3, MYTHIC: 4, IMMORTAL: 5
};
var QUALITY_NAMES = ['白', '绿', '蓝', '紫', '橙', '金'];
var QUALITY_CLASSES = ['q-common', 'q-rare', 'q-legendary', 'q-miracle', 'q-mythic', 'q-immortal'];
var QUALITY_BG = ['bg-common', 'bg-rare', 'bg-legendary', 'bg-miracle', 'bg-mythic', 'bg-immortal'];

// 品质最大词条数
var QUALITY_MAX_AFFIX = [1, 2, 4, 6, 8, 10];
// 品质孔数
var QUALITY_SOCKETS = [0,1,2,3,4,5];

// v2.6.4 Round 4.4 仓库容量: 基础 100 格 + 天赋扩容每级 +50
//   取代 v2.6.3 旧的 "30 × pages" 模型 (100 起步, 扩容从 100 起算)
//   GameState.get("warehouseExpandLevels") 是天赋扩容购买总次数 (从 0 开始)
var BASE_WAREHOUSE_CAPACITY = 100;
var WAREHOUSE_EXPAND_PER_LEVEL = 50;

// 实际仓库容量: 100 + 扩容次数 × 50
function getWarehouseCapacity() {
    if (typeof gameState === 'undefined' || !gameState) return BASE_WAREHOUSE_CAPACITY;
    var levels = GameState.get("warehouseExpandLevels") || 0;
    return BASE_WAREHOUSE_CAPACITY + levels * WAREHOUSE_EXPAND_PER_LEVEL;
}

// ★ v2.6.4 Round 12: 离线奖励系统
// 基础: 6h 最大离线, 60% 效率
// 天赋: t_off_eff1-3 (3 节点, +25%/+25%/+50%), t_off_time1-4 (4 节点, +2h/级)
var BASE_OFFLINE_HOURS = 6;
var BASE_OFFLINE_EFFICIENCY_PCT = 60;  // 60% 基础效率 (玩家挂 1h 拿 0.6h 等效在线)
var OFFLINE_PER_HOUR_GOLD = 60;        // 60 金/分钟基础 (Lv1)
var OFFLINE_PER_HOUR_EXP = 120;        // 120 经验/分钟基础 (Lv1)

// 最大离线时长 (小时) = 6 + 离线时长天赋累计
function getMaxOfflineHours() {
    if (typeof gameState === 'undefined' || !gameState) return BASE_OFFLINE_HOURS;
    return BASE_OFFLINE_HOURS + (GameState.get("offlineTimeHours") || 0);
}

// 离线效率 (%) = 60 + 离线效率天赋累计 (上限 200%)
function getOfflineEfficiencyPct() {
    if (typeof gameState === 'undefined' || !gameState) return BASE_OFFLINE_EFFICIENCY_PCT;
    return Math.min(200, BASE_OFFLINE_EFFICIENCY_PCT + (GameState.get("offlineEfficiencyPct") || 0));
}

// 计算离线收益明细 (返回 {gold, exp, dust, reforgeStones, gems}, 不实际发放)
//   - gold/exp: 按 stage 缩放, 60% 基础 × 天赋加成
//   - dust: 离线 1h 产 5 粉尘 (玩家也会刷)
//   - reforgeStones: 离线 4h 产 1 重铸石 (慢产出, 惊喜)
//   - gems: 离线 8h 产 1 随机低级宝石 (惊喜, 不破坏平衡)
function calcOfflineRewardDetail() {
    if (typeof gameState === 'undefined' || !gameState) return null;
    var lastSave = GameState.get("lastSaveTime") || Date.now();
    var elapsedMs = Date.now() - lastSave;
    var elapsedMinutes = Math.floor(elapsedMs / 60000);
    if (elapsedMinutes < 1) return null;
    var maxMinutes = getMaxOfflineHours() * 60;
    var actualMinutes = Math.min(elapsedMinutes, maxMinutes);
    var capped = elapsedMinutes > maxMinutes;
    var effPct = getOfflineEfficiencyPct();
    var stage = GameState.get("stage") || 1;
    // 应用转生金币和经验加成
    var rebirthBonuses = (typeof getRebirthBonuses === 'function') ? getRebirthBonuses() : { goldFind: 0, expGain: 0 };
    var goldMult = 1 + (rebirthBonuses.goldFind || 0) / 100;
    var expMult = 1 + (rebirthBonuses.expGain || 0) / 100;
    // 金币: stage 缩放 (LV1: 60金/分钟, LV10: 80金/分钟, LV50: 170金/分钟)
    var goldPerMin = OFFLINE_PER_HOUR_GOLD + (stage - 1) * 2.2;
    var totalGold = Math.floor(goldPerMin * actualMinutes * (effPct / 100) * goldMult);
    // 经验: 120 exp/分钟基础
    var expPerMin = OFFLINE_PER_HOUR_EXP + (stage - 1) * 4;
    var totalExp = Math.floor(expPerMin * actualMinutes * (effPct / 100) * expMult);
    // 粉尘: 5/h × 效率
    var totalDust = Math.floor(5 * (actualMinutes / 60) * (effPct / 100));
    // 重铸石: 1/4h 概率产出 (45%) — 给惊喜
    var reforgeStones = 0;
    var stoneWindows = Math.floor(actualMinutes / 240);  // 4h 一个窗口
    for (var i = 0; i < stoneWindows; i++) {
        if (Math.random() < 0.45) reforgeStones++;
    }
    // 宝石: 1/8h 概率产出 (35%) — 惊喜 (不出高级宝石, 只出 1-3 级随机)
    var gems = 0;
    var gemWindows = Math.floor(actualMinutes / 480);  // 8h 一个窗口
    for (var j = 0; j < gemWindows; j++) {
        if (Math.random() < 0.35) gems++;
    }
    return {
        elapsedMinutes: elapsedMinutes,
        actualMinutes: actualMinutes,
        capped: capped,
        maxHours: getMaxOfflineHours(),
        efficiencyPct: effPct,
        gold: totalGold,
        exp: totalExp,
        forgeDust: totalDust,
        reforgeStones: reforgeStones,
        gems: gems
    };
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Fallback for Quality.getName/getClass/getBg (保留兼容入口: Quality 未加载时仍可用)
function getQualityName(q) { return (typeof Quality !== 'undefined' && Quality.getName) ? Quality.getName(q) : (QUALITY_NAMES[q] || '未知'); }
// Fallback for Quality.getClass
function getQualityClass(q) { return (typeof Quality !== 'undefined' && Quality.getClass) ? Quality.getClass(q) : (QUALITY_CLASSES[q] || ''); }
// Fallback for Quality.getBg
function getQualityBg(q) { return (typeof Quality !== 'undefined' && Quality.getBg) ? Quality.getBg(q) : (QUALITY_BG[q] || ''); }

// 属性ID转中文名
function getStatName(statId) {
    var names = {
        atk: '攻击',
        hp: '生命',
        def: '防御',
        spd: '速度',
        crit: '暴击率',
        critDmg: '暴击伤害',
        healBonus: '治疗加成',
        effectHit: '效果命中',
        effectRes: '效果抵抗',
        expBonus: '经验加成',
        lootBonus: '掉落加成',
        elemMastery: '元素精通',
        physMastery: '物理精通',
        // v4.2 新增: 复合宝石的额外属性映射 (避免详情面板显示英文 statId)
        dmgBonus: '伤害加成',
        dmgReduction: '伤害减免',
        healRate: '治疗率'
    };
    return names[statId] || statId;
}

// Fallback for Quality.getColor (保留兼容入口)
function getQualityColor(q) {
    if (typeof Quality !== 'undefined' && Quality.getColor) return Quality.getColor(q);
    var colors = ['#9e9e9e', '#4fc3f7', '#ff9800', '#e040fb', '#ff5722', '#ffd700'];
    return colors[q] || '#fff';
}

// 显示确认弹窗（标题, HTML内容, 确认回调）
function showConfirm(title, contentHtml, onConfirm) {
    // ★ v2.6.3 防重复打开: 已有 confirm 弹窗在显示就跳过
    if (document.getElementById('confirm-modal-active')) return;
    var html = '<div class="modal-overlay" id="confirm-modal-active"><div class="modal-content" onclick="event.stopPropagation()" style="position:relative;"><h3>' + title + '</h3>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span>';
    html += '<div style="font-size:13px;line-height:1.6;margin:10px 0;">' + contentHtml + '</div>';
    html += '<div style="display:flex;gap:8px;margin-top:12px;">' +
        '<button class="btn btn-gold" style="flex:1;" id="confirm-btn-yes">确认</button>' +
        '<button class="btn" style="flex:1;" id="confirm-btn-cancel">取消</button></div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    var overlay = div.firstElementChild;
    document.body.appendChild(overlay);

    // 点击遮罩层关闭
    overlay.addEventListener('click', function(e) {
        if (e.target === e.currentTarget) overlay.remove();
    });
    document.getElementById('confirm-btn-cancel').addEventListener('click', function() {
        overlay.remove();
    });
    document.getElementById('confirm-btn-yes').addEventListener('click', function() {
        overlay.remove();
        if (onConfirm) onConfirm();
    });
}

// 关闭所有弹窗
function closeAllModals() {
    var modals = document.querySelectorAll('.modal-overlay');
    for (var i = 0; i < modals.length; i++) {
        modals[i].remove();
    }
}

// 全局 closeModal 兜底（settingsUI.js 提供无条件覆盖，此处不再重复条件守卫）
window.closeModal = function() {
    var ms = document.querySelectorAll('.modal-overlay');
    for (var i = 0; i < ms.length; i++) ms[i].remove();
};
