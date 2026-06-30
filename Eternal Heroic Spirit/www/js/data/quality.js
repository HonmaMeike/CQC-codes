/**
 * Quality.js — 全游戏品质数据单一来源（v6.x）
 *
 * 设计原则：
 *   1. 集中管理 6 阶品质（COMMON-IMMORTAL）的所有元数据
 *   2. 与 utils/helpers.js 的 QUALITY 枚举、QUALITY_NAMES 等并行存在（双轨）
 *   3. 业务方可逐步调用 window.Quality.xxx 替代分散的 getQualityName/Class/Color 等
 *
 * 命名空间：window.Quality
 *   Quality.LEVEL  - 品质枚举
 *   Quality.TIER   - 6 阶品质完整数据数组（按 index 0-5）
 *   Quality.getName/getClass/getColor/getBg/getStatMult/getMaxAffix/getSockets(q)
 *
 * 整合的数据来源（5 处分散）：
 *   - utils/helpers.js    QUALITY_NAMES/CLASSES/BG/MAX_AFFIX/SOCKETS/getQualityXxx
 *   - data/equipment.js   qMult 品质属性倍率 [1.0,1.2,1.5,1.8,2.2,2.7]
 *   - systems/loot.js     品质出现概率 (5 段 if-else, 含 boost)
 *   - utils/random.js     另一份品质出现概率
 *   - view/EquipView.js   独立 QUALITY_NAMES/QUALITY_COLORS
 */
(function () {
    'use strict';

    // ====================================================================
    // ① 品质枚举（与 helpers.js QUALITY 保持一致）
    // ====================================================================
    var LEVEL = {
        COMMON: 0,
        RARE: 1,
        LEGENDARY: 2,
        MIRACLE: 3,
        MYTHIC: 4,
        IMMORTAL: 5
    };

    // ====================================================================
    // ② 6 阶品质完整数据（按 index 0-5 对应 COMMON-IMMORTAL）
    //   每条记录：id/key/cnName/enName/cssClass/bgClass/color/maxAffix/sockets/statMult
    // ====================================================================
    var TIER = [
        // v3.x 平衡调整：品质跨度从 2.7× 收敛到 2.0×，最大词条数从 10 降到 6
        // 目的：中低品质装备在游戏全期都有"留 vs 卖"决策空间，避免金装碾压白装 50-100 倍
        // index 0: 普通 (白)
        { id: 0, key: 'COMMON',    cnName: '白', enName: 'Common',    cssClass: 'q-common',    bgClass: 'bg-common',    color: '#9f9f9fff', maxAffix: 1,  sockets: 0, statMult: 1.0  },
        // index 1: 优秀 (绿)
        { id: 1, key: 'RARE',      cnName: '绿', enName: 'Rare',      cssClass: 'q-rare',      bgClass: 'bg-rare',      color: '#67fd2bff', maxAffix: 2,  sockets: 1, statMult: 1.15 },
        // index 2: 稀有 (蓝)
        { id: 2, key: 'LEGENDARY', cnName: '蓝', enName: 'Legendary', cssClass: 'q-legendary', bgClass: 'bg-legendary', color: '#552bffff', maxAffix: 3,  sockets: 2, statMult: 1.3  },
        // index 3: 史诗 (紫)
        { id: 3, key: 'MIRACLE',   cnName: '紫', enName: 'Miracle',   cssClass: 'q-miracle',   bgClass: 'bg-miracle',   color: '#e040fb', maxAffix: 4,  sockets: 3, statMult: 1.5  },
        // index 4: 传说 (橙)
        { id: 4, key: 'MYTHIC',    cnName: '橙', enName: 'Mythic',    cssClass: 'q-mythic',    bgClass: 'bg-mythic',    color: '#ff5722', maxAffix: 5,  sockets: 4, statMult: 1.75 },
        // index 5: 神话 (金)
        { id: 5, key: 'IMMORTAL',  cnName: '金', enName: 'Immortal',  cssClass: 'q-immortal',  bgClass: 'bg-immortal',  color: '#ffd700', maxAffix: 6,  sockets: 5, statMult: 2.0  }
    ];

    // ====================================================================
    // ③ 品质出现概率阈值（与 loot.js / random.js 对齐）
    //   规则：r < 40 COMMON, r < 70 RARE, r < 88 LEGENDARY, r < 96 MIRACLE, r < 99 MYTHIC, 否则 IMMORTAL
    // ====================================================================
    var DROP_THRESHOLDS = [40, 70, 88, 96, 99];

    // ====================================================================
    // ④ 便捷访问接口
    // ====================================================================
    function getTier(q) {
        return TIER[q] || TIER[0];
    }

    function getName(q) {
        return (TIER[q] && TIER[q].cnName) || '未知';
    }

    function getEnName(q) {
        return (TIER[q] && TIER[q].enName) || 'Unknown';
    }

    function getClass(q) {
        return (TIER[q] && TIER[q].cssClass) || '';
    }

    function getBg(q) {
        return (TIER[q] && TIER[q].bgClass) || '';
    }

    function getColor(q) {
        return (TIER[q] && TIER[q].color) || '#fff';
    }

    function getMaxAffix(q) {
        return (TIER[q] && TIER[q].maxAffix) || 0;
    }

    function getSockets(q) {
        return (TIER[q] && TIER[q].sockets) || 0;
    }

    function getStatMult(q) {
        return (TIER[q] && TIER[q].statMult) || 1.0;
    }

    // ====================================================================
    // ⑤ 根据随机数 [0, 100) 决定品质（替代 loot.js / random.js 的 if-else 链）
    // ====================================================================
    function rollQuality(r) {
        if (typeof r !== 'number' || r < 0) r = 0;
        if (r >= 100) r = 99.99;
        for (var i = 0; i < DROP_THRESHOLDS.length; i++) {
            if (r < DROP_THRESHOLDS[i]) return i;
        }
        return TIER.length - 1; // 100 时返回最高品质
    }

    // ====================================================================
    // 暴露到全局
    // ====================================================================
    window.Quality = {
        // 常量
        LEVEL: LEVEL,
        TIER: TIER,
        DROP_THRESHOLDS: DROP_THRESHOLDS,
        // 查询
        getTier: getTier,
        getName: getName,
        getEnName: getEnName,
        getClass: getClass,
        getBg: getBg,
        getColor: getColor,
        getMaxAffix: getMaxAffix,
        getSockets: getSockets,
        getStatMult: getStatMult,
        // 随机
        rollQuality: rollQuality
    };
})();
