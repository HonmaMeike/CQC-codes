// ========== 副本难度平衡 ==========
function getDungeonEnemyCount(level, maxStage) {
    // 基础怪物数量 + 章节缩放
    var base = 4 + level * 2;
    return Math.min(20, Math.floor(base + maxStage * 0.5));
}

function getDungeonEnemyMult(level, maxStage) {
    // 基础属性倍率 + 章节缩放
    var base = 1.5 + level * 0.5;
    return base + maxStage * 0.1;
}

function getDungeonGoldReward(level, maxStage) {
    var base = 3000 + level * 1000;
    return Math.floor(base * (1 + maxStage * 0.2));
}

function getDungeonStoneReward(level, maxStage) {
    var base = 3 + level * 2;
    return Math.floor(base * (1 + maxStage * 0.15));
}

function getDungeonGemCount(level, maxStage) {
    return Math.max(1, Math.floor(level * 0.5 + maxStage * 0.2));
}

function getDungeonGemLevel(level, maxStage) {
    return Math.min(5, Math.max(1, Math.floor(level * 0.5 + maxStage * 0.1)));
}
