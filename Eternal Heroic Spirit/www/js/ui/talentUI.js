/* global GameState */
// ========== 天赋页UI v3.x（按用户草图重设计）==========
// 布局：6 行属性组（攻/防/血/速/暴击/暴伤），每行 5 节点
// 每行顶部显示 "属性名 当前加成：+X%"
// 顶部展示：已激活节点数 / 总节点数
// 价格公式：属性型 = 基础价 × (购买次数 + 1)（线性）
//            功能型 = 一次性固定价格
// TALENT_MAX_LEVEL 由 talents.js 统一声明（v3.x 改为 1：单点模式）

function forceInitTalents() {
    if (!GameState.get('talentLevels')) GameState.set('talentLevels', {});
    if (!GameState.get('talents')) GameState.set('talents', []);
}

function refreshTalentUI() {
    forceInitTalents();
    var grid = document.getElementById('talent-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var activated = GameState.get('talents') || [];
    var levels = GameState.get('talentLevels') || {};

    // v3.x 新增：先按属性组渲染 6 行（按草图设计）
    var groups = (typeof getTalentGroupSummary === 'function') ? getTalentGroupSummary(levels) : [];
    for (var g = 0; g < groups.length; g++) {
        var group = groups[g];
        var groupRow = document.createElement('div');
        groupRow.className = 'talent-group-row';

        // 行标题：属性名 + 当前加成
        var header = document.createElement('div');
        header.className = 'talent-group-header';
        // 负号保护：加成不会是负的，但 bonusPct 用 Math.max 兜底
        var bonusPct = Math.max(0, group.bonusPct || 0);
        var plusSign = bonusPct > 0 ? '+' : '';
        header.innerHTML =
            '<span class="talent-group-name">' + group.name + '</span>' +
            '<span class="talent-group-bonus">当前加成：' + plusSign + bonusPct + '%</span>';
        groupRow.appendChild(header);

        // 节点容器
        var nodeRow = document.createElement('div');
        nodeRow.className = 'talent-group-nodes';

        // 找到本组所有 5 个节点
        var groupTalents = [];
        for (var t = 0; t < TALENT_DATA.length; t++) {
            if (TALENT_DATA[t].type === 'stat' && TALENT_DATA[t].stat === group.stat) {
                groupTalents.push(TALENT_DATA[t]);
            }
        }

        for (var n = 0; n < groupTalents.length; n++) {
            var talent = groupTalents[n];
            var node = document.createElement('div');
            node.className = 'talent-node';

            var currentLevel = levels[talent.id] || 0;
            var maxLevel = (typeof getTalentMaxLevel === 'function') ? getTalentMaxLevel(talent) : TALENT_MAX_LEVEL;
            var isMaxed = currentLevel >= maxLevel;
            var isAvailable = isTalentAvailable(talent.id, activated, levels);
            var isActivated = isMaxed || currentLevel > 0;

            // 节点状态
            if (isMaxed) {
                node.classList.add('activated');
            } else if (isAvailable) {
                node.classList.add('available');
            } else {
                node.classList.add('locked');
            }
            node.classList.add('type-stat');

            // 当前购买成本（v3.x 差异化：cost = 基础价 × costMult × (currentLevel + 1)）
            var currentCost = getTalentCost(talent, currentLevel);

            // 等级信息（v3.x 差异化：显示 Lv.X/{20|5|100}）
            var levelInfo = currentLevel + '/' + maxLevel;
            var costInfo = isMaxed ? '已满' : (currentCost + 'G');
            // 每级价值提示（如"+10%/级"）
            var perLvlInfo = (typeof getTalentValue === 'function') ? getTalentValue(talent) : 1;

            // 提示
            var hint = '';
            if (isMaxed) {
                hint = '已满级';
            } else if (!isAvailable) {
                var reasons = [];
                for (var p = 0; p < talent.prereq.length; p++) {
                    var pId = talent.prereq[p];
                    var pTalent=null;var _es5_127=TALENT_DATA;for(var _es5_128=0;_es5_128<_es5_127.length;_es5_128++){if(_es5_127[_es5_128].id === pId){pTalent=_es5_127[_es5_128];break;}};
                    if (!pTalent) continue;
                    if (pTalent.type === 'function') {
                        if (activated.indexOf(pId) === -1) reasons.push('需先激活「' + pTalent.name + '」');
                    } else {
                        var pLv = levels[pId] || 0;
                        if (pLv < 1) reasons.push('需先激活「' + pTalent.name + '」');
                    }
                }
                hint = reasons.length > 0 ? reasons[0] : '不可购买';
            } else if (currentLevel === 0) {
                hint = '点击激活';
            } else {
                hint = '点击升级 Lv.' + (currentLevel + 1);
            }

            node.innerHTML =
                '<div class="node-icon">' + talent.icon + '</div>' +
                '<div class="node-name">' + talent.name + '</div>' +
                '<div class="node-level">' + levelInfo + ' <span class="node-perlvl">+' + perLvlInfo + '%/级</span></div>' +
                '<div class="node-cost">' + costInfo + '</div>' +
                '<div class="node-hint">' + hint + '</div>';

            (function(t) {
                node.addEventListener('click', function() {
                    activateTalent(t.id);
                });
            })(talent);

            nodeRow.appendChild(node);
        }
        groupRow.appendChild(nodeRow);
        grid.appendChild(groupRow);
    }

    // v3.x 新增：功能节点（上阵位 + 仓库扩容）放在属性组下方
    var functionRow = document.createElement('div');
    functionRow.className = 'talent-function-row';
    functionRow.innerHTML = '<div class="talent-function-divider"></div>';
    grid.appendChild(functionRow);

    for (var f = 0; f < TALENT_DATA.length; f++) {
        var ftalent = TALENT_DATA[f];
        if (ftalent.type !== 'function') continue;

        var fnode = document.createElement('div');
        fnode.className = 'talent-node type-function';
        var fIsDone = activated.indexOf(ftalent.id) !== -1;
        var fIsAvailable = isTalentAvailable(ftalent.id, activated, levels);

        if (fIsDone) {
            fnode.classList.add('activated');
        } else if (fIsAvailable) {
            fnode.classList.add('available');
        } else {
            fnode.classList.add('locked');
        }

        // 功能节点价格（一次性固定）
        var fCostInfo = fIsDone ? '已激活' : (ftalent.cost + 'G');

        // 提示
        var fHint = '';
        if (fIsDone) {
            fHint = '已激活';
        } else if (!fIsAvailable) {
            var freasons = [];
            for (var fp = 0; fp < ftalent.prereq.length; fp++) {
                var fpId = ftalent.prereq[fp];
                var fpTalent=null;var _es5_129=TALENT_DATA;for(var _es5_130=0;_es5_130<_es5_129.length;_es5_130++){if(_es5_129[_es5_130].id === fpId){fpTalent=_es5_129[_es5_130];break;}};
                if (!fpTalent) continue;
                if (fpTalent.type === 'function') {
                    if (activated.indexOf(fpId) === -1) freasons.push('需先激活「' + fpTalent.name + '」');
                } else {
                    var fpLv = levels[fpId] || 0;
                    if (fpLv < 1) freasons.push('需先激活「' + fpTalent.name + '」');
                }
            }
            fHint = freasons.length > 0 ? freasons[0] : '不可购买';
        } else {
            fHint = '点击解锁';
        }

        fnode.innerHTML =
            '<div class="node-icon">' + ftalent.icon + '</div>' +
            '<div class="node-name">' + ftalent.name + '</div>' +
            '<div class="node-cost">' + fCostInfo + '</div>' +
            '<div class="node-hint">' + fHint + '</div>';

        (function(t) {
            fnode.addEventListener('click', function() {
                activateTalent(t.id);
            });
        })(ftalent);

        grid.appendChild(fnode);
    }

    // 顶部统计
    var totalActive = activated.length;
    var totalAvailable = TALENT_DATA.length;
    var totalStatLv = 0;
    for (var k in levels) {
        if (levels.hasOwnProperty(k)) totalStatLv += levels[k];
    }
    var statsEl = document.getElementById('talent-points');
    if (statsEl) {
        statsEl.textContent = '已激活节点: ' + totalActive + '/' + totalAvailable + '  |  属性总等级: ' + totalStatLv;
    }
}

// 激活天赋（加点 / 解锁）
function activateTalent(talentId) {
    // ★ HOME_3.4: 战斗锁定检查（talentUI 天赋加点入口）
    if (typeof _checkInBattle === 'function' && !_checkInBattle('加点')) return;
    forceInitTalents();
    var talent=null;var _es5_131=TALENT_DATA;for(var _es5_132=0;_es5_132<_es5_131.length;_es5_132++){if(_es5_131[_es5_132].id === talentId){talent=_es5_131[_es5_132];break;}};
    if (!talent) return;
    var activated = GameState.get('talents') || [];
    var levels = GameState.get('talentLevels') || {};

    // 满级 / 已激活 检查
    if (talent.type === 'function') {
        if (activated.indexOf(talentId) !== -1) {
            showToast('该天赋已激活', 'warning');
            return;
        }
    } else {
        var lv = levels[talentId] || 0;
        var maxLevel = (typeof getTalentMaxLevel === 'function') ? getTalentMaxLevel(talent) : TALENT_MAX_LEVEL;
        if (lv >= maxLevel) {
            showToast('该天赋已达最高等级', 'warning');
            return;
        }
    }

    // 前置条件
    if (!isTalentAvailable(talentId, activated, levels)) {
        // 给出具体提示
        for (var p = 0; p < talent.prereq.length; p++) {
            var pId = talent.prereq[p];
            var pTalent=null;var _es5_133=TALENT_DATA;for(var _es5_134=0;_es5_134<_es5_133.length;_es5_134++){if(_es5_133[_es5_134].id === pId){pTalent=_es5_133[_es5_134];break;}};
            if (!pTalent) continue;
            if (pTalent.type === 'function') {
                if (activated.indexOf(pId) === -1) {
                    showToast('需先激活「' + pTalent.name + '」', 'warning');
                    return;
                }
            } else {
                var pLv = levels[pId] || 0;
                if (pLv < 1) {
                    showToast('需先激活「' + pTalent.name + '」', 'warning');
                    return;
                }
            }
        }
        showToast('前置天赋未满足', 'warning');
        return;
    }

    // 计算成本（属性型 = 基础价 × 购买次数）
    var currentLevel = talent.type === 'function' ? 0 : (levels[talentId] || 0);
    var currentCost = getTalentCost(talent, currentLevel);

    if ((GameState.get('gold') || 0) < currentCost) {
        showToast('金币不足! 需要 ' + currentCost + ' G', 'warning');
        return;
    }

    // 扣费
    GameState.mutate('gold', function(g) { return g - currentCost; });

    if (talent.type === 'function') {
        // 一次性功能解锁
        activated.push(talentId);
        GameState.set('talents', activated);
        applyTalentFunction(talent);
    } else {
        // 属性加点
        levels[talentId] = currentLevel + 1;
        GameState.set('talentLevels', levels);
        if (currentLevel === 0) {
            // 首次激活时记录到 talents 列表
            activated.push(talentId);
            GameState.set('talents', activated);
        }
        if (currentLevel + 1 >= maxLevel) {
            showToast(talent.name + ' 已满级！', 'success');
        } else {
            showToast(talent.name + ' 提升到 Lv.' + (currentLevel + 1), 'success');
        }
    }

    updateResources();
    refreshTalentUI();
    // 属性天赋影响每个英雄的 stat，必要时更新顶部战力与队伍
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
    if (typeof refreshTeamUI === 'function') refreshTeamUI();
    // v4.x 关键修复：英雄详情面板（如打开着）也要刷新，否则 ATK/HP 等数字不更新
    if (typeof refreshHeroUI === 'function') refreshHeroUI();
}

// 应用功能性天赋效果
//   v3.x 重构：删除 expand_bag case（游戏只有仓库没有背包）
function applyTalentFunction(talent) {
    switch (talent.function) {
        case 'unlock_slot':
            GameState.mutate('unlockedSlots', function(v) { return Math.max(v || 2, (talent.slotIndex || 0) + 1); });
            showToast('解锁第' + ((talent.slotIndex || 0) + 1) + '上阵位！', 'success');
            break;
        case 'unlock_pet_slot':
            GameState.mutate('petSlotsFromTalent', function(v) { return (v || 0) + (talent.slotAdd || 1); });
            var totalSlots = (typeof getAvailablePetSlots === 'function') ? getAvailablePetSlots() : (1 + (GameState.get('petSlotsFromTalent') || 0));
            showToast('宠物上阵位+' + (talent.slotAdd || 1) + ' (当前 ' + totalSlots + ' 个)', 'success');
            break;
        case 'expand_warehouse':
            var addLevels = (talent.pageAdd || 1);
            GameState.mutate('warehouseExpandLevels', function(v) { return (v || 0) + addLevels; });
            var newCap = (typeof getWarehouseCapacity === 'function')
                ? getWarehouseCapacity()
                : 100;
            showToast('仓库容量+' + (addLevels * 50) + ' (当前 ' + newCap + ' 格)', 'success');
            break;
        // ★ v2.6.4 Round 12: 离线奖励天赋
        case 'offline_efficiency':
            GameState.mutate('offlineEfficiencyPct', function(v) { return (v || 0) + (talent.pctAdd || 0); });
            var effPct = (typeof getOfflineEfficiencyPct === 'function') ? getOfflineEfficiencyPct() : (60 + (GameState.get('offlineEfficiencyPct') || 0));
            showToast('离线效率 +' + (talent.pctAdd || 0) + '% (当前 ' + effPct + '%)', 'success');
            break;
        case 'offline_time':
            GameState.mutate('offlineTimeHours', function(v) { return (v || 0) + (talent.hourAdd || 0); });
            var maxH = (typeof getMaxOfflineHours === 'function') ? getMaxOfflineHours() : 6;
            showToast('最大离线时长 +' + (talent.hourAdd || 0) + 'h (当前 ' + maxH + 'h)', 'success');
            break;
        // v3.x 移除 expand_bag — 项目无背包系统
    }
}
