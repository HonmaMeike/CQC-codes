// ========== 卡通渲染工具 ==========
// 给 sprite 加 outline(描边)+ cel-shading(分层色块)
// 用户的 B:升级为卡通渲染风格
//
// 用法:
//   ctx.save();
//   CartoonRenderer.applyToon(ctx, '#4fc3f7');  // 设主色
//   ...画 sprite...
//   ctx.restore();

// v2.6.2: roundRect/ellipse polyfill (Edge/Chrome 99+ 才有, 老 Edge 100% 缺)
//   玩家用 Edge + file:// 跑,有些 Win10 自带 Edge 旧版没 roundRect
if (typeof CanvasRenderingContext2D !== 'undefined') {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
            else if (!r) r = { tl: 0, tr: 0, br: 0, bl: 0 };
            this.beginPath();
            this.moveTo(x + r.tl, y);
            this.lineTo(x + w - r.tr, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
            this.lineTo(x + w, y + h - r.br);
            this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
            this.lineTo(x + r.bl, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
            this.lineTo(x, y + r.tl);
            this.quadraticCurveTo(x, y, x + r.tl, y);
            this.closePath();
            return this;
        };
    }
    if (!CanvasRenderingContext2D.prototype.ellipse) {
        CanvasRenderingContext2D.prototype.ellipse = function(x, y, rx, ry, rotation, startAngle, endAngle, anticlockwise) {
            this.save();
            this.translate(x, y);
            this.rotate(rotation);
            this.scale(rx / (rx || 1), ry / (ry || 1));
            this.arc(0, 0, 1, startAngle || 0, endAngle || Math.PI * 2, anticlockwise || false);
            this.restore();
            return this;
        };
    }
}

// ============================================================
// 描边工具 - 在画 sprite 前包裹一层 outline
// ============================================================
var Toon = {
    /**
     * 在已画好的 sprite 周围画描边
     *   ctx: Canvas2D 上下文
     *   x, y: sprite 中心
     *   radius: sprite 半径
     *   color: 描边色(默认黑)
     *   thickness: 描边粗细(像素)
     */
    drawOutline: function(ctx, x, y, radius, color, thickness) {
        color = color || '#0a0a14';
        thickness = thickness || 2;
        // 圆形外圈 + 内部镂空(模拟"描边"效果)
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.arc(x, y, radius + 1, 0, Math.PI * 2);
        ctx.stroke();
        // 内部粗描边
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = thickness * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    /**
     * Cel-shading 颜色转换:把渐变简化为 2-3 层硬色阶
     *   baseColor: '#4fc3f7' → { shadow: '#01579b', mid: '#4fc3f7', light: '#b3e5fc' }
     */
    celPalette: function(baseColor) {
        // 用 Canvas 的解析机制不够,这里手算 RGB + 调亮/调暗
        var rgb = hexToRgb(baseColor);
        if (!rgb) return { shadow: '#333333', mid: baseColor, light: '#ffffff' };
        var shadow = rgbToHex(
            Math.floor(rgb.r * 0.4),
            Math.floor(rgb.g * 0.4),
            Math.floor(rgb.b * 0.4)
        );
        var light = rgbToHex(
            Math.min(255, Math.floor(rgb.r * 1.0 + (255 - rgb.r) * 0.4)),
            Math.min(255, Math.floor(rgb.g * 1.0 + (255 - rgb.g) * 0.4)),
            Math.min(255, Math.floor(rgb.b * 1.0 + (255 - rgb.b) * 0.4))
        );
        return { shadow: shadow, mid: baseColor, light: light };
    },

    /**
     * 用 cel-shading 替换 ctx 当前 fillStyle 为分阶色
     *   ctx: 上下文
     *   baseColor: 基础色
     *   region: 'shadow' | 'mid' | 'light'
     */
    setCelFill: function(ctx, baseColor, region) {
        var palette = this.celPalette(baseColor);
        var c = region === 'shadow' ? palette.shadow : (region === 'light' ? palette.light : palette.mid);
        ctx.fillStyle = c;
        return c;
    }
};

// 辅助:hex → rgb
function hexToRgb(hex) {
    if (typeof hex !== 'string') return null;
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return null;
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r: r, g: g, b: b };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(v) {
        var s = Math.max(0, Math.min(255, v)).toString(16);
        return s.length === 1 ? '0' + s : s;
    }).join('');
}

// ============================================================
// 卡通渲染模式的 sprite 重绘工具
// ============================================================
var ToonSprite = {
    /**
     * 把现有 draw* 风格的 sprite 输出为卡通版本
     *   简化做法:在现有 sprite 周围加一层描边 + 替换主色为 cel-shading 三阶色
     *   完整版需要重写 sprite.js,但先给个轻量级方案
     */
    /**
     * 给 sprite 套一个 cel-shading 风格的"高光带"
     *   用法:在 sprite 画完后调用
     */
    addHighlightBand: function(ctx, x, y, r, color) {
        color = color || 'rgba(255,255,255,0.25)';
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.15, y - r * 0.4, r * 0.45, r * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    /**
     * 给 sprite 底部加阴影椭圆
     */
    addGroundShadow: function(ctx, x, y, r) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.7, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    /**
     * cel-shading 高光带 - 在身体左侧加一道斜高光
     */
    addCelHighlight: function(ctx, x, y, r, color) {
        color = color || 'rgba(255,255,255,0.35)';
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.2);
        ctx.lineTo(x + r * 0.1, y - r * 0.2);
        ctx.lineTo(x + r * 0.2, y + r * 0.3);
        ctx.lineTo(x - r * 0.4, y + r * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
};

// ============================================================
// 卡通版 knight 重写(用 cel-shading 三阶色 + 厚描边)
// ============================================================
function drawKnightToon(ctx, x, y, r, color) {
    var baseColor = color || '#4fc3f7';
    var palette = Toon.celPalette(baseColor);
    var s = r / 18;
    // 地面阴影
    ToonSprite.addGroundShadow(ctx, x, y, r);
    // 披风(用 cel 3 色分阶)
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y - r * 0.3);
    ctx.lineTo(x - r * 0.7, y + r * 0.6);
    ctx.lineTo(x + r * 0.7, y + r * 0.6);
    ctx.lineTo(x + r * 0.3, y - r * 0.3);
    ctx.closePath();
    ctx.fill();
    // 披风中段高光
    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.25, y - r * 0.25);
    ctx.lineTo(x - r * 0.55, y + r * 0.55);
    ctx.lineTo(x + r * 0.55, y + r * 0.55);
    ctx.lineTo(x + r * 0.25, y - r * 0.25);
    ctx.closePath();
    ctx.fill();
    // 披风亮色高光
    ctx.fillStyle = '#ef5350';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.2, y - r * 0.2);
    ctx.lineTo(x - r * 0.4, y + r * 0.3);
    ctx.lineTo(x + r * 0.4, y + r * 0.3);
    ctx.lineTo(x + r * 0.2, y - r * 0.2);
    ctx.closePath();
    ctx.fill();
    // 身体(cel 3 色分阶)
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.7, r * 0.1);
    ctx.fill();
    ctx.fillStyle = palette.mid;
    ctx.beginPath();
    ctx.roundRect(x - r * 0.45, y - r * 0.28, r * 0.9, r * 0.65, r * 0.1);
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.fillRect(x - r * 0.4, y - r * 0.25, r * 0.35, r * 0.4);
    // 描边(身体)
    ctx.strokeStyle = '#0a0a14';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.7, r * 0.1);
    ctx.stroke();
    // 头
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.6, r * 0.4, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.mid;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.05, y - r * 0.62, r * 0.35, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.1, y - r * 0.7, r * 0.18, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a0a14';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.6, r * 0.4, r * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 面罩
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x - r * 0.2, y - r * 0.65, r * 0.4, r * 0.08);
    ctx.strokeRect(x - r * 0.2, y - r * 0.65, r * 0.4, r * 0.08);
    // 腿
    ctx.fillStyle = palette.shadow;
    ctx.fillRect(x - r * 0.3, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.fillRect(x + r * 0.1, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.strokeRect(x - r * 0.3, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.strokeRect(x + r * 0.1, y + r * 0.4, r * 0.2, r * 0.35);
    // 靴子
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(x - r * 0.35, y + r * 0.65, r * 0.25, r * 0.12);
    ctx.fillRect(x + r * 0.1, y + r * 0.65, r * 0.25, r * 0.12);
    // 整个单位描边圈
    Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
}

// ============================================================
// 7 个职业卡通渲染 (v2.6.1)
//   风格统一: cel-shading 三阶色 + 厚黑描边 + 身体主色 + 关键发光点
// ============================================================

// 法师 - 紫袍 + 尖帽 + 发光魔杖
function drawMageToon(ctx, x, y, r, color) {
    ToonSprite.addGroundShadow(ctx, x, y, r);
    var p = Toon.celPalette(color || '#7b1fa2');
    var s = r / 18;
    // 法袍三阶
    ctx.fillStyle = p.shadow; ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15); ctx.fill();
    ctx.fillStyle = p.mid;    ctx.beginPath(); ctx.roundRect(x - r * 0.45, y - r * 0.22, r * 0.9, r * 0.65, r * 0.15); ctx.fill();
    ctx.fillStyle = p.light;  ctx.fillRect(x - r * 0.4, y - r * 0.2, r * 0.35, r * 0.4);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15); ctx.stroke();
    // 金色符文带
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - r * 0.1, y - r * 0.15, r * 0.2, r * 0.05);
    ctx.fillRect(x - r * 0.1, y + r * 0.1, r * 0.2, r * 0.05);
    ctx.fillRect(x - r * 0.1, y + r * 0.25, r * 0.2, r * 0.05);
    // 中心宝石
    var gemGrd = ctx.createRadialGradient(x, y + r * 0.2, 0, x, y + r * 0.2, r * 0.12);
    gemGrd.addColorStop(0, '#fff'); gemGrd.addColorStop(0.4, '#e040fb'); gemGrd.addColorStop(1, '#4a148c');
    ctx.fillStyle = gemGrd;
    ctx.beginPath(); ctx.arc(x, y + r * 0.2, r * 0.1, 0, Math.PI * 2); ctx.fill();
    // 尖帽
    ctx.fillStyle = p.shadow;
    ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.4); ctx.lineTo(x, y - r * 1.15); ctx.lineTo(x + r * 0.4, y - r * 0.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.mid;
    ctx.beginPath(); ctx.moveTo(x - r * 0.25, y - r * 0.42); ctx.lineTo(x, y - r * 1.05); ctx.lineTo(x + r * 0.25, y - r * 0.42); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.4); ctx.lineTo(x, y - r * 1.15); ctx.lineTo(x + r * 0.4, y - r * 0.4); ctx.closePath(); ctx.stroke();
    // 帽尖星
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 5;
    ctx.fillStyle = '#ffd700';
    SpriteRenderer.drawStar(ctx, x, y - r * 1.15, r * 0.06);
    ctx.shadowBlur = 0;
    // 脸
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath(); ctx.arc(x, y - r * 0.45, r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s; ctx.stroke();
    // 蓝光眼
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath(); ctx.arc(x - r * 0.08, y - r * 0.45, r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.08, y - r * 0.45, r * 0.04, 0, Math.PI * 2); ctx.fill();
    // 魔杖
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x + r * 0.6, y - r * 0.2); ctx.lineTo(x + r * 0.9, y + r * 0.6); ctx.stroke();
    // 魔杖宝石发光
    ctx.shadowColor = '#e040fb'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#e040fb';
    ctx.beginPath(); ctx.arc(x + r * 0.6, y - r * 0.25, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // 腿
    ctx.fillStyle = p.shadow; ctx.fillRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
    Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
}

// 战士 - 怒发红甲
function drawWarriorToon(ctx, x, y, r, color) {
    ToonSprite.addGroundShadow(ctx, x, y, r);
    var p = Toon.celPalette(color || '#d32f2f');
    var s = r / 18;
    // 怒发(顶部黑红)
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y - r * 0.5);
    ctx.lineTo(x - r * 0.55, y - r * 0.85);
    ctx.lineTo(x - r * 0.25, y - r * 0.6);
    ctx.lineTo(x - r * 0.1, y - r * 0.9);
    ctx.lineTo(x, y - r * 0.55);
    ctx.lineTo(x + r * 0.1, y - r * 0.9);
    ctx.lineTo(x + r * 0.25, y - r * 0.6);
    ctx.lineTo(x + r * 0.55, y - r * 0.85);
    ctx.lineTo(x + r * 0.4, y - r * 0.5);
    ctx.closePath();
    ctx.fill();
    // 身体(三阶)
    ctx.fillStyle = p.shadow; ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.7, r * 0.1); ctx.fill();
    ctx.fillStyle = p.mid;    ctx.beginPath(); ctx.roundRect(x - r * 0.45, y - r * 0.28, r * 0.9, r * 0.65, r * 0.1); ctx.fill();
    ctx.fillStyle = p.light;  ctx.fillRect(x - r * 0.4, y - r * 0.25, r * 0.3, r * 0.4);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.7, r * 0.1); ctx.stroke();
    // 胸甲 X
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x - r * 0.15, y - r * 0.1); ctx.lineTo(x + r * 0.15, y + r * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.15, y - r * 0.1); ctx.lineTo(x - r * 0.15, y + r * 0.2); ctx.stroke();
    // 头
    ctx.fillStyle = p.shadow; ctx.beginPath(); ctx.ellipse(x, y - r * 0.55, r * 0.35, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.ellipse(x - r * 0.05, y - r * 0.55, r * 0.32, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.55, r * 0.35, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    // 怒眉 + 眼
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x - r * 0.15, y - r * 0.6, r * 0.1, r * 0.04);
    ctx.fillRect(x + r * 0.05, y - r * 0.6, r * 0.1, r * 0.04);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - r * 0.07, y - r * 0.55, r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.07, y - r * 0.55, r * 0.04, 0, Math.PI * 2); ctx.fill();
    // 双斧头(肩部)
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(x - r * 0.55, y - r * 0.1, r * 0.1, r * 0.4);
    ctx.fillRect(x + r * 0.45, y - r * 0.1, r * 0.1, r * 0.4);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - r * 0.6, y - r * 0.2, r * 0.2, r * 0.15);
    ctx.fillRect(x + r * 0.4, y - r * 0.2, r * 0.2, r * 0.15);
    // 腿
    ctx.fillStyle = p.shadow; ctx.fillRect(x - r * 0.3, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.fillRect(x + r * 0.1, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s;
    ctx.strokeRect(x - r * 0.3, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.strokeRect(x + r * 0.1, y + r * 0.4, r * 0.2, r * 0.35);
    Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
}

// 刺客 - 黑衣蒙面
function drawAssassinToon(ctx, x, y, r, color) {
    ToonSprite.addGroundShadow(ctx, x, y, r);
    var p = Toon.celPalette(color || '#212121');
    var s = r / 18;
    // 身体(三阶深色)
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.roundRect(x - r * 0.45, y - r * 0.25, r * 0.9, r * 0.65, r * 0.1); ctx.fill();
    ctx.fillStyle = p.shadow;
    ctx.beginPath(); ctx.roundRect(x - r * 0.4, y - r * 0.22, r * 0.8, r * 0.6, r * 0.1); ctx.fill();
    ctx.fillStyle = p.mid;
    ctx.fillRect(x - r * 0.35, y - r * 0.2, r * 0.25, r * 0.4);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x - r * 0.45, y - r * 0.25, r * 0.9, r * 0.65, r * 0.1); ctx.stroke();
    // 兜帽
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.4); ctx.quadraticCurveTo(x, y - r * 1.0, x + r * 0.4, y - r * 0.4); ctx.lineTo(x + r * 0.3, y - r * 0.2); ctx.lineTo(x - r * 0.3, y - r * 0.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s; ctx.stroke();
    // 蒙面(只露眼睛)
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath(); ctx.arc(x, y - r * 0.45, r * 0.18, 0, Math.PI * 2); ctx.fill();
    // 红光眼(刺客)
    ctx.shadowColor = '#f44336'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#f44336';
    ctx.beginPath(); ctx.arc(x - r * 0.08, y - r * 0.45, r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.08, y - r * 0.45, r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // 双匕首
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(x - r * 0.55, y + r * 0.05, r * 0.08, r * 0.3);
    ctx.fillRect(x + r * 0.45, y + r * 0.05, r * 0.08, r * 0.3);
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath(); ctx.moveTo(x - r * 0.51, y - r * 0.1); ctx.lineTo(x - r * 0.47, y - r * 0.1); ctx.lineTo(x - r * 0.55, y + r * 0.05); ctx.lineTo(x - r * 0.43, y + r * 0.05); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + r * 0.49, y - r * 0.1); ctx.lineTo(x + r * 0.53, y - r * 0.1); ctx.lineTo(x + r * 0.45, y + r * 0.05); ctx.lineTo(x + r * 0.57, y + r * 0.05); ctx.closePath(); ctx.fill();
    // 腿
    ctx.fillStyle = '#000'; ctx.fillRect(x - r * 0.25, y + r * 0.4, r * 0.15, r * 0.35);
    ctx.fillRect(x + r * 0.1, y + r * 0.4, r * 0.15, r * 0.35);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s;
    ctx.strokeRect(x - r * 0.25, y + r * 0.4, r * 0.15, r * 0.35);
    ctx.strokeRect(x + r * 0.1, y + r * 0.4, r * 0.15, r * 0.35);
    Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
}

// 召唤师 - 绿袍 + 法阵
function drawSummonerToon(ctx, x, y, r, color) {
    ToonSprite.addGroundShadow(ctx, x, y, r);
    var p = Toon.celPalette(color || '#1b5e20');
    var s = r / 18;
    // 脚下法阵
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y + r * 0.5, r * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.beginPath(); ctx.arc(x, y + r * 0.5, r * 0.45, 0, Math.PI * 2); ctx.stroke();
    // 身体三阶
    ctx.fillStyle = p.shadow; ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15); ctx.fill();
    ctx.fillStyle = p.mid;    ctx.beginPath(); ctx.roundRect(x - r * 0.45, y - r * 0.22, r * 0.9, r * 0.65, r * 0.15); ctx.fill();
    ctx.fillStyle = p.light;  ctx.fillRect(x - r * 0.4, y - r * 0.2, r * 0.3, r * 0.4);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15); ctx.stroke();
    // 兜帽
    ctx.fillStyle = p.shadow;
    ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.4); ctx.quadraticCurveTo(x, y - r * 1.0, x + r * 0.4, y - r * 0.4); ctx.lineTo(x + r * 0.3, y - r * 0.2); ctx.lineTo(x - r * 0.3, y - r * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.mid;
    ctx.beginPath(); ctx.moveTo(x - r * 0.25, y - r * 0.42); ctx.quadraticCurveTo(x, y - r * 0.92, x + r * 0.25, y - r * 0.42); ctx.lineTo(x + r * 0.22, y - r * 0.22); ctx.lineTo(x - r * 0.22, y - r * 0.22); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s; ctx.stroke();
    // 紫眼(召唤师)
    ctx.shadowColor = '#ce93d8'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#ce93d8';
    ctx.beginPath(); ctx.arc(x - r * 0.08, y - r * 0.5, r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.08, y - r * 0.5, r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // 召唤书(左手)
    ctx.fillStyle = '#4a148c';
    ctx.fillRect(x - r * 0.55, y - r * 0.1, r * 0.2, r * 0.3);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(x - r * 0.55, y - r * 0.1, r * 0.2, r * 0.3);
    // 书符文
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - r * 0.5, y, r * 0.1, r * 0.02);
    ctx.fillRect(x - r * 0.5, y + r * 0.08, r * 0.1, r * 0.02);
    // 腿
    ctx.fillStyle = p.shadow; ctx.fillRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
    Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
}

// 贤者 - 白袍 + 金光 + 治愈光环
function drawSageToon(ctx, x, y, r, color) {
    ToonSprite.addGroundShadow(ctx, x, y, r);
    var p = Toon.celPalette(color || '#f5f5f5');
    var s = r / 18;
    // 背后金光圈
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y - r * 0.2, r * 0.7, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    // 白袍三阶
    ctx.fillStyle = '#bdbdbd'; ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15); ctx.fill();
    ctx.fillStyle = p.mid;    ctx.beginPath(); ctx.roundRect(x - r * 0.45, y - r * 0.22, r * 0.9, r * 0.65, r * 0.15); ctx.fill();
    ctx.fillStyle = p.light;  ctx.fillRect(x - r * 0.4, y - r * 0.2, r * 0.3, r * 0.4);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15); ctx.stroke();
    // 金色十字
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.1); ctx.lineTo(x, y + r * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.1, y + r * 0.05); ctx.lineTo(x + r * 0.1, y + r * 0.05); ctx.stroke();
    // 头
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath(); ctx.arc(x, y - r * 0.45, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s; ctx.stroke();
    // 金发
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(x, y - r * 0.55, r * 0.25, 0, Math.PI, true); ctx.fill();
    // 蓝眼
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath(); ctx.arc(x - r * 0.07, y - r * 0.45, r * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.beginPath && false; // ignore lint
    ctx.beginPath(); ctx.arc(x + r * 0.07, y - r * 0.45, r * 0.04, 0, Math.PI * 2); ctx.fill();
    // 治疗法杖
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + r * 0.5, y + r * 0.05); ctx.lineTo(x + r * 0.65, y + r * 0.6); ctx.stroke();
    ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#b3e5fc';
    ctx.beginPath(); ctx.arc(x + r * 0.5, y, r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // 腿
    ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
    Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
}

// 亡灵法师 - 黑紫袍 + 骷髅头 + 鬼火
function drawNecromancerToon(ctx, x, y, r, color) {
    ToonSprite.addGroundShadow(ctx, x, y, r);
    var p = Toon.celPalette(color || '#4a148c');
    var s = r / 18;
    // 身体黑紫三阶
    ctx.fillStyle = '#1a0033'; ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15); ctx.fill();
    ctx.fillStyle = p.shadow; ctx.beginPath(); ctx.roundRect(x - r * 0.45, y - r * 0.22, r * 0.9, r * 0.65, r * 0.15); ctx.fill();
    ctx.fillStyle = p.mid;    ctx.fillRect(x - r * 0.4, y - r * 0.2, r * 0.3, r * 0.4);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15); ctx.stroke();
    // 骷髅头(灰白)
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.5, r * 0.25, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s; ctx.stroke();
    // 眼眶
    ctx.fillStyle = '#1a0033';
    ctx.beginPath(); ctx.arc(x - r * 0.1, y - r * 0.5, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.1, y - r * 0.5, r * 0.06, 0, Math.PI * 2); ctx.fill();
    // 红光眼
    ctx.shadowColor = '#f44336'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#f44336';
    ctx.beginPath(); ctx.arc(x - r * 0.1, y - r * 0.5, r * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.1, y - r * 0.5, r * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // 鼻洞
    ctx.fillStyle = '#1a0033';
    ctx.fillRect(x - r * 0.02, y - r * 0.42, r * 0.04, r * 0.06);
    // 牙齿
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - r * 0.12, y - r * 0.32); ctx.lineTo(x + r * 0.12, y - r * 0.32); ctx.stroke();
    for (var t = 0; t < 4; t++) ctx.strokeRect(x - r * 0.1 + t * r * 0.05, y - r * 0.32, r * 0.01, r * 0.05);
    // 头顶光环
    ctx.shadowColor = '#ce93d8'; ctx.shadowBlur = 6;
    ctx.strokeStyle = '#ce93d8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.85, r * 0.3, r * 0.08, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    // 死灵法杖
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + r * 0.6, y - r * 0.2); ctx.lineTo(x + r * 0.85, y + r * 0.6); ctx.stroke();
    ctx.shadowColor = '#9c27b0'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#9c27b0';
    ctx.beginPath(); ctx.arc(x + r * 0.6, y - r * 0.25, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // 腿
    ctx.fillStyle = '#1a0033'; ctx.fillRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
    Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
}

// 剑客 - 蓝衣 + 武士刀
function drawSwordsmanToon(ctx, x, y, r, color) {
    ToonSprite.addGroundShadow(ctx, x, y, r);
    var p = Toon.celPalette(color || '#0277bd');
    var s = r / 18;
    // 头巾
    ctx.fillStyle = p.shadow;
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.55, r * 0.35, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.mid;
    ctx.beginPath(); ctx.ellipse(x - r * 0.05, y - r * 0.55, r * 0.32, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s; ctx.stroke();
    // 头巾绑带
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - r * 0.3, y - r * 0.55); ctx.lineTo(x + r * 0.3, y - r * 0.55); ctx.stroke();
    // 脸
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath(); ctx.arc(x, y - r * 0.5, r * 0.18, 0, Math.PI * 2); ctx.fill();
    // 怒眼
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - r * 0.06, y - r * 0.5, r * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.06, y - r * 0.5, r * 0.03, 0, Math.PI * 2); ctx.fill();
    // 身体三阶
    ctx.fillStyle = p.shadow; ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.7, r * 0.1); ctx.fill();
    ctx.fillStyle = p.mid;    ctx.beginPath(); ctx.roundRect(x - r * 0.45, y - r * 0.28, r * 0.9, r * 0.65, r * 0.1); ctx.fill();
    ctx.fillStyle = p.light;  ctx.fillRect(x - r * 0.4, y - r * 0.25, r * 0.3, r * 0.4);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.7, r * 0.1); ctx.stroke();
    // 衣领 V
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x - r * 0.15, y - r * 0.25); ctx.lineTo(x, y); ctx.lineTo(x + r * 0.15, y - r * 0.25); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s; ctx.stroke();
    // 武士刀(右肩斜背)
    ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x + r * 0.55, y - r * 0.4); ctx.lineTo(x + r * 0.2, y + r * 0.4); ctx.stroke();
    // 刀柄
    ctx.fillStyle = '#5d4037';
    ctx.beginPath(); ctx.arc(x + r * 0.55, y - r * 0.4, r * 0.05, 0, Math.PI * 2); ctx.fill();
    // 刀刃阴影
    ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + r * 0.55, y - r * 0.4); ctx.lineTo(x + r * 0.2, y + r * 0.4); ctx.stroke();
    // 腿(宽腿绑腿)
    ctx.fillStyle = p.shadow; ctx.fillRect(x - r * 0.3, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.fillRect(x + r * 0.1, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5 * s;
    ctx.strokeRect(x - r * 0.3, y + r * 0.4, r * 0.2, r * 0.35);
    ctx.strokeRect(x + r * 0.1, y + r * 0.4, r * 0.2, r * 0.35);
    // 绑腿横线
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - r * 0.3, y + r * 0.55); ctx.lineTo(x - r * 0.1, y + r * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.1, y + r * 0.55); ctx.lineTo(x + r * 0.3, y + r * 0.55); ctx.stroke();
    Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
}

// 召唤兽 通用卡通版(灵狼/凤凰/元素精灵复用, 颜色按类型)
function drawSummonToon(ctx, x, y, r, summonType) {
    ToonSprite.addGroundShadow(ctx, x, y, r);
    if (summonType === 'phoenix') {
        // 凤凰:金红渐变身体
        var grd = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 0.9);
        grd.addColorStop(0, 'rgba(255,152,0,0.6)');
        grd.addColorStop(0.5, 'rgba(255,87,34,0.3)');
        grd.addColorStop(1, 'rgba(255,87,34,0)');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.05, r * 0.35, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.ellipse(x - r * 0.05, y + r * 0.05, r * 0.32, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + r * 0.05, r * 0.35, r * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
        // 翅膀
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.moveTo(x - r * 0.1, y - r * 0.1); ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.5, x - r * 0.55, y - r * 0.1); ctx.quadraticCurveTo(x - r * 0.3, y + r * 0.1, x - r * 0.1, y - r * 0.1); ctx.fill();
        ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - r * 0.1, y + r * 0.1); ctx.quadraticCurveTo(x - r * 0.5, y + r * 0.5, x - r * 0.55, y + r * 0.2); ctx.quadraticCurveTo(x - r * 0.3, y + r * 0.15, x - r * 0.1, y + r * 0.1); ctx.fill();
        ctx.stroke();
        // 头
        ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2; ctx.stroke();
        // 凤冠
        ctx.fillStyle = '#ffd700';
        for (var fi = 0; fi < 3; fi++) {
            ctx.beginPath(); ctx.moveTo(x + r * 0.32, y - r * 0.32); ctx.lineTo(x + r * 0.25 + fi * r * 0.05, y - r * 0.55 - fi * r * 0.04); ctx.stroke();
        }
        // 嘴
        ctx.fillStyle = '#ffb300';
        ctx.beginPath(); ctx.moveTo(x + r * 0.45, y - r * 0.15); ctx.lineTo(x + r * 0.6, y - r * 0.12); ctx.lineTo(x + r * 0.45, y - r * 0.08); ctx.closePath(); ctx.fill();
        // 眼
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.18, r * 0.04, 0, Math.PI * 2); ctx.fill();
        Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
    } else if (summonType === 'elemental') {
        // 元素精灵:紫蓝六角星
        var grd = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 0.9);
        grd.addColorStop(0, 'rgba(79,195,247,0.5)');
        grd.addColorStop(0.6, 'rgba(156,39,176,0.3)');
        grd.addColorStop(1, 'rgba(156,39,176,0)');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        // 六角星
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        for (var si = 0; si < 6; si++) {
            var sa = si * Math.PI / 3 - Math.PI / 2;
            var sx = x + Math.cos(sa) * r * 0.22;
            var sy = y + Math.sin(sa) * r * 0.22;
            if (si === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2; ctx.stroke();
        // 紫核
        var cgrd = ctx.createRadialGradient(x, y, 0, x, y, r * 0.12);
        cgrd.addColorStop(0, '#fff'); cgrd.addColorStop(0.5, '#ce93d8'); cgrd.addColorStop(1, '#7b1fa2');
        ctx.fillStyle = cgrd;
        ctx.beginPath(); ctx.arc(x, y, r * 0.12, 0, Math.PI * 2); ctx.fill();
        Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
    } else {
        // 灵狼:紫蓝渐变
        var grd = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 0.9);
        grd.addColorStop(0, 'rgba(179,136,255,0.4)');
        grd.addColorStop(1, 'rgba(179,136,255,0)');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r * 0.9, 0, Math.PI * 2); ctx.fill();
        // 身体
        ctx.fillStyle = '#7e57c2'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.1, r * 0.55, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b388ff'; ctx.beginPath(); ctx.ellipse(x - r * 0.05, y + r * 0.1, r * 0.5, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, y + r * 0.1, r * 0.55, r * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
        // 头
        ctx.fillStyle = '#7e57c2'; ctx.beginPath(); ctx.arc(x + r * 0.45, y - r * 0.1, r * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b388ff'; ctx.beginPath(); ctx.arc(x + r * 0.45, y - r * 0.1, r * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2; ctx.stroke();
        // 狼耳
        ctx.fillStyle = '#7e57c2';
        ctx.beginPath(); ctx.moveTo(x + r * 0.32, y - r * 0.25); ctx.lineTo(x + r * 0.4, y - r * 0.45); ctx.lineTo(x + r * 0.48, y - r * 0.25); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + r * 0.48, y - r * 0.25); ctx.lineTo(x + r * 0.55, y - r * 0.45); ctx.lineTo(x + r * 0.6, y - r * 0.25); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1.5; ctx.stroke();
        // 鬼火眼
        ctx.shadowColor = '#ffeb3b'; ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath(); ctx.arc(x + r * 0.5, y - r * 0.12, r * 0.05, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + r * 0.4, y - r * 0.08, r * 0.04, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // 鼻
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x + r * 0.62, y - r * 0.05, r * 0.03, 0, Math.PI * 2); ctx.fill();
        Toon.drawOutline(ctx, x, y, r, '#0a0a14', 2);
    }
}