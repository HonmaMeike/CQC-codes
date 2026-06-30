/* ========== GameState — 状态管理封装 ==========
 *
 * 设计目标：
 *   1. 为全局 gameState 提供 getter/setter 封装
 *   2. 新增代码推荐通过 GameState 访问，旧代码继续用 gameState 全局变量
 *   3. 为未来迁移到 ESM 做准备
 *
 * 迁移路线：
 *   Phase 3a: 引入 GameState 封装（本文件），gameState 作为底层存储
 *   Phase 3b: 逐步将 gameState.xxx 引用替换为 GameState.get('xxx')
 *   Phase 3c: gameState 变为私有，所有访问走 GameState API
 *
 * 使用方式：
 *   GameState.get('gold')              // → 100
 *   GameState.get('heroes.0.level')    // → 点号路径访问（未来支持）
 *   GameState.set('gold', 200)         // → 设置，触发变更事件（未来支持）
 *   GameState.getAll()                 // → 完整 state 对象
 *
 * 兼容性：
 *   window.gameState 仍然可用（旧代码不变），但新代码请使用 GameState
 */
(function (global) {
  'use strict';

  // ====================================================================
  // ① 状态存储
  // ====================================================================
  // 引用全局 gameState（由 game.js 的 initGameState/createGameState 维护）
  // 在 game.js 未加载时，_state 为 null；加载后自动指向 gameState
  var _state = null;

  // ====================================================================
  // ② 变更监听器（v6.0+ 预留 — Phase 3b 启用）
  // ====================================================================
  var _listeners = {};

  /**
   * 注册状态变更监听
   * @param {string} key - 监听的字段名（如 'gold'）
   * @param {function} fn - (newVal, oldVal) => void
   * @returns {function} 取消监听的函数
   */
  function on(key, fn) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(fn);
    return function () {
      _listeners[key] = _listeners[key].filter(function (f) { return f !== fn; });
    };
  }

  function _notify(key, newVal, oldVal) {
    var fns = _listeners[key];
    if (fns) {
      for (var i = 0; i < fns.length; i++) {
        try { fns[i](newVal, oldVal); } catch (e) { /* 监听器不应阻断 */ }
      }
    }
  }

  // ====================================================================
  // ③ 核心 API
  // ====================================================================

  /**
   * 获取当前状态引用
   * 如果 gameState 未初始化，返回默认空对象（不崩溃）
   */
  function _ensure() {
    if (!_state && typeof gameState !== 'undefined' && gameState) {
      _state = gameState;
    }
    return _state || {};
  }

  /**
   * 获取单个字段值
   * @param {string} key - 字段名（支持点号路径如 'heroes.0.level'）
   * @returns {*} 字段值，不存在返回 undefined
   *
   * 用法：
   *   GameState.get('gold')
   *   GameState.get('heroes.0.equip.weapon')
   */
  function get(key) {
    var obj = _ensure();
    if (!key) return obj;
    var parts = key.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  /**
   * 设置单个字段值
   * @param {string} key - 字段名
   * @param {*} value - 新值
   * @returns {boolean} 是否成功
   */
  function set(key, value) {
    var obj = _ensure();
    if (!key) return false;
    // 简单 key 直接赋值
    if (key.indexOf('.') === -1) {
      var old = obj[key];
      obj[key] = value;
      _notify(key, value, old);
      return true;
    }
    // 复合 key 找父对象
    var parts = key.split('.');
    var lastKey = parts.pop();
    var parent = obj;
    for (var i = 0; i < parts.length; i++) {
      if (parent[parts[i]] == null) parent[parts[i]] = {};
      parent = parent[parts[i]];
    }
    var oldVal = parent[lastKey];
    parent[lastKey] = value;
    _notify(key, value, oldVal);
    return true;
  }

  /**
   * 批量更新（合并对象到 state）
   * @param {object} updates - 要合并的字段
   */
  function merge(updates) {
    var obj = _ensure();
    if (!updates || typeof updates !== 'object') return;
    for (var k in updates) {
      if (updates.hasOwnProperty(k)) {
        var old = obj[k];
        obj[k] = updates[k];
        _notify(k, updates[k], old);
      }
    }
  }

  /**
   * 便捷变更：获取当前值 → 执行 fn → 设置新值 → 触发监听
   * @param {string} key - 字段名（如 'gold'）
   * @param {function} fn - (currentValue) => newValue
   * @returns {*} fn 返回的新值
   *
   * 用法：
   *   GameState.mutate('gold', function(g) { return g + 100; });
   *   GameState.mutate('stamina', function(s) { return Math.min(240, s + 10); });
   */
  function mutate(key, fn) {
    var obj = _ensure();
    if (!key || typeof fn !== 'function') return;
    var old = obj[key];
    var next = fn(old);
    obj[key] = next;
    _notify(key, next, old);
    return next;
  }

  /**
   * 向数组字段追加元素
   * @param {string} key - 数组字段名
   * @param {*} item - 要追加的元素
   */
  function push(key, item) {
    var obj = _ensure();
    if (!key || !Array.isArray(obj[key])) return;
    obj[key].push(item);
    _notify(key, obj[key], null);
  }

  /**
   * 获取完整 state 对象的引用
   * 注意：这是引用，直接修改会影响 gameState
   */
  function getAll() {
    return _ensure();
  }

  /**
   * 同步 GameState 内部引用到最新的 gameState
   * 在 game.js initGame() 完成后调用一次
   */
  function sync() {
    if (typeof gameState !== 'undefined') {
      _state = gameState;
    }
  }

  // ====================================================================
  // ④ 暴露到全局
  // ====================================================================
  global.GameState = {
    get: get,
    set: set,
    mutate: mutate,
    push: push,
    merge: merge,
    getAll: getAll,
    sync: sync,
    on: on,
    // 内部工具 — 主要用于测试
    _reset: function () { _state = null; _listeners = {}; }
  };

})(window);
