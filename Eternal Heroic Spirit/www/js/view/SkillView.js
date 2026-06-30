// ========== 技能属性视图层 (ES5) ==========
// 解决问题：技能在 hero.skills[] / SKILL_DATA / 战斗中 skillInstances 之间存在多份引用
// 设计原则：技能模板从 SKILL_DATA 主源读取，等级从 hero.skillLevels 获取

(function(global) {
    'use strict';

    // v3 统一架构：技能 _resolve 委托给 window.ViewBase.resolveSkill
    //   ViewBase 负责从 SKILL_DATA 静态字典查技能模板（返回 {skill, id, level}）
    //   本 View 文件不再维护独立的查找循环
    function _resolve(skillRef) {
        if (typeof ViewBase !== 'undefined' && ViewBase.resolveSkill) {
            return ViewBase.resolveSkill(skillRef);
        }
        // 兜底：ViewBase 未加载时的最小实现
        if (!skillRef) return null;
        return null;
    }

    function _hero(heroOrId) {
        if (!heroOrId) return null;
        if (typeof HeroView !== 'undefined' && HeroView.byId) {
            return HeroView.byId(typeof heroOrId === 'string' ? heroOrId : (heroOrId.id || null));
        }
        return null;
    }

    var SkillView = {

        // 通过 id 在 SKILL_DATA 找技能模板
        byId: function(skillId) {
            return (typeof SKILL_DATA !== 'undefined') ? (SKILL_DATA[skillId] || null) : null;
        },

        // 获取英雄已学习的技能（含等级信息）
        heroSkills: function(heroOrId) {
            var hero = _hero(heroOrId);
            if (!hero) return [];
            var arr = [];
            // hero.skills 是字符串 id 列表，hero.skillLevels 是 {[id]: level}
            var ids = (Array.isArray(hero.skills) ? hero.skills : []);
            var levels = (hero.skillLevels && typeof hero.skillLevels === 'object') ? hero.skillLevels : {};
            for (var i = 0; i < ids.length; i++) {
                var tmpl = SkillView.byId(ids[i]);
                if (tmpl) {
                    arr.push({ id: ids[i], skill: tmpl, level: levels[ids[i]] || 0 });
                }
            }
            return arr;
        },

        // 单个技能完整信息
        get: function(skillRef, heroOrId) {
            return _resolve(skillRef, heroOrId);
        },

        // 技能当前等级的伤害/治疗数值
        effectValue: function(skillRef, heroOrId, statKey) {
            var info = _resolve(skillRef, heroOrId);
            if (!info) return 0;
            var lv = info.level || 0;
            var s = info.skill;
            // 优先取 lvArr[lv] 数组索引，没有就取 base
            if (Array.isArray(s.dmgByLevel) && s.dmgByLevel[lv] != null) {
                return s.dmgByLevel[lv];
            }
            if (Array.isArray(s.valueByLevel) && s.valueByLevel[lv] != null) {
                return s.valueByLevel[lv];
            }
            if (s.dmgMult != null) return s.dmgMult;
            if (s.value != null) return s.value;
            return 0;
        },

        // 技能 MP 消耗
        mpCost: function(skillRef, heroOrId) {
            var info = _resolve(skillRef, heroOrId);
            if (!info) return 0;
            var lv = info.level || 0;
            var s = info.skill;
            if (Array.isArray(s.mpCostByLevel) && s.mpCostByLevel[lv] != null) {
                return s.mpCostByLevel[lv];
            }
            return s.mpCost || 0;
        },

        // 技能 CD
        cd: function(skillRef) {
            var info = _resolve(skillRef);
            if (!info) return 0;
            return info.skill.cd || 0;
        },

        // 技能描述（带等级加成）
        describe: function(skillRef, heroOrId) {
            var info = _resolve(skillRef, heroOrId);
            if (!info) return '';
            var s = info.skill;
            var lv = info.level || 0;
            var desc = s.desc || s.description || '';
            if (lv > 0 && s.descByLevel && s.descByLevel[lv]) {
                desc = s.descByLevel[lv];
            }
            return desc;
        },

        // 给英雄添加技能点（统一刷新）
        addPoint: function(heroOrId, skillId) {
            var hero = _hero(heroOrId);
            if (!hero) return false;
            if (!hero.skillLevels) hero.skillLevels = {};
            if (!Array.isArray(hero.skills)) hero.skills = [];
            if (hero.skills.indexOf(skillId) < 0) hero.skills.push(skillId);
            hero.skillLevels[skillId] = (hero.skillLevels[skillId] || 0) + 1;
            if (typeof HeroView !== 'undefined') HeroView.notifyChanged(hero.id);
            return true;
        }
    };

    global.SkillView = SkillView;
})(typeof window !== 'undefined' ? window : this);
