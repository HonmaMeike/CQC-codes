// ========== 装备图鉴系统 ==========
/* global GameState */

var EQUIP_CODEX_OPEN = false;

// 装备图鉴分类配置
var EQUIP_CODEX_CATEGORIES = [
    { id: 'weapon',  name: '武器',   icon: '⚔️', color: '#ff9800' },
    { id: 'offhand', name: '副手',   icon: '🛡️', color: '#4fc3f7' },
    { id: 'helmet',  name: '头盔',   icon: '🎩', color: '#7c4dff' },
    { id: 'armor',   name: '护甲',   icon: '🥼', color: '#f44336' },
    { id: 'boots',   name: '鞋子',   icon: '👟', color: '#4caf50' }
];

// 获取已解锁的装备图鉴 ID 集合
function getUnlockedEquipCodexIds() {
    var set = {};
    try {
        if (typeof gameState !== 'undefined' && gameState && GameState.get("equipCodex")) {
            for (var key in GameState.get("equipCodex")) {
                if (GameState.get("equipCodex").hasOwnProperty(key) && GameState.get("equipCodex")[key]) {
                    set[key] = true;
                }
            }
        }
    } catch (e) {}
    return set;
}

// 记录装备到图鉴
function recordEquipToCodex(item) {
    if (!item || !item.slot) return;
    if (typeof gameState === 'undefined' || !gameState) return;
    if (!GameState.get("equipCodex")) GameState.set("equipCodex", {});
    if (!GameState.get("equipCodex")[item.slot]) {
        GameState.get("equipCodex")[item.slot] = true;
    }
}

// 打开装备图鉴
function showEquipCodex() {
    if (EQUIP_CODEX_OPEN) return;
    EQUIP_CODEX_OPEN = true;

    var categories = EQUIP_CODEX_CATEGORIES;
    var unlocked = getUnlockedEquipCodexIds();
    var totalCount = categories.length;
    var unlockedCount = 0;
    for (var i = 0; i < categories.length; i++) {
        if (unlocked[categories[i].id]) unlockedCount++;
    }
    var totalPct = totalCount > 0 ? Math.floor(unlockedCount * 100 / totalCount) : 0;

    var html = '' +
        '<div class="modal-overlay codex-overlay" style="display:flex;align-items:center;justify-content:center;z-index:9999;" onclick="closeEquipCodex(event)">' +
            '<div class="codex-container" onclick="event.stopPropagation();">' +
                '<div class="codex-header" style="position:relative;">' +
                    '<h3 class="codex-title">🛡️ 装备图鉴</h3>' +
                    '<div class="codex-stats" id="equip-codex-stats">' +
                        '<span class="codex-stat-pill" title="已收集装备类型 / 总类型数">✨ 已收集 <b>' + unlockedCount + '</b>/' + totalCount + ' (' + totalPct + '%)</span>' +
                    '</div>' +
                    '<button class="btn" style="padding:4px 14px;font-size:12px;" onclick="closeEquipCodex(event)">关闭</button>' +
                    '<span style="position:absolute;top:6px;right:6px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;display:none;" onclick="closeEquipCodex(event)">✕</span>' +
                '</div>' +
                '<div class="codex-body">' +
                    '<div class="codex-grid" id="equip-codex-grid"></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    var temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp.firstChild);

    renderEquipCodexGrid();
}

function closeEquipCodex() {
    EQUIP_CODEX_OPEN = false;
    var overlays = document.querySelectorAll('.codex-overlay');
    for (var i = 0; i < overlays.length; i++) {
        overlays[i].remove();
    }
}

// 渲染装备图鉴网格
function renderEquipCodexGrid() {
    var grid = document.getElementById('equip-codex-grid');
    if (!grid) return;

    var unlocked = getUnlockedEquipCodexIds();
    var categories = EQUIP_CODEX_CATEGORIES;

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;padding:8px;">';

    for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        var isUnlocked = !!unlocked[cat.id];

        // 查找装备名称样本
        var sampleNames = getEquipSampleNames(cat.id);
        var displayName = isUnlocked ? cat.icon + ' ' + cat.name : '???';
        var cellCls = 'codex-cell' + (isUnlocked ? '' : ' codex-cell-locked');
        var lockBadge = isUnlocked ? '' : '<div class="codex-lock-badge" title="尚未获得">?</div>';

        // 收集总数统计
        var sampleCount = sampleNames.length;
        var sampleHtml = '';
        if (isUnlocked && sampleNames.length > 0) {
            sampleHtml = sampleNames.slice(0, 3).map(function(n) {
                return '<span style="font-size:10px;color:#999;display:block;line-height:1.4;">' + n + '</span>';
            }).join('');
        }

        html += '<div class="' + cellCls + '" onclick="showEquipCodexDetail(\'' + cat.id + '\')" title="' + (isUnlocked ? cat.name : '??? 未发现') + '" style="cursor:pointer;text-align:center;padding:12px 6px;border-radius:8px;background:' + (isUnlocked ? 'rgba(' + hexToRgb(cat.color) + ',0.15)' : 'rgba(50,50,50,0.3)') + ';border:1px solid ' + (isUnlocked ? cat.color + '66' : 'rgba(255,255,255,0.08)') + ';position:relative;">' +
            '<div style="font-size:28px;margin-bottom:4px;">' + (isUnlocked ? cat.icon : '❓') + '</div>' +
            '<div style="font-size:13px;font-weight:bold;color:' + (isUnlocked ? '#fff' : '#666') + ';">' + displayName + '</div>' +
            (isUnlocked ? '<div style="font-size:11px;color:' + cat.color + ';margin-top:2px;">' + cat.name + '</div>' : '') +
            (sampleHtml ? '<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.05);">' + sampleHtml + '</div>' : '') +
            lockBadge +
        '</div>';
    }

    html += '</div>';
    grid.innerHTML = html;

    // 更新统计
    updateEquipCodexStats();
}

// 更新统计信息
function updateEquipCodexStats() {
    var statsEl = document.getElementById('equip-codex-stats');
    if (!statsEl) return;

    var unlocked = getUnlockedEquipCodexIds();
    var categories = EQUIP_CODEX_CATEGORIES;
    var unlockedCount = 0;
    for (var i = 0; i < categories.length; i++) {
        if (unlocked[categories[i].id]) unlockedCount++;
    }
    var totalPct = categories.length > 0 ? Math.floor(unlockedCount * 100 / categories.length) : 0;

    statsEl.innerHTML = '<span class="codex-stat-pill" title="已收集装备类型 / 总类型数">✨ 已收集 <b>' + unlockedCount + '</b>/' + categories.length + ' (' + totalPct + '%)</span>';
}

// 获取某类装备的示例名称
function getEquipSampleNames(slotId) {
    var names = [];

    try {
        if (slotId === 'weapon' || slotId === 'offhand') {
            // 武器/副手从武器池取
            var pool = (slotId === 'weapon')
                ? (typeof WEAPON_NAMES_BY_TYPE !== 'undefined' ? WEAPON_NAMES_BY_TYPE : null)
                : (typeof OFFHAND_NAMES_BY_TYPE !== 'undefined' ? OFFHAND_NAMES_BY_TYPE : null);
            if (pool) {
                for (var key in pool) {
                    if (pool.hasOwnProperty(key) && Array.isArray(pool[key])) {
                        for (var j = 0; j < pool[key].length; j++) {
                            if (names.length >= 20) break;
                            if (names.indexOf(pool[key][j]) === -1) names.push(pool[key][j]);
                        }
                    }
                    if (names.length >= 20) break;
                }
            }
        } else {
            // 防具从装甲池取
            var armorPool = (typeof ARMOR_NAMES_BY_TYPE !== 'undefined') ? ARMOR_NAMES_BY_TYPE : null;
            if (armorPool) {
                for (var armorKey in armorPool) {
                    if (armorPool.hasOwnProperty(armorKey) && armorPool[armorKey] && armorPool[armorKey][slotId]) {
                        var slotArr = armorPool[armorKey][slotId];
                        for (var k = 0; k < slotArr.length; k++) {
                            if (names.length >= 20) break;
                            if (names.indexOf(slotArr[k]) === -1) names.push(slotArr[k]);
                        }
                    }
                    if (names.length >= 20) break;
                }
            }
        }
    } catch (e) {}

    return names;
}

// 十六进制颜色转 RGB 字符串
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : '255,255,255';
}

// 显示装备图鉴详情
function showEquipCodexDetail(categoryId) {
    var cat = null;
    for (var i = 0; i < EQUIP_CODEX_CATEGORIES.length; i++) {
        if (EQUIP_CODEX_CATEGORIES[i].id === categoryId) {
            cat = EQUIP_CODEX_CATEGORIES[i];
            break;
        }
    }
    if (!cat) return;

    var unlocked = getUnlockedEquipCodexIds();
    var isUnlocked = !!unlocked[cat.id];
    var sampleNames = getEquipSampleNames(cat.id);

    // 找 EQUIP_SLOTS 数据
    var slotData = null;
    try {
        if (typeof EQUIP_SLOTS !== 'undefined') {
            for (var si = 0; si < EQUIP_SLOTS.length; si++) {
                if (EQUIP_SLOTS[si].id === cat.id) {
                    slotData = EQUIP_SLOTS[si];
                    break;
                }
            }
        }
    } catch (e) {}

    var baseStatInfo = '';
    if (slotData && slotData.baseStat) {
        baseStatInfo = slotData.baseStat.name + ' +' + slotData.baseStat.basePerLvl + '/级';
    }

    var sampleHtml = '';
    if (isUnlocked && sampleNames.length > 0) {
        sampleHtml = '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);">' +
            '<div style="font-size:13px;color:#aaa;margin-bottom:6px;">📋 可能获得的装备：</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
        for (var si = 0; si < Math.min(sampleNames.length, 15); si++) {
            sampleHtml += '<span style="font-size:11px;padding:2px 6px;background:rgba(255,255,255,0.06);border-radius:4px;color:#ccc;">' + sampleNames[si] + '</span>';
        }
        sampleHtml += '</div></div>';
    }

    var qualityInfo = '';
    if (isUnlocked) {
        var qualityNames = ['普通', '优秀', '稀有', '史诗', '传说', '不朽'];
        var qualityColors = ['#9e9e9e', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#f44336'];
        qualityInfo = '<div style="margin-top:8px;">' +
            '<div style="font-size:13px;color:#aaa;margin-bottom:4px;">🎨 品质等级：</div>' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
        for (var qi = 0; qi < qualityNames.length; qi++) {
            qualityInfo += '<span style="font-size:11px;padding:2px 8px;background:' + qualityColors[qi] + '33;color:' + qualityColors[qi] + ';border-radius:4px;border:1px solid ' + qualityColors[qi] + '55;">' + qualityNames[qi] + '</span>';
        }
        qualityInfo += '</div></div>';
    }

    var html = '' +
        '<div class="modal-overlay" style="display:flex;align-items:center;justify-content:center;z-index:10000;" onclick="this.remove()">' +
            '<div class="codex-detail-card" onclick="event.stopPropagation();" style="width:340px;max-width:90vw;">' +
                '<button class="codex-detail-close" onclick="this.closest(\'.modal-overlay\').remove()">✖</button>' +

                // 图标区
                '<div class="codex-detail-sprite" style="text-align:center;padding:20px 0;">' +
                    '<div style="font-size:64px;">' + (isUnlocked ? cat.icon : '❓') + '</div>' +
                '</div>' +

                // 名称
                '<div class="codex-detail-name" style="text-align:center;">' +
                    (isUnlocked ? cat.icon + ' ' + cat.name : '??? 未发现') +
                '</div>' +

                // 类型标签
                '<div class="codex-detail-type" style="text-align:center;color:' + cat.color + ';">' +
                    (isUnlocked ? getCategoryTypeLabel(cat.id) : '未解锁') +
                '</div>' +

                // 基础信息
                '<div class="codex-detail-stats" style="padding:12px;">' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">📦 装备类型</span>' +
                        '<span class="codex-detail-stat-value" style="color:' + cat.color + ';">' + (isUnlocked ? cat.name : '?') + '</span>' +
                    '</div>' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">📏 基础属性</span>' +
                        '<span class="codex-detail-stat-value" style="color:#ffd700;">' + (isUnlocked ? (baseStatInfo || '未知') : '?') + '</span>' +
                    '</div>' +
                    '<div class="codex-detail-stat">' +
                        '<span class="codex-detail-stat-label">📊 装备数量</span>' +
                        '<span class="codex-detail-stat-value" style="color:#4fc3f7;">' + (isUnlocked ? sampleNames.length + '+' : '?') + '</span>' +
                    '</div>' +
                '</div>' +

                // 品质信息
                (isUnlocked ? qualityInfo : '') +

                // 示例装备名
                (isUnlocked ? sampleHtml : '') +

                // 未解锁提示
                (!isUnlocked ? '<div class="codex-locked-banner" style="margin:12px;">🔒 尚未获得任何该类型装备。击败怪物或从宝箱中获取即可解锁。' +
                    '<br><span style="font-size:11px;opacity:0.7;">💡 不同类型的装备在不同章节的掉落池中出现。</span></div>' : '') +
            '</div>' +
        '</div>';

    var temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp.firstChild);
}

// 获取装备类型标签
function getCategoryTypeLabel(slotId) {
    var labels = {
        weapon: '攻击型装备 — 提升攻击力',
        offhand: '辅助型装备 — 提升防御力/法力',
        helmet: '防护型装备 — 提升生命值',
        armor: '防护型装备 — 提升防御力',
        boots: '移动型装备 — 提升速度'
    };
    return labels[slotId] || '普通装备';
}

// 从设置界面打开装备图鉴
function openEquipCodexFromSettings() {
    if (typeof showEquipCodex === 'function') {
        showEquipCodex();
    }
}
