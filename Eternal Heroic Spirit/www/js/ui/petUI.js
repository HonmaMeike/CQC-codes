// ========== 宠物系统 - UI ==========
// 标签页: 抽奖机 | 我的宠物 | 蛋仓库 | 碎片仓库
// 孵化槽 x3, 升星系统, 碎片系统
/* global GameState */

var _petCurrentTab = 'mypets';

// 注入抽奖相关CSS
(function() {
    var styleId = 'pet-lottery-style';
    if (!document.getElementById(styleId)) {
        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = 
            '@keyframes petGlowPulse {' +
            '  0% { box-shadow: 0 0 5px rgba(255,215,0,0.3), 0 0 10px rgba(255,215,0,0.1); }' +
            '  50% { box-shadow: 0 0 15px rgba(255,215,0,0.6), 0 0 30px rgba(255,215,0,0.3); }' +
            '  100% { box-shadow: 0 0 5px rgba(255,215,0,0.3), 0 0 10px rgba(255,215,0,0.1); }' +
            '}' +
            '@keyframes petGoldShimmer {' +
            '  0% { background-position: -200% center; }' +
            '  100% { background-position: 200% center; }' +
            '}' +
            '.pet-glow-btn {' +
            '  animation: petGlowPulse 2s ease-in-out infinite !important;' +
            '  transition: all 0.3s ease;' +
            '}' +
            '.pet-glow-btn:hover {' +
            '  transform: scale(1.05);' +
            '  animation-duration: 1s !important;' +
            '}' +
            '.pet-gold-text {' +
            '  background: linear-gradient(90deg, #ffd700, #ffec8b, #ffd700, #ffec8b);' +
            '  background-size: 200% auto;' +
            '  -webkit-background-clip: text;' +
            '  -webkit-text-fill-color: transparent;' +
            '  animation: petGoldShimmer 3s linear infinite;' +
            '}' +
            '.pet-sparkle {' +
            '  position: absolute;' +
            '  pointer-events: none;' +
            '  font-size: 16px;' +
            '  opacity: 0.6;' +
            '  animation: petSparkleFloat 2s ease-in-out infinite;' +
            '}' +
            '@keyframes petSparkleFloat {' +
            '  0% { transform: translateY(0) rotate(0deg); opacity: 0.6; }' +
            '  50% { transform: translateY(-8px) rotate(180deg); opacity: 1; }' +
            '  100% { transform: translateY(0) rotate(360deg); opacity: 0.6; }' +
            '}';
        document.head.appendChild(style);
    }
})();

// 渲染安全宠物图标 — 用名称首字符替代 emoji（Android emulator 兼容）
function renderPetIcon(emoji, name, tier) {
    var tierColors = { normal:'#9e9e9e', rare:'#2196f3', epic:'#9c27b0', legend:'#ff9800', mythic:'#f44336', lucky:'#ffd700' };
    var tierEmoji = { normal:'🟢', rare:'🔵', epic:'🟣', legend:'🟠', mythic:'❤', lucky:'🍀' };
    var color = tierColors[tier] || '#888';
    var bg = tierEmoji[tier] || '🟢';
    var icon = emoji || bg;
    return '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:'+color+'22;border:1px solid '+color+';font-size:16px;line-height:1;">' + icon + '</span>';
}

// 显示宠物管理界面
function showPetScreen() {
    var container = document.getElementById('pet-container');
    if (!container) return;

    var html = '';

    // === 顶部标签栏 ===
        html += '<div style="display:flex;gap:4px;margin-bottom:10px;">';
        var tabs = [
            { id: 'lottery', label: '\ud83c\udfb0 \u62bd\u5956' },
            { id: 'mypets', label: '\ud83d\udc3e \u6211\u7684\u5ba0\u7269' },
            { id: 'eggs', label: '\ud83e\udd5a \u86cb\u4ed3\u5e93' },
            { id: 'shards', label: '\ud83d\udca0 \u788e\u7247\u4ed3\u5e93' }
        ];
        for (var ti = 0; ti < tabs.length; ti++) {
            var t = tabs[ti];
            var active = (t.id === _petCurrentTab);
            var tabBg = active ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)';
            var tabBorder = active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)';
            var tabColor = active ? '#ffd700' : '#aaa';
            if (t.id === 'lottery') {
                tabBg = active ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.06)';
                tabBorder = active ? 'rgba(255,215,0,0.6)' : 'rgba(255,215,0,0.15)';
                tabColor = active ? '#ffd700' : '#cc9900';
            }
            html += '<div style="flex:1;text-align:center;padding:8px 4px;cursor:pointer;border-radius:8px;font-size:12px;font-weight:bold;background:' + tabBg + ';border:1px solid ' + tabBorder + ';color:' + tabColor + ';" onclick="switchPetTab(\u0027' + t.id + '\u0027)">' + t.label + '</div>';
        }
        html += '</div>';

    // === 孵化槽 (在所有标签页顶部显示) ===
    html += renderIncubatorSlots();
    html += '<div style="height:8px;"></div>';

    // === 当前标签内容 ===
    if (_petCurrentTab === 'lottery') {
        html += renderPetLotteryTab();
    } else if (_petCurrentTab === 'mypets') {
        html += renderMyPetsTab();
    } else if (_petCurrentTab === 'eggs') {
        html += renderEggStorageTab();
    } else if (_petCurrentTab === 'shards') {
        html += renderShardsTab();
    }

    container.innerHTML = html;
    startPetIncubationTimer();
}

// 切换标签
function switchPetTab(tabId) {
    _petCurrentTab = tabId;
    showPetScreen();
}

// ========== 孵化槽渲染 ==========
function renderIncubatorSlots() {
    if (!GameState.get('petIncubators')) {
        GameState.set('petIncubators', []);
        var inc = GameState.get('petIncubators');
        for (var _i = 0; _i < 3; _i++) inc.push({ tier: null, hatchTime: 0 });
    }
    var now = Date.now();
    var html = '<div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.15);border-radius:10px;padding:8px 10px;">';
    html += '<div style="font-size:11px;color:#888;margin-bottom:6px;">\ud83e\udd5a \u5b75\u5316\u69fd (\u70b9\u51fb\u7a7a\u69fd\u5f00\u59cb\u5b75\u5316)</div>';
    html += '<div style="display:flex;gap:6px;">';
    for (var si = 0; si < 3; si++) {
        var slot = GameState.get('petIncubators')[si];
        html += '<div style="flex:1;text-align:center;padding:8px 4px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.1);position:relative;min-height:70px;">';
        html += '<div style="font-size:9px;color:#666;margin-bottom:4px;">\u69fd' + (si + 1) + '</div>';
        if (slot.tier && slot.hatchTime > 0) {
            var _tn={normal:'普通',rare:'稀有',epic:'史诗',legend:'传说',mythic:'神化'};var tierName=_tn[slot.tier]||slot.tier;
            if (now < slot.hatchTime) {
                var remMs = slot.hatchTime - now;
                var remMin = Math.ceil(remMs / 60000);
                var remSec = Math.ceil(remMs / 1000);
                html += '<div style="font-size:22px;">\u23f3</div>';
                html += '<div style="font-size:9px;color:#ff9800;">' + tierName + '\u86cb</div>';
                html += '<div style="font-size:10px;color:#ffd700;font-weight:bold;">' + (remMin >= 1 ? remMin + '\u5206' : remSec + '\u79d2') + '</div>';
            } else {
                html += '<div style="font-size:22px;">\u2705</div>';
                html += '<div style="font-size:9px;color:#4caf50;">' + tierName + '\u86cb</div>';
                html += '<button class="btn" style="padding:2px 8px;font-size:9px;border-color:#ffd700;color:#ffd700;margin-top:2px;" onclick="claimHatchSlot(' + si + ')">\u53ef\u9886\u53d6</button>';
            }
        } else {
            // 空槽 - 点击弹出蛋仓库选择
            html += '<div style="font-size:22px;cursor:pointer;" onclick="openEggStorageSelection(' + si + ')">➕</div>'
            html += '<div style="font-size:9px;color:#666;">\u7a7a\u69fd</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
}

// ========== 蛋类型选择弹窗 ==========

function startIncubation(slotIndex, eggTier, cost) {
    if (!GameState.get('petIncubators') || !GameState.get('petIncubators')[slotIndex]) return;
    if ((GameState.get('petEggStones') || 0) < cost) {
        showToast('\u86cb\u77f3\u4e0d\u8db3!', 'warning');
        return;
    }
    GameState.mutate('petEggStones', function(v) { return (v || 0) - cost; });

    var hatchSeconds = eggTier === 'basic' ? 30 : (eggTier === 'intermediate' ? 60 : 120);
    var hatchTime = Date.now() + hatchSeconds * 1000;

    GameState.get('petIncubators')[slotIndex] = { tier: eggTier, hatchTime: hatchTime };

    var tierName = eggTier === 'basic' ? '\u521d\u7ea7' : (eggTier === 'intermediate' ? '\u4e2d\u7ea7' : '\u7279\u7ea7');
    showToast('\ud83e\udd5a \u5f00\u59cb\u5b75\u5316' + tierName + '\u86cb! ' + hatchSeconds + '\u79d2\u540e\u5b8c\u6210', 'success');
    var modal = document.getElementById('egg-select-modal');
    if (modal) modal.remove();
    showPetScreen();
}

// 领取孵化槽
function claimHatchSlot(slotIndex) {
    var result = hatchPetEggForSlot(slotIndex);
    if (result) {
        showPetScreen();
        if (typeof updateResources === 'function') updateResources();
    }
}

// ========== 我的宠物标签 ==========
function renderMyPetsTab() {
    var html = '';

    // === 资源栏 ===
    html += '<div style="display:flex;gap:8px;margin-bottom:10px;">';
    html += '  <div style="flex:1;text-align:center;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
    html += '    <div style="font-size:20px;">\ud83e\udd5a</div>';
    html += '    <div style="font-size:11px;color:#888;">\u5ba0\u7269\u86cb\u77f3</div>';
    html += '    <div style="font-size:16px;font-weight:bold;" id="pet-egg-stone-count">' + (GameState.get('petEggStones') || 0) + '</div>';
    html += '  </div>';
    html += '  <div style="flex:1;text-align:center;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
    html += '    <div style="font-size:20px;">\ud83c\udf56</div>';
    html += '    <div style="font-size:11px;color:#888;">\u5ba0\u7269\u98df\u7269</div>';
    html += '    <div style="font-size:16px;font-weight:bold;" id="pet-food-count">' + (GameState.get('petFood') || 0) + '</div>';
    html += '  </div>';
    html += '</div>';

    // === 宠物槽位栏 ===
    var totalSlots = (typeof getAvailablePetSlots === 'function') ? getAvailablePetSlots() : 1;
    html += '<div style="text-align:center;padding:8px 10px;margin-bottom:10px;background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:8px;">';
    html += '<div style="font-size:11px;color:#888;margin-bottom:6px;">\u2694 \u5ba0\u7269\u4e0a\u9635\u4f4d (' + totalSlots + '/3)</div>';
    html += '<div style="display:flex;gap:6px;justify-content:center;">';
    for (var slotIdx = 0; slotIdx < 3; slotIdx++) {
        var slotPetId = GameState.get('activePets') && GameState.get('activePets')[slotIdx] ? GameState.get('activePets')[slotIdx] : null;
        var isSlotUnlocked = slotIdx < totalSlots;
        html += '<div style="width:80px;text-align:center;padding:6px 4px;background:' + (isSlotUnlocked ? 'rgba(255,255,255,0.05)' : 'rgba(85,85,85,0.15)') + ';border-radius:8px;border:1px solid ' + (isSlotUnlocked ? 'rgba(255,215,0,0.3)' : 'rgba(85,85,85,0.2)') + ';opacity:' + (isSlotUnlocked ? 1 : 0.4) + ';">';
        html += '  <div style="font-size:22px;">';
        if (slotPetId) {
            var sData = getPetData(slotPetId);
            html += sData ? renderPetIcon(sData.icon, sData.name, sData.tier) : renderPetIcon(null, '?', 'normal');
        } else if (isSlotUnlocked) {
            html += '\u2795';
        } else {
            html += '\ud83d\udd12';
        }
        html += '</div>';
        html += '  <div style="font-size:9px;color:' + (slotPetId ? '#4caf50' : (isSlotUnlocked ? '#888' : '#666')) + ';margin-top:2px;">';
        if (slotPetId) {
            var sd = getPetData(slotPetId);
            html += sd ? sd.name : '???';
        } else if (isSlotUnlocked) {
            html += '\u7a7a\u4f4d' + (slotIdx + 1);
        } else {
            html += '\u672a\u89e3\u9501';
        }
        html += '</div>';
        if (!isSlotUnlocked) {
            html += '  <div style="font-size:8px;color:#ff9800;margin-top:2px;">\u5929\u8d4b\u89e3\u9501</div>';
        }
        html += '</div>';
    }
    html += '</div>';

    var activeBonus = getActivePetBonusText();
    html += '<div style="font-size:13px;color:#ffd700;font-weight:bold;margin-top:6px;">' + activeBonus + '</div>';
    html += '</div>';

    // === 宠物列表 ===
    html += '<div style="font-size:13px;color:#aaa;margin-bottom:6px;">\u6211\u7684\u5ba0\u7269 (<span id="pet-own-count">' + (GameState.get("pets") ? GameState.get("pets").length : 0) + '</span>/' + PET_DATA.length + ')</div>';

    if (!GameState.get("pets") || GameState.get("pets").length === 0) {
        html += '<div style="text-align:center;padding:24px;color:#666;font-size:13px;">';
        html += '\u8fd8\u6ca1\u6709\u5ba0\u7269\uff0c\u53bb\u62bd\u5956\u673a\u62bd\u86cb\u5b75\u5316\u5427! \ud83e\udd5a';
        html += '</div>';
    } else {
        for (var i = 0; i < GameState.get("pets").length; i++) {
            html += renderPetCard(i);
        }
    }

    // === 宠物图鉴 ===
    var ownedCount = GameState.get("pets") ? GameState.get("pets").length : 0;
    html += '<div style="font-size:13px;color:#aaa;margin:12px 0 8px;">\u5ba0\u7269\u56fe\u9274 (' + ownedCount + '/' + PET_DATA.length + ')</div>';

    var tierOrder = ['normal', 'rare', 'epic', 'legend', 'mythic'];
    var tierNames = { normal:'\u666e\u901a', rare:'\u7a00\u6709', epic:'\u53f2\u8bd7', legend:'\u4f20\u8bf4', mythic:'\u795e\u5316' };
    var tierColors = { normal:'#9e9e9e', rare:'#2196f3', epic:'#9c27b0', legend:'#ff9800', mythic:'#f44336' };

    for (var ti = 0; ti < tierOrder.length; ti++) {
        var tierId = tierOrder[ti];
        var tierName = tierNames[tierId];
        var tierColor = tierColors[tierId];

        var tierPets = [];
        for (var pi = 0; pi < PET_DATA.length; pi++) {
            if (PET_DATA[pi].tier === tierId) tierPets.push(PET_DATA[pi]);
        }
        if (tierPets.length === 0) continue;

        html += '<div style="font-size:12px;font-weight:bold;color:' + tierColor + ';margin:10px 0 4px;padding:3px 0;border-bottom:1px solid ' + tierColor + '44;">';
        html += tierName + ' (' + countOwnedInTier(tierId) + '/' + tierPets.length + ')';
        html += '</div>';

        html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
        for (var pj = 0; pj < tierPets.length; pj++) {
            var pd = tierPets[pj];
            var owned = false;
            if (GameState.get("pets")) {
                for (var oi = 0; oi < GameState.get("pets").length; oi++) {
                    if (GameState.get("pets")[oi].id === pd.id) { owned = true; break; }
                }
            }
            var isActive = GameState.get("activePets") && GameState.get("activePets").indexOf(pd.id) !== -1;
            var bgColor = owned ? 'rgba(255,255,255,0.06)' : 'rgba(85,85,85,0.12)';
            var borderColor = isActive ? tierColor : (owned ? 'rgba(255,255,255,0.12)' : 'rgba(85,85,85,0.2)');
            var opacity = owned ? 1 : 0.35;

            html += '<div style="width:calc(33.33% - 4px);text-align:center;padding:8px 4px;background:' + bgColor + ';border-radius:8px;border:1px solid ' + borderColor + ';opacity:' + opacity + ';position:relative;cursor:' + (owned && !isActive ? 'pointer' : 'default') + ';"';
            if (owned && !isActive) {
                html += ' onclick="quickEquipPet(\u0027' + pd.id + '\u0027)"';
            }
            html += '>';
            html += '  <div style="font-size:24px;">' + renderPetIcon(pd.icon, pd.name, pd.tier) + '</div>';
            html += '  <div style="font-size:11px;color:' + (owned ? '#fff' : '#666') + ';margin-top:2px;">' + pd.name + '</div>';
            if (isActive) {
                html += '  <div style="font-size:10px;color:#ffd700;font-weight:bold;">\u2713 \u4e0a\u9635\u4e2d</div>';
            } else if (owned) {
                var star = (GameState.get("petStars") && GameState.get("petStars")[pd.id]) || 0;
                var starStr = '';
                for (var sti = 0; sti < star; sti++) starStr += '\u2605';
                html += '  <div style="font-size:10px;color:#4caf50;">\u5df2\u62e5\u6709' + (star > 0 ? ' ' + starStr : '') + '</div>';
            } else {
                html += '  <div style="font-size:10px;color:#666;">\ud83d\udd12 \u672a\u83b7\u5f97</div>';
            }
            html += '</div>';
        }
        html += '</div>';
    }

    return html;
}

function countOwnedInTier(tierId) {
    if (!GameState.get("pets")) return 0;
    var count = 0;
    for (var i = 0; i < GameState.get("pets").length; i++) {
        var d = getPetData(GameState.get("pets")[i].id);
        if (d && d.tier === tierId) count++;
    }
    return count;
}

// ========== 渲染单个宠物卡片 ==========
function renderPetCard(index) {
    var pet = GameState.get("pets")[index];
    if (!pet) return '';
    var data = getPetData(pet.id);
    if (!data) return '';
    var tier = getPetTier(data.tier);

    var star = (GameState.get("petStars") && GameState.get("petStars")[pet.id]) || 0;
    var shards = getPetShards(pet.id);

    var stage = getPetStage(pet.id, pet.level);
    var stageData = data.evolutionStages ? data.evolutionStages[stage] : null;
    var isActive = GameState.get("activePets") && GameState.get("activePets").indexOf(pet.id) !== -1;

    var bonus = calcPetBonus(pet.id, pet.level, star);
    var bonusText = '';
    if (bonus && bonus.stat === 'all') {
        bonusText = '\u5168\u5c5e\u6027 +' + bonus.value + '%';
    } else if (bonus) {
        var statNames = { atk: '\u653b\u51fb', def: '\u9632\u5fa1', spd: '\u901f\u5ea6', hp:'\u751f\u547d', crit: '\u66b4\u51fb', healBonus: '\u6cbb\u7597' };
        bonusText = (statNames[bonus.stat] || bonus.stat) + ' +' + bonus.value + '%';
    }

    // 星数表示
    var starStr = '';
    for (var sti = 0; sti < star; sti++) starStr += '\u2605';
    var starDisplay = star > 0 ? '<span style="color:#ffd700;font-size:11px;">' + starStr + '</span>' : '<span style="color:#666;font-size:10px;">\u26060</span>';
    var shardDisplay = '<span style="font-size:10px;color:#888;">\u788e\u7247 x' + shards + '</span>';

    var html = '<div class="pet-card" style="background:rgba(255,255,255,0.04);border:1px solid ' + (isActive ? tier.color : 'rgba(255,255,255,0.08)') + ';border-radius:10px;padding:10px;margin-bottom:8px;position:relative;">';

    var tierBadge = '<span style="font-size:9px;padding:1px 7px;border-radius:6px;background:' + tier.color + '22;border:1px solid ' + tier.color + '44;color:' + tier.color + ';font-weight:bold;">' + tier.name + '</span>';

    html += '<div style="display:flex;align-items:center;gap:10px;">';
    html += '  <div style="font-size:32px;width:40px;text-align:center;">' + renderPetIcon(data.icon, data.name, data.tier) + '</div>';
    html += '  <div style="flex:1;min-width:0;">';
    html += '    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
    html += '      <span style="font-size:14px;font-weight:bold;color:#fff;">' + data.name + '</span>';
    html += '      ' + tierBadge;
    html += '      <span style="font-size:10px;color:#888;">Lv.' + pet.level + '/' + tier.maxLv + '</span>';
    html += '    </div>';
    html += '    <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">';
    html += '      <span>' + starDisplay + '</span>';
    html += '      <span>' + shardDisplay + '</span>';
    html += '    </div>';
    html += '    <div style="font-size:11px;color:#aaa;margin-top:2px;">' + bonusText + '</div>';
    html += '  </div>';

    html += '  <div style="display:flex;flex-direction:column;gap:4px;align-items:center;">';
    if (isActive) {
        html += '    <button class="btn" style="padding:4px 10px;font-size:11px;border-color:#ff6666;color:#ff6666;" onclick="unequipPetBySlot(' + index + ')">\u5378\u4e0b</button>';
    } else {
        html += '    <button class="btn btn-gold" style="padding:4px 10px;font-size:11px;" onclick="equipPetToSlot(' + index + ')">\u88c5\u5907</button>';
    }
    if (star < 5) {
        var nextCost = getStarUpCost(star);
        var canStar = shards >= nextCost;
        html += '    <button class="btn" style="padding:2px 8px;font-size:9px;border-color:' + (canStar ? '#ffd700' : '#666') + ';color:' + (canStar ? '#ffd700' : '#666') + ';" onclick="starUpPetFromCard(' + index + ')" ' + (canStar ? '' : 'disabled') + '>\u2605\u5347\u661f (' + nextCost + '\u788e)</button>';
    } else {
        html += '    <div style="font-size:9px;color:#ffd700;font-weight:bold;">\u2605 MAX</div>';
    }
    // ★ 宠物升级按钮
    if (pet.level < tier.maxLv) {
        var foodCost = tier.foodCost || 5;
        var petFood = GameState.get('petFood') || 0;
        var canFeed = petFood >= foodCost;
        html += '    <button class="btn" style="padding:2px 8px;font-size:9px;border-color:' + (canFeed ? '#4caf50' : '#666') + ';color:' + (canFeed ? '#4caf50' : '#666') + ';" onclick="feedPetByIndex(' + index + ',' + foodCost + ')" ' + (canFeed ? '' : 'disabled') + '>\u2b06\u5347\u7ea7 (' + foodCost + '\u98df)</button>';
    }
    html += '  </div>';
    html += '</div>';

    html += '</div>';
    return html;
}

function starUpPetFromCard(index) {
    if (!GameState.get("pets") || !GameState.get("pets")[index]) return;
    var petId = GameState.get("pets")[index].id;
    if (tryStarUpPet(petId)) {
        showPetScreen();
        if (typeof updateResources === 'function') updateResources();
    }
}

// ========== 抽奖机标签 ==========

function pullEggGacha(eggTier, cost) {
    if (!GameState.get("petIncubators")) {
        GameState.set("petIncubators", []);
        for (var _i = 0; _i < 3; _i++) GameState.get("petIncubators").push({ tier: null, hatchTime: 0 });
    }

    var emptySlot = -1;
    for (var si = 0; si < 3; si++) {
        if (!GameState.get("petIncubators")[si].tier || GameState.get("petIncubators")[si].hatchTime <= 0 || (GameState.get("petIncubators")[si].hatchTime > 0 && Date.now() >= GameState.get("petIncubators")[si].hatchTime)) {
            emptySlot = si;
            break;
        }
    }
    if (emptySlot === -1) {
        showToast('\u5b75\u5316\u69fd\u5df2\u6ee1! \u5148\u9886\u53d6\u5df2\u5b8c\u6210\u5b75\u5316\u7684\u86cb', 'warning');
        return;
    }

    if ((GameState.get("petEggStones") || 0) < cost) {
        showToast('\u86cb\u77f3\u4e0d\u8db3!', 'warning');
        return;
    }

    GameState.mutate("petEggStones", function(v) { return (v||0) - cost; });

    var hatchSeconds = eggTier === 'basic' ? 30 : (eggTier === 'intermediate' ? 60 : 120);
    var hatchTime = Date.now() + hatchSeconds * 1000;
    GameState.get("petIncubators")[emptySlot] = { tier: eggTier, hatchTime: hatchTime };

    var tierName = eggTier === 'basic' ? '\u521d\u7ea7' : (eggTier === 'intermediate' ? '\u4e2d\u7ea7' : '\u7279\u7ea7');
    showToast('\ud83c\udf89 \u83b7\u5f97' + tierName + '\u86cb! \u5df2\u653e\u5165\u5b75\u5316\u69fd' + (emptySlot + 1) + '\uff0c' + hatchSeconds + '\u79d2\u540e\u5b75\u5316\u5b8c\u6210', 'success');
    showPetScreen();
}

// ========== 碎片仓库标签 ==========
function renderShardsTab() {
    var html = '';
    html += '<div style="font-size:11px;color:#888;margin-bottom:10px;">\ud83d\udca0 \u5ba0\u7269\u788e\u7247\u4ed3\u5e93 \u2014 \u91cd\u590d\u5ba0\u7269\u81ea\u52a8\u8f6c\u5316\u4e3a\u788e\u7247\uff0c\u7528\u4e8e\u5347\u661f</div>';

    if (!GameState.get("petShards") || Object.keys(GameState.get("petShards")).length === 0) {
        html += '<div style="text-align:center;padding:24px;color:#666;font-size:13px;">';
        html += '\u6682\u65e0\u788e\u7247\uff0c\u62bd\u53d6\u5230\u91cd\u590d\u5ba0\u7269\u4f1a\u81ea\u52a8\u8f6c\u5316\u3002';
        html += '</div>';
        return html;
    }

    var shardEntries = [];
    for (var pid in GameState.get("petShards")) {
        if (GameState.get("petShards").hasOwnProperty(pid) && GameState.get("petShards")[pid] > 0) {
            shardEntries.push({ petId: pid, count: GameState.get("petShards")[pid] });
        }
    }
    shardEntries.sort(function(a, b) { return b.count - a.count; });

    html += '<div style="display:flex;flex-direction:column;gap:6px;">';
    for (var si = 0; si < shardEntries.length; si++) {
        var entry = shardEntries[si];
        var data = getPetData(entry.petId);
        if (!data) continue;
        var tier = getPetTier(data.tier);

        var owned = false;
        if (GameState.get("pets")) {
            for (var pi = 0; pi < GameState.get("pets").length; pi++) {
                if (GameState.get("pets")[pi].id === entry.petId) { owned = true; break; }
            }
        }

        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;">';
        html += '<div style="font-size:24px;">' + renderPetIcon(data.icon, data.name, data.tier) + '</div>';
        html += '<div style="flex:1;">';
        html += '<div style="font-size:13px;font-weight:bold;color:#fff;">' + data.name + ' <span style="font-size:10px;color:' + tier.color + ';">[' + tier.name + ']</span></div>';
        html += '<div style="font-size:10px;color:#888;">\u91cd\u590d\u8f6c\u5316: ' + (SHARD_DUPE_AMOUNTS[data.tier] || 5) + '\u788e/\u6b21 ' + (owned ? '\u2705\u5df2\u62e5\u6709' : '\ud83d\udd12\u672a\u62e5\u6709') + '</div>';
        html += '</div>';
        html += '<div style="font-size:20px;font-weight:bold;color:#ffd700;">' + entry.count + '</div>';
        html += '</div>';
    }
    html += '</div>';

    return html;
}

// ========== 抽奖机标签 ==========
function renderPetLotteryTab() {
    var html = '';
    var stones = GameState.get('petEggStones') || 0;

    // 装饰性闪烁星星 (绝对定位, 相对于容器)
    html += '<div style="position:relative;overflow:hidden;border:2px solid #ffd700;border-radius:14px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);padding:0;margin-bottom:10px;">';

    // 金色顶部装饰条
    html += '<div style="background:linear-gradient(90deg,#b8860b,#ffd700,#ffec8b,#ffd700,#b8860b);height:3px;"></div>';

    // 标题区域
    html += '<div style="text-align:center;padding:16px 16px 8px;position:relative;">';
    html += '<div style="position:absolute;top:10px;left:12px;font-size:14px;animation:petSparkleFloat 2s ease-in-out infinite;">\u2728</div>';
    html += '<div style="position:absolute;top:10px;right:12px;font-size:14px;animation:petSparkleFloat 2s ease-in-out infinite 1s;">\u2728</div>';
    html += '<div style="font-size:22px;font-weight:bold;color:#ffd700;text-shadow:0 0 20px rgba(255,215,0,0.5);" class="pet-gold-text">\ud83c\udfb0 \u5ba0\u7269\u86cb\u62bd\u5956\u673a</div>';
    html += '<div style="font-size:11px;color:#b8860b;margin-top:4px;">\u2014 \u62bd\u53d6\u5404\u7ea7\u86cb\uff0c\u5b75\u5316\u83b7\u5f97\u5ba0\u7269 \u2014</div>';
    html += '</div>';

    // 蛋石计数 - 金色药丸
    html += '<div style="text-align:center;margin:6px 0 14px;">';
    html += '<div style="display:inline-block;background:linear-gradient(135deg,#b8860b,#8b6914);border:1px solid #ffd700;border-radius:20px;padding:6px 20px;box-shadow:0 0 15px rgba(255,215,0,0.3);">';
    html += '<span style="font-size:13px;color:#fff;font-weight:bold;">\ud83e\udd5a \u5ba0\u7269\u86cb\u77f3: </span>';
    html += '<span style="font-size:18px;color:#ffd700;font-weight:bold;">' + stones + '</span>';
    html += '</div>';
    html += '</div>';

    // 两个抽奖按钮并排 (普通 / 高级)
    html += '<div style="display:flex;gap:10px;padding:0 14px;margin-bottom:14px;">';
    html += renderPetLotteryDrawCard('normal');
    html += renderPetLotteryDrawCard('advanced');
    html += '</div>';

    // 奖池预览
    html += '<div style="padding:0 14px;margin-bottom:10px;">';
    html += renderPetLotteryTabRates();
    html += '</div>';

    // 抽奖记录
    html += '<div style="padding:0 14px 14px;">';
    html += renderPetLotteryTabHistory();
    html += '</div>';

    // 底部金色装饰条
    html += '<div style="background:linear-gradient(90deg,#b8860b,#ffd700,#ffec8b,#ffd700,#b8860b);height:3px;"></div>';

    html += '</div>'; // 外层容器结束

    // 提示：点击调用的 openPetLotteryScreen 会打开全屏弹窗，提供更多操作选项
    html += '<div style="text-align:center;margin-top:4px;">';
    html += '<span style="font-size:10px;color:#666;cursor:pointer;" onclick="openPetLotteryScreen()">\ud83d\udd17 \u6253\u5f00\u62bd\u5956\u8be6\u60c5\u7a97\u53e3</span>';
    html += '</div>';

    return html;
}

// 渲染单个抽奖卡 (普通/高级)
function renderPetLotteryDrawCard(tierType) {
    var cfg = PET_LOTTERY_CONFIG[tierType];
    if (!cfg) return '';
    var stones = GameState.get('petEggStones') || 0;
    var canSingle = stones >= cfg.costPerDraw;
    var canTen = stones >= cfg.costPerTenDraw;

    var accentColor = tierType === 'normal' ? '#4caf50' : '#ff9800';
    var gradientBg = tierType === 'normal' ? 'linear-gradient(135deg,rgba(76,175,80,0.12),rgba(76,175,80,0.04))' : 'linear-gradient(135deg,rgba(255,152,0,0.12),rgba(255,152,0,0.04))';
    var borderColor = tierType === 'normal' ? 'rgba(76,175,80,0.4)' : 'rgba(255,152,0,0.4)';
    var icon = tierType === 'normal' ? '\ud83e\udd5a' : '\ud83d\udd2e';

    var html = '<div style="flex:1;text-align:center;background:' + gradientBg + ';border:1px solid ' + borderColor + ';border-radius:12px;padding:14px 10px;">';
    html += '<div style="font-size:28px;margin-bottom:4px;">' + icon + '</div>';
    html += '<div style="font-size:15px;font-weight:bold;color:' + accentColor + ';margin-bottom:2px;">' + cfg.name + '</div>';
    html += '<div style="font-size:10px;color:#888;margin-bottom:8px;">';
    if (tierType === 'advanced') {
        html += '\ud83d\udcaa \u5341\u8fde\u4fdd\u5e95\u22651\u4f20\u8bf4';
    } else {
        html += '\ud83c\udfb2 \u7ecf\u5178\u62bd\u86cb';
    }
    html += '</div>';
    html += '<div style="font-size:11px;color:#aaa;margin-bottom:10px;">';
    html += '\u5355\u62bd <span style="color:' + accentColor + ';font-weight:bold;">' + cfg.costPerDraw + ' \ud83e\udd5a</span>';
    html += ' \u00b7 ';
    html += '\u5341\u8fde <span style="color:' + accentColor + ';font-weight:bold;">' + cfg.costPerTenDraw + ' \ud83e\udd5a</span>';
    html += '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:4px;">';
    html += '<button class="btn" style="width:100%;padding:7px 4px;font-size:12px;font-weight:bold;border-color:' + accentColor + ';color:' + accentColor + ';' + (canSingle ? '' : 'opacity:0.4;') + '" ' + (canSingle ? 'onclick="doPetLottery(\u0027' + tierType + '\u0027,false)"' : 'disabled') + '>\ud83c\udfaf \u5355\u62bd</button>';
    html += '<button class="btn btn-gold" style="width:100%;padding:7px 4px;font-size:12px;font-weight:bold;' + (canTen ? '' : 'opacity:0.4;') + '" ' + (canTen ? 'onclick="doPetLottery(\u0027' + tierType + '\u0027,true)"' : 'disabled') + '>\ud83c\udf89 \u5341\u8fde\u62bd</button>';
    html += '</div>';
    html += '</div>';
    return html;
}

// 抽奖标签内的奖池预览
function renderPetLotteryTabRates() {
    var html = '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.15);border-radius:10px;padding:10px 12px;">';
    html += '<div style="font-size:12px;font-weight:bold;color:#ffd700;margin-bottom:8px;">\ud83d\udcca \u62bd\u5956\u6982\u7387</div>';

    var tierKeys = ['normal', 'advanced'];
    for (var ti = 0; ti < tierKeys.length; ti++) {
        var cfg = PET_LOTTERY_CONFIG[tierKeys[ti]];
        if (!cfg) continue;
        var totalWeight = 0;
        for (var w = 0; w < cfg.pool.length; w++) totalWeight += cfg.pool[w].weight;
        var accent = tierKeys[ti] === 'normal' ? '#4caf50' : '#ff9800';

        html += '<div style="margin-bottom:6px;">';
        html += '<div style="font-size:11px;font-weight:bold;color:' + accent + ';margin-bottom:3px;">' + cfg.name + '</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:3px;">';
        for (var j = 0; j < cfg.pool.length; j++) {
            var p = cfg.pool[j];
            var pct = Math.round(p.weight / totalWeight * 100);
            var color = p.type === 'egg' ? getPetTier(p.tier).color : '#888';
            var bgColor = p.type === 'egg' ? color + '22' : 'rgba(255,255,255,0.05)';
            html += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:' + bgColor + ';border:1px solid ' + color + '33;color:' + color + ';">' + p.name + ' ' + pct + '%</span>';
        }
        html += '</div>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// 抽奖标签内的最近记录
function renderPetLotteryTabHistory() {
    var history = (gameState && gameState.petLotteryHistory) || [];
    var html = '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.15);border-radius:10px;padding:10px 12px;">';
    html += '<div style="font-size:12px;font-weight:bold;color:#ffd700;margin-bottom:6px;">\ud83d\udcdc \u6700\u8fd1\u62bd\u53d6\u8bb0\u5f55</div>';

    if (history.length === 0) {
        html += '<div style="font-size:11px;color:#555;text-align:center;padding:8px;">\u6682\u65e0\u62bd\u5956\u8bb0\u5f55\uff0c\u5feb\u6765\u62bd\u4e00\u628a! \ud83c\udfb0</div>';
        html += '</div>';
        return html;
    }

    var maxShow = Math.min(8, history.length);
    for (var i = 0; i < maxShow; i++) {
        var h = history[i];
        if (!h) continue;
        var bgStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 6px;font-size:10px;border-radius:4px;background:' + bgStyle + ';">';
        if (h.type === 'egg') {
            var tc = getPetTier(h.tier).color;
            html += '<span style="font-size:14px;">\ud83e\udd5a</span>';
            html += '<span style="color:' + tc + ';font-weight:bold;">' + h.name + '</span>';
            html += '<span style="margin-left:auto;font-size:9px;color:' + tc + ';">[' + getPetTier(h.tier).name + ']</span>';
        } else if (h.type === 'gold') {
            html += '<span style="font-size:14px;">\ud83d\udcb0</span>';
            html += '<span style="color:#ffd700;">' + h.name + '</span>';
            html += '<span style="margin-left:auto;font-size:9px;color:#888;">\u76f4\u63a5\u83b7\u5f97</span>';
        } else if (h.type === 'dust') {
            html += '<span style="font-size:14px;">\u2728</span>';
            html += '<span style="color:#b388ff;">' + h.name + '</span>';
            html += '<span style="margin-left:auto;font-size:9px;color:#888;">\u76f4\u63a5\u83b7\u5f97</span>';
        } else {
            html += '<span style="color:#888;">' + (h.name || '???') + '</span>';
        }
        html += '</div>';
    }

    if (history.length > maxShow) {
        html += '<div style="text-align:center;font-size:9px;color:#666;margin-top:4px;">\u2026 \u5171' + history.length + '\u6761\u8bb0\u5f55</div>';
    }

    html += '</div>';
    return html;
}

// ========== 蛋仓库标签 ==========
var EGG_TIER_NAMES = { normal: '\u666e\u901a', rare: '\u7a00\u6709', epic: '\u53f2\u8bd7', legend: '\u4f20\u8bf4', mythic: '\u795e\u5316' };
var EGG_TIER_COLORS = { normal: '#9e9e9e', rare: '#2196f3', epic: '#9c27b0', legend: '#ff9800', mythic: '#f44336' };
var EGG_TIER_ORDER = ['normal', 'rare', 'epic', 'legend', 'mythic'];

function renderEggStorageTab() {
    var html = '';
    // 蛋石资源 + 抽奖入口
    html += '<div style="display:flex;gap:8px;margin-bottom:10px;">';
    html += '  <div style="flex:1;text-align:center;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
    html += '    <div style="font-size:20px;">\ud83e\udd5a</div>';
    html += '    <div style="font-size:11px;color:#888;">\u5ba0\u7269\u86cb\u77f3</div>';
    html += '    <div style="font-size:16px;font-weight:bold;">' + (GameState.get('petEggStones') || 0) + '</div>';
    html += '  </div>';
    html += '  <div style="flex:1;text-align:center;padding:8px;background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:8px;cursor:pointer;position:relative;overflow:hidden;" onclick="switchPetTab(\u0027lottery\u0027)" class="pet-glow-btn">' +
    '    <div style="font-size:20px;position:relative;z-index:1;">\ud83c\udfb0</div>' +
    '    <div style="font-size:11px;color:#ffd700;font-weight:bold;position:relative;z-index:1;">\u8fdb\u5165\u62bd\u5956</div>' +
    '    <div style="position:absolute;top:-5px;right:2px;font-size:10px;opacity:0.5;animation:petSparkleFloat 1.5s ease-in-out infinite;">\u2b50</div>' +
    '    <div style="position:absolute;bottom:2px;left:5px;font-size:8px;opacity:0.4;animation:petSparkleFloat 2.5s ease-in-out infinite 0.5s;">\u2728</div>' +
    '  </div>'
    html += '</div>';

    var storage = GameState.get('petEggStorage');
    if (!storage || storage.length === 0) {
        html += '<div style="text-align:center;padding:24px;color:#666;font-size:13px;">';
        html += '\u86cb\u4ed3\u5e93\u4e3a\u7a7a\uff0c\u53bb\u62bd\u5956\u673a\u62bd\u53d6\u86cb\u5427! \ud83c\udfb0';
        html += '</div>';
        return html;
    }

    html += '<div style="font-size:13px;color:#aaa;margin-bottom:8px;">\ud83e\udd5a \u86cb\u4ed3\u5e93 (\u5171 ' + getTotalEggCount(storage) + '\u4e2a)</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px;">';

    for (var oi = 0; oi < EGG_TIER_ORDER.length; oi++) {
        var tierId = EGG_TIER_ORDER[oi];
        var found = null;
        for (var si = 0; si < storage.length; si++) {
            if (storage[si].tier === tierId) {
                found = storage[si];
                break;
            }
        }
        if (!found || found.count <= 0) continue;

        var tierColor = EGG_TIER_COLORS[tierId];
        var tierName = EGG_TIER_NAMES[tierId];
        var hatchMin = PET_TIERS[tierId] ? PET_TIERS[tierId].hatchMin : 10;

        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid ' + tierColor + '44;border-radius:8px;">';
        html += '<div style="font-size:28px;">\ud83e\udd5a</div>';
        html += '<div style="flex:1;">';
        html += '<div style="font-size:14px;font-weight:bold;color:' + tierColor + ';">' + tierName + '\u86cb</div>';
        html += '<div style="font-size:10px;color:#888;">\u5b75\u5316\u65f6\u95f4: ' + hatchMin + '\u5206\u949f</div>';
        html += '</div>';
        html += '<div style="font-size:22px;font-weight:bold;color:#ffd700;margin-right:8px;">x' + found.count + '</div>';
        html += '<button class="btn btn-gold" style="padding:6px 12px;font-size:11px;" onclick="selectEggFromStorage(\u0027' + tierId + '\u0027)">\u653e\u5165\u5b75\u5316</button>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function getTotalEggCount(storage) {
    var total = 0;
    if (!storage) return 0;
    for (var i = 0; i < storage.length; i++) {
        total += storage[i].count || 0;
    }
    return total;
}

// 点击蛋仓库的"放入孵化"按钮 - 找空槽直接孵化
function selectEggFromStorage(tier) {
    if (!gameState) return;
    var incs = GameState.get('petIncubators');
    if (!incs) {
        showToast('\u5b75\u5316\u69fd\u672a\u521d\u59cb\u5316', 'error');
        return;
    }
    // 找空槽
    var emptySlot = -1;
    for (var si = 0; si < incs.length; si++) {
        if (!incs[si].tier || (incs[si].hatchTime > 0 && Date.now() >= incs[si].hatchTime)) {
            // 已完成的不能覆盖
            if (incs[si].hatchTime > 0 && Date.now() >= incs[si].hatchTime) continue;
            if (!incs[si].tier || incs[si].hatchTime <= 0) {
                emptySlot = si;
                break;
            }
        }
    }
    if (emptySlot === -1) {
        showToast('\u5b75\u5316\u69fd\u5df2\u6ee1! \u8bf7\u5148\u9886\u53d6\u5df2\u5b75\u5316\u5b8c\u6210\u7684\u5ba0\u7269', 'warning');
        return;
    }

    // 从蛋仓库扣除
    var storage = GameState.get('petEggStorage');
    var foundIdx = -1;
    for (var fi = 0; fi < storage.length; fi++) {
        if (storage[fi].tier === tier) {
            storage[fi].count = (storage[fi].count || 0) - 1;
            if (storage[fi].count <= 0) {
                foundIdx = fi;
            }
            break;
        }
    }
    if (foundIdx >= 0) {
        storage.splice(foundIdx, 1);
    }

    // 放入孵化槽
    var hatchMin = 30;
    if (PET_TIERS[tier]) {
        hatchMin = PET_TIERS[tier].hatchMin;
    }
    incs[emptySlot] = { tier: tier, hatchTime: Date.now() + hatchMin * 60 * 1000 };

    var tierName = EGG_TIER_NAMES[tier] || tier;
    showToast('\ud83e\udd5a \u5df2\u5c06' + tierName + '\u86cb\u653e\u5165\u5b75\u5316\u69fd' + (emptySlot + 1) + '! ' + hatchMin + '\u5206\u949f\u540e\u5b8c\u6210', 'success');

    // 关闭可能存在的选择弹窗
    var modal = document.getElementById('egg-storage-modal');
    if (modal) modal.remove();
    showPetScreen();
    if (typeof updateResources === 'function') updateResources();
}

// ========== 点击孵化槽空槽时弹出的蛋仓库选择弹窗 ==========
function openEggStorageSelection(slotIndex) {
    if (!gameState) return;
    var storage = GameState.get('petEggStorage');
    if (!storage || storage.length === 0 || getTotalEggCount(storage) === 0) {
        showToast('\u86cb\u4ed3\u5e93\u4e3a\u7a7a\uff0c\u8bf7\u5148\u53bb\u62bd\u5956!', 'warning');
        return;
    }

    var html = '<div class="modal-overlay" id="egg-storage-modal" onclick="if(event.target===this)closeEggStorageModal()">' +
        '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:380px;background:linear-gradient(135deg,#1a1a2e,#0f0f1e);border:2px solid #ff9800;border-radius:14px;padding:0;overflow:hidden;position:relative;">' +
        '<div style="background:linear-gradient(135deg,#e65100,#bf360c);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-size:15px;font-weight:bold;color:#fff;">\u{1F95A} 选择蛋放入孵化槽' + (slotIndex + 1) + '</div>' +
        '<div style="font-size:11px;color:#ffd700;background:rgba(0,0,0,0.3);padding:3px 10px;border-radius:10px;cursor:pointer;" onclick="closeEggStorageModal()">\u2716</div>' +
        '<span style="position:absolute;top:8px;right:10px;font-size:18px;color:rgba(255,255,255,0.6);cursor:pointer;z-index:10;" onclick="closeEggStorageModal()">✕</span>' +
        '</div>' +
        '<div style="padding:14px;">';

    var hasItems = false;
    for (var oi = 0; oi < EGG_TIER_ORDER.length; oi++) {
        var tierId = EGG_TIER_ORDER[oi];
        var found = null;
        for (var si = 0; si < storage.length; si++) {
            if (storage[si].tier === tierId) {
                found = storage[si];
                break;
            }
        }
        if (!found || found.count <= 0) continue;
        hasItems = true;

        var tierColor = EGG_TIER_COLORS[tierId];
        var tierName = EGG_TIER_NAMES[tierId];
        var hatchMin = PET_TIERS[tierId] ? PET_TIERS[tierId].hatchMin : 10;

        html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:6px;background:rgba(255,255,255,0.04);border:1px solid ' + tierColor + '44;border-radius:8px;">';
        html += '<div style="font-size:24px;">\ud83e\udd5a</div>';
        html += '<div style="flex:1;">';
        html += '<div style="font-size:13px;font-weight:bold;color:' + tierColor + ';">' + tierName + '\u86cb</div>';
        html += '<div style="font-size:9px;color:#888;">' + hatchMin + '\u5206\u949f</div>';
        html += '</div>';
        html += '<div style="font-size:18px;font-weight:bold;color:#ffd700;margin-right:6px;">x' + found.count + '</div>';
        html += '<button class="btn btn-gold" style="padding:5px 10px;font-size:11px;" onclick="startIncubationFromStorage(' + slotIndex + ',\u0027' + tierId + '\u0027)">\u653e\u5165</button>';
        html += '</div>';
    }

    if (!hasItems) {
        html += '<div style="text-align:center;padding:16px;color:#666;font-size:12px;">\u86cb\u4ed3\u5e93\u4e3a\u7a7a</div>';
    }

    html += '</div>' +
        '<div style="padding:8px 14px 12px;text-align:center;">' +
        '<button class="btn" style="width:100%;border-color:#888;color:#888;" onclick="closeEggStorageModal()">\u5173\u95ed</button>' +
        '</div>' +
        '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

function closeEggStorageModal() {
    var m = document.getElementById('egg-storage-modal');
    if (m) m.remove();
}

function startIncubationFromStorage(slotIndex, tier) {
    if (!gameState) return;
    var incs = GameState.get('petIncubators');
    if (!incs || !incs[slotIndex]) {
        showToast('\u5b75\u5316\u69fd\u4e0d\u5b58\u5728', 'error');
        return;
    }

    // 从蛋仓库扣除
    var storage = GameState.get('petEggStorage');
    var foundIdx = -1;
    for (var fi = 0; fi < storage.length; fi++) {
        if (storage[fi].tier === tier) {
            storage[fi].count = (storage[fi].count || 0) - 1;
            if (storage[fi].count <= 0) {
                foundIdx = fi;
            }
            break;
        }
    }
    if (foundIdx >= 0) {
        storage.splice(foundIdx, 1);
    }

    // 放入孵化槽
    var hatchMin = PET_TIERS[tier] ? PET_TIERS[tier].hatchMin : 30;
    incs[slotIndex] = { tier: tier, hatchTime: Date.now() + hatchMin * 60 * 1000 };

    var tierName = EGG_TIER_NAMES[tier] || tier;
    showToast('\ud83e\udd5a ' + tierName + '\u86cb\u5df2\u653e\u5165\u5b75\u5316\u69fd' + (slotIndex + 1) + '! ' + hatchMin + '\u5206\u949f\u540e\u5b8c\u6210', 'success');

    closeEggStorageModal();
    showPetScreen();
    if (typeof updateResources === 'function') updateResources();
}

// ========== 旧兼容函数 ==========
function equipPetToSlot(index) {
    if (!gameState || !GameState.get("pets") || !GameState.get("pets")[index]) {
        showToast('\u5ba0\u7269\u4e0d\u5b58\u5728', 'error');
        return;
    }
    var petId = GameState.get("pets")[index].id;
    if (GameState.get("activePets") && GameState.get("activePets").indexOf(petId) !== -1) {
        showToast('\u8be5\u5ba0\u7269\u5df2\u4e0a\u9635', 'info');
        return;
    }
    var totalSlots = getAvailablePetSlots ? getAvailablePetSlots() : 1;
    if (!GameState.get("activePets")) GameState.set("activePets", []);
    var equipped = false;
    for (var si = 0; si < totalSlots; si++) {
        if (!GameState.get("activePets")[si]) {
            GameState.get("activePets")[si] = petId;
            equipped = true;
            break;
        }
    }
    if (!equipped) {
        showToast('\u5ba0\u7269\u4e0a\u9635\u4f4d\u5df2\u6ee1! (\u5f53\u524d ' + totalSlots + '/3)', 'warning');
        return;
    }
    showToast('\u5df2\u4e0a\u9635 ' + getPetData(petId).name, 'success');
    showPetScreen();
}

function unequipPetBySlot(index) {
    if (!gameState || !GameState.get("pets") || !GameState.get("pets")[index]) return;
    var petId = GameState.get("pets")[index].id;
    if (!GameState.get("activePets")) return;
    for (var si = 0; si < GameState.get("activePets").length; si++) {
        if (GameState.get("activePets")[si] === petId) {
            GameState.get("activePets")[si] = null;
            showToast('\u5df2\u5378\u4e0b\u5ba0\u7269', 'info');
            showPetScreen();
            return;
        }
    }
}

function quickEquipPet(petId) {
    if (!gameState || !petId) return;
    if (GameState.get("activePets") && GameState.get("activePets").indexOf(petId) !== -1) {
        showToast('\u8be5\u5ba0\u7269\u5df2\u4e0a\u9635', 'info');
        return;
    }
    var totalSlots = getAvailablePetSlots ? getAvailablePetSlots() : 1;
    if (!GameState.get("activePets")) GameState.set("activePets", []);
    var equipped = false;
    for (var si = 0; si < totalSlots; si++) {
        if (!GameState.get("activePets")[si]) {
            GameState.get("activePets")[si] = petId;
            equipped = true;
            break;
        }
    }
    if (!equipped) {
        showToast('\u5ba0\u7269\u4e0a\u9635\u4f4d\u5df2\u6ee1! (\u5f53\u524d ' + totalSlots + '/3)', 'warning');
        return;
    }
    var d = getPetData(petId);
    showToast('\u5df2\u4e0a\u9635 ' + (d ? d.name : petId), 'success');
    showPetScreen();
}

function feedPetByIndex(index, amount) {
    if (feedPet(index, amount)) {
        showPetScreen();
        if (typeof updateResources === 'function') updateResources();
    }
}

function updatePetResources() {
    var stoneEl = document.getElementById('pet-egg-stone-count');
    if (stoneEl) stoneEl.textContent = GameState.get("petEggStones") || 0;
    var foodEl = document.getElementById('pet-food-count');
    if (foodEl) foodEl.textContent = GameState.get("petFood") || 0;
    var countEl = document.getElementById('pet-own-count');
    if (countEl && GameState.get("pets")) countEl.textContent = GameState.get("pets").length;
}

// ========== 孵化倒计时定时器 ==========
var _petIncubationTimer = null;

function startPetIncubationTimer() {
    if (_petIncubationTimer) return;
    _petIncubationTimer = setInterval(function() {
        var container = document.getElementById('pet-container');
        if (!container || container.style.display === 'none') return;

        var now = Date.now();
        var needRefresh = false;
        if (gameState && GameState.get("petIncubators")) {
            for (var si = 0; si < GameState.get("petIncubators").length; si++) {
                var slot = GameState.get("petIncubators")[si];
                if (slot.tier && slot.hatchTime > 0) {
                    needRefresh = true;
                }
            }
        }
        if (needRefresh) {
            showPetScreen();
        }
    }, 1000);
}

function stopPetIncubationTimer() {
    if (_petIncubationTimer) {
        clearInterval(_petIncubationTimer);
        _petIncubationTimer = null;
    }
}
