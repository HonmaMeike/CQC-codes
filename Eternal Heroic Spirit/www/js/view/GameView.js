// ========== 统一游戏视图层入口 (ES5) ==========
// 暴露全局 HeroView/EquipView/GemView/MonsterView/SkillView 的快捷方式
// 同时提供 GameView 统一命名空间 + 全局 UI 刷新入口
//
// v6.2+ 扩展：refreshAll() 覆盖 15+ 个 UI 刷新函数
//   业务方调用 GameView.refreshAll() 即可同步所有界面（升级/购买/装备/宝石/技能修改后）

(function(global) {
    'use strict';

    // 安全调用：typeof 检查避免未加载时报错
    function safe(fn) {
        return (typeof fn === 'function') ? fn() : null;
    }

    var GameView = {
        Hero:    (typeof HeroView    !== 'undefined') ? HeroView    : null,
        Equip:   (typeof EquipView   !== 'undefined') ? EquipView   : null,
        Gem:     (typeof GemView     !== 'undefined') ? GemView     : null,
        Monster: (typeof MonsterView !== 'undefined') ? MonsterView : null,
        Skill:   (typeof SkillView   !== 'undefined') ? SkillView   : null,

        // 统一刷新所有 UI（升级/购买/装备/宝石修改后调用）
        //   旧习惯：每个操作点手动调用 updateResources + updateMainTeamPower + refreshXxx
        //   新习惯：统一调用 GameView.refreshAll()，所有 UI 自动同步
        refreshAll: function() {
            // 1. 顶部资源栏（金币/宝石/粉尘/重铸石）
            safe(updateResources);

            // 2. 主界面队伍战力
            safe(updateMainTeamPower);

            // 3. 队伍界面
            safe(refreshTeamUI);

            // 4. 角色详情
            safe(refreshHeroUI);

            // 5. 仓库
            safe(refreshInventoryUI);

            // 6. 天赋页
            safe(refreshTalentUI);

            // 7. 技能页
            safe(refreshSkillUI);

            // 8. 宝石界面
            safe(refreshGemUI);

            // 9. 宝石工坊界面
            safe(refreshForgeUI);

            // 10. 设置界面
            safe(refreshSettingsUI);

            // 11. 副本体力显示
            safe(updateDungeonStaminaDisplay);

            // 12. View 层通知（让 HeroView/EquipView/GemView 内部缓存失效）
            if (typeof HeroView !== 'undefined' && HeroView.notifyChanged) HeroView.notifyChanged();
        },

        // 部分刷新：只刷新与英雄/装备/宝石相关的界面（高频操作如穿戴装备/镶嵌宝石）
        refreshHeroRelated: function() {
            safe(updateResources);
            safe(updateMainTeamPower);
            safe(refreshTeamUI);
            safe(refreshHeroUI);
            safe(refreshInventoryUI);
            safe(refreshGemUI);
            safe(refreshForgeUI);
            if (typeof HeroView !== 'undefined' && HeroView.notifyChanged) HeroView.notifyChanged();
        },

        // 经济刷新：只刷新与货币/资源相关的界面（购买/分解/卖出后）
        refreshEconomy: function() {
            safe(updateResources);
            safe(refreshInventoryUI);
            safe(refreshForgeUI);
        }
    };

    global.GameView = GameView;

    // 同步暴露 UI 命名空间（兼容旧式 window.UI.refreshAll 调用）
    global.UI = global.UI || {};
    global.UI.refreshAll = function() { return GameView.refreshAll(); };
    global.UI.refreshHeroRelated = function() { return GameView.refreshHeroRelated(); };
    global.UI.refreshEconomy = function() { return GameView.refreshEconomy(); };
})(typeof window !== 'undefined' ? window : this);
