// ========== 通用战斗状态检查工具（HOME_1.1）==========
// 用于所有配置入口（阵容/装备/宝石/技能/天赋/宝石工坊/副本）：
//   - 家园中：返回 true（可操作）
//   - 战斗中已暂停：返回 true（可操作）
//   - 副本中：返回 false + 提示
//   - 战斗中未暂停：弹窗询问是否暂停，false 拦截
//
// 与 teamUI.js 中已有的 _checkTeamEditable / _postTeamChange 协同：
//   - 阵容修改用 _checkTeamEditable（更严格，会触发关卡重置）
//   - 其他配置用 _checkInBattle（不触发关卡重置）

// 全局战斗状态查询
function isInBattle() {
    if (typeof BattleManager === 'undefined' || !BattleManager) return false;
    if (!BattleManager.isRunning) return false;
    // 副本中视作战斗中
    return true;
}

function isBattlePaused() {
    if (typeof BattleManager === 'undefined' || !BattleManager) return false;
    return typeof BattleManager.isPaused === 'function' && BattleManager.isPaused();
}

function isInDungeon() {
    if (typeof BattleManager === 'undefined' || !BattleManager) return false;
    return BattleManager.isDungeon === true;
}

// 当前屏幕是否在战斗中（用于启动流程判断）
function isCurrentScreenBattle() {
    var active = document.querySelector('.screen.active');
    return active && active.id === 'screen-main';
}

// 通用配置入口检查
//   actionName: 操作名称（用于提示文案）
//   returns:    true 可继续操作；false 已拦截
function _checkInBattle(actionName) {
    if (typeof BattleManager === 'undefined' || !BattleManager) return true;
    if (!BattleManager.isRunning) return true;          // 未在战斗
    if (BattleManager.isDungeon) {
        if (typeof showToast === 'function') {
            showToast('副本中无法' + actionName, 'warning');
        }
        return false;
    }
    if (typeof BattleManager.isPaused === 'function' && BattleManager.isPaused()) {
        return true;                                     // 已暂停，允许操作
    }
    // 战斗进行中 → 弹窗询问是否暂停
    if (typeof showConfirm === 'function') {
        showConfirm(
            '战斗进行中',
            '当前正在战斗，无法' + actionName + '。<br><span style="color:#ffd700;">是否暂停战斗以进行此操作？</span><br><br><span style="font-size:11px;color:#888;">提示：暂停后修改阵容会自动重置当前关卡</span>',
            function() {
                if (typeof BattleManager.togglePause === 'function') {
                    BattleManager.togglePause();
                }
            }
        );
    } else if (typeof showToast === 'function') {
        showToast('战斗进行中，请先暂停', 'warning');
    }
    return false;
}

// 退出战斗相关便捷 API
function canExitHome() {
    return !isInBattle() || isBattlePaused();
}

// ★ BUG 修复 (v2.6.5): isDungeon=true 残留时清理
//   原 enterGoldDungeon / enterDustDungeon / enterDemonKingDungeon / enterTower 4 个副本入口
//   顺序都是 "if (typeof _checkInBattle === 'function' && !_checkInBattle(...)) return;"
//   在前, 之后才调 BattleManager.exitDungeon() 清理 isDungeon 残留。
//   _checkInBattle (lockHelper.js:42) 看到 isDungeon=true 会直接 return false 拦下,
//   永远走不到 exitDungeon 清理 → 副本卡死进不去。
//   正确顺序: 入口第一行先 cleanDungeonState() 清理残留, 再 _checkInBattle 守卫。
// ★ v2.6.5 二次修复: isDungeon 残留可能是 true / undefined / null (异常 reset 后不是干净 false)
//   !BattleManager.isDungeon === !undefined === true, 旧版会直接 return false 跳过清理
//   改成 === false 严格判断, 异常状态都进 exitDungeon + 兜底重置
function cleanDungeonState() {
    if (typeof BattleManager === 'undefined' || !BattleManager) return false;
    // ★ 严格判断:只有 === false 才算"干净",其他(true/undefined/null)都要清理
    if (BattleManager.isDungeon === false) return false;
    // 异常残留:调 exitDungeon 清理
    if (typeof BattleManager.exitDungeon === 'function') {
        try {
            BattleManager.exitDungeon();
        } catch (e) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('[lockHelper] exitDungeon failed:', e);
            }
        }
    }
    // ★ 兜底:不管 exitDungeon 成功/失败,强制重置 isDungeon = false
    //   覆盖 isDungeon 残留为 undefined/null 的边界情况(exitDungeon 内部第一行设 false 后,后续 throw 不会回退)
    if (BattleManager.isDungeon) {
        BattleManager.isDungeon = false;
        if (typeof console !== 'undefined' && console.warn) {
            console.warn('[lockHelper] 强制重置 isDungeon = false (exitDungeon 未清理)');
        }
    }
    return true;
}
