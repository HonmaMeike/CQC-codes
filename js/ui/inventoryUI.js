// ========== 仓库UI ==========
/* global GameState */

// v3 统一架构：品质名称/类代理为 window.Quality（避免依赖 helpers.js 的 fallback 包装）
function _qName(q) { return (typeof Quality !== 'undefined' && Quality.getName) ? Quality.getName(q) : (q === 0 ? '白' : '未知'); }
function _qClass(q) { return (typeof Quality !== 'undefined' && Quality.getClass) ? Quality.getClass(q) : ''; }
function _qColor(q) { return (typeof Quality !== 'undefined' && Quality.getColor) ? Quality.getColor(q) : '#fff'; }

var invCurrentTab = 'all';
var invSelectMode = false;
var invSelections = {};
// 当前装备部位筛选（'all'/'weapon'/'offhand'/'helmet'/'armor'/'boots'）
var invSlotFilter = 'all';

// 切换装备上锁状态（防止误分解/误卖出）
function toggleLockItem(eqId) {
    var inv = GameState.get('inventory') || [];
    for (var i = 0; i < inv.length; i++) {
        if (inv[i].id === eqId) {
            inv[i].locked = !inv[i].locked;
            showToast(inv[i].locked ? '🔒 已上锁' : '🔓 已解锁', inv[i].locked ? 'warning' : 'info');
            GameState.set('inventory', inv);
            // 同步打开的详情弹窗的锁状态
            syncLockBtnInModal(eqId);
            // ★ 仓库滚动列表：只更新这一张卡片的 class（避免全量重绘）
            patchInvItem(eqId);
            return;
        }
    }
}

// 切换装备收藏状态（收藏夹）
function toggleFavoriteItem(eqId) {
    var inv = GameState.get('inventory') || [];
    for (var i = 0; i < inv.length; i++) {
        if (inv[i].id === eqId) {
            inv[i].favorited = !inv[i].favorited;
            showToast(inv[i].favorited ? '⭐ 已收藏' : '已取消收藏', 'info');
            GameState.set('inventory', inv);
            syncFavBtnInModal(eqId);
            // ★ 仓库滚动列表：只更新这一张卡片的 class（避免全量重绘）
            patchInvItem(eqId);
            return;
        }
    }
}

// ★ 仓库滚动列表：单件增量更新（不重绘整张表）
//   适用场景：上锁/解锁、收藏/取消收藏等只影响一个 DOM 节点的操作。
//   找不到节点时 fallback 到全量刷新（保险）。
function patchInvItem(eqId) {
    var grid = document.getElementById('inventory-grid');
    if (!grid) { refreshInventoryUI(); return; }
    var node = grid.querySelector('[data-eq-id="' + cssEscape(eqId) + '"]');
    if (!node) { refreshInventoryUI(); return; }
    var inv = GameState.get('inventory') || [];
    var eq = null;
    for (var i = 0; i < inv.length; i++) {
        if (inv[i].id === eqId) { eq = inv[i]; break; }
    }
    if (!eq) { refreshInventoryUI(); return; }
    // 重设 class（品质 + 锁 + 收藏）
    node.className = 'inv-item ' + _qClass(eq.quality);
    if (eq.locked) node.classList.add('inv-locked');
    if (eq.favorited) node.classList.add('inv-favorited');
    // 重建角标 DOM（内部只读，不重排其他节点）
    var existingBadges = node.querySelectorAll('.inv-badge');
    for (var b = 0; b < existingBadges.length; b++) {
        existingBadges[b].parentNode.removeChild(existingBadges[b]);
    }
    if (eq.locked) {
        var lockBadge = document.createElement('div');
        lockBadge.className = 'inv-badge inv-locked-badge';
        lockBadge.title = '已锁定·不会被分解/卖出';
        lockBadge.textContent = '🔒';
        node.appendChild(lockBadge);
    }
    if (eq.favorited) {
        var favBadge = document.createElement('div');
        favBadge.className = 'inv-badge inv-fav-badge';
        favBadge.title = '已收藏';
        favBadge.textContent = '⭐';
        node.appendChild(favBadge);
    }
}

// ES5 兼容的 CSS.escape polyfill（id 可能含特殊字符如点/空格）
function cssEscape(s) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, function(c) { return '\\' + c; });
}

// 同步详情弹窗中锁按钮的状态
function syncLockBtnInModal(eqId) {
    var btn = document.getElementById('eq-lock-btn');
    if (!btn) return;
    var inv = GameState.get('inventory') || [];
    var eq=null;var _es5_99=inv;for(var _es5_100=0;_es5_100<_es5_99.length;_es5_100++){if(_es5_99[_es5_100].id === eqId){eq=_es5_99[_es5_100];break;}};
    if (eq) {
        btn.innerHTML = (eq.locked ? '🔓 解锁' : '🔒 上锁');
        btn.style.background = eq.locked ? 'rgba(255,152,0,0.25)' : '';
        btn.style.color = eq.locked ? '#ff9800' : '';
        btn.style.borderColor = eq.locked ? '#ff9800' : '';
    }
}

function syncFavBtnInModal(eqId) {
    var btn = document.getElementById('eq-fav-btn');
    if (!btn) return;
    var inv = GameState.get('inventory') || [];
    var eq=null;var _es5_101=inv;for(var _es5_102=0;_es5_102<_es5_101.length;_es5_102++){if(_es5_101[_es5_102].id === eqId){eq=_es5_101[_es5_102];break;}};
    if (eq) {
        btn.innerHTML = (eq.favorited ? '★ 取消收藏' : '☆ 收藏');
        btn.style.background = eq.favorited ? 'rgba(255,215,0,0.25)' : '';
        btn.style.color = eq.favorited ? '#ffd700' : '';
        btn.style.borderColor = eq.favorited ? '#ffd700' : '';
    }
}

// 添加到仓库
function addToInventory(item) {
    if (!gameState.inventory) gameState.inventory = [];
    var maxItems = (typeof getWarehouseCapacity === 'function') ? getWarehouseCapacity() : ((GameState.get('maxInventory') || (GameState.get('warehousePages') ||1) *30) ||100);
    if (GameState.get('inventory').length >= maxItems) {
        showToast('仓库已满!', 'warning');
        return false;
    }
    GameState.push('inventory', item);
    // 装备图鉴记录
    if (typeof recordEquipToCodex === 'function') {
        recordEquipToCodex(item);
    }
    return true;
}

// 添加宝石到仓库（数据进 gameState.gems, 但仓库 UI 不显示宝石 — 看宝石工坊）
function addGemToInventory(gemDrop) {
    if (!gameState.gems) gameState.gems = [];
    // 兼容旧数据: 如果传入的是 string 'normal' 这种, 改成随机选个真实 gemTypeId
    if (typeof gemDrop.gemTypeId !== 'string' && typeof GEM_TYPES !== 'undefined' && GEM_TYPES.length) {
        gemDrop.gemTypeId = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)].id;
    }
    // 如果 gemDrop.gemType 是字符串(旧数据残留), 清掉, 让渲染时重新 find
    if (typeof gemDrop.gemType === 'string') gemDrop.gemType = null;
    var existing=null;var _es5_103=GameState.get('gems');for(var _es5_104=0;_es5_104<_es5_103.length;_es5_104++){if(_es5_103[_es5_104].gemTypeId === gemDrop.gemTypeId && _es5_103[_es5_104].level === gemDrop.level){existing=_es5_103[_es5_104];break;}};
    if (existing) {
        existing.count = (existing.count || 1) + 1;
    } else {
        GameState.push('gems', {
            gemTypeId: gemDrop.gemTypeId,
            level: gemDrop.level,
            count: 1,
            gemType: gemDrop.gemType || null
        });
    }
    return true;
}

// ★ 仓库滚动列表：渐变遮罩滚动事件（用 rAF 节流，省 reflow）
var _invGridScrollBound = false;
function _bindInvGridScrollFade() {
    if (_invGridScrollBound) return;
    var grid = document.getElementById('inventory-grid');
    if (!grid) return;
    _invGridScrollBound = true;
    var raf = 0;
    grid.addEventListener('scroll', function() {
        if (raf) return;
        raf = requestAnimationFrame(function() {
            raf = 0;
            var wrap = document.getElementById('inv-grid-wrap');
            if (!wrap) return;
            var hasTop = grid.scrollTop > 2;
            var hasBottom = (grid.scrollTop + grid.clientHeight) < (grid.scrollHeight - 2);
            wrap.classList.toggle('has-scroll-top', hasTop);
            wrap.classList.toggle('has-scroll-bottom', hasBottom);
        });
    }, { passive: true });
}

// 切换仓库标签
function switchInvTab(tab) {
    invCurrentTab = tab;
    invSelectMode = false;
    invSelections = {};
    invSlotFilter = 'all'; // 切换tab时重置部位筛选
    // 更新主tab按钮
    var tabNames = { all: '全部', weapon: '武器', armor: '防具', favorites: '收藏' };
    document.querySelectorAll('#inventory-tabs .inv-main-tab').forEach(function(b) {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    // 更新部位子tab显示状态
    updateSlotTabsVisibility();
    // 更新部位子tab激活态
    document.querySelectorAll('#inventory-slot-tabs .inv-slot-tab').forEach(function(b) {
        b.classList.toggle('active', b.dataset.slot === 'all');
    });
    // ★ 仓库滚动列表：切 tab 时滚回顶部（不同 tab 的物品内容不同）
    var grid = document.getElementById('inventory-grid');
    if (grid) grid.scrollTop = 0;
    refreshInventoryUI();
}

// 切换部位子筛选
function switchSlotFilter(slot) {
    invSlotFilter = slot;
    // 更新子tab按钮激活态
    document.querySelectorAll('#inventory-slot-tabs .inv-slot-tab').forEach(function(b) {
        b.classList.toggle('active', b.dataset.slot === slot);
    });
    refreshInventoryUI();
}

// 控制部位筛选子tab的显隐（仅在装备相关tab显示）
function updateSlotTabsVisibility() {
    var slotTabs = document.getElementById('inventory-slot-tabs');
    if (!slotTabs) return;
    var showSlotTabs = (invCurrentTab === 'all' || invCurrentTab === 'weapon' || invCurrentTab === 'armor' || invCurrentTab === 'favorites') && invCurrentTab !== 'materials';
    slotTabs.style.display = showSlotTabs ? 'flex' : 'none';
}

// 根据当前 tab + slot 过滤装备列表
function filterEquipList(equipList) {
    var filtered = equipList;
    // 主 tab 过滤
    if (invCurrentTab === 'weapon') {
        filtered = filtered.filter(function(eq) { return eq.slot === 'weapon' || eq.slot === 'offhand'; });
    } else if (invCurrentTab === 'armor') {
        filtered = filtered.filter(function(eq) { return eq.slot === 'helmet' || eq.slot === 'armor' || eq.slot === 'boots'; });
    } else if (invCurrentTab === 'favorites') {
        filtered = filtered.filter(function(eq) { return eq.favorited === true; });
    }
    // 部位子筛选（在 all/favorites 下生效，weapon/armor 下也兼容）
    if (invSlotFilter && invSlotFilter !== 'all') {
        filtered = filtered.filter(function(eq) { return eq.slot === invSlotFilter; });
    }
    return filtered;
}

// 整理仓库
function sortInventory() {
    var inv = GameState.get('inventory') || [];
    inv.sort(function(a, b) {
        if (b.quality !== a.quality) return b.quality - a.quality;
        return b.score - a.score;
    });
    GameState.set('inventory', inv);
    refreshInventoryUI();
    showToast('整理完成', 'success');
}

// 刷新仓库UI
function refreshInventoryUI() {
    var inv = GameState.get('inventory') || [];
    var gems = GameState.get('gems') || [];
    var grid = document.getElementById('inventory-grid');
    if (!grid) return;
    // ★ v3.5.0 材料tab：独立渲染（每次切换都刷新数据）
    if (invCurrentTab === 'materials') {
        renderMaterialsView();
        return;
    }
    // ★ v2.6.2: lazy 宝石迁移（兜底，老存档在 initGame 没及时迁移时）
    if (typeof _migrateGemSaveData === 'function') _migrateGemSaveData();

    // ★ BUG#5 修复：名称转义 + 长度截断，防 HTML 注入与重叠
    function sanitizeName(n) {
        if (!n) return '未命名';
        var s = String(n).trim();
        if (!s || s === 'undefined' || s === 'null') return '未命名';
        // 1. HTML 转义
        s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        // 2. 长度截断：中文字符按 2 字符计算，最大 8 字符
        var maxLen = 8;
        if (s.length > maxLen) s = s.substring(0, maxLen) + '…';
        return s;
    }

    // 过滤
    // ★ v2.6.4 Round 2.1: 仓库去除宝石显示 — 宝石只进 gameState.gems 数据, 不在仓库 UI 里出现
    //   玩家获取宝石后, 直接在 宝石工坊 (gem screen) 里管理. 仓库只显示装备.
    var displayItems = [];
    // 装备类 tab（all / weapon / armor / favorites） — 使用统一 filterEquipList
    var equipList = filterEquipList(inv);
    equipList.forEach(function(eq) {
        var iconDataUrl = IconRenderer ? IconRenderer.getEquipIcon(eq) : (eq.slotIcon || '');
        displayItems.push({ type: 'equip', data: eq, name: _qName(eq.quality) + ' ' + eq.name, icon: iconDataUrl, iconIsUrl: true, quality: eq.quality });
    });

    // ★ 仓库滚动列表：保存滚动位置、批量插入、恢复滚动位置
    var prevScrollTop = grid.scrollTop;
    var prevScrollHeight = grid.scrollHeight;

    // 用 DocumentFragment 批量构建（避免逐个 appendChild 触发的多次重排）
    var frag = document.createDocumentFragment();

    // ★ v4.1 修复: 防御性派生空名 (老存档/异常流程可能产生 name='' 的装备, 详情面板空字符串)
    //   若 eq.name 空 → 根据 weaponType/armorType 现推一个, 否则兜底 '未知道具'
    function _deriveEquipName(eq) {
        if (eq.name) return eq.name;
        if (eq.weaponType && typeof getRandomWeaponName === 'function') {
            var n = getRandomWeaponName(eq.slot, eq.weaponType);
            if (n) return n;
        }
        if (eq.armorType && typeof getRandomArmorName === 'function') {
            var n = getRandomArmorName(eq.slot, eq.armorType);
            if (n) return n;
        }
        return '未知道具';
    }
    for (var i = 0; i < displayItems.length; i++) {
        var it = displayItems[i];
        if (it.type === 'equip' && (!it.name || it.name.trim() === '' || /^(白|绿|蓝|紫|橙|金|未知)(\s*undefined)?$/.test(it.name))) {
            it.name = _qName(it.quality) + ' ' + _deriveEquipName(it.data);
        }
        frag.appendChild(createInvItemElement(it, sanitizeName));
    }

    // 空状态
    if (displayItems.length === 0) {
        var emptyText = invCurrentTab === 'favorites' ? '收藏夹为空，⭐ 点击装备详情可加入收藏' : '仓库为空';
        var empty = document.createElement('div');
        empty.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px 20px;color:#555;font-size:13px;';
        empty.textContent = emptyText;
        frag.appendChild(empty);
    }

    // 一次性替换 DOM（仅一次 reflow）
    grid.innerHTML = '';
    grid.appendChild(frag);

    // ★ 恢复滚动位置：刷新后内容高度变化需要计算偏移
    if (prevScrollTop > 0) {
        var newScrollHeight = grid.scrollHeight;
        // 仅在新内容更矮时回拉到底部（避免跳变）
        if (newScrollHeight >= prevScrollHeight) {
            grid.scrollTop = prevScrollTop;
        }
    }

    // 更新物品计数
    var invCount = inv.length;
    document.getElementById('inv-count').textContent = invCount + '/' + (typeof getWarehouseCapacity === 'function' ? getWarehouseCapacity() : (GameState.get('maxInventory') ||100));

    // 更新批量操作栏
    updateBatchUI();
    // 更新部位子tab显隐
    updateSlotTabsVisibility();

    // ★ 仓库滚动列表：绑定滚动事件（仅一次）并立即同步遮罩状态
    _bindInvGridScrollFade();
    // 用 rAF 推迟一帧，确保新内容高度已应用
    requestAnimationFrame(function() {
        var wrap = document.getElementById('inv-grid-wrap');
        if (!wrap || !grid) return;
        var hasTop = grid.scrollTop > 2;
        var hasBottom = (grid.scrollTop + grid.clientHeight) < (grid.scrollHeight - 2);
        wrap.classList.toggle('has-scroll-top', hasTop);
        wrap.classList.toggle('has-scroll-bottom', hasBottom);
    });
}

// ★ 仓库滚动列表：提取的单个物品 DOM 构建函数（供主渲染 + 增量更新复用）
function createInvItemElement(item, sanitizeName) {
    if (!sanitizeName) {
        sanitizeName = function(n) {
            if (!n) return '未命名';
            var s = String(n).trim();
            if (!s || s === 'undefined' || s === 'null') return '未命名';
            s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            var maxLen = 8;
            if (s.length > maxLen) s = s.substring(0, maxLen) + '…';
            return s;
        };
    }
    var div = document.createElement('div');
    div.className = 'inv-item ' + _qClass(item.quality);
    if (item.type === 'equip' && item.data.locked) div.classList.add('inv-locked');
    if (item.type === 'equip' && item.data.favorited) div.classList.add('inv-favorited');
    var eqId = item.type === 'equip' ? item.data.id : null;
    // ★ 滚动列表标记：用于 patchInvItem 精准定位
    if (eqId) div.setAttribute('data-eq-id', eqId);

    // 选择模式勾选框
    var checkHtml = '';
    if (invSelectMode && eqId) {
        var checked = invSelections[eqId] ? 'checked' : '';
        checkHtml = '<div class="inv-checkbox" onclick="event.stopPropagation();toggleInvSelect(\'' + eqId + '\')"><input type="checkbox" ' + checked + '></div>';
    }

    // 价值显示
    var valueHtml = '';
    if (item.type === 'equip') {
        valueHtml = '<div class="inv-value">' + calcEquipValue(item.data) + 'G</div>';
    }

    // 锁/收藏角标
    var badgeHtml = '';
    if (item.type === 'equip') {
        if (item.data.locked) {
            badgeHtml += '<div class="inv-badge inv-locked-badge" title="已锁定·不会被分解/卖出">🔒</div>';
        }
        if (item.data.favorited) {
            badgeHtml += '<div class="inv-badge inv-fav-badge" title="已收藏">⭐</div>';
        }
        // 强化等级角标
        var enhanceLvl = (typeof getEquipEnhanceLevel === 'function') ? getEquipEnhanceLevel(item.data.id) : 0;
        if (enhanceLvl > 0) {
            badgeHtml += '<div class="inv-badge inv-enhance-badge" style="position:absolute;top:2px;left:2px;background:linear-gradient(135deg,#ff6f00,#ff9800);color:#fff;font-size:9px;font-weight:bold;padding:1px 4px;border-radius:4px;line-height:1.2;">+' + enhanceLvl + '</div>';
        }
    }

    var iconHtml = item.iconIsUrl ?
        '<img class="item-icon-img" src="' + item.icon + '" alt="">' :
        '<div class="item-icon">' + item.icon + '</div>';
    // ★ BUG#5 修复：名称做转义+截断，保证显示且不重叠
    div.innerHTML = checkHtml + badgeHtml + '<div class="item-icon-wrap">' + iconHtml + '</div>' +
        '<div class="item-name" title="' + sanitizeName(item.name) + '">' + sanitizeName(item.name) + '</div>' + valueHtml;
    (function(itemData) {
        div.addEventListener('click', function() {
            showItemDetail(itemData);
        });
    })(item);
    return div;
}

// 更新批量操作UI
function updateBatchUI() {
    var batchActions = document.getElementById('batch-actions');
    batchActions.style.display = invSelectMode ? 'flex' : 'none';
    var selCount = Object.keys(invSelections).length;
    document.getElementById('batch-sel-count').textContent = selCount > 0 ? '已选 ' + selCount + ' 件' : '未选择';
    document.getElementById('batch-sell-btn').style.display = selCount > 0 ? 'inline-block' : 'none';
    document.getElementById('batch-decompose-btn').style.display = selCount > 0 ? 'inline-block' : 'none';
}

// 切换选择模式
function toggleSelectMode() {
    invSelectMode = !invSelectMode;
    if (!invSelectMode) {
        invSelections = {};
    }
    refreshInventoryUI();
}

// 切换选中状态
function toggleInvSelect(eqId) {
    if (invSelections[eqId]) {
        delete invSelections[eqId];
    } else {
        invSelections[eqId] = true;
    }
    // 只更新选中数量显示，避免全量重绘
    updateBatchUI();
}

// 按品质一键选择
function selectByQuality(qualityMin, qualityMax) {
    if (qualityMax === undefined) qualityMax = qualityMin;
    var inv = GameState.get('inventory') || [];
    invSelectMode = true;
    invSelections = {};
    for (var i = 0; i < inv.length; i++) {
        if (inv[i].quality >= qualityMin && inv[i].quality <= qualityMax) {
            invSelections[inv[i].id] = true;
        }
    }
    refreshInventoryUI();
    var count = Object.keys(invSelections).length;
    showToast('已选择 ' + count + ' 件装备', 'info');
}

// 一键卖出白装/绿装/蓝装（带确认提示）
function sellWhite() { sellByQualityPreset(0); }
function sellGreen() { sellByQualityPreset(1); }

// 按品质预设一键卖出（带确认弹窗）
function sellByQualityPreset(quality) {
    var inv = GameState.get('inventory') || [];
    var matching = inv.filter(function(eq) { return eq.quality === quality && !eq.locked; });
    if (matching.length === 0) {
        showToast('没有可出售的' + QUALITY_NAMES[quality] + '品质装备（含上锁装备被跳过）', 'info');
        return;
    }
    var totalVal = 0;
    for (var i = 0; i < matching.length; i++) {
        totalVal += calcEquipValue(matching[i]);
    }
    var qualName = QUALITY_NAMES[quality];
    showConfirm(
        '一键出售',
        '将出售 <span class="' + _qClass(quality) + '">' + qualName + '品质</span> 装备共 <b>' + matching.length + '</b> 件，<br>预计获得 <span style="color:#ffd700;">' + totalVal + ' G</span><br><br><span style="font-size:11px;color:#888;">此操作不可撤销</span>',
        function() {
            executeBatchSellByFilter(function(eq) { return eq.quality === quality; });
        }
    );
}

// 按品质范围筛选后执行卖出（自动跳过上锁装备）
function executeBatchSellByFilter(filterFn) {
    var inv = GameState.get('inventory') || [];
    var totalGold = 0;
    var count = 0;
    var skippedLocked = 0;
    for (var i = inv.length - 1; i >= 0; i--) {
        if (filterFn(inv[i])) {
            if (inv[i].locked) { skippedLocked++; continue; }
            totalGold += calcEquipValue(inv[i]);
            inv.splice(i, 1);
            count++;
        }
    }
    GameState.set('inventory', inv);
    GameState.mutate('gold', function(g) { return (g || 0) + totalGold; });
    invSelections = {};
    invSelectMode = false;
    refreshInventoryUI();
    updateResources();
    var lockedTip = skippedLocked > 0 ? '（跳过' + skippedLocked + '件上锁装备）' : '';
    showToast('卖出 ' + count + ' 件装备，获得 ' + totalGold + ' G ' + lockedTip, 'success');
}

// 打开智能出售弹窗
function openSmartSell() {
    var html = '<div class="modal-overlay" id="smart-sell-overlay"><div class="modal-content" style="position:relative;"><h3>智能出售</h3>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>';
    html += '<p style="font-size:12px;color:#888;margin-bottom:10px;">选择要出售的品质范围：</p>';
    html += '<div id="smart-sell-options">';
    var inv = GameState.get('inventory') || [];
    for (var q = 0; q < QUALITY_NAMES.length; q++) {
        var count = inv.filter(function(eq) { return eq.quality === q; }).length;
        var val = 0;
        inv.filter(function(eq) { return eq.quality === q; }).forEach(function(eq) { val += calcEquipValue(eq); });
        var qualClass = _qClass(q);
        var checked = (q <= 2) ? 'checked' : ''; // 默认选中白绿蓝
        html += '<label class="smart-sell-row" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:6px;margin-bottom:4px;cursor:pointer;">' +
            '<input type="checkbox" class="smart-sell-check" data-quality="' + q + '" ' + checked + '>' +
            '<span class="' + qualClass + '">' + QUALITY_NAMES[q] + '</span>' +
            '<span style="flex:1;font-size:12px;color:#888;">' + count + ' 件</span>' +
            '<span style="font-size:12px;color:#ffd700;">' + val + ' G</span></label>';
    }
    html += '</div>';
    html += '<div style="margin-top:10px;padding:8px;text-align:center;background:rgba(255,215,0,0.08);border-radius:6px;">' +
        '预估合计: <span id="smart-sell-total" style="color:#ffd700;font-weight:bold;font-size:16px;">0</span> G</div>';
    html += '<div style="margin-top:10px;display:flex;gap:8px;">' +
        '<button class="btn btn-gold" style="flex:1;" id="smart-sell-confirm">确认出售</button>' +
        '<button class="btn" id="smart-sell-cancel">取消</button></div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    var overlay = div.firstElementChild;
    document.body.appendChild(overlay);

    // ===== 可靠的关闭逻辑：点击遮罩层（不是 modal-content）才关闭 =====
    overlay.addEventListener('click', function(e) {
        if (e.target === e.currentTarget) overlay.remove();
    });
    // modal-content 阻止事件冒泡
    var content = overlay.querySelector('.modal-content');
    if (content) {
        content.addEventListener('click', function(e) {
            e.stopPropagation();
            // 点击复选框时更新总价（click 事件可靠冒泡到 modal-content）
            if (e.target && e.target.classList && e.target.classList.contains('smart-sell-check')) {
                updateSmartSellTotal();
            }
        });
    }
    // 取消按钮：直接关闭
    document.getElementById('smart-sell-cancel').addEventListener('click', function() { overlay.remove(); });
    // 确认按钮：调用 executeSmartSell（会自己处理关闭）
    document.getElementById('smart-sell-confirm').addEventListener('click', executeSmartSell);

    // 计算并显示初始总价
    updateSmartSellTotal();
}

// 更新智能出售总价
function updateSmartSellTotal() {
    var checks = document.querySelectorAll('.smart-sell-check');
    var inv = GameState.get('inventory') || [];
    var total = 0;
    for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) {
            var q = parseInt(checks[i].dataset.quality);
            inv.filter(function(eq) { return eq.quality === q; }).forEach(function(eq) { total += calcEquipValue(eq); });
        }
    }
    var el = document.getElementById('smart-sell-total');
    if (el) el.textContent = total;
}

// 执行智能出售
function executeSmartSell() {
    var checks = document.querySelectorAll('.smart-sell-check:checked');
    if (checks.length === 0) {
        showToast('请至少选择一种品质', 'warning');
        return;
    }
    var qualities = [];
    for (var i = 0; i < checks.length; i++) {
        qualities.push(parseInt(checks[i].dataset.quality));
    }
    // 关闭弹窗
    var overlay = checks[0].closest('.modal-overlay');
    if (overlay) overlay.remove();

    executeBatchSellByFilter(function(eq) {
        return qualities.indexOf(eq.quality) !== -1;
    });
}

// ★ v2.6.4 Round 2.4: 智能 = 出售/分解 tab 卡片 (决策"3")
//   - 顶部 2 tab: 💰 出售 | ⚙ 分解
//   - tab 切换时, 重新渲染品质 checkbox + 预估合计
//   - 跟 openSmartSell 同卡片样式
function openSmartAction() {
    var html = '<div class="modal-overlay" id="smart-action-overlay"><div class="modal-content" style="position:relative;"><h3>智能处理</h3>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>';
    // tab 切换
    html += '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<button id="smart-action-tab-sell" class="btn" style="flex:1;background:linear-gradient(135deg,#ffd700,#ff9800);color:#1a0f1f;font-weight:bold;" onclick="switchSmartActionTab(\'sell\')">💰 出售</button>' +
        '<button id="smart-action-tab-decomp" class="btn" style="flex:1;" onclick="switchSmartActionTab(\'decomp\')">⚙ 分解</button>' +
        '</div>';
    html += '<div id="smart-action-body">';
    html += renderSmartActionBody('sell');
    html += '</div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    var overlay = div.firstElementChild;
    document.body.appendChild(overlay);

    // 关闭逻辑
    overlay.addEventListener('click', function(e) {
        if (e.target === e.currentTarget) overlay.remove();
    });
    var content = overlay.querySelector('.modal-content');
    if (content) {
        content.addEventListener('click', function(e) {
            e.stopPropagation();
            if (e.target && e.target.classList && e.target.classList.contains('smart-action-check')) {
                if (typeof window._smartActionTab === 'undefined' || window._smartActionTab === 'sell') {
                    updateSmartSellTotalAction();
                } else {
                    updateSmartDecompTotalAction();
                }
            }
        });
    }
    // 初始 tab
    window._smartActionTab = 'sell';
    updateSmartSellTotalAction();
}

// 切换智能处理 tab (出售/分解)
function switchSmartActionTab(tab) {
    window._smartActionTab = tab;
    var sellBtn = document.getElementById('smart-action-tab-sell');
    var decompBtn = document.getElementById('smart-action-tab-decomp');
    if (sellBtn) {
        sellBtn.style.background = (tab === 'sell') ? 'linear-gradient(135deg,#ffd700,#ff9800)' : '';
        sellBtn.style.color = (tab === 'sell') ? '#1a0f1f' : '';
    }
    if (decompBtn) {
        decompBtn.style.background = (tab === 'decomp') ? 'linear-gradient(135deg,#ffd700,#ff9800)' : '';
        decompBtn.style.color = (tab === 'decomp') ? '#1a0f1f' : '';
    }
    var body = document.getElementById('smart-action-body');
    if (body) {
        body.innerHTML = renderSmartActionBody(tab);
        if (tab === 'sell') updateSmartSellTotalAction();
        else updateSmartDecompTotalAction();
    }
}

// 渲染智能处理卡片 body
function renderSmartActionBody(tab) {
    var h = '';
    h += '<p style="font-size:12px;color:#888;margin-bottom:10px;">' + (tab === 'sell' ? '选择要出售的品质范围：' : '选择要分解的品质范围：') + '</p>';
    h += '<div id="smart-action-options">';
    var inv = GameState.get('inventory') || [];
    for (var q = 0; q < QUALITY_NAMES.length; q++) {
        var count = inv.filter(function(eq) { return eq.quality === q && !eq.locked; }).length;
        var checked = (q <= 2) ? 'checked' : ''; // 默认白绿蓝
        var qualClass = _qClass(q);
        var extraText = '';
        if (tab === 'sell') {
            var val = 0;
            inv.filter(function(eq) { return eq.quality === q; }).forEach(function(eq) { val += calcEquipValue(eq); });
            extraText = '<span style="font-size:12px;color:#ffd700;">' + val + ' G</span>';
        } else {
            var dust = 0, stone = 0;
            inv.filter(function(eq) { return eq.quality === q; }).forEach(function(eq) {
                var m = decomposeEquip(eq);
                dust += m.dust;
                stone += m.reforgestone;
            });
            extraText = '<span style="font-size:11px;color:#ffd700;">粉尘x' + dust + (stone > 0 ? '<span style="color:#e040fb;">+重铸石x' + stone + '</span>' : '') + '</span>';
        }
        h += '<label class="smart-action-row" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:6px;margin-bottom:4px;cursor:pointer;">' +
            '<input type="checkbox" class="smart-action-check" data-quality="' + q + '" ' + checked + '>' +
            '<span class="' + qualClass + '">' + QUALITY_NAMES[q] + '</span>' +
            '<span style="flex:1;font-size:12px;color:#888;">' + count + ' 件</span>' +
            extraText + '</label>';
    }
    h += '</div>';
    var totalLabel = tab === 'sell' ? 'G' : '';
    var totalId = tab === 'sell' ? 'smart-action-total-sell' : 'smart-action-total-decomp';
    h += '<div style="margin-top:10px;padding:8px;text-align:center;background:rgba(255,215,0,0.08);border-radius:6px;">' +
        (tab === 'sell' ? '预估合计: ' : '预估获得: ') +
        '<span id="' + totalId + '" style="color:#ffd700;font-weight:bold;font-size:16px;">0</span> ' + totalLabel + '</div>';
    var btnLabel = tab === 'sell' ? '确认出售' : '确认分解';
    h += '<div style="margin-top:10px;display:flex;gap:8px;">' +
        '<button class="btn btn-gold" style="flex:1;" id="smart-action-confirm" onclick="executeSmartAction(\'' + tab + '\')">' + btnLabel + '</button>' +
        '<button class="btn" onclick="document.getElementById(\'smart-action-overlay\').remove()">取消</button></div>';
    return h;
}

function updateSmartSellTotalAction() {
    var checks = document.querySelectorAll('.smart-action-check');
    var inv = GameState.get('inventory') || [];
    var total = 0;
    for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) {
            var q = parseInt(checks[i].dataset.quality, 10);
            inv.filter(function(eq) { return eq.quality === q; }).forEach(function(eq) { total += calcEquipValue(eq); });
        }
    }
    var el = document.getElementById('smart-action-total-sell');
    if (el) el.textContent = total;
}

function updateSmartDecompTotalAction() {
    var checks = document.querySelectorAll('.smart-action-check');
    var inv = GameState.get('inventory') || [];
    var totalDust = 0, totalStone = 0;
    for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) {
            var q = parseInt(checks[i].dataset.quality, 10);
            inv.filter(function(eq) { return eq.quality === q; }).forEach(function(eq) {
                var m = decomposeEquip(eq);
                totalDust += m.dust;
                totalStone += m.reforgestone;
            });
        }
    }
    var el = document.getElementById('smart-action-total-decomp');
    if (el) el.innerHTML = '粉尘x' + totalDust + (totalStone > 0 ? '<span style="color:#e040fb;">+重铸石x' + totalStone + '</span>' : '');
}

// 执行智能处理
function executeSmartAction(tab) {
    var checks = document.querySelectorAll('.smart-action-check:checked');
    if (checks.length === 0) {
        showToast('请至少选择一种品质', 'warning');
        return;
    }
    var qualities = [];
    for (var i = 0; i < checks.length; i++) {
        qualities.push(parseInt(checks[i].dataset.quality, 10));
    }
    var overlay = checks[0].closest('.modal-overlay');
    if (overlay) overlay.remove();

    if (tab === 'sell') {
        executeBatchSellByFilter(function(eq) { return qualities.indexOf(eq.quality) !== -1; });
    } else {
        var inv = GameState.get('inventory') || [];
        var totalDust = 0, totalStone = 0, count = 0, skippedLocked = 0;
        for (var i = inv.length - 1; i >= 0; i--) {
            if (qualities.indexOf(inv[i].quality) !== -1) {
                if (inv[i].locked) { skippedLocked++; continue; }
                var mats = decomposeEquip(inv[i]);
                totalDust += mats.dust;
                totalStone += mats.reforgestone;
                inv.splice(i, 1);
                count++;
            }
        }
        GameState.set('inventory', inv);
        GameState.mutate('forgeDust', function(v) { return (v || 0) + totalDust; });
        GameState.mutate('reforgestone', function(v) { return (v || 0) + totalStone; });
        refreshInventoryUI();
        updateResources();
        var lockedTip = skippedLocked > 0 ? '（跳过' + skippedLocked + '件上锁装备）' : '';
        showToast('分解 ' + count + ' 件装备，获得粉尘x' + totalDust + (totalStone > 0 ? ', 重铸石x' + totalStone : '') + ' ' + lockedTip, 'success');
    }
}

// 批量卖出选中（跳过上锁装备）
function confirmBatchSell() {
    var ids = Object.keys(invSelections);
    if (ids.length === 0) { showToast('请先选择装备', 'warning'); return; }
    var totalGold = 0;
    var count = 0;
    var skippedLocked = 0;
    var inv = GameState.get('inventory') || [];
    for (var i = inv.length - 1; i >= 0; i--) {
        if (invSelections[inv[i].id]) {
            if (inv[i].locked) { skippedLocked++; continue; }
            totalGold += calcEquipValue(inv[i]);
            inv.splice(i, 1);
            count++;
        }
    }
    GameState.set('inventory', inv);
    GameState.mutate('gold', function(g) { return (g || 0) + totalGold; });
    invSelections = {};
    invSelectMode = false;
    refreshInventoryUI();
    updateResources();
    var lockedTip = skippedLocked > 0 ? '（跳过' + skippedLocked + '件上锁装备）' : '';
    showToast('卖出 ' + count + ' 件装备，获得 ' + totalGold + ' G ' + lockedTip, 'success');
}

// 批量分解选中（跳过上锁装备）
function confirmBatchDecompose() {
    var ids = Object.keys(invSelections);
    if (ids.length === 0) { showToast('请先选择装备', 'warning'); return; }
    var totalDust = 0;
    var totalStone = 0;
    var count = 0;
    var skippedLocked = 0;
    var inv = GameState.get('inventory') || [];
    for (var i = inv.length - 1; i >= 0; i--) {
        if (invSelections[inv[i].id]) {
            if (inv[i].locked) { skippedLocked++; continue; }
            var mats = decomposeEquip(inv[i]);
            totalDust += mats.dust;
            totalStone += mats.reforgestone;
            inv.splice(i, 1);
            count++;
        }
    }
    GameState.set('inventory', inv);
    GameState.mutate('forgeDust', function(v) { return (v || 0) + totalDust; });
    GameState.mutate('reforgestone', function(v) { return (v || 0) + totalStone; });
    invSelections = {};
    invSelectMode = false;
    refreshInventoryUI();
    updateResources();
    var lockedTip = skippedLocked > 0 ? '（跳过' + skippedLocked + '件上锁装备）' : '';
    showToast('分解 ' + count + ' 件装备，获得粉尘x' + totalDust + (totalStone > 0 ? ', 重铸石x' + totalStone : '') + ' ' + lockedTip, 'success');
}

// 显示物品详情
function showItemDetail(item) {
    var eq = item.data;
    var qColors = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'];
    var qTheme = qColors[eq.quality] || '#9e9e9e';
    var qRgba = qTheme + '22';

    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="padding:0;overflow:hidden;border-radius:12px;border:2px solid ' + qTheme + ';position:relative;">';
    html += '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>';
    if (item.type === 'equip' && eq.affixes) {
        var eqVal = calcEquipValue(eq);
        // ===== 顶部品质色带 =====
        html += '<div style="background:linear-gradient(135deg,' + qTheme + '44,' + qTheme + '22);padding:14px 16px 10px;border-bottom:1px solid ' + qTheme + '44;">';
        html += '<div style="display:flex;align-items:center;gap:10px;">';
        html += '<div style="width:44px;height:44px;border-radius:8px;background:' + qRgba + ';border:2px solid ' + qTheme + ';display:flex;align-items:center;justify-content:center;font-size:22px;">' + (typeof getSlotIcon === 'function' ? getSlotIcon(eq.slot, eq.id || '', eq) : (eq.slotIcon || '📦')) + '</div>';
        html += '<div style="flex:1;">';
        html += '<div style="font-size:16px;font-weight:bold;color:' + qTheme + ';">' + _qName(eq.quality) + ' ' + eq.name + '</div>';
        html += '<div style="display:flex;gap:12px;font-size:12px;color:#aaa;margin-top:3px;">';
        html += '<span>LV.' + (eq.level || 1) + '</span>';
        html += '<span>' + eq.slotName + '</span>';
        var eType = eq.weaponType ? (WEAPON_TYPE_NAMES[eq.weaponType] || eq.weaponType) : (eq.armorType ? (ARMOR_TYPE_NAMES[eq.armorType] || eq.armorType) : '');
        if (eType) html += '<span>' + eType + '</span>';
        html += '</div></div>';
        html += '<div style="text-align:center;">';
        html += '<div style="font-size:20px;font-weight:bold;color:' + qTheme + ';">' + (eq.score || 0) + '</div>';
        html += '<div style="font-size:10px;color:#888;">评分</div></div>';
        html += '</div></div>';

        // ===== 基础属性（装备固有属性）=====
        html += '<div style="padding:10px 14px 4px;">';
        html += '<div style="font-size:10px;color:#777;margin-bottom:4px;">基础属性</div>';
        if (eq.baseStats && Array.isArray(eq.baseStats) && eq.baseStats.length > 0) {
            for (var bsi = 0; bsi < eq.baseStats.length; bsi++) {
                var bs = eq.baseStats[bsi];
                if (bs && bs.stat) {
                    var bsIcon = { atk: '⚔️', def: '🛡', hp: '❤️', spd: '💨' }[bs.stat] || '';
                    var bsName = { atk: '攻击力', def: '防御力', hp: '生命', spd: '速度' }[bs.stat] || bs.stat;
                    var bsColor = { atk: '#ff5252', def: '#4caf50', hp: '#f44336', spd: '#29b6f6' }[bs.stat] || '#ccc';
                    html += '<div style="display:flex;align-items:center;padding:5px 6px;border-radius:4px;background:rgba(255,255,255,0.04);margin-bottom:2px;">';
                    html += '<span style="font-size:12px;margin-right:6px;">' + bsIcon + '</span>';
                    html += '<span style="font-size:12px;color:' + bsColor + ';flex:1;">' + bsName + '</span>';
                    html += '<span style="color:#fff;font-size:13px;font-weight:bold;">+' + bs.value + '</span>';
                    html += '</div>';
                }
            }
        } else {
            var baseStatData = getEquipBaseStat(eq.slot, eq.level, eq.quality);
            if (baseStatData) {
                html += '<div style="display:flex;align-items:center;padding:5px 6px;border-radius:4px;background:rgba(255,255,255,0.04);">';
                html += '<span style="font-size:12px;margin-right:6px;">' + baseStatData.icon + '</span>';
                html += '<span style="font-size:12px;color:#ccc;flex:1;">' + baseStatData.name + '</span>';
                html += '<span style="color:#fff;font-size:13px;font-weight:bold;">+' + baseStatData.value + '</span>';
                html += '</div>';
            }
        }
        html += '</div>';

        // ===== 装备词条 =====
        html += '<div style="padding:8px 14px 10px;">';
        html += '<div style="font-size:10px;color:#777;margin-bottom:4px;">装备词条</div>';
        for (var i = 0; i < eq.affixes.length; i++) {
            var aff = eq.affixes[i];
            var affData=null;var _es5_105=AFFIX_POOL;for(var _es5_106=0;_es5_106<_es5_105.length;_es5_106++){if(_es5_105[_es5_106].id === aff.id){affData=_es5_105[_es5_106];break;}};
            var affName = affData ? affData.name : aff.id;
            var affQ = aff.affixQuality !== undefined ? aff.affixQuality : eq.quality;
            var isPct = affData && (affData.type === 'pct' || aff.stat === 'crit' || aff.stat === 'critDmg');
            var affVal = aff.value + (isPct ? '%' : '');
            var bgRow = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
            html += '<div style="display:flex;align-items:center;padding:4px 6px;border-radius:4px;background:' + bgRow + ';">';
            html += '<span style="color:' + qColors[affQ] + ';font-size:8px;margin-right:6px;">◆</span>';
            html += '<span class="' + _qClass(affQ) + '" style="font-size:12px;flex:1;">' + affName + '</span>';
            html += '<span style="color:#fff;font-size:12px;font-weight:bold;">+' + affVal + '</span>';
            html += '</div>';
        }
        html += '</div>';

        // ===== 宝石槽位 =====
        html += '<div style="padding:0 14px 10px;">';
        html += '<div style="font-size:11px;color:#888;margin-bottom:6px;">━━ 宝石镶嵌 (' + (eq.sockets || 0) + '孔) ━━</div>';
        html += '<div style="display:flex;gap:6px;">';
        for (var si = 0; si < (eq.sockets || 0); si++) {
            var gem = (eq.gems || [])[si];
            if (gem) {
                var gt=null;var _es5_107=GEM_TYPES;for(var _es5_108=0;_es5_108<_es5_107.length;_es5_108++){if(_es5_107[_es5_108].id === gem.gemTypeId){gt=_es5_107[_es5_108];break;}};
                var gemIcon = gt ? gt.icon : '💎';
                var gemVal2 = gt ? getGemValue(gt, gem.level) : 0;
                var gemUnit = gt && (gt.statType === 'pct' || gt.stat === 'crit' || gt.stat === 'critDmg') ? '%' : '';
                html += '<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:6px;padding:6px;text-align:center;border:1px solid ' + (gt ? gt.color : '#555') + '44;">';
                html += '<div style="font-size:18px;">' + gemIcon + '</div>';
                html += '<div style="font-size:10px;color:' + (gt ? gt.color : '#aaa') + ';">Lv.' + gem.level + '</div>';
                if (gt) html += '<div style="font-size:9px;color:#888;">+' + gemVal2 + gemUnit + '</div>';
                html += '</div>';
            } else {
                html += '<div style="flex:1;background:rgba(255,255,255,0.03);border-radius:6px;padding:6px;text-align:center;border:1px dashed rgba(255,255,255,0.1);">';
                html += '<div style="font-size:18px;color:rgba(255,255,255,0.15);">◇</div>';
                html += '<div style="font-size:9px;color:rgba(255,255,255,0.15);">空槽</div>';
                html += '</div>';
            }
        }
        html += '</div></div>';

        // ===== 强化等级 =====
        var enhanceLvl = (typeof getEquipEnhanceLevel === 'function') ? getEquipEnhanceLevel(eq.id) : 0;
        var enhanceColor = '#ff9800';
        if (enhanceLvl >= 15) enhanceColor = '#ffd700';
        else if (enhanceLvl >= 10) enhanceColor = '#ff5722';
        else if (enhanceLvl >= 6) enhanceColor = '#ff9800';
        html += '<div style="padding:6px 14px;background:rgba(255,152,0,0.06);border-top:1px solid rgba(255,152,0,0.1);border-bottom:1px solid rgba(255,152,0,0.1);">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;">';
        html += '<div>';
        html += '<span style="font-size:10px;color:#888;">强化等级</span>';
        html += '<div style="font-size:13px;color:' + enhanceColor + ';font-weight:bold;">';
        if (enhanceLvl > 0) {
            html += '+' + enhanceLvl + ' ' + getEnhanceStarsHtml(enhanceLvl);
        } else {
            html += '<span style="color:#666;font-weight:normal;">+0 未强化</span>';
        }
        html += '</div></div>';
        // 强化属性加成显示
        if (enhanceLvl > 0) {
            var bonusPct = enhanceLvl * 5;
            html += '<div style="text-align:right;font-size:11px;color:#ff9800;">全属性 +' + bonusPct + '%</div>';
        }
        html += '</div></div>';

        // ★ 强化按钮已移至角色详情装备栏（heroUI.showEquipDetail）
        // 仓库装备详情只显示强化等级，不提供强化按钮

        // ===== 底部信息 =====
        html += '<div style="padding:0 14px 6px;font-size:11px;color:#888;">';
        html += '品质: ' + _qName(eq.quality) + ' | 等级: LV.' + (eq.level || 1) + ' | 价值: ' + eqVal + 'G';
        var decomposeMats = decomposeEquip(eq);
        if (eq.weaponType) {
            html += '<br>类型: ' + (WEAPON_TYPE_NAMES[eq.weaponType] || eq.weaponType);
            var compClasses = getWeaponCompatibleClasses(eq.slot, eq.weaponType);
            if (compClasses.length > 0) {
                html += ' | 可配带: <span style="color:#4fc3f7;">' + compClasses.join('、') + '</span>';
            }
        }
        if (eq.armorType) {
            html += '<br>护甲: ' + (ARMOR_TYPE_NAMES[eq.armorType] || eq.armorType);
            var armorClasses = getArmorCompatibleClasses(eq.armorType);
            if (armorClasses.length > 0) {
                html += ' | 可配带: <span style="color:#4fc3f7;">' + armorClasses.join('、') + '</span>';
            }
        }
        html += '</div>';
        if (eq.setId && SET_DATA[eq.setId]) {
            html += '<div style="padding:0 14px 6px;font-size:11px;color:#ffd700;">套装: ' + SET_DATA[eq.setId].name + '</div>';
        }
        // ===== 锁/收藏 快捷操作行 =====
        html += '<div style="display:flex;gap:6px;padding:0 14px 8px;">' +
            '<button id="eq-lock-btn" class="btn" style="flex:1;font-size:12px;padding:6px 4px;" onclick="toggleLockItem(\'' + eq.id + '\');event.stopPropagation();">' + (eq.locked ? '🔓 解锁' : '🔒 上锁') + '</button>' +
            '<button id="eq-fav-btn" class="btn" style="flex:1;font-size:12px;padding:6px 4px;" onclick="toggleFavoriteItem(\'' + eq.id + '\');event.stopPropagation();">' + (eq.favorited ? '★ 取消收藏' : '☆ 收藏') + '</button>' +
            '</div>';
        // ★ v2.6.4 Round 2.3: 装备详情卡片 = 主操作[重铸] + tab[出售|分解] + 关闭
        //   重铸从详情页直接调 (走 reforgeFromDetail 函数, 兼容 inventory + hero.equip)
        //   出售/分解 tab 切换同一个弹窗 (跟智能出售/分解卡片同 UI 思路)
        var hasAffixes = (eq.affixes || []).length > 0;
        // ===== 主操作: 重铸 =====
        html += '<div style="padding:0 14px 8px;">' +
            '<button class="btn" style="width:100%;background:linear-gradient(135deg,#ffd700,#ff9800);color:#1a0f1f;font-weight:bold;font-size:14px;padding:10px 4px;"' +
            (hasAffixes ? '' : ' disabled style="opacity:0.4;width:100%;background:linear-gradient(135deg,#ffd700,#ff9800);color:#1a0f1f;font-weight:bold;font-size:14px;padding:10px 4px;"') +
            ' onclick="reforgeFromDetail(\'' + eq.id + '\')">🔨 重铸 (粉尘x200)</button></div>';
        // ===== tab: 出售 | 分解 (点 tab 立刻执行) =====
        //   之前 Round 2 误加了 eq-act-area 重复大按钮, Round 11.3 修: 合并 tab+操作
        var dustText = '粉尘x' + decomposeMats.dust;
        if (decomposeMats.reforgestone > 0) dustText += '+重铸石x' + decomposeMats.reforgestone;
        html += '<div style="display:flex;gap:6px;padding:0 14px 12px;">' +
            '<button class="btn" style="flex:1;font-size:13px;padding:10px 4px;background:linear-gradient(135deg,#ffd700,#ff9800);color:#1a0f1f;font-weight:bold;" onclick="sellSingleItem(\'' + eq.id + '\');this.closest(\'.modal-overlay\').remove();">💰 出售 (' + eqVal + ' G)</button>' +
            '<button class="btn" style="flex:1;font-size:13px;padding:10px 4px;background:#c62828;color:#fff;font-weight:bold;" onclick="decomposeItem(\'' + eq.id + '\');this.closest(\'.modal-overlay\').remove();">⚙ 分解 (' + dustText + ')</button>' +
            '</div>';
    }
    html += '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

// ★ v2.6.4 Round 11.3: switchDetailActTab 已删除, tab 按钮直接执行出售/分解
//   - 之前 Round 2 加的 tab 切换 + eq-act-area 重复, Round 11.3 合并成"点 tab 立刻执行"

// ★ v2.6.4 Round 3.1: reforgeFromDetail 已迁移到 reforgeUI.js (这里删除避免重复定义)

// Fallback for forge.decomposeInventoryItem (inventoryUI 上下文: 检查 locked, 锁定则提示用户解锁)
function decomposeItem(equipId) {
    if (typeof decomposeInventoryItem === 'function') {
        return decomposeInventoryItem(equipId, { skipLocked: true });
    }
    return null;
}

// 单件卖出
function sellSingleItem(equipId) {
    var inv = GameState.get('inventory') || [];
    var idx=-1;var _es5_97=inv;for(var _es5_98=0;_es5_98<_es5_97.length;_es5_98++){if(_es5_97[_es5_98].id === equipId){idx=_es5_98;break;}};
    if (idx === -1) return;
    var eq = inv[idx];
    if (eq.locked) {
        showToast('🔒 装备已上锁，请先解锁', 'warning');
        return;
    }
    var value = calcEquipValue(eq);
    GameState.mutate('gold', function(g) { return (g || 0) + value; });
    inv.splice(idx, 1);
    GameState.set('inventory', inv);
    showToast('卖出 ' + eq.name + '，获得 ' + value + ' G', 'success');
    refreshInventoryUI();
    updateResources();
}

// ===== 强化系统（v4.x 新增）=====
// 尝试强化装备（由详情页面的强化按钮调用）
function attemptEnhance(equipId) {
    if (typeof enhanceEquip !== 'function') {
        showToast('强化系统未加载', 'error');
        return;
    }
    var result = enhanceEquip(equipId);
    if (result.reason === '已达最高等级') {
        showToast('✦ 该装备已达最高强化等级！', 'info');
        return;
    }
    if (result.reason === '金币不足') {
        showToast('💰 金币不足，需要 ' + result.cost + ' G（当前: ' + (GameState.get('gold') || 0) + ' G）', 'warning');
        return;
    }
    if (result.success) {
        showToast('⚡ 强化成功！装备 +' + result.newLevel + '（消耗 ' + result.cost + ' G）', 'success');
    } else {
        showToast('💥 强化失败... 金币 -' + result.cost + '（成功率 ' + Math.round(result.rate * 100) + '%）', 'warning');
    }
    // 刷新详情弹窗（重新生成当前弹窗）
    var overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        var inv = GameState.get('inventory') || [];
        var eq = null;
        for (var i = 0; i < inv.length; i++) {
            if (inv[i].id === equipId) { eq = inv[i]; break; }
        }
        if (eq) {
            overlay.remove();
            showItemDetail({ type: 'equip', data: eq });
        }
    }
    // 更新资源显示 + 卡片角标
    if (typeof updateResources === 'function') updateResources();
    if (typeof refreshInventoryUI === 'function') refreshInventoryUI();
}


// ★ v3.5.0 渲染材料仓库
function renderMaterialsView() {
    var grid = document.getElementById('inventory-grid');
    if (!grid) return;
    var mats = GameState.get('materials') || {};
    // ★ forgeDust/reforgestone are top-level keys, not inside materials
    var _topForgeDust = GameState.get('forgeDust') || 0;
    var _topReforgeStone = GameState.get('reforgestone') || 0;
    var matDefs = [
        { key: 'herb',   icon: '🌿', name: '草药',       desc: '用于烹饪',      color: '#4caf50' },
        { key: 'ore',    icon: '🪨', name: '矿石',       desc: '用于锻造',      color: '#78909c' },
        { key: 'forgeDust',  icon: '💠', name: '锻造粉尘', desc: '分解装备',      color: '#42a5f5' },
        { key: 'reforgestone', icon: '💎', name: '重铸石', desc: '装备重铸',      color: '#ab47bc' },
        { key: 'lotteryStone', icon: '🎫', name: '抽奖石', desc: '抽奖大厅',      color: '#ff7043' },
        { key: 'upgradeStone', icon: '⬆️', name: '升级石', desc: '装备升阶',      color: '#26c6da' },
    ];
    var html = '<div style="padding:8px;">' +
        '<div style="font-size:11px;color:#888;margin-bottom:10px;">📦 材料仓库（容量无限，同种材料自动叠加）</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">';
    for (var i = 0; i < matDefs.length; i++) {
        var def = matDefs[i];
        var count;
        if (def.key === 'forgeDust') count = _topForgeDust;
        else if (def.key === 'reforgestone') count = _topReforgeStone;
        else count = mats[def.key] || 0;
        var hasCount = count > 0;
        html += '<div style="display:flex;align-items:center;gap:12px;background:' + def.color + '08;border:1px solid ' + def.color + '22;border-radius:12px;padding:12px 14px;">' +
            '<div style="font-size:28px;line-height:1;flex-shrink:0;">' + def.icon + '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:13px;font-weight:bold;color:' + def.color + ';">' + def.name + '</div>' +
            '<div style="font-size:10px;color:#666;margin-top:1px;">' + def.desc + '</div></div>' +
            '<div style="font-size:22px;font-weight:bold;' + (hasCount ? 'color:#ffd700;' : 'color:#444;') + ';flex-shrink:0;">' +
            (hasCount ? count : '—') + '</div></div>';
    }
    html += '</div></div>';

    // === 宠物碎片 section ===
    if (GameState.get('petShards') && Object.keys(GameState.get('petShards')).length > 0) {
        var shardEntries = [];
        for (var spid in GameState.get('petShards')) {
            if (GameState.get('petShards').hasOwnProperty(spid) && GameState.get('petShards')[spid] > 0) {
                shardEntries.push({ petId: spid, count: GameState.get('petShards')[spid] });
            }
        }
        shardEntries.sort(function(a, b) { return b.count - a.count; });
        // 只显示前5个
        var showCount = Math.min(5, shardEntries.length);
        html += '<div style="padding:8px;margin-top:8px;">';
        html += '<div style="font-size:11px;color:#888;margin-bottom:8px;">\ud83d\udc3e \u5ba0\u7269\u788e\u7247</div>';
        html += '<div style="display:flex;flex-direction:column;gap:4px;">';
        for (var sdi = 0; sdi < showCount; sdi++) {
            var entry = shardEntries[sdi];
            var d = getPetData(entry.petId);
            if (!d) continue;
            html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.04);border-radius:6px;">';
            html += '<span style="font-size:18px;">' + d.icon + '</span>';
            html += '<span style="font-size:12px;flex:1;color:#ccc;">' + d.name + '</span>';
            html += '<span style="font-size:14px;font-weight:bold;color:#ffd700;">' + entry.count + '</span>';
            html += '</div>';
        }
        if (shardEntries.length > 5) {
            html += '<div style="text-align:center;font-size:10px;color:#888;margin-top:2px;">... \u8fd8\u6709 ' + (shardEntries.length - 5) + ' \u79cd\u788e\u7247</div>';
        }
        html += '</div></div>';
    }

    grid.innerHTML = html;
}
