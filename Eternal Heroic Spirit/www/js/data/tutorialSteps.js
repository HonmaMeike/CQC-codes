// ========== 新手教程数据 v6.1 ==========
/* global GameState */
var TUTORIAL_STEPS = [
    // STEP 0: 欢迎
    {
        id: 'welcome',
        trigger: 'gameStart',
        target: '#screen-home',
        title: '🏕 欢迎来到 CQC！',
        text: '这是一款放置挂机 RPG。家园是你的安全港湾，准备好后点击右上角「进入战斗」开始冒险吧！',
        position: 'bottom',
        arrow: 'down',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {
            showToast('💡 点击右上角「战斗」按钮！', 'info');
        }
    },
    // STEP 1: 进入战斗
    {
        id: 'enter_battle',
        trigger: 'screen_home',
        target: '#btn-enter-battle',
        title: '⚔ 开始冒险',
        text: '点击这里进入第一章「新手草原」。每章 20 波怪物，自动战斗会帮你处理一切！',
        position: 'left',
        arrow: 'left',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 2: 战斗界面
    {
        id: 'auto_battle',
        trigger: 'battle_start_ch1',
        target: '.battle-speed-wrap',
        title: '⚡ 战斗界面',
        text: '左上显示当前波次，右侧可调速度（1x-4x）。自动推图模式下英雄会自动攻击敌人。',
        position: 'bottom',
        arrow: 'down',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 3: 角色系统
    {
        id: 'hero_intro',
        trigger: 'first_wave_clear',
        target: '.nav-btn[data-screen="hero"]',
        title: '😊 角色详情',
        text: '点击「角色」查看英雄属性。这里可以管理装备、升级技能、配置阵容——是英雄成长的核心入口。',
        position: 'top',
        arrow: 'up',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 4: 技能升级
    {
        id: 'skill_upgrade',
        trigger: 'open_hero',
        target: '#hero-skills',
        title: '✨ 技能升级',
        text: '英雄升级获得技能点。点击技能旁的「+」按钮升级，每级提升效果！升级后点「↻退回」可重新分配。',
        position: 'top',
        arrow: 'up',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 5: 装备获取
    {
        id: 'equip_pickup',
        trigger: 'first_equip_drop',
        target: '#hero-equip-slots',
        title: '🎒 获得装备！',
        text: '怪物掉落了装备！在角色详情中点击装备槽位可以穿戴。装备有白/绿/蓝/紫/橙/金 6 种品质。',
        position: 'top',
        arrow: 'up',
        highlight: false,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 6: 装备强化
    {
        id: 'enhance',
        trigger: 'have_equip',
        target: '#hero-equip-slots',
        title: '⚡ 装备强化',
        text: '点击已穿戴的装备可打开详情。使用「强化」按钮消耗金币提升属性，每级 +5% 基础属性！',
        position: 'top',
        arrow: 'up',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 7: 仓库系统
    {
        id: 'inventory',
        trigger: 'stage_3',
        target: '.nav-btn[data-screen="inventory"]',
        title: '📦 仓库',
        text: '底部「仓库」可以浏览所有装备。支持分类筛选、装备对比、出售分解。多余的装备可卖掉换金币！',
        position: 'top',
        arrow: 'up',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 8: 天赋系统
    {
        id: 'talents',
        trigger: 'stage_5',
        target: '.nav-btn[data-screen="talent"]',
        title: '📋 天赋树',
        text: '底部「天赋」消耗金币解锁永久加成——离线收益、仓库容量、上阵位置等。越早解锁越划算！',
        position: 'top',
        arrow: 'up',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 9: 宝石系统
    {
        id: 'gems',
        trigger: 'stage_8',
        target: '.nav-btn[data-screen="forge"]',
        title: '💎 宝石工坊',
        text: '底部「宝石」可以合成、镶嵌宝石。3 颗同级宝石合成 1 颗更高级的！镶嵌到装备孔中大幅提升战力。',
        position: 'top',
        arrow: 'up',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 10: 副本系统
    {
        id: 'dungeon',
        trigger: 'stage_10',
        target: '.nav-btn[data-screen="dungeon"]',
        title: '⛩ 副本挑战',
        text: '底部「副本」包含爬塔和抽奖。爬塔 BOSS 层掉落宠物蛋石，抽奖大厅可以抽装备和资源！',
        position: 'top',
        arrow: 'up',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 11: 宠物系统
    {
        id: 'pet_system',
        trigger: 'stage_12',
        target: '.nav-btn[data-screen="pet"]',
        title: '🐾 宠物系统',
        text: '底部「宠物」可以用蛋石抽蛋、孵化、升星！30 种宠物提供战斗加成，高品阶宠物有更强属性。',
        position: 'top',
        arrow: 'up',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 12: 设置
    {
        id: 'settings',
        trigger: 'stage_15',
        target: '.home-header button[title="设置"]',
        title: '⚙ 游戏设置',
        text: '右上角齿轮打开设置——战斗速度、自动战斗、云存档、成就、游戏指南都在这里。记得用云存档备份进度！',
        position: 'bottom',
        arrow: 'down',
        highlight: true,
        onEnter: function() {},
        onComplete: function() {}
    },
    // STEP 13: 完成
    {
        id: 'tutorial_complete',
        trigger: 'stage_20',
        target: '#stage-info',
        title: '🎉 新手教程完成！',
        text: '你已经掌握了 CQC 的核心玩法！继续冒险、收集装备、强化宝石、培养宠物——无尽的冒险等着你！',
        position: 'bottom',
        arrow: 'down',
        highlight: false,
        onEnter: function() {},
        onComplete: function() {
            GameState.set("tutorialCompleted", true);
            showToast('🎉 教程完成！祝你好运！', 'success');
        }
    }
];
