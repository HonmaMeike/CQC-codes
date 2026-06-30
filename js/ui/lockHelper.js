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
