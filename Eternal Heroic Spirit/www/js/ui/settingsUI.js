// ========== 设置界面UI ==========
/* global GameState */

// 存档槽位键名（单槽位）
var SAVE_SLOT_KEY = 'cqc_idle_rpg_save_slot1';

// ========== 存档操作 ==========

// 手动保存
function manualSave() {
    saveGame(GameState.getAll());
    GameState.set('lastSaveTime', Date.now());
    showToast('已保存', 'success');
    updateLastSaveTime();
    refreshSettingsUI();
}

// 加载存档
function loadSaveGame() {
    var encrypted = localStorage.getItem(SAVE_SLOT_KEY);
    if (!encrypted) { showToast('无存档数据', 'warning'); return; }

    showConfirm('加载存档', '确定要加载存档吗？<br>当前未保存的进度将丢失！', function() {
        var oldKey = SAVE_KEY;
        SAVE_KEY = SAVE_SLOT_KEY;
        var saved = loadGame();
        SAVE_KEY = oldKey;

        if (saved && saved.heroes && saved.heroes.length > 0) {
            saveGame(saved);
            showToast('存档已加载', 'success');
            setTimeout(function() { location.reload(); }, 1000);
        } else {
            showToast('存档数据损坏', 'error');
        }
    });
}

// 删除存档
function deleteSaveGame() {
    var encrypted = localStorage.getItem(SAVE_SLOT_KEY);
    if (!encrypted) { showToast('无存档数据', 'warning'); return; }

    showConfirm('删除存档', '确定要删除存档吗？<br><span style="color:#f44336;">此操作不可恢复！</span>', function() {
        localStorage.removeItem(SAVE_SLOT_KEY);
        showToast('存档已删除', 'info');
        refreshSettingsUI();
    });
}

// 处理存档导入
function handleImportSave(input) {
    var file = input.files[0];
    if (!file) return;

    showConfirm('导入存档', '确定要导入存档文件吗？<br>当前存档将被覆盖！', function() {
        importSave(file, function(data) {
            showToast('导入成功，页面即将刷新', 'success');
            setTimeout(function() { location.reload(); }, 1000);
        }, function(err) {
            showToast('导入失败: ' + err.message, 'error');
        });
    });
    input.value = '';
}

// 清除存档数据
function clearSaveData() {
    showConfirm('删除所有存档', '确定要清除所有本地存档数据吗？<br><span style="color:#f44336;font-size:13px;">此操作不可恢复！</span>', function() {
        localStorage.removeItem(SAVE_SLOT_KEY);
        localStorage.removeItem(SAVE_KEY);
        showToast('所有存档已清除', 'info');
        setTimeout(function() { location.reload(); }, 500);
    });
}

// 更改自动保存间隔
function changeAutoSaveInterval(value) {
    var seconds = parseInt(value);
    document.getElementById('save-interval-display').textContent = seconds;
    document.getElementById('save-interval-value').textContent = seconds + 's';

    // 重启自动保存
    if (GameState.getAll()) {
        var ms = seconds * 1000;
        if (window._autoSaveTimer) clearInterval(window._autoSaveTimer);
        window._autoSaveTimer = setInterval(function() {
            saveGame(GameState.getAll());
        }, ms);
    }
}

// 更新最后保存时间显示
function updateLastSaveTime() {
    var el = document.getElementById('stat-last-save');
    if (!el) return;
    if (GameState.get('lastSaveTime')) {
        var diff = Date.now() - GameState.get('lastSaveTime');
        if (diff < 60000) el.textContent = '刚刚';
        else if (diff < 3600000) el.textContent = Math.floor(diff / 60000) + '分钟前';
        else el.textContent = Math.floor(diff / 3600000) + '小时前';
    } else {
        el.textContent = '未保存';
    }
}

// 刷新设置界面统计信息
function refreshSettingsUI() {
    if (!GameState.getAll()) return;

    // 同步战斗速度显示
    var speedEl = document.getElementById('battle-speed-display');
    if (speedEl) speedEl.textContent = (BattleManager.speed || 1) + 'x';
    // 同步自动战斗显示
    var autoEl = document.getElementById('auto-battle-display');
    if (autoEl) autoEl.textContent = BattleManager.autoBattle ? '开启' : '关闭';

    // 更新统计信息
    var stats = {
        'stat-monsters-killed': GameState.get('monstersKilled') || 0,
        'stat-stage': '第' + (GameState.get('stage') || 1) + '章',
        'stat-hero-count': (GameState.get('heroes') || []).length,
        'stat-equip-count': (GameState.get('inventory') || []).length,
        'stat-gold-total': Math.floor(GameState.get('gold') || 0),
        'stat-play-time': formatPlayTime(GameState.get('totalPlayTime') || 0)
    };

    for (var id in stats) {
        var el = document.getElementById(id);
        if (el) el.textContent = stats[id];
    }

    updateLastSaveTime();

    // 更新存档状态
    var statusEl = document.getElementById('slot-status');
    if (statusEl) {
        var encrypted = localStorage.getItem(SAVE_SLOT_KEY);
        statusEl.textContent = encrypted ? '有存档' : '空';
        statusEl.style.color = encrypted ? '#4fc3f7' : '#666';
    }

    // 同步自动处理设置
    var ap = GameState.get('autoProcess');
    if (ap) {
        var toggleBtn = document.getElementById('btn-auto-process-toggle');
        if (toggleBtn) toggleBtn.textContent = ap.enabled ? '开启' : '关闭';
        var desc = document.getElementById('auto-process-action-desc');
        if (desc) desc.textContent = '当前: ' + (ap.action === 'sell' ? '卖出' : '分解');
        var actionBtn = document.getElementById('btn-auto-process-action');
        if (actionBtn) actionBtn.textContent = ap.action === 'sell' ? '分解' : '卖出';
        // 同步品质勾选框
        document.querySelectorAll('.auto-process-q').forEach(function(cb) {
            cb.checked = ap.qualities.indexOf(parseInt(cb.value)) !== -1;
        });
    }

    // 同步音频设置
    if (typeof AudioManager !== 'undefined' && AudioManager) {
        var bgmOn = AudioManager.bgmEnabled !== false;
        var sfxOn = AudioManager.sfxEnabled !== false;
        var bgmVol = Math.round((AudioManager.bgmVolume || 0) * 100);
        var sfxVol = Math.round((AudioManager.sfxVolume || 0) * 100);
        var bgmStatus = document.getElementById('bgm-status-display');
        if (bgmStatus) bgmStatus.textContent = bgmOn ? '开启' : '关闭';
        var sfxStatus = document.getElementById('sfx-status-display');
        if (sfxStatus) sfxStatus.textContent = sfxOn ? '开启' : '关闭';
        var bgmVolDisp = document.getElementById('bgm-volume-display');
        if (bgmVolDisp) bgmVolDisp.textContent = bgmVol + '%';
        var sfxVolDisp = document.getElementById('sfx-volume-display');
        if (sfxVolDisp) sfxVolDisp.textContent = sfxVol + '%';
        var bgmSlider = document.getElementById('bgm-volume-slider');
        if (bgmSlider && parseInt(bgmSlider.value, 10) !== bgmVol) bgmSlider.value = bgmVol;
        var bgmSliderVal = document.getElementById('bgm-volume-value');
        if (bgmSliderVal && bgmSliderVal.textContent !== String(bgmVol)) bgmSliderVal.textContent = bgmVol;
        var sfxSlider = document.getElementById('sfx-volume-slider');
        if (sfxSlider && parseInt(sfxSlider.value, 10) !== sfxVol) sfxSlider.value = sfxVol;
        var sfxSliderVal = document.getElementById('sfx-volume-value');
        if (sfxSliderVal && sfxSliderVal.textContent !== String(sfxVol)) sfxSliderVal.textContent = sfxVol;
    }
}

// 格式化游戏时间
function formatPlayTime(ms) {
    if (!ms) return '0小时';
    var seconds = Math.floor(ms / 1000);
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return hours + '小时' + minutes + '分';
    return minutes + '分';
}

// 切换战斗加速
function toggleBattleSpeed() {
    var speeds = [1, 2, 3];
    if (!BattleManager.speed) BattleManager.speed = 1;
    var idx = speeds.indexOf(BattleManager.speed);
    BattleManager.speed = speeds[(idx + 1) % speeds.length];

    // 更新设置界面显示
    var el = document.getElementById('battle-speed-display');
    if (el) el.textContent = BattleManager.speed + 'x';
    // 更新战斗界面按钮
    var btn = document.getElementById('btn-battle-speed');
    if (btn) btn.textContent = BattleManager.speed + 'x';

    showToast('战斗速度: ' + BattleManager.speed + 'x', 'info');
    refreshSettingsUI();
}

// 切换自动战斗
function toggleAutoBattle() {
    if (BattleManager) {
        BattleManager.autoBattle = !BattleManager.autoBattle;
        // 更新设置界面显示
        var el = document.getElementById('auto-battle-display');
        if (el) el.textContent = BattleManager.autoBattle ? '开启' : '关闭';
        // 更新战斗界面按钮
        updateAutoButtonText();

        // 如果开启自动且正在等待下一章，自动推进
        if (BattleManager.autoBattle && BattleManager.waitingNextChapter) {
            BattleManager.advanceToNextChapter();
        }

        showToast('自动战斗: ' + (BattleManager.autoBattle ? '开启' : '关闭'), 'info');
    }
}

// 更新自动按钮文字
function updateAutoButtonText() {
    if (!BattleManager) return;
    var btn = document.getElementById('btn-auto-battle');
    if (btn) btn.textContent = BattleManager.autoBattle ? '自动推图中…' : '手动';
}

// ========== 音频控制 ==========

// 切换 BGM 开关
function toggleBGM() {
    if (typeof AudioManager === 'undefined' || !AudioManager) return;
    var on = AudioManager.toggleBGM();
    var display = document.getElementById('bgm-status-display');
    if (display) display.textContent = on ? '开启' : '关闭';
    showToast('背景音乐: ' + (on ? '开启' : '关闭'), 'info');
}

// 切换 SFX 开关
function toggleSFX() {
    if (typeof AudioManager === 'undefined' || !AudioManager) return;
    var on = AudioManager.toggleSFX();
    var display = document.getElementById('sfx-status-display');
    if (display) display.textContent = on ? '开启' : '关闭';
    showToast('战斗音效: ' + (on ? '开启' : '关闭'), 'info');
}

// 调节 BGM 音量（v 为 0~100 的整数）
function changeBGMVolume(v) {
    if (typeof AudioManager === 'undefined' || !AudioManager) return;
    var iv = parseInt(v, 10) || 0;
    AudioManager.setBGMVolume(iv / 100);
    var volDisp = document.getElementById('bgm-volume-display');
    if (volDisp) volDisp.textContent = iv + '%';
    var label = document.getElementById('bgm-volume-value');
    if (label) label.textContent = iv;
}

// 调节 SFX 音量（v 为 0~100 的整数）
function changeSFXVolume(v) {
    if (typeof AudioManager === 'undefined' || !AudioManager) return;
    var iv = parseInt(v, 10) || 0;
    AudioManager.setSFXVolume(iv / 100);
    var volDisp = document.getElementById('sfx-volume-display');
    if (volDisp) volDisp.textContent = iv + '%';
    var label = document.getElementById('sfx-volume-value');
    if (label) label.textContent = iv;
}

// 周期刷新 BGM 主题名（每 1s 轮询）
setInterval(function() {
    if (typeof AudioManager === 'undefined' || !AudioManager) return;
    var el = document.getElementById('bgm-theme-display');
    if (!el) return;
    var cur = AudioManager.getCurrentBGM ? AudioManager.getCurrentBGM() : null;
    var text = cur || '—';
    if (el.textContent !== text) el.textContent = text;
}, 1000);

// ========== 自动处理装备 ==========

// 切换自动处理开关
function toggleAutoProcess() {
    var ap = GameState.get('autoProcess');
    if (!ap) {
        GameState.set('autoProcess', { enabled: false, qualities: [], action: 'sell' });
        ap = GameState.get('autoProcess');
    }
    ap.enabled = !ap.enabled;
    GameState.set('autoProcess', ap);
    var btn = document.getElementById('btn-auto-process-toggle');
    if (btn) btn.textContent = ap.enabled ? '开启' : '关闭';
    showToast('自动处理: ' + (ap.enabled ? '开启' : '关闭'), 'info');
}

// 切换处理方式 (卖出/分解)
function switchAutoProcessAction() {
    var ap = GameState.get('autoProcess');
    if (!ap) {
        GameState.set('autoProcess', { enabled: false, qualities: [], action: 'sell' });
        ap = GameState.get('autoProcess');
    }
    ap.action = ap.action === 'sell' ? 'decompose' : 'sell';
    GameState.set('autoProcess', ap);
    var desc = document.getElementById('auto-process-action-desc');
    if (desc) desc.textContent = '当前: ' + (ap.action === 'sell' ? '卖出' : '分解');
    var btn = document.getElementById('btn-auto-process-action');
    if (btn) btn.textContent = ap.action === 'sell' ? '分解' : '卖出';
    showToast('处理方式: ' + (ap.action === 'sell' ? '卖出' : '分解'), 'info');
}

// 保存自动处理设置
function saveAutoProcessSettings() {
    var ap = GameState.get('autoProcess');
    if (!ap) {
        GameState.set('autoProcess', { enabled: false, qualities: [], action: 'sell' });
        ap = GameState.get('autoProcess');
    }
    var qualities = [];
    Array.prototype.forEach.call(document.querySelectorAll('.auto-process-q:checked'), function(cb) {
        qualities.push(parseInt(cb.value));
    });
    ap.qualities = qualities;
    GameState.set('autoProcess', ap);
}

// 战斗结束后自动处理装备
function processAutoLoot() {
    var ap = GameState.get('autoProcess');
    if (!ap || !ap.enabled) return;
    var qualities = ap.qualities || [];
    if (qualities.length === 0) return;
    var action = ap.action || 'sell';
    var inv = GameState.get('inventory') || [];
    var toRemove = [];
    var processedCount = 0;
    var totalGold = 0;
    var totalDust = 0;
    var totalStone = 0;

    for (var i = 0; i < inv.length; i++) {
        var eq = inv[i];
        if (qualities.indexOf(eq.quality) !== -1) {
            if (action === 'sell') {
                totalGold += calcEquipValue(eq);
            } else {
                var mats = decomposeEquip(eq);
                totalDust += mats.dust;
                totalStone += mats.reforgestone;
            }
            toRemove.push(i);
            processedCount++;
        }
    }

    if (processedCount === 0) return;

    // 从后往前移除
    for (var i = toRemove.length - 1; i >= 0; i--) {
        inv.splice(toRemove[i], 1);
    }
    GameState.set('inventory', inv);

    if (action === 'sell') {
        GameState.mutate('gold', function(g) { return (g || 0) + totalGold; });
        showToast('自动卖出 ' + processedCount + ' 件装备，获得金币x' + totalGold, 'info');
    } else {
        GameState.mutate('forgeDust', function(d) { return (d || 0) + totalDust; });
        GameState.mutate('reforgestone', function(s) { return (s || 0) + totalStone; });
        showToast('自动分解 ' + processedCount + ' 件装备，获得粉尘x' + totalDust + (totalStone > 0 ? ', 重铸石x' + totalStone : ''), 'info');
    }
}

// ========== 新手教程（全面专业版）============
// 14 大系统 + 侧边导航 + 卡片式主内容区

// 侧边导航配置（id 须与 TUTORIAL_BODY 键名一致）
var TUTORIAL_NAV = [
    { id: 'hero',    icon: '🎖️', name: '英雄系统',   color: '#4fc3f7' },
    { id: 'battle',  icon: '⚔️', name: '战斗系统',   color: '#e040fb' },
    { id: 'equip',   icon: '🛡️', name: '装备系统',   color: '#ff9800' },
    { id: 'gem',     icon: '💎', name: '宝石系统',   color: '#2196f3' },
    { id: 'forge',   icon: '🔨', name: '宝石工坊',   color: '#f44336' },
    { id: 'inv',     icon: '📦', name: '仓库系统',   color: '#ffeb3b' },
    { id: 'dungeon', icon: '🏰', name: '副本系统',   color: '#9c27b0' },
    { id: 'power',   icon: '📊', name: '战力系统',   color: '#ffd700' },
    { id: 'codex',   icon: '📖', name: '收集图鉴',   color: '#ce93d8' },
    { id: 'achieve', icon: '🏆', name: '成就转生',   color: '#ff6f00' },
    { id: 'rebirth', icon: '♻️', name: '轮回转生',   color: '#e040fb' },
    { id: 'save',    icon: '💾', name: '存档管理',   color: '#4caf50' },
    { id: 'tip',     icon: '💡', name: '实用贴士',   color: '#ff5722' },
    { id: 'chapter', icon: '🗺️', name: '章节预览',   color: '#7c4dff' }
];

// 卡片容器生成器
function tCard(headerIcon, headerColor, headerText, bodyHtml) {
    return '<section class="tut-card" id="tt-' + headerIcon + '">' +
        '<div class="tut-card-head" style="--accent:' + headerColor + ';">' +
            '<span class="tut-card-icon">' + headerIcon + '</span>' +
            '<span class="tut-card-title">' + headerText + '</span>' +
        '</div>' +
        '<div class="tut-card-body">' + bodyHtml + '</div>' +
    '</section>';
}

// 重点标注框（蓝底）
function tInfo(text) {
    return '<div class="tut-info">💡 ' + text + '</div>';
}
// 警告框（红底）
function tWarn(text) {
    return '<div class="tut-warn">⚠️ ' + text + '</div>';
}
// 技巧框（绿底）
function tTip(text) {
    return '<div class="tut-tip">✨ ' + text + '</div>';
}
// 数据表格
function tTable(headers, rows) {
    var h = '<th>' + headers.join('</th><th>') + '</th>';
    var body = rows.map(function(r) {
        return '<tr><td>' + r.join('</td><td>') + '</td></tr>';
    }).join('');
    return '<table class="tut-table"><thead><tr>' + h + '</tr></thead><tbody>' + body + '</tbody></table>';
}
// 标签胶囊
function tTag(text, color) {
    return '<span class="tut-tag" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">' + text + '</span>';
}
// 小节标题
function tSub(text) {
    return '<div class="tut-sub">▸ ' + text + '</div>';
}

function showGameTutorial() {
    // ========== 一、英雄系统 ==========
    var bodyHero =
        tSub('核心机制：8 种职业 + 4 人上阵 + 2×2 站位') +
        '<p><b>招募价格：</b>骑士/法师免费，刺客 500G、战士 600G、贤者 700G、召唤师 800G、剑客 900G、亡灵法师 1000G。同职业重复购买会<b>递增</b>。</p>' +
        '<p><b>站位规则：</b>position = front（前排）| back（后排）。坦克/战士放前排吸收伤害，输出/治疗放后排输出。站位错误会被敌方优先集火后排。</p>' +
        '<p><b>升级公式：</b>每升一级，<b>所有基础属性（攻击/防御/生命/速度）</b>+2%。所需经验 = 100 × 1.15<sup>(等级-1)</sup>。</p>' +
        '<p><b>MP（魔法值）：</b>施放技能需消耗 MP。每个职业有基础 MP + 战斗外回魔（每 5 秒 +mpRegen）。BOSS 战 MP 自动满。</p>' +
        tTable(['职业', '定位', '基础攻击', '基础防御', '基础生命', '上手难度'],
            [['骑士', '前排坦克', '15', '30', '225', '★'],
             ['法师', '后排输出', '38', '8',  '105', '★★'],
             ['刺客', '后排爆发', '45', '5',  '83',  '★★★'],
             ['召唤师','后排辅助', '27', '12', '120', '★★★'],
             ['战士', '前排输出', '27', '23', '195', '★★'],
             ['贤者', '后排治疗', '18', '15', '135', '★★'],
             ['亡灵法师','后排输出', '42', '6',  '98',  '★★★'],
             ['剑客', '前排输出', '33', '18', '150', '★★']]) +
        '<p><b>轮回加成：</b>通过轮回系统可获得<b>永久属性加成</b>（攻击/防御/生命/速度），所有英雄共享，多次轮回可叠加。</p>' +
        tSub('技能与加点') +
        '<p>每个职业 6-7 个技能，初始 1-2 个已解锁。技能点数通过<b>战斗/任务</b>获得。在<b>技能界面</b>查看/加点/退回。回退返还 100% 金币。</p>' +
        tSub('天赋系统（6 族 × 5 级 = 30 节点 + 更多功能节点）') +
        '<p>攻击/防御/生命/暴击/速度/暴伤，每族 5 节点，<b>可加点 100 次</b>，线性价格（基础 × (N+1)）。另有更多<b>功能节点</b>：上阵位 3/4、背包 +50/+100、仓库 +1 页 ×4，以及额外的经验/掉落加成路径。</p>' +
        tTable(['天赋族', '5 级满级总收益', '基础成本', '100级累计成本'],
            [['攻击', '+1150 攻击', '200G',  '约 1,010,000G'],
             ['防御', '+1150 防御', '200G',  '约 1,010,000G'],
             ['生命', '+11400 生命', '200G', '约 1,010,000G'],
             ['暴击', '+230%',     '200G',  '约 1,010,000G'],
             ['速度', '+115 速度', '200G',  '约 1,010,000G'],
             ['暴伤', '+1150%',   '200G',  '约 1,010,000G']]) +
        tTip('经验/掉落加成路径仅 3 级，最终 +30%/+30%，价格 800/5000/25000G，性价比极高，必点。') +
        tInfo('暴击已封顶 100%（doAttack 内置 Math.min(1, crit/100)），暴伤无封顶，叠暴伤收益稳定。') +
        tInfo('英雄可装备<b>强化装备</b>（+0 至 +15），大幅提升基础属性。优先给主坦克和主输出配强化装备。');

    // ========== 二、战斗系统 ==========
    var bodyBattle =
        tSub('章节结构：100 章 × 20 关 = 2000 关') +
        '<p>关卡显示为 <b>1-1 / 1-2 ... 1-20 / 2-1 ...</b>。每关怪物数量随章节递增（10 → 30），分多波次刷新，每波 5 只。</p>' +
        tTable(['关卡', '怪物数量', '怪物波次', '特殊机制'],
            [['1-1 ~ 1-4',   '10 只', '2 波', '纯普通怪'],
             ['1-5 / 1-15',  '13 只', '3 波', '精英怪（1-2 只）'],
             ['1-10 / 1-20', '15 只', '3 波', 'BOSS 战'],
             ['2 章起 5/15', '15+',  '3+ 波', '精英强化'],
             ['20 章起',     '30 只', '6 波', '高密度 + 双 BOSS']]) +
        tSub('关卡跳跃防护（副本后不会跳关）') +
        '<p>副本结束 → 返回主线 是个常见跳关点。修复后副本 BOSS 死亡后<b>不再刷怪</b>，直接发奖励退出副本，主线关卡不变。</p>' +
        tTip('副本中途退出也会保存进度，不影响主线关卡。') +
        tSub('战斗核心规则') +
        '<p><b>仇恨机制：</b>每个怪物有仇恨值，攻击/治疗/嘲讽会改变仇恨。坦克嘲讽技能可强制转移仇恨。</p>' +
        '<p><b>技能 AI：</b>辅助职业（贤者/召唤师）优先治疗/辅助，输出职业优先高威胁目标，坦克优先嘲讽。</p>' +
        '<p><b>经验分配：</b>击杀者 70% + 团队平分 30%。合理站位让每个职业都能蹭到经验。</p>' +
        '<p><b>战败处理：</b>全队阵亡后<b>3 秒红屏倒计时</b>，自动重置当前关卡并恢复满血。</p>' +
        tSub('技能 AI 优先级（重要）') +
        '<p>系统对所有职业技能按 <b>目标类型</b> 智能排序，确保关键时刻释放正确技能：</p>' +
        tTable(['优先级', '目标类型', '典型技能', '释放场景'],
            [['0 最高', 'dead_ ally（复活）', '贤者复活术', '队友死亡时强制释放'],
             ['1', 'ally_lowest_hp（治疗）', '贤者治疗、治愈', '低血量队友'],
             ['2', 'team（群体 buff/护盾）', '圣盾、神圣阳壁', '群体防护'],
             ['3', 'self（单体 buff/护盾）', '白甲、护体', '给自己上 buff'],
             ['4', 'summon（召唤）', '召唤骷髅', '召唤生物'],
             ['5', 'enemy_all（群体攻击）', '火球术、阳之波', '群体输出'],
             ['6', 'enemy_single（单体攻击）', '盾击、暗袭', '单体输出'],
             ['7', 'dead_enemy（操控）', '死亡一指', '操控死敌']]) +
        tTip('修复后：骑士会优先释放圣盾、神圣阳壁、阳气嘲讽，不会再被盾击抢占释放窗口。') +
        tSub('贤者复活术（核心机制）') +
        '<p>贤者有 <b>resurrection（复活术）</b>，队友死亡时 <b>跳过 AI 判定，强制最高优先释放</b>。</p>' +
        '<p>修复前：复活术在战斗开始时受技能冷却影响，需要等待几轮 CD。修复后：<b>每场战斗开始时技能冷却清零</b>，复活术随到随发。</p>' +
        tInfo('每场战斗开始时，<b>所有技能 CD 强制重置为 0</b>（包括复活术）。') +
        tSub('战斗速度与控制') +
        '<p>右上角 <b>速度按钮</b>：1x / 2x / <b>4x</b> 切换，仅影响时间流逝，不影响伤害结算。右下角 <b>自动战斗</b>：开/关自动开怪。开怪即停。</p>' +
        tSub('套装效果系统（5 大套装）') +
        '<p>装备特定套装可激活<b>独特战斗机制</b>，大幅改变战斗策略：</p>' +
        tTable(['套装', '2 件效果', '4 件效果'],
            [['龙鳞套 🐉', '反射 15% 伤害', '反射 30% 伤害 + 反弹穿透'],
             ['星辰套 ⭐', '击杀回蓝 5%', '击杀回蓝 15% + 技能冷却 -20%'],
             ['暗影套 👻', '标记目标 +10% 易伤', '对标记目标 +40% 伤害'],
             ['圣光套 ✨', '战斗开始获得护盾（15% 生命）', '护盾 + 30% 生命 + 每 5 秒刷新'],
             ['狂战套 🔥', '血量 < 50% 时 +20% 攻击', '血量 < 50% 时 +50% 攻击 + 吸血 15%']]) +
        '<p>套装部件可通过<b>高级抽奖</b>和<b>爬塔 BOSS 层</b>获取。混搭不同套装组合可产生更强效果。</p>' +
        tSub('技能视觉效果') +
        '<p>每个职业拥有<b>独特的粒子效果</b>：骑士圣光盾、法师烈焰风暴、刺客暗影突袭、贤者治愈之光等。视觉特效随技能等级提升而增强。</p>' +
        tSub('场景背景（21 种动态背景）') +
        '<p>每章拥有<b>独特的动态背景</b>，从草原（第 1 章）到创世原点（第 100 章），共 21 种不同场景。动态效果包括飘雪、火焰、星空、魔法粒子等。</p>' +
        tSub('14 种状态效果（部分）') +
        tTable(['状态', '效果', '持续', '抗性属性'],
            [['灼烧', '每回合 8% 攻击伤害', '3 回合', 'effectRes'],
             ['冰冻', '无法行动',          '1 回合', 'effectRes'],
             ['中毒', '每回合 5% 损失血量', '5 回合', 'effectRes'],
             ['眩晕', '跳过本回合',         '1 回合', 'effectRes'],
             ['护盾', '白甲：覆盖血条的独立护甲值，必须打空才扣血', '5-6 秒', '—'],
             ['嘲讽', '强制被该单位攻击',   '2 回合', '—']]) +
        tInfo('effectHit（命中）vs effectRes（抵抗）决定状态是否生效，数值差越大成功率越高。');

    // ========== 三、装备系统 ==========
    var bodyEquip =
        tSub('6 大品质（白绿蓝紫橙金）') +
        tTable(['品质', '颜色', '基础属性倍率', '词条数', '宝石孔', '掉率'],
            [['普通', '白',  '×1.0',  '0', '0-1', '50%'],
             ['优秀', '绿',  '×1.15', '1', '1-2', '30%'],
             ['稀有', '蓝',  '×1.3',  '2', '2',   '15%'],
             ['史诗', '紫',  '×1.5',  '3', '2-3', '4%'],
             ['传说', '橙',  '×1.75', '4', '3',   '1%'],
             ['远古', '金',  '×2.0',  '5', '3-4', '抽奖/爬塔']]) +
        tSub('5 个装备部位 + 武器/防具限制') +
        '<p><b>武器/副手：</b>严格按职业限制（剑/斧/匕首/法杖/书/镰/刀）。<br>' +
        '<b>头盔/护甲/鞋子：</b>护甲类型（板甲/皮甲/布甲）按职业池区分（骑士→板甲，刺客→皮甲，法师→布甲）。</p>' +
        tTip('前期不要纠结装备，60% 装备都是过渡件。优先强化 +5 以上的优质装备。') +
        tSub('🔧 强化系统（+0 → +15）') +
        '<p>每级强化 + <b>5%</b> 基础属性，消耗金币。强化等级越高成功率越低：</p>' +
        tTable(['强化等级', '成功率', '消耗金币（近似）'],
            [['+0 → +3', '100%', '数百'],
             ['+4 → +6', '80%',  '数千'],
             ['+7 → +9', '60%',  '数万'],
             ['+10 → +12', '40%', '数十万'],
             ['+13 → +15', '25%', '百万+']]) +
        '<p>强化失败不降级（保护机制），放心强化。<b>优先强化武器和护甲</b>，输出/生存收益最大。</p>' +
        tSub('🔗 融合系统（3 合 1 升品）') +
        '<p>3 件同品质装备 → 1 件下一品质装备。融合消耗金币：</p>' +
        tTable(['融合类型', '消耗金币'],
            [['3 白 → 1 绿', '500G'],
             ['3 绿 → 1 蓝', '2,000G'],
             ['3 蓝 → 1 紫', '10,000G'],
             ['3 紫 → 1 橙', '50,000G'],
             ['3 橙 → 1 金', '250,000G']]) +
        tTip('推荐策略：蓝装向上融合性价比最高，紫装以上直接使用更好。') +
        tSub('🎯 套装效果（5 大套装）') +
        '<p>集齐 2/4 件同套装装备可激活独特战斗效果：</p>' +
        tTable(['套装', '定位', '核心机制'],
            [['龙鳞套 🐉', '坦克', '反射伤害，克制高攻敌人'],
             ['星辰套 ⭐', '辅助', '击杀回蓝 + 减 CD，续航型'],
             ['暗影套 👻', '输出', '标记 + 增伤，单体爆发'],
             ['圣光套 ✨', '防御', '自动护盾，团队生存'],
             ['狂战套 🔥', '狂战', '残血增伤 + 吸血，高风险高回报']]) +
        '<p>混搭 2+2 也能获得部分效果，灵活组合应对不同关卡。</p>' +
        tSub('📖 装备图鉴') +
        '<p>装备图鉴记录所有已发现的装备类型，分 5 大类别追踪收集进度。通过图鉴可查看各品质/部位装备的掉落来源和属性范围。</p>' +
        tSub('词条系统（缩放公式）') +
        '<p>词条数值基于<b>rollQuality（独立于装备品质）</b>在 4 个档位（60%/80%/100%/120%）间随机。重铸时数值范围由 rollQuality 而非装备品质决定。</p>' +
        '<p><b>平衡：</b>词条按装备等级缩放公式从 <code>0.7+0.3×Lv</code>（Lv50 ≈ 15.7×）改为 <code>1+0.04×Lv</code>（Lv50 ≈ 3×），与战斗等级缩放 <code>1+(Lv-1)×0.05</code> 协同，杜绝 1.18^N 指数放大。</p>' +
        '<p>重铸可<b>锁定</b>指定词条保留，每锁一个消耗 +1 重铸石。</p>' +
        tSub('装备评分（综合战力）') +
        '<p>评分 = 基础属性分 + 词条分 + 宝石分。<b>一键最佳</b>自动按评分穿戴（自动比较所有英雄未锁装备）。</p>' +
        tSub('pct 累加封顶（防崩盘）') +
        '<p><b>MAX_PCT_PER_STAT = 3.0</b>（300%）：单次 calcAllyStats 中同一 pct 属性的累加上限。避免 30 个 pct 来源 (5件 × 6词条) 叠加成 1.18^30 ≈ 236× 的崩盘倍率。</p>' +
        tInfo('装备图标全部 SVG 矢量（assets/images/weapon_*.svg 等），更清晰且支持任意缩放，Canvas 兜底配色。') +
        tInfo('强化 + 套装效果可叠加，毕业装备 = 高品阶 + 强化 + 匹配套装 + 优质词条。');

    // ========== 四、宝石系统 ==========
    var bodyGem =
        tSub('12 种宝石类型（5 单属性 + 7 复合属性）') +
        tTable(['类型', '宝石', '主属性', '附加属性'],
            [['单', '红宝石', '攻击%', '—'],
             ['单', '蓝宝石', '防御%', '—'],
             ['单', '黄宝石', '速度%', '—'],
             ['单', '绿宝石', '生命%', '—'],
             ['单', '钻石',   '暴击伤害%', '—'],
             ['复', '黑曜石', '攻击%', '伤害加成 +0.1%/级'],
             ['复', '月光石', '防御%', '伤害减免 +0.1%/级'],
             ['复', '紫水晶', '速度%', '暴击率 +0.2%/级'],
             ['复', '琥珀',   '生命%', '治疗率 +0.4%/级'],
             ['单', '翡翠',   '效果命中%', '—'],
             ['复', '缟玛瑙', '攻击%', '掉落加成 +0.15%/级'],
             ['复', '海蓝石', '防御%', '经验加成 +0.2%/级']]) +
        tSub('15 级数值表（单属性）') +
        tTable(['等级', 'L1', 'L5', 'L10', 'L15'],
            [['百分比', '1.5%', '18%', '136.6%', '1037.9%']]) +
        tSub('职业四维加成公式') +
        '<p>最终加成 = <b>基础属性 × 宝石百分比 × 职业四维系数</b>（statMultipliers）。</p>' +
        '<p>骑士 def/hp 系数 1.0 → 蓝/绿宝石收益最大。刺客 atk/spd 系数 1.0 → 红/黄宝石收益最大。</p>' +
        tTip('给前排放防御/生命宝石，后排放攻击/速度宝石是最优搭配。') +
        tSub('5 级共鸣阈值') +
        tTable(['总等级', '加成', '名称'],
            [['10',  '+5%',  '初级共鸣'],
             ['25',  '+10%', '中级共鸣'],
             ['50',  '+15%', '高级共鸣'],
             ['80',  '+20%', '顶级共鸣'],
             ['120', '+30%', '究极共鸣']]) +
        '<p>共鸣计算所有装备上镶嵌宝石的等级总和，达到阈值激活全队百分比加成。</p>' +
        tInfo('宝石可<b>无损移除</b>（不消耗任何道具），可放心镶嵌尝试不同搭配。') +
        tInfo('多种获取途径：爬塔 BOSS 层固定掉落，抽奖大厅概率产出高级宝石。');

    // ========== 五、宝石工坊 ==========
    var bodyForge =
        tSub('🔨 装备强化（+0 → +15）') +
        '<p>消耗金币提升装备等级，每级 +5% 基础属性。强化费用公式：<b>250 × (等级 + 1)<sup>2</sup></b>。</p>' +
        tTable(['强化区间', '成功率', '说明'],
            [['+0 → +3', '100%', '新手阶段，放心强化'],
             ['+4 → +6', '80%',  '小概率失败，成本低'],
             ['+7 → +9', '60%',  '中期门槛，建议用紫装以上'],
             ['+10 → +12', '40%', '高投入阶段，优先武器'],
             ['+13 → +15', '25%', '极限强化，金装专属']]) +
        '<p>强化失败<b>不降级不碎装</b>，可放心强化到 +15。</p>' +
        tSub('🔗 装备融合（3 合 1 升品）') +
        '<p>3 件同品质装备合成 1 件下一品质装备：</p>' +
        tTable(['融合路径', '金币消耗', '说明'],
            [['3 白 → 1 绿', '500G', '初期过渡'],
             ['3 绿 → 1 蓝', '2,000G', '推荐蓝装起步'],
             ['3 蓝 → 1 紫', '10,000G', '性价比最高'],
             ['3 紫 → 1 橙', '50,000G', '中后期主力'],
             ['3 橙 → 1 金', '250,000G', '终极目标']]) +
        tTip('3 蓝 → 紫是性价比最高的融合路径，紫装以上建议直接使用而非继续融合。') +
        tSub('分解（粉尘 + 重铸石，查表）') +
        tTable(['品质', '粉尘范围', '重铸石'],
            [['普通', '10-20',   '0'],
             ['优秀', '18-36',   '0'],
             ['稀有', '30-60',   '0'],
             ['史诗', '50-100',  '1'],
             ['传说', '75-150',  '3'],
             ['远古', '110-220', '5']]) +
        '<p>粉尘 = base + randInt(0, base)，base 查 DUST_BASE_TABLE = [10,18,30,50,75,110]。</p>' +
        tInfo('重铸石仅史诗及以上品质分解产出（紫1/橙3/金5），是稀有资源，请优先分解。') +
        tSub('重铸词条') +
        '<p>消耗：<b>200 粉尘 + 1 重铸石</b>（基础）。每锁定一个词条 +1 重铸石。</p>' +
        '<p>重铸后词条数量保持不变，数值由 rollQuality 决定。史诗装备有概率升级 rollQuality。</p>' +
        tTip('前期建议只锁高品质核心词条（如攻击%），节省重铸石。') +
        tSub('宝石合成') +
        '<p>3 个同类型同等级 → 1 个高 1 级（最多 15 级）。一键合成自动选择最优路径。副本只掉 L1 宝石。</p>' +
        tWarn('合成无回退，确认前请检查低等级宝石是否还在用。');

    // ========== 六、仓库系统 ==========
    var bodyInv =
        tSub('基础结构') +
        '<p>默认 2 页（40 格）。可花金币升级多次（最多 <b>10 页 200 格</b>）。每格 1 件装备，品质带边框颜色。</p>' +
        tSub('4 大筛选维度') +
        '<p>1. <b>品质 Tab</b>：全部/普通/优秀/稀有/史诗/传说/远古<br>' +
        '2. <b>部位 Tab</b>：全部/武器/副手/头盔/护甲/鞋子<br>' +
        '3. <b>收藏夹 Tab</b>：右键装备加入收藏<br>' +
        '4. <b>搜索框</b>：按名称模糊匹配</p>' +
        tSub('批量操作') +
        '<p>多选 → <b>批量卖出</b>（按品质价格）/ <b>批量分解</b>（按品质产资源）。</p>' +
        tSub('自动处理（设置中开启）') +
        '<p>战斗结束后，<b>白/绿</b>品质装备自动卖出或分解（可选），省去手动清理。</p>' +
        tInfo('装备可<b>加锁</b>（🔒图标）防止误卖/分解，<b>收藏</b>（⭐图标）方便快速查找。') +
        tInfo('仓库页数可通过天赋系统扩展，最多额外 +4 页。');

    // ========== 七、副本系统（爬塔+抽奖 双轨制）============
    var bodyDungeon =
        tSub('副本大厅两大入口') +
        '<p>副本大厅为 <b>爬塔·无尽</b> + <b>抽奖大厅</b> 双卡式入口，旧的金币/重铸石/宝石/装备四级副本已退役。</p>' +
        tSub('🏛 爬塔·无尽（消耗体力）') +
        tTable(['楼层类型', '频率', '奖励预览'],
            [['普通层', '每层', '少量金币'],
             ['精英层', '每 5 层', '金币 + 重铸石 + 2 抽奖石 + 2 宠物蛋石 + 30% 概率 Lv.1 宝石'],
             ['BOSS 层', '每 10 层', '金币 + 重铸石 + <b>10 抽奖石</b> + 5 宠物蛋石 + 2 宝石'],
             ['难度', '每层 +5%', '最高层记录永久保留']]) +
        '<p>每次挑战消耗 <b>5 体力</b>（爬塔固定消耗，与楼层数无关）。体力 5 分钟回 1 点，上限 200。</p>' +
        tInfo('爬塔是<b>抽奖石 + 高品装备 + 宝石</b>的主产出，boss 层必出 2 个抽奖石。') +
        tSub('🎰 抽奖大厅（消耗抽奖石）') +
        tTable(['类型', '单价', '品质范围', '十连保底', '附加产出'],
            [['普通抽奖', '1 🎫 / 次', '白 50% / 绿 30% / 蓝 15% / 紫 4% / 橙 1%', '≥1 紫', '金币 + 重铸石'],
             ['高级抽奖', '10 🎫 / 次', '蓝 5% / 紫 40% / 橙 40% / 金 15%', '≥1 橙', '大量金币 + 50% 掉 Lv.3+ 宝石']]) +
        '<p>抽奖石 <b>1</b> = 普通 1 次，<b>10</b> = 普通 10 连 / 高级 1 次，<b>100</b> = 高级 10 连。</p>' +
        '<p>装备等级随品质提升（紫 Lv.8-18 / 橙 Lv.12-25 / 金 Lv.22-50）。</p>' +
        tTip('高级十连必出橙装，是毕业装的稳定来源；普通抽奖性价比低，优先攒石头冲高级。') +
        tSub('📅 每日轮换副本') +
        '<p>每日轮换副本，不同日期可获得不同加成：</p>' +
        tTable(['星期', '加成效果', '说明'],
            [['星期一', '金币 ×3', '金币副本收益翻三倍，缺钱必刷'],
             ['星期三', '装备 ×2', '装备掉落翻倍，刷融合材料'],
             ['星期五', '经验 ×2', '英雄经验翻倍，快速升级']]) +
        '<p>其他日期为常规掉落。每日轮换副本是资源规划的重要参考。</p>' +
        tSub('网友怪物系统（38 个网友定制怪）') +
        '<p>主线关卡 + 爬塔中，玩家可遇到 <b>38 个网友定制怪物</b>（从最初的 24 个到最新 15 个）。</p>' +
        tTable(['触发位置', '触发概率', '机制'],
            [['主线关卡', '约 10%', '随机替换普通怪出场'],
             ['爬塔·精英层', '50%', '保留精英机制 + 网友造型'],
             ['爬塔·BOSS 层', '100%', 'BOSS 战力 + 网友定制名 + 个性描述'],
             ['装备副本（历史）', '已退役', '已由爬塔 + 抽奖替代']]) +
        '<p>网友怪拥有<b>独立造型 + 个性描述 + BOSS 潜力</b>，出没时屏幕中央会弹出<b>全屏横幅</b>（红金渐变 + 抖动入场 + 2.5 秒停留 + 滑出）。</p>' +
        tInfo('每遇到一个新网友怪，<b>怪物图鉴</b>就解锁一条新条目，含战力数据 + 个性描述 + BOSS 登场截图。') +
        tSub('副本推荐战力门槛') +
        '<p>爬塔的难度系数每层 +5%，第 30 层约为 <b>2.5×</b>，第 50 层约 <b>3.5×</b>。推荐战力 = 关卡基础 × 系数。</p>' +
        tWarn('体力溢出前一定要用掉。爬塔每 10 层稳定产出 10 抽奖石 + 5 宠物蛋石 + 2 宝石，是长线资源池。');

    // ========== 八、战力系统 ==========
    var bodyPower =
        tSub('战力计算公式（统一权重）') +
        '<p>单人战力 = <b>Σ 属性 × 权重</b></p>' +
        tTable(['属性', '权重'],
            [['攻击', '1.0'],
             ['防御', '1.2'],
             ['生命', '0.15'],
             ['速度', '0.8'],
             ['暴击', '5.0'],
             ['暴伤', '1.5'],
             ['伤害加成', '8.0'],
             ['伤害减免', '8.0'],
             ['元素精通', '6.0'],
             ['治疗率', '4.0']]) +
        tSub('装备评分公式（calcEquipScore）') +
        '<p><b>评分 = 基础属性分 + 词条分 + 宝石分</b>，再乘以两个加权系数：</p>' +
        tTable(['系数', '公式', '作用'],
            [['qualityMult', '查 quality.js TIER.statMult (非线性)', '品质越高评分越高。防止低品蓝装逆袭高品金装'],
             ['affCountMult', '1 + log10(N+1) × 0.5', '词条越多评分越高。鼓励多词条装备']]) +
        tTable(['品质', 'qualityMult', '示例：金装×10词条总系数'],
            [['普通（0）', '1.0',  '—'],
             ['优秀（1）', '1.15', '—'],
             ['稀有（2）', '1.3',  '—'],
             ['史诗（3）', '1.5',  '—'],
             ['传说（4）', '1.75', '—'],
             ['远古（5）', '2.0',  '×2.0 × 1.5 = 3.0×'],
             ['稀有（2）4 词条', '1.3', '×1.3 × 1.32 = 1.72×']]) +
        tInfo('同等级下：远古金装 3.0× ≥ 稀有蓝装 1.72×，保证高品装备评分始终更高。') +
        tSub('5 大战力来源') +
        '<p>1. <b>基础属性</b>（等级 × 1.02<sup>等级</sup>）<br>' +
        '2. <b>装备</b>（基础 + 词条 + 宝石 + 强化 × qualityMult × affCountMult）<br>' +
        '3. <b>天赋</b>（属性型节点 × value × level）<br>' +
        '4. <b>技能</b>（被动技能百分比加成）<br>' +
        '5. <b>羁绊</b>（同职业/同定位多英雄百分比加成）</p>' +
        '<p><b>强化加成：</b>每级强化 +5% 基础属性，+15 装备可获得 +75% 额外属性，是后期最直接的战力来源。</p>' +
        tInfo('推荐战力（关卡）= 上一关推荐 × 1.08，可作为升级/换装的参考线。') +
        tTip('战力不等于胜率。卡关时优先检查：1) 站位 2) 治疗 3) 抗性面板 4) BOSS 阶段机制。');

    // ========== 九、收集图鉴 ==========
    var bodyCodex =
        tSub('📖 怪物图鉴') +
        '<p>怪物图鉴收录所有战斗中遇到的怪物。共 <b>72 个怪物</b>，其中网友定制怪 <b>38 个</b>，精英怪若干。</p>' +
        tTable(['类型', '造型颜色', '出没位置', '解锁方式'],
            [['普通', '深红',  '主线 BOSS/普通位', '主线关卡 + 爬塔'],
             ['精英', '古铜',  '主线精英位 + 爬塔精英层', '主线第 5/15 关 + 爬塔每 5 层'],
             ['网友', '天蓝',  '✅ 可乱入任何位 (含 BOSS)', '主线随机 + 爬塔 50%/100% 替换']]) +
        tSub('4 大功能：搜索 / 筛选 / 详情 / 进度') +
        '<p><b>搜索框：</b>按怪物名称模糊匹配（含 icon 与 id）。<br>' +
        '<b>筛选器：</b>全部 / 普通 / 精英 / 网友 三档。<br>' +
        '<b>详情卡：</b>点击任一怪物弹出大卡片，含 6 大属性（生命/攻击/防御/速度/经验/金币）、出现章节、BOSS 潜力标记、个性描述。<br>' +
        '<b>进度：</b>头部显示「已收集 X/Y」与「网友怪 X/38」两个统计，激励全图鉴收集。</p>' +
        tSub('未遇到怪物的「锁」机制') +
        '<p>未解锁的怪物以<b>灰色剪影 + ? 图标</b>展示，名字、属性、描述都不可见。<br>' +
        '点击未解锁怪会弹出<b>橙色提示 banner</b>，告知该怪的<b>出没位置</b>（如「爬塔 5/15 层 50%」「主线第 8 章精英位」），引导玩家有目的地刷怪。</p>' +
        tTip('未解锁怪的全部信息在<b>击败一次后</b>立即解锁，无任何延迟。') +
        tSub('网友怪的特殊奖励') +
        '<p>每个网友怪都拥有<b>独立造型 + 个性描述</b>，全部 38 个由社区网友命名设计。<br>' +
        '最新一批 15 个网友怪（朝花夕拾 / 定时说说 / 弃C / 我的名字 / LitALS / 宣姬 / 奥霸天 / 大白鹅 / 热心网友小余 / WLS / 无咎 / 活得自在🧸 / 林有德 / 设计师 / 气急败坏的妃妃）已加入游戏池。</p>' +
        tInfo('爬塔第 5/15/25/35... 层（精英）有 50% 概率触发网友怪，第 10/20/30... 层（BOSS）100% 触发，是快速解锁图鉴的最佳途径。') +
        tInfo('图鉴数据自动同步到 <b>gameState.unlockedMonsters</b>，遇到即记录，无需手动添加。') +
        tSub('📖 装备图鉴') +
        '<p>装备图鉴记录所有已获得的装备类型，分 <b>5 大类别</b>（武器/副手/头盔/护甲/鞋子）追踪收集进度。每类装备都有独立的发现计数和收集百分比。</p>' +
        '<p>图鉴中可查看：装备名称、品质范围、掉落来源、强化上限等。全图鉴收集可获得隐藏成就奖励。</p>' +
        tSub('图鉴与家园联动') +
        '<p>图鉴中解锁的原版怪物会同步到 <b>家园</b>展示池（HOME_5 联动）。<br>' +
        '家园面板上能看到玩家已遇到的所有原版怪物的迷你图，是「图鉴→家园→战斗→图鉴」的正向循环。</p>';

    // ========== 十、成就系统 ============
    var bodyAchieve =
        tSub('🏆 25 个成就 / 8 大类别') +
        '<p>成就系统共 <b>25 个成就</b>分布在 8 个类别中，完成可获得<b>金币和宝石</b>奖励：</p>' +
        tTable(['类别', '成就数', '示例成就', '奖励'],
            [['战斗', '4', '击败 100/500/1000/5000 只怪物', '金币 + 宝石'],
             ['装备', '4', '获得 10/50/100/200 件紫+装备', '金币 + 宝石'],
             ['强化', '3', '强化达 +5/+10/+15', '金币 + 宝石'],
             ['融合', '3', '融合 5/20/50 次', '金币 + 宝石'],
             ['图鉴', '3', '解锁 10/30/50 个怪物', '金币 + 宝石'],
             ['副本', '3', '爬塔 10/30/50 层', '金币 + 宝石'],
             ['轮回', '3', '轮回 1/3/5 次', '金币 + 宝石'],
             ['收集', '2', '集齐 5 类装备各 1 件 / 全品质图鉴', '宝石']]) +
        tSub('查看进度') +
        '<p>在<b>成就界面</b>可查看每个成就的当前进度和完成条件。已完成成就可领取一次性奖励，奖励自动发放到背包。</p>' +
        tInfo('成就进度实时更新，完成时会有弹窗提示。全成就达成可获得隐藏称号。');

    // ========== 十一、轮回转生 ============
    var bodyRebirth =
        tSub('♻️ 轮回系统 = 重置新生 + 永久加成') +
        '<p><b>解锁条件：</b>通关第 100 章（击败最终 BOSS）后解锁。</p>' +
        '<p><b>轮回效果：</b></p>' +
        '<p>• 英雄等级重置为 1<br>' +
        '• 金币、装备、宝石等<b>部分资源</b>重置<br>' +
        '• 天赋点数重置（可重新分配）<br>' +
        '• 主线关卡重置至第 1 章<br>' +
        '• <b>轮回点数</b>根据当前进度结算发放</p>' +
        tSub('🛒 轮回商店（永久加成）') +
        '<p>消耗轮回点数可购买<b>永久加成</b>，所有加成在所有轮回中生效：</p>' +
        tTable(['加成项目', '效果', '每级消耗点数'],
            [['攻击增强', '全英雄攻击 +5%', '1 点'],
             ['防御增强', '全英雄防御 +5%', '1 点'],
             ['生命增强', '全英雄生命 +5%', '1 点'],
             ['速度增强', '全英雄速度 +5%', '1 点'],
             ['金币获取', '金币掉落 +10%', '2 点'],
             ['经验获取', '经验获取 +10%', '2 点'],
             ['品质提升', '装备品质 +0.2 档', '3 点'],
             ['额外槽位', '上阵位 +1', '5 点']]) +
        '<p><b>品质提升</b>：每级提升装备平均品质 0.2 档（如白→绿门槛降低），可叠加。<br>' +
        '<b>额外槽位：</b>最高可增加 2 个上阵位，使队伍扩展至 6 人。</p>' +
        tSub('多次轮回') +
        '<p>轮回后可再次挑战至第 100 章，每次轮回结算更多轮回点数。轮回次数无上限，每次轮回积累的永久加成越滚越强。</p>' +
        tTip('建议首次通关第 100 章后立即轮回，轮回点数购买「经验获取」+「金币获取」可大幅加速后续成长。') +
        tInfo('轮回后保留怪物图鉴和成就进度，不必重新收集。装备图鉴部分保留。');

    // ========== 十二、存档管理 ==========
    var bodySave =
        tSub('单槽位本地存档 + 导入导出 + 云存档') +
        '<p>保存游戏进度到本地存储，。支持导入导出备份。</p>' +
        tSub('导入导出') +
        '<p>设置界面 → <b>导出存档</b>：生成 Base64 加密字符串，可复制保存到任意文本。<br>' +
        '<b>导入存档</b>：粘贴字符串 → 验证 → 覆盖当前存档。</p>' +
        tInfo('导出字符串包含完整游戏数据（金币/装备/英雄/天赋/副本进度），请妥善保管。') +
        tSub('自动存档') +
        '<p>默认每 <b>15 秒</b>自动存档（可在设置调整 10/15/30/60 秒）。切屏/退出前必定存档一次。</p>' +
        tSub('离线奖励') +
        '<p>离线期间自动累积<b>金币和经验</b>奖励。离线收益按 <b>在线效率 × 离线时间</b>计算，最多累积 12 小时收益。</p>' +
        '<p>重新上线时弹出离线收益面板，可一键领取。离线收益不受副本/爬塔进度影响。</p>' +
        tWarn('重置游戏会清空当前槽位，请先导出存档再操作。');

    // ========== 十三、宠物系统 ============
    var bodyPet =
        tSub('🐾 宠物系统 = 抽奖 + 孵化 + 升星 + 碎片') +
        '<p>宠物系统包含：<b>宠物蛋抽奖、孵化、升星、碎片</b>四大模块。</p>' +
        tInfo('宠物蛋石通过爬塔 BOSS 层获得，宠物食物通过主线战斗掉落。') +
        tSub('🎰 宠物蛋抽奖') +
        '<p><b>普通抽蛋</b>（1 蛋石/次）：普通蛋 80%，稀有蛋 18%，史诗蛋 2%</p>' +
        '<p><b>高级抽蛋</b>（5 蛋石/次）：史诗蛋 65%，传说蛋 30%，神化蛋 5%</p>' +
        '<p>十连保底：高级十连至少 1 传说蛋。奖池含金币和锻造粉尘。</p>' +
        tSub('🥚 蛋仓库 + 孵化') +
        '<p>抽到的蛋存入「蛋仓库」，手动放入 3 个孵化槽。孵化完成后点击领取。</p>' +
        '<p>孵化时间随品阶提升：普通 5 分钟 → 神化 120 分钟</p>' +
        tSub('⭐ 宠物升星') +
        '<p>重复宠物自动分解为碎片。集齐碎片可升星：</p>' +
        '<p>0★→1★(10碎) 1★→2★(20碎) 2★→3★(40碎) 3★→4★(80碎) 4★→5★(160碎)</p>' +
        '<p>星级加成倍率：1.0x → 1.2x → 1.5x → 1.9x → 2.4x → 3.0x</p>' +
        tSub('🐾 上阵') +
        '<p>宠物上阵后全英雄获得被动加成。最多上阵 1 只，战斗中右上角显示图标。</p>' +
        tInfo('30 种宠物 × 5 品阶，全收集可获得隐藏成就。');

    // ========== 十四、实用贴士 ==========
    var bodyTip =
        tSub('7 日开荒路线') +
        '<p>Day 1：建立 2 人队伍（骑士 + 法师），推图至 1-10。<br>' +
        'Day 2：解锁刺客，3 人推图至 2-5。<br>' +
        'Day 3：解锁贤者，4 人推图至 3-1（补治疗）。<br>' +
        'Day 4-5：体力优先爬塔（攒抽奖石），爬塔/抽奖补充金币。<br>' +
        'Day 6-7：攒 100 抽奖石抽高级十连必出橙，开始点天赋 + 宝石共鸣。</p>' +
        tSub('常见误区') +
        tWarn('误区 1：只练 1 个职业 → 中后期羁绊收益极高，至少 2 个职业。') +
        tWarn('误区 2：宝石无脑堆攻击 → 前排坦克需要防御/生命宝石才站得住。') +
        tWarn('误区 3：天赋平均点 → 优先 1-2 个核心节点满级，再扩散。') +
        tWarn('误区 4：忽视装备评分 → 评分低的传说还不如评分高的稀有。') +
        tSub('强化策略') +
        tTip('强化优先级：武器 > 护甲 > 鞋子 > 头盔 > 副手。武器和护甲的收益最直接。') +
        tTip('融合策略：3 蓝 → 紫是性价比最高的路径，紫装以上直接使用，不要继续融合。') +
        tSub('套装协同搭配') +
        tTip('暗影套 + 狂战套 = 极致单体爆发，适合推 BOSS 层。') +
        tTip('圣光套 + 龙鳞套 = 铁壁坦克组合，爬塔生存首选。') +
        tTip('星辰套 + 任意输出套 = 技能循环加快，适合多波次战斗。') +
        tSub('轮回规划') +
        tTip('首次轮回优先购买「经验获取」和「金币获取」，加速二次成长。') +
        tTip('第二次轮回后补「品质提升」，可更快积累高品装备。') +
        tTip('额外槽位最后购买，前期 4 人队伍足以应对大多数内容。') +
        tSub('推图策略') +
        tTip('卡关第 5/15/20 关：检查 BOSS 抗性 + 治疗续航 + 站位（坦克前排）。') +
        tTip('卡关精英：注意精英特殊机制（反弹/分裂/召唤），用范围技能快速清场。') +
        tTip('BOSS 第 2 阶段：50% 血量以下释放狂暴/召唤，需要预存控制技能。') +
        tInfo('加入宝石共鸣后，所有英雄+5%~+30% 攻击，越后期越强。') +
        '<p style="text-align:center;color:#888;font-size:11px;margin-top:14px;">' +
        '📘 教程持续更新中 · 有问题可在设置界面反馈' +
        '</p>';

    // 数值格式化（万/亿单位，中文格式）
    function formatNumber(n) {
        if (n == null || isNaN(n)) return 'N/A';
        if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿';
        if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万';
        return String(Math.floor(n));
    }

    // ========== 章节预览数据与辅助函数 ==========
    var CHAPTER_GROUPS = [
        { name: '探索纪元', color: '#4caf50', range: [1, 8],    desc: '新手冒险，从草原走向更危险的区域' },
        { name: '英雄崛起', color: '#ff9800', range: [9, 20],   desc: '挑战更强的魔物，累积装备和经验' },
        { name: '深渊降临', color: '#f44336', range: [21, 35],  desc: '神魔交战，混沌之始' },
        { name: '归一之境', color: '#9c27b0', range: [36, 48],  desc: '万神殿与秩序之巅，真相的边缘' },
        { name: '圣光神界', color: '#ffd700', range: [49, 60],  desc: '踏入神界，挑战圣光与神祇' },
        { name: '时空秘境', color: '#2196f3', range: [61, 70],  desc: '穿越时间与镜面，探秘因果之环' },
        { name: '元素本源', color: '#e91e63', range: [71, 80],  desc: '火冰雷暗光风地水八大元素发源地' },
        { name: '魔界深渊', color: '#673ab7', range: [81, 90],  desc: '深入魔界，迎战魔龙与终极魔影' },
        { name: '终焉新生', color: '#00bcd4', range: [91, 100], desc: '万物归一，宇宙涅槃，创世原点' }
    ];

    function getChapterGroup(stage) {
        for (var i = 0; i < CHAPTER_GROUPS.length; i++) {
            if (stage >= CHAPTER_GROUPS[i].range[0] && stage <= CHAPTER_GROUPS[i].range[1]) return i;
        }
        return 0;
    }

    function buildChapterGrid(groupIdx) {
        var g = CHAPTER_GROUPS[groupIdx];
        if (!g) return '';
        var html = '';
        var maxStageReached = GameState.get('maxStage') || 0;
        for (var s = g.range[0]; s <= g.range[1]; s++) {
            var name = (typeof getStageName === 'function') ? getStageName(s) : 'Ch.' + s;
            var selected = (s === g.range[0]) ? ' selected' : '';
            var reached = (maxStageReached >= s) ? ' reached' : '';
            html += '<div class="chapter-cell' + selected + reached + '" data-stage="' + s + '" title="Ch.' + s + ' · ' + name + '" onclick="openChapterDetail(' + s + ')">' +
                '<div class="cc-num">' + s + '</div>' +
                '<div class="cc-name">' + name + '</div>' +
            '</div>';
        }
        return html;
    }

    function showChapterDetail(stage) {
        var name = (typeof getStageName === 'function') ? getStageName(stage) : 'Ch.' + stage;
        var gi = getChapterGroup(stage);
        var g = CHAPTER_GROUPS[gi];
        var recPower = (typeof getRecommendedPower === 'function') ? getRecommendedPower(stage) : 0;
        var bossStats = (typeof calcChapterMonsterStats === 'function') ? calcChapterMonsterStats(stage, 20, true, false) : null;
        var eliteStats = (typeof calcChapterMonsterStats === 'function') ? calcChapterMonsterStats(stage, 15, false, true) : null;

        // 剧情文本
        var storyData = (typeof CHAPTER_STORY !== 'undefined') ? CHAPTER_STORY[stage] : null;

        var html = '<div class="chapter-detail-header">' +
            '<span class="chapter-detail-num">Ch.' + stage + '</span>' +
            '<span class="chapter-detail-name">' + name + '</span>' +
            '<span class="chapter-detail-group" style="background:' + g.color + '22;color:' + g.color + ';">' + g.name + '</span>' +
        '</div>';

        // 剧情文本区域
        if (storyData) {
            html += '<div class="chapter-story-box" style="background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px;margin:8px 0;border-left:3px solid ' + g.color + ';">';
            if (storyData.desc) {
                html += '<div class="chapter-story-desc" style="font-size:12px;color:#ccc;line-height:1.7;margin-bottom:6px;">' +
                    '<span style="color:' + g.color + ';font-weight:bold;">📖 </span>' + storyData.desc +
                '</div>';
            }
            if (storyData.boss) {
                html += '<div class="chapter-story-boss" style="font-size:11px;color:#ff5252;line-height:1.6;padding:6px 8px;background:rgba(255,82,82,0.06);border-radius:6px;">' +
                    '<span style="font-weight:bold;">👹 BOSS </span>' + storyData.boss +
                '</div>';
            }
            html += '</div>';
        }

        html += '<p class="chapter-detail-desc">' + g.desc + '。每章 20 关，<b>第 5/15 关</b>为精英怪，<b>第 10/20 关</b>为 BOSS。</p>';

        // 数据表
        html += '<div class="chapter-detail-stats">' +
            '<div class="chapter-detail-stat">' +
                '<div class="chapter-detail-stat-label">推荐战力</div>' +
                '<div class="chapter-detail-stat-value">' + (recPower > 0 ? formatNumber(recPower) : 'N/A') + '</div>' +
            '</div>' +
            (bossStats ? '<div class="chapter-detail-stat">' +
                '<div class="chapter-detail-stat-label">BOSS HP</div>' +
                '<div class="chapter-detail-stat-value">' + formatNumber(bossStats.hp) + '</div>' +
            '</div>' : '') +
            (bossStats ? '<div class="chapter-detail-stat">' +
                '<div class="chapter-detail-stat-label">BOSS 攻击</div>' +
                '<div class="chapter-detail-stat-value">' + formatNumber(bossStats.atk) + '</div>' +
            '</div>' : '') +
        '</div>';

        // 机制说明
        var tips = [];
        if (stage >= 5) {
            tips.push('⚔️ <b>第 5 章起</b>精英怪带特殊机制（减速/暗影步）');
        }
        if (stage >= 5) {
            tips.push('🔥 <b>第 5 章起</b>难度每章翻倍，需持续提升装备评分');
        }
        if (stage === 10 || stage === 20 || stage === 30) {
            tips.push('👹 <b>第 10/20/30 章</b>BOSS 含 4 阶段技能（重击/地震/狂暴/魔）');
        }
        if (stage >= 49 && stage <= 60) {
            tips.push('✨ <b>圣光神界</b>神祇战场，推荐 87万+ 战力');
        }
        if (stage >= 61 && stage <= 70) {
            tips.push('⏳ <b>时空秘境</b>需对时间/空间属性有抗性');
        }
        if (stage >= 71 && stage <= 80) {
            tips.push('🌈 <b>元素本源</b>对应 8 大元素本相，可考虑元素精通词条');
        }
        if (stage >= 81 && stage <= 90) {
            tips.push('👹 <b>魔界深渊</b>暗影抗性是关键');
        }
        if (stage >= 91) {
            tips.push('🌟 <b>终焉篇</b>终极内容，BOSS 血量达 8.5M，需极限词条');
        }
        if (tips.length > 0) {
            html += '<div class="chapter-detail-mechanics">' + tips.join('<br>') + '</div>';
        }

        return html;
    }

    var bodyChapter =
        '<div class="chapter-preview">' +
            tSub('100 章 · 9 大篇章 · 2000 关卡') +
            '<p>从新手草原到创世原点，跨越 5 个纪元。每章 20 关（10/20 关 BOSS，5/15 关精英），难度按章节递增。</p>' +
            // 篇章切换 tab
            '<div class="chapter-group-tabs" id="chapter-group-tabs">' +
                CHAPTER_GROUPS.map(function(g, i) {
                    return '<span class="chapter-group-tab' + (i === 0 ? ' active' : '') + '" data-gi="' + i + '" onclick="switchChapterGroup(' + i + ')">' +
                        g.name + ' <small>Ch.' + g.range[0] + '-' + g.range[1] + '</small>' +
                    '</span>';
                }).join('') +
            '</div>' +
            // 章节网格
            '<div class="chapter-grid" id="chapter-grid">' + buildChapterGrid(0) + '</div>' +
            // 详情
            '<div class="chapter-detail" id="chapter-detail">' + showChapterDetail(1) + '</div>' +
        '</div>';

    // ★ v3.5.1 篇章切换 + 章节详情内联显示
    window.switchChapterGroup = function(gi) {
        // 切换 tab 高亮
        var tabs = document.querySelectorAll('#chapter-group-tabs .chapter-group-tab');
        if (tabs) { for (var ti = 0; ti < tabs.length; ti++) tabs[ti].classList.remove('active'); }
        var tab = document.querySelector('#chapter-group-tabs .chapter-group-tab[data-gi="' + gi + '"]');
        if (tab) tab.classList.add('active');
        // 重建章节网格
        var grid = document.getElementById('chapter-grid');
        if (grid && typeof buildChapterGrid === 'function') grid.innerHTML = buildChapterGrid(gi);
        // 重置详情为当前组第一个章节
        var g = CHAPTER_GROUPS[gi];
        if (g && typeof showChapterDetail === 'function') {
            var detail = document.getElementById('chapter-detail');
            if (detail) detail.innerHTML = showChapterDetail(g.range[0]);
        }
    };

    // 章节点击 → 内联显示详情（不弹窗）
    window.openChapterDetail = function(stage) {
        var detail = document.getElementById('chapter-detail');
        if (detail && typeof showChapterDetail === 'function') {
            detail.innerHTML = showChapterDetail(stage);
        }
    };

    bodyMap = {
        hero:    bodyHero,
        battle:  bodyBattle,
        equip:   bodyEquip,
        gem:     bodyGem,
        forge:   bodyForge,
        inv:     bodyInv,
        dungeon: bodyDungeon,
        power:   bodyPower,
        codex:   bodyCodex,
        achieve: bodyAchieve,
        rebirth: bodyRebirth,
        save:    bodySave,
        pet:     bodyPet,
        tip:     bodyTip,
        chapter: bodyChapter
    };

    // 渲染侧边栏（使用 javascript:void(0) 避免锚点跳转+URL hash 变化）
    var sidebar = TUTORIAL_NAV.map(function(n) {
        return '<a href="javascript:void(0);" class="tut-nav-item" data-id="' + n.id + '">' +
            '<span class="tut-nav-icon" style="background:' + n.color + '22;color:' + n.color + ';">' + n.icon + '</span>' +
            '<span class="tut-nav-name">' + n.name + '</span>' +
        '</a>';
    }).join('');

    // 渲染主内容
    var sections = TUTORIAL_NAV.map(function(n) {
        return tCard(n.id, n.color, n.name, bodyMap[n.id]);
    }).join('');

    // ★ v3.5.1 卡片式攻略（覆盖旧的长滚动教程）
    window.closeModal = function() {
        var modals = document.querySelectorAll('.modal-overlay');
        for (var i = 0; i < modals.length; i++) { modals[i].remove(); }
    }
    var TUTORIAL_CARDS = [
        { id:'hero',    icon:'🎖️', name:'英雄系统',   color:'#4fc3f7', desc:'8 大职业 · 技能加点 · 装备槽位强化' },
        { id:'battle',  icon:'⚔️', name:'战斗系统',   color:'#e040fb', desc:'自动推图 · 暂停换阵 · 战斗日志' },
        { id:'equip',   icon:'🛡️', name:'装备系统',   color:'#ff9800', desc:'双基础属性 · 品质词条 · 槽位强化' },
        { id:'gem',     icon:'💎', name:'宝石系统',   color:'#2196f3', desc:'宝石镶嵌 · 合成升阶 · 共鸣加成' },
        { id:'forge',   icon:'🔨', name:'宝石工坊',   color:'#f44336', desc:'宝石合成 · 镶嵌 · 共鸣 · 装备升阶' },
        { id:'inv',     icon:'📦', name:'仓库系统',   color:'#ffeb3b', desc:'智能分类 · 装备对比 · 收藏锁定' },
        { id:'dungeon', icon:'🏰', name:'副本系统',   color:'#9c27b0', desc:'爬塔挑战 · 抽奖大厅 · 轮换BOSS' },
        { id:'power',   icon:'📊', name:'战力系统',   color:'#ffd700', desc:'评分公式 · 装备+宝石+天赋' },
        { id:'codex',   icon:'📖', name:'怪物图鉴',   color:'#ce93d8', desc:'全怪物图鉴 · 搜索 · 进度追踪' },
        { id:'achieve', icon:'🏆', name:'成就轮回',   color:'#ff6f00', desc:'达成里程碑 · 丰厚奖励' },
        { id:'rebirth', icon:'♻️', name:'轮回转生',   color:'#e040fb', desc:'永久属性加成 · 轮回商店' },
        { id:'save',    icon:'💾', name:'存档管理',   color:'#4caf50', desc:'云存档 · GitHub存储 · PIN保护' },
        { id:'pet',     icon:'🐾', name:'宠物系统',  color:'#ff9800', desc:'30 宠物 · 蛋石抽奖 · 孵化 · 升星' },
        { id:'guide',   icon:'💡', name:'实用贴士',   color:'#8bc34a', desc:'开荒路线 · 强化策略 · 常见问题' },
        { id:'chapter', icon:'🗺️', name:'章节预览',   color:'#00bcd4', desc:'全部章节预览 · 篇章分类' }
    ];
    
    // Also add guide→tip alias in bodyMap
    bodyMap['guide'] = bodyTip;
    
    window.openTutorialCard = function(cId) {
        closeModal();
        var card = null;
        for (var i = 0; i < TUTORIAL_CARDS.length; i++) {
            if (TUTORIAL_CARDS[i].id === cId) { card = TUTORIAL_CARDS[i]; break; }
        }
        if (!card) return;
        var body = (typeof bodyMap !== 'undefined' && bodyMap[card.id]) ? bodyMap[card.id] : '<p style="color:#888;text-align:center;">加载中...</p>';
        setTimeout(function() {
            var h = '<div class="modal-overlay" onclick="if(event.target===this)closeModal()">' +
                '<div class="modal-content tut-popup" style="background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid ' + card.color + ';border-radius:14px;padding:0;overflow:hidden;">' +
                '<div class="header-wrap" style="background:' + card.color + ';padding:10px 14px;text-align:center;position:relative;">' +
                '<div style="font-size:14px;font-weight:bold;color:#fff;">' + card.icon + ' ' + card.name + '</div>' +
                '<div style="font-size:9px;color:rgba(255,255,255,0.7);margin-top:2px;">' + card.desc + '</div>' +
                '<span class="close-btn" onclick="closeModal(); window.openTutorialGrid()">✕</span></div>' +
                '<div style="padding:12px;">' + body + '</div>' +
                '<div style="padding:8px 12px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">' +
                '<button class="btn" style="border-color:#888;color:#888;font-size:10px;padding:4px 14px;" onclick="closeModal(); window.openTutorialGrid()">← 返回列表</button></div></div></div>';
            var d = document.createElement('div'); d.innerHTML = h;
            document.body.appendChild(d.firstElementChild);
        }, 30);
    }
    window.openTutorialGrid = function() {
        var _grids = '';
        for (var i = 0; i < TUTORIAL_CARDS.length; i++) {
            var c = TUTORIAL_CARDS[i];
            _grids += '<div class="tut-grid-card" onclick="openTutorialCard(\'' + c.id + '\')">' +
            '<span class="icon">' + c.icon + '</span>' +
            '<span class="name" style="color:' + c.color + ';">' + c.name + '</span>' +
            '<span class="badge">' + c.desc + '</span></div>';
        }
        var html = '<div class="modal-overlay" onclick="if(event.target===this)closeModal()">' +
        '<div class="modal-content" style="max-width:380px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ffd700;border-radius:14px;padding:0;overflow-y:auto;position:relative;max-height:80vh;">' +
        '<div style="background:linear-gradient(135deg,#ffd700,#ff9800);padding:10px 14px;text-align:center;">' +
        '<div style="font-size:15px;font-weight:bold;color:#1a1a2e;">📘 游戏攻略</div>' +
        '<div style="font-size:9px;color:rgba(0,0,0,0.5);margin-top:2px;">点击卡片查看详情</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeModal()">✕</span></div>' +
        '<div style="padding:10px;"><div class="tut-grid">' + _grids + '</div></div></div></div>';
        var old = document.getElementById('tut-overlay');
        if (old) old.remove();
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        document.body.appendChild(tmp.firstElementChild);
    };
    window.openTutorialGrid();
    return;
}


// ========================================================================
// ★ v2.6.3调试工具 (开发用,密码128555213 解锁弹窗卡片)
// ========================================================================

var DEBUG_PWD_HASH = "67c5a7f409283016d48ab2923dcb74db3db26ee3463377174b3dd9c741dd4fa8"; // SHA-256 of "cqc2026:128555213" (salt:pwd), not the raw password

//1.打开密码输入弹窗
function openDebugPasswordModal() {
 if (typeof closeDebugModal === "function") closeDebugModal();
 var html = `<div class="modal-overlay" id="debug-pwd-modal" onclick="if(event.target===this)closeDebugPwdModal()"><div class="modal-content" onclick="event.stopPropagation()" style="max-width:380px;padding:0;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ff9800;border-radius:14px;box-shadow:08px32px rgba(255,152,0,0.3);overflow:hidden;position:relative;">
  <!-- 标题带 -->
  <div style="background:linear-gradient(135deg,#ff9800,#f44336);padding:14px18px;text-align:center;">
   <div style="font-size:18px;font-weight:bold;color:#fff;text-shadow:02px4px rgba(0,0,0,0.4);">🔒开发者选项</div>
   <div style="font-size:11px;color:rgba(255,255,255,0.85);margin-top:3px;letter-spacing:1px;">DEV PANEL · v6.2</div>
  </div>
  <span style="position:absolute;top:8px;right:10px;font-size:22px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeDebugPwdModal()">✕</span>
  <!-- 询问体 -->
  <div style="padding:24px20px16px;">
   <div style="font-size:13px;color:#ccc;margin-bottom:14px;line-height:1.5;">本面板仅供开发者测试使用。<br>请输入密码解锁:</div>
   <input id="debug-pwd-input" type="password" inputmode="numeric" placeholder="请输入密码" autocomplete="off" style="width:100%;padding:10px14px;font-size:16px;background:rgba(0,0,0,0.5);border:1px solid #ff9800;border-radius:8px;color:#ffd700;font-family:monospace;letter-spacing:3px;text-align:center;box-sizing:border-box;" onkeydown="if(event.key==='Enter')debugUnlockPanel()">
  </div>
  <!-- 按钮 -->
  <div style="display:flex;gap:8px;padding:020px20px;">
   <button class="btn" style="flex:1;background:rgba(255,255,255,0.08);color:#aaa;border:1px solid rgba(255,255,255,0.15);" onclick="closeDebugPwdModal()">取消</button>
   <button class="btn btn-gold" style="flex:2;background:linear-gradient(135deg,#ff9800,#f44336);border:none;color:#fff;font-weight:bold;letter-spacing:2px;" onclick="debugUnlockPanel()">🔓 解锁</button>
  </div>
  </div></div>`;
 var div = document.createElement("div");
 div.innerHTML = html;
 document.body.appendChild(div.firstElementChild);
 setTimeout(function() { var inp = document.getElementById("debug-pwd-input"); if (inp) inp.focus(); },100);
}

//2.关闭密码弹窗
function closeDebugPwdModal() {
 var m = document.getElementById("debug-pwd-modal"); if (m) m.remove();
}

//3.密码校验 +渲染调试工具面板 (前端SHA-256,加 salt 防彩虹表)
function debugUnlockPanel() {
 var input = document.getElementById("debug-pwd-input");
 if (!input) return;
 var pwd = (input.value || "").trim();
 // ★ v2.6.3密码不再明文存储, 用 SHA-256(salt:pwd) 比对
 var salted = 'cqc2026:' + pwd;
 var hash = '';
 if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
 //异步 SHA-256 (浏览器原生)
 window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(salted)).then(function(buf) {
 var hex = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
 _debugCheckHash(hex, input);
 });
 } else {
 //旧浏览器降级 (用纯 JS 实现简单 hash, 仅防误输入)
 var h =0; for (var i =0; i < salted.length; i++) { h = ((h <<5) -h) + salted.charCodeAt(i); h |=0; }
 hash = String(h);
 _debugCheckHash(hash, input);
 }
}

function _debugCheckHash(hash, input) {
 if (hash !== DEBUG_PWD_HASH) {
 input.value = "";
 input.style.borderColor = "#f44336";
 input.style.animation = "shake0.4s";
 setTimeout(function() { if (input) { input.style.borderColor = "#ff9800"; input.style.animation = ""; } },500);
 showToast("密码错误", "error");
 return;
 }
 closeDebugPwdModal();
 showToast("调试面板已解锁", "success");
 _renderDebugPanel();
}

//4.渲染调试工具面板 (弹窗卡片样式)
function _renderDebugPanel() {
 var html = `<div class="modal-overlay" id="debug-panel-modal" onclick="if(event.target===this)closeDebugModal()"><div class="modal-content" onclick="event.stopPropagation()" style="max-width:480px;max-height:90vh;overflow-y:auto;padding:0;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ff9800;border-radius:14px;box-shadow:0 8px 32px rgba(255,152,0,0.3);">
   <!-- 标题带 -->
   <div style="background:linear-gradient(135deg,#ff9800,#f44336);padding:14px18px;display:flex;align-items:center;justify-content:space-between;">
    <div>
     <div style="font-size:16px;font-weight:bold;color:#fff;text-shadow:02px4px rgba(0,0,0,0.4);">🛠开发者工具 · v6.2</div>
     <div style="font-size:10px;color:rgba(255,255,255,0.85);margin-top:2px;letter-spacing:1px;">DEV PANEL · 刷资源 / 跳章节 / 宠物 / 状态</div>
    </div>
    <button onclick="closeDebugModal()" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);color:#fff;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;line-height:1;">×</button>
   </div>
   <div style="padding:16px;">
    <!-- 工具1: 刷全资源（每项独占一行+独立按钮） -->
    <div style="background:rgba(255,152,0,0.08);border:1px solid rgba(255,152,0,0.3);border-radius:8px;padding:12px;margin-bottom:10px;">
     <div style="font-size:13px;font-weight:bold;color:#ff9800;margin-bottom:8px;">💎 刷资源</div>
     <div style="display:grid;grid-template-columns:1fr;gap:4px;">
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">💰</span><span style="font-size:11px;color:#ffd700;width:40px;">金币</span><input id="dbg-gold" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(255,152,0,0.3);border:1px solid #ff9800;color:#ff9800;font-size:10px;padding:4px 10px;" onclick="debugAddResource('gold')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">💠</span><span style="font-size:11px;color:#80cbc4;width:40px;">粉尘</span><input id="dbg-dust" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(255,152,0,0.3);border:1px solid #ff9800;color:#ff9800;font-size:10px;padding:4px 10px;" onclick="debugAddResource('dust')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">💎</span><span style="font-size:11px;color:#fff;width:40px;">重铸石</span><input id="dbg-stone" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(255,152,0,0.3);border:1px solid #ff9800;color:#ff9800;font-size:10px;padding:4px 10px;" onclick="debugAddResource('stone')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">🎰</span><span style="font-size:11px;color:#ffcc80;width:40px;">抽奖石</span><input id="dbg-lottery" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(255,152,0,0.3);border:1px solid #ff9800;color:#ff9800;font-size:10px;padding:4px 10px;" onclick="debugAddResource('lottery')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">⬆️</span><span style="font-size:11px;color:#b0bec5;width:40px;">升级石</span><input id="dbg-upgrade" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(255,152,0,0.3);border:1px solid #ff9800;color:#ff9800;font-size:10px;padding:4px 10px;" onclick="debugAddResource('upgrade')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">🌿</span><span style="font-size:11px;color:#4caf50;width:40px;">草药</span><input id="dbg-herb" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#4caf50;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(76,175,80,0.3);border:1px solid #4caf50;color:#4caf50;font-size:10px;padding:4px 10px;" onclick="debugAddResource('herb')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">🪨</span><span style="font-size:11px;color:#78909c;width:40px;">矿石</span><input id="dbg-ore" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#78909c;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(120,144,155,0.3);border:1px solid #78909c;color:#78909c;font-size:10px;padding:4px 10px;" onclick="debugAddResource('ore')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">🍖</span><span style="font-size:11px;color:#ff7043;width:40px;">宠物食物</span><input id="dbg-petfood" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ff7043;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(255,112,67,0.3);border:1px solid #ff7043;color:#ff7043;font-size:10px;padding:4px 10px;" onclick="debugAddResource('petfood')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">🥚</span><span style="font-size:11px;color:#ffd700;width:40px;">宠物蛋石</span><input id="dbg-egg" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(255,215,0,0.3);border:1px solid #ffd700;color:#ffd700;font-size:10px;padding:4px 10px;" onclick="debugAddResource('egg')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">💎</span><span style="font-size:11px;color:#ce93f8;width:40px;">宝石</span><input id="dbg-gems" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;font-size:12px;padding:4px 8px;text-align:right;width:60px;"><span style="font-size:9px;color:#888;">级</span><input id="dbg-gemlv" type="number" value="5" min="1" max="9" style="width:35px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;font-size:11px;padding:4px;text-align:center;"><button class="btn" style="background:rgba(156,39,176,0.3);border:1px solid #9c27b0;color:#ce93f8;font-size:10px;padding:4px 10px;" onclick="debugAddResource('gems')">+发放</button></div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;"><span style="font-size:14px;">💎</span><span style="font-size:11px;color:#ef9a9a;width:40px;">钻石</span><input id="dbg-diamond" type="number" value="0" min="0" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ef9a9a;font-size:12px;padding:4px 8px;text-align:right;"><button class="btn" style="background:rgba(244,67,54,0.3);border:1px solid #f44336;color:#f44336;font-size:10px;padding:4px 10px;" onclick="debugAddResource('diamond')">+发放</button></div>
     </div>
    </div>
    <!-- 工具2: 跳章节 -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
     <div style="background:rgba(156,39,176,0.08);border:1px solid rgba(156,39,176,0.3);border-radius:8px;padding:10px;">
      <div style="font-size:11px;font-weight:bold;color:#ce93f8;margin-bottom:6px;">🚀 跳章节</div>
      <div style="display:flex;gap:4px;"><input id="dbg-chapter" type="number" value="1" min="1" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;padding:4px 6px;font-size:11px;text-align:center;"><button class="btn" style="background:linear-gradient(135deg,#7b1fa2,#4527a0);border:none;color:#fff;font-weight:bold;padding:4px10px;font-size:10px;" onclick="debugJumpChapter()">跳转</button></div>
     </div>
     <div style="background:rgba(76,175,80,0.08);border:1px solid rgba(76,175,80,0.3);border-radius:8px;padding:10px;">
      <div style="font-size:11px;font-weight:bold;color:#66bb6a;margin-bottom:6px;">⚡ 体力</div>
      <div style="display:flex;gap:4px;"><input id="dbg-stamina-amt" type="number" value="0" min="0" max="240" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#66bb6a;padding:4px 6px;font-size:11px;text-align:center;"><button class="btn" style="background:linear-gradient(135deg,#388e3c,#2e7d32);border:none;color:#fff;font-weight:bold;padding:4px10px;font-size:10px;" onclick="debugGrantStamina()">补充</button></div>
      <div style="font-size:9px;color:#666;margin-top:4px;">当前: <span id="dbg-cur-stamina">0</span>/240</div>
     </div>
    </div>
    <!-- 工具3: 快捷按钮行 -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
     <div style="background:rgba(33,150,243,0.08);border:1px solid rgba(33,150,243,0.3);border-radius:8px;padding:10px;">
      <div style="font-size:11px;font-weight:bold;color:#4fc3f7;margin-bottom:6px;">⚔ 全英雄满级+满技能</div>
      <button class="btn" style="width:100%;background:linear-gradient(135deg,#1976d2,#0288d1);border:none;color:#fff;font-weight:bold;padding:6px;font-size:10px;" onclick="debugMaxLevelHeroes()">执行</button>
     </div>
     <div style="background:rgba(244,67,54,0.08);border:1px solid rgba(244,67,54,0.3);border-radius:8px;padding:10px;">
      <div style="font-size:11px;font-weight:bold;color:#ef5350;margin-bottom:6px;">🔓 重置调试标记</div>
      <button class="btn" style="width:100%;background:rgba(85,85,85,0.5);border:1px solid #ef5350;color:#ef5350;font-weight:bold;padding:6px;font-size:10px;" onclick="debugResetDebugFlag()">重置</button>
     </div>
    </div>
    <!-- 工具4: 宠物/爬塔 -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
     <div style="background:rgba(255,152,0,0.08);border:1px solid rgba(255,152,0,0.3);border-radius:8px;padding:10px;">
      <div style="font-size:11px;font-weight:bold;color:#ffd700;margin-bottom:6px;">🐾 宠物蛋孵化</div>
      <div style="display:flex;gap:4px;"><button class="btn" style="flex:1;background:linear-gradient(135deg,#e65100,#bf360c);border:none;color:#fff;font-weight:bold;padding:6px;font-size:10px;" onclick="var g=GameState.getAll();if(g.petIncubators){for(var _i=0;_i<3;_i++){g.petIncubators[_i]={tier:null,hatchTime:0}}};showToast('孵化已重置','success')">重置孵化</button><button class="btn" style="flex:1;background:linear-gradient(135deg,#ff9800,#e65100);border:none;color:#fff;font-weight:bold;padding:6px;font-size:10px;" onclick="var g=GameState.getAll();if(g.petIncubators){for(var _i=0;_i<3;_i++){if(g.petIncubators[_i]&&g.petIncubators[_i].hatchTime>0)g.petIncubators[_i].hatchTime=Date.now()-1000}};showToast('孵化已完成','success');if(typeof showPetScreen==='function')showPetScreen()">完成孵化</button><button class="btn" style="flex:1;background:linear-gradient(135deg,#4caf50,#2e7d32);border:none;color:#fff;font-weight:bold;padding:6px;font-size:10px;" onclick="GameState.mutate('petEggStones',function(v){return(v||0)+100});showToast('获得100蛋石','success')">+100蛋石</button></div>
     </div>
     <div style="background:rgba(156,39,176,0.08);border:1px solid rgba(156,39,176,0.3);border-radius:8px;padding:10px;">
      <div style="font-size:11px;font-weight:bold;color:#ce93f8;margin-bottom:6px;">🏛 爬塔跳层</div>
      <div style="display:flex;gap:4px;"><input id="dbg-tower" type="number" value="0" min="1" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#ffd700;padding:4px 6px;font-size:11px;text-align:center;"><button class="btn" style="background:linear-gradient(135deg,#7b1fa2,#4527a0);border:none;color:#fff;font-weight:bold;padding:4px10px;font-size:10px;" onclick="debugJumpTower()">跳转</button></div>
     </div>
    </div>
    <!-- 工具5: 状态总览 -->
    <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;margin-bottom:10px;" id="dbg-status-area">
     <div style="font-size:11px;font-weight:bold;color:#888;margin-bottom:4px;">📊 状态总览</div>
     <div style="font-size:9px;color:#666;font-family:monospace;" id="dbg-status-text">加载中...</div>
    </div>
   </div>
   <div style="background:rgba(0,0,0,0.3);padding:8px16px;font-size:10px;color:#888;text-align:center;border-top:1px solid rgba(255,152,0,0.2);">
    关闭后再次打开需重新输入密码 · 仅供开发测试
   </div>
   </div></div>`;
  var div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
  // 刷新状态总览
  if (typeof debugRefreshStatus === 'function') debugRefreshStatus();
 }

 // 跳转到指定章节
 function debugJumpChapter() {
  var c = parseInt(document.getElementById('dbg-chapter').value) || 1;
  GameState.set('stage', c);
  GameState.set('wave', 1);
  GameState.set('maxStage', Math.max(GameState.get('maxStage') || 0, c));
  if (typeof saveGame === 'function') saveGame(GameState.getAll());
  showToast('已跳转到第 ' + c + ' 章', 'success');
  // 强制刷新战斗
  if (typeof BattleManager !== 'undefined') {
      BattleManager.stopBattle();
      BattleManager.setTeam();
      BattleManager.startBattle();
  }
  if (typeof debugRefreshStatus === 'function') debugRefreshStatus();
 }

 // 跳转爬塔层数
 function debugJumpTower() {
  var f = parseInt(document.getElementById('dbg-tower').value) || 1;
  var tower = GameState.get('tower');
  if (!tower) {
    GameState.set('tower', { currentFloor: 1, maxFloor: 1, bestFloor: 1, totalRuns: 0, totalDeaths: 0, lastReward: null });
    tower = GameState.get('tower');
  }
  tower.currentFloor = f;
  tower.maxFloor = Math.max(tower.maxFloor, f);
  tower.bestFloor = Math.max(tower.bestFloor, f);
  GameState.set('tower', tower);
  if (typeof saveGame === 'function') saveGame(GameState.getAll());
  showToast('已跳转到爬塔第 ' + f + ' 层', 'success');
  if (typeof debugRefreshStatus === 'function') debugRefreshStatus();
 }

 // 刷新状态总览
 function debugRefreshStatus() {
  var el = document.getElementById('dbg-status-text');
  if (!el) return;
  if (!GameState.getAll()) { el.textContent = 'gameState 未加载'; return; }
  var txt = '章节 ' + (GameState.get('stage') || 1) + ' · 波次 ' + (GameState.get('wave') || 1) + ' · 金币 ' + Math.floor(GameState.get('gold') || 0);
  txt += ' · 体力 ' + (GameState.get('stamina') || 0) + '/240';
  txt += ' · 宠物蛋石 ' + (GameState.get('petEggStones') || 0) + ' · 食物 ' + (GameState.get('petFood') || 0);
  txt += ' · 爬塔 ' + ((GameState.get('tower') && GameState.get('tower').currentFloor) || 1) + ' 层';
  if (GameState.get('pets')) txt += ' · 宠物 ' + GameState.get('pets').length + '/' + 6;
  el.textContent = txt;
  }
 
  //5.关闭调试面板 (清空密码状态)

// ========== 史记窗口 ==========
function openGameHistory() {
    if (typeof CQC_HISTORY === 'undefined') return;
    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()">' +
        '<div class="modal-content" style="max-width:500px;max-height:85vh;overflow-y:auto;padding:0;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ffd700;border-radius:16px;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#1a1a2e,#0f0f23);padding:16px 20px;border-bottom:2px solid rgba(255,215,0,0.3);position:sticky;top:0;z-index:5;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:24px;">📜</span>' +
        '<div><div style="font-size:16px;font-weight:bold;color:#ffd700;">永恒英灵 · 史记</div><div style="font-size:10px;color:#888;">开发历程全记录</div></div>' +
        '</div>' +
        '<span style="font-size:20px;color:rgba(255,255,255,0.5);cursor:pointer;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span>' +
        '</div></div>' +
        '<div style="padding:16px;">' +
        '<div style="margin-bottom:16px;text-align:center;">' +
        '<button class="btn" style="background:linear-gradient(135deg,#9c27b0,#e91e63);border:none;color:#fff;padding:10px 24px;border-radius:10px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:0 4px 16px rgba(233,30,99,0.4);" onclick="openHonorWall()">🏆 公示名单</button></div>' +
        '<div style="border-left:2px solid rgba(255,215,0,0.3);padding-left:16px;">';
    
    for (var i = CQC_HISTORY.length - 1; i >= 0; i--) {
        var h = CQC_HISTORY[i];
        html += '<div style="margin-bottom:14px;position:relative;">' +
            '<div style="position:absolute;left:-22px;top:4px;width:12px;height:12px;background:#ffd700;border-radius:50%;box-shadow:0 0 8px rgba(255,215,0,0.6);"></div>' +
            '<div style="font-size:10px;color:#ff9800;margin-bottom:2px;">' + h.date + '</div>' +
            '<div style="font-size:13px;font-weight:bold;color:#ffd700;margin-bottom:4px;">' + h.icon + ' ' + h.title + '</div>' +
            '<div style="font-size:11px;color:#aaa;line-height:1.6;white-space:pre-wrap;">' + h.content + '</div></div>';
    }
    html += '</div></div></div></div>';
    var div = document.createElement('div'); div.innerHTML = html; document.body.appendChild(div.firstElementChild);
}

function openHonorWall() {
    if (typeof CQC_HONOR_LIST === 'undefined') return;
    var particlesHtml = '';
    for (var pi=0; pi<30; pi++) {
        particlesHtml += '<div style="position:absolute;top:'+(Math.random()*100)+'%;left:'+(Math.random()*100)+'%;width:2px;height:2px;background:rgba(255,215,0,'+(0.2+Math.random()*0.5)+');border-radius:50%;animation:fh'+pi+' '+(3+Math.random()*4)+'s linear infinite;animation-delay:'+(Math.random()*3)+'s;"></div>';
    }
    var html = '<div class="modal-overlay" style="z-index:10001;" onclick="if(event.target===this)this.remove()">' +
        '<div class="modal-content" style="max-width:420px;padding:0;background:linear-gradient(160deg,#0d0d1a,#1a0a2e,#0d0d1a);border:2px solid #e91e63;border-radius:16px;position:relative;overflow:hidden;box-shadow:0 0 60px rgba(233,30,99,0.3),0 0 120px rgba(156,39,176,0.15);">' +
        '<div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;">'+particlesHtml+'</div>' +
        '<div style="background:linear-gradient(135deg,rgba(233,30,99,0.3),rgba(156,39,176,0.2));padding:20px;text-align:center;border-bottom:2px solid rgba(233,30,99,0.4);position:relative;z-index:1;">' +
        '<div style="font-size:28px;margin-bottom:6px;">🏆</div>' +
        '<div style="font-size:18px;font-weight:bold;background:linear-gradient(135deg,#ffd700,#ff9800);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">公 示 名 单</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">感谢每一位贡献者</div>' +
        '<span style="position:absolute;top:12px;right:14px;font-size:18px;color:rgba(255,255,255,0.5);cursor:pointer;z-index:2;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span></div>' +
        '<div style="padding:16px;position:relative;z-index:1;">';
    for (var i=0; i<CQC_HONOR_LIST.length; i++) {
        var p=CQC_HONOR_LIST[i];
        html += '<div style="background:linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;margin-bottom:10px;position:relative;overflow:hidden;">' +
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,'+p.color+',transparent);"></div>' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,'+p.color+'33,'+p.color+'11);display:flex;align-items:center;justify-content:center;font-size:24px;">'+p.icon+'</div>' +
            '<div style="flex:1;">' +
            '<div style="font-size:14px;font-weight:bold;color:'+p.color+';">'+p.name+'</div>' +
            '<div style="font-size:11px;color:#ffd700;margin-top:2px;">'+p.title+'</div>' +
            '<div style="font-size:10px;color:#aaa;margin-top:4px;line-height:1.5;">'+p.desc+'</div></div></div></div>';
    }
    html += '</div><div style="padding:10px 16px;text-align:center;font-size:10px;color:rgba(255,255,255,0.3);border-top:1px solid rgba(255,255,255,0.05);position:relative;z-index:1;">« 光辉永恒 »</div></div></div>';
    var d=document.createElement('div'); d.innerHTML=html;
    if(!document.getElementById('honor-anim-css')){var s=document.createElement('style');s.id='honor-anim-css';var css='';for(var ai=0;ai<30;ai++)css+='@keyframes fh'+ai+'{0%{transform:translateY(0);opacity:0}50%{opacity:1}100%{transform:translateY(-400px);opacity:0}}';s.textContent=css;document.head.appendChild(s);}
    document.body.appendChild(d.firstElementChild);
}

function closeDebugModal() {
 var m = document.getElementById("debug-panel-modal"); if (m) m.remove();
 var p = document.getElementById("debug-pwd-modal"); if (p) p.remove();
}

//6.刷新体力显示
function _refreshDebugStaminaDisplay() {
 var el = document.getElementById("dbg-cur-stamina");
 if (el) el.textContent = Math.floor(GameState.get('stamina') || 0);
}

//7. 自定义资源发放 (按输入框数量)
function debugGrantCustomResources() {
 if (!GameState.getAll()) { showToast("gameState 未就绪", "error"); return; }
 var dust = parseInt((document.getElementById("dbg-dust") || {}).value) ||0;
 var stone = parseInt((document.getElementById("dbg-stone") || {}).value) ||0;
 var lottery = parseInt((document.getElementById("dbg-lottery") || {}).value) ||0;
 var gold = parseInt((document.getElementById("dbg-gold") || {}).value) ||0;
 var gemCount = parseInt((document.getElementById("dbg-gems") || {}).value) ||0;
 var gemLv = Math.min(9, Math.max(1, parseInt((document.getElementById("dbg-gemlv") || {}).value) ||5));
 // ★ v5.0 新增资源
 var herb = parseInt((document.getElementById("dbg-herb") || {}).value) ||0;
 var ore = parseInt((document.getElementById("dbg-ore") || {}).value) ||0;
 var petFood = parseInt((document.getElementById("dbg-petfood") || {}).value) ||0;
 var egg = parseInt((document.getElementById("dbg-egg") || {}).value) ||0;
 var upgrade = parseInt((document.getElementById("dbg-upgrade") || {}).value) ||0;
 var diamond = parseInt((document.getElementById("dbg-diamond") || {}).value) ||0;
 if (dust >0) GameState.mutate('forgeDust', function(v) { return (v || 0) + dust; });
 if (stone >0) GameState.mutate('reforgestone', function(v) { return (v || 0) + stone; });
 if (lottery >0) GameState.mutate('lotteryStone', function(v) { return (v || 0) + lottery; });
 if (gold >0) GameState.mutate('gold', function(v) { return (v || 0) + gold; });
 if (upgrade >0) GameState.mutate('upgradeStone', function(v) { return (v || 0) + upgrade; });
 if (herb >0) { var mats = GameState.get('materials') || {}; mats.herb = (mats.herb || 0) + herb; GameState.set('materials', mats); }
 if (ore >0) { var mats2 = GameState.get('materials') || {}; mats2.ore = (mats2.ore || 0) + ore; GameState.set('materials', mats2); }
 if (petFood >0) GameState.mutate('petFood', function(v) { return (v || 0) + petFood; });
 if (egg >0) GameState.mutate('petEggStones', function(v) { return (v || 0) + egg; });
 if (diamond >0) { GameState.mutate('gems', function(v) { return (typeof v === 'number' ? v : 0) + diamond; }); }
 if (gemCount >0 && typeof GEM_TYPES !== "undefined" && GEM_TYPES.length) {
  var gems = GameState.get('gems') || [];
  if (!gems.length) GameState.set('gems', gems);
  for (var gi =0; gi < GEM_TYPES.length; gi++) {
   var gt = GEM_TYPES[gi];
   var existing=null;var _es5_119=gems;for(var _es5_120=0;_es5_120<_es5_119.length;_es5_120++){if(_es5_119[_es5_120].gemTypeId === gt.id && _es5_119[_es5_120].level === gemLv){existing=_es5_119[_es5_120];break;}};
   if (existing) {
    existing.count = (existing.count ||0) + gemCount;
   } else {
    gems.push({ gemTypeId: gt.id, level: gemLv, count: gemCount, gemType: null });
   }
  }
  GameState.set('gems', gems);
 }
 if (typeof updateResources === "function") updateResources();
 if (typeof refreshInventoryUI === "function") refreshInventoryUI();
 if (typeof refreshForgeUI === "function") refreshForgeUI();
 if (typeof refreshGemUI === "function") refreshGemUI();
 var summary = "粉尘x" + dust + ", 重铸石x" + stone + ",抽奖石x" + lottery + ", 金币x" + gold;
 if (gemCount >0) summary += ", 全宝石x" + gemCount + " Lv." + gemLv;
 showToast("已发放: " + summary, "success");
 console.log("[调试] 自定义资源已发放:", { dust: dust, stone: stone, lottery: lottery, gold: gold, gemCount: gemCount, gemLv: gemLv });
}

// ★ v6.2 单独发放某项资源
function debugAddResource(type) {
 if (!GameState.getAll()) { showToast("gameState 未就绪", "error"); return; }
 var val = 0;
 var label = "";
 var idMap = { gold:'dbg-gold', dust:'dbg-dust', stone:'dbg-stone', lottery:'dbg-lottery', upgrade:'dbg-upgrade', herb:'dbg-herb', ore:'dbg-ore', petfood:'dbg-petfood', egg:'dbg-egg', diamond:'dbg-diamond', gems:'dbg-gems' };
 var el = document.getElementById(idMap[type]);
 if (el) val = parseInt(el.value) || 0;
 if (val <= 0 && type !== 'gems') { showToast("\u8bf7\u5148\u8f93\u5165\u6570\u91cf", "warning"); return; }
 switch (type) {
  case 'gold': GameState.mutate('gold', function(v) { return (v||0) + val; }); label = "\u91d1\u5e01x" + val; break;
  case 'dust': GameState.mutate('forgeDust', function(v) { return (v||0) + val; }); label = "\u7c89\u5c18x" + val; break;
  case 'stone': GameState.mutate('reforgestone', function(v) { return (v||0) + val; }); label = "\u91cd\u94f8\u77f3x" + val; break;
  case 'lottery': GameState.mutate('lotteryStone', function(v) { return (v||0) + val; }); label = "\u62bd\u5956\u77f3x" + val; break;
  case 'upgrade': GameState.mutate('upgradeStone', function(v) { return (v||0) + val; }); label = "\u5347\u7ea7\u77f3x" + val; break;
  case 'herb': var m = GameState.get('materials') || {}; m.herb = (m.herb||0) + val; GameState.set('materials', m); label = "\u8349\u836fx" + val; break;
  case 'ore': var m2 = GameState.get('materials') || {}; m2.ore = (m2.ore||0) + val; GameState.set('materials', m2); label = "\u77ff\u77f3x" + val; break;
  case 'petfood': GameState.mutate('petFood', function(v) { return (v||0) + val; }); label = "\u5ba0\u7269\u98df\u7269x" + val; break;
  case 'egg': GameState.mutate('petEggStones', function(v) { return (v||0) + val; }); label = "\u86cb\u77f3x" + val; break;
  case 'diamond': GameState.mutate('gems', function(v) { return (typeof v === 'number' ? v : 0) + val; }); label = "\u94bb\u77f3x" + val; break;
  case 'gems':
   var gemCount = val > 0 ? val : 1;
   if (el) gemCount = parseInt(el.value) || 1;
   var gemLv = Math.min(9, Math.max(1, parseInt((document.getElementById('dbg-gemlv')||{}).value) || 5));
   if (typeof GEM_TYPES === 'undefined' || !GEM_TYPES.length) { showToast("GEM_TYPES 未加载", "error"); return; }
   var gems = GameState.get('gems') || [];
   if (!gems.length) GameState.set('gems', gems);
   for (var gi = 0; gi < GEM_TYPES.length; gi++) {
    var gt = GEM_TYPES[gi];
    var ex=null;var _es5_121=gems;for(var _es5_122=0;_es5_122<_es5_121.length;_es5_122++){if(_es5_121[_es5_122].gemTypeId === gt.id && _es5_121[_es5_122].level === gemLv){ex=_es5_121[_es5_122];break;}};
    if (ex) { ex.count = (ex.count||0) + gemCount; }
    else { gems.push({ gemTypeId: gt.id, level: gemLv, count: gemCount, gemType: null }); }
   }
   GameState.set('gems', gems);
   label = "\u5168\u5b9d\u77f3x" + gemCount + " Lv." + gemLv; break;
 }
 if (typeof updateResources === "function") updateResources();
 if (typeof refreshInventoryUI === "function") refreshInventoryUI();
 if (typeof refreshForgeUI === "function") refreshForgeUI();
 if (typeof refreshGemUI === "function") refreshGemUI();
 showToast("\u2705 \u5df2\u53d1\u653e: " + label, "success");
}

//8. 获取体力 (设到指定值, 不超过240 上限)
function debugGrantStamina() {
 if (!GameState.getAll()) { showToast("gameState 未就绪", "error"); return; }
 var amt = Math.min(240, Math.max(0, parseInt((document.getElementById("dbg-stamina-amt") || {}).value) ||0));
 GameState.set('stamina', amt);
 GameState.set('lastStaminaTime', Date.now());
 if (typeof updateResources === "function") updateResources();
 if (typeof updateDungeonStaminaUI === "function") updateDungeonStaminaUI();
 _refreshDebugStaminaDisplay();
 showToast("体力已设为 " + amt + " /240", "success");
}

//9.跳到下一章首波
function debugJumpToNextChapter() {
 if (!GameState.getAll()) return;
 var currentStage = GameState.get('stage') || 1;
 var nextStage = currentStage + 1;
 var newWave = (nextStage - 1) * 20 + 1;
 GameState.set('wave', newWave);
 GameState.set('stage', nextStage);
 if (typeof BattleManager !== "undefined" && BattleManager) {
  BattleManager.waveNumber = newWave;
  BattleManager.stage = nextStage;
 }
 if (typeof updateResources === "function") updateResources();
 showToast("已跳到第 " + nextStage + " 章 (第 " + newWave + " 波)", "success");
}

//10. 全英雄满级
function debugMaxLevelHeroes() {
 var heroes = GameState.get('heroes');
 if (!heroes || !heroes.length) {
  showToast("没有英雄", "error");
  return;
 }
 for (var i =0; i < heroes.length; i++) {
  var h = heroes[i];
  h.level =50;
  h.exp =0;
  if (typeof getExpToNext === "function") h.expToNext = getExpToNext(50);
  h.skillPoints =10;
  if (!h.skillLevels) h.skillLevels = {};
  if (h.skills) {
   for (var si =0; si < h.skills.length; si++) {
    h.skillLevels[h.skills[si]] =10;
   }
  }
 }
 if (typeof updateMainTeamPower === "function") updateMainTeamPower();
 if (typeof refreshHeroUI === "function") refreshHeroUI();
 showToast("所有英雄已升到 Lv.50 +满技能点 +满技能等级", "success");
}

//11. 清掉 _debugGranted标记
function debugResetDebugFlag() {
 if (GameState.getAll()) GameState.set('_debugGranted', undefined);
 showToast("已重置 _debugGranted标记, 下次 initGame 会再发一次", "info");
}

