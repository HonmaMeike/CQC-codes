// ========== 音效管理器 ==========
// 使用 Web Audio API + 真实音频文件素材
// 特性：
//   1. SFX 一次性播放（点击/打击/技能/治疗/护盾等 17 种）
//   2. BGM 循环播放（peace/battle/boss/victory/defeat 5 个主题）
//   3. 独立音量控制（bgmVolume / sfxVolume 各自 0~1）
//   4. 独立开关（bgmEnabled / sfxEnabled 互不影响）
//   5. 兼容旧 soundMuted 字段（载入存档时迁移）
//   6. 首次播放时按需 fetch + decodeAudioData 缓存到内存
/* global GameState */

var AudioManager = {
    ctx: null,
    initialized: false,
    supported: true,

    // ====== 状态 ======
    bgmEnabled: true,
    sfxEnabled: true,
    bgmVolume: 0.5,
    sfxVolume: 0.7,

    // ====== 内部节点 ======
    _bgmGain: null,   // BGM master gain
    _sfxGain: null,   // SFX master gain

    // ====== 音频缓存（AudioBuffer）======
    _bgmBuffers: {},   // {peace: AudioBuffer, ...}
    _sfxBuffers: {},   // {hit: AudioBuffer, ...}
    _loading: {},      // {name: Promise} 正在加载的 promise 避免重复 fetch

    // ====== BGM 调度状态 ======
    _currentBGM: null,    // 当前 BGM 主题名
    _bgmSource: null,     // 当前 BGM AudioBufferSourceNode
    _bgmGainNode: null,   // 当前 BGM 局部 gain 节点（用于 fade in/out）
    _bgmFallbackTimer: null, // 胜利/失败 BGM 自动切回 peace 的定时器

    // ====== 素材路径表 ======
    // 与 assets/audio/{bgm,sfx}/ 下的文件名一一对应
    _audioPath: 'assets/audio/',
    _bgmFiles: {
        peace:   'bgm/bgm_peace.mp3',
        battle:  'bgm/bgm_battle.mp3',
        boss:    'bgm/bgm_boss.mp3',
        victory: 'bgm/bgm_victory.mp3',
        defeat:  'bgm/bgm_defeat.mp3'
    },
    _sfxFiles: {
        click:        'sfx/sfx_click.wav',
        hit:          'sfx/sfx_hit.wav',
        hit_crit:     'sfx/sfx_hit_crit.wav',
        skill:        'sfx/sfx_skill.wav',
        skill_heal:   'sfx/sfx_skill_heal.wav',
        skill_shield: 'sfx/sfx_skill_shield.wav',
        kill:         'sfx/sfx_kill.wav',
        death_hero:   'sfx/sfx_death.wav',
        death_enemy:  'sfx/sfx_kill.wav',
        levelup:      'sfx/sfx_levelup.wav',
        coin:         'sfx/sfx_coin.wav',
        victory:      'sfx/sfx_victory.wav',
        defeat:       'sfx/sfx_defeat.wav',
        equip:        'sfx/sfx_equip.wav',
        unlock:       'sfx/sfx_unlock.wav',
        error:        'sfx/sfx_error.wav',
        wave_start:   'sfx/sfx_wave_start.wav',
        revive:       'sfx/sfx_revive.wav'
    },

    // ============ 初始化 ============

    init: function() {
        if (this.initialized) return;
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) {
                this.supported = false;
                console.warn('AudioManager: 浏览器不支持 Web Audio API');
                return;
            }
            this.ctx = new AC();
            this.initialized = true;

            // 创建 master gain 节点
            this._bgmGain = this.ctx.createGain();
            this._bgmGain.gain.value = this.bgmVolume;
            this._bgmGain.connect(this.ctx.destination);

            this._sfxGain = this.ctx.createGain();
            this._sfxGain.gain.value = this.sfxVolume;
            this._sfxGain.connect(this.ctx.destination);

            // 从 gameState 同步设置
            var bgmEnabled = GameState.get('bgmEnabled');
            if (bgmEnabled !== undefined) this.bgmEnabled = bgmEnabled;
            var bgmVolume = GameState.get('bgmVolume');
            if (bgmVolume !== undefined) this.bgmVolume = bgmVolume;
            var sfxEnabled = GameState.get('sfxEnabled');
            if (sfxEnabled !== undefined) this.sfxEnabled = sfxEnabled;
            var sfxVolume = GameState.get('sfxVolume');
            if (sfxVolume !== undefined) this.sfxVolume = sfxVolume;
            // 兼容旧 soundMuted 字段
            var soundMuted = GameState.get('soundMuted');
            if (soundMuted !== undefined && soundMuted) {
                this.bgmEnabled = false;
                this.sfxEnabled = false;
            }
            this._applyVolumes();
        } catch(e) {
            this.supported = false;
            console.warn('AudioManager: 无法创建 AudioContext', e);
        }
    },

    // 绑定首次用户交互初始化（移动端 Safari/Chrome 必须）
    bindUserGesture: function() {
        if (this.initialized || !this.supported) return;
        var self = this;
        var handler = function() {
            self.init();
            if (self.ctx && self.ctx.state === 'suspended') {
                self.ctx.resume();
            }
            // 首次交互后预加载常用 SFX（不阻塞，按需加载）
            self._preloadEssentials();
            // 首次交互后自动启动和平 BGM（如果未禁用）
            if (self.bgmEnabled && !self._currentBGM) {
                self.playBGM('peace');
            }
            document.removeEventListener('touchstart', handler);
            document.removeEventListener('click', handler);
            document.removeEventListener('keydown', handler);
        };
        document.addEventListener('touchstart', handler, { passive: true });
        document.addEventListener('click', handler);
        document.addEventListener('keydown', handler);
    },

    // 预加载常用 SFX（战斗最频繁的）
    _preloadEssentials: function() {
        var essentials = ['hit', 'hit_crit', 'skill', 'kill', 'click', 'coin', 'levelup', 'wave_start'];
        for (var i = 0; i < essentials.length; i++) {
            this._loadSFX(essentials[i]);
        }
        // BGM 按需加载（首次切换时才 fetch）
    },

    // ============ 开关/音量 API ============

    toggleBGM: function() {
        this.bgmEnabled = !this.bgmEnabled;
        this._syncToGameState();
        if (!this.bgmEnabled) {
            this.stopBGM();
        } else if (this._currentBGM) {
            // 重新启动当前 BGM
            var cur = this._currentBGM;
            this._currentBGM = null;
            this.playBGM(cur);
        }
        return this.bgmEnabled;
    },

    toggleSFX: function() {
        this.sfxEnabled = !this.sfxEnabled;
        this._syncToGameState();
        return this.sfxEnabled;
    },

    setBGMVolume: function(v) {
        this.bgmVolume = Math.max(0, Math.min(1, parseFloat(v) || 0));
        this._syncToGameState();
        this._applyVolumes();
    },

    setSFXVolume: function(v) {
        this.sfxVolume = Math.max(0, Math.min(1, parseFloat(v) || 0));
        this._syncToGameState();
        this._applyVolumes();
    },

    _applyVolumes: function() {
        if (this._bgmGain) this._bgmGain.gain.value = this.bgmEnabled ? this.bgmVolume : 0;
        if (this._sfxGain) this._sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
    },

    _syncToGameState: function() {
        if (!GameState.getAll()) return;
        GameState.set('bgmEnabled', this.bgmEnabled);
        GameState.set('bgmVolume', this.bgmVolume);
        GameState.set('sfxEnabled', this.sfxEnabled);
        GameState.set('sfxVolume', this.sfxVolume);
        GameState.set('soundMuted', (!this.bgmEnabled && !this.sfxEnabled));
    },

    // ============ 音频加载 ============

    // 通用：fetch + decodeAudioData
    _loadBuffer: function(url) {
        var self = this;
        if (self._loading[url]) return self._loading[url];
        var p = fetch(url, { cache: 'force-cache' })
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.arrayBuffer();
            })
            .then(function(buf) {
                return new Promise(function(resolve, reject) {
                    self.ctx.decodeAudioData(buf, resolve, reject);
                });
            });
        self._loading[url] = p;
        return p;
    },

    // 加载 SFX
    _loadSFX: function(name) {
        var self = this;
        if (self._sfxBuffers[name]) return Promise.resolve(self._sfxBuffers[name]);
        var rel = self._sfxFiles[name];
        if (!rel) return Promise.reject(new Error('Unknown sfx: ' + name));
        var url = self._audioPath + rel;
        return self._loadBuffer(url).then(function(buf) {
            self._sfxBuffers[name] = buf;
            return buf;
        }).catch(function(e) {
            console.warn('AudioManager: SFX load failed', name, e);
            return null;
        });
    },

    // 加载 BGM
    _loadBGM: function(name) {
        var self = this;
        if (self._bgmBuffers[name]) return Promise.resolve(self._bgmBuffers[name]);
        var rel = self._bgmFiles[name];
        if (!rel) return Promise.reject(new Error('Unknown bgm: ' + name));
        var url = self._audioPath + rel;
        return self._loadBuffer(url).then(function(buf) {
            self._bgmBuffers[name] = buf;
            return buf;
        }).catch(function(e) {
            console.warn('AudioManager: BGM load failed', name, e);
            return null;
        });
    },

    // ============ SFX 播放 ============

    play: function(name, volume) {
        if (!this.sfxEnabled || !this.ctx || !this.supported) return;
        if (this.ctx.state === 'suspended') {
            try { this.ctx.resume(); } catch(e) {}
        }
        var vol = (volume === undefined ? 1 : volume);
        var self = this;
        // 异步加载并播放
        this._loadSFX(name).then(function(buf) {
            if (!buf || !self.sfxEnabled) return;
            self._playSFXBuffer(buf, vol);
        });
    },

    // 实际播放一个已解码的 SFX buffer
    _playSFXBuffer: function(buffer, vol) {
        try {
            var source = this.ctx.createBufferSource();
            source.buffer = buffer;
            var g = this.ctx.createGain();
            g.gain.value = Math.max(0, Math.min(1, vol));
            source.connect(g);
            g.connect(this._sfxGain);
            source.start(0);
        } catch(e) {
            // 静默失败
        }
    },

    // ============ BGM 子系统 ============

    // 切换 BGM 主题（同主题不重启）
    playBGM: function(name) {
        if (!this.supported || !this.ctx || !this.initialized) return;
        if (this.ctx.state === 'suspended') {
            try { this.ctx.resume(); } catch(e) {}
        }
        if (this._currentBGM === name) return;
        this.stopBGM();
        this._currentBGM = name;
        if (!this.bgmEnabled) return;
        if (!this._bgmFiles[name]) return;
        var self = this;
        this._loadBGM(name).then(function(buf) {
            if (!buf) return;
            // 可能在加载过程中用户切到了别的 BGM
            if (self._currentBGM !== name) return;
            // victory/defeat 是短曲，播完回到 peace
            var isShort = (name === 'victory' || name === 'defeat');
            self._startBGMBuffer(buf, name, isShort);
        });
    },

    // 启动 BGM 播放（带 fade in）
    _startBGMBuffer: function(buffer, name, isShort) {
        var self = this;
        try {
            var source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = !isShort;  // 短曲不循环

            var g = this.ctx.createGain();
            g.gain.value = 0;
            source.connect(g);
            g.connect(this._bgmGain);

            var now = this.ctx.currentTime;
            g.gain.linearRampToValueAtTime(1, now + 0.6);  // 0.6s fade in

            source.start(0);

            this._bgmSource = source;
            this._bgmGainNode = g;

            source.onended = function() {
                // 短曲播完：自动切回 peace
                if (self._currentBGM === name && isShort) {
                    self._currentBGM = null;
                    self.playBGM('peace');
                }
            };
        } catch(e) {
            console.warn('AudioManager: BGM play failed', e);
        }
    },

    // 停止 BGM（带 fade out）
    stopBGM: function() {
        if (this._bgmSource) {
            try {
                var src = this._bgmSource;
                var g = this._bgmGainNode;
                var now = this.ctx.currentTime;
                if (g) {
                    g.gain.cancelScheduledValues(now);
                    g.gain.setValueAtTime(g.gain.value, now);
                    g.gain.linearRampToValueAtTime(0, now + 0.3);
                }
                // 0.35s 后真正停止
                setTimeout(function() {
                    try { src.stop(); } catch(e) {}
                    try { src.disconnect(); } catch(e) {}
                }, 350);
            } catch(e) {}
            this._bgmSource = null;
            this._bgmGainNode = null;
        }
        this._currentBGM = null;
    },

    // 当前正在播放的 BGM 主题名（用于 UI 显示）
    getCurrentBGM: function() { return this._currentBGM; }
};
