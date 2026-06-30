/* global GameState */
// ========== 角色详情UI ==========

// v3 统一架构：品质名称/类代理为 window.Quality（避免依赖 helpers.js 的 fallback 包装）
function _qName(q) { return (typeof Quality !== 'undefined' && Quality.getName) ? Quality.getName(q) : (q === 0 ? '白' : '未知'); }
function _qClass(q) { return (typeof Quality !== 'undefined' && Quality.getClass) ? Quality.getClass(q) : ''; }
function _qColor(q) { return (typeof Quality !== 'undefined' && Quality.getColor) ? Quality.getColor(q) : '#fff'; }

var selectedHeroForDetail = null;

function getTeamHeroList() {
    var team = GameState.get('team') || {};
    var positions = ['front', 'back1', 'back2', 'back3'];
    var heroes = [];
    for (var i = 0; i < positions.length; i++) {
        if (team[positions[i]]) {
            heroes.push(team[positions[i]]);
        }
    }
    return heroes;
}

// 渲染英雄选择网格
function renderHeroSelectGrid() {
    var heroes = getTeamHeroList();
    var grid = document.getElementById('hero-select-grid');
    grid.innerHTML = '';
    if (heroes.length === 0) {
        grid.innerHTML = '<div style="color:#666;font-size:12px;text-align:center;padding:8px;">尚未上阵英雄</div>';
        return;
    }
    for (var i = 0; i < heroes.length; i++) {
        var h = heroes[i];
        var cls = getClassData(h.classId);
        if (!cls) continue;
        var isActive = selectedHeroForDetail && selectedHeroForDetail.id === h.id;
        var card = document.createElement('div');
        card.className = 'hero-select-card' + (isActive ? ' active' : '');
        card.innerHTML = '<div class="hero-select-icon">' + cls.icon + '</div>' +
            '<div class="hero-select-name">' + cls.name + '</div>' +
            '<div class="hero-select-level">Lv.' + (h.level || 1) + '</div>';
        (function(heroId) {
            card.addEventListener('click', function() {
                selectHeroForDetail(heroId);
            });
        })(h.id);
        grid.appendChild(card);
    }
}

// 选择英雄查看详情
function selectHeroForDetail(heroId) {
    var heroes = getTeamHeroList();
    var hero=null;var _es5_75=heroes;for(var _es5_76=0;_es5_76<_es5_75.length;_es5_76++){if(_es5_75[_es5_76].id === heroId){hero=_es5_75[_es5_76];break;}};
    if (!hero) {
        hero = null;
        var _heroesArr = (GameState.get('heroes') || []);
        for (var _hi = 0; _hi < _heroesArr.length; _hi++) {
            if (_heroesArr[_hi].id === heroId) { hero = _heroesArr[_hi]; break; }
        }
    }
    if (!hero) return;
    selectedHeroForDetail = hero;
    refreshHeroUI();
}

function refreshHeroUI() {
    var hero = selectedHeroForDetail;
    renderHeroSelectGrid();

    if (!hero) {
        document.getElementById('hero-avatar-icon').textContent = '?';
        document.getElementById('hero-name').textContent = '未选择英雄';
        document.getElementById('hero-class').innerHTML = '<span style="color:#888;font-size:12px;">← 请点击上方英雄头像查看详情</span>';
        document.getElementById('hero-power').textContent = '';
        document.getElementById('stat-atk').textContent = '0';
        document.getElementById('stat-def').textContent = '0';
        document.getElementById('stat-hp').textContent = '0';
        document.getElementById('stat-spd').textContent = '0';
        document.getElementById('stat-mp').textContent = '0';
        document.getElementById('stat-crit').textContent = '0%';
        document.getElementById('stat-critdmg').textContent = '0%';
        document.getElementById('stat-effecthit').textContent = '0';
        document.getElementById('stat-effectres').textContent = '0';
        document.getElementById('stat-dmgBonus').textContent = '0%';
        document.getElementById('stat-dmgReduction').textContent = '0%';
        document.getElementById('stat-healBonus').textContent = '0';
        document.getElementById('stat-expbonus').textContent = '0%';
        document.getElementById('stat-lootbonus').textContent = '0%';
        document.getElementById('stat-exp').textContent = '0/50';
        var expFill = document.getElementById('hero-exp-fill');
        if (expFill) expFill.style.width = '0%';
        // 清空属性条
        var barIds = ['bar-atk', 'bar-def', 'bar-hp', 'bar-spd'];
        for (var bi = 0; bi < barIds.length; bi++) {
            var be = document.getElementById(barIds[bi]);
            if (be) be.style.width = '0%';
        }
        // 清空装备
        var slotIds = ['weapon', 'offhand', 'helmet', 'armor', 'boots'];
        for (var i = 0; i < slotIds.length; i++) {
            var slotEl = document.querySelector('[data-slot="' + slotIds[i] + '"]');
            if (slotEl) {
                var slotData=null;var _es5_77=EQUIP_SLOTS;for(var _es5_78=0;_es5_78<_es5_77.length;_es5_78++){if(_es5_77[_es5_78].id === slotIds[i]){slotData=_es5_77[_es5_78];break;}};
                slotEl.textContent = (slotData ? slotData.name : slotIds[i]) + ' (空)';
                slotEl.className = 'equip-slot';
                slotEl.title = '';
            }
        }
        document.getElementById('skill-points-display').textContent = '0';
        // ★ v4.1 不覆盖技能树（skillUI.js 已渲染时不重置）
        var skillContainer = document.getElementById('hero-skills');
        var skillAlreadyRendered = skillContainer && skillContainer.children.length > 0 && skillContainer.innerHTML.indexOf('skill-tree') >= 0;
        if (!skillAlreadyRendered) {
            document.getElementById('hero-skills').innerHTML = '<div style="padding:10px;text-align:center;color:#555;">选择一个英雄后查看技能详情</div>';
        }
        return;
    }

    var cls = getClassData(hero.classId);
    if (!cls) return;

    document.getElementById('hero-avatar-icon').textContent = cls.icon;
    document.getElementById('hero-name').textContent = cls.name + ' Lv.' + (hero.level || 1);
    document.getElementById('hero-class').textContent = cls.desc;

    // 个人战力
    var power = calcHeroPower(hero);
    document.getElementById('hero-power').textContent = '个人战力: ' + (typeof formatNumber === 'function' ? formatNumber(power) : power);

    // 属性面板
    var stats = BattleManager.calcAllyStats(hero, cls);
    document.getElementById('stat-atk').textContent = stats.atk;
    document.getElementById('stat-def').textContent = stats.def;
    document.getElementById('stat-hp').textContent = stats.hp;
    document.getElementById('stat-spd').textContent = stats.spd;
    document.getElementById('stat-mp').textContent = stats.maxMp || '0';
    document.getElementById('stat-crit').textContent = stats.crit + '%';
    document.getElementById('stat-critdmg').textContent = stats.critDmg + '%';
    document.getElementById('stat-effecthit').textContent = (stats.effectHit || 0);
    document.getElementById('stat-effectres').textContent = (stats.effectRes || 0);
    document.getElementById('stat-dmgBonus').textContent = (stats.dmgBonus || 0) + '%';
    document.getElementById('stat-dmgReduction').textContent = (stats.dmgReduction || 0) + '%';
    document.getElementById('stat-healBonus').textContent = (stats.healBonus || 0);
    document.getElementById('stat-expbonus').textContent = (stats.expBonus || 0) + '%';
    document.getElementById('stat-lootbonus').textContent = (stats.lootBonus || 0) + '%';

    // ★ v5.0 Change 5: 主属性进度条
    var barStats = [
        { id: 'bar-atk', val: stats.atk || 0, max: (stats.atk || 0) * 1.5 },
        { id: 'bar-def', val: stats.def || 0, max: (stats.def || 0) * 1.5 },
        { id: 'bar-hp', val: stats.hp || 0, max: (stats.hp || 0) * 1.5 },
        { id: 'bar-spd', val: stats.spd || 0, max: (stats.spd || 0) * 1.5 }
    ];
    for (var bi = 0; bi < barStats.length; bi++) {
        var barEl = document.getElementById(barStats[bi].id);
        if (barEl) {
            var pct = barStats[bi].max > 0 ? Math.min(100, Math.round((barStats[bi].val / barStats[bi].max) * 100)) : 0;
            barEl.style.width = pct + '%';
        }
    }

    // 经验值
    var expText = (hero.exp || 0) + '/' + (hero.expToNext || 50);
    document.getElementById('stat-exp').textContent = expText;
    // 经验条填充
    var expFill = document.getElementById('hero-exp-fill');
    if (expFill) {
        var expPct = (hero.expToNext > 0) ? Math.min(100, ((hero.exp || 0) / hero.expToNext) * 100) : 0;
        expFill.style.width = expPct + '%';
    }

    // 装备栏 — 环绕布局 (使用 innerHTML 确保内容显示)
    var equip = hero.equip || {};
    var slotIds = ['weapon', 'offhand', 'helmet', 'armor', 'boots'];
    var slotIcons = { weapon: getSlotIcon('weapon'), offhand: getSlotIcon('offhand'), helmet: getSlotIcon('helmet'), armor: getSlotIcon('armor'), boots: getSlotIcon('boots') };
    var slotNames = { weapon: '武器', offhand: '副手', helmet: '头盔', armor: '护甲', boots: '鞋子' };
    for (var i = 0; i < slotIds.length; i++) {
        var slotEl = document.querySelector('[data-slot="' + slotIds[i] + '"]');
        var eq = equip[slotIds[i]];
        if (eq) {
            var qualColor = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'][eq.quality] || '#9e9e9e';
            var qualName = _qName(eq.quality);
            var enhanceLvl = (typeof getSlotEnhanceLevel === 'function') ? getSlotEnhanceLevel(hero.id, slotIds[i]) : 0;
            var enhanceBadge = enhanceLvl > 0 ? '<span class="enhance-badge-ring">+' + enhanceLvl + '</span>' : '';
            if (slotEl) {
                slotEl.innerHTML = '<div class="slot-ring-icon">' + (slotIcons[slotIds[i]] || '📦') + '</div>' +
                    '<div class="slot-ring-label" style="color:' + qualColor + ';">' + qualName + ' ' + (eq.name || '').substring(0,5) + '</div>' +
                    '<div class="slot-ring-level">' + (enhanceLvl > 0 ? '+' + enhanceLvl : '') + '</div>' +
                    enhanceBadge;
                slotEl.className = 'equip-slot ring-slot filled';
                slotEl.style.setProperty('--slot-color', qualColor);
                slotEl.style.setProperty('--slot-bg', qualColor + '18');
                slotEl.title = qualName + ' ' + (eq.name || '') + ' 强化+' + enhanceLvl;
            }
        } else {
            if (slotEl) {
                slotEl.innerHTML = '<div class="slot-ring-icon">' + (slotIcons[slotIds[i]] || '📦') + '</div>' +
                    '<div class="slot-ring-label">' + (slotNames[slotIds[i]] || slotIds[i]) + '</div>' +
                    '<div class="slot-ring-level"></div>';
                slotEl.className = 'equip-slot ring-slot empty';
                slotEl.style.removeProperty('--slot-color');
                slotEl.style.removeProperty('--slot-bg');
                slotEl.title = '';
            }
        }
    }

    // ★ v5.0 Change 5: 装备套装信息
    var setEffects = BattleManager.getActiveSetEffects(hero);
    var setInfoEl = document.getElementById('hero-set-info');
    if (setInfoEl) {
        if (setEffects.setId && setEffects.pieceCount >= 2) {
            var sd = SET_DATA[setEffects.setId];
            if (sd) {
                var p2 = setEffects.has2pc ? '<span style="color:#4caf50;">已激活</span>' : '<span style="color:#888;">(2件)</span>';
                var p4 = setEffects.has4pc ? '<span style="color:#ffd700;">已激活</span>' : '<span style="color:#888;">(4件)</span>';
                setInfoEl.innerHTML = '<div class="set-info-card">' +
                    '<div class="set-info-name">📦 ' + sd.name + ' <span style="font-size:11px;color:#888;">(' + setEffects.pieceCount + '/' + sd.pieces + '件)</span></div>' +
                    '<div class="set-info-desc">' + sd.desc + '</div>' +
                    '<div class="set-info-status">2件: ' + p2 + ' | 4件: ' + p4 + '</div>' +
                    '</div>';
                setInfoEl.style.display = 'block';
            } else {
                setInfoEl.style.display = 'none';
            }
        } else {
            setInfoEl.style.display = 'none';
        }
    }

    // 更新技能点显示
    document.getElementById('skill-points-display').textContent = hero.skillPoints || 0;
    // 刷新技能UI
    refreshSkillUI();
}

// 检查英雄是否能装备该物品
function canEquipItem(hero, item) {
    var cls = getClassData(hero.classId);
    if (!cls) return false;
    
    if (item.slot === 'weapon') {
        return item.weaponType === cls.weaponType;
    }
    if (item.slot === 'offhand') {
        return item.weaponType === cls.offhandType;
    }
    // 防具检查 armorType
    if (item.armorType) {
        var allowedTypes = getClassArmorTypes(hero.classId);
        return allowedTypes.indexOf(item.armorType) !== -1;
    }
    return true;
}

// 打开装备选择
function openEquipSelect(slotId) {
    var hero = selectedHeroForDetail;
    if (!hero) {
        showToast('请先选择角色', 'warning');
        return;
    }
    var inv = GameState.get('inventory') || [];
    var matching = inv.filter(function(eq) { return eq.slot === slotId && canEquipItem(hero, eq); });
    if (matching.length === 0) {
        var _slotName = (function(){
            for (var _si = 0; _si < EQUIP_SLOTS.length; _si++) {
                if (EQUIP_SLOTS[_si].id === slotId) return EQUIP_SLOTS[_si];
            }
            return {};
        })().name;
        showToast('仓库中没有可用的' + _slotName + '装备', 'warning');
        return;
    }

    var currentEquip = hero.equip[slotId];
    var slotData=null;var _es5_79=EQUIP_SLOTS;for(var _es5_80=0;_es5_80<_es5_79.length;_es5_80++){if(_es5_79[_es5_80].id === slotId){slotData=_es5_79[_es5_80];break;}};
    var slotName = slotData ? slotData.name : slotId;

    // 获取强化等级
    var currentEnhanceLvl = (currentEquip && typeof getSlotEnhanceLevel === 'function') ? getSlotEnhanceLevel(hero.id, slotId) : 0;
    var currentEnhanceMult = 1 + currentEnhanceLvl * 0.05;

    // 构建装备详情 html 辅助函数
    function buildEquipCard(eq, label, enhanceLvl, enhanceMult) {
        if (!eq) {
            return '<div class="equip-compare-card empty" style="flex:1;background:rgba(0,0,0,0.3);border-radius:8px;padding:12px;border:1px dashed rgba(255,255,255,0.15);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;">' +
                '<div style="font-size:32px;color:rgba(255,255,255,0.1);margin-bottom:8px;">❌</div>' +
                '<div style="font-size:13px;color:#666;">空</div>' +
                (label ? '<div style="font-size:10px;color:#555;margin-top:4px;">' + label + '</div>' : '') +
            '</div>';
        }
        var qualName = _qName(eq.quality);
        var qualClass = _qClass(eq.quality);
        var qualColors = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'];
        var qualColor = qualColors[eq.quality] || '#9e9e9e';
        var score = calcEquipScore ? calcEquipScore(eq, enhanceMult) : (eq.score || 0);
        var icon = (typeof getSlotIcon === 'function') ? getSlotIcon(eq.slot, eq.id || '', eq) : (eq.slotIcon || (slotData ? slotData.icon : '📦'));

        var html = '<div class="equip-compare-card" style="flex:1;background:rgba(0,0,0,0.35);border-radius:8px;padding:10px 12px;border:1px solid ' + qualColor + '44;position:relative;overflow:hidden;">';
        // 品质色带
        html += '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,' + qualColor + ',' + qualColor + '88);"></div>';
        // 标签
        if (label) {
            html += '<div style="font-size:10px;color:#888;margin-bottom:4px;">' + label + '</div>';
        }
        // 名称行
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
        html += '<div style="width:32px;height:32px;flex-shrink:0;border-radius:6px;background:' + qualColor + '22;border:1px solid ' + qualColor + '44;display:flex;align-items:center;justify-content:center;font-size:18px;">' + icon + '</div>';
        html += '<div style="flex:1;min-width:0;">';
        html += '<div class="' + qualClass + '" style="font-size:13px;font-weight:bold;color:' + qualColor + ';word-break:break-all;line-height:1.3;">' + qualName + ' ' + eq.name + '</div>';
        html += '<div style="font-size:10px;color:#888;">' + slotName + (eq.weaponType ? ' · ' + (WEAPON_TYPE_NAMES[eq.weaponType] || eq.weaponType) : '') + (eq.armorType ? ' · ' + (ARMOR_TYPE_NAMES[eq.armorType] || eq.armorType) : '') + '</div>';
        html += '</div>';
        // 评分
        html += '<div style="text-align:center;flex-shrink:0;min-width:40px;">';
        html += '<div style="font-size:16px;font-weight:bold;color:' + qualColor + ';">' + score + '</div>';
        html += '<div style="font-size:9px;color:#888;">评分</div></div>';
        html += '</div>';

        // 基础属性
        if (eq.baseStats && Array.isArray(eq.baseStats) && eq.baseStats.length > 0) {
            html += '<div style="margin-top:4px;">';
            for (var bsi = 0; bsi < eq.baseStats.length; bsi++) {
                var bs = eq.baseStats[bsi];
                if (bs && bs.stat) {
                    var bsIcons = { atk: '⚔️', def: '🛡', hp: '❤️', spd: '💨' };
                    var bsNames = { atk: '攻击力', def: '防御力', hp: '生命', spd: '速度' };
                    var bsColors = { atk: '#ff5252', def: '#4caf50', hp: '#f44336', spd: '#29b6f6' };
                    var enhancedValue = Math.floor(bs.value * (enhanceMult || 1));
                    html += '<div style="display:flex;align-items:center;padding:3px 4px;border-radius:4px;background:rgba(255,255,255,0.03);margin-bottom:1px;">';
                    html += '<span style="font-size:11px;margin-right:4px;">' + (bsIcons[bs.stat] || '') + '</span>';
                    html += '<span style="font-size:11px;color:' + (bsColors[bs.stat] || '#ccc') + ';flex:1;">' + (bsNames[bs.stat] || bs.stat) + '</span>';
                    html += '<span style="color:#fff;font-size:12px;font-weight:bold;">+' + enhancedValue + '</span>';
                    html += '</div>';
                }
            }
            html += '</div>';
        }

        // 词条统计
        var affixCount = (eq.affixes && Array.isArray(eq.affixes)) ? eq.affixes.length : 0;
        html += '<div style="display:flex;gap:4px;margin-top:4px;font-size:10px;color:#888;">';
        html += '<span>词条: <b style="color:' + qualColor + ';">' + affixCount + '</b></span>';
        if (eq.sockets) {
            html += '<span>| 宝石孔: <b style="color:#29b6f6;">' + (eq.sockets || 0) + '</b></span>';
        }
        html += '</div>';

        // 强化等级
        if (enhanceLvl > 0) {
            html += '<div style="font-size:10px;color:#ff9800;margin-top:2px;">强化 +' + enhanceLvl + ' (基础属性+' + (enhanceLvl * 5) + '%)</div>';
        }

        html += '</div>';
        return html;
    }

    // 计算两个装备的属性差异
    function buildStatComparison(current, selected) {
        var html = '<div style="margin:6px 0;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,0.02);">';
        // 评分比较
        var curScore = current ? (calcEquipScore ? calcEquipScore(current, currentEnhanceMult) : (current.score || 0)) : 0;
        var selScore = calcEquipScore ? calcEquipScore(selected, 1) : (selected.score || 0);
        var scoreDiff = selScore - curScore;
        var diffColor = scoreDiff > 0 ? '#4caf50' : (scoreDiff < 0 ? '#f44336' : '#888');
        var diffSign = scoreDiff > 0 ? '↑+' : (scoreDiff < 0 ? '↓' : '±');
        html += '<div style="display:flex;justify-content:center;align-items:center;padding:4px 0;font-size:13px;">';
        html += '<span style="color:#888;">评分变化: </span>';
        html += '<span style="color:' + diffColor + ';font-weight:bold;margin-left:4px;">' + diffSign + Math.abs(scoreDiff) + '</span>';
        html += '</div>';

        // 基础属性逐条比较
        var allStats = { atk: '攻击力', def: '防御力', hp: '生命', spd: '速度' };
        var bsIcons = { atk: '⚔️', def: '🛡', hp: '❤️', spd: '💨' };
        var bsColors = { atk: '#ff5252', def: '#4caf50', hp: '#f44336', spd: '#29b6f6' };

        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
        // 从baseStats提取，如果当前装备没有则从getEquipBaseStat获取
        var curStats = {};
        var selStats = {};
        if (current && current.baseStats) {
            for (var i = 0; i < current.baseStats.length; i++) {
                var bs = current.baseStats[i];
                if (bs && bs.stat) curStats[bs.stat] = Math.floor(bs.value * currentEnhanceMult);
            }
        } else if (current) {
            var baseD = getEquipBaseStat ? getEquipBaseStat(current.slot, current.level, current.quality) : null;
            if (baseD) curStats[baseD.stat] = Math.floor(baseD.value * currentEnhanceMult);
        }
        if (selected.baseStats) {
            for (var j = 0; j < selected.baseStats.length; j++) {
                var bs2 = selected.baseStats[j];
                if (bs2 && bs2.stat) selStats[bs2.stat] = Math.floor(bs2.value);
            }
        } else {
            var baseD2 = getEquipBaseStat ? getEquipBaseStat(selected.slot, selected.level, selected.quality) : null;
            if (baseD2) selStats[baseD2.stat] = Math.floor(baseD2.value);
        }

        var allKeys = {};
        for (var k in allStats) { allKeys[k] = true; }
        for (var k2 in curStats) { allKeys[k2] = true; }
        for (var k3 in selStats) { allKeys[k3] = true; }

        for (var sk in allKeys) {
            if (sk === 'undefined') continue;
            var cv = curStats[sk] || 0;
            var sv = selStats[sk] || 0;
            var diff = sv - cv;
            var cmpColor = diff > 0 ? '#4caf50' : (diff < 0 ? '#f44336' : '#888');
            var cmpIcon = diff > 0 ? '↑' : (diff < 0 ? '↓' : '—');
            html += '<div style="display:flex;align-items:center;gap:4px;padding:3px 6px;border-radius:4px;background:rgba(255,255,255,0.03);min-width:45%;">';
            html += '<span style="font-size:10px;">' + (bsIcons[sk] || '') + '</span>';
            html += '<span style="font-size:10px;color:' + (bsColors[sk] || '#ccc') + ';flex:1;">' + (allStats[sk] || sk) + '</span>';
            html += '<span style="font-size:10px;color:' + cmpColor + ';font-weight:bold;">' + cmpIcon + ' ' + (diff > 0 ? '+' : '') + diff + '</span>';
            html += '</div>';
        }
        html += '</div></div>';
        return html;
    }

    var html = '<div class="modal-overlay" onclick="if(event.target===this)this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="max-height:90vh;overflow-y:auto;position:relative;"><h3>选择装备 - ' + slotName + '</h3>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>';
    // 职业信息
    if (slotId === 'weapon' || slotId === 'offhand') {
        var clsData = getClassData(hero.classId);
        if (clsData) {
            var allowedType = slotId === 'weapon' ? clsData.weaponType : clsData.offhandType;
            html += '<div style="font-size:11px;color:#4fc3f7;padding:4px 0 8px 0;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:8px;">';
            html += (slotId === 'weapon' ? '主武器' : '副手武器') + '可配带类型: <b>' + (WEAPON_TYPE_NAMES[allowedType] || allowedType) + '</b>';
            var compClasses = getWeaponCompatibleClasses(slotId, allowedType);
            if (compClasses.length > 0) {
                html += ' | 适用职业: <span style="color:#ffd700;">' + compClasses.join('、') + '</span>';
            }
            html += '</div>';
        }
    } else if (slotId === 'helmet' || slotId === 'armor' || slotId === 'boots') {
        html += '<div style="font-size:11px;color:#4fc3f7;padding:4px 0 8px 0;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:8px;">';
        var allowedArmorTypes = getClassArmorTypes(hero.classId);
        html += '可配带护甲: <b>' + allowedArmorTypes.map(function(t){return ARMOR_TYPE_NAMES[t]||t;}).join('、') + '</b>';
        html += '</div>';
    }

    // ===== 侧边对比区域 (初始显示第一个物品) =====
    var firstEq = matching[0];
    html += '<div id="equip-compare-area" style="display:flex;gap:8px;align-items:stretch;margin-bottom:10px;">';
    // 左：当前装备
    html += buildEquipCard(currentEquip, '当前装备', currentEnhanceLvl, currentEnhanceMult);
    // 中：VS
    html += '<div style="display:flex;align-items:center;flex-shrink:0;padding:0 4px;">' +
        '<div style="font-size:18px;font-weight:bold;color:#888;text-shadow:0 0 8px rgba(255,255,255,0.1);">VS</div>' +
    '</div>';
    // 右：选中装备 (初始为第一个)
    html += '<div id="equip-compare-selected">' + buildEquipCard(firstEq, '待装备', 0, 1) + '</div>';
    html += '</div>';

    // 差异比较
    html += '<div id="equip-compare-diff">' + buildStatComparison(currentEquip, firstEq) + '</div>';

    // ===== 可用装备列表 =====
    html += '<div style="font-size:11px;color:#888;margin:6px 0 4px;">可用装备 (' + matching.length + ' 件)</div>';
    html += '<div style="max-height:240px;overflow-y:auto;">';
    for (var i = 0; i < matching.length; i++) {
        var eq = matching[i];
        var eqScore = calcEquipScore ? calcEquipScore(eq, 1) : (eq.score || 0);
        var eqQualName = _qName(eq.quality);
        var eqQualClass = _qClass(eq.quality);
        var qualColors = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'];
        var eqQualColor = qualColors[eq.quality] || '#9e9e9e';
        var affixCount = (eq.affixes && Array.isArray(eq.affixes)) ? eq.affixes.length : 0;
        var isFirst = (i === 0);
        html += '<div class="equip-compare-item' + (isFirst ? ' selected' : '') + '" data-eq-id="' + eq.id + '" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:' + (isFirst ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)') + ';border:1px solid ' + (isFirst ? eqQualColor + '66' : 'rgba(255,255,255,0.1)') + ';border-radius:8px;margin-bottom:4px;cursor:pointer;transition:all 0.2s;" onclick="updateEquipComparison(\'' + slotId + '\',\'' + eq.id + '\')">' +
            '<div style="flex:1;min-width:0;">' +
                '<div class="' + eqQualClass + '" style="font-size:13px;color:' + eqQualColor + ';">' + eqQualName + ' ' + eq.name + '</div>' +
                '<div style="font-size:10px;color:#888;">词条:' + affixCount + (eq.level ? ' | LV.' + eq.level : '') + '</div>' +
            '</div>' +
            '<div style="font-size:13px;font-weight:bold;color:' + eqQualColor + ';flex-shrink:0;">' + eqScore + '</div>' +
            '<button class="btn" style="padding:4px 12px;font-size:12px;flex-shrink:0;background:linear-gradient(135deg,' + eqQualColor + '44,' + eqQualColor + '22);border-color:' + eqQualColor + '88;color:' + eqQualColor + ';font-weight:bold;" onclick="event.stopPropagation();equipHero(\'' + slotId + '\',\'' + eq.id + '\');this.closest(\'.modal-overlay\').remove()">装备</button>' +
        '</div>';
    }
    html += '</div>';

    html += '<button class="btn" style="margin-top:8px;width:100%;" onclick="this.closest(\'.modal-overlay\').remove()">取消</button></div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

// 动态更新装备对比（鼠标悬停/点击切换时调用）
function updateEquipComparison(slotId, eqId) {
    var hero = selectedHeroForDetail;
    if (!hero) return;
    var inv = GameState.get('inventory') || [];
    var eq=null;var _es5_81=inv;for(var _es5_82=0;_es5_82<_es5_81.length;_es5_82++){if(_es5_81[_es5_82].id === eqId){eq=_es5_81[_es5_82];break;}};
    if (!eq) return;
    var currentEquip = hero.equip[slotId];

    var currentEnhanceLvl = (currentEquip && typeof getSlotEnhanceLevel === 'function') ? getSlotEnhanceLevel(hero.id, slotId) : 0;
    var currentEnhanceMult = 1 + currentEnhanceLvl * 0.05;

    // 构建装备卡
    function buildEquipCard(eq, label, enhanceLvl, enhanceMult) {
        if (!eq) {
            return '<div class="equip-compare-card empty" style="flex:1;background:rgba(0,0,0,0.3);border-radius:8px;padding:12px;border:1px dashed rgba(255,255,255,0.15);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;">' +
                '<div style="font-size:32px;color:rgba(255,255,255,0.1);margin-bottom:8px;">❌</div>' +
                '<div style="font-size:13px;color:#666;">空</div>' +
                (label ? '<div style="font-size:10px;color:#555;margin-top:4px;">' + label + '</div>' : '') +
            '</div>';
        }
        var qualName = _qName(eq.quality);
        var qualClass = _qClass(eq.quality);
        var qualColors = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'];
        var qualColor = qualColors[eq.quality] || '#9e9e9e';
        var score = calcEquipScore ? calcEquipScore(eq, enhanceMult) : (eq.score || 0);
        var slotData=null;var _es5_83=EQUIP_SLOTS;for(var _es5_84=0;_es5_84<_es5_83.length;_es5_84++){if(_es5_83[_es5_84].id === eq.slot){slotData=_es5_83[_es5_84];break;}};
        var slotName = slotData ? slotData.name : eq.slot;
        var icon = (typeof getSlotIcon === 'function') ? getSlotIcon(eq.slot, eq.id || '', eq) : (eq.slotIcon || (slotData ? slotData.icon : '📦'));

        var html = '<div class="equip-compare-card" style="flex:1;background:rgba(0,0,0,0.35);border-radius:8px;padding:10px 12px;border:1px solid ' + qualColor + '44;position:relative;overflow:hidden;">';
        html += '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,' + qualColor + ',' + qualColor + '88);"></div>';
        if (label) {
            html += '<div style="font-size:10px;color:#888;margin-bottom:4px;">' + label + '</div>';
        }
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
        html += '<div style="width:32px;height:32px;flex-shrink:0;border-radius:6px;background:' + qualColor + '22;border:1px solid ' + qualColor + '44;display:flex;align-items:center;justify-content:center;font-size:18px;">' + icon + '</div>';
        html += '<div style="flex:1;min-width:0;">';
        html += '<div class="' + qualClass + '" style="font-size:13px;font-weight:bold;color:' + qualColor + ';word-break:break-all;line-height:1.3;">' + qualName + ' ' + eq.name + '</div>';
        html += '<div style="font-size:10px;color:#888;">' + slotName + '</div>';
        html += '</div>';
        html += '<div style="text-align:center;flex-shrink:0;min-width:40px;">';
        html += '<div style="font-size:16px;font-weight:bold;color:' + qualColor + ';">' + score + '</div>';
        html += '<div style="font-size:9px;color:#888;">评分</div></div>';
        html += '</div>';

        if (eq.baseStats && Array.isArray(eq.baseStats) && eq.baseStats.length > 0) {
            html += '<div style="margin-top:4px;">';
            for (var bsi = 0; bsi < eq.baseStats.length; bsi++) {
                var bs = eq.baseStats[bsi];
                if (bs && bs.stat) {
                    var bsIcons = { atk: '⚔️', def: '🛡', hp: '❤️', spd: '💨' };
                    var bsNames = { atk: '攻击力', def: '防御力', hp: '生命', spd: '速度' };
                    var bsColors = { atk: '#ff5252', def: '#4caf50', hp: '#f44336', spd: '#29b6f6' };
                    var enhancedValue = Math.floor(bs.value * (enhanceMult || 1));
                    html += '<div style="display:flex;align-items:center;padding:3px 4px;border-radius:4px;background:rgba(255,255,255,0.03);margin-bottom:1px;">';
                    html += '<span style="font-size:11px;margin-right:4px;">' + (bsIcons[bs.stat] || '') + '</span>';
                    html += '<span style="font-size:11px;color:' + (bsColors[bs.stat] || '#ccc') + ';flex:1;">' + (bsNames[bs.stat] || bs.stat) + '</span>';
                    html += '<span style="color:#fff;font-size:12px;font-weight:bold;">+' + enhancedValue + '</span>';
                    html += '</div>';
                }
            }
            html += '</div>';
        }

        var affixCount = (eq.affixes && Array.isArray(eq.affixes)) ? eq.affixes.length : 0;
        html += '<div style="display:flex;gap:4px;margin-top:4px;font-size:10px;color:#888;">';
        html += '<span>词条: <b style="color:' + qualColor + ';">' + affixCount + '</b></span>';
        if (eq.sockets) {
            html += '<span>| 宝石孔: <b style="color:#29b6f6;">' + (eq.sockets || 0) + '</b></span>';
        }
        html += '</div>';

        if (enhanceLvl > 0) {
            html += '<div style="font-size:10px;color:#ff9800;margin-top:2px;">强化 +' + enhanceLvl + '</div>';
        }

        html += '</div>';
        return html;
    }

    // 构建差异对比
    function buildStatComparison(current, selected) {
        var html = '<div style="margin:6px 0;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,0.02);">';
        var curScore = current ? (calcEquipScore ? calcEquipScore(current, currentEnhanceMult) : (current.score || 0)) : 0;
        var selScore = calcEquipScore ? calcEquipScore(selected, 1) : (selected.score || 0);
        var scoreDiff = selScore - curScore;
        var diffColor = scoreDiff > 0 ? '#4caf50' : (scoreDiff < 0 ? '#f44336' : '#888');
        var diffSign = scoreDiff > 0 ? '↑+' : (scoreDiff < 0 ? '↓' : '±');
        html += '<div style="display:flex;justify-content:center;align-items:center;padding:4px 0;font-size:13px;">';
        html += '<span style="color:#888;">评分变化: </span>';
        html += '<span style="color:' + diffColor + ';font-weight:bold;margin-left:4px;">' + diffSign + Math.abs(scoreDiff) + '</span>';
        html += '</div>';

        var allStats = { atk: '攻击力', def: '防御力', hp: '生命', spd: '速度' };
        var bsIcons = { atk: '⚔️', def: '🛡', hp: '❤️', spd: '💨' };
        var bsColors = { atk: '#ff5252', def: '#4caf50', hp: '#f44336', spd: '#29b6f6' };

        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
        var curStats = {};
        var selStats = {};
        if (current && current.baseStats) {
            for (var i = 0; i < current.baseStats.length; i++) {
                var bs = current.baseStats[i];
                if (bs && bs.stat) curStats[bs.stat] = Math.floor(bs.value * currentEnhanceMult);
            }
        } else if (current) {
            var baseD = getEquipBaseStat ? getEquipBaseStat(current.slot, current.level, current.quality) : null;
            if (baseD) curStats[baseD.stat] = Math.floor(baseD.value * currentEnhanceMult);
        }
        if (selected.baseStats) {
            for (var j = 0; j < selected.baseStats.length; j++) {
                var bs2 = selected.baseStats[j];
                if (bs2 && bs2.stat) selStats[bs2.stat] = Math.floor(bs2.value);
            }
        } else {
            var baseD2 = getEquipBaseStat ? getEquipBaseStat(selected.slot, selected.level, selected.quality) : null;
            if (baseD2) selStats[baseD2.stat] = Math.floor(baseD2.value);
        }

        var allKeys = {};
        for (var k in allStats) { allKeys[k] = true; }
        for (var k2 in curStats) { allKeys[k2] = true; }
        for (var k3 in selStats) { allKeys[k3] = true; }

        for (var sk in allKeys) {
            if (sk === 'undefined') continue;
            var cv = curStats[sk] || 0;
            var sv = selStats[sk] || 0;
            var diff = sv - cv;
            var cmpColor = diff > 0 ? '#4caf50' : (diff < 0 ? '#f44336' : '#888');
            var cmpIcon = diff > 0 ? '↑' : (diff < 0 ? '↓' : '—');
            html += '<div style="display:flex;align-items:center;gap:4px;padding:3px 6px;border-radius:4px;background:rgba(255,255,255,0.03);min-width:45%;">';
            html += '<span style="font-size:10px;">' + (bsIcons[sk] || '') + '</span>';
            html += '<span style="font-size:10px;color:' + (bsColors[sk] || '#ccc') + ';flex:1;">' + (allStats[sk] || sk) + '</span>';
            html += '<span style="font-size:10px;color:' + cmpColor + ';font-weight:bold;">' + cmpIcon + ' ' + (diff > 0 ? '+' : '') + diff + '</span>';
            html += '</div>';
        }
        html += '</div></div>';
        return html;
    }

    // 更新右侧选中装备卡片
    var selectedEl = document.getElementById('equip-compare-selected');
    if (selectedEl) {
        selectedEl.innerHTML = buildEquipCard(eq, '待装备', 0, 1);
    }

    // 更新差异对比
    var diffEl = document.getElementById('equip-compare-diff');
    if (diffEl) {
        diffEl.innerHTML = buildStatComparison(currentEquip, eq);
    }

    // 高亮当前选中的行
    var items = document.querySelectorAll('.equip-compare-item');
    for (var ii = 0; ii < items.length; ii++) {
        var item = items[ii];
        var eid = item.getAttribute('data-eq-id');
        if (eid === eqId) {
            item.style.background = 'rgba(255,255,255,0.06)';
            var qualColors = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'];
            var eqQualColor = qualColors[eq.quality] || '#9e9e9e';
            item.style.borderColor = eqQualColor + '66';
        } else {
            item.style.background = 'rgba(0,0,0,0.3)';
            item.style.borderColor = 'rgba(255,255,255,0.1)';
        }
    }
}

// 复杂重铸: 临时入仓 + 关闭监测
// ★ v2.6.4 Round 3.1 重构: 不再调已删除的 openReforgeLockUI/doReforgeWithLock, 改用 reforgeUI.js 里的新版本
//   - 流程: 标记 _heroEquipReforge + 临时入仓 + 从英雄身上摘下 + 调 reforgeUI.openReforgeLockUI
//   - cleanup: 监测弹窗消失时, 如果装备还在 inventory 里有 _heroEquipReforge 标记 (没被重铸/被取消了), 还原回 hero.equip
//   - 如果重铸成功, reforgeUI.doReforgeWithLock 会清掉 _heroEquipReforge 标记 + 刷新, 不会再被 cleanup 误还原
function reforgeEquippedItem(slotId) {
    if (typeof _checkInBattle === 'function' && !_checkInBattle('重铸装备')) return;
    var hero = selectedHeroForDetail;
    if (!hero) {
        showToast('请先选择角色', 'warning');
        return;
    }
    var eq = (hero.equip || {})[slotId];
    if (!eq) {
        showToast('该槽位没有装备', 'warning');
        return;
    }
    if (!eq.affixes || eq.affixes.length === 0) {
        showToast('该装备没有可重铸的词条', 'info');
        return;
    }

    // 标记为英雄已装备物品, 供 reforgeUI.doReforgeWithLock 识别 (重铸成功后清标记, 避免 cleanup 误还原)
    eq._heroEquipReforge = true;
    eq._heroEquipSlot = slotId;
    eq._heroEquipId = hero.id;

    // 临时加入仓库
    if (!gameState.inventory) gameState.inventory = [];
    GameState.push('inventory', eq);
    // 从英雄身上暂时移除
    hero.equip[slotId] = null;

    // 打开重铸锁定界面 (用 reforgeUI 里的新函数)
    if (typeof openReforgeLockUI === 'function') {
        openReforgeLockUI(eq.id);
    } else {
        // 兜底: reforgeUI.js 没加载, 还原装备 + 提示
        var inv = GameState.get('inventory') || [];
        var idx=-1;var _es5_71=inv;for(var _es5_72=0;_es5_72<_es5_71.length;_es5_72++){if(_es5_71[_es5_72].id === eq.id){idx=_es5_72;break;}};
        if (idx !== -1) inv.splice(idx, 1);
        hero.equip[slotId] = eq;
        delete eq._heroEquipReforge;
        showToast('重铸功能未就绪 (reforgeUI.js 未加载)', 'error');
        refreshHeroUI();
        return;
    }

    // 监测弹窗关闭 - 如果用户关闭弹窗而未重铸, 归还装备
    var _cleanupId = setInterval(function() {
        var modal = document.getElementById('reforgeLockModal');
        if (!modal) {
            clearInterval(_cleanupId);
            var inv2 = GameState.get('inventory') || [];
            var orphan = null;
            for (var ci = 0; ci < inv2.length; ci++) {
                if (inv2[ci].id === eq.id && inv2[ci]._heroEquipReforge) {
                    orphan = inv2[ci];
                    break;
                }
            }
            if (orphan) {
                var tmpIdx = inv2.indexOf(orphan);
                if (tmpIdx !== -1) inv2.splice(tmpIdx, 1);
                GameState.set('inventory', inv2);
                if (hero.equip && !hero.equip[slotId]) {
                    hero.equip[slotId] = orphan;
                }
                delete orphan._heroEquipReforge;
                delete orphan._heroEquipSlot;
                delete orphan._heroEquipId;
                refreshHeroUI();
                if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
            }
        }
    }, 1000);
}

// 给英雄装备
function equipHero(slotId, equipId) {
    // ★ HOME_3.1: 战斗锁定检查（heroUI 装备类入口）
    if (typeof _checkInBattle === 'function' && !_checkInBattle('装备')) return;
    var hero = selectedHeroForDetail;
    if (!hero) return;
    if (!hero.equip) hero.equip = {};
    var inv = GameState.get('inventory') || [];
    var idx=-1;var _es5_73=inv;for(var _es5_74=0;_es5_74<_es5_73.length;_es5_74++){if(_es5_73[_es5_74].id === equipId){idx=_es5_74;break;}};
    if (idx === -1) return;
    var eq = inv[idx];
    
    if (!canEquipItem(hero, eq)) {
        showToast('该职业无法装备此武器类型', 'warning');
        return;
    }

    if (hero.equip[slotId]) {
        inv.push(hero.equip[slotId]);
    }

    hero.equip[slotId] = eq;
    inv.splice(idx, 1);
    GameState.set('inventory', inv);
    showToast('已装备 ' + eq.name, 'success');
    AudioManager.play('equip');
    refreshHeroUI();
    refreshInventoryUI();
    updateMainTeamPower();
}

// 一键穿戴最佳装备
function autoEquipBest() {
    // ★ HOME_3.1: 战斗锁定检查（heroUI 装备类入口）
    if (typeof _checkInBattle === 'function' && !_checkInBattle('装备')) return;
    var hero = selectedHeroForDetail;
    if (!hero) {
        showToast('请先选择角色', 'warning');
        return;
    }
    if (!hero.equip) hero.equip = {};
    var inv = GameState.get('inventory') || [];
    var slotIds = ['weapon', 'offhand', 'helmet', 'armor', 'boots'];
    var equipped = 0;
    
    for (var s = 0; s < slotIds.length; s++) {
        var slotId = slotIds[s];
        var best = null;
        var bestScore = -1;
        for (var i = 0; i < inv.length; i++) {
            var eq = inv[i];
            if (eq.slot !== slotId) continue;
            if (!canEquipItem(hero, eq)) continue;
            var eqScr = eq.score !== undefined ? eq.score : calcEquipScore(eq);
            if (eqScr > bestScore) {
                bestScore = eqScr;
                best = eq;
            }
        }
        if (best) {
            // 已装备的装备评分
            var currentEquip = hero.equip[slotId];
            var currentScore = currentEquip ? (currentEquip.score !== undefined ? currentEquip.score : calcEquipScore(currentEquip)) : -1;
            if (bestScore <= currentScore) {
                continue; // 已有装备更好或持平，不替换
            }
            if (currentEquip) {
                // ★ v6.0 自动拆除宝石
                if (currentEquip.gems && currentEquip.gems.length > 0) {
                    var gemList = GameState.get('gems') || [];
                    for (var _gi = 0; _gi < currentEquip.gems.length; _gi++) {
                        var _gem = currentEquip.gems[_gi];
                        if (_gem && _gem.gemTypeId) {
                            var _found = false;
                            for (var _gj = 0; _gj < gemList.length; _gj++) {
                                if (gemList[_gj].gemTypeId === _gem.gemTypeId && gemList[_gj].level === _gem.level) {
                                    gemList[_gj].count = (gemList[_gj].count || 1) + 1;
                                    _found = true; break;
                                }
                            }
                            if (!_found) {
                                gemList.push({ gemTypeId: _gem.gemTypeId, level: _gem.level, count: 1 });
                            }
                        }
                    }
                    GameState.set('gems', gemList);
                    currentEquip.gems = [];
                }
                inv.push(currentEquip);
            }
            var idx = inv.indexOf(best);
            if (idx !== -1) {
                inv.splice(idx, 1);
                hero.equip[slotId] = best;
                equipped++;
            }
        }
    }
    
    GameState.set('inventory', inv);
    if (equipped > 0) {
        showToast('已穿戴 ' + equipped + ' 件最佳装备', 'success');
        AudioManager.play('equip');
    } else {
        showToast('仓库中没有可用的装备', 'info');
    }
    refreshHeroUI();
    refreshInventoryUI();
    updateMainTeamPower();
}

// 显示装备详情弹窗
function showEquipDetail(slotId) {
    var hero = selectedHeroForDetail;
    if (!hero) {
        showToast('请先选择角色', 'warning');
        return;
    }
    var eq = (hero.equip || {})[slotId];
    var slotData=null;var _es5_85=EQUIP_SLOTS;for(var _es5_86=0;_es5_86<_es5_85.length;_es5_86++){if(_es5_85[_es5_86].id === slotId){slotData=_es5_85[_es5_86];break;}};
    var slotName = slotData ? slotData.name : slotId;

    if (!eq) {
        openEquipSelect(slotId);
        return;
    }

    var qualName = _qName(eq.quality);
    var qualClass = _qClass(eq.quality);
    var qualColor = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'][eq.quality] || '#9e9e9e';
    // ★ v5.0: 先获取强化等级，用于评分和基础属性计算
    var enhanceLvl = (typeof getSlotEnhanceLevel === 'function') ? getSlotEnhanceLevel(hero.id, slotId) : 0;
    var enhanceMult = 1 + enhanceLvl * 0.05;
    var score = calcEquipScore(eq, enhanceMult);

    // 品质主题色
    var qTheme = qualColor;
    var qRgba = qTheme + '22';

    var html = '<div class="modal-overlay" onclick="this.remove()"><div class="modal-content" onclick="event.stopPropagation()" style="padding:0;overflow-y:auto;max-height:88vh;border-radius:12px;border:2px solid ' + qTheme + ';position:relative;">';
    html += '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="this.closest(\'.modal-overlay\').remove()">\u2716</span>';
    // ===== 顶部品质色带 =====
    html += '<div style="background:linear-gradient(135deg,' + qTheme + '44,' + qTheme + '22);padding:14px 16px 10px;border-bottom:1px solid ' + qTheme + '44;">';
    html += '<div style="display:flex;align-items:center;gap:10px;">';
    html += '<div style="width:40px;height:40px;flex-shrink:0;border-radius:8px;background:' + qRgba + ';border:2px solid ' + qTheme + ';display:flex;align-items:center;justify-content:center;font-size:20px;">' + (getSlotIcon(eq.slot, eq.id || '', eq)) + '</div>';
 // ★装备名 flex:1+min-width:0 才能正常换行/省略 (之前溢出会截断)
 html += '<div style="flex:1;min-width:0;">';
 html += '<div style="font-size:15px;font-weight:bold;color:' + qTheme + ';word-break:break-all;line-height:1.25;">' + qualName + ' ' + eq.name + '</div>';
 html += '<div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:#aaa;margin-top:3px;">';
    html += '<span>LV.' + (eq.level || 1) + '</span>';
    html += '<span>' + slotName + '</span>';
    var eqType = eq.weaponType ? (WEAPON_TYPE_NAMES[eq.weaponType] || eq.weaponType) : (eq.armorType ? (ARMOR_TYPE_NAMES[eq.armorType] || eq.armorType) : '');
    if (eqType) html += '<span>' + eqType + '</span>';
    html += '</div></div>';
 html += '<div style="text-align:center;flex-shrink:0;min-width:48px;">';
 html += '<div style="font-size:18px;font-weight:bold;color:' + qTheme + ';">' + score + '</div>';
    html += '<div style="font-size:10px;color:#888;">评分</div></div>';
    html += '</div></div>';

    // ===== 基础属性（装备固有属性，已含强化加成）=====
    // ★ v5.0 Change 2/4: 显示双重基础属性（enhanceLvl/enhanceMult 已在前面定义）
    html += '<div style="padding:10px 14px 4px;">';
    html += '<div style="font-size:10px;color:#777;margin-bottom:4px;">基础属性</div>';
    if (eq.baseStats && Array.isArray(eq.baseStats) && eq.baseStats.length > 0) {
        for (var bsi = 0; bsi < eq.baseStats.length; bsi++) {
            var bs = eq.baseStats[bsi];
            if (bs && bs.stat) {
                var bsIcon = { atk: '⚔️', def: '🛡', hp: '❤️', spd: '💨' }[bs.stat] || '';
                var bsName = { atk: '攻击力', def: '防御力', hp: '生命', spd: '速度' }[bs.stat] || bs.stat;
                var bsColor = { atk: '#ff5252', def: '#4caf50', hp: '#f44336', spd: '#29b6f6' }[bs.stat] || '#ccc';
                // ★ v5.0: 强化倍率应用到显示值
                var enhancedValue = Math.round(bs.value * enhanceMult);
                html += '<div style="display:flex;align-items:center;padding:5px 6px;border-radius:4px;background:rgba(255,255,255,0.04);margin-bottom:2px;">';
                html += '<span style="font-size:12px;margin-right:6px;">' + bsIcon + '</span>';
                html += '<span style="font-size:12px;color:' + bsColor + ';flex:1;">' + bsName + '</span>';
                html += '<span style="color:#fff;font-size:13px;font-weight:bold;">+' + enhancedValue + '</span>';
                html += '</div>';
            }
        }
    } else {
        // 旧版兼容：单基础属性
        var baseStatData = getEquipBaseStat(eq.slot, eq.level, eq.quality);
        if (baseStatData) {
            var enhancedValue = Math.floor(baseStatData.value * enhanceMult);
            html += '<div style="display:flex;align-items:center;padding:5px 6px;border-radius:4px;background:rgba(255,255,255,0.04);">';
            html += '<span style="font-size:12px;margin-right:6px;">' + baseStatData.icon + '</span>';
            html += '<span style="font-size:12px;color:#ccc;flex:1;">' + baseStatData.name + '</span>';
            html += '<span style="color:#fff;font-size:13px;font-weight:bold;">+' + enhancedValue + '</span>';
            html += '</div>';
        }
    }
    html += '</div>';

    // ===== 强化等级 (v5.0 槽位强化) =====
    var enhanceColor = '#ff9800';
    if (enhanceLvl >= 15) enhanceColor = '#ffd700';
    else if (enhanceLvl >= 10) enhanceColor = '#ff5722';
    else if (enhanceLvl >= 6) enhanceColor = '#ff9800';
    html += '<div style="padding:6px 14px;background:rgba(255,152,0,0.06);border-top:1px solid rgba(255,152,0,0.1);border-bottom:1px solid rgba(255,152,0,0.1);">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<div>';
    html += '<span style="font-size:10px;color:#888;">槽位强化等级</span>';
    html += '<div style="font-size:13px;color:' + enhanceColor + ';font-weight:bold;">';
    if (enhanceLvl > 0) {
        html += '+' + enhanceLvl + ' ' + getEnhanceStarsHtml(enhanceLvl);
    } else {
        html += '<span style="color:#666;font-weight:normal;">+0 未强化</span>';
    }
    html += '</div></div>';
    if (enhanceLvl > 0) {
        var bonusPct = enhanceLvl * 5;
        html += '<div style="text-align:right;font-size:11px;color:#ff9800;">基础属性 +' + bonusPct + '%</div>';
    }
    html += '</div></div>';

    // ===== 强化操作按钮 =====
    if (enhanceLvl < 15) {
        var nextCost = (typeof getEnhanceCost === 'function') ? getEnhanceCost(enhanceLvl) : 0;
        var nextRate = (typeof getEnhanceSuccessRate === 'function') ? getEnhanceSuccessRate(enhanceLvl) : 1;
        var ratePct = Math.round(nextRate * 100);
        var hasGold = (GameState.get('gold') || 0) >= nextCost;
        var canAfford = hasGold;
        var btnDisabled = !canAfford ? ' style="opacity:0.5;cursor:not-allowed;"' : '';
        var btnBg = canAfford ? 'linear-gradient(135deg,#ff6f00,#ff9800)' : 'linear-gradient(135deg,#555,#666)';
        html += '<div style="padding:6px 14px 8px;display:flex;align-items:center;gap:8px;">';
        html += '<div style="flex:1;font-size:11px;color:#aaa;">消耗: <span style="color:' + (canAfford ? '#ffd700' : '#f44336') + ';">' + nextCost + ' G</span>';
        html += ' ｜ 成功率 <span style="color:' + (nextRate >= 1 ? '#4caf50' : '#ff9800') + ';">' + ratePct + '%</span>';
        html += '</div>';
        html += '<button class="btn" id="hero-enhance-btn" style="background:' + btnBg + ';color:#fff;font-weight:bold;font-size:13px;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;"' + btnDisabled +
            ' onclick="attemptSlotEnhance(\'' + hero.id + '\',\'' + slotId + '\')">⚡ 强 化</button>';
        html += '</div>';
    }

    // ===== 装备词条 =====
    html += '<div style="padding:8px 14px 10px;">';
    html += '<div style="font-size:10px;color:#777;margin-bottom:4px;">装备词条</div>';
    if (eq.affixes && eq.affixes.length > 0) {
        var qDots = ['#9e9e9e','#4caf50','#2196f3','#ce58f5','#ff9800','#ffd700'];
        for (var i = 0; i < eq.affixes.length; i++) {
            var aff = eq.affixes[i];
            var affData=null;var _es5_87=AFFIX_POOL;for(var _es5_88=0;_es5_88<_es5_87.length;_es5_88++){if(_es5_87[_es5_88].id === aff.id){affData=_es5_87[_es5_88];break;}};
            var affName = affData ? affData.name : aff.id;
            var affQ = aff.affixQuality !== undefined ? aff.affixQuality : eq.quality;
            var isPct = affData && (affData.type === 'pct' || aff.stat === 'crit' || aff.stat === 'critDmg');
            var affVal = aff.value + (isPct ? '%' : '');
            var bgRow = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
            html += '<div style="display:flex;align-items:center;padding:4px 6px;border-radius:4px;background:' + bgRow + ';">';
            html += '<span style="color:' + qDots[affQ] + ';font-size:8px;margin-right:6px;">◆</span>';
            html += '<span class="' + _qClass(affQ) + '" style="font-size:12px;flex:1;">' + affName + '</span>';
            html += '<span style="color:#fff;font-size:12px;font-weight:bold;">+' + affVal + '</span>';
            html += '</div>';
        }
    } else {
        html += '<div style="color:#666;font-size:12px;padding:8px 0;text-align:center;">无附加属性</div>';
    }
    html += '</div>';

    // ===== 宝石槽位（可点击交互） =====
    html += '<div style="padding:0 14px 10px;">';
    html += '<div style="font-size:11px;color:#888;margin-bottom:6px;">━━ 宝石镶嵌 (' + (eq.sockets || 0) + '孔，点击操作) ━━</div>';
    html += '<div style="display:flex;gap:6px;">';
    for (var si = 0; si < (eq.sockets || 0); si++) {
        var gem = (eq.gems || [])[si];
        if (gem) {
            var gt=null;var _es5_89=GEM_TYPES;for(var _es5_90=0;_es5_90<_es5_89.length;_es5_90++){if(_es5_89[_es5_90].id === gem.gemTypeId){gt=_es5_89[_es5_90];break;}};
            var gemIcon = gt ? gt.icon : '💎';
            html += '<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:6px;padding:6px;text-align:center;border:1px solid ' + (gt ? gt.color : '#555') + '44;cursor:pointer;" onclick="showGemActionModal(\'' + hero.id + '\',\'' + slotId + '\',' + si + ')" title="点击移除宝石">';
            html += '<div style="font-size:18px;">' + gemIcon + '</div>';
            html += '<div style="font-size:10px;color:' + (gt ? gt.color : '#aaa') + ';">Lv.' + gem.level + '</div>';
            if (gt) html += '<div style="font-size:9px;color:#888;">' + getGemDesc(gt, gem.level) + '</div>';
            html += '<div style="font-size:8px;color:#888;margin-top:2px;">[点击移除]</div>';
            html += '</div>';
        } else {
            html += '<div style="flex:1;background:rgba(255,255,255,0.03);border-radius:6px;padding:6px;text-align:center;border:1px dashed rgba(255,255,255,0.1);cursor:pointer;" onclick="showGemSelectModal(\'' + hero.id + '\',\'' + slotId + '\',' + si + ')" title="点击镶嵌宝石">';
            html += '<div style="font-size:18px;color:rgba(255,255,255,0.15);">◇</div>';
            html += '<div style="font-size:9px;color:rgba(255,255,255,0.15);">空槽</div>';
            html += '<div style="font-size:8px;color:rgba(255,255,255,0.2);margin-top:2px;">[点击镶嵌]</div>';
            html += '</div>';
        }
    }
    html += '</div></div>';

    // ===== 底部信息 =====
    html += '<div style="padding:0 14px 10px;font-size:11px;color:#888;">';
    html += '品质: ' + qualName + ' | 等级: LV.' + (eq.level || 1);
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
    html += '<div style="display:flex;gap:6px;padding:0 14px 12px;">' +
    '<button class="btn" style="flex:1;" onclick="this.closest(\'.modal-overlay\').remove();openEquipSelect(\'' + slotId + '\')">更换装备</button>' +
    '<button class="btn" style="flex:1;background:rgba(255,215,0,0.12);border-color:#ffd700;color:#ffd700;font-size:12px;" onclick="this.closest(\'.modal-overlay\').remove();reforgeEquippedItem(\'' + slotId + '\')">重铸</button>' +
    '<button class="btn" style="flex:1;background:rgba(244,67,54,0.15);border-color:#f44336;color:#f44336;font-size:12px;" onclick="this.closest(\'.modal-overlay\').remove();unequipSlot(\'' + slotId + '\')">脱下</button>' +
    '<button class="btn" style="flex:1;background:#555;" onclick="this.closest(\'.modal-overlay\').remove()">关闭</button>' +
    '</div></div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

// ★ v5.0 Change 1: 槽位强化（从英雄装备详情调用）
function attemptSlotEnhance(heroId, slotId) {
    if (typeof enhanceSlot !== 'function') {
        showToast('强化系统未加载', 'error');
        return;
    }
    if (typeof _checkInBattle === 'function' && !_checkInBattle('强化装备')) {
        return;
    }
    var result = enhanceSlot(heroId, slotId);
    if (result.reason === '已达最高等级') {
        showToast('✦ 该槽位已达最高强化等级！', 'info');
        return;
    }
    if (result.reason === '金币不足') {
        showToast('💰 金币不足，需要 ' + result.cost + ' G（当前: ' + (GameState.get('gold') || 0) + ' G）', 'warning');
        return;
    }
    if (result.success) {
        showToast('⚡ 强化成功！槽位 +' + result.newLevel + '（消耗 ' + result.cost + ' G）', 'success');
    } else {
        showToast('💥 强化失败... 金币 -' + result.cost + '（成功率 ' + Math.round(result.rate * 100) + '%）', 'warning');
    }
    // 刷新详情弹窗
    var overlay = document.querySelector('.modal-overlay');
    if (overlay && overlay.innerHTML.indexOf('槽位强化等级') !== -1) {
        overlay.remove();
        showEquipDetail(slotId);
    }
    // 更新资源显示
    if (typeof updateResources === 'function') updateResources();
    if (typeof refreshHeroUI === 'function') refreshHeroUI();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
}

// ★ v5.0: 脱下装备栏中的装备（放回仓库）
function unequipSlot(slotId) {
    var hero = selectedHeroForDetail;
    if (!hero || !hero.equip || !hero.equip[slotId]) {
        showToast('该槽位没有装备', 'warning');
        return;
    }
    var eq = hero.equip[slotId];
    // ★ v3.5.1 脱下时自动拆除宝石并返还仓库
    var _gemCount = (eq.gems || []).length;
    if (_gemCount > 0) {
        for (var _gi = 0; _gi < eq.gems.length; _gi++) {
            var _gem = eq.gems[_gi];
            if (!_gem) continue;
            var _existing=null;var _es5_91=GameState.get('gems');for(var _es5_92=0;_es5_92<_es5_91.length;_es5_92++){if(_es5_91[_es5_92].gemTypeId === _gem.gemTypeId && _es5_91[_es5_92].level === _gem.level){_existing=_es5_91[_es5_92];break;}};
            if (_existing) { _existing.count = (_existing.count || 1) + 1; }
            else { GameState.push('gems', { gemTypeId: _gem.gemTypeId, level: _gem.level, count: 1 }); }
        }
        eq.gems = [];
        showToast('已拆除 ' + _gemCount + ' 颗宝石并返还仓库', 'info');
    }
    if (!gameState.inventory) gameState.inventory = [];
    GameState.push('inventory', eq);
    hero.equip[slotId] = null;
    showToast('已脱下 ' + (eq.name || '装备'), 'info');
    refreshHeroUI();
    if (typeof updateResources === 'function') updateResources();
}

// ★ v2.6.4 Round 4.1: 装备详情 modal 实时刷新（用于镶嵌/拆除宝石后）
//   找到当前打开的 modal-overlay (装备详情 = hero.equip[slotId]), 关掉 + 重开 showEquipDetail
//   注意: 不能用 document.querySelectorAll('.modal-overlay').forEach(remove) 否则会误关其他 modal
//   (比如装备详情旁边可能有别的弹窗: 智能出售/分解确认等)
function reRenderOpenEquipDetailModal(hero, slotId) {
    var overlays = document.querySelectorAll('.modal-overlay');
    var matched = null;
    for (var i = 0; i < overlays.length; i++) {
        var ov = overlays[i];
        var content = ov.querySelector('.modal-content');
        if (!content) continue;
        // 装备详情 modal 的特征: 含 "宝石镶嵌" 标题文字
        var html = content.innerHTML;
        if (html.indexOf('宝石镶嵌') !== -1) {
            matched = ov;
            break;
        }
    }
    if (!matched) return; // 没找到装备详情 modal, 啥也不做 (可能是已关)
    matched.remove();
    // 重开 (用全局 selectedHeroForDetail 模拟)
    if (typeof window.selectedHeroForDetail === 'undefined' || !window.selectedHeroForDetail) {
        window.selectedHeroForDetail = hero;
    }
    showEquipDetail(slotId);
}
