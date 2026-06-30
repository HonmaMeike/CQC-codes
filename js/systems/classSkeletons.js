// ========== 8 职业骨骼工厂 ==========
// 给每个职业生成一致的骨骼树(8 根骨头:body/head/arm_L/arm_R/leg_L/leg_R),
// 然后挂上程序化 sprite 附件,实现"程序化骨骼动画 + 现有精灵贴图"
//
// 所有骨头坐标基于"中心点"(0,0)处,root 是身体中心
// 8 根骨头:
//   body    (中心,锚点)
//   head    (-18 上方)
//   arm_L   (-10,-8 左侧上臂)
//   arm_R   ( 10,-8 右侧上臂)  ← 攻击用这根
//   leg_L   (-5, 12 左腿)
//   leg_R   ( 5, 12 右腿)

// 通用骨架构建器(给一个 classId,生成全套)
function buildClassSkeleton(classId, opts) {
    opts = opts || {};
    var skel = new Skeleton();
    // 根骨头 = 身体中心
    var body = new Bone('body', { x: 0, y: 0, length: 18 });
    skel.addBone(body);
    // 头(身体上方)
    body.addChild(new Bone('head', { x: 0, y: -18, length: 14 }));
    // 双臂(身体两侧上方)
    body.addChild(new Bone('arm_L', { x: -8, y: -6, length: 10 }));
    body.addChild(new Bone('arm_R', { x: 8, y: -6, length: 10 }));
    // 双腿(身体下方)
    body.addChild(new Bone('leg_L', { x: -4, y: 12, length: 12 }));
    body.addChild(new Bone('leg_R', { x: 4, y: 12, length: 12 }));
    // 通用附件挂载
    var baseScale = opts.scale || 1;
    skel.baseScale = baseScale;
    skel.classId = classId;
    attachClassSprites(skel, classId, opts.color || null, baseScale, !!opts.flipX);
    // 注册 5 套基础动画
    SkeletonAnimGen.generateIdle(skel);
    SkeletonAnimGen.generateAttack(skel, opts.isAlly !== false);
    SkeletonAnimGen.generateHit(skel, opts.hitDir || 1);
    SkeletonAnimGen.generateDie(skel);
    if (opts.withCast !== false) {
        SkeletonAnimGen.generateCast(skel);
    }
    if (opts.withSpawn !== false) {
        SkeletonAnimGen.generateSpawn(skel);
    }
    // 默认播放 idle
    skel.playAnimation('idle');
    return skel;
}

// 给骨架挂附件(把每个骨头绑定到一个 sprite 绘制函数)
// v7.9: 只让 body 骨头画全身 PNG sprite,其他骨头不画(已禁用关节球)
function attachClassSprites(skel, classId, color, scale, flipX) {
    scale = scale || 1;
    var drawFn = null;
    switch (classId) {
        case 'knight':       drawFn = SpriteRenderer.drawKnightToon.bind(SpriteRenderer); break;
        case 'mage':         drawFn = SpriteRenderer.drawMageToon.bind(SpriteRenderer); break;
        case 'assassin':     drawFn = SpriteRenderer.drawAssassinToon.bind(SpriteRenderer); break;
        case 'summoner':     drawFn = SpriteRenderer.drawSummonerToon.bind(SpriteRenderer); break;
        case 'warrior':      drawFn = SpriteRenderer.drawWarriorToon.bind(SpriteRenderer); break;
        case 'sage':         drawFn = SpriteRenderer.drawSageToon.bind(SpriteRenderer); break;
        case 'necromancer':  drawFn = SpriteRenderer.drawNecromancerToon.bind(SpriteRenderer); break;
        case 'swordsman':    drawFn = SpriteRenderer.drawSwordsmanToon.bind(SpriteRenderer); break;
        default:             drawFn = SpriteRenderer.drawGenericHero.bind(SpriteRenderer); break;
    }
    skel.root.traverse(function(bone) {
        if (bone.name === 'body') {
            // body 骨头画 PNG 全身 sprite（委托 drawXxxToon，已改为优先 PNG）
            bone.attachment = {
                draw: function(ctx, wx, wy, wrot, wsx, wsy) {
                    try {
                        ctx.save();
                        ctx.translate(wx, wy);
                        ctx.rotate(wrot);
                        ctx.scale(scale * wsx, scale * wsy);
                        if (drawFn) {
                            drawFn(ctx, 0, 0, 24, color || '#4fc3f7');
                        } else {
                            ctx.fillStyle = color || '#4fc3f7';
                            ctx.beginPath();
                            ctx.arc(0, 0, 14, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.restore();
                    } catch (e) {
                        // ★ 必须 restore，否则 ctx.save/restore 栈被破坏，后续所有渲染失效
                        try { ctx.restore(); } catch (e2) {}
                    }
                }
            };
        } else {
            // 其他骨头 — 已禁用关节球(全身由 body 骨头的 PNG 渲染)
            bone.attachment = {
                draw: function(ctx, wx, wy, wrot, wsx, wsy) {
                    // no-op
                }
            };
        }
    });
}

// ============================================================
// 怪物通用骨架(简单 4 骨:身体 + 双臂 + 双腿,头并入身体)
// ============================================================
function buildMonsterSkeleton(monster, opts) {
    opts = opts || {};
    var skel = new Skeleton();
    var body = new Bone('body', { x: 0, y: 0, length: 18 });
    skel.addBone(body);
    body.addChild(new Bone('head', { x: 0, y: -16, length: 12 }));
    body.addChild(new Bone('arm_L', { x: -7, y: -4, length: 9 }));
    body.addChild(new Bone('arm_R', { x: 7, y: -4, length: 9 }));
    body.addChild(new Bone('leg_L', { x: -3, y: 11, length: 11 }));
    body.addChild(new Bone('leg_R', { x: 3, y: 11, length: 11 }));
    var scale = opts.scale || 1;
    skel.baseScale = scale;
    skel.isMonster = true;
    // 怪物挂载:用 SpriteRenderer.drawMonsterSprite (name, color, isFriend, elite)
    //   v7.9: 只让 body 骨头画全身 PNG sprite,其他骨头已禁用关节球
    var mName = monster.name || '';
    var isFriend = !!monster.friend;
    var isElite = !!monster.elite;
    skel.root.traverse(function(bone) {
        if (bone.name === 'body') {
            bone.attachment = {
                draw: function(ctx, wx, wy, wrot, wsx, wsy) {
                    try {
                        ctx.save();
                        ctx.translate(wx, wy);
                        ctx.rotate(wrot);
                        ctx.scale(scale * wsx, scale * wsy);
                        SpriteRenderer.drawMonsterSprite(ctx, mName, 0, 0, 24, '#f44336', isElite, isFriend);
                        ctx.restore();
                    } catch (e) {
                        // 静默容错 + 画可见的红色圆形作为兜底
                        try { ctx.restore(); } catch (e2) {}
                        ctx.save();
                        ctx.fillStyle = '#f44336';
                        ctx.beginPath();
                        ctx.arc(wx, wy, 24 * scale, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                }
            };
        } else {
            // 其他骨头 — 已禁用关节球
            bone.attachment = {
                draw: function(ctx, wx, wy, wrot, wsx, wsy) {
                    // no-op
                }
            };
        }
    });
    SkeletonAnimGen.generateIdle(skel);
    SkeletonAnimGen.generateAttack(skel, false);
    SkeletonAnimGen.generateHit(skel, opts.hitDir || -1);
    SkeletonAnimGen.generateDie(skel);
    SkeletonAnimGen.generateSpawn(skel);
    skel.playAnimation('idle');
    return skel;
}

// ============================================================
// 召唤物骨架(基于怪物的简化版 + 紫色染色)
// ============================================================
function buildSummonSkeleton(summon, opts) {
    opts = opts || {};
    var skel = new Skeleton();
    var body = new Bone('body', { x: 0, y: 0, length: 16 });
    skel.addBone(body);
    body.addChild(new Bone('head', { x: 0, y: -14, length: 11 }));
    body.addChild(new Bone('arm_L', { x: -6, y: -3, length: 8 }));
    body.addChild(new Bone('arm_R', { x: 6, y: -3, length: 8 }));
    body.addChild(new Bone('leg_L', { x: -2, y: 10, length: 10 }));
    body.addChild(new Bone('leg_R', { x: 2, y: 10, length: 10 }));
    var scale = opts.scale || 1;
    skel.baseScale = scale;
    skel.isSummon = true;
    var summonType = summon.type || 'wolf';
    var drawKey = summonType === 'phoenix' ? 'phoenix_summon'
                : summonType === 'elemental' ? 'elemental_summon'
                : 'wolf_summon';
    skel.root.traverse(function(bone) {
        if (bone.name === 'body') {
            bone.attachment = {
                draw: function(ctx, wx, wy, wrot, wsx, wsy) {
                    ctx.save();
                    ctx.translate(wx, wy);
                    ctx.rotate(wrot);
                    ctx.scale(scale * wsx, scale * wsy);
                    SpriteRenderer.drawMonsterSprite(ctx, drawKey, 0, 0, 14, '#ce93d8', false, false);
                    ctx.restore();
                }
            };
        } else {
            // 召唤物其他骨头 — 已禁用关节球
            bone.attachment = {
                draw: function(ctx, wx, wy, wrot, wsx, wsy) {
                    // no-op
                }
            };
        }
    });
    SkeletonAnimGen.generateIdle(skel);
    SkeletonAnimGen.generateAttack(skel, true);
    SkeletonAnimGen.generateHit(skel, 1);
    SkeletonAnimGen.generateDie(skel);
    SkeletonAnimGen.generateSpawn(skel);
    skel.playAnimation('idle');
    return skel;
}
