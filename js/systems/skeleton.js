// ========== 程序化骨骼动画系统 ==========
// 纯 JS,无依赖。给每个战斗单位一个骨骼树(Bone hierarchy)+程序化动画轨道
//
// 设计目标:
//   1. 8职业 + 72怪物 + 38网友怪都能用同一套骨架(只换贴图/颜色/尺寸)
//   2. 5 套基础动画(idle/attack/hit/cast/die)由程序生成,不需手 K 帧
//   3. 状态切换带 blend,避免动画突跳
//   4. 走 Canvas2D 渲染(保留你的 sprites.js),只把贴图按骨骼世界变换画到正确位置
//
// 关键概念:
//   - Bone:父子层级,每根骨头有 rotation/scale,世界矩阵 = 父矩阵 × 局部矩阵
//   - Skeleton:一棵树,绑定动画轨道
//   - AnimationTrack:每个骨头若干关键帧 {time, rotation, scaleX, scaleY, x, y}
//   - update(dt) → 推进当前动画 → 重算所有 bone.worldMatrix

// ============================================================
// Bone
// ============================================================
function Bone(name, opts) {
    opts = opts || {};
    this.name = name;
    this.parent = null;
    this.children = [];
    // 局部变换(相对父骨骼)
    this.x = opts.x || 0;            // 相对父的平移 X
    this.y = opts.y || 0;            // 相对父的平移 Y
    this.rotation = opts.rotation || 0;  // 弧度
    this.scaleX = opts.scaleX || 1;
    this.scaleY = opts.scaleY || 1;
    // 骨骼"长度"(用于绘制骨头时画参考线,可不用)
    this.length = opts.length || 0;
    // rest pose(动画关键帧相对此)
    this.restRotation = this.rotation;
    this.restX = this.x;
    this.restY = this.y;
    this.restScaleX = this.scaleX;
    this.restScaleY = this.scaleY;
    // 骨骼附件(可挂一个 sprite 绘制函数)
    this.attachment = null;          // { draw: function(ctx, worldX, worldY, worldRot, worldScale) {} }
    // 缓存的世界变换
    this._worldX = 0;
    this._worldY = 0;
    this._worldRotation = 0;
    this._worldScaleX = 1;
    this._worldScaleY = 1;
    this._worldCos = 1;   // cos(worldRotation)
    this._worldSin = 0;   // sin(worldRotation)
}

Bone.prototype.addChild = function(child) {
    child.parent = this;
    this.children.push(child);
    return this;
};

// 深度优先遍历所有骨骼
Bone.prototype.traverse = function(callback) {
    callback(this);
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].traverse(callback);
    }
};

// 查找骨骼(按名)
Bone.prototype.findByName = function(name) {
    if (this.name === name) return this;
    for (var i = 0; i < this.children.length; i++) {
        var r = this.children[i].findByName(name);
        if (r) return r;
    }
    return null;
};

// ============================================================
// AnimationTrack - 关键帧动画
// ============================================================
function AnimationTrack(name, duration, loop) {
    this.name = name;
    this.duration = duration;     // 秒
    this.loop = loop !== false;   // 默认循环
    // 按骨头名分组的关键帧数组
    // 每帧: { time, rotation?, x?, y?, scaleX?, scaleY? }
    this.tracks = {};
    this.onEnd = null;
}

AnimationTrack.prototype.addKey = function(boneName, time, props) {
    if (!this.tracks[boneName]) this.tracks[boneName] = [];
    this.tracks[boneName].push({ time: time, props: props });
};

// 按 time 排序每个骨头的关键帧
AnimationTrack.prototype.sort = function() {
    for (var bn in this.tracks) {
        this.tracks[bn].sort(function(a, b) { return a.time - b.time; });
    }
};

// ============================================================
// Skeleton - 骨骼树 + 当前动画
// ============================================================
function Skeleton() {
    this.root = null;
    this.bones = {};                  // name → Bone
    this.animations = {};            // name → AnimationTrack
    this.currentAnim = null;
    this.currentAnimName = '';
    this.elapsed = 0;
    this.speed = 1;                   // 动画速度倍率
    this.posX = 0;                    // 整体渲染位置 (世界坐标)
    this.posY = 0;
    this.onAnimEnd = null;
}

// 注册一根骨头
Skeleton.prototype.addBone = function(bone) {
    if (!this.root) {
        this.root = bone;
    } else {
        this.root.addChild(bone);
    }
    var self = this;
    // 立即注册当前 bone 及其所有已挂子骨头
    bone.traverse(function(b) { self.bones[b.name] = b; });
    // v2.6.2: 以后通过 bone.addChild() 加进来的子骨头也要进 skel.bones,
    //   否则动画 track 按名字找 bone 找不到,子骨头不会动
    var origAddChild = bone.addChild;
    bone.addChild = function(child) {
        origAddChild.call(this, child);
        // 重新注册这个新 child 到 skel.bones
        child.traverse(function(b) { self.bones[b.name] = b; });
        return this;
    };
    return bone;
};

// 注册一个动画
Skeleton.prototype.addAnimation = function(track) {
    track.sort();
    this.animations[track.name] = track;
};

// 切换动画(带 blend)
Skeleton.prototype.playAnimation = function(name, blendTime) {
    if (this.currentAnimName === name) return;
    var newTrack = this.animations[name];
    if (!newTrack) {
        console.warn('[Skeleton] animation not found: ' + name);
        return;
    }
    if (blendTime && this.currentAnim) {
        // 简单实现:从当前位置跳到新动画(后续可加线性插值 blend)
        this._captureFromCurrent();
    }
    this.currentAnim = newTrack;
    this.currentAnimName = name;
    this.elapsed = 0;
};

// 从当前帧捕获所有骨骼状态作为新动画的起点(简化 blend)
Skeleton.prototype._captureFromCurrent = function() {
    var capture = {};
    for (var name in this.bones) {
        var b = this.bones[name];
        capture[name] = { rotation: b.rotation, x: b.x, y: b.y, scaleX: b.scaleX, scaleY: b.scaleY };
    }
    this._blendFromPose = capture;
    this._blendTime = 0;
};

// 帧更新
Skeleton.prototype.update = function(dt) {
    this.elapsed += dt * this.speed;
    var track = this.currentAnim;
    if (!track) return;
    if (this.elapsed >= track.duration) {
        if (track.loop) {
            this.elapsed = this.elapsed % track.duration;
        } else {
            this.elapsed = track.duration;
            // 不回调,留给 next 帧继续保持在末帧
        }
    }
    // 对每根骨头,根据当前 elapsed 在其轨道里插值
    var self = this;
    for (var boneName in track.tracks) {
        var keys = track.tracks[boneName];
        var bone = this.bones[boneName];
        if (!bone || keys.length === 0) continue;
        // 二分查找 t 前后的两个关键帧
        var prev = null, next = null;
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].time <= this.elapsed) prev = keys[i];
            if (keys[i].time > this.elapsed) { next = keys[i]; break; }
        }
        var t = this.elapsed;
        if (!prev) prev = keys[0];
        if (!next) next = keys[keys.length - 1];
        // 插值系数
        var lerp = 1;
        if (next !== prev) {
            lerp = (t - prev.time) / (next.time - prev.time);
            // 平滑
            lerp = lerp * lerp * (3 - 2 * lerp);
        }
        // 应用插值
        var pRest = bone.restRotation;
        bone.rotation = lerpAngle(prev.props.rotation != null ? prev.props.rotation : (next.props.rotation != null ? next.props.rotation : pRest),
                                   next.props.rotation != null ? next.props.rotation : prev.props.rotation != null ? prev.props.rotation : pRest, lerp);
        bone.scaleX = lerpNum(prev.props.scaleX != null ? prev.props.scaleX : (next.props.scaleX != null ? next.props.scaleX : bone.restScaleX),
                              next.props.scaleX != null ? next.props.scaleX : prev.props.scaleX != null ? prev.props.scaleX : bone.restScaleX, lerp);
        bone.scaleY = lerpNum(prev.props.scaleY != null ? prev.props.scaleY : (next.props.scaleY != null ? next.props.scaleY : bone.restScaleY),
                              next.props.scaleY != null ? next.props.scaleY : prev.props.scaleY != null ? prev.props.scaleY : bone.restScaleY, lerp);
        if (prev.props.x != null || next.props.x != null) {
            bone.x = lerpNum(prev.props.x != null ? prev.props.x : bone.restX,
                             next.props.x != null ? next.props.x : prev.props.x != null ? prev.props.x : bone.restX, lerp);
        }
        if (prev.props.y != null || next.props.y != null) {
            bone.y = lerpNum(prev.props.y != null ? prev.props.y : bone.restY,
                             next.props.y != null ? next.props.y : prev.props.y != null ? prev.props.y : bone.restY, lerp);
        }
    }
    // 重算世界变换
    this.updateWorldTransforms();
};

// 从 root 开始递推世界变换
Skeleton.prototype.updateWorldTransforms = function() {
    if (!this.root) return;
    // 初始调用:parentCos=1 (无旋转), parentSin=0, parentScaleX/Y=1 (无缩放), parentX/Y=skel.posX/posY (世界锚点)
    traverseAndUpdateWorld(this.root, 1, 0, 1, 1, this.posX, this.posY);
};

function traverseAndUpdateWorld(bone, parentCos, parentSin, parentScaleX, parentScaleY, parentX, parentY) {
    // 局部变换 → 世界变换
    // 旋转 + 平移 + 缩放复合
    var lr = bone.rotation;
    var lcos = Math.cos(lr);
    var lsin = Math.sin(lr);
    // 局部位置(旋转后)
    var lx = bone.x * parentScaleX;
    var ly = bone.y * parentScaleY;
    // 复合旋转(父旋转 + 局部旋转)
    var wcos = parentCos * lcos - parentSin * lsin;
    var wsin = parentCos * lsin + parentSin * lcos;
    var wScaleX = parentScaleX * bone.scaleX;
    var wScaleY = parentScaleY * bone.scaleY;
    // 世界位置 = 父位置 + 旋转后的局部位置
    var wx = parentX + lx * parentCos - ly * parentSin;
    var wy = parentY + lx * parentSin + ly * parentCos;
    bone._worldX = wx;
    bone._worldY = wy;
    bone._worldRotation = Math.atan2(wsin, wcos);
    bone._worldScaleX = wScaleX;
    bone._worldScaleY = wScaleY;
    bone._worldCos = wcos;
    bone._worldSin = wsin;
    // 子骨骼
    for (var i = 0; i < bone.children.length; i++) {
        traverseAndUpdateWorld(bone.children[i], wcos, wsin, wScaleX, wScaleY, wx, wy);
    }
}

// 渲染(遍历所有骨头,执行 attachment.draw)
Skeleton.prototype.render = function(ctx) {
    if (!this.root) return;
    this.root.traverse(function(bone) {
        if (bone.attachment && bone.attachment.draw) {
            bone.attachment.draw(ctx, bone._worldX, bone._worldY, bone._worldRotation, bone._worldScaleX, bone._worldScaleY);
        }
    });
};

// ============================================================
// 程序化动画生成器(给骨架生成 5 套动画)
// ============================================================
var SkeletonAnimGen = {
    /**
     * idle:全身微微呼吸 + 头轻摆 + 双臂轻摇(0.8s 循环)
     */
    generateIdle: function(skel) {
        var t = new AnimationTrack('idle', 1.6, true);
        // 身体呼吸(scaleY 起伏) v2.6.2: 加大幅度,让 idle 动画肉眼可辨
        t.addKey('body', 0,    { scaleY: 0.96 });
        t.addKey('body', 0.8,  { scaleY: 1.12 });
        t.addKey('body', 1.6,  { scaleY: 0.96 });
        // 头轻摆(rotation 摆动) v2.6.2: 加大
        t.addKey('head', 0,    { rotation: -0.18 });
        t.addKey('head', 0.8,  { rotation: 0.18 });
        t.addKey('head', 1.6,  { rotation: -0.18 });
        // 双臂轻摇 v2.6.2: 加大
        t.addKey('arm_L', 0,   { rotation: -0.15 });
        t.addKey('arm_L', 0.8, { rotation: 0.15 });
        t.addKey('arm_L', 1.6, { rotation: -0.15 });
        t.addKey('arm_R', 0,   { rotation: 0.15 });
        t.addKey('arm_R', 0.8, { rotation: -0.15 });
        t.addKey('arm_R', 1.6, { rotation: 0.15 });
        // 双腿错位摆动(走路感) v2.6.2: 加大
        t.addKey('leg_L', 0,   { rotation: -0.12 });
        t.addKey('leg_L', 0.4, { rotation: 0.12 });
        t.addKey('leg_L', 0.8, { rotation: -0.12 });
        t.addKey('leg_L', 1.2, { rotation: 0.12 });
        t.addKey('leg_L', 1.6, { rotation: -0.12 });
        t.addKey('leg_R', 0,   { rotation: 0.12 });
        t.addKey('leg_R', 0.4, { rotation: -0.12 });
        t.addKey('leg_R', 0.8, { rotation: 0.12 });
        t.addKey('leg_R', 1.2, { rotation: -0.12 });
        t.addKey('leg_R', 1.6, { rotation: 0.12 });
        skel.addAnimation(t);
        return t;
    },

    /**
     * attack: 预备 + 挥击 + 收回 (0.4s, isAlly=true 右臂挥向右方, false 反之)
     *   攻击命中时间: ~0.25s 处
     */
    generateAttack: function(skel, isAlly) {
        var t = new AnimationTrack('attack', 0.45, false);
        var dir = isAlly ? 1 : -1;
        // 右臂: 蓄力(上举) → 挥击(横扫) → 收回
        t.addKey('arm_R', 0,    { rotation: 0 });
        t.addKey('arm_R', 0.10, { rotation: dir * -1.6 });    // 上举蓄力
        t.addKey('arm_R', 0.25, { rotation: dir * 1.2 });     // 横扫(命中帧)
        t.addKey('arm_R', 0.45, { rotation: 0 });              // 收回
        // 身体: 蓄力后仰 → 挥击前倾
        t.addKey('body', 0,    { x: 0 });
        t.addKey('body', 0.10, { x: -dir * 4 });
        t.addKey('body', 0.25, { x: dir * 10 });
        t.addKey('body', 0.45, { x: 0 });
        // 头跟随身体
        t.addKey('head', 0,    { rotation: 0 });
        t.addKey('head', 0.10, { rotation: dir * -0.15 });
        t.addKey('head', 0.25, { rotation: dir * 0.10 });
        t.addKey('head', 0.45, { rotation: 0 });
        skel.addAnimation(t);
        return t;
    },

    /**
     * hit: 后仰 + 闪白 (0.3s)
     */
    generateHit: function(skel, hitDir) {
        hitDir = hitDir || 1;
        var t = new AnimationTrack('hit', 0.3, false);
        // 身体后仰
        t.addKey('body', 0,    { x: 0 });
        t.addKey('body', 0.08, { x: -hitDir * 8, scaleY: 1.05 });
        t.addKey('body', 0.20, { x: -hitDir * 4, scaleY: 1.02 });
        t.addKey('body', 0.30, { x: 0, scaleY: 1 });
        // 头后仰
        t.addKey('head', 0,    { rotation: 0 });
        t.addKey('head', 0.08, { rotation: -hitDir * 0.4 });
        t.addKey('head', 0.20, { rotation: -hitDir * 0.2 });
        t.addKey('head', 0.30, { rotation: 0 });
        // 双臂展开
        t.addKey('arm_L', 0,   { rotation: 0 });
        t.addKey('arm_L', 0.08, { rotation: -hitDir * 0.6 });
        t.addKey('arm_L', 0.30, { rotation: 0 });
        t.addKey('arm_R', 0,   { rotation: 0 });
        t.addKey('arm_R', 0.08, { rotation: hitDir * 0.6 });
        t.addKey('arm_R', 0.30, { rotation: 0 });
        // 双腿叉开
        t.addKey('leg_L', 0,   { rotation: 0 });
        t.addKey('leg_L', 0.08, { rotation: -hitDir * 0.2 });
        t.addKey('leg_L', 0.30, { rotation: 0 });
        t.addKey('leg_R', 0,   { rotation: 0 });
        t.addKey('leg_R', 0.08, { rotation: hitDir * 0.2 });
        t.addKey('leg_R', 0.30, { rotation: 0 });
        skel.addAnimation(t);
        return t;
    },

    /**
     * cast: 双手举起 + 后仰(法师/贤者施法, 0.6s)
     */
    generateCast: function(skel) {
        var t = new AnimationTrack('cast', 0.6, false);
        // 双臂上举
        t.addKey('arm_L', 0,    { rotation: 0 });
        t.addKey('arm_L', 0.30, { rotation: -1.4 });
        t.addKey('arm_L', 0.60, { rotation: 0 });
        t.addKey('arm_R', 0,    { rotation: 0 });
        t.addKey('arm_R', 0.30, { rotation: -1.4 });
        t.addKey('arm_R', 0.60, { rotation: 0 });
        // 身体微仰
        t.addKey('body', 0,    { x: 0, scaleY: 1 });
        t.addKey('body', 0.30, { scaleY: 1.05 });
        t.addKey('body', 0.60, { scaleY: 1 });
        // 头上仰
        t.addKey('head', 0,    { rotation: 0 });
        t.addKey('head', 0.30, { rotation: 0.15 });
        t.addKey('head', 0.60, { rotation: 0 });
        skel.addAnimation(t);
        return t;
    },

    /**
     * die: 倒下 + 缩小 (0.5s, 单次)
     */
    generateDie: function(skel) {
        var t = new AnimationTrack('die', 0.5, false);
        // 整个身体顺时针倒下
        t.addKey('body', 0,    { rotation: 0, scaleX: 1, scaleY: 1 });
        t.addKey('body', 0.30, { rotation: 1.2, scaleX: 0.95, scaleY: 0.95 });
        t.addKey('body', 0.50, { rotation: 1.57, scaleX: 0.85, scaleY: 0.85 });
        // 头下垂
        t.addKey('head', 0,    { rotation: 0 });
        t.addKey('head', 0.30, { rotation: 0.5 });
        t.addKey('head', 0.50, { rotation: 0.8 });
        // 双臂摊开
        t.addKey('arm_L', 0,   { rotation: 0 });
        t.addKey('arm_L', 0.30, { rotation: 0.8 });
        t.addKey('arm_L', 0.50, { rotation: 1.2 });
        t.addKey('arm_R', 0,   { rotation: 0 });
        t.addKey('arm_R', 0.30, { rotation: -0.8 });
        t.addKey('arm_R', 0.50, { rotation: -1.2 });
        skel.addAnimation(t);
        return t;
    },

    /**
     * summon: 从下涌出 + 弹到正常位置 (0.4s)
     */
    generateSpawn: function(skel) {
        var t = new AnimationTrack('spawn', 0.4, false);
        // 身体从地面升起(scaleY 0→1)
        t.addKey('body', 0,    { scaleY: 0.1, scaleX: 1.2, rotation: 0 });
        t.addKey('body', 0.20, { scaleY: 1.15, scaleX: 0.95, rotation: 0 });
        t.addKey('body', 0.40, { scaleY: 1, scaleX: 1, rotation: 0 });
        // 头甩一下
        t.addKey('head', 0,    { rotation: 0 });
        t.addKey('head', 0.10, { rotation: -0.4 });
        t.addKey('head', 0.20, { rotation: 0.3 });
        t.addKey('head', 0.40, { rotation: 0 });
        // 双臂展开收回
        t.addKey('arm_L', 0,   { rotation: -1.5 });
        t.addKey('arm_L', 0.20, { rotation: 0.3 });
        t.addKey('arm_L', 0.40, { rotation: 0 });
        t.addKey('arm_R', 0,   { rotation: 1.5 });
        t.addKey('arm_R', 0.20, { rotation: -0.3 });
        t.addKey('arm_R', 0.40, { rotation: 0 });
        skel.addAnimation(t);
        return t;
    }
};

// ============================================================
// 工具函数
// ============================================================
function lerpNum(a, b, t) { return a + (b - a) * t; }
function lerpAngle(a, b, t) {
    // 角度最短路径插值(弧度)
    var diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
}