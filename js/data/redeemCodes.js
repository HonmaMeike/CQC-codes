// ========== 兑换码系统 v6.3 点击领取版 ==========
// 每行一个兑换码卡片 + 领取按钮
// 已领取/已过期自动进入历史记录

/* global GameState */

var REDEEM_CODES = [
    { code: 'CQC666',     name: '新手礼包',     desc: '金币+3000 钻石+10',    reward: { gold: 3000, gem: 10 },         maxUse: 1 },
    { code: 'CQC888',     name: '豪华礼包',     desc: '金币+8888 重铸石+5',   reward: { gold: 8888, reforgestone: 5 }, maxUse: 1 },
    { code: 'SPEEDUP',    name: '加速福利',     desc: '体力+120',            reward: { stamina: 120 },               maxUse: 3 },
    { code: 'LOTTERY5',   name: '抽奖石礼包',   desc: '抽奖石+5',            reward: { lotteryStone: 5 },             maxUse: 1 },
    { code: 'HERB10',     name: '材料礼包',     desc: '草药+10 矿石+10',      reward: { herb: 10, ore: 10 },           maxUse: 1 },
    { code: 'DUST200',    name: '锻造粉尘包',   desc: '锻造粉尘+200',         reward: { forgeDust: 200 },              maxUse: 1 },
    { code: 'REBIRTH1',   name: '轮回福利',     desc: '轮回点+1',            reward: { rebirth: 1 },                  maxUse: 1 },
    { code: 'THANKS',     name: '感谢支持',     desc: '钻石+50 重铸石+5',     reward: { gem: 50, reforgestone: 5 },    maxUse: 1 },
    { code: 'PETFOOD20',  name: '宠物食粮',     desc: '宠物食物+20',          reward: { petFood: 20 },                 maxUse: 3 },
    { code: 'EGGSTONE5',  name: '蛋石礼包',     desc: '宠物蛋石+5',           reward: { petEggStones: 5 },             maxUse: 1 },
];

// ★ v3.5.1 获取全部兑换码（内置 + 自定义 + 外部 + 远程）
function getAllRedeemCodes() {
    var builtIn = REDEEM_CODES || [];
    var custom = (GameState.get('_customCodes')) ? GameState.get('_customCodes') : [];
    var external = (typeof EXTERNAL_REDEEM_CODES !== 'undefined') ? EXTERNAL_REDEEM_CODES : [];
    var remote = (typeof REMOTE_REDEEM_CODES !== 'undefined') ? REMOTE_REDEEM_CODES : [];
    return builtIn.concat(custom).concat(external).concat(remote);
}

// ★ v3.5.1 从远程URL加载兑换码（普通+隐藏分开）
function refreshRemoteCodes() {
    var url = window._RedeemRemoteURL;
    if (!url) return;
    fetch(url, { cache: 'no-cache' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (Array.isArray(data)) {
                REMOTE_REDEEM_CODES = data;
            }
        })
        .catch(function() { /* 静默失败 */ });
    // 也尝试拉取隐藏码
    var hiddenUrl = window._RedeemHiddenURL;
    if (hiddenUrl) {
        fetch(hiddenUrl, { cache: 'no-cache' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (Array.isArray(data)) {
                    // 隐藏码追加到REMOTE，标记hidden=true
                    for (var hi = 0; hi < data.length; hi++) {
                        if (data[hi]) data[hi].hidden = true;
                    }
                    REMOTE_REDEEM_CODES = (REMOTE_REDEEM_CODES || []).concat(data);
                }
            })
            .catch(function() {});
    }
}

// 手动刷新（带UI反馈）
function manualRefreshCodes() {
    var btn = document.getElementById('redeem-refresh-btn');
    var url = window._RedeemRemoteURL;
    if (!url) { showToast('⚠ 未配置远程兑换码地址', 'warning'); return; }
    if (btn) btn.textContent = '⏳ 刷新中...';
    showToast('🔄 正在获取最新兑换码...', 'info');
    fetch(url, { cache: 'no-cache' })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(data) {
            if (Array.isArray(data) && data.length > 0) {
                REMOTE_REDEEM_CODES = data;
                if (btn) btn.textContent = '🔄 刷新';
                showToast('✅ 获取到 ' + data.length + ' 个可用兑换码', 'success');
                // 重刷界面
                openRedeemUI();
            } else {
                if (btn) btn.textContent = '🔄 刷新';
                showToast('⚠ 远程返回空列表', 'warning');
            }
        })
        .catch(function(e) {
            if (btn) btn.textContent = '🔄 刷新';
            showToast('❌ 获取失败: ' + (e.message || '网络错误'), 'error');
        });
}

if (typeof window !== 'undefined') {
    window._RedeemRemoteURL = 'https://raw.githubusercontent.com/HonmaMeike/CQC-codes/main/codes.json';
    window._RedeemHiddenURL = 'https://raw.githubusercontent.com/HonmaMeike/CQC-codes/main/hidden-codes.json';
    setTimeout(refreshRemoteCodes, 1000);
    setInterval(refreshRemoteCodes, 600000);
}

// 检查兑换码状态
function getCodeStatus(rc) {
    var redeemed = GameState.get('_redeemedCodes') || {};
    var usedCount = redeemed[rc.code] || 0;
    if (rc.expiry && Date.now() > rc.expiry) return 'expired';
    if (rc.maxUse > 0 && usedCount >= rc.maxUse) return 'claimed';
    return 'available';
}

// 获取已用次数
function getCodeUsedCount(rc) {
    var redeemed = GameState.get('_redeemedCodes') || {};
    return redeemed[rc.code] || 0;
}

// 领取兑换码奖励（直接领取，无需输入）
function claimRedeemCode(codeObj) {
    if (!codeObj) return false;
    var status = getCodeStatus(codeObj);
    if (status !== 'available') {
        if (typeof showToast === 'function') showToast(status === 'claimed' ? '已领取过该兑换码' : '该兑换码已过期', 'warning');
        return false;
    }
    
    var reward = codeObj.reward;
    if (reward.gold) GameState.mutate('gold', function(g) { return (g || 0) + reward.gold; });
    if (reward.stamina) {
        GameState.mutate('stamina', function(s) { return Math.min(240, (s || 0) + reward.stamina); });
        GameState.mutate('lastStaminaTime', function() { return Date.now(); });
    }
    if (reward.lotteryStone) GameState.mutate('lotteryStone', function(v) { return (v || 0) + reward.lotteryStone; });
    if (reward.reforgestone) GameState.mutate('reforgestone', function(v) { return (v || 0) + reward.reforgestone; });
    if (reward.forgeDust) GameState.mutate('forgeDust', function(v) { return (v || 0) + reward.forgeDust; });
    if (reward.herb && GameState.get('materials')) GameState.mutate('materials', function(m) { m.herb = (m.herb || 0) + reward.herb; return m; });
    if (reward.ore && GameState.get('materials')) GameState.mutate('materials', function(m) { m.ore = (m.ore || 0) + reward.ore; return m; });
    if (reward.rebirth) GameState.mutate('rebirthPoints', function(v) { return (v || 0) + reward.rebirth; });
    // if (reward.gem) GameState.mutate('magicCore', ...) — 魔核仅充值获取
    if (reward.petFood) GameState.mutate('petFood', function(v) { return (v || 0) + reward.petFood; });
    if (reward.petEggStones) GameState.mutate('petEggStones', function(v) { return (v || 0) + reward.petEggStones; });
    // ★ 装备发放（使用 createEquipInstance 生成标准装备）
    if (reward.equip && Array.isArray(reward.equip)) {
        for (var ei = 0; ei < reward.equip.length; ei++) {
            var eqCfg = reward.equip[ei];
            if (!eqCfg.slot) continue;
            // 使用标准装备生成函数
            var newEquip = (typeof createEquipInstance === 'function') 
                ? createEquipInstance(eqCfg.slot, eqCfg.quality || 3, eqCfg.level || 1) 
                : null;
            if (newEquip) {
                // 自定义装备名（覆盖随机名）
                if (eqCfg.name) newEquip.name = eqCfg.name;
                // ★ 自定义词条覆盖原始词条（不清空则追加）
                if (eqCfg.affixes && Array.isArray(eqCfg.affixes)) {
                    newEquip.affixes = [];  // 清空原始随机词条
                    for (var ai = 0; ai < eqCfg.affixes.length; ai++) {
                        var aCfg = eqCfg.affixes[ai];
                        if (!aCfg.id || !aCfg.value) continue;
                        // 从游戏词条池查找中文名（id→name）
                        var affixName = aCfg.name || aCfg.id;
                        if (typeof getAffixPool === 'function') {
                            var pool = getAffixPool();
                            for (var pi = 0; pi < pool.length; pi++) {
                                if (pool[pi].id === aCfg.id) { affixName = pool[pi].name; break; }
                            }
                        }
                        newEquip.affixes.push({
                            id: aCfg.id,
                            name: affixName,
                            value: aCfg.value,
                            stat: aCfg.stat || aCfg.id,
                            type: aCfg.type || 'flat',
                            affixQuality: aCfg.affixQuality || eqCfg.quality || 3
                        });
                    }
                }
                // 自定义基础属性（覆盖随机值）
                if (eqCfg.baseStats && Array.isArray(eqCfg.baseStats)) {
                    newEquip.baseStats = [];
                    for (var bi = 0; bi < eqCfg.baseStats.length; bi++) {
                        var bCfg = eqCfg.baseStats[bi];
                        if (bCfg.stat && bCfg.value > 0) {
                            newEquip.baseStats.push({ stat: bCfg.stat, value: bCfg.value });
                        }
                    }
                }
                // 重算评分
                if (typeof calcEquipScore === 'function') {
                    newEquip.score = calcEquipScore(newEquip);
                }
                GameState.mutate('inventory', function(inv) {
                    if (!Array.isArray(inv)) inv = [];
                    inv.push(newEquip);
                    return inv;
                });
            }
        }
    }
    
    // 记录使用
    GameState.mutate('_redeemedCodes', function(r) { r = r || {}; r[codeObj.code] = (r[codeObj.code] || 0) + 1; return r; });
    
    if (typeof showToast === 'function') showToast('🎁 ' + codeObj.name + ' 已领取！', 'success');
    if (typeof updateResources === 'function') updateResources();
    
    // 刷新界面
    // 先关闭旧弹窗再打开，防止堆叠
    var oldRedeem = document.querySelectorAll('.modal-overlay');
    for (var ori = 0; ori < oldRedeem.length; ori++) oldRedeem[ori].remove();
    setTimeout(function() { openRedeemUI(); }, 200);
    return true;
}

// 打开兑换码界面（点击领取版）
function openRedeemUI() {
    // 关闭旧弹窗防止堆叠
    var oldOverlays = document.querySelectorAll('.modal-overlay');
    for (var ooi = 0; ooi < oldOverlays.length; ooi++) oldOverlays[ooi].remove();
    if (typeof refreshRemoteCodes === 'function') refreshRemoteCodes();
    var all = getAllRedeemCodes();
    
    // 分类：可领取 / 已领取 / 已过期
    var available = [];
    var history = [];
    for (var i = 0; i < all.length; i++) {
        var status = getCodeStatus(all[i]);
        // 隐藏码：未领取时完全隐藏（必须输入兑换码领取）
        if (all[i].hidden && status === 'available') { continue; }
        if (status === 'available') {
            available.push(all[i]);
        } else {
            history.push({ code: all[i], status: status });
        }
    }
    
    var html = '<div class="modal-overlay" onclick="if(event.target===this)closeRedeemModal()">' +
        '<div class="modal-content" style="max-width:400px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ffd700;border-radius:14px;padding:0;overflow:hidden;max-height:85vh;overflow-y:auto;">' +
        '<div style="background:linear-gradient(135deg,#ffd700,#ff8f00);padding:12px 16px;text-align:center;position:relative;">' +
        '<div style="font-size:16px;font-weight:bold;color:#1a1a2e;">🎁 兑换福利</div>' +
        '<div style="font-size:10px;color:rgba(0,0,0,0.5);">点击即可领取奖励</div>' +
        '<span style="position:absolute;top:6px;right:34px;font-size:12px;color:rgba(0,0,0,0.4);cursor:pointer;padding:2px 8px;border-radius:10px;background:rgba(0,0,0,0.1);" onclick="manualRefreshCodes()" id="redeem-refresh-btn">🔄 刷新</span>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.7);cursor:pointer;" onclick="closeRedeemModal()">✕</span>' +
        '</div><div style="padding:12px;">';
    
    // 输入框 + 可领取区域
    html += '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
        '<input id="redeem-input" type="text" placeholder="输入兑换码..." style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,215,0,0.3);background:rgba(0,0,0,0.4);color:#fff;font-size:13px;outline:none;text-transform:uppercase;" maxlength="20">' +
        '<button class="btn" style="padding:8px 14px;background:linear-gradient(135deg,#ffd700,#ff8f00);color:#1a1a2e;font-weight:bold;border:none;border-radius:8px;cursor:pointer;" onclick="doRedeemFromInput()">兑换</button></div>' +
        '<div id="redeem-msg" style="font-size:10px;color:#888;text-align:center;min-height:16px;margin-bottom:6px;"></div>';
    html += '<div style="font-size:12px;font-weight:bold;color:#4caf50;margin-bottom:8px;">✅ 可领取 (' + available.length + ')</div>';
    
    if (available.length === 0) {
        html += '<div style="text-align:center;padding:20px;color:#555;">暂无可用兑换码</div>';
    } else {
        for (var ai = 0; ai < available.length; ai++) {
            var ac = available[ai];
            var used = getCodeUsedCount(ac);
            var remaining = ac.maxUse === 0 ? '∞' : Math.max(0, ac.maxUse - used);
            html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(76,175,80,0.06);border:1px solid rgba(76,175,80,0.15);border-radius:8px;margin-bottom:6px;">' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:13px;font-weight:bold;color:#ffd700;">🎁 ' + ac.name + '</div>' +
                    '<div style="font-size:10px;color:#aaa;">' + ac.desc + '</div>' +
                    '<div style="display:flex;gap:8px;margin-top:2px;">' +
                    (ac.maxUse > 1 ? '<span style="font-size:9px;color:#888;">剩余: ' + remaining + '次</span>' : '<span style="font-size:9px;color:#888;">限领1次</span>') +
                    (ac.expiry ? '<span style="font-size:9px;color:#ff9800;">到期: ' + new Date(ac.expiry).toLocaleDateString() + '</span>' : '<span style="font-size:9px;color:#4caf50;">永久有效</span>') +
                    '</div>' +
                '</div>' +
                '<button class="btn" style="padding:6px 14px;font-size:12px;font-weight:bold;background:linear-gradient(135deg,#4caf50,#2e7d32);color:#fff;border:none;border-radius:6px;cursor:pointer;flex-shrink:0;" onclick="claimRedeemCodeByCode(\'' + ac.code + '\')">领取</button>' +
            '</div>';
        }
    }
    
    // 历史记录区域
    if (history.length > 0) {
        html += '<div style="margin-top:12px;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;">' +
            '<div style="font-size:11px;font-weight:bold;color:#888;margin-bottom:6px;">📋 历史记录 (' + history.length + ')</div>';
        
        for (var hi = 0; hi < history.length; hi++) {
            var h = history[hi];
            var hc = h.code;
            var isExpired = h.status === 'expired';
            var tag = isExpired ? '已过期' : '已领取';
            var tagColor = isExpired ? '#f44336' : '#888';
            html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;margin-bottom:2px;border-radius:4px;background:rgba(255,255,255,0.02);">' +
                '<span style="font-size:10px;color:#888;">🎁 ' + hc.name + '</span>' +
                '<span style="font-size:9px;color:#666;">' + hc.desc + '</span>' +
                '<span style="margin-left:auto;font-size:9px;padding:1px 6px;border-radius:4px;background:' + tagColor + '22;color:' + tagColor + ';">' + tag + '</span>' +
            '</div>';
        }
        html += '</div>';
    }
    
    html += '</div></div></div>';
    
    var div = document.createElement('div');
    div.innerHTML = html;
    
    // 关闭旧弹窗
    var old = document.querySelector('.modal-overlay');
    if (old) old.remove();
    document.body.appendChild(div.firstElementChild);
}


// 通过兑换码字符串领取
function claimRedeemCodeByCode(codeStr) {
    var all = getAllRedeemCodes();
    var found = null;
    for (var i = 0; i < all.length; i++) {
        if (all[i].code === codeStr) { found = all[i]; break; }
    }
    if (found) claimRedeemCode(found);
}

function doRedeemFromInput() {
    var input = document.getElementById('redeem-input');
    var msgEl = document.getElementById('redeem-msg');
    if (!input) return;
    var code = input.value.trim();
    if (!code) { if (msgEl) { msgEl.textContent = '请输入兑换码'; msgEl.style.color = '#f44336'; } return; }
    var all = getAllRedeemCodes();
    var found = null;
    for (var i = 0; i < all.length; i++) { if (all[i].code === code.toUpperCase()) { found = all[i]; break; } }
    if (!found) { if (msgEl) { msgEl.textContent = '兑换码不存在或已过期'; msgEl.style.color = '#f44336'; } return; }
    if (claimRedeemCode(found)) {
        if (msgEl) { msgEl.textContent = '🎁 兑换成功！'; msgEl.style.color = '#4caf50'; }
        input.value = '';
    }
}

function closeRedeemModal() {
    var overlays = document.querySelectorAll('.modal-overlay');
    for (var i = 0; i < overlays.length; i++) overlays[i].remove();
}
