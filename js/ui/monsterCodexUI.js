// ========== 怪物图鉴系统 ==========
/* global GameState */

var MONSTER_CODEX_OPEN = false;

// 已解锁图鉴怪物 ID 集合（运行时计算）
function getUnlockedCodexIds() {
    var set = {};
    try {
        if (typeof gameState !== 'undefined' && gameState && GameState.get("unlockedMonsters")) {
            for (var i = 0; i < GameState.get("unlockedMonsters").length; i++) {
                set[GameState.get("unlockedMonsters")[i]] = true;
            }
        }
    } catch (e) {}
    // 当前在战场 / 副本里的敌人也算遇到
    try {
        if (typeof BattleManager !== 'undefined' && BattleManager && BattleManager.enemies) {
            for (var j = 0; j < BattleManager.enemies.length; j++) {
                var en = BattleManager.enemies[j];
                if (en && (en.id || en.monsterKey)) set[en.id || en.monsterKey] = true;
            }
        }
    } catch (e) {}
    return set;
}

// 打开怪物图鉴
function showMonsterCodex() {
    if (MONSTER_CODEX_OPEN) return;
    MONSTER_CODEX_OPEN = true;

    // 统计总数与网友怪数
    var totalCount = MONSTER_DATA.length;
    var friendCount = 0;
    var unlockedCount = 0;
    var unlockedFriendCount = 0;
    var unlocked = getUnlockedCodexIds();
    for (var i = 0; i < MONSTER_DATA.length; i++) {
        var m = MONSTER_DATA[i];
        if (m.friend) friendCount++;
        if (unlocked[m.id]) {
            unlockedCount++;
            if (m.friend) unlockedFriendCount++;
        }
    }
    var totalPct = totalCount > 0 ? Math.floor(unlockedCount * 100 / totalCount) : 0;

    var html = '' +
        '<div class="modal-overlay codex-overlay" style="display:flex;align-items:center;justify-content:center;z-index:9999;" onclick="closeMonsterCodex(event)">' +
            '<div class="codex-container" onclick="event.stopPropagation();">' +
                '<div class="codex-header" style="position:relative;">' +
                    '<h3 class="codex-title">\u{1F4D6} 怪物图鉴</h3>' +
                    '<div class="codex-stats" id="codex-stats">' +
                        '<span class="codex-stat-pill" title="已收集怪物 / 总怪物数">\u2728 已收集 <b>' + unlockedCount + '</b>/' + totalCount + ' (' + totalPct + '%)</span>' +
                        '<span class="codex-stat-pill codex-stat-friend" title="网友怪收集进度">\u{1F49B} 网友 <b>' + unlockedFriendCount + '</b>/' + friendCount + '</span>' +
                    '</div>' +
                    '<button class="btn" style="padding:4px 14px;font-size:12px;" onclick="closeMonsterCodex(event)">关闭</button>' +
                    '<span style="position:absolute;top:6px;right:6px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;display:none;" onclick="closeMonsterCodex(event)">✕</span>' +
                '</div>' +
                '<div class="codex-body">' +
                    '<div class="codex-toolbar">' +
                        '<input id="codex-search" class="codex-search-input" type="text" placeholder="搜索怪物名称..." oninput="filterCodexGrid()">' +
                        '<select id="codex-filter" class="codex-filter-select" onchange="filterCodexGrid()">' +
                            '<option value="all">全部</option>' +
                            '<option value="normal">普通</option>' +
                            '<option value="elite">精英</option>' +
                            '<option value="friend">网友</option>' +
                        '</select>' +
                        '<span class="codex-count" id="codex-count"></span>' +
                    '</div>' +
                    '<div class="codex-grid" id="codex-grid"></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    var temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp.firstChild);

    renderCodexGrid(MONSTER_DATA);
}

function closeMonsterCodex() {
    MONSTER_CODEX_OPEN = false;
    var overlays = document.querySelectorAll('.codex-overlay');
    for (var i = 0; i < overlays.length; i++) {
        overlays[i].remove();
    }
}

// 筛选并重新渲染网格
function filterCodexGrid() {
    var query = (document.getElementById('codex-search').value || '').toLowerCase();
    var filter = document.getElementById('codex-filter').value;

    var filtered = [];
    for (var i = 0; i < MONSTER_DATA.length; i++) {
        var m = MONSTER_DATA[i];
        // 文本搜索
        if (query && m.name.toLowerCase().indexOf(query) === -1) continue;
        // 分类筛选
        if (filter === 'friend' && !m.friend) continue;
        if (filter === 'elite' && (!m.elite || m.friend)) continue;
        if (filter === 'normal' && (m.elite || m.friend)) continue;
        filtered.push(m);
    }

    renderCodexGrid(filtered);
}

// 渲染怪物网格
function renderCodexGrid(monsters) {
    var grid = document.getElementById('codex-grid');
    if (!grid) return;

    var countEl = document.getElementById('codex-count');
    if (countEl) countEl.textContent = monsters.length + '/' + MONSTER_DATA.length;

    var unlocked = getUnlockedCodexIds();

    var html = '';
    for (var i = 0; i < monsters.length; i++) {
        var m = monsters[i];
        var typeTag = '';
        if (m.friend) {
            typeTag = '<span class="codex-tag codex-tag-friend">网友</span>';
        } else if (m.elite) {
            typeTag = '<span class="codex-tag codex-tag-elite">精英</span>';
        } else {
            typeTag = '<span class="codex-tag codex-tag-normal">普通</span>';
        }
        // 未解锁怪加灰罩 + ? 蒙版（保留造型轮廓便于辨识）
        var isUnlocked = !!unlocked[m.id];
        var lockBadge = isUnlocked
            ? ''
            : '<div class="codex-lock-badge" title="尚未遇到">?</div>';
        var cellCls = isUnlocked ? 'codex-cell' : 'codex-cell codex-cell-locked';
        html += '' +
            '<div class="' + cellCls + '" onclick="showMonsterDetail(\'' + m.id + '\')" title="' + (isUnlocked ? m.name : '??? 未遇到') + '">' +
                '<div class="codex-cell-canvas" id="codex-canvas-' + m.id + '">' +
                    '<canvas width="56" height="56"></canvas>' +
                '</div>' +
                '<div class="codex-cell-name">' + (isUnlocked ? (m.icon + ' ' + truncateName(m.name, 6)) : '???') + '</div>' +
                typeTag +
                lockBadge +
            '</div>';
    }
    grid.innerHTML = html;

    // 绘制每个怪物的精灵图
    for (var i = 0; i < monsters.length; i++) {
        drawCodexMonsterSprite(monsters[i], unlocked[monsters[i].id]);
    }
}

// 截断名称
function truncateName(name, maxLen) {
    var len = 0;
    var result = '';
    for (var i = 0; i < name.length; i++) {
        var ch = name.charCodeAt(i);
        len += (ch > 127) ? 2 : 1;
        if (len > maxLen) return result + '..';
        result += name[i];
    }
    return result;
}

// 在网格单元格中绘制怪物精灵
function drawCodexMonsterSprite(m, isUnlocked) {
    var container = document.getElementById('codex-canvas-' + m.id);
    if (!container) return;
    var canvas = container.querySelector('canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var cx = 28, cy = 30, r = 20;
    if (isUnlocked === false) {
        // 未解锁：黑色剪影 + 暗灰蒙版
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, 56, 56);
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        // 中心 ? 图标
        ctx.fillStyle = '#888';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy + 1);
        return;
    }
    var bodyColor = '#8B0000';
    if (m.elite) bodyColor = '#cd7f32';
    if (m.friend) bodyColor = '#4a90d9';
    SpriteRenderer.drawMonsterSprite(ctx, m.name, cx, cy, r, bodyColor, m.elite || false, m.friend || false);
}

// 获取怪物类型标签（用于详情卡片）
function getMonsterTypeLabel(m) {
    if (m.friend) return '网友定制';
    if (m.elite) return '精英怪物';
    return '普通怪物';
}

// 获取怪物类型颜色
function getMonsterTypeColor(m) {
    if (m.friend) return '#4fc3f7';
    if (m.elite) return '#cd7f32';
    return '#9e9e9e';
}

// 生成怪物介绍文本
function getMonsterDescription(m) {
    if (m.friend) {
        return m.desc || '由网友命名的特殊怪物，从第1章起就可能在任意关卡中随机出没，偶尔还会以BOSS形态乱入战场！';
    }
    var typeStr = m.elite ? '精英怪物，比普通怪物更强大，拥有独特的技能和更高的属性。' : '普通怪物，在冒险途中最常见的对手。';
    var stageStr = '从第' + m.minStage + '章起开始出现。';
    var desc = '一种' + (m.elite ? '精英' : '普通') + '怪物。' + stageStr;
    return desc;
}

// 详情卡 · 顶部 banner（已解锁/未遇到）
function getCodexLockedBannerHtml(isUnlocked, m) {
    if (isUnlocked) return '';
    return '<div class="codex-locked-banner">\u{1F512} 尚未遇到 — 出没位置: ' +
        (m.friend ? '爬塔 5/15/25/35... 层（50%）或 10/20/30... 层（100% BOSS）' :
         m.elite ? '主线第 ' + m.minStage + ' 章起，第 5/15 关精英位' :
         '主线第 ' + m.minStage + ' 章起普通位') +
        '</div>';
}

// 显示怪物详情卡片
function showMonsterDetail(monsterId) {
    var m = null;
    for (var i = 0; i < MONSTER_DATA.length; i++) {
        if (MONSTER_DATA[i].id === monsterId) {
            m = MONSTER_DATA[i];
            break;
        }
    }
    if (!m) return;

    var typeLabel = getMonsterTypeLabel(m);
    var typeColor = getMonsterTypeColor(m);
    var desc = getMonsterDescription(m);
    var isUnlocked = !!getUnlockedCodexIds()[m.id];

    // 模拟该怪物在默认关卡（minStage）的数值
    var simStage = Math.max(m.minStage, 1);
    var simLevel = 5;
    var stats = calcChapterMonsterStats(simStage, simLevel, false, m.elite || false);
    var isBossPotential = !m.friend;

    var html = '' +
        '<div class="modal-overlay" style="display:flex;align-items:center;justify-content:center;z-index:10000;" onclick="this.remove()">' +
            '<div class="codex-detail-card" onclick="event.stopPropagation();">' +
                '<button class="codex-detail-close" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</button>' +

                // 锁定状态 banner（如未遇到）
                getCodexLockedBannerHtml(isUnlocked, m) +

                // 怪物精灵图区域
                '<div class="codex-detail-sprite">' +
                    '<canvas id="codex-detail-canvas" width="140" height="140"></canvas>' +
                '</div>' +

                // 名称和类型标签
                '<div class="codex-detail-name">' + (isUnlocked ? m.icon + ' ' + m.name : '??? 未遇到') + '</div>' +
                '<div class="codex-detail-type" style="color:' + typeColor + ';">' + typeLabel + '</div>' +

                // 属性面板
                '<div class="codex-detail-stats">' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">\u{2764} 生命</span>' +
                        '<span class="codex-detail-stat-value" style="color:#ef5350;">' + (isUnlocked ? m.hp : '?') + '</span>' +
                    '</div>' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">\u{2694} 攻击</span>' +
                        '<span class="codex-detail-stat-value" style="color:#ff9800;">' + (isUnlocked ? m.atk : '?') + '</span>' +
                    '</div>' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">\u{1F6E1} 防御</span>' +
                        '<span class="codex-detail-stat-value" style="color:#4fc3f7;">' + (isUnlocked ? m.def : '?') + '</span>' +
                    '</div>' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">\u{26A1} 速度</span>' +
                        '<span class="codex-detail-stat-value" style="color:#66bb6a;">' + (isUnlocked ? m.spd : '?') + '</span>' +
                    '</div>' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">\u{2728} 经验</span>' +
                        '<span class="codex-detail-stat-value" style="color:#ce93d8;">' + (isUnlocked ? m.exp : '?') + '</span>' +
                    '</div>' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">\u{1FA99} 金币</span>' +
                        '<span class="codex-detail-stat-value" style="color:#ffd700;">' + (isUnlocked ? m.gold : '?') + '</span>' +
                    '</div>' +
                '</div>' +

                // 附加信息
                '<div class="codex-detail-info">' +
                    '<div class="codex-detail-info-row">' +
                        '<span>出现章节</span>' +
                        '<span>第' + m.minStage + '章起</span>' +
                    '</div>' +
                    '<div class="codex-detail-info-row">' +
                        '<span>怪物类型</span>' +
                        '<span>' + (m.elite ? '精英级' : (m.friend ? '特殊级' : '普通级')) + '</span>' +
                    '</div>' +
                    (m.friend ? '<div class="codex-detail-info-row"><span>BOSS潜力</span><span style="color:#ffd700;">\u2705 可BOSS登场</span></div>' : '') +
                '</div>' +

                // 介绍文本（未解锁时给引导文案）
                '<div class="codex-detail-desc">' + (isUnlocked ? desc : '\u{1F512} 这只怪物的具体信息尚未解锁。击败它即可查看完整数据 + 个性描述。') + '</div>' +
            '</div>' +
        '</div>';

    var temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp.firstChild);

    // 在Canvas上绘制怪物精灵
    setTimeout(function() {
        var canvas = document.getElementById('codex-detail-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        if (!isUnlocked) {
            // 灰罩剪影
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, 140, 140);
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(70, 72, 42, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#888';
            ctx.font = 'bold 56px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 70, 74);
            return;
        }
        var bodyColor = '#8B0000';
        if (m.elite) bodyColor = '#cd7f32';
        if (m.friend) bodyColor = '#4a90d9';
        SpriteRenderer.drawMonsterSprite(ctx, m.name, 70, 72, 42, bodyColor, m.elite || false, m.friend || false);
    }, 50);
}
