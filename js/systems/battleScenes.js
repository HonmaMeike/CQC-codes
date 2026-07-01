// ========== 场景背景系统（从 battle.js 拆出） ==========
(function() {
    'use strict';
    if (typeof BattleManager === 'undefined') return;
    var __methods = {
// ======================== 场景背景系统 ========================
// 章节名 -> 场景类型 映射表
_stageSceneMap: {
    '新手草原': 'grassland', '幽暗森林': 'forest', '亡灵墓地': 'graveyard',
    '火焰山谷': 'volcano', '冰封雪原': 'ice', '远古遗迹': 'ruins',
    '深渊裂隙': 'abyss', '龙之巢穴': 'dragon', '神之领域': 'divine',
    '混沌边境': 'chaos', '虚空回廊': 'abyss', '星界走廊': 'star',
    '时间尽头': 'time', '永恒战场': 'battlefield', '末日火山': 'volcano',
    '风暴之眼': 'storm', '暗影国度': 'shadow', '水晶洞穴': 'crystal',
    '钢铁要塞': 'ruins', '翡翠林地': 'grassland', '熔火深渊': 'volcano',
    '霜冻王座': 'ice', '雷霆崖顶': 'storm', '迷雾沼泽': 'swamp',
    '幻境迷宫': 'labyrinth', '龙骨荒原': 'dragon', '恶魔城堡': 'demon',
    '天使圣殿': 'divine', '万神殿': 'divine', '起源之地': 'divine',
    '星辰之塔': 'star', '无尽炼狱': 'volcano', '轮回之境': 'time',
    '创世之柱': 'divine', '黄昏之谷': 'shadow', '黎明之峰': 'sky',
    '永恒之井': 'sea', '命运之轮': 'time', '混沌之源': 'chaos',
    '秩序之巅': 'divine', '虚无之界': 'abyss', '初始之火': 'divine',
    '终焉之海': 'sea', '奇迹之原': 'grassland', '深渊之底': 'abyss',
    '苍穹之上': 'sky', '万象之门': 'divine', '归一之地': 'divine',
    // === Ch49-60 圣光神界篇 ===
    '圣光之境': 'divine', '远古神坛': 'divine', '圣火祭坛': 'divine',
    '神木圣林': 'forest', '神圣泉源': 'sea', '圣战遗迹': 'ruins',
    '光明王座': 'divine', '圣光陨落': 'sky', '神裔战痕': 'battlefield',
    '圣堂深渊': 'abyss', '神谕之塔': 'star', '圣典之库': 'ruins',
    // === Ch61-70 时空秘境篇 ===
    '镜面之海': 'sea', '倒影都市': 'ruins', '镜像战场': 'battlefield',
    '时间漩涡': 'time', '过去之门': 'time', '未来之城': 'ruins',
    '时之沙海': 'sea', '因果之环': 'labyrinth', '命运神殿': 'divine',
    '时空尽头': 'time',
    // === Ch71-80 元素本源篇 ===
    '火焰本源': 'volcano', '寒冰本源': 'ice', '雷霆本源': 'storm',
    '暗影本源': 'shadow', '光明本源': 'divine', '风之圣殿': 'sky',
    '大地之心': 'ruins', '圣水之渊': 'sea', '元素交汇': 'chaos',
    '元初混沌': 'chaos',
    // === Ch81-90 魔界深渊篇 ===
    '魔界之门': 'demon', '暗影王座': 'demon', '血池炼狱': 'volcano',
    '冥河之畔': 'sea', '幽冥都城': 'shadow', '恶魔战场': 'battlefield',
    '魔龙深渊': 'dragon', '混沌魔殿': 'chaos', '终极魔影': 'shadow',
    '魔界之心': 'demon',
    // === Ch91-100 终焉与新生篇 ===
    '终焉之地': 'sky', '创世残响': 'star', '虚无深渊': 'abyss',
    '星辰寂灭': 'star', '宇宙崩裂': 'chaos', '永恒终末': 'shadow',
    '涅槃之火': 'volcano', '重生原野': 'grassland', '万象归一': 'divine',
    '创世原点': 'star'
},
// 确定性伪随机函数
_detRand: function(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
},
// 1. 草原场景 - 蓝天/白云/远山/花草
_drawSceneGrassland: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#5fb0e8'); sky.addColorStop(0.6, '#9dd9f3'); sky.addColorStop(1, '#d9f0ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 太阳
    var sg = ctx.createRadialGradient(w*0.82, h*0.15, 0, w*0.82, h*0.15, 28);
    sg.addColorStop(0, 'rgba(255,240,180,0.95)'); sg.addColorStop(0.5, 'rgba(255,220,120,0.4)'); sg.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(w*0.82, h*0.15, 28, 0, Math.PI*2); ctx.fill();
    // 云朵
    var self = this;
    var drawCloud = function(cx, cy, scale) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(cx, cy, 14*scale, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+10*scale, cy-4*scale, 12*scale, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+20*scale, cy+2*scale, 10*scale, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx-10*scale, cy+3*scale, 10*scale, 0, Math.PI*2); ctx.fill();
    };
    drawCloud(w*0.18, h*0.1, 1); drawCloud(w*0.5, h*0.07, 0.8); drawCloud(w*0.78, h*0.22, 0.7);
    // 远山
    ctx.fillStyle = 'rgba(80,140,100,0.3)';
    ctx.beginPath(); ctx.moveTo(0, groundY);
    for (var m = 0; m < 10; m++) { ctx.lineTo(w*m/10, groundY - 15 - Math.sin(m*1.2)*20); }
    ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
    // 草地
    var grass = ctx.createLinearGradient(0, groundY, 0, h);
    grass.addColorStop(0, '#5cb044'); grass.addColorStop(1, '#3a8528');
    ctx.fillStyle = grass; ctx.fillRect(0, groundY, w, h - groundY);
    // 花草
    var fcols = ['#ff6b8a', '#ffd54f', '#ba68c8', '#fff176', '#ff8a65'];
    for (var f = 0; f < 14; f++) {
        ctx.fillStyle = fcols[f % 5];
        var fx = self._detRand(stage*100+f*3)*w*0.95;
        var fy = groundY + 6 + self._detRand(stage*100+f*3+1)*(h-groundY-12);
        ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI*2); ctx.fill();
    }
    // 草丛
    ctx.strokeStyle = 'rgba(40,120,30,0.6)'; ctx.lineWidth = 1;
    for (var g = 0; g < 18; g++) {
        var gx = self._detRand(stage*200+g*3)*w;
        var gy = groundY + 3 + self._detRand(stage*200+g*3+1)*(h-groundY-8);
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx-1, gy-5); ctx.moveTo(gx, gy); ctx.lineTo(gx+1, gy-5); ctx.stroke();
    }
},
// 2. 森林场景 - 高大树木/光斑/蘑菇
_drawSceneForest: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#1a3a2a'); sky.addColorStop(0.6, '#2d4f3a'); sky.addColorStop(1, '#4a6b4a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 光柱
    var self = this;
    for (var l = 0; l < 5; l++) {
        var lg = ctx.createLinearGradient(w*l/5+10, 0, w*l/5+30, groundY);
        lg.addColorStop(0, 'rgba(255,240,180,0.12)'); lg.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = lg; ctx.fillRect(w*l/5+5, 0, 25, groundY);
    }
    // 远景树
    ctx.fillStyle = 'rgba(20,50,30,0.4)';
    for (var t = 0; t < 6; t++) {
        var tx = self._detRand(stage*10+t)*w;
        var th = 50 + self._detRand(stage*10+t+1)*40;
        ctx.fillRect(tx, groundY-th*0.3, 4, th*0.3);
        ctx.beginPath(); ctx.arc(tx+2, groundY-th*0.3, th*0.25, 0, Math.PI*2); ctx.fill();
    }
    // 地面
    ctx.fillStyle = '#2d4a2d'; ctx.fillRect(0, groundY, w, h-groundY);
    // 树木（前景）
    for (var t2 = 0; t2 < 4; t2++) {
        var tx2 = w*0.15 + t2*w*0.22;
        // 树干
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(tx2-5, groundY-80, 10, 80);
        // 树冠
        ctx.fillStyle = '#1a3a1a';
        ctx.beginPath(); ctx.arc(tx2, groundY-80, 28, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0d2d0d';
        ctx.beginPath(); ctx.arc(tx2-8, groundY-70, 22, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx2+8, groundY-90, 22, 0, Math.PI*2); ctx.fill();
    }
    // 蘑菇
    for (var m2 = 0; m2 < 6; m2++) {
        var mx = self._detRand(stage*20+m2)*w*0.95;
        var my = groundY + 10 + self._detRand(stage*20+m2+1)*(h-groundY-20);
        ctx.fillStyle = '#fff5e6'; ctx.fillRect(mx-1, my, 2, 5);
        ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(mx, my, 4, Math.PI, 0); ctx.fill();
    }
},
// 3. 墓地场景 - 墓碑/枯树/乌鸦/月色
_drawSceneGraveyard: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#0a0a1a'); sky.addColorStop(0.5, '#1a1a3a'); sky.addColorStop(1, '#2a1a3a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 月亮
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath(); ctx.arc(w*0.85, h*0.12, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath(); ctx.arc(w*0.85+5, h*0.12, 16, 0, Math.PI*2); ctx.fill();
    // 星星
    var self = this;
    ctx.fillStyle = 'rgba(255,255,200,0.7)';
    for (var s = 0; s < 25; s++) {
        var sx = self._detRand(stage*30+s)*w; var sy = self._detRand(stage*30+s+1)*groundY*0.6;
        ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI*2); ctx.fill();
    }
    // 地面
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, groundY, w, h-groundY);
    // 枯树
    ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w*0.15, h); ctx.lineTo(w*0.15, groundY-60);
    ctx.moveTo(w*0.15, groundY-50); ctx.lineTo(w*0.1, groundY-70);
    ctx.moveTo(w*0.15, groundY-50); ctx.lineTo(w*0.2, groundY-75);
    ctx.stroke();
    // 墓碑
    for (var g = 0; g < 5; g++) {
        var gx = w*0.1 + g*w*0.18;
        var gh = 18 + self._detRand(stage*40+g)*8;
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(gx-4, groundY-gh, 8, gh);
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath(); ctx.arc(gx, groundY-gh, 5, Math.PI, 0); ctx.fill();
        // 墓碑文字
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(gx-2, groundY-gh+8, 4, 4);
    }
    // 雾气
    var fog = ctx.createLinearGradient(0, groundY-10, 0, h);
    fog.addColorStop(0, 'rgba(80,80,100,0.2)'); fog.addColorStop(1, 'rgba(80,80,100,0)');
    ctx.fillStyle = fog; ctx.fillRect(0, groundY-10, w, 20);
},
// 4. 火山场景 - 红色天空/熔岩/烟雾
_drawSceneVolcano: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#3a0a0a'); sky.addColorStop(0.5, '#7a2a0a'); sky.addColorStop(1, '#c64a0a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 远景火山
    ctx.fillStyle = '#2a0808';
    ctx.beginPath(); ctx.moveTo(0, groundY);
    ctx.lineTo(w*0.25, groundY-60); ctx.lineTo(w*0.35, groundY-90);
    ctx.lineTo(w*0.4, groundY-100); ctx.lineTo(w*0.5, groundY-90); ctx.lineTo(w*0.6, groundY-70);
    ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
    // 熔岩顶
    var lava = ctx.createRadialGradient(w*0.4, groundY-95, 0, w*0.4, groundY-95, 15);
    lava.addColorStop(0, '#fff5b0'); lava.addColorStop(0.4, '#ff8800'); lava.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = lava; ctx.beginPath(); ctx.arc(w*0.4, groundY-95, 15, 0, Math.PI*2); ctx.fill();
    // 烟雾
    var self = this;
    for (var sm = 0; sm < 6; sm++) {
        var sx2 = self._detRand(stage*50+sm)*w; var sy2 = self._detRand(stage*50+sm+1)*groundY*0.5;
        var smg = ctx.createRadialGradient(sx2, sy2, 0, sx2, sy2, 30);
        smg.addColorStop(0, 'rgba(100,100,100,0.3)'); smg.addColorStop(1, 'rgba(100,100,100,0)');
        ctx.fillStyle = smg; ctx.beginPath(); ctx.arc(sx2, sy2, 30, 0, Math.PI*2); ctx.fill();
    }
    // 地面
    var ground = ctx.createLinearGradient(0, groundY, 0, h);
    ground.addColorStop(0, '#4a1a0a'); ground.addColorStop(1, '#1a0808');
    ctx.fillStyle = ground; ctx.fillRect(0, groundY, w, h-groundY);
    // 熔岩裂缝
    ctx.fillStyle = 'rgba(255,150,0,0.7)';
    for (var cr = 0; cr < 3; cr++) {
        var cx = w*0.1 + cr*w*0.3;
        ctx.beginPath(); ctx.moveTo(cx, groundY+5);
        ctx.quadraticCurveTo(cx+8, groundY, cx+15, groundY+5);
        ctx.quadraticCurveTo(cx+22, groundY+10, cx+30, groundY+5);
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffaa00'; ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = '#fff5b0'; ctx.stroke();
    }
},
// 5. 冰原场景 - 雪地/雪花/冰晶
_drawSceneIce: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#b8d4e8'); sky.addColorStop(0.6, '#d0e0f0'); sky.addColorStop(1, '#e8f0f8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 雪山
    ctx.fillStyle = '#a0b8d0';
    ctx.beginPath(); ctx.moveTo(0, groundY);
    for (var m3 = 0; m3 < 8; m3++) { ctx.lineTo(w*m3/8, groundY - 30 - Math.sin(m3*1.5)*40); }
    ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
    // 雪地
    var ground2 = ctx.createLinearGradient(0, groundY, 0, h);
    ground2.addColorStop(0, '#e8f0f8'); ground2.addColorStop(1, '#a0b8d0');
    ctx.fillStyle = ground2; ctx.fillRect(0, groundY, w, h-groundY);
    // 雪花
    var self = this;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (var sn = 0; sn < 30; sn++) {
        var sx3 = self._detRand(stage*60+sn)*w; var sy3 = self._detRand(stage*60+sn+1)*(groundY+20);
        ctx.beginPath(); ctx.arc(sx3, sy3, 1.5, 0, Math.PI*2); ctx.fill();
    }
    // 冰晶
    for (var ic = 0; ic < 5; ic++) {
        var ix = self._detRand(stage*70+ic)*w; var iy = groundY+5+self._detRand(stage*70+ic+1)*(h-groundY-15);
        ctx.fillStyle = 'rgba(180,220,255,0.6)';
        ctx.beginPath(); ctx.moveTo(ix, iy-8); ctx.lineTo(ix+3, iy); ctx.lineTo(ix, iy+8); ctx.lineTo(ix-3, iy); ctx.closePath(); ctx.fill();
    }
},
// 6. 遗迹场景 - 残柱/藤蔓/瓦砾
_drawSceneRuins: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#3a3a2a'); sky.addColorStop(0.5, '#5a5a3a'); sky.addColorStop(1, '#7a7a4a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 远山
    ctx.fillStyle = 'rgba(80,80,60,0.5)';
    ctx.beginPath(); ctx.moveTo(0, groundY);
    for (var m4 = 0; m4 < 6; m4++) { ctx.lineTo(w*m4/6, groundY - 20 - Math.sin(m4*2)*25); }
    ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
    // 地面
    ctx.fillStyle = '#4a4a3a'; ctx.fillRect(0, groundY, w, h-groundY);
    // 石柱
    for (var r = 0; r < 4; r++) {
        var rx = w*0.12 + r*w*0.25;
        var colH = 40 + (r%2)*15;
        ctx.fillStyle = '#6a6a5a';
        ctx.fillRect(rx-4, groundY-colH, 8, colH);
        // 柱头
        ctx.fillStyle = '#7a7a6a';
        ctx.fillRect(rx-8, groundY-colH, 16, 5);
        // 裂纹
        ctx.strokeStyle = '#3a3a2a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rx, groundY); ctx.lineTo(rx+2, groundY-colH); ctx.stroke();
        // 藤蔓
        ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(rx-3, groundY-5);
        for (var v = 0; v < 4; v++) { ctx.lineTo(rx-3+Math.sin(v)*2, groundY-10-v*8); }
        ctx.stroke();
    }
    // 瓦砾
    var self = this;
    for (var s2 = 0; s2 < 8; s2++) {
        var sx4 = self._detRand(stage*80+s2)*w; var sy4 = groundY+self._detRand(stage*80+s2+1)*(h-groundY-5);
        ctx.fillStyle = '#5a5a4a';
        ctx.fillRect(sx4, sy4, 4+self._detRand(stage*80+s2+2)*4, 3);
    }
},
// 7. 深渊场景 - 黑色虚空/紫光
_drawSceneAbyss: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#000000'); sky.addColorStop(0.5, '#0a0010'); sky.addColorStop(1, '#1a0020');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 紫光裂缝
    var self = this;
    for (var cr2 = 0; cr2 < 4; cr2++) {
        var cx2 = self._detRand(stage*90+cr2)*w; var cy2 = self._detRand(stage*90+cr2+1)*groundY*0.8;
        var cg = ctx.createLinearGradient(cx2, cy2, cx2+20, cy2+30);
        cg.addColorStop(0, 'rgba(180,80,255,0.6)'); cg.addColorStop(1, 'rgba(180,80,255,0)');
        ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2+20, cy2+30); ctx.lineTo(cx2-3, cy2+30); ctx.closePath(); ctx.fill();
    }
    // 紫光
    var pg = ctx.createRadialGradient(w*0.5, groundY-20, 0, w*0.5, groundY-20, 80);
    pg.addColorStop(0, 'rgba(150,50,200,0.3)'); pg.addColorStop(1, 'rgba(150,50,200,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(w*0.5, groundY-20, 80, 0, Math.PI*2); ctx.fill();
    // 地面
    ctx.fillStyle = '#0a0010'; ctx.fillRect(0, groundY, w, h-groundY);
    // 裂纹
    ctx.strokeStyle = 'rgba(180,80,255,0.4)'; ctx.lineWidth = 1;
    for (var cr3 = 0; cr3 < 3; cr3++) {
        ctx.beginPath(); ctx.moveTo(self._detRand(stage*100+cr3)*w, groundY+5);
        ctx.lineTo(self._detRand(stage*100+cr3+1)*w, h); ctx.stroke();
    }
},
// 8. 龙巢场景 - 龙骨/金币堆
_drawSceneDragon: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#2a1a0a'); sky.addColorStop(0.5, '#4a2a0a'); sky.addColorStop(1, '#6a3a0a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 火光
    var fg = ctx.createRadialGradient(w*0.5, h*0.5, 0, w*0.5, h*0.5, 100);
    fg.addColorStop(0, 'rgba(255,100,30,0.3)'); fg.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(w*0.5, h*0.5, 100, 0, Math.PI*2); ctx.fill();
    // 龙骨
    var self = this;
    // 龙头
    ctx.fillStyle = '#e0d8c0';
    ctx.save(); ctx.translate(w*0.3, groundY-30); ctx.rotate(-0.3); ctx.scale(1, (12)/(18)); ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.restore(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w*0.3+15, groundY-35); ctx.lineTo(w*0.3+25, groundY-50); ctx.lineTo(w*0.3+18, groundY-30); ctx.closePath(); ctx.fill();
    // 龙脊椎
    ctx.strokeStyle = '#e0d8c0'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(w*0.3, groundY-25); ctx.quadraticCurveTo(w*0.5, groundY-50, w*0.7, groundY-30); ctx.stroke();
    // 龙刺
    for (var sp = 0; sp < 5; sp++) {
        var spx = w*0.32 + sp*w*0.1;
        ctx.beginPath(); ctx.moveTo(spx, groundY-35-sp*2); ctx.lineTo(spx-3, groundY-50-sp*3); ctx.lineTo(spx+3, groundY-50-sp*3); ctx.closePath(); ctx.fill();
    }
    // 地面
    ctx.fillStyle = '#3a2010'; ctx.fillRect(0, groundY, w, h-groundY);
    // 金币堆
    for (var co = 0; co < 40; co++) {
        var cox = self._detRand(stage*110+co)*w; var coy = groundY+self._detRand(stage*110+co+1)*(h-groundY-5);
        ctx.fillStyle = co%3===0 ? '#ffd700' : (co%3===1 ? '#ffb300' : '#cc9900');
        ctx.beginPath(); ctx.arc(cox, coy, 2, 0, Math.PI*2); ctx.fill();
    }
},
// 9. 神域场景 - 神圣光/金色云/浮岛
_drawSceneDivine: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#1a1a4a'); sky.addColorStop(0.4, '#4a3a6a'); sky.addColorStop(0.8, '#ffd700'); sky.addColorStop(1, '#fff8dc');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 神圣光柱
    var sg2 = ctx.createLinearGradient(w*0.3, 0, w*0.3, groundY);
    sg2.addColorStop(0, 'rgba(255,240,150,0.4)'); sg2.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = sg2; ctx.fillRect(w*0.25, 0, w*0.1, groundY);
    var sg3 = ctx.createLinearGradient(w*0.7, 0, w*0.7, groundY);
    sg3.addColorStop(0, 'rgba(255,240,150,0.4)'); sg3.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = sg3; ctx.fillRect(w*0.65, 0, w*0.1, groundY);
    // 金色云
    var self = this;
    var drawGoldCloud = function(cx, cy, sc) {
        ctx.fillStyle = 'rgba(255,215,0,0.5)';
        ctx.beginPath(); ctx.arc(cx, cy, 18*sc, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+15*sc, cy-5*sc, 14*sc, 0, Math.PI*2); ctx.fill();
    };
    drawGoldCloud(w*0.2, h*0.15, 1); drawGoldCloud(w*0.6, h*0.1, 0.9); drawGoldCloud(w*0.85, h*0.18, 0.7);
    // 浮岛
    ctx.fillStyle = '#8a7a4a';
    for (var fi = 0; fi < 2; fi++) {
        var fix = w*0.15 + fi*w*0.6; var fiy = h*0.25;
        ctx.save(); ctx.translate(fix, fiy); ctx.rotate(0); ctx.scale(1, (8)/(30)); ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*2); ctx.restore(); ctx.fill();
        ctx.fillStyle = '#6a8a3a';
        ctx.beginPath(); ctx.arc(fix, fiy-5, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#8a7a4a';
    }
    // 地面
    var g2 = ctx.createLinearGradient(0, groundY, 0, h);
    g2.addColorStop(0, '#d4af37'); g2.addColorStop(1, '#8a6a1a');
    ctx.fillStyle = g2; ctx.fillRect(0, groundY, w, h-groundY);
},
// 10. 混沌场景 - 紫黑漩涡
_drawSceneChaos: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#0a0010'); sky.addColorStop(0.5, '#2a0020'); sky.addColorStop(1, '#4a0040');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 漩涡
    var self = this;
    for (var wh = 0; wh < 3; wh++) {
        var cx3 = self._detRand(stage*120+wh)*w; var cy3 = self._detRand(stage*120+wh+1)*groundY*0.7;
        for (var ri = 0; ri < 4; ri++) {
            var rad = 10 + ri*8;
            ctx.strokeStyle = 'rgba(180,50,200,'+(0.5-ri*0.1)+')'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx3, cy3, rad, 0, Math.PI*2); ctx.stroke();
        }
    }
    // 地面
    ctx.fillStyle = '#1a0010'; ctx.fillRect(0, groundY, w, h-groundY);
    // 紫色闪电
    ctx.strokeStyle = 'rgba(200,100,255,0.5)'; ctx.lineWidth = 1.5;
    for (var lt = 0; lt < 3; lt++) {
        ctx.beginPath(); ctx.moveTo(self._detRand(stage*130+lt)*w, groundY);
        ctx.lineTo(self._detRand(stage*130+lt+1)*w, h); ctx.stroke();
    }
},
// 11. 星界场景 - 星空/星云/极光
_drawSceneStar: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#000010'); sky.addColorStop(0.5, '#0a0030'); sky.addColorStop(1, '#1a0a4a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 星云
    var ng = ctx.createRadialGradient(w*0.3, h*0.2, 0, w*0.3, h*0.2, 60);
    ng.addColorStop(0, 'rgba(150,100,255,0.4)'); ng.addColorStop(1, 'rgba(150,100,255,0)');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(w*0.3, h*0.2, 60, 0, Math.PI*2); ctx.fill();
    var ng2 = ctx.createRadialGradient(w*0.7, h*0.35, 0, w*0.7, h*0.35, 80);
    ng2.addColorStop(0, 'rgba(100,200,255,0.3)'); ng2.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = ng2; ctx.beginPath(); ctx.arc(w*0.7, h*0.35, 80, 0, Math.PI*2); ctx.fill();
    // 星星
    var self = this;
    for (var s3 = 0; s3 < 50; s3++) {
        var sx5 = self._detRand(stage*140+s3)*w; var sy5 = self._detRand(stage*140+s3+1)*groundY;
        var sr = self._detRand(stage*140+s3+2)*1.5+0.5;
        ctx.fillStyle = s3%5===0 ? '#ffeb3b' : (s3%5===1 ? '#b3e5fc' : '#fff');
        ctx.beginPath(); ctx.arc(sx5, sy5, sr, 0, Math.PI*2); ctx.fill();
        // 闪烁线
        if (s3%8 === 0) {
            ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(sx5-sr*3, sy5); ctx.lineTo(sx5+sr*3, sy5); ctx.stroke();
        }
    }
    // 地面
    ctx.fillStyle = '#0a0020'; ctx.fillRect(0, groundY, w, h-groundY);
},
// 12. 时间场景 - 齿轮/沙漏
_drawSceneTime: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#1a1a3a'); sky.addColorStop(0.5, '#3a3a5a'); sky.addColorStop(1, '#5a5a7a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 沙漏
    ctx.fillStyle = 'rgba(200,180,140,0.6)';
    ctx.beginPath(); ctx.moveTo(w*0.45, h*0.1); ctx.lineTo(w*0.55, h*0.1); ctx.lineTo(w*0.5, h*0.25); ctx.lineTo(w*0.55, h*0.4); ctx.lineTo(w*0.45, h*0.4); ctx.lineTo(w*0.5, h*0.25); ctx.closePath(); ctx.fill();
    // 沙子
    ctx.fillStyle = '#d4a04a';
    ctx.fillRect(w*0.47, h*0.15, w*0.06, 4);
    ctx.fillRect(w*0.48, h*0.27, w*0.04, 3);
    // 齿轮
    var drawGear = function(x, y, r, color) {
        ctx.fillStyle = color;
        for (var t2 = 0; t2 < 8; t2++) {
            var ang = t2 * Math.PI/4;
            ctx.fillRect(x+Math.cos(ang)*r-2, y+Math.sin(ang)*r-2, 4, 4);
        }
        ctx.beginPath(); ctx.arc(x, y, r*0.7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a1a3a';
        ctx.beginPath(); ctx.arc(x, y, r*0.3, 0, Math.PI*2); ctx.fill();
    };
    drawGear(w*0.15, h*0.4, 12, '#9a8a6a');
    drawGear(w*0.85, h*0.5, 14, '#9a8a6a');
    // 地面
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0, groundY, w, h-groundY);
    // 时针
    ctx.strokeStyle = '#d4a04a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w*0.5, groundY-15, 12, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w*0.5, groundY-15); ctx.lineTo(w*0.5, groundY-25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w*0.5, groundY-15); ctx.lineTo(w*0.55, groundY-15); ctx.stroke();
},
// 13. 风暴场景 - 乌云/闪电
_drawSceneStorm: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#1a1a2a'); sky.addColorStop(0.5, '#3a3a4a'); sky.addColorStop(1, '#5a5a6a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 乌云
    var self = this;
    for (var cl = 0; cl < 8; cl++) {
        var cx4 = self._detRand(stage*150+cl)*w; var cy4 = self._detRand(stage*150+cl+1)*groundY*0.4;
        ctx.fillStyle = 'rgba(40,40,60,0.7)';
        ctx.beginPath(); ctx.arc(cx4, cy4, 20+self._detRand(stage*150+cl+2)*10, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx4+15, cy4-5, 16+self._detRand(stage*150+cl+3)*8, 0, Math.PI*2); ctx.fill();
    }
    // 闪电
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w*0.3, 0); ctx.lineTo(w*0.32, h*0.2); ctx.lineTo(w*0.28, h*0.22); ctx.lineTo(w*0.33, h*0.4); ctx.stroke();
    // 地面
    ctx.fillStyle = '#2a2a3a'; ctx.fillRect(0, groundY, w, h-groundY);
    // 雨
    ctx.strokeStyle = 'rgba(150,180,220,0.4)'; ctx.lineWidth = 1;
    for (var rn = 0; rn < 20; rn++) {
        var rx2 = self._detRand(stage*160+rn)*w; var ry2 = self._detRand(stage*160+rn+1)*groundY;
        ctx.beginPath(); ctx.moveTo(rx2, ry2); ctx.lineTo(rx2-2, ry2+8); ctx.stroke();
    }
},
// 14. 水晶场景 - 透明晶体柱
_drawSceneCrystal: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#1a0a3a'); sky.addColorStop(0.5, '#3a1a5a'); sky.addColorStop(1, '#aa66ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    var self = this;
    // 远景晶体
    for (var cr4 = 0; cr4 < 5; cr4++) {
        var cx5 = self._detRand(stage*170+cr4)*w;
        var ch = 30+self._detRand(stage*170+cr4+1)*40;
        var cg3 = ctx.createLinearGradient(cx5, groundY-ch, cx5, groundY);
        cg3.addColorStop(0, 'rgba(180,100,255,0.6)'); cg3.addColorStop(1, 'rgba(100,50,200,0.4)');
        ctx.fillStyle = cg3;
        ctx.beginPath(); ctx.moveTo(cx5, groundY-ch); ctx.lineTo(cx5-8, groundY); ctx.lineTo(cx5+8, groundY); ctx.closePath(); ctx.fill();
    }
    // 地面
    ctx.fillStyle = '#1a0030'; ctx.fillRect(0, groundY, w, h-groundY);
    // 前景晶体
    for (var cr5 = 0; cr5 < 3; cr5++) {
        var cx6 = w*0.2+cr5*w*0.3; var ch2 = 40+cr5*8;
        var cg4 = ctx.createLinearGradient(cx6, groundY-ch2, cx6, groundY);
        cg4.addColorStop(0, 'rgba(220,150,255,0.8)'); cg4.addColorStop(1, 'rgba(150,80,220,0.6)');
        ctx.fillStyle = cg4;
        ctx.beginPath(); ctx.moveTo(cx6, groundY-ch2); ctx.lineTo(cx6-12, groundY); ctx.lineTo(cx6+12, groundY); ctx.closePath(); ctx.fill();
        // 高光
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx6-3, groundY-ch2+5); ctx.lineTo(cx6-7, groundY-3); ctx.stroke();
    }
},
// 15. 海洋场景 - 水面/波纹
_drawSceneSea: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#0a3a6a'); sky.addColorStop(0.5, '#3a7aaa'); sky.addColorStop(1, '#7abaea');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 太阳
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.arc(w*0.8, h*0.15, 14, 0, Math.PI*2); ctx.fill();
    // 水面
    var water = ctx.createLinearGradient(0, groundY, 0, h);
    water.addColorStop(0, '#1a5a8a'); water.addColorStop(1, '#0a2a4a');
    ctx.fillStyle = water; ctx.fillRect(0, groundY, w, h-groundY);
    // 波纹
    var self = this;
    ctx.strokeStyle = 'rgba(180,220,255,0.4)'; ctx.lineWidth = 1;
    for (var wv = 0; wv < 5; wv++) {
        var wy = groundY+5+wv*10;
        ctx.beginPath(); ctx.moveTo(0, wy);
        for (var wx = 0; wx <= w; wx+=10) { ctx.lineTo(wx, wy+Math.sin(wx*0.1+wv)*2); }
        ctx.stroke();
    }
},
// 16. 天空场景 - 云海/彩虹
_drawSceneSky: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#5fb0e8'); sky.addColorStop(0.5, '#a0d0f0'); sky.addColorStop(1, '#e0f0ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 云海
    var self = this;
    for (var ch2 = 0; ch2 < 12; ch2++) {
        var cx7 = self._detRand(stage*180+ch2)*w; var cy5 = groundY-10+self._detRand(stage*180+ch2+1)*20;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(cx7, cy5, 18+self._detRand(stage*180+ch2+2)*10, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx7+15, cy5+3, 12, 0, Math.PI*2); ctx.fill();
    }
    // 彩虹
    var rg = ctx.createLinearGradient(0, groundY*0.5, 0, groundY);
    rg.addColorStop(0, 'rgba(255,0,0,0.2)'); rg.addColorStop(0.2, 'rgba(255,165,0,0.2)');
    rg.addColorStop(0.4, 'rgba(255,255,0,0.2)'); rg.addColorStop(0.6, 'rgba(0,255,0,0.2)');
    rg.addColorStop(0.8, 'rgba(0,0,255,0.2)'); rg.addColorStop(1, 'rgba(128,0,128,0.2)');
    ctx.fillStyle = rg; ctx.fillRect(0, groundY*0.5, w, groundY*0.5);
    // 羽毛
    for (var ft = 0; ft < 5; ft++) {
        var fx2 = self._detRand(stage*190+ft)*w; var fy2 = self._detRand(stage*190+ft+1)*groundY*0.8;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.save(); ctx.translate(fx2, fy2); ctx.rotate(ft*0.5); ctx.scale(1, (1)/(3)); ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.restore(); ctx.fill();
    }
    // 地面
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(0, groundY, w, h-groundY);
},
// 17. 暗影场景 - 暗色/蝙蝠
_drawSceneShadow: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#1a0a2a'); sky.addColorStop(0.5, '#3a1a4a'); sky.addColorStop(1, '#5a2a6a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 蝙蝠
    var self = this;
    for (var bt = 0; bt < 6; bt++) {
        var bx = self._detRand(stage*200+bt)*w; var by = self._detRand(stage*200+bt+1)*groundY*0.6;
        ctx.fillStyle = '#0a0010';
        // 左翼
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx-8, by-3); ctx.lineTo(bx-5, by+2); ctx.lineTo(bx-3, by-1); ctx.lineTo(bx, by+1); ctx.fill();
        // 右翼
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx+8, by-3); ctx.lineTo(bx+5, by+2); ctx.lineTo(bx+3, by-1); ctx.lineTo(bx, by+1); ctx.fill();
        // 身体
        ctx.save(); ctx.translate(bx, by); ctx.rotate(0); ctx.scale(1, (2)/(1.5)); ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI*2); ctx.restore(); ctx.fill();
    }
    // 地面
    ctx.fillStyle = '#1a0a1a'; ctx.fillRect(0, groundY, w, h-groundY);
},
// 18. 沼泽场景 - 绿色水面/雾气
_drawSceneSwamp: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#2a3a1a'); sky.addColorStop(0.5, '#3a4a2a'); sky.addColorStop(1, '#5a6a4a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    var self = this;
    // 雾气
    for (var fg2 = 0; fg2 < 5; fg2++) {
        var fx3 = self._detRand(stage*210+fg2)*w; var fy3 = self._detRand(stage*210+fg2+1)*groundY;
        var fgg = ctx.createRadialGradient(fx3, fy3, 0, fx3, fy3, 30);
        fgg.addColorStop(0, 'rgba(150,180,120,0.3)'); fgg.addColorStop(1, 'rgba(150,180,120,0)');
        ctx.fillStyle = fgg; ctx.beginPath(); ctx.arc(fx3, fy3, 30, 0, Math.PI*2); ctx.fill();
    }
    // 水面
    var water2 = ctx.createLinearGradient(0, groundY, 0, h);
    water2.addColorStop(0, '#4a5a3a'); water2.addColorStop(1, '#2a3a1a');
    ctx.fillStyle = water2; ctx.fillRect(0, groundY, w, h-groundY);
    // 菌类
    for (var mu = 0; mu < 8; mu++) {
        var mux = self._detRand(stage*220+mu)*w; var muy = groundY+5+self._detRand(stage*220+mu+1)*(h-groundY-15);
        ctx.fillStyle = '#e0d0b0'; ctx.fillRect(mux-1, muy, 2, 5);
        ctx.fillStyle = mu%2===0 ? '#ff5252' : '#9c27b0';
        ctx.beginPath(); ctx.arc(mux, muy, 3, Math.PI, 0); ctx.fill();
    }
},
// 19. 迷宫场景 - 紫光门/几何
_drawSceneLabyrinth: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#1a0a2a'); sky.addColorStop(0.5, '#3a1a4a'); sky.addColorStop(1, '#6a3a8a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 几何形状
    var self = this;
    ctx.strokeStyle = 'rgba(180,100,255,0.5)'; ctx.lineWidth = 1.5;
    for (var gh3 = 0; gh3 < 5; gh3++) {
        var gx5 = self._detRand(stage*230+gh3)*w; var gy5 = self._detRand(stage*230+gh3+1)*groundY*0.7;
        var gr = 10+self._detRand(stage*230+gh3+2)*20;
        ctx.beginPath();
        for (var sd = 0; sd < 6; sd++) {
            var ang2 = sd*Math.PI/3;
            if (sd === 0) ctx.moveTo(gx5+Math.cos(ang2)*gr, gy5+Math.sin(ang2)*gr);
            else ctx.lineTo(gx5+Math.cos(ang2)*gr, gy5+Math.sin(ang2)*gr);
        }
        ctx.closePath(); ctx.stroke();
    }
    // 紫光门
    var pg2 = ctx.createRadialGradient(w*0.5, groundY-30, 0, w*0.5, groundY-30, 50);
    pg2.addColorStop(0, 'rgba(200,150,255,0.6)'); pg2.addColorStop(0.5, 'rgba(150,50,200,0.3)'); pg2.addColorStop(1, 'rgba(100,30,150,0)');
    ctx.fillStyle = pg2; ctx.beginPath(); ctx.arc(w*0.5, groundY-30, 50, 0, Math.PI*2); ctx.fill();
    // 地面
    ctx.fillStyle = '#1a0a2a'; ctx.fillRect(0, groundY, w, h-groundY);
},
// 20. 战场场景 - 飘扬的战旗/废弃武器
_drawSceneBattlefield: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#4a2a1a'); sky.addColorStop(0.5, '#6a4a2a'); sky.addColorStop(1, '#8a6a4a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 战旗
    var self = this;
    for (var fl = 0; fl < 4; fl++) {
        var fx4 = w*0.15+fl*w*0.22;
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(fx4-1, groundY-50, 2, 50);
        ctx.fillStyle = fl%2===0 ? '#c62828' : '#1a1a1a';
        ctx.beginPath(); ctx.moveTo(fx4+1, groundY-50); ctx.lineTo(fx4+15, groundY-45); ctx.lineTo(fx4+1, groundY-40); ctx.closePath(); ctx.fill();
    }
    // 地面
    var g3 = ctx.createLinearGradient(0, groundY, 0, h);
    g3.addColorStop(0, '#5a3a2a'); g3.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = g3; ctx.fillRect(0, groundY, w, h-groundY);
    // 废弃武器
    for (var wp = 0; wp < 6; wp++) {
        var wpx = self._detRand(stage*240+wp)*w; var wpy = groundY+self._detRand(stage*240+wp+1)*(h-groundY-5);
        ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wpx, wpy); ctx.lineTo(wpx+5, wpy+2); ctx.stroke();
    }
},
// 21. 恶魔场景 - 火焰/尖刺
_drawSceneDemon: function(ctx, w, h, groundY, stage) {
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#1a0a0a'); sky.addColorStop(0.5, '#4a0a0a'); sky.addColorStop(1, '#7a0a0a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, groundY);
    // 火焰
    var self = this;
    for (var fl2 = 0; fl2 < 8; fl2++) {
        var fcx = self._detRand(stage*250+fl2)*w; var fcy = self._detRand(stage*250+fl2+1)*groundY*0.5;
        var fg5 = ctx.createRadialGradient(fcx, fcy, 0, fcx, fcy, 12);
        fg5.addColorStop(0, 'rgba(255,200,100,0.7)'); fg5.addColorStop(0.5, 'rgba(255,100,30,0.4)'); fg5.addColorStop(1, 'rgba(255,50,0,0)');
        ctx.fillStyle = fg5; ctx.beginPath(); ctx.arc(fcx, fcy, 12, 0, Math.PI*2); ctx.fill();
    }
    // 地面
    var g4 = ctx.createLinearGradient(0, groundY, 0, h);
    g4.addColorStop(0, '#3a0a0a'); g4.addColorStop(1, '#1a0000');
    ctx.fillStyle = g4; ctx.fillRect(0, groundY, w, h-groundY);
    // 尖刺
    for (var sp2 = 0; sp2 < 4; sp2++) {
        var spx2 = w*0.1+sp2*w*0.25;
        ctx.fillStyle = '#2a0a0a';
        ctx.beginPath(); ctx.moveTo(spx2, groundY); ctx.lineTo(spx2+3, groundY-12); ctx.lineTo(spx2+6, groundY); ctx.closePath(); ctx.fill();
    }
},
// ========================================================================
// v2.6.2 场景动态特效层（20 种场景，每帧重画，基于 Date.now() 动画）
//   所有效果都用 Canvas2D 标准 API (arc/fillRect/createRadialGradient)，
//   不依赖 roundRect/ellipse，老 Edge 100% 兼容
// ========================================================================
_drawSceneEffects: function(ctx, w, h, groundY, stage, sceneType) {
    var fn = this['_drawSceneEffects_' + sceneType];
    if (fn) {
        try { fn.call(this, ctx, w, h, groundY, stage); }
        catch (e) { /* 单场景特效异常不能影响主渲染 */ }
    }
},
// ========================================================================
// v2.6.2 特殊场景效果（BOSS 出场 / 波次开始 / 章节切换 / 升级）
//   全部走 PixiFx（addEffect/addParticles 双轨路由），不影响主渲染
// ========================================================================

// BOSS 出场特效：屏幕中心红黑漩涡 + 警告粒子扩散
_playBossEntranceEffect: function(boss) {
    if (!boss || typeof PixiFx === 'undefined' || !PixiFx.initialized) return;
    var w = (typeof window !== 'undefined' ? window.innerWidth : 480);
    var h = (typeof window !== 'undefined' ? window.innerHeight : 320);
    var cx = w / 2, cy = h / 2;
    // 5 圈暗色扩散
    for (var i = 0; i < 5; i++) {
        PixiFx.addEffect(cx, cy, 'dark', '#ff2200', 0.8 + i * 0.3);
    }
    // 中央大爆 + 红粒子
    PixiFx.addEffect(cx, cy, 'explosion', '#ff0000', 2.5);
    PixiFx.addEffect(cx, cy, 'nova', '#ff5722', 2.0);
    PixiFx.addParticles(cx, cy, '#ff2200', 30);
    PixiFx.addParticles(cx, cy, '#ff5722', 20);
    PixiFx.addParticles(cx, cy, '#000000', 15);
},

// 精英出场特效：中等金色环 + 紫色粒子
_playEliteEntranceEffect: function(elite) {
    if (!elite || typeof PixiFx === 'undefined' || !PixiFx.initialized) return;
    var w = (typeof window !== 'undefined' ? window.innerWidth : 480);
    var h = (typeof window !== 'undefined' ? window.innerHeight : 320);
    var cx = w / 2, cy = h / 2;
    PixiFx.addEffect(cx, cy, 'nova', '#ffd700', 1.6);
    PixiFx.addEffect(cx, cy, 'buff', '#ffd700', 1.4);
    PixiFx.addParticles(cx, cy, '#ffd700', 16);
    PixiFx.addParticles(cx, cy, '#ff9800', 10);
},

// 波次开始特效：屏幕顶部金色波浪 + 中央光柱
_playWaveStartEffect: function(waveNumber) {
    if (typeof PixiFx === 'undefined' || !PixiFx.initialized) return;
    var w = (typeof window !== 'undefined' ? window.innerWidth : 480);
    var h = (typeof window !== 'undefined' ? window.innerHeight : 320);
    // 中央光柱
    PixiFx.addEffect(w / 2, h / 2, 'explosion', '#ffd700', 1.8);
    PixiFx.addEffect(w / 2, h / 2, 'nova', '#fff59d', 1.4);
    // 4 角金色粒子
    PixiFx.addParticles(w * 0.2, h * 0.3, '#ffd700', 8);
    PixiFx.addParticles(w * 0.8, h * 0.3, '#ffd700', 8);
    PixiFx.addParticles(w * 0.2, h * 0.7, '#ff9800', 6);
    PixiFx.addParticles(w * 0.8, h * 0.7, '#ff9800', 6);
    PixiFx.addParticles(w / 2, h / 2, '#ffffff', 12);
},

// 章节切换特效：屏幕中心金色大爆 + 多色粒子扩散
_playChapterChangeEffect: function() {
    if (typeof PixiFx === 'undefined' || !PixiFx.initialized) return;
    var w = (typeof window !== 'undefined' ? window.innerWidth : 480);
    var h = (typeof window !== 'undefined' ? window.innerHeight : 320);
    var cx = w / 2, cy = h / 2;
    // 大型金光
    PixiFx.addEffect(cx, cy, 'explosion', '#ffd700', 2.5);
    PixiFx.addEffect(cx, cy, 'nova', '#fff59d', 2.0);
    PixiFx.addEffect(cx, cy, 'buff', '#ffd700', 1.5);
    // 4 色粒子扩散
    PixiFx.addParticles(cx, cy, '#ffd700', 25);
    PixiFx.addParticles(cx, cy, '#ffffff', 15);
    PixiFx.addParticles(cx, cy, '#fff59d', 15);
    PixiFx.addParticles(cx, cy, '#ff9800', 10);
},

// 升级特效：金色圣光柱 + 大量上升光点
_playLevelUpEffect: function() {
    if (typeof PixiFx === 'undefined' || !PixiFx.initialized) return;
    var w = (typeof window !== 'undefined' ? window.innerWidth : 480);
    var h = (typeof window !== 'undefined' ? window.innerHeight : 320);
    var cx = w / 2, cy = h * 0.6;
    // 金色 heal + buff 双环
    PixiFx.addEffect(cx, cy, 'heal', '#ffd700', 2.0);
    PixiFx.addEffect(cx, cy, 'buff', '#ffeb3b', 1.6);
    PixiFx.addEffect(cx, cy, 'heal', '#ffffff', 1.4);
    // 大量上升光点
    PixiFx.addParticles(cx, cy, '#ffd700', 20);
    PixiFx.addParticles(cx, cy, '#ffeb3b', 12);
    PixiFx.addParticles(cx, cy, '#ffffff', 10);
},

// ============ 草原（蓝天/白云/远山/花草 + 飘落花瓣 + 太阳光晕脉动）============
_drawSceneEffects_grassland: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 太阳光晕脉动
    var sunX = w * 0.82, sunY = h * 0.15;
    var pulse = 0.5 + 0.5 * Math.sin(t * 1.2);
    var sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 44 + pulse * 8);
    sunGlow.addColorStop(0, 'rgba(255,250,200,' + (0.35 + pulse * 0.15) + ')');
    sunGlow.addColorStop(0.5, 'rgba(255,220,120,' + (0.15 + pulse * 0.1) + ')');
    sunGlow.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath(); ctx.arc(sunX, sunY, 44, 0, Math.PI * 2); ctx.fill();
    // 飘落花瓣（8 片，横摇下落）
    var petalC = ['#ff8a80', '#ff6b8a', '#f8bbd0', '#fff59d'];
    for (var i = 0; i < 8; i++) {
        var phase = (t * 0.25 + i * 0.125) % 1;
        var baseX = this._detRand(stage * 100 + i * 7) * w;
        var x = baseX + Math.sin(t * 0.8 + i * 1.3) * 18;
        var y = -10 + phase * (h + 20);
        var alpha = 1 - Math.abs(phase - 0.5) * 1.5;
        if (alpha < 0) alpha = 0;
        ctx.fillStyle = petalC[i % 4];
        ctx.globalAlpha = 0.55 * alpha;
        ctx.beginPath();
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.5 + i); ctx.scale(1, (1.5)/(3)); ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.restore(); ctx.fill();
        // ctx.fill();
    }
    ctx.globalAlpha = 1;
},

// ============ 森林（高大树木/光斑/蘑菇 + 飘落叶 + 萤火虫）============
_drawSceneEffects_forest: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 飘落叶（10 片）
    for (var i = 0; i < 10; i++) {
        var phase = (t * 0.3 + i * 0.1) % 1;
        var baseX = this._detRand(stage * 80 + i * 11) * w;
        var x = baseX + Math.sin(t * 0.6 + i * 1.5) * 25;
        var y = -10 + phase * (h + 20);
        var leafC = i % 3 === 0 ? '#8d6e63' : (i % 3 === 1 ? '#558b2f' : '#f9a825');
        ctx.fillStyle = leafC;
        ctx.globalAlpha = 0.7 - phase * 0.4;
        ctx.beginPath();
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.7 + i * 1.1); ctx.scale(1, (1.2)/(2.5)); ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI*2); ctx.restore(); ctx.fill();
        // ctx.fill();
    }
    // 萤火虫（6 颗，明灭飘动）
    for (var i = 0; i < 6; i++) {
        var bx = this._detRand(stage * 200 + i * 13) * w;
        var by = this._detRand(stage * 200 + i * 13 + 1) * groundY;
        var dx = Math.sin(t * 0.4 + i * 1.2) * 20;
        var dy = Math.cos(t * 0.5 + i * 1.7) * 12;
        var flick = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2.5 + i * 1.3));
        var glow = ctx.createRadialGradient(bx + dx, by + dy, 0, bx + dx, by + dy, 6);
        glow.addColorStop(0, 'rgba(180,255,100,' + flick + ')');
        glow.addColorStop(1, 'rgba(180,255,100,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bx + dx, by + dy, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
},

// ============ 陵墓（墓碑 + 鬼火 + 飘幽灵）============
_drawSceneEffects_graveyard: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 鬼火（5 颗紫绿光球缓慢上升 + 飘）
    for (var i = 0; i < 5; i++) {
        var baseX = this._detRand(stage * 150 + i * 19) * w;
        var baseY = this._detRand(stage * 150 + i * 19 + 1) * groundY * 0.7;
        var x = baseX + Math.sin(t * 0.3 + i) * 30;
        var y = baseY + Math.cos(t * 0.4 + i * 1.3) * 20 - t * 5 % 80;
        y = ((y % 80) + 80) % 80 + (groundY - 80);
        var flick = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.8 + i));
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 12);
        glow.addColorStop(0, 'rgba(120,255,180,' + (flick * 0.7) + ')');
        glow.addColorStop(1, 'rgba(60,180,120,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    // 飘幽灵（3 个半透明圆）
    for (var i = 0; i < 3; i++) {
        var gx = w * (0.2 + i * 0.3) + Math.sin(t * 0.2 + i) * 25;
        var gy = groundY * 0.3 + Math.cos(t * 0.3 + i * 1.4) * 15;
        ctx.fillStyle = 'rgba(220,220,255,0.18)';
        ctx.beginPath();
        ctx.arc(gx, gy, 10, 0, Math.PI * 2);
        ctx.fill();
    }
},

// ============ 火山（飞灰 + 岩浆气泡 + 顶部熔岩闪烁 + 地面红光）============
_drawSceneEffects_volcano: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 顶部熔岩闪烁
    var lavaPulse = 0.5 + 0.5 * Math.sin(t * 2.5);
    var lx = w * 0.4, ly = groundY - 95;
    var lavaGlow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 28 + lavaPulse * 6);
    lavaGlow.addColorStop(0, 'rgba(255,250,200,' + (0.7 + lavaPulse * 0.2) + ')');
    lavaGlow.addColorStop(0.5, 'rgba(255,140,0,' + (0.45 + lavaPulse * 0.2) + ')');
    lavaGlow.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = lavaGlow;
    ctx.beginPath(); ctx.arc(lx, ly, 28, 0, Math.PI * 2); ctx.fill();
    // 上升灰烬
    for (var i = 0; i < 10; i++) {
        var phase = (t * 0.3 + i * 0.1) % 1;
        var baseX = w * 0.3 + this._detRand(stage * 50 + i * 11) * w * 0.3;
        var x = baseX + Math.sin(t * 1.2 + i * 1.7) * 10;
        var y = groundY - 100 - phase * (groundY - 50);
        ctx.fillStyle = (i % 3 === 0 ? 'rgba(255,120,40,' : 'rgba(80,80,80,') + ((1 - phase) * 0.55) + ')';
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + i % 2, 0, Math.PI * 2);
        ctx.fill();
    }
    // 地面红色光晕
    var groundPulse = 0.5 + 0.5 * Math.sin(t * 1.8);
    var groundGlow = ctx.createLinearGradient(0, groundY, 0, h);
    groundGlow.addColorStop(0, 'rgba(255,60,0,' + (0.15 + groundPulse * 0.1) + ')');
    groundGlow.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = groundGlow;
    ctx.fillRect(0, groundY, w, h - groundY);
},

// ============ 冰原（飘雪 + 冰晶闪烁 + 冷雾）============
_drawSceneEffects_ice: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 飘雪（20 片）
    for (var i = 0; i < 20; i++) {
        var phase = (t * 0.15 + i * 0.05) % 1;
        var baseX = this._detRand(stage * 60 + i * 13) * w;
        var x = baseX + Math.sin(t * 0.6 + i * 0.7) * 12;
        var y = -5 + phase * (h + 10);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.7 - phase * 0.3) + ')';
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    // 冰晶闪烁（5 个）
    for (var i = 0; i < 5; i++) {
        var flick = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.5);
        var ix = this._detRand(stage * 70 + i * 7) * w;
        var iy = groundY + 5 + this._detRand(stage * 70 + i * 7 + 1) * (h - groundY - 15);
        ctx.fillStyle = 'rgba(180,230,255,' + (0.3 + flick * 0.5) + ')';
        ctx.beginPath();
        ctx.moveTo(ix, iy - 8); ctx.lineTo(ix + 3, iy);
        ctx.lineTo(ix, iy + 8); ctx.lineTo(ix - 3, iy);
        ctx.closePath(); ctx.fill();
    }
    // 顶部冷雾
    var fogG = ctx.createLinearGradient(0, 0, 0, groundY);
    var fogA = 0.08 + 0.04 * Math.sin(t * 0.8);
    fogG.addColorStop(0, 'rgba(180,220,255,' + fogA + ')');
    fogG.addColorStop(1, 'rgba(180,220,255,0)');
    ctx.fillStyle = fogG;
    ctx.fillRect(0, 0, w, groundY);
},

// ============ 遗迹（飘尘 + 金色光柱 + 远古符号闪动）============
_drawSceneEffects_ruins: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 飘尘（15 颗缓慢上升）
    for (var i = 0; i < 15; i++) {
        var phase = (t * 0.2 + i * 0.07) % 1;
        var baseX = this._detRand(stage * 90 + i * 13) * w;
        var x = baseX + Math.sin(t * 0.5 + i) * 8;
        var y = h - phase * (h - groundY + 30);
        ctx.fillStyle = 'rgba(200,180,140,' + (0.5 - phase * 0.4) + ')';
        ctx.beginPath();
        ctx.arc(x, y, 1 + i % 2, 0, Math.PI * 2);
        ctx.fill();
    }
    // 神秘光柱（4 个位置缓慢明灭）
    for (var i = 0; i < 4; i++) {
        var flick = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.5 + i * 1.8));
        var px = w * (0.15 + i * 0.23);
        var colG = ctx.createLinearGradient(px, groundY - 80, px, groundY);
        colG.addColorStop(0, 'rgba(255,215,0,0)');
        colG.addColorStop(0.5, 'rgba(255,215,0,' + (flick * 0.4) + ')');
        colG.addColorStop(1, 'rgba(255,200,80,' + (flick * 0.6) + ')');
        ctx.fillStyle = colG;
        ctx.fillRect(px - 8, groundY - 80, 16, 80);
    }
},

// ============ 虚空（星尘 + 紫色光球游动 + 裂纹闪电）============
_drawSceneEffects_abyss: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 星尘（30 颗）
    for (var i = 0; i < 30; i++) {
        var baseX = this._detRand(stage * 200 + i * 17) * w;
        var baseY = this._detRand(stage * 200 + i * 17 + 1) * groundY * 0.9;
        var dx = Math.sin(t * 0.3 + i * 0.9) * 8;
        var dy = Math.cos(t * 0.4 + i * 1.3) * 5;
        var flick = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + i));
        var c = i % 4 === 0 ? '220,180,255' : '255,255,255';
        ctx.fillStyle = 'rgba(' + c + ',' + (flick * 0.85) + ')';
        ctx.beginPath();
        ctx.arc(baseX + dx, baseY + dy, i % 3 === 0 ? 1.5 : 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
    // 紫色光球（3 颗）
    for (var i = 0; i < 3; i++) {
        var baseX = w * (0.2 + i * 0.3);
        var x = baseX + Math.sin(t * 0.2 + i * 2) * 40;
        var y = groundY * 0.3 + Math.cos(t * 0.3 + i) * 25;
        var radius = 18 + 4 * Math.sin(t + i);
        var orbG = ctx.createRadialGradient(x, y, 0, x, y, radius);
        orbG.addColorStop(0, 'rgba(180,80,255,0.55)');
        orbG.addColorStop(0.5, 'rgba(120,40,200,0.25)');
        orbG.addColorStop(1, 'rgba(80,20,150,0)');
        ctx.fillStyle = orbG;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    // 顶部裂纹闪电（每隔 3 秒一道）
    if (Math.floor(t * 0.33) % 2 === 0) {
        ctx.strokeStyle = 'rgba(180,120,255,' + (0.3 + 0.3 * Math.sin(t * 8)) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.45 + Math.sin(t * 12) * 15, h * 0.2);
        ctx.lineTo(w * 0.55 + Math.sin(t * 14) * 12, h * 0.3);
        ctx.stroke();
    }
},

// ============ 龙（红色龙息 + 飘金鳞 + 龙威光环）============
_drawSceneEffects_dragon: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 飘金鳞（10 片红色/金色碎片）
    for (var i = 0; i < 10; i++) {
        var phase = (t * 0.25 + i * 0.1) % 1;
        var baseX = this._detRand(stage * 110 + i * 13) * w;
        var x = baseX + Math.sin(t * 0.8 + i * 1.4) * 30;
        var y = -10 + phase * (h + 20);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,80,40,' + ((1 - phase) * 0.7) + ')' : 'rgba(255,200,50,' + ((1 - phase) * 0.7) + ')';
        ctx.beginPath();
        ctx.moveTo(x, y - 3); ctx.lineTo(x + 2, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 2, y);
        ctx.closePath(); ctx.fill();
    }
    // 龙威光环（中心脉动红光）
    var pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
    var glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 80 + pulse * 20);
    glow.addColorStop(0, 'rgba(255,60,40,' + (pulse * 0.3) + ')');
    glow.addColorStop(1, 'rgba(255,40,20,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 100, 0, Math.PI * 2);
    ctx.fill();
},

// ============ 神（圣光 + 白色光环 + 羽毛飘落）============
_drawSceneEffects_divine: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 圣光柱（中央上下脉动）
    var pulse = 0.5 + 0.5 * Math.sin(t * 1.2);
    var holyG = ctx.createLinearGradient(w / 2 - 60, 0, w / 2 + 60, 0);
    holyG.addColorStop(0, 'rgba(255,215,0,0)');
    holyG.addColorStop(0.5, 'rgba(255,235,150,' + (pulse * 0.4) + ')');
    holyG.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = holyG;
    ctx.fillRect(w / 2 - 60, 0, 120, h);
    // 羽毛飘落（6 片白色）
    for (var i = 0; i < 6; i++) {
        var phase = (t * 0.2 + i * 0.16) % 1;
        var baseX = this._detRand(stage * 220 + i * 17) * w;
        var x = baseX + Math.sin(t * 0.5 + i * 1.5) * 25;
        var y = -10 + phase * (h + 20);
        ctx.fillStyle = 'rgba(255,255,255,' + ((1 - phase) * 0.8) + ')';
        ctx.beginPath();
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.4 + i); ctx.scale(1, (5)/(2)); ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI*2); ctx.restore(); ctx.fill();
        // ctx.fill();
    }
    // 顶部白光晕
    var topG = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, 100);
    topG.addColorStop(0, 'rgba(255,255,200,' + (pulse * 0.4) + ')');
    topG.addColorStop(1, 'rgba(255,235,150,0)');
    ctx.fillStyle = topG;
    ctx.beginPath();
    ctx.arc(w / 2, 0, 100, 0, Math.PI * 2);
    ctx.fill();
},

// ============ 混沌（多色乱流光球 + 扭曲线条）============
_drawSceneEffects_chaos: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 5 颗乱流光球（不同颜色不规则移动）
    var colors = ['255,80,80', '80,255,80', '80,80,255', '255,200,80', '200,80,255'];
    for (var i = 0; i < 5; i++) {
        var baseX = w * (0.1 + i * 0.18);
        var baseY = groundY * (0.3 + (i % 3) * 0.2);
        var x = baseX + Math.sin(t * (0.5 + i * 0.2) + i) * 35;
        var y = baseY + Math.cos(t * (0.6 + i * 0.15) + i * 1.5) * 25;
        var radius = 14 + 6 * Math.sin(t * 2 + i);
        var orbG = ctx.createRadialGradient(x, y, 0, x, y, radius);
        var c = colors[i];
        orbG.addColorStop(0, 'rgba(' + c + ',0.55)');
        orbG.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = orbG;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    // 扭曲线条（3 条波浪）
    ctx.strokeStyle = 'rgba(180,80,200,0.25)';
    ctx.lineWidth = 1;
    for (var l = 0; l < 3; l++) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 8) {
            var y = groundY * 0.4 + l * 30 + Math.sin((x + t * 80 + l * 100) * 0.02) * 15;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
},

// ============ 星（星尘 + 流星 + 蓝紫光球）============
_drawSceneEffects_star: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 流星（每隔 4 秒一颗）
    var meteorT = (t * 0.25) % 1;
    var mx = meteorT * (w + 100) - 50;
    var my = Math.sin(meteorT * 3) * 30 + 20;
    ctx.strokeStyle = 'rgba(220,220,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx - 30, my - 30);
    ctx.lineTo(mx, my);
    ctx.stroke();
    // 流星头（亮点）
    var mhG = ctx.createRadialGradient(mx, my, 0, mx, my, 6);
    mhG.addColorStop(0, 'rgba(255,255,255,0.95)');
    mhG.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = mhG;
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.fill();
    // 星尘（40 颗密集）
    for (var i = 0; i < 40; i++) {
        var baseX = this._detRand(stage * 240 + i * 19) * w;
        var baseY = this._detRand(stage * 240 + i * 19 + 1) * groundY * 0.95;
        var flick = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.5 + i));
        ctx.fillStyle = 'rgba(200,220,255,' + (flick * 0.8) + ')';
        ctx.beginPath();
        ctx.arc(baseX, baseY, 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
},

// ============ 时间（沙漏沙流 + 时钟光晕 + 倒影光线）============
_drawSceneEffects_time: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 时钟光晕（中央脉动）
    var pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
    var clG = ctx.createRadialGradient(w / 2, groundY * 0.4, 0, w / 2, groundY * 0.4, 70);
    clG.addColorStop(0, 'rgba(255,200,100,' + (pulse * 0.45) + ')');
    clG.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = clG;
    ctx.beginPath();
    ctx.arc(w / 2, groundY * 0.4, 70, 0, Math.PI * 2);
    ctx.fill();
    // 沙流（金色粒子向下飘）
    for (var i = 0; i < 12; i++) {
        var phase = (t * 0.4 + i * 0.08) % 1;
        var baseX = w / 2 + (i - 6) * 3;
        var y = groundY * 0.2 + phase * groundY * 0.5;
        ctx.fillStyle = 'rgba(255,200,80,' + (1 - phase) + ')';
        ctx.beginPath();
        ctx.arc(baseX, y, 0.8 + (i % 3) * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
},

// ============ 战场（飞扬尘土 + 飘军旗 + 红色光晕）============
_drawSceneEffects_battlefield: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 飞扬尘土（20 颗）
    for (var i = 0; i < 20; i++) {
        var phase = (t * 0.3 + i * 0.05) % 1;
        var baseX = this._detRand(stage * 130 + i * 11) * w;
        var x = baseX + Math.sin(t * 0.5 + i) * 15;
        var y = groundY + phase * (h - groundY + 20);
        ctx.fillStyle = 'rgba(180,150,110,' + (0.6 - phase * 0.5) + ')';
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + i % 3, 0, Math.PI * 2);
        ctx.fill();
    }
    // 顶部红色战意光晕
    var pulse = 0.5 + 0.5 * Math.sin(t * 1.3);
    var bg = ctx.createLinearGradient(0, 0, 0, groundY);
    bg.addColorStop(0, 'rgba(180,40,40,' + (pulse * 0.15) + ')');
    bg.addColorStop(1, 'rgba(180,40,40,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, groundY);
},

// ============ 风暴（闪电 + 乌云 + 飘雨）============
_drawSceneEffects_storm: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 飘雨（30 条斜线）
    ctx.strokeStyle = 'rgba(180,200,220,0.5)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 30; i++) {
        var phase = (t * 0.6 + i * 0.033) % 1;
        var baseX = this._detRand(stage * 280 + i * 7) * w;
        var x = baseX + phase * 40;  // 斜向飘
        var y = -10 + phase * (h + 10);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 12);
        ctx.stroke();
    }
    // 闪电（每隔 2-5 秒随机一道）
    if (Math.floor(t * 0.4) % 3 === 0) {
        ctx.strokeStyle = 'rgba(220,220,255,' + (0.5 + 0.4 * Math.sin(t * 12)) + ')';
        ctx.lineWidth = 1.5;
        var lx = w * (0.3 + 0.4 * Math.sin(t * 3));
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + (Math.random() - 0.5) * 30, h * 0.2);
        ctx.lineTo(lx + (Math.random() - 0.5) * 50, h * 0.35);
        ctx.stroke();
    }
    // 顶部乌云覆盖
    var cloud = ctx.createLinearGradient(0, 0, 0, groundY * 0.5);
    cloud.addColorStop(0, 'rgba(60,60,80,0.5)');
    cloud.addColorStop(1, 'rgba(60,60,80,0)');
    ctx.fillStyle = cloud;
    ctx.fillRect(0, 0, w, groundY * 0.5);
},

// ============ 暗影（暗紫色雾 + 飘紫焰 + 鬼眼闪烁）============
_drawSceneEffects_shadow: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 飘紫焰（5 朵）
    for (var i = 0; i < 5; i++) {
        var baseX = this._detRand(stage * 260 + i * 23) * w;
        var x = baseX + Math.sin(t * 0.5 + i) * 20;
        var y = groundY + Math.sin(t * 2 + i * 1.5) * 8;
        var flick = 0.4 + 0.6 * Math.sin(t * 3 + i);
        var fg = ctx.createRadialGradient(x, y, 0, x, y, 14 + flick * 4);
        fg.addColorStop(0, 'rgba(180,80,200,' + (0.6 + flick * 0.2) + ')');
        fg.addColorStop(1, 'rgba(120,40,160,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
    }
    // 暗雾
    var fog = ctx.createLinearGradient(0, 0, 0, groundY);
    fog.addColorStop(0, 'rgba(80,40,120,0.2)');
    fog.addColorStop(1, 'rgba(60,20,100,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, groundY);
    // 鬼眼（2 对远处红光闪烁）
    for (var i = 0; i < 2; i++) {
        var flick = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7));
        var ex = w * (0.2 + i * 0.6);
        var ey = groundY * 0.6;
        ctx.fillStyle = 'rgba(255,40,40,' + flick + ')';
        ctx.beginPath();
        ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
},

// ============ 水晶（紫色水晶光晕 + 飘光点 + 闪烁星芒）============
_drawSceneEffects_crystal: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 水晶光晕（中心脉动紫光）
    var pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
    var clG = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 100);
    clG.addColorStop(0, 'rgba(180,80,220,' + (pulse * 0.3) + ')');
    clG.addColorStop(1, 'rgba(120,40,180,0)');
    ctx.fillStyle = clG;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 100, 0, Math.PI * 2);
    ctx.fill();
    // 飘光点（20 颗）
    for (var i = 0; i < 20; i++) {
        var baseX = this._detRand(stage * 250 + i * 17) * w;
        var baseY = this._detRand(stage * 250 + i * 17 + 1) * h;
        var dx = Math.sin(t * 0.3 + i * 0.9) * 15;
        var dy = Math.cos(t * 0.4 + i * 1.3) * 10;
        var flick = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + i));
        ctx.fillStyle = 'rgba(220,180,255,' + (flick * 0.85) + ')';
        ctx.beginPath();
        ctx.arc(baseX + dx, baseY + dy, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
},

// ============ 海洋（海浪 + 气泡 + 飞鸟）============
_drawSceneEffects_sea: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 海浪（顶部横向波动蓝线）
    ctx.strokeStyle = 'rgba(80,150,200,0.5)';
    ctx.lineWidth = 1.5;
    for (var l = 0; l < 3; l++) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 6) {
            var y = groundY - 30 + l * 15 + Math.sin((x + t * 60 + l * 80) * 0.02) * 4;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    // 气泡（10 颗上升）
    for (var i = 0; i < 10; i++) {
        var phase = (t * 0.3 + i * 0.1) % 1;
        var baseX = this._detRand(stage * 300 + i * 13) * w;
        var x = baseX + Math.sin(t * 0.6 + i) * 5;
        var y = h - phase * (h - groundY + 20);
        ctx.strokeStyle = 'rgba(180,220,240,' + (1 - phase) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + i % 2, 0, Math.PI * 2);
        ctx.stroke();
    }
},

// ============ 天空（云层 + 飞鸟 + 阳光柱）============
_drawSceneEffects_sky: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 慢飘云朵（5 朵）
    for (var i = 0; i < 5; i++) {
        var phase = (t * 0.04 + i * 0.2) % 1;
        var cx = phase * (w + 100) - 50;
        var cy = h * (0.1 + i * 0.08);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 10, cy - 4, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - 8, cy + 2, 9, 0, Math.PI * 2); ctx.fill();
    }
    // 阳光柱（中央向下渐变）
    var pulse = 0.5 + 0.5 * Math.sin(t * 0.8);
    var sg = ctx.createLinearGradient(w / 2 - 80, 0, w / 2 + 80, 0);
    sg.addColorStop(0, 'rgba(255,240,180,0)');
    sg.addColorStop(0.5, 'rgba(255,235,160,' + (pulse * 0.35) + ')');
    sg.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(w / 2 - 80, 0, 160, h);
},

// ============ 沼泽（绿雾 + 气泡 + 飘萤火虫）============
_drawSceneEffects_swamp: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 绿色毒雾（贴地）
    var fog = ctx.createLinearGradient(0, groundY - 30, 0, h);
    var fogA = 0.25 + 0.1 * Math.sin(t * 0.7);
    fog.addColorStop(0, 'rgba(80,180,80,' + fogA + ')');
    fog.addColorStop(1, 'rgba(60,140,60,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, groundY - 30, w, 40);
    // 气泡（5 颗从地面冒出来）
    for (var i = 0; i < 5; i++) {
        var phase = (t * 0.25 + i * 0.2) % 1;
        var baseX = this._detRand(stage * 290 + i * 17) * w;
        var x = baseX + Math.sin(t * 1.5 + i) * 3;
        var y = groundY + 5 - phase * (groundY + 20);
        ctx.strokeStyle = 'rgba(160,220,120,' + (1 - phase) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 2 + phase * 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    // 鬼火（3 颗黄绿光球）
    for (var i = 0; i < 3; i++) {
        var baseX = this._detRand(stage * 270 + i * 19) * w;
        var x = baseX + Math.sin(t * 0.4 + i) * 25;
        var y = groundY - 30 + Math.cos(t * 0.5 + i * 1.5) * 15;
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
        glow.addColorStop(0, 'rgba(200,255,80,0.7)');
        glow.addColorStop(1, 'rgba(160,200,40,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
    }
},

// ============ 迷宫（神秘符号 + 飘光点 + 紫色线条）============
_drawSceneEffects_labyrinth: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 神秘符号（5 个角形旋转）
    for (var i = 0; i < 5; i++) {
        var baseX = this._detRand(stage * 280 + i * 17) * w;
        var baseY = this._detRand(stage * 280 + i * 17 + 1) * groundY * 0.8;
        var rot = t * 0.5 + i;
        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.rotate(rot);
        ctx.strokeStyle = 'rgba(180,120,220,' + (0.5 + 0.3 * Math.sin(t * 2 + i)) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var k = 0; k < 6; k++) {
            var ang = k * Math.PI * 2 / 6;
            var r = 6 + (k % 2) * 3;
            var px = Math.cos(ang) * r;
            var py = Math.sin(ang) * r;
            if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    // 顶部紫色线条
    var topG = ctx.createLinearGradient(0, 0, w, 0);
    topG.addColorStop(0, 'rgba(180,120,220,0)');
    topG.addColorStop(0.5, 'rgba(180,120,220,' + (0.3 + 0.2 * Math.sin(t)) + ')');
    topG.addColorStop(1, 'rgba(180,120,220,0)');
    ctx.fillStyle = topG;
    ctx.fillRect(0, 0, w, 3);
},

// ============ 恶魔（红黑雾 + 飘焰 + 眼睛闪烁）============
_drawSceneEffects_demon: function(ctx, w, h, groundY, stage) {
    var t = Date.now() / 1000;
    // 飘焰（8 朵）
    for (var i = 0; i < 8; i++) {
        var baseX = this._detRand(stage * 260 + i * 19) * w;
        var x = baseX + Math.sin(t * 0.4 + i) * 25;
        var y = groundY - 60 + Math.cos(t * 2 + i * 1.5) * 15;
        var flick = 0.4 + 0.6 * Math.sin(t * 3 + i);
        var fg = ctx.createRadialGradient(x, y, 0, x, y, 16 + flick * 4);
        fg.addColorStop(0, 'rgba(255,80,40,' + (0.7 + flick * 0.2) + ')');
        fg.addColorStop(0.5, 'rgba(180,40,20,' + (flick * 0.4) + ')');
        fg.addColorStop(1, 'rgba(100,20,0,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    // 顶部红黑渐变
    var topG = ctx.createLinearGradient(0, 0, 0, groundY);
    topG.addColorStop(0, 'rgba(80,10,10,0.4)');
    topG.addColorStop(1, 'rgba(40,0,0,0)');
    ctx.fillStyle = topG;
    ctx.fillRect(0, 0, w, groundY);
    // 红色眼睛（3 对）
    for (var i = 0; i < 3; i++) {
        var flick = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 1.5));
        var ex = w * (0.2 + i * 0.3);
        var ey = groundY * (0.3 + i * 0.1);
        ctx.fillStyle = 'rgba(255,40,0,' + flick + ')';
        ctx.beginPath();
        ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }
},
// 主调度函数 - 按章节名称选择场景
drawSceneBackground: function(ctx, w, h) {
    // 魔王副本：竹林场景（加 try-catch 兜底防止渲染崩）
    if (this.isDungeon && this.dungeonType === 'demonking') {
        try {
            this._drawSceneBamboo(ctx, w, h);
        } catch (e) {
            // 绘制失败用深绿色纯色背景兜底
            ctx.fillStyle = '#0a1a0a';
            ctx.fillRect(0, 0, w, h);
        }
        return;
    }
    var stage = this.stage || 1;
    var groundY = h * 0.68;
    var stageName = (typeof getStageName === 'function') ? getStageName(stage) : '未知';
    var sceneType = this._stageSceneMap[stageName] || 'grassland';

    // ★ 图片背景优先：如果 BgLoader 已加载对应图片，直接贴图 + 动态特效
    if (typeof BgLoader !== 'undefined') {
        var bgImg = BgLoader.get(sceneType);
        if (bgImg) {
            ctx.drawImage(bgImg, 0, 0, w, h);
            this._drawSceneEffects(ctx, w, h, groundY, stage, sceneType);
            return;
        }
    }

    // 旧版程序化绘制（图片未加载时兜底）
    switch (sceneType) {
        case 'forest': this._drawSceneForest(ctx, w, h, groundY, stage); break;
        case 'graveyard': this._drawSceneGraveyard(ctx, w, h, groundY, stage); break;
        case 'volcano': this._drawSceneVolcano(ctx, w, h, groundY, stage); break;
        case 'ice': this._drawSceneIce(ctx, w, h, groundY, stage); break;
        case 'ruins': this._drawSceneRuins(ctx, w, h, groundY, stage); break;
        case 'abyss': this._drawSceneAbyss(ctx, w, h, groundY, stage); break;
        case 'dragon': this._drawSceneDragon(ctx, w, h, groundY, stage); break;
        case 'divine': this._drawSceneDivine(ctx, w, h, groundY, stage); break;
        case 'chaos': this._drawSceneChaos(ctx, w, h, groundY, stage); break;
        case 'star': this._drawSceneStar(ctx, w, h, groundY, stage); break;
        case 'time': this._drawSceneTime(ctx, w, h, groundY, stage); break;
        case 'storm': this._drawSceneStorm(ctx, w, h, groundY, stage); break;
        case 'crystal': this._drawSceneCrystal(ctx, w, h, groundY, stage); break;
        case 'sea': this._drawSceneSea(ctx, w, h, groundY, stage); break;
        case 'sky': this._drawSceneSky(ctx, w, h, groundY, stage); break;
        case 'shadow': this._drawSceneShadow(ctx, w, h, groundY, stage); break;
        case 'swamp': this._drawSceneSwamp(ctx, w, h, groundY, stage); break;
        case 'labyrinth': this._drawSceneLabyrinth(ctx, w, h, groundY, stage); break;
        case 'battlefield': this._drawSceneBattlefield(ctx, w, h, groundY, stage); break;
        case 'demon': this._drawSceneDemon(ctx, w, h, groundY, stage); break;
        default: this._drawSceneGrassland(ctx, w, h, groundY, stage);
    }
    // v2.6.2: 静态背景之上叠加动态特效层(飘花/飘雪/飞灰/星尘 等 20 场景)
    this._drawSceneEffects(ctx, w, h, groundY, stage, sceneType);
},

// 绘制单位（带身体轮廓、名称、血蓝条、等级经验）
drawUnit: function(ctx, unit, color, isAlly) {
    var x = unit.x;
    var y = unit.y;
    
    // 攻击前冲偏移
    if (unit.attackAnim) {
        var progress = unit.attackAnim.progress / unit.attackAnim.duration;
        var lunge = Math.sin(progress * Math.PI) * 12;
        if (isAlly) {
            x += lunge;
        } else {
            x -= lunge;
        }
    }
    
    var r = unit.elite ? 22 : 18;
    var bodyColor = color;

    // 名字Y偏移：考虑 renderScale 放大
    var scaleMult = (unit.renderScale && unit.renderScale > 1) ? unit.renderScale : 1;
    var nameOffset = (r * scaleMult) + 22;

    // 精英光环
    if (unit.elite) {
        ctx.beginPath();
        ctx.arc(x, y-6, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 旋转星芒
        var t = Date.now() / 500;
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 1;
        for (var si = 0; si < 4; si++) {
            var angle = t + si * Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(x, y-6);
            ctx.lineTo(x + Math.cos(angle)*(r+8), y - 6 + Math.sin(angle)*(r+8));
            ctx.stroke();
        }
    }
    
    // ★ 先绘制模型（骨骼/精灵）
    if (isAlly) {
        if (unit.skeleton) {
            unit.skeleton.posX = x;
            unit.skeleton.posY = y;
            unit.skeleton.update(0);
            unit.skeleton.render(ctx);
        } else {
            SpriteRenderer.drawClassSprite(ctx, unit.classId, x, y, r, bodyColor);
        }
    } else {
        if (unit.skeleton) {
            unit.skeleton.posX = x;
            unit.skeleton.posY = y;
            unit.skeleton.update(0);
            unit.skeleton.render(ctx);
        } else {
            SpriteRenderer.drawMonsterSprite(ctx, unit.name, x, y, r, bodyColor, unit.elite, unit.isFriend);
        }
    }

    // ★ 再绘制名称（在模型上方，不被遮挡）
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    var nameColor = '#ffd700';
    if (!isAlly) {
        if (unit.isBoss) nameColor = '#f44336';
        else if (unit.elite) nameColor = '#ce93d8';
        else nameColor = '#ffffff';
    }
    ctx.fillStyle = nameColor;
    var displayName = unit.name || '怪物';
    if (!isAlly && unit.elite && displayName.indexOf('·精英') === -1 && displayName.indexOf('·BOSS') === -1) {
        displayName += unit.isBoss ? '·BOSS' : '·精英';
    }
    ctx.fillText(displayName, x, y - nameOffset);

    // 护盾光晕 - 金色旋转光圈（受护盾加持的角色）
    if (unit.statusEffects) {
        for (var shi = 0; shi < unit.statusEffects.length; shi++) {
            if (unit.statusEffects[shi].id === 'shield') {
                var shieldPulse = Date.now() / 800;
                ctx.beginPath();
                ctx.arc(x, y - 4, r + 6 + Math.sin(shieldPulse) * 2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,215,0,' + (0.4 + Math.sin(shieldPulse) * 0.2) + ')';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                // 内圈
                ctx.beginPath();
                ctx.arc(x, y - 4, r + 3, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,215,0,0.15)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                break;
            }
        }
    }

    // 受击闪烁
    if (unit.hitFlash && unit.hitFlash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, (unit.hitFlash / 100) * 0.5) + ')';
        ctx.fillRect(x - r, y - r - 5, r * 2, r * 2 + 5);
    }
    // 技能施放闪光
    if (unit.skillFlash && unit.skillFlash > 0) {
        ctx.strokeStyle = 'rgba(255,200,50,' + Math.min(0.6, (unit.skillFlash / 200) * 0.6) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y - 4, r + 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 血条
    var hpPct = Math.max(0, unit.hp / unit.maxHp);
    var barW = 36;
    var barH = 4;
    var barX = x - barW / 2;
    var barY = y + r * 0.7 + 4;

    // 血条背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX-1, barY-1, barW+2, barH+2);
    // 血条
    var hpColor = hpPct > 0.5 ? '#4caf50' : (hpPct > 0.25 ? '#ff9800' : '#f44336');
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    // 白甲护盾条（覆盖在血条之上）
    if (unit.shieldMax > 0 && unit.shieldHp > 0) {
        var shPct = Math.max(0, unit.shieldHp / unit.shieldMax);
        var shBarY = barY - 5; // 紧贴血条上方
        // 护盾条背景（深灰）
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(barX-1, shBarY-1, barW+2, barH+2);
        // 白色填充
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barX, shBarY, barW * shPct, barH);
        // 冰凉高光顶部细线
        ctx.fillStyle = 'rgba(220,235,255,0.9)';
        ctx.fillRect(barX, shBarY, barW * shPct, 1);
    }
    
    // HP数值
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.fillText(Math.ceil(unit.hp) + '/' + unit.maxHp, x, barY + barH + 1);

    // MP条（蓝色，HP下方）
    var mpPct = Math.max(0, unit.mp / unit.maxMp);
    var mpBarY = barY + 14;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX-1, mpBarY-1, barW+2, barH+2);
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(barX, mpBarY, barW * mpPct, barH);
    ctx.fillStyle = '#90caf9';
    ctx.fillText(Math.ceil(unit.mp) + '/' + unit.maxMp, x, mpBarY + barH + 1);

    // 状态效果图标
    if (unit.statusEffects && unit.statusEffects.length > 0) {
        var iconSize = 14;
        var iconSpacing = 16;
        var startX = isAlly ? x - r - 24 : x + r + 4;
        var startY = y - r - 4;
        for (var sei = 0; sei < Math.min(unit.statusEffects.length, 4); sei++) {
            var effData = STATUS_EFFECTS[unit.statusEffects[sei].id];
            if (!effData) continue;
            var ix = startX;
            var iy = startY + sei * iconSpacing;
            // 背景圆
            ctx.beginPath();
            ctx.arc(ix, iy, 7, 0, Math.PI * 2);
            ctx.fillStyle = effData.type === 'buff' ? 'rgba(76,175,80,0.5)' : 'rgba(244,67,54,0.5)';
            ctx.fill();
            ctx.strokeStyle = effData.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // 图标文字
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(effData.icon, ix, iy);
        }
    }

    // 友方额外：等级 + 经验条（MP下方）
    if (isAlly) {
        var lvY = mpBarY + 14;
        ctx.font = '7px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('Lv.' + (unit.level || 1), x, lvY);
        // 经验条
        var expBarY = lvY + 10;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(barX-1, expBarY-1, barW+2, 3);
        var expPct = (unit.exp || 0) / (unit.expToNext || 1);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(barX, expBarY, barW * Math.min(1, expPct), 2);
    }
},

// ====== 竹林场景（魔王副本专用）======
_drawSceneBamboo: function(ctx, w, h) {
    // 天空渐变（深墨绿 → 暗绿）
    var skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0a1a0a');
    skyGrad.addColorStop(0.4, '#1a2e1a');
    skyGrad.addColorStop(0.7, '#0d1f0d');
    skyGrad.addColorStop(1, '#061206');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 月光光晕
    var moonX = w * 0.75, moonY = h * 0.15, moonR = 40;
    var moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 3);
    moonGlow.addColorStop(0, 'rgba(200,220,180,0.25)');
    moonGlow.addColorStop(0.5, 'rgba(150,180,130,0.08)');
    moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, w, h);

    // 月亮
    ctx.fillStyle = 'rgba(220,240,200,0.3)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // 远山剪影
    ctx.fillStyle = '#061008';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.55);
    ctx.quadraticCurveTo(w * 0.15, h * 0.42, w * 0.3, h * 0.5);
    ctx.quadraticCurveTo(w * 0.5, h * 0.38, w * 0.7, h * 0.48);
    ctx.quadraticCurveTo(w * 0.85, h * 0.35, w, h * 0.5);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // 薄雾层
    var mistGrad = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.7);
    mistGrad.addColorStop(0, 'rgba(200,220,180,0)');
    mistGrad.addColorStop(0.6, 'rgba(180,200,160,0.06)');
    mistGrad.addColorStop(1, 'rgba(150,170,130,0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, h * 0.25, w, h * 0.45);

    // === 竹林（精简版：12根，每根3节，减少渐变开销）====
    var BAMBOO_COUNT = 12;
    var t = Date.now() / 3000;
    var preColors = [];
    for (var i = 0; i < BAMBOO_COUNT; i++) {
        var gb = 40 + (i % 5) * 5;
        preColors.push([
            'rgb(20,' + gb + ',15)',
            'rgb(30,' + (gb + 25) + ',20)',
            'rgb(25,' + (gb + 15) + ',18)',
            'rgb(15,' + (gb - 5) + ',10)'
        ]);
    }
    for (var i = 0; i < BAMBOO_COUNT; i++) {
        var bx = w * 0.5 + i * (w * 0.5 / BAMBOO_COUNT);
        var bTop = h * 0.22 + (i % 5) * h * 0.04;
        var bBot = h * 0.88;
        var bw = 6 + (i % 3) * 3;
        var sway = Math.sin(t + i * 0.7) * (1.5 + i % 2);
        var cols = preColors[i];

        // 3节竹段
        var segH = (bBot - bTop) / 3;
        for (var s = 0; s < 3; s++) {
            var sy = bTop + s * segH;
            var segGrad = ctx.createLinearGradient(bx - bw/2, 0, bx + bw/2, 0);
            segGrad.addColorStop(0, cols[0]);
            segGrad.addColorStop(0.35, cols[1]);
            segGrad.addColorStop(0.7, cols[2]);
            segGrad.addColorStop(1, cols[3]);
            ctx.fillStyle = segGrad;
            ctx.fillRect(bx - bw/2 + sway * 0.3, sy, bw, segH + 2);
        }

        // 竹叶
        var lx = bx + sway * 0.5;
        var ly = bTop;
        ctx.fillStyle = 'rgba(30,70,25,0.6)';
        ctx.save();
        ctx.translate(lx, ly);
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.quadraticCurveTo(-4, -8, 6, -3);
        ctx.quadraticCurveTo(12, 2, 16, 0);
        ctx.quadraticCurveTo(6, 4, -14, 0);
        ctx.fill();
        ctx.restore();
    }

    // 前景草丛
    for (var g = 0; g < 40; g++) {
        var gx = g * (w / 40);
        var gy = h * 0.78 + (g % 5) * h * 0.02;
        ctx.fillStyle = 'rgba(20,' + (50 + g % 10) + ',15,0.6)';
        ctx.beginPath();
        ctx.moveTo(gx - 3, gy + 12);
        ctx.quadraticCurveTo(gx - 1, gy - 6 - (g % 5) * 3, gx + 1, gy + 12);
        ctx.fill();
    }

    // 地面
    var groundGrad = ctx.createLinearGradient(0, h * 0.82, 0, h);
    groundGrad.addColorStop(0, '#0d1a0a');
    groundGrad.addColorStop(0.5, '#0a1408');
    groundGrad.addColorStop(1, '#060c04');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.82, w, h * 0.18);

    // 飘浮萤火虫
    var fireflyTime = Date.now() / 1500;
    for (var f = 0; f < 12; f++) {
        var fx = w * 0.55 + Math.sin(fireflyTime * 0.7 + f * 1.3) * w * 0.2;
        var fy = h * 0.3 + Math.cos(fireflyTime * 0.5 + f * 0.9) * h * 0.3;
        var alpha = 0.3 + Math.sin(fireflyTime * 2 + f) * 0.3;
        ctx.fillStyle = 'rgba(180,255,150,' + alpha + ')';
        ctx.shadowColor = 'rgba(150,255,100,0.6)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // 标题
    ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText('竹 林 深 处', w * 0.75, h * 0.12);
},
    };
    for (var __k in __methods) {
        BattleManager[__k] = __methods[__k];
    }
})();
