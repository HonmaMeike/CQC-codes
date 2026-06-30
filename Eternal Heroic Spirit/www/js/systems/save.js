// ========== 存档/编码系统 ==========
// 注意：这不是安全加密。XOR + Base64 只是编码防误读，玩家可以自行解码修改存档。
// 真正的防篡改需要服务器端验证。

var SAVE_KEY = 'cqc_idle_rpg_save_v3';

// 简单编码（非加密 — 客户端 XOR 可逆）
function encodeSaveData(data) {
    var key = 'CQC_GAME_2024';
    var str = JSON.stringify(data);
    var result = '';
    for (var i = 0; i < str.length; i++) {
        var k = key.charCodeAt(i % key.length);
        result += String.fromCharCode(str.charCodeAt(i) ^ k);
    }
    return btoa(unescape(encodeURIComponent(result)));
}

function decodeSaveData(encoded) {
    var key = 'CQC_GAME_2024';
    try {
        var str = decodeURIComponent(escape(atob(encoded)));
        var result = '';
        for (var i = 0; i < str.length; i++) {
            var k = key.charCodeAt(i % key.length);
            result += String.fromCharCode(str.charCodeAt(i) ^ k);
        }
        return JSON.parse(result);
    } catch (e) {
        return null;
    }
}

// 计算校验和
function calcChecksum(data) {
    var str = JSON.stringify(data);
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

// 保存游戏
function saveGame(state) {
    // ★ v2.6.4 Round 12: 自动存档时同步 lastSaveTime, 让离线奖励计算准确
    //   (不修这行 → 玩家挂 8h 实际只算到上次手动存档的时间, 离线奖励爆炸/归零)
    if (state) state.lastSaveTime = Date.now();
    var checksum = calcChecksum(state);
    var saveData = { data: state, checksum: checksum, version: 1 };
    var encrypted = encodeSaveData(saveData);
    try {
        localStorage.setItem(SAVE_KEY, encrypted);
        return true;
    } catch (e) {
        console.error('Save failed:', e);
        return false;
    }
}

// 当前存档版本号（用于迁移检测）
var CURRENT_SAVE_VERSION = '6.2.0';

// 存档迁移：自动升级旧版存档到最新格式
function migrateSave(saveData) {
function verNum(v) {
    var p = (v || '0.0.0').split('.');
    return parseInt(p[0]||0)*10000 + parseInt(p[1]||0)*100 + parseInt(p[2]||0);
}
    if (!saveData || typeof saveData !== 'object') return saveData;
    var ver = saveData.version || '0.0.0';

    // v2.x → v3.0.0：品质倍率跨度变更（不修改装备数据，评分时自动应用新系数）
    if (verNum(ver) < verNum('3.0.0')) {
        // 无需修改存档数据，评分/计算函数实时读取新的系数
        saveData.version = CURRENT_SAVE_VERSION;
        saveData._migratedFrom = ver;
    }

    // v3.0.x → v3.1.0：天赋系统重构
    //   删 t_exp1~3、t_loot1~3、t_inv1~2（清空存档里对它们的引用）
    if (verNum(ver) < verNum('3.1.0')) {
        var removed = ['t_exp1', 't_exp2', 't_exp3', 't_loot1', 't_loot2', 't_loot3', 't_inv1', 't_inv2'];
        if (saveData.state && Array.isArray(saveData.state.talents)) {
            saveData.state.talents = saveData.state.talents.filter(function(tid) {
                return removed.indexOf(tid) === -1;
            });
        }
        if (saveData.talentLevels) {
            for (var ri = 0; ri < removed.length; ri++) {
                delete saveData.talentLevels[removed[ri]];
            }
        }
        if (saveData.state && 'maxInventory' in saveData.state) {
            delete saveData.state.maxInventory;
        }
        saveData.version = '3.1.0';
    }

    // v3.1.0 → v4.0.0：副本系统重做为爬塔 + 抽奖
    if (verNum(ver) < verNum('4.0.0')) {
        if (saveData.state) {
            if (typeof saveData.lotteryStone !== 'number') saveData.lotteryStone = 0;
            // ★ v5.0: slotLevels 迁移 — 存为 {} 后续按需初始化
            if (!saveData.state.slotLevels) saveData.state.slotLevels = {};
            if (!saveData.tower) {
                saveData.tower = {
                    currentFloor: 1, maxFloor: 1, bestFloor: 1,
                    totalRuns: 0, totalDeaths: 0, lastReward: null
                };
            }
            if (!Array.isArray(saveData.state.lotteryHistory)) saveData.state.lotteryHistory = [];
        }
        saveData.version = '4.0.0';
    }
    // v4.0.0 → v5.0.0：slotLevels 字段兼容（已在上面初始化，此处确保旧存档迁移后也有）
    if (verNum(ver) < verNum('5.0.0')) {
        if (saveData.state && !saveData.state.slotLevels) {
            saveData.state.slotLevels = {};
        }
        saveData.version = '5.0.0';
    }
    // v5.0.0 → v5.1.0：upgradeStone 字段兼容
    if (verNum(ver) < verNum('5.1.0')) {
        if (saveData.state && typeof saveData.state.upgradeStone !== 'number') {
            saveData.state.upgradeStone = 0;
        }
        saveData.version = '5.1.0';
    }
    return saveData;
}

// 加载游戏
function loadGame() {
    try {
        var encrypted = localStorage.getItem(SAVE_KEY);
        if (!encrypted) return null;
        var saveData = decodeSaveData(encrypted);
        if (!saveData) return null;
        // 校验
        var checksum = calcChecksum(saveData.data);
        if (checksum !== saveData.checksum) {
            console.warn('Save data checksum mismatch');
            return null;
        }
        // 自动迁移存档
        var data = saveData.data;
        if (data && typeof data === 'object') {
            // 先迁移再更新版本号（否则 migrateSave 内版本检查全部失效）
            data = migrateSave(data);
            data.version = CURRENT_SAVE_VERSION;
        }
        // ★ v2.6.4 Round 14: 老存档没 lastSaveTime 字段 → 兜底成"当前时间 - 5 分钟" (让离线奖励弹窗触发)
        if (data && !data.lastSaveTime) {
            data.lastSaveTime = Date.now() - 5 * 60 * 1000;
        }
        return data;
    } catch (e) {
        console.error('Load failed:', e);
        return null;
    }
}

// 自动保存
var autoSaveTimer = null;
function startAutoSave(state, interval) {
    if (!interval) interval = 30000;
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(function() {
        saveGame(state);
    }, interval);
}

// 导出存档
function exportSave() {
    var encrypted = localStorage.getItem(SAVE_KEY);
    if (!encrypted) { showToast('无存档可导出', 'warning'); return; }
    var blob = new Blob([encrypted], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cqc_save_' + Date.now() + '.sav';
    a.click();
    URL.revokeObjectURL(url);
}

// 导入存档
function importSave(file, callback, errorCallback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var encrypted = e.target.result;
        localStorage.setItem(SAVE_KEY, encrypted);
        var data = loadGame();
        if (data) {
            if (callback) callback(data);
        } else {
            if (errorCallback) errorCallback(new Error('Invalid save file'));
        }
    };
    reader.onerror = function() {
        if (errorCallback) errorCallback(new Error('Failed to read file'));
    };
    reader.readAsText(file);
}
