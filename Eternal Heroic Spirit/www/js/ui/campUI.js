// ========== 营地系统 UI ==========
// 包含：帐篷菜单、篝火烹饪、告示牌、训练木桩
/* global GameState */

// ==================== 1. 帐篷菜单 ====================
function openTentMenu(tentSide) {
    var title = tentSide === 'left' ? '🏕 红帐篷' : '🏕 蓝帐篷';
    var items = [];
    if (tentSide === 'left') {
        // 红帐篷：休息 + 保存
        items = [
            { icon: '🛌', label: '休息恢复体力', desc: '所有英雄体力回满', action: 'rest' },
            { icon: '💾', label: '快速保存', desc: '保存当前进度', action: 'save' },
        ];
    } else {
        // 蓝帐篷：编队 + 攻略
        items = [
            { icon: '👥', label: '编队管理', desc: '调整上阵队伍', action: 'team' },
            { icon: '📖', label: '章节攻略', desc: '查看当前章节推荐战力', action: 'guide' },
        ];
    }
    var html = '<div class="modal-overlay" onclick="if(event.target===this)closeModal()">' +
        '<div class="modal-content" style="max-width:380px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ffd700;border-radius:14px;padding:0;overflow:hidden;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#ffd700,#ff9800);padding:12px 16px;text-align:center;">' +
        '<div style="font-size:16px;font-weight:bold;color:#1a1a2e;">' + title + '</div>' +
        '<div style="font-size:10px;color:rgba(0,0,0,0.6);margin-top:2px;">点击选项进行操作</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeModal()">✕</span>' +
        '</div><div style="padding:14px;">';
    for (var i = 0; i < items.length; i++) {
        html += '<div class="camp-menu-item" onclick="execTentAction(\'' + items[i].action + '\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;cursor:pointer;">' +
            '<span style="font-size:22px;">' + items[i].icon + '</span>' +
            '<div style="flex:1;"><div style="font-size:13px;font-weight:bold;color:#ffd700;">' + items[i].label + '</div>' +
            '<div style="font-size:10px;color:#888;">' + items[i].desc + '</div></div>' +
            '<span style="color:#ffd700;font-size:16px;">→</span></div>';
    }
    html += '</div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

function execTentAction(action) {
    closeModal();
    switch (action) {
        case 'rest':
            // 回满体力
            GameState.set('stamina', 240);
            GameState.set('lastStaminaTime', Date.now());
            // 重置英雄 HP
            var heroes = GameState.get('heroes');
            if (heroes) {
                for (var i = 0; i < heroes.length; i++) {
                    heroes[i].hp = heroes[i].maxHp || 100;
                }
            }
            if (typeof showToast === 'function') showToast('🛌 全体休息完毕，体力已回满！', 'success');
            if (typeof updateResources === 'function') updateResources();
            if (typeof updateDungeonStaminaUI === 'function') updateDungeonStaminaUI();
            break;
        case 'save':
            if (typeof manualSave === 'function') manualSave();
            else if (typeof saveGame === 'function') saveGame(gameState);
            break;
        case 'team':
            if (typeof switchScreen === 'function') switchScreen('team');
            break;
        case 'guide':
            showChapterGuide();
            break;
    }
}

// 章节攻略弹窗
function showChapterGuide() {
    var stage = GameState.get('stage') || 1;
    var stageName = (typeof getStageName === 'function') ? getStageName(stage) : 'Ch.' + stage;
    var recPower = (typeof getRecommendedPower === 'function') ? getRecommendedPower(stage) : 0;
    var html = '<div class="modal-overlay" onclick="if(event.target===this)closeModal()">' +
        '<div class="modal-content" style="max-width:360px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #64b5f6;border-radius:14px;padding:0;overflow:hidden;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#1565c0,#0d47a1);padding:12px 16px;text-align:center;">' +
        '<div style="font-size:16px;font-weight:bold;color:#fff;">📖 ' + stageName + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px;">第 ' + stage + ' 章 攻略</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeModal()">✕</span>' +
        '</div><div style="padding:14px 16px;">' +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
        '<span style="color:#888;font-size:12px;">推荐战力</span>' +
        '<span style="color:#ffd700;font-weight:bold;font-size:13px;">' + (typeof formatNumber === 'function' ? formatNumber(recPower) : recPower) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
        '<span style="color:#888;font-size:12px;">当前队伍战力</span>' +
        '<span style="color:#4fc3f7;font-weight:bold;font-size:13px;" id="guide-team-power">计算中...</span></div>' +
        '<div style="padding:8px 0;font-size:11px;color:#aaa;line-height:1.6;">' +
        '💡 每章 20 关，第 5/15 关精英怪，第 10/20 关 BOSS。<br>' +
        '推荐战力仅供参考，实际需要根据装备和技能搭配调整。</div>' +
        '</div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
    // 异步更新队伍战力
    setTimeout(function() {
        var el = document.getElementById('guide-team-power');
        if (el && typeof calcHeroPower === 'function') {
            var heroes = GameState.get('heroes');
            if (heroes) {
                var total = 0;
                for (var i = 0; i < heroes.length; i++) {
                    total += calcHeroPower(heroes[i]);
                }
                el.textContent = typeof formatNumber === 'function' ? formatNumber(total) : total;
            }
        }
    }, 50);
}

// ==================== 2. 篝火烹饪 ====================
function openCookingUI() {
    var recipes = (typeof getAvailableRecipes === 'function') ? getAvailableRecipes() : [];
    var curBuff = GameState.get('activeCampBuff');
    var html = '<div class="modal-overlay" onclick="if(event.target===this)closeModal()">' +
        '<div class="modal-content" style="max-width:400px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ff6f00;border-radius:14px;padding:0;overflow:hidden;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#e65100,#bf360c);padding:12px 16px;text-align:center;">' +
        '<div style="font-size:16px;font-weight:bold;color:#fff;">🔥 篝火烹饪</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px;">消耗材料制作食物，战斗中临时提升属性</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeModal()">✕</span>' +
        '</div><div style="padding:12px;"><div style="font-size:10px;color:#888;text-align:center;margin-bottom:8px;">🌿 ' + (function(){ var m = GameState.get('materials'); return m ? (m.herb||0) : 0; })() + ' &nbsp;&nbsp; 🪨 ' + (function(){ var m = GameState.get('materials'); return m ? (m.ore||0) : 0; })() + '</div>';
    // 当前buff
    if (curBuff) {
        // 自动清除已过期的增益
        if (Date.now() >= curBuff.expiry) {
            GameState.set('activeCampBuff', null);
            curBuff = null;
        }
    }
    if (curBuff) {
        var remaining = Math.max(0, Math.ceil((curBuff.expiry - Date.now()) / 60000));
        html += '<div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:8px;padding:8px 10px;margin-bottom:10px;">' +
            '<div style="font-size:11px;color:#ffd700;font-weight:bold;">✅ 当前增益</div>' +
            '<div style="font-size:11px;color:#aaa;margin-top:4px;">' + curBuff.desc + ' <span style="color:#4fc3f7;">(' + remaining + '分钟)</span></div>' +
            '<button class="btn" style="margin-top:6px;padding:4px 12px;font-size:10px;border-color:#f44336;color:#f44336;" onclick="clearCampBuff()">取消增益</button></div>';
    }
    for (var i = 0; i < recipes.length; i++) {
        var r = recipes[i];
        var canAfford = true;
        if (r.cost) {
            canAfford = (GameState.get('gold') || 0) >= r.cost;
        }
        if (r.herb && (!GameState.get('materials') || (GameState.get('materials').herb || 0) < r.herb)) canAfford = false;
        if (r.ore && (!GameState.get('materials') || (GameState.get('materials').ore || 0) < r.ore)) canAfford = false;
        // 材料成本显示
        var mats = [];
        if (r.herb) mats.push('<span style="margin-right:2px;">🌿</span><span style="font-size:9px;color:' + (canAfford && (!GameState.get('materials') || (GameState.get('materials').herb||0) >= r.herb) ? '#4caf50' : '#f44336') + ';">' + (GameState.get('materials') ? (GameState.get('materials').herb||0) : 0) + '/' + r.herb + '</span>');
        if (r.ore) mats.push('<span style="margin-right:2px;">🪨</span><span style="font-size:9px;color:' + (canAfford && (!GameState.get('materials') || (GameState.get('materials').ore||0) >= r.ore) ? '#4caf50' : '#f44336') + ';">' + (GameState.get('materials') ? (GameState.get('materials').ore||0) : 0) + '/' + r.ore + '</span>');
        var costHtml = mats.join(' &nbsp;');
        html += '<div class="cook-recipe" style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:6px;background:rgba(255,255,255,0.04);border:1px solid ' + (canAfford ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)') + ';border-radius:8px;">' +
            '<span style="font-size:22px;">' + r.icon + '</span>' +
            '<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:bold;color:#fff;">' + r.name + '</div>' +
            '<div style="font-size:10px;color:#888;line-height:1.4;">' + r.desc + '</div>' +
            '<div style="margin-top:3px;font-size:10px;">' + costHtml + '</div></div>' +
            '<button class="btn" style="padding:5px 12px;font-size:10px;flex-shrink:0;' + (canAfford ? 'border-color:#ffd700;color:#ffd700;' : 'border-color:#555;color:#555;') + '" ' +
            (canAfford ? 'onclick="cookRecipe(\'' + r.id + '\')"' : 'disabled') + '>烹饪</button></div>';
    }
    html += '</div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

function cookRecipe(recipeId) {
    var recipe = (typeof getCampRecipe === 'function') ? getCampRecipe(recipeId) : null;
    if (!recipe) return;
    // 检查材料
    if (!gameState.materials) gameState.materials = { herb: 0, ore: 0, forgeDust: 0, reforgestone: 0, lotteryStone: 0, upgradeStone: 0, gem: 0 };
    if (recipe.herb && (GameState.get('materials').herb || 0) < recipe.herb) { showToast('🌿 草药不足', 'error'); return; }
    if (recipe.ore && (GameState.get('materials').ore || 0) < recipe.ore) { showToast('🪨 矿石不足', 'error'); return; }
    if (recipe.cost && (GameState.get('gold') || 0) < recipe.cost) { showToast('金币不足', 'error'); return; }
    // 消耗材料
    if (recipe.herb) GameState.mutate('materials', function(m) { m.herb -= recipe.herb; return m; });
    if (recipe.ore) GameState.mutate('materials', function(m) { m.ore -= recipe.ore; return m; });
    if (recipe.cost) GameState.mutate('gold', function(g) { return g - recipe.cost; });
    // 设置 buff
    GameState.set('activeCampBuff', {
        recipeId: recipe.id,
        name: recipe.name,
        desc: recipe.desc,
        buff: recipe.buff,
        expiry: Date.now() + recipe.buff.dur
    });
    closeModal();
    if (typeof showToast === 'function') showToast('🔥 烹饪完成！' + recipe.name + '已生效', 'success');
    if (typeof updateResources === 'function') updateResources();
}

function clearCampBuff() {
    GameState.set('activeCampBuff', null);
    closeModal();
    if (typeof showToast === 'function') showToast('增益已取消', 'info');
}

// ==================== 3. 告示牌（每日任务）====================
function openQuestBoard() {
    // 先检查重置
    if (typeof checkDailyReset === 'function') checkDailyReset(gameState);
    var quests = (typeof getDailyQuests === 'function') ? getDailyQuests() : [];
    var claimed = GameState.get('_dailyQuestClaimed') || {};
    var html = '<div class="modal-overlay" onclick="if(event.target===this)closeModal()">' +
        '<div class="modal-content" style="max-width:400px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #66bb6a;border-radius:14px;padding:0;overflow:hidden;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#2e7d32,#1b5e20);padding:12px 16px;text-align:center;">' +
        '<div style="font-size:16px;font-weight:bold;color:#fff;">📋 每日任务</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px;">完成每日任务领取奖励，每天重置</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeModal()">✕</span>' +
        '</div><div style="padding:12px;">';
    var done = 0, total = 0;
    for (var i = 0; i < quests.length; i++) {
        var q = quests[i];
        var progress = GameState.get(q.trackKey) || 0;
        var isComplete = progress >= q.target;
        var isClaimed = claimed[q.id] === true;
        total++;
        if (isClaimed) done++;
        var pct = Math.min(100, Math.round((progress / q.target) * 100));
        html += '<div style="padding:8px 10px;margin-bottom:5px;background:rgba(255,255,255,0.03);border:1px solid ' + (isClaimed ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.06)') + ';border-radius:8px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:18px;">' + q.icon + '</span>' +
            '<div style="flex:1;"><div style="font-size:12px;font-weight:bold;color:' + (isClaimed ? '#4caf50' : '#fff') + ';">' + q.name + '</div>' +
            '<div style="font-size:10px;color:#888;">' + q.desc + '</div>' +
            '<div style="margin-top:4px;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">' +
            '<div style="height:100%;width:' + pct + '%;background:' + (isComplete ? '#4caf50' : '#ffd700') + ';border-radius:2px;transition:width 0.3s;"></div></div>' +
            '<div style="font-size:9px;color:#888;margin-top:2px;">' + progress + '/' + q.target + '</div></div>' +
            (isClaimed ? '<span style="font-size:12px;color:#4caf50;">✅ 已领</span>' :
             (isComplete ? '<button class="btn" style="padding:4px 10px;font-size:10px;border-color:#4caf50;color:#4caf50;" onclick="claimQuestReward(\'' + q.id + '\')">领取</button>' :
              '<span style="font-size:10px;color:#555;">进行中</span>')) +
            '</div></div>';
    }
    html += '<div style="text-align:center;font-size:11px;color:#888;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);">完成 ' + done + '/' + total + ' 个任务</div>';
    html += '</div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

function claimQuestReward(questId) {
    var quests = (typeof getDailyQuests === 'function') ? getDailyQuests() : [];
    var q = null;
    for (var i = 0; i < quests.length; i++) {
        if (quests[i].id === questId) { q = quests[i]; break; }
    }
    if (!q) return;
    var progress = GameState.get(q.trackKey) || 0;
    if (progress < q.target) {
        if (typeof showToast === 'function') showToast('任务尚未完成', 'warning');
        return;
    }
    var claimed = GameState.get('_dailyQuestClaimed');
    if (claimed && claimed[q.id]) {
        if (typeof showToast === 'function') showToast('奖励已领取', 'info');
        return;
    }
    if (!GameState.get('_dailyQuestClaimed')) GameState.set('_dailyQuestClaimed', {});
    var claimed2 = GameState.get('_dailyQuestClaimed');
    claimed2[q.id] = true;
    // 发放奖励
    var reward = q.reward;
    if (reward.gold) GameState.mutate('gold', function(g) { return (g || 0) + reward.gold; });
    if (reward.lotteryStone) GameState.mutate('lotteryStone', function(g) { return (g || 0) + reward.lotteryStone; });
    if (reward.reforgestone) GameState.mutate('reforgestone', function(g) { return (g || 0) + reward.reforgestone; });
    if (reward.forgeDust) GameState.mutate('forgeDust', function(g) { return (g || 0) + reward.forgeDust; });
    // if (reward.gem) GameState.mutate('magicCore', ...) — 魔核仅充值获取
    if (typeof showToast === 'function') showToast('🎉 任务奖励已领取！', 'success');
    if (typeof updateResources === 'function') updateResources();
    closeModal();
    setTimeout(function() { openQuestBoard(); }, 100); // 刷新
}

// ==================== 4. 训练木桩 DPS 测试 ====================
var _dpsTestRunning = false;
var _dpsTestData = { hits: 0, totalDmg: 0, crits: 0, skillsUsed: 0, skills: {}, startTime: 0 };

function startDPSTest(testDuration) {
    testDuration = testDuration || 15000; // 默认 15 秒
    if (_dpsTestRunning) return;
    var heroes = GameState.get('heroes');
    if (!heroes || heroes.length === 0) {
        if (typeof showToast === 'function') showToast('队伍中没有英雄', 'warning');
        return;
    }
    // 检查战斗管理器
    if (typeof BattleManager === 'undefined' || !BattleManager || !BattleManager.startDummyTest) {
        if (typeof showToast === 'function') showToast('战斗系统未就绪', 'error');
        return;
    }
    _dpsTestRunning = true;
    _dpsTestData = { hits: 0, totalDmg: 0, crits: 0, skillsUsed: 0, skills: {}, startTime: Date.now() };
    
    if (typeof showToast === 'function') showToast('⚔ DPS 测试开始！持续 ' + (testDuration / 1000) + ' 秒', 'info');
    
    // 切换到木桩战斗场景（由 BattleManager 处理）
    BattleManager.startDummyTest(testDuration, function(results) {
        _dpsTestRunning = false;
        showDPSTestResult(results);
    });
}

function showDPSTestResult(results) {
    if (!results) return;
    var duration = (results.duration || 15) / 1000;
    var dps = duration > 0 ? Math.floor(results.totalDmg / duration) : 0;
    var critRate = results.hits > 0 ? ((results.crits / results.hits) * 100).toFixed(1) : '0.0';
    
    var html = '<div class="modal-overlay" onclick="if(event.target===this)closeModal()">' +
        '<div class="modal-content" style="max-width:360px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ff6f00;border-radius:14px;padding:0;overflow:hidden;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#e65100,#bf360c);padding:12px 16px;text-align:center;">' +
        '<div style="font-size:16px;font-weight:bold;color:#fff;">⚔ DPS 测试结果</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px;">测试时长: ' + duration.toFixed(1) + ' 秒</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeModal()">✕</span>' +
        '</div><div style="padding:14px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
        '<div class="dps-stat" style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:8px;padding:10px;text-align:center;">' +
        '<div style="font-size:10px;color:#888;">总伤害</div><div style="font-size:18px;font-weight:bold;color:#ffd700;">' + (typeof formatNumber === 'function' ? formatNumber(results.totalDmg) : results.totalDmg) + '</div></div>' +
        '<div class="dps-stat" style="background:rgba(79,195,247,0.08);border:1px solid rgba(79,195,247,0.2);border-radius:8px;padding:10px;text-align:center;">' +
        '<div style="font-size:10px;color:#888;">DPS</div><div style="font-size:18px;font-weight:bold;color:#4fc3f7;">' + (typeof formatNumber === 'function' ? formatNumber(dps) : dps) + '</div></div>' +
        '<div class="dps-stat" style="background:rgba(239,83,80,0.08);border:1px solid rgba(239,83,80,0.2);border-radius:8px;padding:10px;text-align:center;">' +
        '<div style="font-size:10px;color:#888;">暴击率</div><div style="font-size:18px;font-weight:bold;color:#ef5350;">' + critRate + '%</div></div>' +
        '<div class="dps-stat" style="background:rgba(102,187,106,0.08);border:1px solid rgba(102,187,106,0.2);border-radius:8px;padding:10px;text-align:center;">' +
        '<div style="font-size:10px;color:#888;">攻击次数</div><div style="font-size:18px;font-weight:bold;color:#66bb6a;">' + results.hits + '</div></div>' +
        '</div>';
    // 技能使用统计
    if (results.skills && Object.keys(results.skills).length > 0) {
        html += '<div style="margin-top:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">' +
            '<div style="font-size:11px;color:#888;margin-bottom:4px;">技能释放统计</div>';
        for (var sk in results.skills) {
            html += '<div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa;padding:2px 0;">' +
                '<span>' + sk + '</span><span style="color:#ffd700;">' + results.skills[sk] + ' 次</span></div>';
        }
        html += '</div>';
    }
    html += '<button class="btn btn-gold" style="width:100%;margin-top:10px;" onclick="closeModal()">关闭</button>';
    html += '</div></div></div>';
    var div = document.createElement('div');
    div.className = 'modal-overlay';
    div.innerHTML = html;
    document.body.appendChild(div);
}