/* global GameState */
// ========== 宝石工坊UI v6.2 ==========
// ★ Round 2.2: 锻造工坊 → 宝石工坊
//   老的分解/重铸 tab 已经从 index.html 移除, 玩家从仓库底部 [智能] 弹卡片或
//   装备详情卡片主操作[重铸]+tab[出售|分解] 走分解/重铸
//
//   宝石工坊 3 tab: 合成 / 镶嵌 / 共鸣
//   渲染逻辑委托给 gemUI.js 的 renderGemSynthesizeUI / renderGemInlayUI / renderGemResonanceUI
//
//   升阶 tab (装备融合系统)

// 品质名称/类代理为 window.Quality
function _qName(q) { return (typeof Quality !== 'undefined' && Quality.getName) ? Quality.getName(q) : (q === 0 ? '白' : '未知'); }
function _qClass(q) { return (typeof Quality !== 'undefined' && Quality.getClass) ? Quality.getClass(q) : ''; }
function _qColor(q) { return (typeof Quality !== 'undefined' && Quality.getColor) ? Quality.getColor(q) : '#fff'; }

var forgeCurrentTab = 'synthesize';
// 融合槽位状态（存储 selected equip ids）
var _fusionSlots = [null, null, null];

function switchForgeTab(tab) {
    forgeCurrentTab = tab;
    if (typeof gemCurrentTab !== 'undefined') gemCurrentTab = tab;
    var labelMap = { synthesize: '合成', inlay: '镶嵌', resonance: '共鸣', fusion: '升阶' };
    var label = labelMap[tab] || '';
    document.querySelectorAll('#forge-tabs .tab-btn').forEach(function(b) {
        b.classList.toggle('active', b.textContent.indexOf(label) !== -1);
    });
    // 进入升阶tab时重置槽位
    if (tab !== 'fusion') {
        _fusionSlots = [null, null, null];
    }
    refreshForgeUI();
}

function refreshForgeUI() {
    var content = document.getElementById('forge-content');
    if (!content) return;
    if (typeof _migrateGemSaveData === 'function') _migrateGemSaveData();
    if (forgeCurrentTab === 'synthesize') {
        if (typeof renderGemSynthesizeUI === 'function') renderGemSynthesizeUI(content);
    } else if (forgeCurrentTab === 'inlay') {
        if (typeof renderGemInlayUI === 'function') renderGemInlayUI(content);
    } else if (forgeCurrentTab === 'fusion') {
        renderFusionUI(content);
    } else {
        if (typeof renderGemResonanceUI === 'function') renderGemResonanceUI(content);
    }
}

// ========== 融合UI ==========

// 清除融合槽位
function clearFusionSlots() {
    _fusionSlots = [null, null, null];
    refreshForgeUI();
}

// 打开装备选择弹窗（用于融合槽位）
function openFusionSelectModal(slotIndex) {
    var inv = GameState.get('inventory') || [];
    if (inv.length === 0) {
        showToast('仓库中没有装备', 'warning');
        return;
    }

    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="position:relative;">';
    html += '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span>';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">';
    html += '<h3 style="flex:1;margin:0;">选择装备（槽位 ' + (slotIndex + 1) + '）</h3>';
    html += '<span style="font-size:11px;color:#888;">点击装备选择</span></div>';

    // 品质筛选快速按钮
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">';
    for (var q = 0; q <= 5; q++) {
        var qName = _qName(q);
        var qClass = _qClass(q);
        html += '<button class="quality-filter-btn" onclick="filterFusionByQuality(' + q + ')" style="font-size:11px;padding:2px 8px;">' + qName + '</button>';
    }
    html += '<button class="quality-filter-btn" onclick="clearFusionQualityFilter()" style="font-size:11px;padding:2px 8px;">全部</button>';
    html += '</div>';

    html += '<div style="max-height:300px;overflow-y:auto;margin:10px 0;" id="fusion-select-list">';
    html += '</div>';
    html += '<button class="btn" style="width:100%;" onclick="this.closest(\'.modal-overlay\').remove()">取消</button>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    // 渲染装备列表
    renderFusionSelectList(slotIndex, inv);
}

// 品质筛选（融合选择弹窗）
var _fusionQualityFilter = -1; // -1 = all

function filterFusionByQuality(q) {
    _fusionQualityFilter = q;
    var inv = GameState.get('inventory') || [];
    var listEl = document.getElementById('fusion-select-list');
    if (!listEl) return;
    // 找到弹出的 slotIndex
    var overlay = listEl.closest('.modal-overlay');
    // 可以通过 dataset 传递，但简化：重新渲染
    var allButtons = document.querySelectorAll('#fusion-select-list .fusion-eq-item');
    if (!allButtons.length) {
        // 直接重新过滤
    }
    renderFusionSelectList(-1, inv); // 重新渲染
}

function clearFusionQualityFilter() {
    _fusionQualityFilter = -1;
    var inv = GameState.get('inventory') || [];
    renderFusionSelectList(-1, inv);
}

function renderFusionSelectList(slotIndex, inv) {
    var listEl = document.getElementById('fusion-select-list');
    if (!listEl) return;

    // 如果 slotIndex 无效，从 DOM 推断
    if (slotIndex < 0) {
        // 找 overlay 中的 slot index
        var overlay = listEl.closest('.modal-overlay');
        if (overlay) {
            var titleEl = overlay.querySelector('h3');
            if (titleEl) {
                var m = titleEl.textContent.match(/槽位 (\d)/);
                if (m) slotIndex = parseInt(m[1]) - 1;
            }
        }
        if (slotIndex < 0) slotIndex = 0;
    }

    var filtered = inv.slice();
    // 排除已选装备
    for (var si = 0; si < _fusionSlots.length; si++) {
        if (si !== slotIndex && _fusionSlots[si]) {
            filtered = filtered.filter(function(e) { return e.id !== _fusionSlots[si]; });
        }
    }
    // 品质筛选
    if (_fusionQualityFilter >= 0) {
        filtered = filtered.filter(function(e) { return e.quality === _fusionQualityFilter; });
    }
    // 排除上锁装备
    filtered = filtered.filter(function(e) { return !e.locked; });

    if (filtered.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#555;">没有可选的装备</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var eq = filtered[i];
        var eqName = _qName(eq.quality) + ' ' + (eq.name || '未知');
        var eqClass = _qClass(eq.quality);
        var color = _qColor(eq.quality);
        html += '<div class="forge-item fusion-eq-item" style="cursor:pointer;" onclick="selectFusionEquip(\'' + eq.id + '\',' + slotIndex + ');this.closest(\'.modal-overlay\').remove();">' +
            '<div class="item-name" style="color:' + color + ';">' + eqName + '</div>' +
            '<div class="item-info">' +
            '<div class="item-desc">' + (eq.slotName || eq.slot || '?') + ' | 评分: ' + (eq.score || 0) + '</div></div>' +
            '<span style="font-size:11px;color:#888;">选择</span></div>';
    }
    listEl.innerHTML = html;
}

// 选择装备放入槽位
function selectFusionEquip(equipId, slotIndex) {
    if (slotIndex >= 0 && slotIndex < 3) {
        _fusionSlots[slotIndex] = equipId;
    }
    refreshForgeUI();
}

// 从槽位移除装备
function removeFusionSlot(slotIndex) {
    if (slotIndex >= 0 && slotIndex < 3) {
        _fusionSlots[slotIndex] = null;
    }
    refreshForgeUI();
}

// 渲染融合主界面
function renderFusionUI(container) {
    var inv = GameState.get('inventory') || [];
    var html = '';

    // 标题区
    html += '<div style="margin-bottom:12px;">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<div>';
    html += '<div style="font-size:14px;font-weight:bold;color:#e040fb;margin-bottom:4px;">🔨 装备升阶熔炉</div>';
    html += '<div style="font-size:11px;color:#888;">3 件同品质装备 → 1 件下一品质装备</div>';
    html += '</div>';
    var stoneCount = GameState.get('upgradeStone') || 0;
    html += '<div style="background:rgba(100,181,246,0.1);border:1px solid rgba(100,181,246,0.25);border-radius:8px;padding:6px 10px;text-align:center;min-width:50px;">';
    html += '<div style="font-size:10px;color:#64b5f6;">升级石</div>';
    html += '<div style="font-size:18px;font-weight:bold;color:#64b5f6;">🔷 ' + stoneCount + '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // 融合槽位区域（仿宝石合成布局）
    html += '<div style="display:flex;align-items:center;gap:6px;justify-content:center;margin-bottom:12px;padding:14px;background:rgba(0,0,0,0.25);border-radius:10px;border:1px solid rgba(255,255,255,0.08);">';

    // 3个输入槽
    for (var i = 0; i < 3; i++) {
        var eqId = _fusionSlots[i];
        var eq = null;
        if (eqId) {
            for (var j = 0; j < inv.length; j++) {
                if (inv[j].id === eqId) { eq = inv[j]; break; }
            }
        }

        html += '<div style="flex:1;text-align:center;">';
        if (eq) {
            var qColor = _qColor(eq.quality);
            html += '<div style="background:rgba(0,0,0,0.3);border:2px solid ' + qColor + ';border-radius:8px;padding:8px 6px;position:relative;">';
            html += '<div style="font-size:11px;color:' + qColor + ';font-weight:bold;">' + _qName(eq.quality) + '</div>';
            html += '<div style="font-size:12px;color:#ddd;margin:4px 0;">' + (eq.name || '未知') + '</div>';
            html += '<div style="font-size:10px;color:#888;">评分 ' + (eq.score || 0) + '</div>';
            html += '<button class="btn" style="font-size:9px;padding:1px 6px;margin-top:4px;" onclick="removeFusionSlot(' + i + ')">✕ 移除</button>';
            html += '</div>';
        } else {
            html += '<div style="background:rgba(255,255,255,0.04);border:2px dashed #555;border-radius:8px;padding:12px 6px;cursor:pointer;" onclick="openFusionSelectModal(' + i + ')">';
            html += '<div style="font-size:24px;color:#555;">+</div>';
            html += '<div style="font-size:11px;color:#555;">空槽位 ' + (i + 1) + '</div>';
            html += '</div>';
        }
        html += '</div>';

        // 加号连接
        if (i < 2) {
            html += '<div style="font-size:18px;color:#555;">+</div>';
        }
    }

    // 等号 + 结果预览
    html += '<div style="font-size:18px;color:#555;margin:0 4px;">→</div>';

    // 结果预览
    var previewResult = null;
    var hasAllThree = _fusionSlots[0] && _fusionSlots[1] && _fusionSlots[2];
    var previewCheck = null;
    if (hasAllThree) {
        previewCheck = canFuseEquipments(_fusionSlots);
        if (previewCheck.ok && previewCheck.equipments) {
            var srcQ = previewCheck.equipments[0].quality;
            var newQ = srcQ + 1;
            previewResult = { quality: newQ, name: _qName(newQ), color: _qColor(newQ), cost: previewCheck.cost, stoneCost: previewCheck.stoneCost };
        }
    }

    html += '<div style="flex:1;text-align:center;">';
    if (previewResult) {
        html += '<div style="background:rgba(0,0,0,0.3);border:2px solid ' + previewResult.color + ';border-radius:8px;padding:12px 6px;">';
        html += '<div style="font-size:20px;margin-bottom:4px;">🎁</div>';
        html += '<div style="font-size:13px;color:' + previewResult.color + ';font-weight:bold;">' + previewResult.name + '品质装备</div>';
        html += '<div style="font-size:10px;color:#888;margin-top:2px;">随机部位 · 等级略升</div>';
        html += '</div>';
    } else {
        html += '<div style="background:rgba(255,255,255,0.04);border:2px dashed #555;border-radius:8px;padding:12px 6px;">';
        html += '<div style="font-size:20px;color:#555;">❓</div>';
        html += '<div style="font-size:11px;color:#555;">放入3件装备<br>预览结果</div>';
        html += '</div>';
    }
    html += '</div>';

    html += '</div>'; // end flex row

    // 状态信息和操作按钮
    html += '<div style="text-align:center;margin-bottom:12px;">';

    if (previewCheck && !previewCheck.ok) {
        html += '<div style="color:#ff5252;font-size:12px;margin-bottom:8px;">⚠ ' + previewCheck.reason + '</div>';
    }

    // 融合按钮 + 消耗信息
    var canFuse = previewCheck && previewCheck.ok;
    html += '<div style="display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;">';
    if (previewResult) {
        html += '<span style="font-size:12px;color:#ffd700;">消耗: ' + previewResult.cost + ' G</span>';
        if (previewResult.stoneCost > 0) {
            html += '<span style="font-size:12px;color:#64b5f6;">🔷 升级石 x' + previewResult.stoneCost + '</span>';
        }
    }
    html += '<button class="btn ' + (canFuse ? 'btn-gold' : '') + '" ' + (canFuse ? 'onclick="executeFusion()"' : 'style="opacity:0.4;cursor:not-allowed;"') + '>' +
        '🔥 融合</button>';
    html += '<button class="btn" onclick="clearFusionSlots()">清空</button>';
    html += '</div>';

    html += '</div>';

    // 品质融合指引表
    html += '<div style="margin-top:16px;padding:12px;background:rgba(0,0,0,0.2);border-radius:8px;">';
    html += '<div style="font-size:12px;font-weight:bold;color:#888;margin-bottom:6px;">📋 升阶一览</div>';
    var qualNames = ['白', '绿', '蓝', '紫', '橙', '金'];
    var qualColors = ['#9e9e9e', '#4fc3f7', '#ff9800', '#e040fb', '#ff5722', '#ffd700'];
    for (var qi = 0; qi < 5; qi++) {
        var cost = getFusionCost(qi);
        var stoneCost = getFusionUpgradeStoneCost(qi);
        html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;margin-bottom:2px;background:rgba(0,0,0,0.15);border-radius:4px;">';
        html += '<span style="color:' + qualColors[qi] + ';font-weight:bold;font-size:12px;">' + qualNames[qi] + '</span>';
        html += '<span style="font-size:11px;color:#888;">×3</span>';
        html += '<span style="font-size:13px;color:#888;">→</span>';
        html += '<span style="color:' + qualColors[qi + 1] + ';font-weight:bold;font-size:12px;">' + qualNames[qi + 1] + '</span>';
        html += '<span style="font-size:11px;color:#555;margin-left:auto;">' + cost + ' G' + (stoneCost > 0 ? ' + ' + stoneCost + '🔷' : '') + '</span>';
        html += '</div>';
    }
    html += '<div style="font-size:10px;color:#555;margin-top:6px;">金色（最高品质）不可继续升阶</div>';
    html += '</div>';

    container.innerHTML = html;
}

// 执行融合
function executeFusion() {
    var result = doFuseEquipments(_fusionSlots);
    if (result.success && result.newEquip) {
        var qColor = _qColor(result.newEquip.quality);
        var qName = _qName(result.newEquip.quality);
        showToast('🔥 融合成功！获得 ' + qName + ' 装备: ' + (result.newEquip.name || '未知'), 'success');
        _fusionSlots = [null, null, null];
        refreshForgeUI();
    } else {
        showToast('❌ 融合失败: ' + (result.reason || '未知错误'), 'error');
    }
}
