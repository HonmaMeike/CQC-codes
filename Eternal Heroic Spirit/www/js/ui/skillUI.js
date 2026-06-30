/* global GameState */
// ========== 技能升级UI ==========

// 技能最大等级
var SKILL_MAX_LEVEL = 20;

// 刷新技能UI（v5.1：主动/被动分栏显示）
function refreshSkillUI() {
    var hero = selectedHeroForDetail;
    if (!hero) return;
    var cls = getClassData(hero.classId);
    if (!cls) return;

    var html = '';
    var totalSpent = 0;
    var skills = cls.skills || [];
    // ★ BUG#7b 修复：技能加点栏顶部加职业名称标题，让玩家清楚看到是哪个职业的技能列表
    html += '<div class="skill-class-header" style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:6px;background:linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04));border:1px solid rgba(255,215,0,0.25);border-radius:6px;">';
    html += '  <div style="font-size:20px;line-height:1;">' + (cls.icon || '⚔') + '</div>';
    html += '  <div style="flex:1;">';
    html += '    <div style="font-size:14px;font-weight:bold;color:#ffd700;">' + cls.name + ' · 技能</div>';
    html += '    <div style="font-size:11px;color:#888;margin-top:2px;">' + (cls.desc || '') + '</div>';
    html += '  </div>';
    html += '</div>';

    // 分离主动和被动技能
    var activeSkills = [];
    var passiveSkills = [];
    for (var si = 0; si < skills.length; si++) {
        var skillId = skills[si];
        var skillData = SKILL_DATA[skillId];
        if (!skillData) continue;
        if (skillData.type === 'passive') {
            passiveSkills.push({ id: skillId, data: skillData });
        } else {
            activeSkills.push({ id: skillId, data: skillData });
        }
    }

    // ===== 渲染主动技能 =====
    html += '<div style="margin-bottom:8px;">';
    html += '  <div style="font-size:12px;font-weight:bold;color:#ff7043;margin-bottom:4px;padding:4px 0;border-bottom:1px solid rgba(255,112,67,0.3);">⚔ 主动技能</div>';
    for (var ai = 0; ai < activeSkills.length; ai++) {
        var sl = (hero.skillLevels && hero.skillLevels[activeSkills[ai].id]) || 0;
        totalSpent += sl;
        html += renderSkillRow(hero, cls, activeSkills[ai].id, activeSkills[ai].data, sl, false);
    }
    if (activeSkills.length === 0) {
        html += '<div style="padding:8px;text-align:center;color:#555;font-size:11px;background:rgba(0,0,0,0.15);border-radius:6px;">该职业暂无主动技能</div>';
    }
    html += '</div>';

    // ===== 渲染被动技能 =====
    html += '<div style="margin-bottom:8px;">';
    html += '  <div style="font-size:12px;font-weight:bold;color:#64b5f6;margin-bottom:4px;padding:4px 0;border-bottom:1px solid rgba(100,181,246,0.3);">🛡 被动技能</div>';
    for (var pi = 0; pi < passiveSkills.length; pi++) {
        var sl2 = (hero.skillLevels && hero.skillLevels[passiveSkills[pi].id]) || 0;
        totalSpent += sl2;
        html += renderSkillRow(hero, cls, passiveSkills[pi].id, passiveSkills[pi].data, sl2, true);
    }
    if (passiveSkills.length === 0) {
        html += '<div style="padding:8px;text-align:center;color:#555;font-size:11px;background:rgba(0,0,0,0.15);border-radius:6px;">该职业暂无被动技能</div>';
    }
    html += '</div>';

    // 技能点退回按钮
    if (totalSpent > 0) {
        html += '<div style="text-align:center;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">';
        html += '  <div style="font-size:11px;color:#888;margin-bottom:6px;">已投入 ' + totalSpent + ' 点技能点</div>';
        html += '  <button class="btn" style="padding:6px 16px;font-size:12px;border-color:#e040fb;color:#e040fb;" onclick="resetSkillPoints(\'' + hero.id + '\')">↻ 退回所有技能点</button>';
        html += '</div>';
    }

    document.getElementById('hero-skills').innerHTML = html;
}

// 渲染单个技能行
function renderSkillRow(hero, cls, skillId, skillData, sl, isPassive) {
    var maxLv = SKILL_MAX_LEVEL;
    var multBonus = (sl * 0.1).toFixed(1);
    
    // 技能图标色系
    var iconColor = isPassive ? '#64b5f6' : '#ff7043';
    var glowColor = isPassive ? 'rgba(100,181,246,0.3)' : 'rgba(255,112,67,0.3)';
    var bgGrad = isPassive ? 'rgba(25,118,210,0.08)' : 'rgba(230,74,25,0.08)';
    
    // MP cost for active skills
    var mpCost = (!isPassive && skillData.mpCost) ? '<span style="font-size:10px;color:#4fc3f7;background:rgba(79,195,247,0.12);padding:1px 6px;border-radius:4px;margin-left:4px;">🔮 ' + skillData.mpCost + 'MP</span>' : '';
    
    var html = '<div class="skill-row" data-skill-id="' + skillId + '" style="margin-bottom:3px;">';
    html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:10px;background:linear-gradient(135deg,' + bgGrad + ',rgba(0,0,0,0.2));border-radius:10px;border:1px solid rgba(255,255,255,0.06);position:relative;overflow:hidden;">';
    
    // Glow dot
    html += '<div style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;background:radial-gradient(' + glowColor + ',transparent 70%);pointer-events:none;"></div>';
    
    // Skill icon with ring
    html += '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,' + iconColor + '22,' + iconColor + '08);border:2px solid ' + iconColor + '44;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;position:relative;z-index:1;">';
    html += '<span>' + (skillData.icon || (isPassive ? '🛡' : '⚔')) + '</span></div>';
    
    // Info
    html += '<div style="flex:1;min-width:0;position:relative;z-index:1;">';
    html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">';
    html += '<span style="color:#ffd700;font-weight:bold;font-size:11px;">' + cls.name + '·</span>';
    html += '<span style="font-size:13px;font-weight:bold;color:#fff;">' + skillData.name + '</span>';
    html += '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:' + iconColor + '15;color:' + iconColor + ';border:1px solid ' + iconColor + '44;">' + (isPassive ? '被动' : '主动') + '</span>';
    html += mpCost;
    html += '</div>';
    
    html += '<div style="font-size:11px;color:#999;margin-bottom:4px;">' + skillData.desc + '</div>';
    
    // Level + stats
    html += '<div style="font-size:10px;color:#777;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
    html += '<span style="font-size:11px;font-weight:bold;color:#ffd700;background:rgba(255,215,0,0.12);padding:2px 8px;border-radius:6px;border:1px solid rgba(255,215,0,0.2);">Lv.' + sl + '/' + maxLv + '</span>';
    
    if (!isPassive) {
        html += '<span>倍率:' + (skillData.multiplier || 1) + '+' + multBonus + '</span>';
        html += '<span>CD:' + Math.max(0.5, (skillData.cd || 0) - sl * 0.1).toFixed(1) + 's</span>';
    } else {
        html += _formatPassiveEffect(skillData, sl);
    }
    html += '</div></div>';
    
    // Upgrade button
    if (sl < maxLv) {
        var sp = hero.skillPoints || 0;
        if (sp > 0) {
            html += '<button onclick="upgradeSkill(\'' + hero.id + '\',\'' + skillId + '\')" style="flex-shrink:0;width:36px;height:36px;border-radius:50%;border:2px solid #ffd700;background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,152,0,0.1));color:#ffd700;font-size:20px;font-weight:bold;cursor:pointer;position:relative;z-index:1;box-shadow:0 0 8px rgba(255,215,0,0.2);">+</button>';
        } else {
            html += '<button disabled style="flex-shrink:0;width:36px;height:36px;border-radius:50%;border:2px solid #444;background:rgba(0,0,0,0.2);color:#444;font-size:20px;font-weight:bold;position:relative;z-index:1;">+</button>';
        }
    } else {
        html += '<span style="flex-shrink:0;font-size:10px;color:#4caf50;font-weight:bold;padding:6px 10px;border:1px solid #4caf50;border-radius:6px;background:rgba(76,175,80,0.1);position:relative;z-index:1;">MAX</span>';
    }
    
    html += '</div></div>';
    return html;
}


// 格式化被动技能的实际加成效果（v3.5.0 显示每级增量）
function _formatPassiveEffect(skill, sl) {
    if (!skill) return '被动技能 - 自动生效';
    var parts = [];
    // 每级缩放：与 Formulas.applyPassiveBonus 一致
    var scale = sl > 0 ? (1 + (sl - 1) * 0.1) : 1;
    var nextScale = 1 + sl * 0.1;  // 下一级缩放
    function addPct(val, label, isPct) {
        if (!val) return;
        var cur = Math.round(val * scale * 100);
        var inc = Math.round(val * 0.1 * 100);  // 每级增量（基础值的10%）
        if (isPct) { cur = Math.round(val * scale); inc = Math.round(val * 0.1); }
        parts.push(label + ' +' + cur + '% (+' + inc + '%/级)');
    }
    function addFlat(val, label) {
        if (!val) return;
        var cur = Math.round(val * scale);
        var inc = Math.round(val * 0.1);
        parts.push(label + ' +' + cur + ' (+' + inc + '/级)');
    }
    // 减伤/回蓝（特殊，不按级缩放但仍展示）
    if (skill.dmgReduction) parts.push('减伤 +' + Math.round(skill.dmgReduction * 100) + '%');
    if (skill.dmgToMana) parts.push('回蓝 +' + Math.round(skill.dmgToMana * 100) + '%');
    if (skill.regenPct) parts.push('每秒回血 +' + Math.round(skill.regenPct * 100) + '%');
    // 百分比属性加成（按级缩放）
    addPct(skill.defBonusPct, '防御');
    addPct(skill.atkBonusPct, '攻击');
    addPct(skill.hpBonusPct, '生命');
    addPct(skill.spdBonusPct, '速度');
    addPct(skill.mpBonusPct, '法力');
    // 平值属性（按级缩放）
    addFlat(skill.critBonusPct, '暴击');
    addFlat(skill.critDmgBonus, '爆伤');
    // 特殊效果
    addPct(skill.healBonusPct, '治疗');
    addPct(skill.summonAtkBonus, '召唤攻');
    addPct(skill.summonHpBonus, '召唤命');
    addPct(skill.shadowDmgBonus, '暗影伤害');
    // 战士狂怒
    if (skill.berserkAtk) parts.push('HP<' + Math.round((skill.berserkHp||0.3)*100) + '%时攻+' + Math.round(skill.berserkAtk*100) + '%');
    // 剑客绝命一击
    if (skill.finalCritDmg) parts.push('HP<' + Math.round((skill.finalHp||0.2)*100) + '%时爆伤+' + Math.round(skill.finalCritDmg*100) + '%');
    // 默认fallback
    if (parts.length === 0) return '被动技能 - 自动生效';
    return parts.join(' ');
}
// 升级技能
function upgradeSkill(heroId, skillId) {
    // ★ HOME_3.3: 战斗锁定检查（skillUI 升级技能入口）
    if (typeof _checkInBattle === 'function' && !_checkInBattle('升级技能')) return;
    var hero=null;if(typeof HeroView !== 'undefined' && HeroView.byId){hero=HeroView.byId(heroId);}if(!hero){var _es5_123=GameState.get('heroes')||[];for(var _es5_124=0;_es5_124<_es5_123.length;_es5_124++){if(_es5_123[_es5_124].id===heroId){hero=_es5_123[_es5_124];break;}}}
    if (!hero) return;
    if (!hero.skillLevels) hero.skillLevels = {};
    var currentLv = hero.skillLevels[skillId] || 0;
    if (currentLv >= SKILL_MAX_LEVEL) { showToast('技能已达最高等级', 'warning'); return; }
    if ((hero.skillPoints || 0) < 1) { showToast('技能点不足', 'warning'); return; }

    hero.skillLevels[skillId] = (hero.skillLevels[skillId] || 0) + 1;
    hero.skillPoints--;
    refreshSkillUI();
    updateResources();
    document.getElementById('skill-points-display').textContent = hero.skillPoints || 0;
    // 技能加点后，被动属性加成 + 主动技能 CD/Multiplier 都会变
    if (typeof refreshHeroUI === 'function') refreshHeroUI();
    if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
    showToast('技能升级成功!', 'success');
}

// 退回所有技能点
function resetSkillPoints(heroId) {
    // ★ HOME_3.3: 战斗锁定检查（skillUI 退回技能点入口）
    if (typeof _checkInBattle === 'function' && !_checkInBattle('退回技能点')) return;
    var hero=null;if(typeof HeroView !== 'undefined' && HeroView.byId){hero=HeroView.byId(heroId);}if(!hero){var _es5_125=GameState.get('heroes')||[];for(var _es5_126=0;_es5_126<_es5_125.length;_es5_126++){if(_es5_125[_es5_126].id===heroId){hero=_es5_125[_es5_126];break;}}}
    if (!hero) return;
    if (!hero.skillLevels) { showToast('没有可退回的技能点', 'info'); return; }

    var totalSpent = 0;
    for (var k in hero.skillLevels) {
        if (hero.skillLevels.hasOwnProperty(k)) {
            totalSpent += hero.skillLevels[k];
        }
    }

    if (totalSpent === 0) { showToast('没有可退回的技能点', 'info'); return; }

    // 弹出确认弹窗
    showConfirm('退回技能点', '确定退回所有已加技能点吗？<br>将返还 <b style="color:#ffd700;">' + totalSpent + ' 点</b> 技能点。', function() {
        hero.skillLevels = {};
        hero.skillPoints = (hero.skillPoints || 0) + totalSpent;
        refreshSkillUI();
        updateResources();
        document.getElementById('skill-points-display').textContent = hero.skillPoints || 0;
        // 退回后需要重新计算属性与战力
        if (typeof refreshHeroUI === 'function') refreshHeroUI();
        if (typeof updateMainTeamPower === 'function') updateMainTeamPower();
        showToast('已退回 ' + totalSpent + ' 点技能点', 'success');
    });
}
