// ========== 背景图片加载器 ==========
// 预加载战斗背景和营地背景 PNG 图片
// 用法: BgLoader.onReady(function() { ... })
//       BgLoader.get('grassland')  -> Image or null
//       BgLoader.getCamp('meadow') -> Image or null

var BgLoader = {
    _images: {},
    _campImages: {},
    _ready: false,
    _callbacks: [],

    // 战斗场景文件名映射
    _battleFiles: {
        grassland: 'grassland.png',
        forest: 'forest.png',
        graveyard: 'graveyard.png',
        volcano: 'volcano.png',
        ice: 'ice.png',
        ruins: 'ruins.png',
        abyss: 'abyss.png',
        dragon: 'dragon.png',
        divine: 'divine.png',
        chaos: 'chaos.png',
        star: 'star.png',
        time: 'time.png',
        storm: 'storm.png',
        shadow: 'shadow.png',
        crystal: 'crystal.png',
        sea: 'sea.png',
        sky: 'sky.png',
        swamp: 'swamp.png',
        labyrinth: 'labyrinth.png',
        battlefield: 'battlefield.png',
        demon: 'demon.png'
    },

    // 营地场景文件名映射
    _campFiles: {
        meadow: 'camp_grassland_dusk.png',
        snow: 'camp_snow.png',
        forest: 'camp_forest.png',
        volcano: 'camp_volcano.png'
    },

    // 预加载所有图片
    preload: function() {
        if (this._ready) { this._fireCallbacks(); return; }
        if (typeof Image === 'undefined') { this._ready = true; this._fireCallbacks(); return; }

        var self = this;
        var battlePath = 'assets/images/battle/';
        var campPath = 'assets/images/camp/';
        var total = 0, loaded = 0;

        // 统计总数
        for (var k in this._battleFiles) total++;
        for (var k in this._campFiles) total++;
        if (total === 0) { this._ready = true; this._fireCallbacks(); return; }

        var onLoad = function() {
            loaded++;
            if (loaded >= total) {
                self._ready = true;
                self._fireCallbacks();
            }
        };

        // 加载战斗背景
        for (var key in this._battleFiles) {
            (function(k, f) {
                var img = new Image();
                img.onload = onLoad;
                img.onerror = function() {
                    // 单个图片加载失败不阻塞整体
                    loaded++;
                    if (loaded >= total) { self._ready = true; self._fireCallbacks(); }
                };
                img.src = battlePath + f;
                self._images[k] = img;
            })(key, this._battleFiles[key]);
        }

        // 加载营地背景
        for (var key in this._campFiles) {
            (function(k, f) {
                var img = new Image();
                img.onload = onLoad;
                img.onerror = function() {
                    loaded++;
                    if (loaded >= total) { self._ready = true; self._fireCallbacks(); }
                };
                img.src = campPath + f;
                self._campImages[k] = img;
            })(key, this._campFiles[key]);
        }
    },

    // 获取战斗背景图
    get: function(type) {
        if (!this._ready) return null;
        var img = this._images[type];
        if (img && img.complete && img.naturalWidth > 0) return img;
        return null;
    },

    // 获取营地背景图
    getCamp: function(type) {
        if (!this._ready) return null;
        var img = this._campImages[type];
        if (img && img.complete && img.naturalWidth > 0) return img;
        return null;
    },

    // 是否加载完成
    get ready() { return this._ready; },

    // 注册就绪回调
    onReady: function(cb) {
        if (this._ready) { cb(); return; }
        this._callbacks.push(cb);
    },

    _fireCallbacks: function() {
        var cbs = this._callbacks.slice();
        this._callbacks = [];
        for (var i = 0; i < cbs.length; i++) {
            try { cbs[i](); } catch(e) { console.warn('[BgLoader] callback error:', e); }
        }
    }
};

// 页面加载后自动开始预加载
if (typeof Image !== 'undefined') {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        BgLoader.preload();
    } else {
        document.addEventListener('DOMContentLoaded', function() { BgLoader.preload(); });
    }
}
