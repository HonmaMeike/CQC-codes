/* global Formulas, BattleManager, AudioManager, GameState */
/* exported swapSelectedPos, CLASS_ROLE_NAMES */

// ========== 阵容配置UI ==========

var swapSelectedPos = null; // 交换选中位置

var CLASS_ROLE_NAMES = {
    tank: '坦克',
    dps: '输出',
    healer: '治疗',
    support: '辅助'
};

function openSlotSelect(pos) {
    var team = GameState.get('team') || {};
    var heroes = GameState.get('heroes') || [];
    // 获取已上阵英雄ID列表
    var teamIds = [];
    for (var k in team) { if (team[k]) teamIds.push(team[k].id); }
    // 过滤出未上阵的英雄
    var available = heroes.filter(function(h) { return teamIds.indexOf(h.id) === -1; });

    if (available.length === 0) {
        showToast('没有可用的英雄，请先在职业池购买解锁', 'warning');
        return;
    }

    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="position:relative;"><h3>选择英雄 - ' + getSlotName(pos) + '</h3>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    for (var i = 0; i < available.length; i++) {
        var h = available[i];
        var cls = getClassData(h.classId);
        if (!cls) continue;
        html += '<div class="hero-card" onclick="assignHeroToSlot(\'' + pos + '\',\'' + h.id + '\');this.closest(\'.modal-overlay\').remove()">' +
            '<div class="hero-icon">' + cls.icon + '</div>' +
            '<div class="hero-name">' + cls.name + '</div>' +
            '<div class="hero-class">Lv.' + (h.level || 1) + '</div></div>';
    }
    html += '</div>';
    html += '<button class="btn" style="margin-top:8px;width:100%;" onclick="this.closest(\'.modal-overlay\').remove()">取消</button></div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

function getSlotName(pos) {
    var names = { front: '前排', back1: '后排1', back2: '后排2', back3: '后排3' };
    return names[pos] || pos;
}

// ★ BUG#8 修复：战斗中禁止修改阵容（必须先暂停）
//   - 返回 true 允许修改；返回 false 表示已拦截并提示玩家
//   - 战斗进行中：弹窗询问是否暂停
//   - 暂停状态：返回 true
//   - 未在战斗：返回 true
// ========== 阵容锁定（BUG#8 + HOME_3.7）==========
// 重要设计：阵容修改与普通配置修改不同——暂停后需要重置关卡（避免死亡角色下阵后复活
// 造成「下阵复位」BUG），所以这里不使用 lockHelper._checkInBattle()，而是保留专有逻辑。
// 与 _checkInBattle 的差异：_postTeamChange 会在暂停后调用 resetForTeamChange()。
// 序列：战斗暂停 → _postTeamChange → BattleManager.resetForTeamChange()。
function _checkTeamEditable() {
    if (typeof BattleManager === 'undefined' || !BattleManager) return true;
    if (!BattleManager.isRunning) return true;
    if (BattleManager.isDungeon) {
        if (typeof showToast === 'function') showToast('副本中无法修改阵容', 'warning');
        return false;
    }
    if (typeof BattleManager.isPaused === 'function' && BattleManager.isPaused()) return true; // 已暂停，允许修改

    // 战斗进行中 → 弹窗询问是否暂停（与 lockHelper._checkInBattle 一致文案，但保留重置提示）
    if (typeof showConfirm === 'function') {
        showConfirm(
            '战斗进行中',
            '当前正在战斗中，无法更换阵容。<br><span style="color:#ffd700;">是否暂停战斗以更换阵容？</span><br><br><span style="font-size:11px;color:#888;">提示：更换阵容后将<span style="color:#ff9800;">重置当前关卡</span>（所有角色满状态、敌人重置）</span>',
            function() {
                if (typeof BattleManager !== 'undefined' && BattleManager.togglePause) {
                    BattleManager.togglePause();
                }
            }
        );
    } else {
        if (typeof showToast === 'function') showToast('战斗进行中，请先暂停战斗', 'warning');
    }
    return false;
}

// ★ BUG#8 修复：阵容修改后的统一后处理
//   - 同步 BattleManager 队伍
//   - 若处于暂停状态，调用 resetForTeamChange() 重置当前关卡
function _postTeamChange() {
    if (typeof BattleManager === 'undefined' || !BattleManager) return;
    // 同步队伍
    BattleManager.setTeam(getTeamHeroes());
    // 暂停状态 + 主战场 → 重置当前关卡
    if (!BattleManager.isDungeon && BattleManager._mainBattlePaused && BattleManager.resetForTeamChange) {
        BattleManager.resetForTeamChange();
    }
}

function getSlotPositions() {
    var unlocked = GameState.get('unlockedSlots') || 2;
    var allPositions = ['front', 'back1', 'back2', 'back3'];
    return {
        unlocked: allPositions.slice(0, unlocked),
        locked: allPositions.slice(unlocked)
    };
}

function isSlotUnlocked(pos) {
    var unlocked = GameState.get('unlockedSlots') || 2;
    var order = ['front', 'back1', 'back2', 'back3'];
    var idx = order.indexOf(pos);
    return idx !== -1 && idx < unlocked;
}

function assignHeroToSlot(pos, heroId) {
    // ★ BUG#8 修复：战斗中禁止修改阵容（必须先暂停）
    if (!_checkTeamEditable()) return;
    // 检查上阵位是否已解锁
    if (!isSlotUnlocked(pos)) {
        showToast('该位置未解锁，请到天赋页解锁', 'warning');
        return;
    }
    var hero=null;var _es5_135=(GameState.get('heroes') || []);for(var _es5_136=0;_es5_136<_es5_135.length;_es5_136++){if(_es5_135[_es5_136].id === heroId){hero=_es5_135[_es5_136];break;}};
    if (!hero) return;
    // 检查是否同职业已上阵
    if (isClassInTeam(hero.classId, pos)) {
        showToast('该职业已在阵中，不能重复上阵', 'warning');
        return;
    }
    var team = GameState.get('team') || {};
    team[pos] = hero;
    GameState.set('team', team);
    clearSwapSelection();
    refreshTeamUI();
    updateResources();
    // ★ BUG#8 修复：统一后处理（setTeam + 暂停状态重置关卡）
    _postTeamChange();
    updateMainTeamPower();
    AudioManager.play('click');
}

function removeHeroFromSlot(pos) {
    // ★ BUG#8 修复：战斗中禁止修改阵容（必须先暂停）
    if (!_checkTeamEditable()) return;
    if (GameState.get('team')) {
    GameState.mutate('team', function(t) { if (t) t[pos] = null; return t; });
    }
    clearSwapSelection();
    refreshTeamUI();
    updateResources();
    // ★ BUG#8 修复：统一后处理（setTeam + 暂停状态重置关卡）
    _postTeamChange();
    updateMainTeamPower();
    showToast('已从' + getSlotName(pos) + '下阵', 'info');
    AudioManager.play('click');
}

function swapSlots(pos1, pos2) {
    // ★ BUG#8 修复：战斗中禁止修改阵容（必须先暂停）
    if (!_checkTeamEditable()) return;
    if (pos1 === pos2) return;
    // 检查目标位置是否解锁
    if (!isSlotUnlocked(pos2)) {
        showToast('该位置未解锁，不能交换到此处', 'warning');
        clearSwapSelection();
        return;
    }
    var team = GameState.get('team') || {};
    var temp = team[pos1];
    team[pos1] = team[pos2];
    team[pos2] = temp;
    GameState.set('team', team);
    clearSwapSelection();
    refreshTeamUI();
    updateResources();
    // ★ BUG#8 修复：统一后处理（setTeam + 暂停状态重置关卡）
    _postTeamChange();
    updateMainTeamPower();
    showToast('已交换 ' + getSlotName(pos1) + ' 和 ' + getSlotName(pos2) + ' 位置', 'success');
}

function clearSwapSelection() {
    swapSelectedPos = null;
    // 清除所有高亮
    var slots = document.querySelectorAll('.team-slot');
    for (var i = 0; i < slots.length; i++) {
        slots[i].classList.remove('selected');
    }
}

// 阵容槽位点击处理
function onTeamSlotClick(pos) {
    var team = GameState.get('team') || {};
    var isFilled = team[pos] !== null && team[pos] !== undefined;

    if (!isFilled) {
        // 空槽位 -> 打开选择
        openSlotSelect(pos);
        return;
    }

    if (swapSelectedPos === null) {
        // 第一次点击已填槽位 -> 高亮标记
        swapSelectedPos = pos;
        var slot = document.querySelector('.team-slot[data-pos="' + pos + '"]');
        if (slot) slot.classList.add('selected');
    } else if (swapSelectedPos === pos) {
        // 点击同一个 -> 下阵
        removeHeroFromSlot(pos);
    } else {
        // 点击另一个已填槽位 -> 交换位置
        var otherFilled = team[swapSelectedPos] !== null && team[swapSelectedPos] !== undefined;
        if (otherFilled) {
            swapSlots(swapSelectedPos, pos);
        } else {
            // 对方已空 -> 移动
            assignHeroToSlot(pos, team[swapSelectedPos].id);
            removeHeroFromSlot(swapSelectedPos);
        }
    }
}

function assignToTeam(heroId) {
    // ★ BUG#8 修复：战斗中禁止修改阵容（必须先暂停）
    if (!_checkTeamEditable()) return;
    var hero=null;var _es5_137=(GameState.get('heroes') || []);for(var _es5_138=0;_es5_138<_es5_137.length;_es5_138++){if(_es5_137[_es5_138].id === heroId){hero=_es5_137[_es5_138];break;}};
    if (!hero) {
        showToast('英雄不存在', 'warning');
        return;
    }
    // 检查是否同职业已上阵
    if (isClassInTeam(hero.classId)) {
        showToast('该职业已在阵中，不能重复上阵', 'warning');
        return;
    }
    var team = GameState.get('team') || {};
    var positions = ['front', 'back1', 'back2', 'back3'];
    // 找第一个空位（仅限已解锁位置）
    for (var i = 0; i < positions.length; i++) {
        if (!team[positions[i]] && isSlotUnlocked(positions[i])) {
            assignHeroToSlot(positions[i], heroId);
            var clsData = getClassData(hero.classId);
            showToast((clsData ? clsData.name : '英雄') + ' 已上阵', 'success');
            return;
        }
    }
    showToast('阵容已满或无可用的空位，请先下阵其他英雄', 'warning');
}

function autoBestTeam() {
    // ★ BUG#8 修复：战斗中禁止修改阵容（必须先暂停）
    if (!_checkTeamEditable()) return;
    var heroes = (GameState.get('heroes') || []).slice();
    var team = GameState.get('team') || {};

    var sorted = heroes.sort(function(a, b) {
        var scoreA = a.score || calcHeroScore(a);
        var scoreB = b.score || calcHeroScore(b);
        return scoreB - scoreA;
    });

    var positions = ['front', 'back1', 'back2', 'back3'];
    // 将已解锁栏位过滤出来（仅对已解锁的位置进行填充）
    var unlockedPositions = positions.filter(function(p) { return isSlotUnlocked(p); });

    // 1. 收集已上阵英雄 id 和已上阵职业（用于保留手动上阵 + 过滤职业冲突）
    var usedHeroIds = {};
    var occupiedClasses = {};
    for (var i = 0; i < unlockedPositions.length; i++) {
        var existing = team[unlockedPositions[i]];
        if (existing && existing.id) {
            usedHeroIds[existing.id] = true;
            if (existing.classId) {
                occupiedClasses[existing.classId] = true;
            }
        }
    }

    // 2. 构建候选池：按战力排序，去除已在阵中的英雄 + 去除职业已冲突的英雄
    var candidates = [];
    for (var n = 0; n < sorted.length; n++) {
        var h = sorted[n];
        if (!h || !h.id || !h.classId) continue;
        if (usedHeroIds[h.id]) continue;
        if (occupiedClasses[h.classId]) continue;
        candidates.push(h);
        occupiedClasses[h.classId] = true; // 同一候选池中也不重复职业
    }

    // 3. 分离坦克与其他职业（坦克优先上前排）
    var tanks = [];
    var others = [];
    for (var k = 0; k < candidates.length; k++) {
        var ch = candidates[k];
        var cls = getClassData(ch.classId);
        if (cls && cls.role === 'tank') {
            tanks.push(ch);
        } else {
            others.push(ch);
        }
    }

    // 4. 按“坦克优先”顺序填充空位（保留已有上阵，不替换）
    var pool = tanks.concat(others);
    var poolIdx = 0;
    for (var m = 0; m < unlockedPositions.length; m++) {
        var pos = unlockedPositions[m];
        if (!team[pos] && poolIdx < pool.length) {
            team[pos] = pool[poolIdx++];
        }
    }

    // 清空未解锁的位置
    for (var q = 0; q < positions.length; q++) {
        if (!isSlotUnlocked(positions[q])) {
            team[positions[q]] = null;
        }
    }

    GameState.set('team', team);
    clearSwapSelection();
    refreshTeamUI();
    // ★ BUG#8 修复：统一后处理（setTeam + 暂停状态重置关卡）
    _postTeamChange();
    updateMainTeamPower();
    showToast('已自动配置最佳阵容', 'success');
}

// Fallback for Formulas.calcHeroScore (Formulas 不可用时回退入口, Formulas 内部也委托调用)
function calcHeroScore(hero) {
    var cls = getClassData(hero.classId);
    if (!cls) return 0;
    var s = cls.baseStats;
    // 使用与战力体系一致的公式权重
    return s.atk * 1.5 + s.def * 3.5 + s.hp * 0.25 + s.spd * 1.2 + s.crit * 2.5 + s.critDmg * 0.8 + (s.effectHit || 0) * 1 + (s.effectRes || 0) * 1;
}

// 渲染阵容槽位
function renderFormationUI() {
    var team = GameState.get('team') || {};
    var positions = ['front', 'back1', 'back2', 'back3'];
    var positionNames = { front: '前排', back1: '后排1', back2: '后排2', back3: '后排3' };
    // 使用 CLASS_ROLE_NAMES||fallback 内联模式，防止 esbuild 反向优化
    var _roleNames = CLASS_ROLE_NAMES || { tank: '坦克', dps: '输出', healer: '治疗', support: '辅助' };

    for (var i = 0; i < positions.length; i++) {
        var pos = positions[i];
        var slot = document.getElementById('slot-' + pos);
        var hero = team[pos];
        if (slot) {
            if (hero) {
                var cls = getClassData(hero.classId);
                var roleName = cls ? (_roleNames[cls.role] || cls.role || '') : '';
                var heroName = cls ? cls.name : '未知';
                slot.innerHTML =
                    '<div class="hero-icon">' + (cls ? cls.icon : '?') + '</div>' +
                    '<div class="hero-name">' + heroName + ' Lv.' + (hero.level || 1) + '</div>' +
                    '<div class="hero-level">' + roleName + '</div>' +
                    '<div class="remove-btn" onclick="event.stopPropagation();removeHeroFromSlot(\'' + pos + '\')">\u2715</div>';
                var outerSlot = document.querySelector('.team-slot[data-pos="' + pos + '"]');
                if (outerSlot) {
                    outerSlot.classList.add('filled');
                    outerSlot.classList.remove('locked');
                }
            } else {
                var isLocked = !isSlotUnlocked(pos);
                var placeholder = slot.querySelector('.slot-placeholder');
                if (placeholder) {
                    if (isLocked) {
                        placeholder.textContent = '\ud83d\udd12 \u672a\u89e3\u9501';
                    } else {
                        placeholder.textContent = '\u70b9\u51fb\u4e0a\u9635';
                    }
                } else {
                    slot.innerHTML = '<div class="slot-placeholder">' + (isLocked ? '\ud83d\udd12 \u672a\u89e3\u9501' : '\u70b9\u51fb\u4e0a\u9635') + '</div>';
                }
                var outerSlot = document.querySelector('.team-slot[data-pos="' + pos + '"]');
                if (outerSlot) {
                    if (isLocked) {
                        outerSlot.classList.add('locked');
                        outerSlot.classList.remove('filled');
                    } else {
                        outerSlot.classList.remove('filled');
                        outerSlot.classList.remove('locked');
                    }
                }
            }
        }
    }
}

// 渲染职业池
function renderClassPoolUI() {
    var grid = document.getElementById('class-pool-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var ownedHeroIds = (GameState.get('heroes') || []).map(function(h) { return h.classId; });

    for (var i = 0; i < CLASS_DATA.length; i++) {
        var cls = CLASS_DATA[i];
        var isOwned = ownedHeroIds.indexOf(cls.id) !== -1;
        var heroData=null;var _es5_139=(GameState.get('heroes') || []);for(var _es5_140=0;_es5_140<_es5_139.length;_es5_140++){if(_es5_139[_es5_140].classId === cls.id){heroData=_es5_139[_es5_140];break;}};
        var card = document.createElement('div');
        card.className = isOwned ? 'class-card owned' : 'class-card locked';

        if (isOwned && heroData) {
            // 已拥有
            var inTeam = isInTeam(heroData.id);
            var classInTeam = isClassInTeam(heroData.classId);
            var btnDisabled = classInTeam && !inTeam;
            var btnStyle = '';
            var btnText = '上阵';
            if (inTeam) {
                btnStyle = 'background:rgba(76,175,80,0.2);border-color:#4caf50;color:#4caf50;';
                btnText = '已上阵';
            } else if (classInTeam) {
                btnStyle = 'background:rgba(255,152,0,0.15);border-color:#ff9800;color:#ff9800;';
                btnText = '已在阵';
            }
            card.innerHTML = '<div class="class-icon">' + cls.icon + '</div>' +
                '<div class="class-name">' + cls.name + '</div>' +
                '<div class="class-level">Lv.' + (heroData.level || 1) + '</div>' +
                '<button class="assign-btn" style="' + btnStyle + '" ' +
                (btnDisabled ? 'disabled' : 'onclick="event.stopPropagation();assignToTeam(\'' + heroData.id + '\')"') + '>' + btnText + '</button>';
            (function(heroId) {
                card.addEventListener('click', function(e) {
                    if (e.target.tagName === 'BUTTON') return;
                    selectHeroForDetail(heroId);
                    switchScreen('hero');
                });
            })(heroData.id);
        } else {
            // 未解锁：显示购买按钮（统一为 10000 G）
            var buyCost = 10000;
            var gold = GameState.get('gold') || 0;
            card.innerHTML = '<div class="class-icon" style="opacity:0.4;">' + cls.icon + '</div>' +
                '<div class="class-name" style="color:#666;">' + cls.name + '</div>' +
                '<div class="class-cost" style="color:#888;">' + buyCost + 'G</div>' +
                '<button class="buy-btn" onclick="buyClass(\'' + cls.id + '\')">' +
                (gold >= buyCost ? '&#9733; 解锁' : '&#9733; ' + buyCost + 'G') +
                '</button>';
        }
        grid.appendChild(card);
    }
}

// 判断英雄是否已上阵
function isInTeam(heroId) {
    var team = GameState.get('team') || {};
    var positions = ['front', 'back1', 'back2', 'back3'];
    for (var i = 0; i < positions.length; i++) {
        if (team[positions[i]] && team[positions[i]].id === heroId) return true;
    }
    return false;
}

// 判断职业是否已在阵中（排除指定位置）
function isClassInTeam(classId, excludePos) {
    var team = GameState.get('team') || {};
    var positions = ['front', 'back1', 'back2', 'back3'];
    for (var i = 0; i < positions.length; i++) {
        if (positions[i] === excludePos) continue;
        if (team[positions[i]] && team[positions[i]].classId === classId) return true;
    }
    return false;
}

// 购买解锁职业

// 打开职业池弹窗
function openClassPoolModal() {
    // 关闭已有弹窗防止堆叠
    var oldModals = document.querySelectorAll('.modal-overlay');
    for (var omi = 0; omi < oldModals.length; omi++) oldModals[omi].remove();
    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()">' +
        '<div class="modal-content" style="max-width:440px;max-height:80vh;overflow-y:auto;position:relative;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border-bottom:2px solid rgba(255,215,0,0.3);">' +
        '<h3 style="color:#ffd700;margin:0;">📋 全部职业</h3>' +
        '<span style="font-size:20px;color:rgba(255,255,255,0.5);cursor:pointer;" onclick="this.closest(\'.modal-overlay\').remove()">✕</span>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px;justify-content:center;" id="class-pool-modal-grid">';
    
    var ownedHeroIds = (GameState.get('heroes') || []).map(function(h) { return h.classId; });
    var gold = GameState.get('gold') || 0;
    
    for (var i = 0; i < CLASS_DATA.length; i++) {
        var cls = CLASS_DATA[i];
        var isOwned = ownedHeroIds.indexOf(cls.id) !== -1;
        var heroData = null;
        var heroes = GameState.get('heroes') || [];
        for (var hi = 0; hi < heroes.length; hi++) {
            if (heroes[hi].classId === cls.id) { heroData = heroes[hi]; break; }
        }
        
        var cardBg = isOwned ? 'rgba(76,175,80,0.08)' : 'rgba(255,255,255,0.03)';
        var borderClr = isOwned ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.08)';
        
        html += '<div style="width:100px;padding:10px 8px;text-align:center;background:' + cardBg + ';border:1px solid ' + borderClr + ';border-radius:10px;">';
        html += '<div style="font-size:28px;margin-bottom:4px;' + (isOwned ? '' : 'opacity:0.4;') + '">' + cls.icon + '</div>';
        html += '<div style="font-size:11px;font-weight:bold;color:' + (isOwned ? '#fff' : '#666') + ';">' + cls.name + '</div>';
        
        if (isOwned && heroData) {
            html += '<div style="font-size:9px;color:#888;">Lv.' + (heroData.level || 1) + '</div>';
            var inTeam = isInTeam(heroData.id);
            if (inTeam) {
                html += '<div style="font-size:9px;color:#4caf50;margin-top:2px;">✅ 已上阵</div>';
            } else {
                html += '<button class="btn" style="font-size:9px;padding:3px 8px;margin-top:4px;background:rgba(76,175,80,0.2);border:1px solid #4caf50;color:#4caf50;" onclick="assignToTeam(\'' + heroData.id + '\');this.closest(\'.modal-overlay\').remove()">⬆ 上阵</button>';
            }
        } else {
            if (cls.cost > 0) {
                html += '<div style="font-size:9px;color:#ff9800;margin-top:2px;">💎 10000G</div>';
                if (gold >= 10000) {
                    html += '<button class="btn" style="font-size:9px;padding:3px 8px;margin-top:4px;background:rgba(255,152,0,0.2);border:1px solid #ff9800;color:#ff9800;" onclick="buyClass(\'' + cls.id + '\');setTimeout(function(){openClassPoolModal();},500)">解锁</button>';
                } else {
                    html += '<div style="font-size:9px;color:#f44336;">金币不足</div>';
                }
            } else {
                html += '<div style="font-size:9px;color:#888;">免费</div>';
            }
        }
        html += '</div>';
    }
    
    html += '</div></div></div>';
    
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}


function buyClass(classId) {
    var clsData = getClassData(classId);
    if (!clsData) return;
    // 非免费职业统一消耗10000金币
    var buyCost = (clsData.cost > 0) ? 10000 : 0;
    if ((GameState.get('gold') || 0) < buyCost) {
        showToast('金币不足! 需要 ' + buyCost + ' G', 'warning');
        return;
    }
    // 检查是否已拥有
    var owned = (GameState.get('heroes') || []).some(function(h) { return h.classId === classId; });
    if (owned) {
        showToast('该职业已解锁', 'info');
        return;
    }

    GameState.mutate('gold', function(g) { return (g || 0) - buyCost; });

    // 创建新英雄
    var skillList = clsData.skills || [];
    var newHero = {
        id: 'hero_' + classId + '_' + Date.now(),
        classId: classId,
        level: 1,
        exp: 0,
        expToNext: getExpToNext(1),
        skills: skillList.slice(0),
        equip: {},
        skillLevels: (skillList.length > 0) ? ((function(o){o[skillList[0]]=1;return o;})({})) : {},
        skillPoints: 2
    };
    GameState.mutate('heroes', function(arr) {
        if (!arr) arr = [];
        arr.push(newHero);
        return arr;
    });

    showToast(clsData.name + ' 已解锁! (' + buyCost + 'G)', 'success');
    AudioManager.play('unlock');
    updateResources();
    refreshTeamUI();
}

// 刷新队伍UI
function refreshTeamUI() {
    renderFormationUI();
    // 职业池改为弹窗，不再内联渲染

    // 确保队伍界面有"角色详情"按钮（DOM方式，兼容直接HTML注入）
    var screenHeader = document.querySelector('#screen-team .screen-header');
    if (screenHeader) {
        var existingBtn = screenHeader.querySelector('.action-btn[onclick*="switchScreen(\'hero\')"]');
        if (!existingBtn) {
            var heroBtn = document.createElement('button');
            heroBtn.className = 'action-btn';
            heroBtn.textContent = '角色详情';
            heroBtn.onclick = function() { switchScreen('hero'); };
            // 插入在"一键最佳"按钮之前
            var autoBtn = screenHeader.querySelector('.action-btn[onclick*="autoBestTeam"]');
            if (autoBtn) {
                screenHeader.insertBefore(heroBtn, autoBtn);
            } else {
                screenHeader.appendChild(heroBtn);
            }
        }
    }

    // 计算综合战力
    var team = GameState.get('team') || {};
    var positions = ['front', 'back1', 'back2', 'back3'];
    var totalPower = 0;
    var teamHeroes = [];
    for (var i = 0; i < positions.length; i++) {
        var h = team[positions[i]];
        if (h) {
            totalPower += calcHeroPower(h);
            teamHeroes.push(h);
        }
    }
    document.getElementById('team-power').textContent = (typeof formatNumber === 'function' ? formatNumber(totalPower) : Math.floor(totalPower));

    // 更新主界面队伍战力
    updateMainTeamPower();

    // 羁绊展示
    var bondsHtml = '';
    var bonds = calcActiveBonds(teamHeroes);
    if (bonds.length > 0) {
        bondsHtml = '<strong>羁绊效果:</strong><br>';
        for (var i = 0; i < bonds.length; i++) {
            bondsHtml += bonds[i].icon + ' ' + bonds[i].name + ': ' + bonds[i].desc + '<br>';
        }
    } else if (teamHeroes.length >= 2) {
        bondsHtml = '<span style="color:#666;">当前阵容未触发羁绊</span>';
    } else {
        bondsHtml = '<span style="color:#666;">上阵2名以上角色触发羁绊</span>';
    }
    document.getElementById('team-bonds').innerHTML = bondsHtml;
}

// 收集当前队伍的所有英雄（供战力计算使用，包括羁绊计算）
// v6.x — 优先使用 HeroView.byPos() 从 heroes 主源读取最新引用，避免 JSON.parse 后的多份引用分离问题
function collectTeamHeroes() {
    var heroes = [];
    if (GameState.get('team')) {
        var positions = ['front', 'back1', 'back2', 'back3'];
        if (typeof HeroView !== 'undefined' && HeroView.byPos) {
            // view 层：永远从 heroes 主源读取（解决引用分离问题）
            for (var i = 0; i < positions.length; i++) {
                var h = HeroView.byPos(positions[i]);
                if (h) heroes.push(h);
            }
        } else {
            // 回退入口：直接读 GameState
            for (var j = 0; j < positions.length; j++) {
                var h2 = GameState.get('team')[positions[j]];
                if (h2) heroes.push(h2);
            }
        }
    }
    return heroes;
}

// 计算英雄个人战力（v3 严谨化 — 委托 Formulas.calcHeroPower 统一权威）
//   属性来源顺序（由 BattleManager.calcAllyStats 提供）：
//     职业基础 → 装备基础 → 装备词条 → 宝石加成 → 天赋 → 被动技能 → 等级加成
//   羁绊来源：当前上场 ≥ 2 人时 calcActiveBonds 产出加法型/乘法型效果
//   权重：与 Formulas.POWER_WEIGHTS 完全对齐（17 个属性统一权重）
//
// Fallback for Formulas.calcHeroPower (Formulas 不可用时回退入口, 17 属性 + 7 羁绊权重与 Formulas 完全一致)
function calcHeroPower(hero) {
    // ① 优先委托 Formulas 统一权威（保证业务调用方获得唯一公式）
    if (typeof Formulas !== 'undefined' && Formulas.calcHeroPower) {
        try { return Formulas.calcHeroPower(hero); } catch (e) { /* 回退到本地实现 */ }
    }
    // ② 本地回退实现（与 Formulas.calcHeroPower 字段 100% 对齐）
    if (!hero) return 0;
    var cls = (typeof getClassData === 'function') ? getClassData(hero.classId) : null;
    if (!cls) return 0;
    try {
        var stats = (typeof BattleManager !== 'undefined' && BattleManager.calcAllyStats)
            ? BattleManager.calcAllyStats(hero, cls) : null;
        if (!stats) return 0;

        // 收集队伍（用于羁绊计算）
        var teamHeroes = (typeof collectTeamHeroes === 'function') ? collectTeamHeroes() : [];

        // 羁绊加法型/乘法型拆分
        var bondsAdd = { crit: 0, critDmg: 0, dmgBonus: 0, elemMastery: 0 };
        var bondsMult = { atk: 1, def: 1, hp: 1 };
        if (teamHeroes.length >= 2 && typeof calcActiveBonds === 'function') {
            try {
                var activeBonds = calcActiveBonds(teamHeroes);
                for (var bi = 0; bi < activeBonds.length; bi++) {
                    var eff = activeBonds[bi] && activeBonds[bi].effects;
                    if (!eff) continue;
                    if (eff.atkBonus) bondsMult.atk *= (1 + eff.atkBonus);
                    if (eff.defBonus) bondsMult.def *= (1 + eff.defBonus);
                    if (eff.hpBonus) bondsMult.hp *= (1 + eff.hpBonus);
                    if (eff.critBonus) bondsAdd.crit += eff.critBonus;
                    if (eff.critDmgBonus) bondsAdd.critDmg += eff.critDmgBonus;
                    if (eff.dmgBonus) bondsAdd.dmgBonus += eff.dmgBonus * 100;
                    if (eff.elemMasteryBonus) bondsAdd.elemMastery += eff.elemMasteryBonus;
                }
            } catch (e) { /* 羁绊失败不阻断 */ }
        }

        // 统一权重（委托 Formulas.POWER_WEIGHTS，回退内联表）
        var W = (typeof Formulas !== 'undefined' && Formulas.POWER_WEIGHTS) || {
            atk: 1.5, def: 3.5, hp: 0.25, spd: 1.2, crit: 2.5, critDmg: 0.8,
            effectHit: 1, effectRes: 1, dmgBonus: 5, dmgReduction: 5,
            elemMastery: 1, physMastery: 0.5, healRate: 1, healBonus: 1,
            expBonus: 0.3, lootBonus: 0.3
        };

        // 17 个属性统一计算（含羁绊加法/乘法）
        return Math.floor(
            (stats.atk || 0) * bondsMult.atk * W.atk +
            (stats.def || 0) * bondsMult.def * W.def +
            (stats.hp  || 0) * bondsMult.hp  * W.hp  +
            (stats.spd || 0) * W.spd +
            ((stats.crit || 0) + bondsAdd.crit) * W.crit +
            (stats.critDmg || 0) * W.critDmg +
            (stats.effectHit || 0) * W.effectHit +
            (stats.effectRes || 0) * W.effectRes +
            (stats.dmgBonus || 0) * W.dmgBonus +
            (bondsAdd.dmgBonus || 0) * W.dmgBonus +
            (stats.dmgReduction || 0) * W.dmgReduction +
            ((stats.elemMastery || 0) + bondsAdd.elemMastery) * W.elemMastery +
            (stats.physMastery || 0) * W.physMastery +
            (stats.healRate || 0) * W.healRate +
            (stats.healBonus || 0) * W.healBonus +
            (stats.expBonus || 0) * W.expBonus +
            (stats.lootBonus || 0) * W.lootBonus
        );
    } catch (e) {
        return 0;
    }
}

// 更新主界面队伍综合战力
function updateMainTeamPower() {
    var el = document.getElementById('team-power-main');
    if (!el) return;
    var team = GameState.get('team') || {};
    var positions = ['front', 'back1', 'back2', 'back3'];
    var totalPower = 0;
    for (var i = 0; i < positions.length; i++) {
        var h = team[positions[i]];
        if (h) {
            totalPower += calcHeroPower(h);
        }
    }
    el.textContent = '战力: ' + (typeof formatNumber === 'function' ? formatNumber(totalPower) : Math.floor(totalPower));
}
