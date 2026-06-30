// ========== 装备重铸UI v6.2 ==========
/* global GameState */
// ★ Round 3.1: 装备重铸 UI 提取为独立文件
//   之前在 forgeUI.js, 但 Round 2.2 宝石工坊 重写时把重铸函数全删了,
//   导致:
//
//   1. 仓库装备详情卡片点 [重铸] → "重铸功能未就绪" (reforgeFromDetail 调 openReforgeLockUI 找不到)
//   2. 角色详情装备卡片点 [重铸] → 装备被脱, 但没有弹窗 (reforgeEquippedItem 调 openReforgeLockUI 抛 ReferenceError, cleanup 没跑)
//
//   重铸入口: 仓库 / 角色详情 都共用这一套 (重铸锁定弹窗 + 词条勾选 + 消耗粉尘/重铸石)
//
//   业务逻辑 (词条洗牌 + locked 保留 + 数值生成) 已在 forge.js reforgeEquip 里, 这里只做 UI

// 品质名称/类/颜色代理
function _qRefName(q) { return (typeof Quality !== 'undefined' && Quality.getName) ? Quality.getName(q) : (q === 0 ? '白' : '未知'); }
function _qRefClass(q) { return (typeof Quality !== 'undefined' && Quality.getClass) ? Quality.getClass(q) : ''; }
function _qRefColor(q) { return (typeof Quality !== 'undefined' && Quality.getColor) ? Quality.getColor(q) : '#fff'; }

// 重铸锁定UI弹窗 (杖剑传说风格)
function openReforgeLockUI(equipId) {
    // ★ v2.6.4 Round 3.1: 装备可能在 GameState.get("inventory"), 也可能在 hero.equip (_heroEquipReforge 标记)
    var inv = GameState.get("inventory") || [];
    var eq=null;var _es5_111=inv;for(var _es5_112=0;_es5_112<_es5_111.length;_es5_112++){if(_es5_111[_es5_112].id === equipId){eq=_es5_111[_es5_112];break;}};
    if (!eq) {
        // fallback: 在所有英雄身上找 (reforgeEquippedItem 临时入仓后 cleanup 可能未跑)
        var heroes = (typeof getHeroes === 'function') ? getHeroes() : (GameState.get("heroes") || []);
        for (var hi = 0; hi < heroes.length; hi++) {
            var he = heroes[hi];
            if (he && he.equip) {
                for (var sk in he.equip) {
                    var sEq = he.equip[sk];
                    if (sEq && sEq.id === equipId) { eq = sEq; break; }
                }
            }
            if (eq) break;
        }
    }
    if (!eq) {
        if (typeof showToast === 'function') showToast('未找到该装备', 'error');
        return;
    }

    var rs = GameState.get("reforgestone") || 0;
    var fd = GameState.get("forgeDust") || 0;
    var qualName = _qRefName(eq.quality);
    var qualColor = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'][eq.quality] || '#9e9e9e';
    var qTheme = qualColor;
    var qRgba = qTheme + '22';

    // 检查是否已存在弹窗，存在则复用
    var existing = document.getElementById('reforgeLockModal');
    if (existing) existing.remove();

    var html = '<div class="modal-overlay" id="reforgeLockModal" onclick="this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="padding:0;overflow:hidden;border-radius:12px;border:2px solid ' + qTheme + ';position:relative;">';
    html += '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>';

    // 顶部品质色带
    html += '<div style="background:linear-gradient(135deg,' + qTheme + '44,' + qTheme + '22);padding:14px 16px 12px;border-bottom:1px solid ' + qTheme + '44;">';
    html += '<div style="display:flex;align-items:center;gap:10px;">';
    html += '<div style="width:40px;height:40px;border-radius:8px;background:' + qRgba + ';border:2px solid ' + qTheme + ';display:flex;align-items:center;justify-content:center;font-size:20px;">' + (eq.slotIcon || '\u{1F4E6}') + '</div>';
    html += '<div style="flex:1;">';
    html += '<div style="font-size:15px;font-weight:bold;color:' + qTheme + ';">' + qualName + ' ' + eq.name + '</div>';
    html += '<div style="display:flex;gap:10px;font-size:11px;color:#aaa;margin-top:2px;">';
    html += '<span>LV.' + (eq.level || 1) + '</span>';
    html += '<span>评分: <span id="reforgeScoreDisplay" style="color:' + qTheme + ';font-weight:bold;">' + (eq.score || 0) + '</span></span>';
    html += '</div></div>';
    html += '<div style="text-align:right;font-size:11px;">';
    html += '<div style="color:#ffd700;">粉尘 <span id="reforgeFdDisplay">' + fd + '</span></div>';
    html += '<div style="color:#e040fb;">重铸石 <span id="reforgeRsDisplay">' + rs + '</span></div>';
    html += '</div></div></div>';

    // 消耗说明
    html += '<div style="padding:10px 14px 6px;display:flex;align-items:center;gap:8px;">';
    html += '<span style="font-size:11px;color:#888;">基础消耗: <span style="color:#ffd700;">粉尘x200</span></span>';
    html += '<span style="font-size:10px;color:#666;">锁定词条: 粉尘+重铸石均翻倍</span>';
    html += '</div>';

    // 词条列表
    html += '<div style="padding:0 14px 6px;">';
    html += '<div style="font-size:10px;color:#777;margin-bottom:4px;">勾选要锁定的词条（可连续重铸）</div>';
    html += '<div id="reforgeAffixList">';
    html += buildReforgeAffixRows(eq, []);
    html += '</div></div>';

    // 消耗 + 按钮
    html += '<div id="reforgeCostDisplay" style="padding:8px 14px;border-top:1px solid rgba(255,255,255,0.08);font-size:13px;color:#ffd700;font-weight:bold;">';
    html += '消耗: <span style="color:#ffd700;">粉尘x200</span>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;padding:0 14px 14px;">';
    html += '<button class="btn" style="flex:1;background:rgba(255,215,0,0.15);border-color:#ffd700;color:#ffd700;" onclick="doReforgeWithLock(\'' + equipId + '\')">确认重铸</button>';
    html += '<button class="btn" style="flex:1;" onclick="this.closest(\'.modal-overlay\').remove()">关闭</button>';
    html += '</div></div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

// 生成重铸词条HTML
function buildReforgeAffixRows(eq, checkedIndices) {
    var html = '';
    var qDots = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'];
    for (var i = 0; i < eq.affixes.length; i++) {
        var aff = eq.affixes[i];
        var affData=null;if(typeof AFFIX_POOL !== 'undefined'){for(var _es5_114=0;_es5_114<AFFIX_POOL.length;_es5_114++){if(AFFIX_POOL[_es5_114].id === aff.id){affData=AFFIX_POOL[_es5_114];break;}}}
        var affName = affData ? affData.name : aff.id;
        var affQ = aff.affixQuality !== undefined ? aff.affixQuality : eq.quality;
        var checked = checkedIndices.indexOf(i) !== -1 ? ' checked' : '';
        var isPct = affData && (affData.type === 'pct' || aff.stat === 'crit' || aff.stat === 'critDmg');
        var affVal = aff.value + (isPct ? '%' : '');
        var bgRow = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
        html += '<div style="display:flex;align-items:center;padding:5px 6px;border-radius:4px;background:' + bgRow + ';border-bottom:1px solid rgba(255,255,255,0.04);">';
        html += '<input type="checkbox" id="lock_' + i + '" onchange="updateReforgeCost()" style="margin-right:6px;accent-color:' + qDots[affQ] + ';width:14px;height:14px;cursor:pointer;flex-shrink:0;"' + checked + '>';
        html += '<span style="color:' + qDots[affQ] + ';font-size:8px;margin-right:4px;">\u25C6</span>';
        html += '<span class="' + _qRefClass(affQ) + '" style="font-size:12px;flex:1;">' + affName + '</span>';
        html += '<span style="color:#fff;font-size:11px;font-weight:bold;">+' + affVal + '</span>';
        html += '</div>';
    }
    return html;
}

// 更新重铸消耗显示
function updateReforgeCost() {
    var checkboxes = document.querySelectorAll('#reforgeLockModal input[type="checkbox"]');
    var lockedCount = 0;
    checkboxes.forEach(function(cb) { if (cb.checked) lockedCount++; });

    var dustCost = 200 * (lockedCount + 1);
    var stoneCost = lockedCount * (lockedCount + 1);

    var html = '消耗: <span style="color:#ffd700;">粉尘x' + dustCost + '</span>';
    if (stoneCost > 0) {
        html += ' + <span style="color:#e040fb;">重铸石x' + stoneCost + '</span>';
    }
    if (lockedCount > 0) {
        html += ' <span style="color:#ff5252;font-size:11px;">(锁定' + lockedCount + '条 均x' + (lockedCount + 1) + '倍)</span>';
    }
    var el = document.getElementById('reforgeCostDisplay');
    if (el) el.innerHTML = html;
}

// 执行带锁定的重铸 (不关闭弹窗, 支持连续重铸)
function doReforgeWithLock(equipId) {
    // 战斗锁定检查
    if (typeof _checkInBattle === 'function' && !_checkInBattle('重铸装备')) return;
    try {
        var fd = GameState.get("forgeDust") || 0;
        var rs = GameState.get("reforgestone") || 0;

        // 找装备 (兼容 inventory / hero.equip)
        var inv = GameState.get("inventory") || [];
        var eq=null;var _es5_115=inv;for(var _es5_116=0;_es5_116<_es5_115.length;_es5_116++){if(_es5_115[_es5_116].id === equipId){eq=_es5_115[_es5_116];break;}};
        var fromHero = null;
        if (!eq) {
            var heroes = (typeof getHeroes === 'function') ? getHeroes() : (GameState.get("heroes") || []);
            for (var hi = 0; hi < heroes.length; hi++) {
                var he = heroes[hi];
                if (he && he.equip) {
                    for (var sk in he.equip) {
                        var sEq = he.equip[sk];
                        if (sEq && sEq.id === equipId) {
                            eq = sEq;
                            fromHero = { hero: he, slot: sk };
                            break;
                        }
                    }
                }
                if (eq) break;
            }
        }
        if (!eq) {
            if (typeof showToast === 'function') showToast('未找到该装备', 'error');
            return;
        }

        // 收集锁定词条 index
        var lockedIndices = [];
        var checkboxes = document.querySelectorAll('#reforgeLockModal input[type="checkbox"]');
        checkboxes.forEach(function(cb) {
            if (cb.checked) {
                var idx = parseInt(cb.id.replace('lock_', ''), 10);
                if (!isNaN(idx)) lockedIndices.push(idx);
            }
        });
        var lockedCount = lockedIndices.length;

        // 计算消耗
        var dustCost = 200 * (lockedCount + 1);
        var stoneCost = lockedCount * (lockedCount + 1);
        if (fd < dustCost) {
            if (typeof showToast === 'function') showToast('粉尘不足! 需要 ' + dustCost + ' 粉尘', 'warning');
            return;
        }
        if (stoneCost > 0 && rs < stoneCost) {
            if (typeof showToast === 'function') showToast('重铸石不足! 需要 ' + stoneCost + ' 重铸石', 'warning');
            return;
        }

        // 扣消耗
        GameState.set("forgeDust", fd - dustCost);
        GameState.set("reforgestone", rs - stoneCost);

        // 业务逻辑: forge.reforgeEquip
        if (typeof reforgeEquip === 'function') {
            reforgeEquip(eq, lockedIndices);
        } else {
            if (typeof showToast === 'function') showToast('重铸业务函数未就绪', 'error');
            return;
        }

        // ★ v2.6.4 Round 3.1 修复: 如果装备来自 hero.equip (临时入仓路径), 词条改了,
        //   必须同步回 hero.equip, 不能让 cleanup 误以为要还原. 清理 _heroEquipReforge 标记.
        if (fromHero && eq._heroEquipReforge) {
            delete eq._heroEquipReforge;
            delete eq._heroEquipSlot;
            delete eq._heroEquipId;
        }

        // 刷新 UI (不关闭弹窗, 玩家可连续重铸)
        if (typeof updateResources === 'function') updateResources();
        if (typeof refreshInventoryUI === 'function') refreshInventoryUI();
        if (typeof refreshHeroUI === 'function') refreshHeroUI();
        if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
        if (typeof addBattleLog === 'function') {
            addBattleLog('重铸成功! ' + (eq.name || '装备') + ' 词条已重新生成', 'reward');
        }

        // 重新构建弹窗内容 (新词条)
        // ★ v2.6.4 Round 5.1 修复: 重铸后保留玩家之前勾选的 index 位置
        //   (旧实现: Round 4 改成全勾, 玩家反馈"完全搞反, 勾选是保留的词条")
        //   现在: 读 DOM 哪些 checkbox 是 checked, 把这些 index 传给 buildReforgeAffixRows
        //   注意: 重铸后词条是完全新生成的, "按位置锁"是合理近似 — 玩家已经习惯按位置看词条
        var keptIndices = [];
        var oldCheckboxes = document.querySelectorAll('#reforgeLockModal input[type="checkbox"]');
        for (var kci = 0; kci < oldCheckboxes.length; kci++) {
            if (oldCheckboxes[kci].checked) {
                var kid = parseInt(oldCheckboxes[kci].id.replace('lock_', ''), 10);
                if (!isNaN(kid)) keptIndices.push(kid);
            }
        }
        // 防御: 索引可能超出新 eq.affixes 长度
        keptIndices = keptIndices.filter(function(i) { return i >= 0 && i < eq.affixes.length; });
        var newAffixList = document.getElementById('reforgeAffixList');
        if (newAffixList) newAffixList.innerHTML = buildReforgeAffixRows(eq, keptIndices);
        var scoreEl = document.getElementById('reforgeScoreDisplay');
        if (scoreEl) scoreEl.textContent = eq.score || 0;
        var fdEl = document.getElementById('reforgeFdDisplay');
        if (fdEl) fdEl.textContent = GameState.get("forgeDust");
        var rsEl = document.getElementById('reforgeRsDisplay');
        if (rsEl) rsEl.textContent = GameState.get("reforgestone");
        updateReforgeCost();
    } catch (e) {
        if (typeof console !== 'undefined' && console.error) {
            console.error('[reforge] doReforgeWithLock 异常:', e);
        }
        if (typeof showToast === 'function') showToast('重铸失败: ' + e.message, 'error');
    }
}

// ★ v2.6.4 Round 3.1: 装备详情卡片 [重铸] 入口 (从 inventoryUI 调过来)
//   - 装备在 GameState.get("inventory"): 直接 openReforgeLockUI
//   - 装备在 hero.equip: 用 heroUI.reforgeEquippedItem 那条临时入仓路径
function reforgeFromDetail(equipId) {
    if (typeof _checkInBattle === 'function' && !_checkInBattle('重铸装备')) return;
    var inv = GameState.get("inventory") || [];
    var eq=null;var _es5_117=inv;for(var _es5_118=0;_es5_118<_es5_117.length;_es5_118++){if(_es5_117[_es5_118].id === equipId){eq=_es5_117[_es5_118];break;}};
    if (eq) {
        // 关闭详情弹窗
        var modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
        openReforgeLockUI(equipId);
        return;
    }
    // hero.equip fallback
    var heroes = (typeof getHeroes === 'function') ? getHeroes() : (GameState.get("heroes") || []);
    for (var hi = 0; hi < heroes.length; hi++) {
        var he = heroes[hi];
        if (he && he.equip) {
            for (var sk in he.equip) {
                var sEq = he.equip[sk];
                if (sEq && sEq.id === equipId) {
                    if (typeof window.selectedHeroForDetail === 'undefined') window.selectedHeroForDetail = he;
                    else window.selectedHeroForDetail = he;
                    var modal2 = document.querySelector('.modal-overlay');
                    if (modal2) modal2.remove();
                    if (typeof reforgeEquippedItem === 'function') {
                        reforgeEquippedItem(sk);
                    } else {
                        if (typeof showToast === 'function') showToast('角色装备重铸未就绪', 'error');
                    }
                    return;
                }
            }
        }
    }
    if (typeof showToast === 'function') showToast('未找到该装备', 'error');
}
