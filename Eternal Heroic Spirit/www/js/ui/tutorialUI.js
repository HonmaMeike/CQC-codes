// ========== 新手教程系统 ==========
// 半透明遮罩 + 高亮目标元素 + 说明对话框
// 完全基于 DOM，不依赖外部库
/* global GameState */

var _tutorialActive = false;
var _tutorialOverlay = null;
var _currentStepIdx = -1;

// 获取当前教程步骤索引
function getTutorialStep() {
    if (!gameState) return -1;
    if (GameState.get("tutorialCompleted")) return -1;
    return GameState.get("tutorialStep") || 0;
}

// 检查是否应该触发某个教程
function checkTutorialTrigger(triggerId) {
    if (!gameState || GameState.get("tutorialCompleted")) return;
    if (_tutorialActive) return;
    var stepIdx = getTutorialStep();
    if (stepIdx < 0 || stepIdx >= TUTORIAL_STEPS.length) return;
    var step = TUTORIAL_STEPS[stepIdx];
    if (step.trigger === triggerId) {
        showTutorialStep(stepIdx);
    }
}

// 显示教程步骤
function showTutorialStep(stepIdx) {
    if (!TUTORIAL_STEPS || stepIdx < 0 || stepIdx >= TUTORIAL_STEPS.length) return;
    if (_tutorialActive) return;
    
    var step = TUTORIAL_STEPS[stepIdx];
    var targetEl = document.querySelector(step.target);
    if (!targetEl) {
        // 目标元素不存在，跳过此步
        advanceTutorial(stepIdx);
        return;
    }
    
    _tutorialActive = true;
    _currentStepIdx = stepIdx;
    GameState.set("tutorialStep", stepIdx + 1);
    
    // 执行进入回调
    if (typeof step.onEnter === 'function') {
        try { step.onEnter(); } catch(e) {}
    }
    
    // 确保 overlay 容器存在
    if (!document.getElementById('tutorial-overlay')) {
        var ov = document.createElement('div');
        ov.id = 'tutorial-overlay';
        document.body.appendChild(ov);
    }
    _tutorialOverlay = document.getElementById('tutorial-overlay');
    _tutorialOverlay.innerHTML = '';
    _tutorialOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;pointer-events:none;';
    
    // 高亮目标元素
    if (step.highlight) {
        var rect = targetEl.getBoundingClientRect();
        // 在高亮元素周围创建一个"光晕"
        var highlight = document.createElement('div');
        highlight.style.cssText = 'position:fixed;top:' + (rect.top - 6) + 'px;left:' + (rect.left - 6) + 'px;' +
            'width:' + (rect.width + 12) + 'px;height:' + (rect.height + 12) + 'px;' +
            'border:3px solid #ffd700;border-radius:8px;' +
            'box-shadow:0 0 20px rgba(255,215,0,0.6),0 0 40px rgba(255,215,0,0.3);' +
            'pointer-events:none;z-index:100000;' +
            'animation:tutorialPulse 1.5s ease-in-out infinite;';
        _tutorialOverlay.appendChild(highlight);
    }
    
    // 半透明遮罩（覆盖除了高亮区域以外的所有区域）
    var mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:rgba(0,0,0,0.55);z-index:99999;pointer-events:none;';
    // 如果高亮，在高亮位置"挖洞"
    if (step.highlight) {
        var r = targetEl.getBoundingClientRect();
        var clipLeft = r.left - 10;
        var clipTop = r.top - 10;
        var clipRight = r.right + 10;
        var clipBottom = r.bottom + 10;
        mask.style.clipPath = 'polygon(' +
            '0% 0%, 100% 0%, 100% 100%, 0% 100%, ' +
            '0% ' + clipTop + 'px, ' +
            clipLeft + 'px ' + clipTop + 'px, ' +
            clipLeft + 'px ' + clipBottom + 'px, ' +
            clipRight + 'px ' + clipBottom + 'px, ' +
            clipRight + 'px ' + clipTop + 'px, ' +
            '0% ' + clipTop + 'px)';
    }
    _tutorialOverlay.appendChild(mask);
    
    // 对话框
    var dialog = document.createElement('div');
    dialog.style.cssText = getDialogPosition(step, targetEl);
    dialog.innerHTML = 
        '<div style="background:rgba(20,20,40,0.96);border:1px solid rgba(255,215,0,0.4);' +
        'border-radius:14px;padding:20px 24px;max-width:380px;' +
        'box-shadow:0 8px 40px rgba(0,0,0,0.7),0 0 30px rgba(255,215,0,0.15);' +
        'backdrop-filter:blur(12px);">' +
        '<div style="font-size:18px;font-weight:bold;color:#ffd700;margin-bottom:10px;">' + step.title + '</div>' +
        '<div style="font-size:14px;color:#e0e0e0;line-height:1.7;margin-bottom:16px;white-space:pre-wrap;">' + step.text + '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div style="font-size:12px;color:#888;">' + (stepIdx + 1) + ' / ' + TUTORIAL_STEPS.length + '</div>' +
        '<div style="display:flex;gap:8px;">' +
        (stepIdx > 0 ? '<button class="tutorial-btn tutorial-btn-ghost" onclick="prevTutorialStep()">← 上一步</button>' : '') +
        '<button class="tutorial-btn tutorial-btn-primary" onclick="completeTutorialStep()">' +
        (stepIdx >= TUTORIAL_STEPS.length - 1 ? '🎉 完成！' : '下一步 →') +
        '</button>' +
        '<button class="tutorial-btn tutorial-btn-skip" onclick="skipAllTutorial()">跳过</button>' +
        '</div></div></div>';
    _tutorialOverlay.appendChild(dialog);
    
    // 添加 CSS 动画
    if (!document.getElementById('tutorial-style')) {
        var style = document.createElement('style');
        style.id = 'tutorial-style';
        style.textContent = 
            '@keyframes tutorialPulse {' +
            '0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.6),0 0 40px rgba(255,215,0,0.3);}' +
            '50%{box-shadow:0 0 30px rgba(255,215,0,0.9),0 0 60px rgba(255,215,0,0.5);}' +
            '}' +
            '.tutorial-btn{font-size:13px;padding:7px 16px;border-radius:8px;border:none;cursor:pointer;font-weight:bold;transition:all 0.2s;}' +
            '.tutorial-btn:hover{transform:translateY(-1px);}' +
            '.tutorial-btn-primary{background:linear-gradient(135deg,#ffd700,#ff8c00);color:#1a1a2e;}' +
            '.tutorial-btn-primary:hover{box-shadow:0 2px 12px rgba(255,215,0,0.4);}' +
            '.tutorial-btn-ghost{background:rgba(255,255,255,0.08);color:#ccc;border:1px solid rgba(255,255,255,0.15);}' +
            '.tutorial-btn-ghost:hover{background:rgba(255,255,255,0.15);}' +
            '.tutorial-btn-skip{background:transparent;color:#666;font-size:12px;}' +
            '.tutorial-btn-skip:hover{color:#ff4444;}';
        document.head.appendChild(style);
    }
}

// 计算对话框位置
function getDialogPosition(step, targetEl) {
    var rect = targetEl.getBoundingClientRect();
    var gap = 16;
    var base = 'position:fixed;z-index:100001;pointer-events:auto;';
    
    switch (step.position || 'bottom') {
        case 'bottom':
            return base + 'top:' + (rect.bottom + gap) + 'px;left:' + 
                Math.max(10, Math.min(window.innerWidth - 400, rect.left + rect.width/2 - 190)) + 'px;';
        case 'top':
            return base + 'bottom:' + (window.innerHeight - rect.top + gap) + 'px;left:' + 
                Math.max(10, Math.min(window.innerWidth - 400, rect.left + rect.width/2 - 190)) + 'px;';
        case 'left':
            return base + 'top:' + Math.max(10, Math.min(window.innerHeight - 200, rect.top + rect.height/2 - 100)) + 'px;right:' + 
                (window.innerWidth - rect.left + gap) + 'px;';
        case 'right':
            return base + 'top:' + Math.max(10, Math.min(window.innerHeight - 200, rect.top + rect.height/2 - 100)) + 'px;left:' + 
                (rect.right + gap) + 'px;';
        default:
            return base + 'bottom:20px;left:50%;transform:translateX(-50%);';
    }
}

// 完成当前步骤
function completeTutorialStep() {
    if (_currentStepIdx < 0) return;
    var step = TUTORIAL_STEPS[_currentStepIdx];
    if (typeof step.onComplete === 'function') {
        try { step.onComplete(); } catch(e) {}
    }
    closeTutorial();
    
    // 播放下一步
    var nextIdx = _currentStepIdx + 1;
    if (nextIdx < TUTORIAL_STEPS.length) {
        var nextStep = TUTORIAL_STEPS[nextIdx];
        // 对于后续步骤，使用被动触发（等待游戏事件）
        // 如果下一步是 welcome 或 enter_battle，直接播放
        if (nextStep.trigger === 'gameStart' || nextStep.trigger === 'screen_home') {
            showTutorialStep(nextIdx);
        }
    }
}

// 上一步
function prevTutorialStep() {
    if (_currentStepIdx <= 0) return;
    closeTutorial();
    showTutorialStep(_currentStepIdx - 1);
}

// 跳过全部教程
function skipAllTutorial() {
    closeTutorial();
    if (gameState) {
        GameState.set("tutorialCompleted", true);
        GameState.set("tutorialStep", TUTORIAL_STEPS.length);
    }
    showToast('新手教程已跳过，可在设置中重新开启', 'info');
}

// 重新开始教程（设置页按钮调用）
function restartTutorial() {
    if (!gameState) return;
    if (_tutorialActive) closeTutorial();
    GameState.set("tutorialStep", 0);
    GameState.set("tutorialCompleted", false);
    window._tutorialBattleFired = false;
    showToast('🎓 新手教程已重新开始！', 'success');
    setTimeout(function() {
        checkTutorialTrigger('gameStart');
    }, 600);
}

// 关闭教程
function closeTutorial() {
    if (_tutorialOverlay) {
        _tutorialOverlay.innerHTML = '';
        _tutorialOverlay.style.display = 'none';
    }
    _tutorialActive = false;
    _currentStepIdx = -1;
}

// 强制前进到下一触发教程（跳过中间步骤）
function advanceTutorial(fromStepIdx) {
    if (_tutorialActive) return;
    _currentStepIdx = fromStepIdx;
    if (typeof TUTORIAL_STEPS[fromStepIdx].onComplete === 'function') {
        try { TUTORIAL_STEPS[fromStepIdx].onComplete(); } catch(e) {}
    }
    GameState.set("tutorialStep", fromStepIdx + 1);
}
