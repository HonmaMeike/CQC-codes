// ========== 宠物蛋抽奖大厅 v5.2 ==========
// 抽奖产出：品阶蛋（放孵化槽）+ 金币/粉尘（稀释奖池）
// 参考 lotteryUI.js 风格

var PET_LOTTERY_CONFIG = {
    normal: {
        name: '普通抽蛋',
        costPerDraw: 1,
        costPerTenDraw: 10,
        // 奖池：品阶蛋 + 幸运蛋 + 金币 + 粉尘
        pool: [
            // 品阶蛋（占主要）
            { type: 'egg', tier: 'normal', weight: 33, name: '普通蛋', hatchMin: 5 },
            { type: 'egg', tier: 'rare',   weight: 20, name: '稀有蛋', hatchMin: 15 },
            { type: 'egg', tier: 'epic',   weight: 3,  name: '史诗蛋', hatchMin: 30 },
            { type: 'egg', tier: 'lucky',  weight: 2,  name: '幸运蛋', hatchMin: 120, isLucky: true },
            // 稀释奖励（金币/粉尘 ×10）
            { type: 'gold', amount: 500,  weight: 22, name: '500金币' },
            { type: 'dust', amount: 50,   weight: 20, name: '50锻造粉尘' }
        ]
    },
    advanced: {
        name: '高级抽蛋',
        costPerDraw: 5,
        costPerTenDraw: 50,
        pityTier: 'legend',
        pityTierName: '传说',
        pool: [
            { type: 'egg', tier: 'epic',   weight: 15, name: '史诗蛋',   hatchMin: 30 },
            { type: 'egg', tier: 'legend', weight: 8,  name: '传说蛋',   hatchMin: 60 },
            { type: 'egg', tier: 'mythic', weight: 1,  name: '神化蛋',   hatchMin: 120 },
            { type: 'gold', amount: 2000, weight: 36, name: '2000金币' },
            { type: 'dust', amount: 200,  weight: 40, name: '200锻造粉尘' }
        ]
    }
};

var PET_LOTTERY_HISTORY_MAX = 50;

function openPetLotteryScreen() {
    var stones = (gameState && gameState.petEggStones) || 0;
    var history = (gameState && gameState.petLotteryHistory) || [];
    var html = '<div class="modal-overlay" id="pet-lottery-modal" onclick="if(event.target===this)closePetLottery()">' +
        '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:440px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ff9800;border-radius:14px;padding:0;overflow:hidden;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#e65100,#bf360c);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-size:16px;font-weight:bold;color:#fff;">🎰 宠物蛋抽奖</div>' +
        '<div style="font-size:11px;color:#ffd700;background:rgba(0,0,0,0.3);padding:3px 10px;border-radius:10px;">🥚石 ' + stones + '</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closePetLottery()">✕</span>' +
        '</div>' +
        '<div style="padding:14px;">' +
        renderPetLotteryTier('normal') +
        renderPetLotteryTier('advanced') +
        renderPetLotteryRates() +
        renderPetLotteryHistory() +
        '</div>' +
        '<div style="padding:8px 14px 12px;text-align:center;"><button class="btn" style="width:100%;border-color:#888;color:#888;" onclick="closePetLottery()">关闭</button></div>' +
        '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

function closePetLottery() {
    var m = document.getElementById('pet-lottery-modal');
    if (m) m.remove();
}

function renderPetLotteryTier(tierType) {
    var cfg = PET_LOTTERY_CONFIG[tierType];
    if (!cfg) return '';
    var stones = (gameState && gameState.petEggStones) || 0;
    var canSingle = stones >= cfg.costPerDraw;
    var canTen = stones >= cfg.costPerTenDraw;
    var accent = tierType === 'normal' ? '#4caf50' : '#ff9800';
    var bgColor = tierType === 'normal' ? 'rgba(76,175,80,0.05)' : 'rgba(255,152,0,0.05)';

    return '<div style="background:' + bgColor + ';border:1px solid ' + accent + '44;border-radius:10px;padding:12px;margin-bottom:10px;">' +
        '<div style="font-size:14px;font-weight:bold;color:' + accent + ';margin-bottom:4px;">' + cfg.name + '</div>' +
        '<div style="font-size:11px;color:#aaa;margin-bottom:6px;">单抽 <span style="color:' + accent + ';font-weight:bold;">' + cfg.costPerDraw + ' 🥚石</span> · 十连 <span style="color:' + accent + ';font-weight:bold;">' + cfg.costPerTenDraw + ' 🥚石</span></div>' +
        '<div style="font-size:10px;color:#888;margin-bottom:8px;">' + (tierType === 'advanced' ? '十连保底≥1传说蛋' : '') + '</div>' +
        '<div style="display:flex;gap:6px;">' +
        '<button class="btn" style="flex:1;padding:6px;font-size:12px;border-color:' + accent + ';color:' + accent + ';' + (canSingle ? '' : 'opacity:0.4;') + '" ' + (canSingle ? 'onclick="doPetLottery(\'' + tierType + '\',false)"' : 'disabled') + '>单抽</button>' +
        '<button class="btn btn-gold" style="flex:1;padding:6px;font-size:12px;' + (canTen ? '' : 'opacity:0.4;') + '" ' + (canTen ? 'onclick="doPetLottery(\'' + tierType + '\',true)"' : 'disabled') + '>十连抽</button>' +
        '</div></div>';
}

function renderPetLotteryRates() {
    var html = '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;margin-bottom:10px;">' +
        '<div style="font-size:12px;font-weight:bold;color:#888;margin-bottom:6px;">📊 奖池预览</div>';

    var tiers = ['normal', 'advanced'];
    for (var i = 0; i < tiers.length; i++) {
        var cfg = PET_LOTTERY_CONFIG[tiers[i]];
        var totalWeight = 0;
        for (var w = 0; w < cfg.pool.length; w++) totalWeight += cfg.pool[w].weight;
        html += '<div style="margin-bottom:4px;"><span style="font-size:11px;color:' + (tiers[i] === 'normal' ? '#4caf50' : '#ff9800') + ';font-weight:bold;">' + cfg.name + ':</span> ';
        for (var j = 0; j < cfg.pool.length; j++) {
            var p = cfg.pool[j];
            var pct = Math.round(p.weight / totalWeight * 100);
            var color = p.type === 'egg' ? getPetTier(p.tier).color : '#888';
            html += '<span style="font-size:10px;color:' + color + ';margin-right:4px;">' + p.name + ' ' + pct + '%</span>';
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderPetLotteryHistory() {
    var history = (gameState && gameState.petLotteryHistory) || [];
    if (history.length === 0) {
        return '<div style="font-size:11px;color:#555;text-align:center;padding:8px;">暂无抽奖记录</div>';
    }
    var html = '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px;">' +
        '<div style="font-size:11px;color:#888;margin-bottom:4px;">📜 最近 ' + history.length + ' 条记录</div>';
    var max = Math.min(10, history.length);
    for (var i = 0; i < max; i++) {
        var h = history[i];
        if (!h) continue;
        html += '<div style="display:flex;align-items:center;gap:6px;padding:3px 4px;font-size:10px;border-bottom:1px solid rgba(255,255,255,0.03);">';
        if (h.type === 'egg') {
            var tc = getPetTier(h.tier).color;
            html += '<span style="color:' + tc + ';">🥚 ' + h.name + '</span>';
            html += '<span style="margin-left:auto;color:#888;">' + getPetTier(h.tier).name + '</span>';
        } else {
            html += '<span style="color:#888;">' + h.name + '</span>';
            html += '<span style="margin-left:auto;color:#888;">直接获得</span>';
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function doPetLottery(tierType, isTenDraw) {
    if (!gameState) return;
    var cfg = PET_LOTTERY_CONFIG[tierType];
    if (!cfg) { showToast('未知抽奖类型', 'error'); return; }

    var cost = isTenDraw ? cfg.costPerTenDraw : cfg.costPerDraw;
    if ((gameState.petEggStones || 0) < cost) {
        showToast('宠物蛋石不足！需要 ' + cost + '，当前 ' + (gameState.petEggStones || 0), 'warning');
        return;
    }

    gameState.petEggStones -= cost;
    if (!gameState.petLotteryHistory) gameState.petLotteryHistory = [];

    var draws = isTenDraw ? 10 : 1;
    var results = [];
    var totalGold = 0, totalDust = 0, eggs = [];
    var pityApplied = false;

    // 计算总权重
    var totalWeight = 0;
    for (var pi = 0; pi < cfg.pool.length; pi++) totalWeight += cfg.pool[pi].weight;

    for (var d = 0; d < draws; d++) {
        // 十连保底：最后一次如果有保底规则
        var isLast = (isTenDraw && d === draws - 1);
        
        // 从奖池抽取
        var roll = Math.random() * totalWeight;
        var cum = 0;
        var selected = null;
        for (var si = 0; si < cfg.pool.length; si++) {
            cum += cfg.pool[si].weight;
            if (roll < cum) { selected = cfg.pool[si]; break; }
        }
        if (!selected) selected = cfg.pool[cfg.pool.length - 1];

        // 十连保底：最后一张如果没有抽到保底品阶的蛋，强制替换
        if (isLast && cfg.pityTier) {
            var hasPity = false;
            for (var ri = 0; ri < results.length; ri++) {
                if (results[ri].type === 'egg' && getTierOrder(results[ri].tier) >= getTierOrder(cfg.pityTier)) {
                    hasPity = true; break;
                }
            }
            if (!hasPity && (selected.type !== 'egg' || getTierOrder(selected.tier) < getTierOrder(cfg.pityTier))) {
                // 找第一个符合条件的蛋
                for (var fi = 0; fi < cfg.pool.length; fi++) {
                    if (cfg.pool[fi].type === 'egg' && getTierOrder(cfg.pool[fi].tier) >= getTierOrder(cfg.pityTier)) {
                        selected = cfg.pool[fi];
                        pityApplied = true;
                        break;
                    }
                }
            }
        }

        if (selected.type === 'egg') {
            // 存入蛋仓库 (petEggStorage)，不再直接放入孵化槽
            if (!gameState.petEggStorage) gameState.petEggStorage = [];
            var found = false;
            for (var esi = 0; esi < gameState.petEggStorage.length; esi++) {
                if (gameState.petEggStorage[esi].tier === selected.tier) {
                    gameState.petEggStorage[esi].count = (gameState.petEggStorage[esi].count || 0) + 1;
                    found = true;
                    break;
                }
            }
            if (!found) {
                gameState.petEggStorage.push({ tier: selected.tier, count: 1 });
            }
            results.push({ type: 'egg', tier: selected.tier, name: selected.name });
            eggs.push(selected);
        } else if (selected.type === 'gold') {
            gameState.gold = (gameState.gold || 0) + selected.amount;
            totalGold += selected.amount;
            results.push({ type: 'gold', amount: selected.amount, name: selected.name });
        } else if (selected.type === 'dust') {
            gameState.forgeDust = (gameState.forgeDust || 0) + selected.amount;
            totalDust += selected.amount;
            results.push({ type: 'dust', amount: selected.amount, name: selected.name });
        }

        // 记录历史
        gameState.petLotteryHistory.unshift({
            type: selected.type,
            name: selected.name,
            tier: selected.tier || null,
            timestamp: Date.now()
        });
        if (gameState.petLotteryHistory.length > PET_LOTTERY_HISTORY_MAX) {
            gameState.petLotteryHistory.pop();
        }
    }

    // ★ v6.0 显示抽奖动画
    if (typeof updateResources === 'function') updateResources();
    if (typeof showPetScreen === 'function') showPetScreen();
    if (typeof showPetLotteryAnimation === 'function') {
        showPetLotteryAnimation(tierType, isTenDraw, results);
    }

    // ★ v6.0 同步 GameState
    GameState.set('petEggStones', gameState.petEggStones);
    GameState.set('gold', gameState.gold);
    GameState.set('forgeDust', gameState.forgeDust);
    GameState.set('petLotteryHistory', gameState.petLotteryHistory);
    GameState.set('petEggStorage', gameState.petEggStorage);
    
    // 刷新抽奖面板
    closePetLottery();
}

function getTierOrder(tierId) {
    var order = { normal: 0, rare: 1, epic: 2, legend: 3, mythic: 4 };
    return order[tierId] || 0;
}



// ★ 抽奖动画弹窗
function showPetLotteryAnimation(tierType, isTenDraw, results) {
    if (!document.getElementById('pet-anim-style')) {
        var s = document.createElement('style');
        s.id = 'pet-anim-style';
        s.textContent = '@keyframes aSpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(720deg)}}@keyframes aReveal{0%{opacity:0;transform:scale(0.3)}60%{transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}@keyframes aGlow{0%,100%{box-shadow:0 0 5px rgba(255,215,0,0.3)}50%{box-shadow:0 0 25px rgba(255,215,0,0.9)}}';
        document.head.appendChild(s);
    }
    
    var h = '<div class="modal-overlay" id="pet-anim-overlay" style="background:rgba(0,0,0,0.88);z-index:99999;" onclick="if(event.target===this)closePetAnim()">' +
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:20px;">' +
        '<div id="a-spinner" style="width:100px;height:100px;border-radius:50%;border:4px solid #ffd700;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:44px;background:radial-gradient(circle,#1a1a2e,#0f0f1e);animation:aSpin 0.6s ease-in-out 3;">\ud83c\udfb0</div>' +
        '<div style="font-size:15px;color:#ffd700;font-weight:bold;margin-bottom:14px;animation:aGlow 1s ease-in-out infinite;" id="a-status">\u62bd\u5956\u4e2d...</div>' +
        '<div id="a-results" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:340px;"></div>' +
        '<button class="btn btn-gold" id="a-close-btn" style="margin-top:16px;display:none;padding:8px 24px;font-size:14px;" onclick="closePetAnim()">\u786e\u5b9a</button>' +
        '</div></div>';
    
    var d = document.createElement('div');
    d.innerHTML = h;
    document.body.appendChild(d.firstElementChild);
    
    setTimeout(function() {
        var ci = 0;
        function showNext() {
            if (ci >= results.length) {
                var st = document.getElementById('a-status');
                if (st) { st.textContent = '\u2705 \u62bd\u5956\u5b8c\u6210\uff01'; st.style.color = '#4caf50'; st.style.animation = 'none'; }
                var cb = document.getElementById('a-close-btn');
                if (cb) cb.style.display = 'inline-block';
                return;
            }
            var r = results[ci];
            var st2 = document.getElementById('a-status');
            if (st2) st2.textContent = '\u7b2c ' + (ci+1) + '/' + results.length + ' \u4e2a...';
            
            var clr = { normal:'#9e9e9e', rare:'#2196f3', epic:'#9c27b0', legend:'#ff9800', mythic:'#f44336' };
            var tnm = { normal:'\u666e\u901a', rare:'\u7a00\u6709', epic:'\u53f2\u8bd7', legend:'\u4f20\u8bf4', mythic:'\u795e\u5316' };
            var card = '';
            if (r.type === 'egg') {
                var c = clr[r.tier] || '#ffd700';
                card = '<div style="width:76px;padding:8px 2px;background:rgba(0,0,0,0.5);border:2px solid ' + c + ';border-radius:10px;text-align:center;animation:aReveal 0.4s ease-out;"><div style="font-size:28px;">\ud83e\udd5a</div><div style="font-size:8px;color:' + c + ';font-weight:bold;margin-top:2px;">' + r.name + '</div><div style="font-size:7px;color:' + c + ';">' + (tnm[r.tier] || '') + '</div></div>';
            } else if (r.type === 'gold') {
                card = '<div style="width:76px;padding:8px 2px;background:rgba(0,0,0,0.5);border:2px solid #ffd700;border-radius:10px;text-align:center;animation:aReveal 0.4s ease-out;"><div style="font-size:28px;">\ud83d\udcb0</div><div style="font-size:10px;color:#ffd700;font-weight:bold;">+' + r.amount + '</div><div style="font-size:7px;color:#888;">\u91d1\u5e01</div></div>';
            } else {
                card = '<div style="width:76px;padding:8px 2px;background:rgba(0,0,0,0.5);border:2px solid #ce93d8;border-radius:10px;text-align:center;animation:aReveal 0.4s ease-out;"><div style="font-size:28px;">\ud83d\udca0</div><div style="font-size:10px;color:#ce93d8;font-weight:bold;">+' + r.amount + '</div><div style="font-size:7px;color:#888;">\u7c89\u5c18</div></div>';
            }
            var rd = document.getElementById('a-results');
            if (rd) {
                var tmp = document.createElement('div');
                tmp.innerHTML = card;
                rd.appendChild(tmp.firstElementChild);
            }
            ci++;
            setTimeout(showNext, isTenDraw ? 180 : 350);
        }
        setTimeout(showNext, 600);
    }, 800);
}

function closePetAnim() {
    var m = document.getElementById('pet-anim-overlay');
    if (m) m.remove();
    if (typeof showPetScreen === 'function') showPetScreen();
    if (typeof updateResources === 'function') updateResources();
}

function getShardAmount(tierId) {
    var amounts = { normal: 5, rare: 10, epic: 25, legend: 50, mythic: 100 };
    return amounts[tierId] || 5;
}
