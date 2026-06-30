// ========== 宝石工坊UI ==========
// v2.6.2 重构：共享渲染函数，消除 forgeUI 与 gemUI 的重复代码
/* global GameState */

// 生成宝石属性描述文本
function getGemDesc(gt, level) {
    var val = Math.round(getGemValue(gt, level));
    var text = '+' + val + '% ' + getStatName(gt.stat);
    if (gt.isCompound && gt.extraStat) {
        var extraVal = Math.round(getGemExtraValue(gt, level));
        var extraName = getStatName(gt.extraStat);
        text += ' | +' + extraVal + '% ' + extraName;
    }
    return text;
}

// ============================================================
// 共享渲染函数（v2.6.2）
// ============================================================

// 合成排序状态
var gemSortField = 'level';    // 'level' | 'type' | 'count'
var gemSortDir = 'desc';       // 'desc' | 'asc'
var gemTypeFilter = 'all';      // 'all' | gemTypeId

// 切换排序
function toggleGemSort(field) {
    if (gemSortField === field) {
        gemSortDir = gemSortDir === 'desc' ? 'asc' : 'desc';
    } else {
        gemSortField = field;
        gemSortDir = field === 'level' ? 'desc' : 'asc';
    }
    refreshGemUI();
}

// 切换类型筛选
function filterGemType(typeId) {
    gemTypeFilter = typeId;
    refreshGemUI();
}

//渲染单个宝石卡片（共享）
// opts: { showSynthesizeBtn: bool, onclickName: bool }
// onclickName=true 时点击名称打开详情弹窗
function renderGemCard(g, opts) {
    opts = opts || {};
    var gt=null;var _es5_43=GEM_TYPES;for(var _es5_44=0;_es5_44<_es5_43.length;_es5_44++){if(_es5_43[_es5_44].id === g.gemTypeId){gt=_es5_43[_es5_44];break;}};
    if (!gt) return '';
    var count = g.count || 1;
    var canSynthesize = count >= 3 && g.level < 16;
    var gemIconUrl = typeof getGemIcon === 'function' ? getGemIcon(gt.id) : '';

    var nameClick = opts.onclickName
        ? ' style="cursor:pointer;" onclick="showGemDetailModal(\'' + g.gemTypeId + '\',' + g.level + ')"'
        : '';

    var html = '<div class="gem-item">' +
        '<div><img class="gem-icon-img" src="' + gemIconUrl + '" alt="' + gt.name + '"></div>' +
        '<div class="item-info">' +
        '<div class="item-name"' + nameClick + ' style="color:' + gt.color + ';">' + gt.name + ' Lv.' + g.level + '</div>' +
        '<div class="item-desc">数量: ' + count + ' | ' + getGemDesc(gt, g.level) + '</div></div>' +
        (opts.showSynthesizeBtn
            ? (canSynthesize
                ? '<button class="btn btn-gold" onclick="doSynthesizeGem(\'' + g.gemTypeId + '\',' + g.level + ')">合成</button>'
                : '<span style="font-size:11px;color:#555;">' + (g.level >= 16 ? '已达最高级' : '不足3个') + '</span>')
            : '') +
        '</div>';
    return html;
}

// 宝石详情弹窗
function showGemDetailModal(gemTypeId, level) {
    var gems = GameState.get('gems') || [];
    var g=null;var _es5_45=gems;for(var _es5_46=0;_es5_46<_es5_45.length;_es5_46++){if(_es5_45[_es5_46].gemTypeId === gemTypeId && _es5_45[_es5_46].level === level){g=_es5_45[_es5_46];break;}};
    var gt=null;var _es5_47=GEM_TYPES;for(var _es5_48=0;_es5_48<_es5_47.length;_es5_48++){if(_es5_47[_es5_48].id === gemTypeId){gt=_es5_47[_es5_48];break;}};
    if (!gt) return;

    var count = g ? (g.count || 1) : 0;
    var val = getGemValue(gt, level);
    var extraVal = gt.isCompound ? getGemExtraValue(gt, level) : null;
    var gemIconUrl = typeof getGemIcon === 'function' ? getGemIcon(gt.id) : '';

    // 共鸣进度
    var resonance = calcGemResonance(getAllEquippedGems());
    var resonanceProgress = '';
    if (!resonance.resonance) {
        var nextThreshold = 10;
        var levels = [10, 20, 30, 50, 70];
        for (var l = 0; l < levels.length; l++) {
            if (resonance.totalLevel < levels[l]) { nextThreshold = levels[l]; break; }
        }
        var pct = Math.min(100, Math.round((resonance.totalLevel / nextThreshold) * 100));
        resonanceProgress = '<div style="margin-top:6px;"><div style="font-size:10px;color:#888;margin-bottom:3px;">共鸣进度: ' + resonance.totalLevel + '/' + nextThreshold + '</div>' +
            '<div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#e040fb,#ffd700);border-radius:3px;"></div></div></div>';
    }

    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="padding:0;overflow:hidden;border-radius:12px;border:2px solid ' + gt.color + ';position:relative;">';
    html += '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>';
    html += '<div style="background:linear-gradient(135deg,' + gt.color + '33,' + gt.color + '11);padding:16px 14px 12px;border-bottom:1px solid ' + gt.color + '33;text-align:center;">';
    html += '<div style="font-size:48px;margin-bottom:6px;">' + (gt.icon || '\u{1F48E}') + '</div>';
    html += '<div style="font-size:16px;font-weight:bold;color:' + gt.color + ';">' + gt.name + ' Lv.' + level + '</div>';
    html += '<div style="font-size:12px;color:#aaa;margin-top:4px;">' + gt.desc + '</div></div>';
    html += '<div style="padding:12px 14px;">';
    html += '<div style="font-size:10px;color:#777;margin-bottom:4px;">基础属性</div>';
    html += '<div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:8px 10px;margin-bottom:8px;">';
    html += '<div style="font-size:14px;color:#fff;font-weight:bold;">+' + val + '% ' + getStatName(gt.stat) + '</div>';
    if (gt.isCompound && gt.extraStat) {
        html += '<div style="font-size:13px;color:#ccc;margin-top:4px;">+' + extraVal + '% ' + getStatName(gt.extraStat) + '</div>';
    }
    html += '</div>';
    html += '<div style="font-size:10px;color:#777;margin-bottom:4px;">库存</div>';
    html += '<div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border-radius:6px;padding:8px 10px;">' +
        '<span style="font-size:13px;color:#aaa;">拥有数量</span>' +
        '<span style="font-size:15px;font-weight:bold;color:#ffd700;margin-left:auto;">' + count + '</span>' +
        (count >= 3 ? '<span style="font-size:10px;color:#4caf50;">可合成</span>' : '<span style="font-size:10px;color:#555;">差' + (3 - count) + '个</span>') +
        '</div>';
    html += resonanceProgress;
    html += '</div>';
    html += '<div style="display:flex;gap:6px;padding:0 14px 14px;">' +
        (count >= 3 && level < 16
            ? '<button class="btn btn-gold" style="flex:1;" onclick="doSynthesizeGem(\'' + gemTypeId + '\',' + level + ');this.closest(\'.modal-overlay\').remove();">合成</button>'
            : '') +
        '<button class="btn" style="flex:1;" onclick="this.closest(\'.modal-overlay\').remove()">关闭</button></div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

var gemCurrentTab = 'synthesize';

function switchGemTab(tab) {
    gemCurrentTab = tab;
    // ★ v4.1 同步 forgeCurrentTab（forge 屏委托 refreshForgeUI 渲染）
    if (typeof forgeCurrentTab !== 'undefined') forgeCurrentTab = tab;
    var labelMap = { synthesize: '合成', inlay: '镶嵌', resonance: '共鸣' };
    var label = labelMap[tab] || '';
    document.querySelectorAll('#gem-tabs .tab-btn').forEach(function(b) {
        b.classList.toggle('active', b.textContent.indexOf(label) !== -1);
    });
    refreshGemUI();
}

// 一键合成所有可能宝石
function autoSynthesizeAll() {
    var gems = GameState.get('gems') || [];
    var synthesized = 0;
    var changed = true;
    
    while (changed) {
        changed = false;
        for (var i = 0; i < gems.length; i++) {
            var g = gems[i];
            if (!g || !g.gemTypeId) continue;
            if ((g.count || 1) >= 3 && g.level < 16) {
                var result = synthesizeGems(g.gemTypeId, g.level, g.count);
                if (result) {
                    g.count = (g.count || 1) % 3;
                    var existing=null;var _es5_49=gems;for(var _es5_50=0;_es5_50<_es5_49.length;_es5_50++){if(_es5_49[_es5_50].gemTypeId === g.gemTypeId && _es5_49[_es5_50].level === result.level){existing=_es5_49[_es5_50];break;}};
                    if (existing) {
                        existing.count = (existing.count || 0) + result.count;
                    } else {
                        gems.push({
                            gemTypeId: result.gemTypeId,
                            level: result.level,
                            count: result.count,
                            gemType: g.gemType
                        });
                    }
                    synthesized++;
                    changed = true;
                    break;
                }
            }
        }
    }
    
    GameState.set('gems', gems.filter(function(x) { return (x.count || 0) > 0; }));
    if (synthesized > 0) {
        showToast('一键合成完成! 共合成 ' + synthesized + ' 次', 'success');
    } else {
        showToast('没有可合成的宝石', 'info');
    }
    refreshForgeUI();
    refreshInventoryUI();
    updateResources();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
}

function refreshGemUI() {
    // ★ v2.6.4 Round 5.2 修复: 容器查找兼容 #gem-content (旧独立宝石工坊)
    //   + #forge-content (现在合并到宝石工坊的宝石 tab, 真实容器)
    //   之前只查 #gem-content, 在宝石工坊下找不到 → onclick 后 UI 不刷新
    var content = document.getElementById('gem-content') || document.getElementById('forge-content');
    if (!content) return;
    // ★ v4.1 如果 forge 屏的 refreshForgeUI 已接管，不再重复渲染
    if (typeof forgeCurrentTab !== 'undefined' && !document.getElementById('gem-content')) {
        if (typeof refreshForgeUI === 'function') { refreshForgeUI(); return; }
    }
    // ★ v2.6.2: lazy 宝石迁移（兜底）
    if (typeof _migrateGemSaveData === 'function') _migrateGemSaveData();
    if (gemCurrentTab === 'synthesize') {
        renderGemSynthesizeUI(content);
    } else if (gemCurrentTab === 'inlay') {
        renderGemInlayUI(content);
    } else {
        renderGemResonanceUI(content);
    }
}

// ★ v2.6.4 Round 2.2: 宝石共鸣 tab — 展示 5 档阈值 + 当前进度 + 已激活档效果 + 全身宝石汇总
function renderGemResonanceUI(container) {
    var html = '';
    var resonance = calcGemResonance(getAllEquippedGems());
    var allGems = (GameState.get('gems') || []).slice();
    var equippedGems = getAllEquippedGems();

    // 顶部总览
    html += '<div style="margin-bottom:14px;padding:14px;background:linear-gradient(135deg,rgba(224,64,251,0.12),rgba(255,215,0,0.08));border-radius:10px;border:1px solid rgba(224,64,251,0.25);">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
    html += '<span style="font-size:20px;">💎</span>';
    html += '<span style="font-size:15px;font-weight:bold;color:#e040fb;">宝石共鸣</span>';
    html += '</div>';
    html += '<div style="font-size:13px;color:#ddd;">全身宝石总等级: <span style="color:#ffd700;font-weight:bold;font-size:18px;">' + resonance.totalLevel + '</span></div>';
    if (resonance.resonance) {
        html += '<div style="margin-top:6px;padding:8px 10px;background:rgba(255,215,0,0.12);border-radius:6px;border:1px solid rgba(255,215,0,0.4);">';
        html += '<div style="font-size:12px;color:#888;">当前激活</div>';
        html += '<div style="font-size:15px;color:#ffd700;font-weight:bold;margin-top:2px;">' + resonance.resonance.name + '</div>';
        html += '<div style="font-size:12px;color:#fff;margin-top:3px;">最终伤害 +' + (resonance.resonance.bonus * 100) + '%</div>';
        html += '</div>';
    } else {
        html += '<div style="margin-top:6px;padding:6px 10px;background:rgba(255,255,255,0.05);border-radius:6px;font-size:11px;color:#888;">未激活共鸣 - 达到 10 级可激活初级共鸣</div>';
    }
    html += '</div>';

    // 5 档阈值列表
    html += '<div style="margin-bottom:14px;">';
    html += '<div style="font-size:12px;color:#888;margin-bottom:6px;">共鸣档位 (全身宝石总等级)</div>';
    for (var r = 0; r < GEM_RESONANCE_THRESHOLDS.length; r++) {
        var t = GEM_RESONANCE_THRESHOLDS[r];
        var isActive = (resonance.resonance && resonance.resonance.totalLevel === t.totalLevel);
        var isReached = (resonance.totalLevel >= t.totalLevel);
        var isNext = !isReached && (r === 0 || resonance.totalLevel >= GEM_RESONANCE_THRESHOLDS[r-1].totalLevel);
        var bgColor = isActive ? 'rgba(255,215,0,0.18)' : (isReached ? 'rgba(76,175,80,0.10)' : 'rgba(0,0,0,0.2)');
        var borderColor = isActive ? '#ffd700' : (isReached ? '#4caf50' : 'rgba(255,255,255,0.1)');
        var labelColor = isActive ? '#ffd700' : (isReached ? '#4caf50' : '#888');
        var label = isActive ? '当前' : (isReached ? '已达成' : (isNext ? '下一档' : '未达成'));
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:6px;margin-bottom:4px;">';
        html += '<div style="flex:1;">';
        html += '<div style="font-size:13px;font-weight:bold;color:' + labelColor + ';">' + t.name + ' <span style="font-size:11px;font-weight:normal;color:#888;">(总等级 ≥ ' + t.totalLevel + ')</span></div>';
        html += '<div style="font-size:11px;color:#aaa;margin-top:2px;">最终伤害 +' + (t.bonus * 100) + '%</div>';
        html += '</div>';
        html += '<div style="font-size:11px;color:' + labelColor + ';">' + label + '</div>';
        html += '</div>';
    }
    html += '</div>';

    // 全身装备镶嵌汇总
    html += '<div style="margin-bottom:14px;">';
    html += '<div style="font-size:12px;color:#888;margin-bottom:6px;">全身装备镶嵌</div>';
    var heroes = (function(){var _team=GameState.get('team')||{};var _vals=[];for(var _k in _team){if(_team.hasOwnProperty(_k))_vals.push(_team[_k]);}return _vals;})() .filter(function(h) { return h !== null; });
    if (heroes.length === 0) {
        html += '<div style="padding:10px;text-align:center;color:#555;background:rgba(0,0,0,0.2);border-radius:6px;font-size:12px;">未配置队伍</div>';
    } else {
        for (var hi = 0; hi < heroes.length; hi++) {
            var hero = heroes[hi];
            var cls = getClassData(hero.classId);
            var equip = hero.equip || {};
            var heroLevel = 0;
            var heroSlots = 0;
            var heroGems = 0;
            for (var slotId in equip) {
                var eq = equip[slotId];
                if (!eq || !eq.sockets) continue;
                heroSlots += eq.sockets;
                for (var s = 0; s < (eq.gems || []).length; s++) {
                    if (eq.gems[s]) {
                        heroLevel += (eq.gems[s].level || 0);
                        heroGems++;
                    }
                }
            }
            html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:6px;margin-bottom:4px;">';
            html += '<div style="font-size:14px;">' + (cls ? cls.icon : '?') + ' ' + (cls ? cls.name : hero.classId) + '</div>';
            html += '<div style="flex:1;font-size:11px;color:#888;">' + heroGems + '/' + heroSlots + ' 孔</div>';
            html += '<div style="font-size:13px;color:#ffd700;font-weight:bold;">Lv.' + heroLevel + '</div>';
            html += '</div>';
        }
    }
    html += '</div>';

    // 仓库宝石汇总
    html += '<div>';
    html += '<div style="font-size:12px;color:#888;margin-bottom:6px;">仓库宝石 (' + allGems.length + ' 种)</div>';
    if (allGems.length === 0) {
        html += '<div style="padding:10px;text-align:center;color:#555;background:rgba(0,0,0,0.2);border-radius:6px;font-size:12px;">仓库暂无宝石</div>';
    } else {
        for (var gi = 0; gi < allGems.length; gi++) {
            var g = allGems[gi];
            var gt=null;var _es5_51=GEM_TYPES;for(var _es5_52=0;_es5_52<_es5_51.length;_es5_52++){if(_es5_51[_es5_52].id === g.gemTypeId){gt=_es5_51[_es5_52];break;}};
            if (!gt) continue;
            var gIcon = IconRenderer ? IconRenderer.getIcon('gem', gt.id) : (gt.icon || '?');
            html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(0,0,0,0.15);border-radius:6px;margin-bottom:3px;">';
            html += '<img class="gem-icon-img" src="' + gIcon + '" style="width:24px;height:24px;">';
            html += '<div style="flex:1;font-size:12px;color:' + gt.color + ';">' + gt.name + ' Lv.' + g.level + '</div>';
            html += '<div style="font-size:11px;color:#888;">x' + (g.count || 1) + '</div>';
            html += '</div>';
        }
    }
    html += '</div>';

    container.innerHTML = html;
}

function renderGemSynthesizeUI(container) {
    var gems = (GameState.get('gems') || []).slice();

    // 筛选
    if (gemTypeFilter !== 'all') {
        gems = gems.filter(function(g) { return g.gemTypeId === gemTypeFilter; });
    }

    // 排序
    var dir = gemSortDir === 'desc' ? -1 : 1;
    gems.sort(function(a, b) {
        if (gemSortField === 'level') return dir * (b.level - a.level);
        if (gemSortField === 'count') return dir * ((b.count||1) - (a.count||1));
        if (gemSortField === 'type') {
            var gaid = a.gemTypeId || 'ruby';
            var gbid = b.gemTypeId || 'ruby';
            var ga=null;var _es5_53=GEM_TYPES;for(var _es5_54=0;_es5_54<_es5_53.length;_es5_54++){if(_es5_53[_es5_54].id === gaid){ga=_es5_53[_es5_54];break;}};
            var gb=null;var _es5_55=GEM_TYPES;for(var _es5_56=0;_es5_56<_es5_55.length;_es5_56++){if(_es5_55[_es5_56].id === gbid){gb=_es5_55[_es5_56];break;}};
            return dir * ((ga ? ga.order : 0) - (gb ? gb.order : 0));
        }
        return 0;
    });

    // 类型筛选按钮行
    var filterHtml = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">' +
        '<span style="font-size:11px;color:#888;margin-right:2px;">类型:</span>' +
        '<button class="quality-filter-btn' + (gemTypeFilter === 'all' ? ' active' : '') + '" onclick="filterGemType(\'all\')" style="font-size:11px;padding:2px 8px;">全部</button>';
    for (var fi = 0; fi < GEM_TYPES.length; fi++) {
        var fgt = GEM_TYPES[fi];
        filterHtml += '<button class="quality-filter-btn' + (gemTypeFilter === fgt.id ? ' active' : '') + '" onclick="filterGemType(\'' + fgt.id + '\')" style="font-size:11px;padding:2px 8px;color:' + fgt.color + ';">' + fgt.name + '</button>';
    }
    filterHtml += '</div>';

    // 排序控制行
    var sortArrow = function(field) {
        if (gemSortField !== field) return '';
        return gemSortDir === 'desc' ? ' \u25BC' : ' \u25B2';
    };
    var sortHtml = '<div style="display:flex;gap:6px;margin-bottom:10px;font-size:11px;color:#888;align-items:center;">' +
        '<span>排序:</span>' +
        '<button class="quality-filter-btn' + (gemSortField === 'level' ? ' active' : '') + '" onclick="toggleGemSort(\'level\')" style="font-size:11px;padding:2px 8px;">等级' + sortArrow('level') + '</button>' +
        '<button class="quality-filter-btn' + (gemSortField === 'count' ? ' active' : '') + '" onclick="toggleGemSort(\'count\')" style="font-size:11px;padding:2px 8px;">数量' + sortArrow('count') + '</button>' +
        '<button class="quality-filter-btn' + (gemSortField === 'type' ? ' active' : '') + '" onclick="toggleGemSort(\'type\')" style="font-size:11px;padding:2px 8px;">类型' + sortArrow('type') + '</button>' +
        '</div>';

    // 一键合成按钮
    var autoBtnHtml = '<div style="text-align:center;margin-bottom:10px;">' +
        '<button class="btn btn-gold" onclick="autoSynthesizeAll()" style="font-size:12px;padding:6px 20px;">🔮 一键合成</button>' +
        '</div>';

    if (gems.length === 0) {
        container.innerHTML = filterHtml + sortHtml + '<div style="text-align:center;padding:40px;color:#555;">' + (gemTypeFilter !== 'all' ? '该类型没有宝石' : '没有可合成的宝石') + '</div>';
        return;
    }

    var html = filterHtml + sortHtml + autoBtnHtml;
    for (var i = 0; i < gems.length; i++) {
        html += renderGemCard(gems[i], { showSynthesizeBtn: true, onclickName: true });
    }

    // 共鸣信息
    var resonance = calcGemResonance(getAllEquippedGems());
    html += '<div style="margin-top:16px;padding:12px;background:rgba(0,0,0,0.3);border-radius:8px;">' +
        '<div style="font-size:13px;font-weight:bold;color:#e040fb;">宝石共鸣</div>' +
        '<div style="font-size:12px;margin-top:4px;">全身宝石总等级: ' + resonance.totalLevel + '</div>';
    if (resonance.resonance) {
        html += '<div style="font-size:12px;color:#ffd700;margin-top:2px;">' + resonance.resonance.name + ': 最终伤害+' + (resonance.resonance.bonus * 100) + '%</div>';
    } else {
        html += '<div style="font-size:11px;color:#555;margin-top:2px;">达到10级可激活初级共鸣</div>';
    }
    html += '</div>';

    container.innerHTML = html;
}

function renderGemInlayUI(container) {
    var heroes = (function(){var _team=GameState.get('team')||{};var _vals=[];for(var _k in _team){if(_team.hasOwnProperty(_k))_vals.push(_team[_k]);}return _vals;})() .filter(function(h) { return h !== null; });
    if (heroes.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#555;">请先在队伍中配置角色</div>';
        return;
    }

    var html = '';
    for (var h = 0; h < heroes.length; h++) {
        var hero = heroes[h];
        var cls = getClassData(hero.classId);
        var equip = hero.equip || {};
        html += '<div style="margin-bottom:12px;padding:8px;background:rgba(0,0,0,0.2);border-radius:8px;">' +
            '<div style="font-size:13px;font-weight:bold;">' + (cls ? cls.icon : '') + ' ' + (cls ? cls.name : hero.classId) + '</div>';

        var hasSocketEquip = false;
        for (var slotId in equip) {
            var eq = equip[slotId];
            if (!eq || !eq.sockets) continue;
            hasSocketEquip = true;
            var sockets = eq.sockets || 0;
            var gems = eq.gems || [];
            html += '<div style="font-size:12px;margin:6px 0;padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:6px;">' +
                '<div style="margin-bottom:4px;">' + getQualityName(eq.quality) + ' ' + eq.name + ' (' + sockets + '孔)</div>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
            for (var s = 0; s < sockets; s++) {
                var gem = gems[s];
                if (gem) {
                    var gt=null;var _es5_57=GEM_TYPES;for(var _es5_58=0;_es5_58<_es5_57.length;_es5_58++){if(_es5_57[_es5_58].id === gem.gemTypeId){gt=_es5_57[_es5_58];break;}};
                    var gemIconUrl2 = (gt && IconRenderer) ? IconRenderer.getIcon('gem', gt.id) : (gt ? (gt.icon || '?') : '?');
                    html += '<span class="gem-slot filled" style="cursor:pointer;padding:3px 8px;border-radius:4px;border:1px solid ' + (gt ? gt.color : '#888') + ';background:rgba(0,0,0,0.3);" onclick="showGemActionModal(\'' + hero.id + '\',\'' + slotId + '\',' + s + ')" title="点击操作">' +
                        '<img class="gem-slot-icon" src="' + gemIconUrl2 + '" alt=""> ' + (gt ? gt.name : '?') + ' Lv.' + gem.level +
                        ' <span style="font-size:10px;color:#888;">[移除]</span></span>';
                } else {
                    html += '<span class="gem-slot empty" style="cursor:pointer;padding:3px 10px;border-radius:4px;border:1px dashed #555;background:rgba(255,255,255,0.05);" onclick="showGemSelectModal(\'' + hero.id + '\',\'' + slotId + '\',' + s + ')" title="点击镶嵌">[空孔]</span>';
                }
            }
            html += '</div></div>';
        }
        if (!hasSocketEquip) {
            html += '<div style="font-size:11px;color:#555;padding:4px 0;">该角色没有带孔的装备</div>';
        }
        html += '</div>';
    }

    // 库存宝石数量提示
    var gemCount = (GameState.get('gems') || []).length;
    html += '<div style="margin-top:8px;font-size:11px;color:#888;text-align:center;">仓库宝石: ' + gemCount + ' 种 | 提示: 点击空孔选择宝石镶嵌，点击已镶嵌的宝石移除</div>';
    container.innerHTML = html;
}

// 显示宝石选择弹窗
function showGemSelectModal(heroId, slotId, socketIndex) {
    // ★ v3.5.1 检查装备是否已穿戴
    var hero = null;
    if (typeof HeroView !== 'undefined') hero = HeroView.byId(heroId);
    if (!hero || !hero.equip || !hero.equip[slotId]) {
        showToast('该装备未穿戴，无法镶嵌宝石', 'warning');
        return;
    }
    var gems = GameState.get('gems') || [];
    if (gems.length === 0) {
        showToast('仓库中没有宝石', 'warning');
        return;
    }

    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="max-width:420px;position:relative;"><h3>选择宝石镶嵌</h3>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span>' +
        // 筛选 + 排序栏
        '<div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">' +
                '<div style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:6px;overflow:hidden;">' +
                '<select id="gem-filter-type" onchange="refreshGemSelect(\'' + heroId + '\',\'' + slotId + '\',' + socketIndex + ')" style="background:transparent;color:#fff;border:none;padding:5px 8px;font-size:10px;width:100%;outline:none;">' +
                '<option value="all" style="background:#1a1a2e;color:#fff;">全部类型</option>' +
                GEM_TYPES.map(function(t) { return '<option value="' + t.id + '" style="background:#1a1a2e;color:#fff;">' + t.name + '</option>'; }).join('') +
                '</select></div>' +
                '<div style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:6px;overflow:hidden;">' +
                '<select id="gem-sort-by" onchange="refreshGemSelect(\'' + heroId + '\',\'' + slotId + '\',' + socketIndex + ')" style="background:transparent;color:#fff;border:none;padding:5px 8px;font-size:10px;width:100%;outline:none;">' +
                '<option value="level_desc" style="background:#1a1a2e;color:#fff;">等级 ↓</option>' +
                '<option value="level_asc" style="background:#1a1a2e;color:#fff;">等级 ↑</option>' +
                '<option value="count_desc" style="background:#1a1a2e;color:#fff;">数量 ↓</option>' +
                '<option value="type" style="background:#1a1a2e;color:#fff;">类型</option>' +
                '</select></div></div>' +
        '<div id="gem-select-list" style="max-height:300px;overflow-y:auto;margin:10px 0;">' +
        _renderGemSelectList(heroId, slotId, socketIndex, gems) +
        '</div><button class="btn" style="width:100%;" onclick="this.closest(\'.modal-overlay\').remove()">取消</button></div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

// ★ v3.5.1 渲染宝石选择列表（支持筛选排序）
function _renderGemSelectList(heroId, slotId, socketIndex, gems) {
    var filterType = document.getElementById('gem-filter-type');
    var sortBy = document.getElementById('gem-sort-by');
    if (filterType) filterType = filterType.value;
    if (!filterType) filterType = 'all';
    if (sortBy) sortBy = sortBy.value;
    if (!sortBy) sortBy = 'level_desc';

    var filtered = [];
    for (var i = 0; i < gems.length; i++) {
        var g = gems[i];
        var gt=null;var _es5_59=GEM_TYPES;for(var _es5_60=0;_es5_60<_es5_59.length;_es5_60++){if(_es5_59[_es5_60].id === g.gemTypeId){gt=_es5_59[_es5_60];break;}};
        if (!gt) continue;
        if (filterType !== 'all' && g.gemTypeId !== filterType) continue;
        filtered.push({ gem: g, data: gt });
    }

    // 排序
    filtered.sort(function(a, b) {
        switch (sortBy) {
            case 'level_desc': return (b.gem.level || 0) - (a.gem.level || 0);
            case 'level_asc':  return (a.gem.level || 0) - (b.gem.level || 0);
            case 'count_desc': return (b.gem.count || 1) - (a.gem.count || 1);
            case 'type':       return (a.gem.gemTypeId || '').localeCompare(b.gem.gemTypeId || '');
            default: return 0;
        }
    });

    var html = '';
    if (filtered.length === 0) {
        html += '<div style="text-align:center;padding:20px;color:#555;font-size:12px;">没有匹配的宝石</div>';
    }
    for (var i = 0; i < filtered.length; i++) {
        var g = filtered[i].gem;
        var gt = filtered[i].data;
        var clickHandler = 'doInlayGem(\'' + heroId + '\',\'' + slotId + '\',' + socketIndex + ',\'' + g.gemTypeId + '\',' + g.level + ');this.closest(\'.modal-overlay\').remove();';
        var gemIconUrl3 = typeof getGemIcon === 'function' ? getGemIcon(gt.id) : '';
        html += '<div class="forge-item" style="cursor:pointer;" onclick="' + clickHandler + '">' +
            '<div><img class="gem-icon-img" src="' + gemIconUrl3 + '" alt="" style="width:32px;height:32px;image-rendering:pixelated;"></div>' +
            '<div class="item-info">' +
            '<div class="item-name" style="color:' + gt.color + ';">' + gt.name + ' Lv.' + g.level + '</div>' +
            '<div class="item-desc">数量: ' + (g.count || 1) + ' | ' + getGemDesc(gt, g.level) + '</div></div>' +
            '<button class="btn btn-gold" style="font-size:11px;padding:2px 8px;">镶嵌</button></div>';
    }
    return html;
}

// ★ v3.5.1 刷新宝石选择列表（筛选排序变化时调用）
function refreshGemSelect(heroId, slotId, socketIndex) {
    var list = document.getElementById('gem-select-list');
    if (!list) return;
    var gems = GameState.get('gems') || [];
    if (gems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:#555;font-size:12px;">没有可镶嵌的宝石</div>';
        return;
    }
    list.innerHTML = _renderGemSelectList(heroId, slotId, socketIndex, gems);
}

// 执行镶嵌
function doInlayGem(heroId, slotId, socketIndex, gemTypeId, level) {
    // ★ HOME_3.2: 战斗锁定检查（gemUI 镶嵌入口）
    if (typeof _checkInBattle === 'function' && !_checkInBattle('镶嵌宝石')) return;
    var hero = null;
    var team = GameState.get('team') || {};
    for (var pos in team) {
        if (team[pos] && team[pos].id === heroId) { hero = team[pos]; break; }
    }
    if (!hero) { showToast('角色不存在', 'error'); return; }
    var eq = (hero.equip || {})[slotId];
    if (!eq) { showToast('装备不存在', 'error'); return; }

    // 扣除宝石
    var gems = GameState.get('gems') || [];
    var idx=-1;var _es5_39=gems;for(var _es5_40=0;_es5_40<_es5_39.length;_es5_40++){if(_es5_39[_es5_40].gemTypeId === gemTypeId && _es5_39[_es5_40].level === level){idx=_es5_40;break;}};
    if (idx === -1) { showToast('宝石不存在', 'error'); return; }
    var g = gems[idx];
    g.count = (g.count || 1) - 1;
    if (g.count <= 0) gems.splice(idx, 1);
    GameState.set('gems', gems);

    // 镶嵌
    if (!eq.gems) eq.gems = [];
    var prevGem = eq.gems[socketIndex];
    if (prevGem) {
        // 如果有旧宝石，退回仓库
        var existing=null;var _es5_61=gems;for(var _es5_62=0;_es5_62<_es5_61.length;_es5_62++){if(_es5_61[_es5_62].gemTypeId === prevGem.gemTypeId && _es5_61[_es5_62].level === prevGem.level){existing=_es5_61[_es5_62];break;}};
        if (existing) {
            existing.count = (existing.count || 0) + 1;
        } else {
            gems.push({ gemTypeId: prevGem.gemTypeId, level: prevGem.level, count: 1, gemType: prevGem.gemType });
        }
        GameState.set('gems', gems);
    }

    var gemData = { gemTypeId: gemTypeId, level: level };
    var gt=null;var _es5_63=GEM_TYPES;for(var _es5_64=0;_es5_64<_es5_63.length;_es5_64++){if(_es5_63[_es5_64].id === gemTypeId){gt=_es5_63[_es5_64];break;}};
    if (gt) gemData.gemType = gt;
    eq.gems[socketIndex] = gemData;

    // 刷新装备评分
    eq.score = calcEquipScore(eq);

    showToast('镶嵌成功!', 'success');
    refreshHeroUI();
    refreshInventoryUI();
    updateResources();
    updateMainTeamPower();
    // ★ v2.6.4 Round 4.1 修复: 镶嵌成功后装备详情卡片要实时更新宝石槽位
    //   (只刷新本 modal, 不 closeAllModals 避免误关其他 modal)
    if (typeof reRenderOpenEquipDetailModal === 'function') {
        reRenderOpenEquipDetailModal(hero, slotId);
    }
}

// 显示宝石操作弹窗（已镶嵌的宝石）
function showGemActionModal(heroId, slotId, socketIndex) {
    var hero = null;
    var team = GameState.get('team') || {};
    for (var pos in team) {
        if (team[pos] && team[pos].id === heroId) { hero = team[pos]; break; }
    }
    if (!hero) return;
    var eq = (hero.equip || {})[slotId];
    if (!eq || !eq.gems || !eq.gems[socketIndex]) return;
    var gem = eq.gems[socketIndex];
    var gt=null;var _es5_65=GEM_TYPES;for(var _es5_66=0;_es5_66<_es5_65.length;_es5_66++){if(_es5_65[_es5_66].id === gem.gemTypeId){gt=_es5_65[_es5_66];break;}};

    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="position:relative;"><h3>宝石操作</h3>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span>';
    html += '<div style="text-align:center;padding:16px;font-size:16px;">';
    if (gt) {
        var gemIconUrl4 = typeof getGemIcon === 'function' ? getGemIcon(gt.id) : '';
        html += '<div><img class="gem-icon-img" src="' + gemIconUrl4 + '" alt="" style="width:48px;height:48px;image-rendering:pixelated;"></div>';
    }
    html += '<div style="color:' + (gt ? gt.color : '#888') + ';margin:8px 0;">' + (gt ? gt.name : '宝石') + ' Lv.' + gem.level + '</div>';
    if (gt) html += '<div style="font-size:12px;color:#aaa;">' + getGemDesc(gt, gem.level) + '</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-danger" style="flex:1;" onclick="doRemoveGem(\'' + heroId + '\',\'' + slotId + '\',' + socketIndex + ');this.closest(\'.modal-overlay\').remove();">移除宝石</button>' +
        '<button class="btn" style="flex:1;" onclick="this.closest(\'.modal-overlay\').remove()">关闭</button></div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

// 移除宝石
function doRemoveGem(heroId, slotId, socketIndex) {
    // ★ HOME_3.2: 战斗锁定检查（gemUI 移除宝石入口）
    if (typeof _checkInBattle === 'function' && !_checkInBattle('移除宝石')) return;
    var hero = null;
    var team = GameState.get('team') || {};
    for (var pos in team) {
        if (team[pos] && team[pos].id === heroId) { hero = team[pos]; break; }
    }
    if (!hero) return;
    var eq = (hero.equip || {})[slotId];
    if (!eq || !eq.gems || !eq.gems[socketIndex]) return;

    var gem = eq.gems[socketIndex];
    eq.gems[socketIndex] = null;

    // 刷新装备评分
    eq.score = calcEquipScore(eq);

    // 宝石退回仓库
    var gems = GameState.get('gems') || [];
    var existing=null;var _es5_67=gems;for(var _es5_68=0;_es5_68<_es5_67.length;_es5_68++){if(_es5_67[_es5_68].gemTypeId === gem.gemTypeId && _es5_67[_es5_68].level === gem.level){existing=_es5_67[_es5_68];break;}};
    if (existing) {
        existing.count = (existing.count || 0) + 1;
    } else {
        gems.push({ gemTypeId: gem.gemTypeId, level: gem.level, count: 1, gemType: gem.gemType });
    }
    GameState.set('gems', gems);

    showToast('已移除宝石', 'success');
    refreshHeroUI();
    refreshInventoryUI();
    updateResources();
    updateMainTeamPower();
    // ★ v2.6.4 Round 4.1 修复: 移除宝石后装备详情卡片要实时更新宝石槽位
    if (typeof reRenderOpenEquipDetailModal === 'function') {
        reRenderOpenEquipDetailModal(hero, slotId);
    }
}

function doSynthesizeGem(gemTypeId, level) {
    var gems = GameState.get('gems') || [];
    var idx=-1;var _es5_41=gems;for(var _es5_42=0;_es5_42<_es5_41.length;_es5_42++){if(_es5_41[_es5_42].gemTypeId === gemTypeId && _es5_41[_es5_42].level === level){idx=_es5_42;break;}};
    if (idx === -1) return;
    var g = gems[idx];
    if ((g.count || 1) < 3) { showToast('宝石不足3个', 'warning'); return; }
    if (level >= 16) { showToast('已达最高等级', 'warning'); return; }

    var result = synthesizeGems(gemTypeId, level, g.count);
    if (!result) return;

    g.count = (g.count || 1) % 3;

    // 检查是否已有更高等级的宝石
    var existing=null;var _es5_69=gems;for(var _es5_70=0;_es5_70<_es5_69.length;_es5_70++){if(_es5_69[_es5_70].gemTypeId === gemTypeId && _es5_69[_es5_70].level === result.level){existing=_es5_69[_es5_70];break;}};
    if (existing) {
        existing.count = (existing.count || 0) + result.count;
    } else {
        gems.push({
            gemTypeId: result.gemTypeId,
            level: result.level,
            count: result.count,
            gemType: g.gemType
        });
    }

    // 清理空条目
    GameState.set('gems', gems.filter(function(x) { return (x.count || 0) > 0; }));
    showToast('合成成功!', 'success');
    refreshForgeUI();
    refreshInventoryUI();
    updateResources();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
}

// 获取所有已镶嵌的宝石
function getAllEquippedGems() {
    var gems = [];
    var team = GameState.get('team') || {};
    for (var pos in team) {
        var hero = team[pos];
        if (!hero) continue;
        var equip = hero.equip || {};
        for (var slot in equip) {
            var eq = equip[slot];
            if (eq && eq.gems) {
                for (var i = 0; i < eq.gems.length; i++) {
                    if (eq.gems[i]) gems.push(eq.gems[i]);
                }
            }
        }
    }
    return gems;
}
