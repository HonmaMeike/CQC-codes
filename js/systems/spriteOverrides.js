// ========== Enhanced RPG Character Sprites v1.0 ==========
// Overrides the 8 class Toon draw functions with detailed RPG-style characters
// featuring proper body proportions, class-themed armor/weapons, and idle animation.
// Each function signature: (ctx, x, y, r, color) — matches existing skeleton binding.
// ==========================================================
(function() {
    'use strict';

    // ---- helper: draw a 4-pointed sparkle / star ----
    function drawSparkle(ctx, cx, cy, size) {
        ctx.beginPath();
        for (var i = 0; i < 4; i++) {
            var a = i * Math.PI / 2 + Math.PI / 4;
            var sx = cx + Math.cos(a) * size;
            var sy = cy + Math.sin(a) * size;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
            a += Math.PI / 4;
            sx = cx + Math.cos(a) * size * 0.35;
            sy = cy + Math.sin(a) * size * 0.35;
            ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
    }

    // ---- helper: draw a small glow circle ----
    function drawGlow(ctx, cx, cy, radius, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha || 0.6;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ---- get idle bob offset (sine wave breathing) ----
    function idleBob(amp) {
        var t = Date.now() * 0.003;
        return Math.sin(t) * (amp || 1.2);
    }

    // ---- get weapon bob offset (slower sine for weapon sway) ----
    function weaponBob(amp) {
        var t = Date.now() * 0.002;
        return Math.sin(t) * (amp || 0.8);
    }

    // ==========================================================
    // 1. KNIGHT - Full plate armor, broadsword + shield, blue/silver/gold
    // ==========================================================
    window.drawKnightToon = function(ctx, x, y, r, color) {
        var baseC = color || '#4a90d9';
        var pal = Toon.celPalette(baseC);
        var s = r / 18;
        var bob = idleBob(1.0);

        // ground shadow
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.65, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- CAPE (red, flowing behind) ----
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.25 + bob);
        ctx.quadraticCurveTo(x - r * 0.7, y + r * 0.5 + bob + 3, x - r * 0.5, y + r * 0.7 + bob);
        ctx.quadraticCurveTo(x, y + r * 0.8 + bob, x + r * 0.5, y + r * 0.7 + bob);
        ctx.quadraticCurveTo(x + r * 0.7, y + r * 0.5 + bob + 3, x + r * 0.25, y - r * 0.25 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#9e0000';
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // cape highlight
        ctx.fillStyle = '#ef5350';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.1 + bob);
        ctx.quadraticCurveTo(x - r * 0.5, y + r * 0.3 + bob + 2, x - r * 0.35, y + r * 0.5 + bob);
        ctx.quadraticCurveTo(x, y + r * 0.55 + bob, x + r * 0.35, y + r * 0.5 + bob);
        ctx.quadraticCurveTo(x + r * 0.5, y + r * 0.3 + bob + 2, x + r * 0.15, y - r * 0.1 + bob);
        ctx.closePath();
        ctx.fill();

        // ---- LEGS (armored) ----
        // left leg
        ctx.fillStyle = pal.shadow;
        ctx.fillRect(x - r * 0.3, y + r * 0.35 + bob, r * 0.22, r * 0.35);
        ctx.fillStyle = pal.mid;
        ctx.fillRect(x - r * 0.28, y + r * 0.37 + bob, r * 0.18, r * 0.28);
        // right leg
        ctx.fillStyle = pal.shadow;
        ctx.fillRect(x + r * 0.08, y + r * 0.35 + bob, r * 0.22, r * 0.35);
        ctx.fillStyle = pal.mid;
        ctx.fillRect(x + r * 0.1, y + r * 0.37 + bob, r * 0.18, r * 0.28);
        // boots
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x - r * 0.35, y + r * 0.6 + bob, r * 0.25, r * 0.1);
        ctx.fillRect(x + r * 0.1, y + r * 0.6 + bob, r * 0.25, r * 0.1);
        // boot highlights
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x - r * 0.32, y + r * 0.62 + bob, r * 0.18, r * 0.03);
        ctx.fillRect(x + r * 0.13, y + r * 0.62 + bob, r * 0.18, r * 0.03);

        // ---- TORSO (plate armor) ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.28 + bob, r * 1.0, r * 0.65, r * 0.1);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.44, y - r * 0.25 + bob, r * 0.88, r * 0.58, r * 0.08);
        ctx.fill();
        ctx.fillStyle = pal.light;
        ctx.fillRect(x - r * 0.38, y - r * 0.22 + bob, r * 0.35, r * 0.4);
        // armor outline
        ctx.strokeStyle = '#0d2840';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.28 + bob, r * 1.0, r * 0.65, r * 0.1);
        ctx.stroke();

        // chest gem
        var gemGrd = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, r * 0.14);
        gemGrd.addColorStop(0, '#b3e5fc');
        gemGrd.addColorStop(0.4, '#4fc3f7');
        gemGrd.addColorStop(1, '#01579b');
        ctx.fillStyle = gemGrd;
        ctx.beginPath();
        ctx.arc(x, y + bob, r * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // gold armor trim (chest)
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.05 + bob);
        ctx.lineTo(x + r * 0.35, y - r * 0.05 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.2 + bob);
        ctx.lineTo(x, y + r * 0.25 + bob);
        ctx.stroke();

        // ---- SHOULDER PADS ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.5, y - r * 0.15 + bob, r * 0.15, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + r * 0.5, y - r * 0.15 + bob, r * 0.15, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.light;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.5, y - r * 0.17 + bob, r * 0.1, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + r * 0.5, y - r * 0.17 + bob, r * 0.1, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- SHIELD (left arm) ----
        ctx.fillStyle = '#1a3a5c';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.78, y - r * 0.1 + bob, r * 0.32, r * 0.48, r * 0.05);
        ctx.fill();
        ctx.fillStyle = '#4a90d9';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.76, y - r * 0.08 + bob, r * 0.28, r * 0.44, r * 0.04);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.78, y - r * 0.1 + bob, r * 0.32, r * 0.48, r * 0.05);
        ctx.stroke();
        // shield cross
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.62, y - r * 0.05 + bob);
        ctx.lineTo(x - r * 0.62, y + r * 0.3 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.73, y + r * 0.12 + bob);
        ctx.lineTo(x - r * 0.51, y + r * 0.12 + bob);
        ctx.stroke();

        // ---- SWORD (right arm) ----
        var swb = weaponBob(1.5);
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.52, y - r * 0.05 + bob + swb);
        ctx.lineTo(x + r * 0.5, y + r * 0.45 + bob + swb);
        ctx.stroke();
        // blade highlight
        ctx.strokeStyle = '#eceff1';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.53, y - r * 0.05 + bob + swb);
        ctx.lineTo(x + r * 0.51, y + r * 0.45 + bob + swb);
        ctx.stroke();
        // crossguard
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + r * 0.4, y - r * 0.08 + bob + swb, r * 0.22, r * 0.05);
        // handle
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x + r * 0.44, y - r * 0.18 + bob + swb, r * 0.12, r * 0.1);
        // pommel
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + r * 0.5, y - r * 0.22 + bob + swb, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // ---- HEAD (great helm) ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55 + bob, r * 0.38, r * 0.33, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.03, y - r * 0.57 + bob, r * 0.33, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0d2840';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55 + bob, r * 0.38, r * 0.33, 0, 0, Math.PI * 2);
        ctx.stroke();

        // visor slit (glowing)
        var visorGrd = ctx.createLinearGradient(x - r * 0.2, y - r * 0.58 + bob, x + r * 0.2, y - r * 0.58 + bob);
        visorGrd.addColorStop(0, '#1a1a2e');
        visorGrd.addColorStop(0.4, '#ff6b6b');
        visorGrd.addColorStop(0.6, '#ff6b6b');
        visorGrd.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = visorGrd;
        ctx.fillRect(x - r * 0.18, y - r * 0.58 + bob, r * 0.36, r * 0.07);

        // helm top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.1, y - r * 0.72 + bob, r * 0.15, r * 0.06, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // plume (red crest)
        ctx.fillStyle = '#ef5350';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.12, y - r * 0.8 + bob);
        ctx.quadraticCurveTo(x - r * 0.05, y - r * 1.1 + bob, x, y - r * 1.05 + bob);
        ctx.quadraticCurveTo(x + r * 0.05, y - r * 1.1 + bob, x + r * 0.12, y - r * 0.8 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.08, y - r * 0.82 + bob);
        ctx.quadraticCurveTo(x, y - r * 1.0 + bob, x + r * 0.08, y - r * 0.82 + bob);
        ctx.closePath();
        ctx.fill();

        // ---- FLOATING PARTICLES (sparks) ----
        var pt = Date.now() * 0.001;
        for (var pi = 0; pi < 4; pi++) {
            var angle = pt + pi * Math.PI / 2;
            var dist = r * (0.55 + 0.15 * Math.sin(pt * 0.7 + pi));
            var px = x + Math.cos(angle) * dist;
            var py = y + Math.sin(angle) * dist + bob;
            ctx.save();
            ctx.globalAlpha = 0.4 + 0.2 * Math.sin(pt + pi);
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // overall outline
        Toon.drawOutline(ctx, x, y + bob, r, '#0a0a14', 2);
        ctx.restore();
    };

    // ==========================================================
    // 2. MAGE - Purple robe, pointed hat, staff with floating orb
    // ==========================================================
    window.drawMageToon = function(ctx, x, y, r, color) {
        var baseC = color || '#7b1fa2';
        var pal = Toon.celPalette(baseC);
        var s = r / 18;
        var bob = idleBob(1.0);

        ctx.save();
        // ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.6, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- LEGS (robe bottom) ----
        ctx.fillStyle = pal.shadow;
        ctx.fillRect(x - r * 0.25, y + r * 0.4 + bob, r * 0.18, r * 0.3);
        ctx.fillRect(x + r * 0.07, y + r * 0.4 + bob, r * 0.18, r * 0.3);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x - r * 0.25, y + r * 0.4 + bob, r * 0.18, r * 0.3);
        ctx.strokeRect(x + r * 0.07, y + r * 0.4 + bob, r * 0.18, r * 0.3);

        // ---- ROBE (torso) ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.22 + bob, r * 1.0, r * 0.65, r * 0.15);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.44, y - r * 0.19 + bob, r * 0.88, r * 0.58, r * 0.12);
        ctx.fill();
        ctx.fillStyle = pal.light;
        ctx.fillRect(x - r * 0.38, y - r * 0.16 + bob, r * 0.3, r * 0.35);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.22 + bob, r * 1.0, r * 0.65, r * 0.15);
        ctx.stroke();

        // gold trim bands
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - r * 0.12, y - r * 0.1 + bob, r * 0.24, r * 0.04);
        ctx.fillRect(x - r * 0.12, y + r * 0.12 + bob, r * 0.24, r * 0.04);
        ctx.fillRect(x - r * 0.12, y + r * 0.25 + bob, r * 0.24, r * 0.04);

        // chest gem
        var gemGrd = ctx.createRadialGradient(x, y + r * 0.18 + bob, 0, x, y + r * 0.18 + bob, r * 0.12);
        gemGrd.addColorStop(0, '#fff');
        gemGrd.addColorStop(0.4, '#e040fb');
        gemGrd.addColorStop(1, '#4a148c');
        ctx.fillStyle = gemGrd;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.18 + bob, r * 0.09, 0, Math.PI * 2);
        ctx.fill();

        // ---- POINTED HAT ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.42, y - r * 0.35 + bob);
        ctx.lineTo(x, y - r * 1.15 + bob);
        ctx.lineTo(x + r * 0.42, y - r * 0.35 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.28, y - r * 0.37 + bob);
        ctx.lineTo(x, y - r * 1.05 + bob);
        ctx.lineTo(x + r * 0.28, y - r * 0.37 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.42, y - r * 0.35 + bob);
        ctx.lineTo(x, y - r * 1.15 + bob);
        ctx.lineTo(x + r * 0.42, y - r * 0.35 + bob);
        ctx.closePath();
        ctx.stroke();

        // hat brim
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.35 + bob, r * 0.48, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.35 + bob, r * 0.48, r * 0.08, 0, 0, Math.PI * 2);
        ctx.stroke();

        // hat star (glowing)
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffd700';
        drawSparkle(ctx, x, y - r * 1.15 + bob, r * 0.08);
        ctx.restore();

        // ---- FACE ----
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.42 + bob, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.42 + bob, r * 0.22, 0, Math.PI * 2);
        ctx.stroke();

        // glowing eyes
        ctx.save();
        ctx.shadowColor = '#4fc3f7';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.42 + bob, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.42 + bob, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ---- STAFF (right side) ----
        var swb = weaponBob(1.2);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.55, y - r * 0.15 + bob + swb);
        ctx.lineTo(x + r * 0.85, y + r * 0.55 + bob + swb);
        ctx.stroke();

        // staff orb (glowing)
        ctx.save();
        ctx.shadowColor = '#e040fb';
        ctx.shadowBlur = 10;
        var orbGrd = ctx.createRadialGradient(x + r * 0.55, y - r * 0.2 + bob + swb, 0, x + r * 0.55, y - r * 0.2 + bob + swb, r * 0.1);
        orbGrd.addColorStop(0, '#fff');
        orbGrd.addColorStop(0.4, '#e040fb');
        orbGrd.addColorStop(1, '#4a148c');
        ctx.fillStyle = orbGrd;
        ctx.beginPath();
        ctx.arc(x + r * 0.55, y - r * 0.2 + bob + swb, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ---- FLOATING PARTICLES (arcane motes) ----
        var pt = Date.now() * 0.001;
        for (var pi = 0; pi < 5; pi++) {
            var angle = pt * 0.7 + pi * 1.256;
            var dist = r * (0.5 + 0.2 * Math.sin(pt * 0.5 + pi * 1.5));
            var px = x + Math.cos(angle) * dist;
            var py = y + Math.sin(angle) * dist + bob;
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.25 * Math.sin(pt + pi * 1.3);
            var colors = ['#e040fb', '#4fc3f7', '#b388ff', '#ffd700'];
            ctx.fillStyle = colors[pi % 4];
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.02 + r * 0.01 * Math.sin(pt + pi), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        Toon.drawOutline(ctx, x, y + bob, r, '#0a0a14', 2);
        ctx.restore();
    };

    // ==========================================================
    // 3. ASSASSIN - Dark leather, hood/mask, twin daggers
    // ==========================================================
    window.drawAssassinToon = function(ctx, x, y, r, color) {
        var baseC = color || '#212121';
        var pal = Toon.celPalette(baseC);
        var s = r / 18;
        var bob = idleBob(1.0);

        ctx.save();
        // ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.55, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- LEGS (dark pants) ----
        ctx.fillStyle = '#000';
        ctx.fillRect(x - r * 0.25, y + r * 0.35 + bob, r * 0.16, r * 0.35);
        ctx.fillRect(x + r * 0.09, y + r * 0.35 + bob, r * 0.16, r * 0.35);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x - r * 0.25, y + r * 0.35 + bob, r * 0.16, r * 0.35);
        ctx.strokeRect(x + r * 0.09, y + r * 0.35 + bob, r * 0.16, r * 0.35);
        // boots
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x - r * 0.28, y + r * 0.6 + bob, r * 0.2, r * 0.1);
        ctx.fillRect(x + r * 0.08, y + r * 0.6 + bob, r * 0.2, r * 0.1);

        // ---- TORSO (dark leather) ----
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.45, y - r * 0.25 + bob, r * 0.9, r * 0.62, r * 0.1);
        ctx.fill();
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.4, y - r * 0.22 + bob, r * 0.8, r * 0.55, r * 0.08);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.fillRect(x - r * 0.35, y - r * 0.19 + bob, r * 0.25, r * 0.35);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.45, y - r * 0.25 + bob, r * 0.9, r * 0.62, r * 0.1);
        ctx.stroke();

        // belt
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x - r * 0.35, y + r * 0.15 + bob, r * 0.7, r * 0.05);
        // belt buckle
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(x - r * 0.05, y + r * 0.13 + bob, r * 0.1, r * 0.09);

        // ---- HOOD & MASK ----
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.38, y - r * 0.35 + bob);
        ctx.quadraticCurveTo(x, y - r * 0.98 + bob, x + r * 0.38, y - r * 0.35 + bob);
        ctx.lineTo(x + r * 0.3, y - r * 0.18 + bob);
        ctx.lineTo(x - r * 0.3, y - r * 0.18 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.38, y - r * 0.35 + bob);
        ctx.quadraticCurveTo(x, y - r * 0.98 + bob, x + r * 0.38, y - r * 0.35 + bob);
        ctx.lineTo(x + r * 0.3, y - r * 0.18 + bob);
        ctx.lineTo(x - r * 0.3, y - r * 0.18 + bob);
        ctx.closePath();
        ctx.stroke();

        // visible face area (around eyes)
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.42 + bob, r * 0.16, 0, Math.PI * 2);
        ctx.fill();

        // glowing red eyes
        ctx.save();
        ctx.shadowColor = '#f44336';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(x - r * 0.07, y - r * 0.42 + bob, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.07, y - r * 0.42 + bob, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // mask cloth over lower face
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x - r * 0.15, y - r * 0.38 + bob, r * 0.3, r * 0.08);

        // ---- TWIN DAGGERS ----
        var swb = weaponBob(1.8);
        // left dagger
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(x - r * 0.55, y + r * 0.08 + bob + swb, r * 0.06, r * 0.28);
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.52, y - r * 0.05 + bob + swb);
        ctx.lineTo(x - r * 0.48, y - r * 0.05 + bob + swb);
        ctx.lineTo(x - r * 0.55, y + r * 0.08 + bob + swb);
        ctx.lineTo(x - r * 0.45, y + r * 0.08 + bob + swb);
        ctx.closePath();
        ctx.fill();
        // right dagger
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(x + r * 0.49, y + r * 0.08 + bob + swb, r * 0.06, r * 0.28);
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.52, y - r * 0.05 + bob + swb);
        ctx.lineTo(x + r * 0.48, y - r * 0.05 + bob + swb);
        ctx.lineTo(x + r * 0.55, y + r * 0.08 + bob + swb);
        ctx.lineTo(x + r * 0.45, y + r * 0.08 + bob + swb);
        ctx.closePath();
        ctx.fill();

        // dagger handles
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - r * 0.57, y + r * 0.28 + bob + swb, r * 0.1, r * 0.08);
        ctx.fillRect(x + r * 0.47, y + r * 0.28 + bob + swb, r * 0.1, r * 0.08);

        // ---- FLOATING PARTICLES (shadow wisps) ----
        var pt = Date.now() * 0.001;
        for (var pi = 0; pi < 3; pi++) {
            var angle = pt + pi * 2.094;
            var dist = r * (0.5 + 0.15 * Math.sin(pt * 0.8 + pi * 2));
            var px = x + Math.cos(angle) * dist;
            var py = y + Math.sin(angle) * dist + bob;
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.2 * Math.sin(pt * 1.2 + pi);
            ctx.fillStyle = '#7b1fa2';
            ctx.shadowColor = '#7b1fa2';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        Toon.drawOutline(ctx, x, y + bob, r, '#0a0a14', 2);
        ctx.restore();
    };

    // ==========================================================
    // 4. SUMMONER - Green ritual robe, tome, summoning circle
    // ==========================================================
    window.drawSummonerToon = function(ctx, x, y, r, color) {
        var baseC = color || '#1b5e20';
        var pal = Toon.celPalette(baseC);
        var s = r / 18;
        var bob = idleBob(1.0);

        ctx.save();
        // ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.6, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- SUMMONING CIRCLE (on ground) ----
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.2 * Math.sin(Date.now() * 0.002);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.5 + bob, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.5 + bob, r * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        // inner pentagram
        ctx.strokeStyle = 'rgba(255,215,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var si = 0; si < 5; si++) {
            var a = si * 1.2566 - Math.PI / 2;
            var sx = x + Math.cos(a) * r * 0.35;
            var sy = y + r * 0.5 + bob + Math.sin(a) * r * 0.35;
            if (si === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // ---- LEGS ----
        ctx.fillStyle = pal.shadow;
        ctx.fillRect(x - r * 0.25, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.fillRect(x + r * 0.09, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x - r * 0.25, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.strokeRect(x + r * 0.09, y + r * 0.4 + bob, r * 0.16, r * 0.3);

        // ---- ROBE (torso) ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.22 + bob, r * 1.0, r * 0.65, r * 0.15);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.44, y - r * 0.19 + bob, r * 0.88, r * 0.58, r * 0.12);
        ctx.fill();
        ctx.fillStyle = pal.light;
        ctx.fillRect(x - r * 0.38, y - r * 0.16 + bob, r * 0.3, r * 0.35);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.22 + bob, r * 1.0, r * 0.65, r * 0.15);
        ctx.stroke();

        // robe runic trim
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - r * 0.15, y - r * 0.08 + bob, r * 0.3, r * 0.03);
        ctx.fillRect(x - r * 0.15, y + r * 0.1 + bob, r * 0.3, r * 0.03);
        ctx.fillRect(x - r * 0.15, y + r * 0.22 + bob, r * 0.3, r * 0.03);

        // ---- HOOD/HEAD ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.38, y - r * 0.35 + bob);
        ctx.quadraticCurveTo(x, y - r * 0.95 + bob, x + r * 0.38, y - r * 0.35 + bob);
        ctx.lineTo(x + r * 0.3, y - r * 0.18 + bob);
        ctx.lineTo(x - r * 0.3, y - r * 0.18 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.24, y - r * 0.37 + bob);
        ctx.quadraticCurveTo(x, y - r * 0.88 + bob, x + r * 0.24, y - r * 0.37 + bob);
        ctx.lineTo(x + r * 0.22, y - r * 0.2 + bob);
        ctx.lineTo(x - r * 0.22, y - r * 0.2 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.stroke();

        // face
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.45 + bob, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.45 + bob, r * 0.18, 0, Math.PI * 2);
        ctx.stroke();

        // glowing purple eyes
        ctx.save();
        ctx.shadowColor = '#ce93d8';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ce93d8';
        ctx.beginPath();
        ctx.arc(x - r * 0.07, y - r * 0.45 + bob, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.07, y - r * 0.45 + bob, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ---- TOME (left hand) ----
        ctx.fillStyle = '#4a148c';
        ctx.fillRect(x - r * 0.6, y - r * 0.05 + bob, r * 0.2, r * 0.3);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x - r * 0.6, y - r * 0.05 + bob, r * 0.2, r * 0.3);
        // tome pages
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - r * 0.55, y - r * 0.02 + bob, r * 0.1, r * 0.24);
        // tome rune
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - r * 0.52, y + r * 0.05 + bob, r * 0.06, r * 0.02);
        ctx.fillRect(x - r * 0.52, y + r * 0.1 + bob, r * 0.06, r * 0.02);

        // ---- FLOATING SPARKLES (green/purple) ----
        var pt = Date.now() * 0.001;
        for (var pi = 0; pi < 5; pi++) {
            var angle = pt * 0.6 + pi * 1.256;
            var dist = r * (0.45 + 0.2 * Math.sin(pt * 0.5 + pi * 1.7));
            var px = x + Math.cos(angle) * dist;
            var py = y + Math.sin(angle) * dist + bob;
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.25 * Math.sin(pt * 0.9 + pi * 1.1);
            var colors = ['#4caf50', '#8bc34a', '#ce93d8', '#e040fb', '#ffd700'];
            ctx.fillStyle = colors[pi % 5];
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.02 + r * 0.008 * Math.sin(pt + pi), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        Toon.drawOutline(ctx, x, y + bob, r, '#0a0a14', 2);
        ctx.restore();
    };

    // ==========================================================
    // 5. WARRIOR - Heavy armor, greataxe, scarred, red/brown
    // ==========================================================
    window.drawWarriorToon = function(ctx, x, y, r, color) {
        var baseC = color || '#d32f2f';
        var pal = Toon.celPalette(baseC);
        var s = r / 18;
        var bob = idleBob(1.2);

        ctx.save();
        // ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.65, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- LEGS (heavy armored) ----
        ctx.fillStyle = pal.shadow;
        ctx.fillRect(x - r * 0.32, y + r * 0.35 + bob, r * 0.22, r * 0.35);
        ctx.fillRect(x + r * 0.1, y + r * 0.35 + bob, r * 0.22, r * 0.35);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - r * 0.35, y + r * 0.6 + bob, r * 0.25, r * 0.1);
        ctx.fillRect(x + r * 0.1, y + r * 0.6 + bob, r * 0.25, r * 0.1);
        // leg armor trim
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x - r * 0.32, y + r * 0.35 + bob, r * 0.22, r * 0.35);
        ctx.strokeRect(x + r * 0.1, y + r * 0.35 + bob, r * 0.22, r * 0.35);

        // ---- TORSO (scarred heavy armor) ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.52, y - r * 0.28 + bob, r * 1.04, r * 0.65, r * 0.1);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.46, y - r * 0.25 + bob, r * 0.92, r * 0.58, r * 0.08);
        ctx.fill();
        ctx.fillStyle = pal.light;
        ctx.fillRect(x - r * 0.4, y - r * 0.22 + bob, r * 0.3, r * 0.38);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.52, y - r * 0.28 + bob, r * 1.04, r * 0.65, r * 0.1);
        ctx.stroke();

        // battle scars on armor (X marks)
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.05 + bob);
        ctx.lineTo(x + r * 0.15, y + r * 0.15 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.05 + bob);
        ctx.lineTo(x - r * 0.15, y + r * 0.15 + bob);
        ctx.stroke();

        // shoulder spikes
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.52, y - r * 0.2 + bob);
        ctx.lineTo(x - r * 0.65, y - r * 0.25 + bob);
        ctx.lineTo(x - r * 0.5, y - r * 0.12 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.52, y - r * 0.2 + bob);
        ctx.lineTo(x + r * 0.65, y - r * 0.25 + bob);
        ctx.lineTo(x + r * 0.5, y - r * 0.12 + bob);
        ctx.closePath();
        ctx.fill();

        // ---- FURIOUS HAIR (spiky) ----
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.38, y - r * 0.48 + bob);
        ctx.lineTo(x - r * 0.55, y - r * 0.85 + bob);
        ctx.lineTo(x - r * 0.25, y - r * 0.6 + bob);
        ctx.lineTo(x - r * 0.1, y - r * 0.92 + bob);
        ctx.lineTo(x, y - r * 0.55 + bob);
        ctx.lineTo(x + r * 0.1, y - r * 0.92 + bob);
        ctx.lineTo(x + r * 0.25, y - r * 0.6 + bob);
        ctx.lineTo(x + r * 0.55, y - r * 0.85 + bob);
        ctx.lineTo(x + r * 0.38, y - r * 0.48 + bob);
        ctx.closePath();
        ctx.fill();

        // ---- HEAD (scarred face) ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.52 + bob, r * 0.36, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.03, y - r * 0.53 + bob, r * 0.32, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.52 + bob, r * 0.36, r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();

        // scar across face
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.12, y - r * 0.6 + bob);
        ctx.lineTo(x + r * 0.1, y - r * 0.45 + bob);
        ctx.stroke();

        // angry eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.52 + bob, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.52 + bob, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.52 + bob, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.52 + bob, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        // angry brows
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x - r * 0.17, y - r * 0.56 + bob, r * 0.1, r * 0.035);
        ctx.fillRect(x + r * 0.07, y - r * 0.56 + bob, r * 0.1, r * 0.035);

        // ---- GREATAXE (right side) ----
        var swb = weaponBob(1.2);
        // handle
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.5, y - r * 0.15 + bob + swb);
        ctx.lineTo(x + r * 0.75, y + r * 0.55 + bob + swb);
        ctx.stroke();
        // axe head
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.45, y - r * 0.2 + bob + swb);
        ctx.lineTo(x + r * 0.6, y - r * 0.35 + bob + swb);
        ctx.lineTo(x + r * 0.75, y - r * 0.15 + bob + swb);
        ctx.lineTo(x + r * 0.55, y - r * 0.1 + bob + swb);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.45, y - r * 0.2 + bob + swb);
        ctx.lineTo(x + r * 0.6, y - r * 0.35 + bob + swb);
        ctx.lineTo(x + r * 0.75, y - r * 0.15 + bob + swb);
        ctx.lineTo(x + r * 0.55, y - r * 0.1 + bob + swb);
        ctx.closePath();
        ctx.stroke();
        // blade edge highlight
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.5, y - r * 0.22 + bob + swb);
        ctx.lineTo(x + r * 0.62, y - r * 0.32 + bob + swb);
        ctx.stroke();

        // ---- FLOATING PARTICLES (embers) ----
        var pt = Date.now() * 0.001;
        for (var pi = 0; pi < 4; pi++) {
            var angle = pt + pi * 1.57;
            var dist = r * (0.5 + 0.15 * Math.sin(pt * 0.6 + pi * 2.1));
            var px = x + Math.cos(angle) * dist;
            var py = y + Math.sin(angle) * dist + bob;
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.25 * Math.sin(pt + pi * 1.7);
            ctx.fillStyle = '#ff6f00';
            ctx.shadowColor = '#ff6f00';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        Toon.drawOutline(ctx, x, y + bob, r, '#0a0a14', 2);
        ctx.restore();
    };

    // ==========================================================
    // 6. SAGE - White/gold robes, holy symbol, healing glow
    // ==========================================================
    window.drawSageToon = function(ctx, x, y, r, color) {
        var baseC = color || '#f5f5f5';
        var pal = Toon.celPalette(baseC);
        var s = r / 18;
        var bob = idleBob(1.0);

        ctx.save();
        // ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.6, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- HOLY AURA (glowing circle behind) ----
        ctx.save();
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(Date.now() * 0.003);
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.15 + bob, r * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // ---- LEGS ----
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(x - r * 0.25, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.fillRect(x + r * 0.09, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x - r * 0.25, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.strokeRect(x + r * 0.09, y + r * 0.4 + bob, r * 0.16, r * 0.3);

        // ---- ROBE (white/gold) ----
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.22 + bob, r * 1.0, r * 0.65, r * 0.15);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.44, y - r * 0.19 + bob, r * 0.88, r * 0.58, r * 0.12);
        ctx.fill();
        ctx.fillStyle = pal.light;
        ctx.fillRect(x - r * 0.38, y - r * 0.16 + bob, r * 0.3, r * 0.35);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.22 + bob, r * 1.0, r * 0.65, r * 0.15);
        ctx.stroke();

        // gold trim
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - r * 0.15, y - r * 0.05 + bob, r * 0.3, r * 0.03);
        ctx.fillRect(x - r * 0.15, y + r * 0.12 + bob, r * 0.3, r * 0.03);
        ctx.fillRect(x - r * 0.15, y + r * 0.25 + bob, r * 0.3, r * 0.03);

        // holy cross on chest (glowing)
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.08 + bob);
        ctx.lineTo(x, y + r * 0.18 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.1, y + r * 0.05 + bob);
        ctx.lineTo(x + r * 0.1, y + r * 0.05 + bob);
        ctx.stroke();
        ctx.restore();

        // ---- HEAD (with golden halo hair) ----
        // golden hair
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.52 + bob, r * 0.26, 0, Math.PI, true);
        ctx.fill();

        // face
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.45 + bob, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.45 + bob, r * 0.22, 0, Math.PI * 2);
        ctx.stroke();

        // gentle blue eyes
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(x - r * 0.07, y - r * 0.45 + bob, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.07, y - r * 0.45 + bob, r * 0.035, 0, Math.PI * 2);
        ctx.fill();

        // hair highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.1, y - r * 0.6 + bob, r * 0.15, r * 0.05, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // ---- HEALING STAFF (right side) ----
        var swb = weaponBob(1.0);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.48, y + r * 0.05 + bob + swb);
        ctx.lineTo(x + r * 0.65, y + r * 0.55 + bob + swb);
        ctx.stroke();

        // staff holy orb
        ctx.save();
        ctx.shadowColor = '#b3e5fc';
        ctx.shadowBlur = 10;
        var orbGrd = ctx.createRadialGradient(x + r * 0.48, y + bob + swb, 0, x + r * 0.48, y + bob + swb, r * 0.1);
        orbGrd.addColorStop(0, '#fff');
        orbGrd.addColorStop(0.5, '#b3e5fc');
        orbGrd.addColorStop(1, '#4fc3f7');
        ctx.fillStyle = orbGrd;
        ctx.beginPath();
        ctx.arc(x + r * 0.48, y + bob + swb, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ---- HEALING PARTICLES (golden/white sparkles) ----
        var pt = Date.now() * 0.001;
        for (var pi = 0; pi < 5; pi++) {
            var angle = pt * 0.5 + pi * 1.256;
            var dist = r * (0.45 + 0.2 * Math.sin(pt * 0.6 + pi * 1.3));
            var px = x + Math.cos(angle) * dist;
            var py = y + Math.sin(angle) * dist + bob;
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.2 * Math.sin(pt * 0.8 + pi * 1.5);
            ctx.fillStyle = ['#ffd700', '#b3e5fc', '#fff', '#a5d6a7', '#ffd700'][pi % 5];
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 5;
            drawSparkle(ctx, px, py, r * 0.025);
            ctx.restore();
        }

        Toon.drawOutline(ctx, x, y + bob, r, '#0a0a14', 2);
        ctx.restore();
    };

    // ==========================================================
    // 7. NECROMANCER - Dark hooded robe, skull staff, purple/green aura
    // ==========================================================
    window.drawNecromancerToon = function(ctx, x, y, r, color) {
        var baseC = color || '#4a148c';
        var pal = Toon.celPalette(baseC);
        var s = r / 18;
        var bob = idleBob(0.8);

        ctx.save();
        // ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.6, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- DARK AURA (swirling) ----
        ctx.save();
        ctx.globalAlpha = 0.15 + 0.1 * Math.sin(Date.now() * 0.002);
        ctx.shadowColor = '#9c27b0';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#9c27b0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + bob, r * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // ---- LEGS ----
        ctx.fillStyle = '#1a0033';
        ctx.fillRect(x - r * 0.25, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.fillRect(x + r * 0.09, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x - r * 0.25, y + r * 0.4 + bob, r * 0.16, r * 0.3);
        ctx.strokeRect(x + r * 0.09, y + r * 0.4 + bob, r * 0.16, r * 0.3);

        // ---- ROBE (dark purple/black) ----
        ctx.fillStyle = '#1a0033';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.22 + bob, r * 1.0, r * 0.65, r * 0.15);
        ctx.fill();
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.44, y - r * 0.19 + bob, r * 0.88, r * 0.58, r * 0.12);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.fillRect(x - r * 0.38, y - r * 0.16 + bob, r * 0.3, r * 0.35);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.22 + bob, r * 1.0, r * 0.65, r * 0.15);
        ctx.stroke();

        // runic trim (green glow)
        ctx.fillStyle = '#00c853';
        ctx.fillRect(x - r * 0.15, y - r * 0.05 + bob, r * 0.3, r * 0.03);
        ctx.fillRect(x - r * 0.15, y + r * 0.12 + bob, r * 0.3, r * 0.03);
        ctx.fillRect(x - r * 0.15, y + r * 0.25 + bob, r * 0.3, r * 0.03);

        // ---- HOOD ----
        ctx.fillStyle = '#1a0033';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.38, y - r * 0.35 + bob);
        ctx.quadraticCurveTo(x, y - r * 0.95 + bob, x + r * 0.38, y - r * 0.35 + bob);
        ctx.lineTo(x + r * 0.3, y - r * 0.18 + bob);
        ctx.lineTo(x - r * 0.3, y - r * 0.18 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.38, y - r * 0.35 + bob);
        ctx.quadraticCurveTo(x, y - r * 0.95 + bob, x + r * 0.38, y - r * 0.35 + bob);
        ctx.lineTo(x + r * 0.3, y - r * 0.18 + bob);
        ctx.lineTo(x - r * 0.3, y - r * 0.18 + bob);
        ctx.closePath();
        ctx.stroke();

        // ---- SKULL HEAD ----
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.48 + bob, r * 0.24, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.48 + bob, r * 0.24, r * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();

        // eye sockets
        ctx.fillStyle = '#1a0033';
        ctx.beginPath();
        ctx.arc(x - r * 0.09, y - r * 0.48 + bob, r * 0.055, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.09, y - r * 0.48 + bob, r * 0.055, 0, Math.PI * 2);
        ctx.fill();

        // glowing red eyes inside sockets
        ctx.save();
        ctx.shadowColor = '#f44336';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(x - r * 0.09, y - r * 0.48 + bob, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.09, y - r * 0.48 + bob, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // nose hole
        ctx.fillStyle = '#1a0033';
        ctx.fillRect(x - r * 0.02, y - r * 0.4 + bob, r * 0.04, r * 0.05);

        // teeth
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.1, y - r * 0.3 + bob);
        ctx.lineTo(x + r * 0.1, y - r * 0.3 + bob);
        ctx.stroke();
        for (var ti = 0; ti < 4; ti++) {
            ctx.strokeRect(x - r * 0.08 + ti * r * 0.045, y - r * 0.3 + bob, r * 0.01, r * 0.045);
        }

        // dark crown / floating skull ring
        ctx.save();
        ctx.shadowColor = '#ce93d8';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#ce93d8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.82 + bob, r * 0.3, r * 0.07, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // ---- SKULL STAFF (right side) ----
        var swb = weaponBob(1.2);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.55, y - r * 0.15 + bob + swb);
        ctx.lineTo(x + r * 0.82, y + r * 0.55 + bob + swb);
        ctx.stroke();

        // staff skull top
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.arc(x + r * 0.55, y - r * 0.2 + bob + swb, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(x + r * 0.55, y - r * 0.2 + bob + swb, r * 0.08, 0, Math.PI * 2);
        ctx.stroke();
        // staff skull eyes (glowing)
        ctx.save();
        ctx.shadowColor = '#00c853';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#00c853';
        ctx.beginPath();
        ctx.arc(x + r * 0.52, y - r * 0.2 + bob + swb, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.58, y - r * 0.2 + bob + swb, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ---- FLOATING SOULS (purple/green wisps) ----
        var pt = Date.now() * 0.001;
        for (var pi = 0; pi < 4; pi++) {
            var angle = pt * 0.5 + pi * 1.57;
            var dist = r * (0.5 + 0.2 * Math.sin(pt * 0.4 + pi * 2.3));
            var px = x + Math.cos(angle) * dist;
            var py = y + Math.sin(angle) * dist + bob;
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.25 * Math.sin(pt * 0.7 + pi * 1.9);
            var col = pi % 2 === 0 ? '#9c27b0' : '#00c853';
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        Toon.drawOutline(ctx, x, y + bob, r, '#0a0a14', 2);
        ctx.restore();
    };

    // ==========================================================
    // 8. SWORDSMAN - Light blue armor, katana, wind blue/white
    // ==========================================================
    window.drawSwordsmanToon = function(ctx, x, y, r, color) {
        var baseC = color || '#0277bd';
        var pal = Toon.celPalette(baseC);
        var s = r / 18;
        var bob = idleBob(1.0);

        ctx.save();
        // ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.7, r * 0.6, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- LEGS (wide-legged stance with leg wraps) ----
        ctx.fillStyle = pal.shadow;
        ctx.fillRect(x - r * 0.3, y + r * 0.35 + bob, r * 0.2, r * 0.35);
        ctx.fillRect(x + r * 0.1, y + r * 0.35 + bob, r * 0.2, r * 0.35);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x - r * 0.3, y + r * 0.35 + bob, r * 0.2, r * 0.35);
        ctx.strokeRect(x + r * 0.1, y + r * 0.35 + bob, r * 0.2, r * 0.35);

        // leg wraps (white)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y + r * 0.5 + bob);
        ctx.lineTo(x - r * 0.1, y + r * 0.5 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.1, y + r * 0.5 + bob);
        ctx.lineTo(x + r * 0.3, y + r * 0.5 + bob);
        ctx.stroke();

        // geta/shoes
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - r * 0.33, y + r * 0.6 + bob, r * 0.22, r * 0.1);
        ctx.fillRect(x + r * 0.11, y + r * 0.6 + bob, r * 0.22, r * 0.1);

        // ---- TORSO (light armor with V-neck) ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.48, y - r * 0.28 + bob, r * 0.96, r * 0.65, r * 0.1);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.42, y - r * 0.25 + bob, r * 0.84, r * 0.58, r * 0.08);
        ctx.fill();
        ctx.fillStyle = pal.light;
        ctx.fillRect(x - r * 0.36, y - r * 0.22 + bob, r * 0.3, r * 0.38);
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.48, y - r * 0.28 + bob, r * 0.96, r * 0.65, r * 0.1);
        ctx.stroke();

        // V-neck collar
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.12, y - r * 0.22 + bob);
        ctx.lineTo(x, y + r * 0.02 + bob);
        ctx.lineTo(x + r * 0.12, y - r * 0.22 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.12, y - r * 0.22 + bob);
        ctx.lineTo(x, y + r * 0.02 + bob);
        ctx.lineTo(x + r * 0.12, y - r * 0.22 + bob);
        ctx.closePath();
        ctx.stroke();

        // belt
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x - r * 0.35, y + r * 0.15 + bob, r * 0.7, r * 0.04);
        // belt loop
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.17 + bob, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // ---- HEAD (bandana / headband) ----
        ctx.fillStyle = pal.shadow;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.52 + bob, r * 0.36, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.mid;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.03, y - r * 0.53 + bob, r * 0.32, r * 0.27, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a14';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.52 + bob, r * 0.36, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();

        // headband (windswept)
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.32, y - r * 0.5 + bob);
        ctx.quadraticCurveTo(x, y - r * 0.55 + bob, x + r * 0.32, y - r * 0.5 + bob);
        ctx.stroke();
        // headband tails
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.32, y - r * 0.5 + bob);
        ctx.quadraticCurveTo(x + r * 0.45, y - r * 0.55 + bob, x + r * 0.5, y - r * 0.45 + bob);
        ctx.stroke();

        // face
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.46 + bob, r * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // focused eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.06, y - r * 0.46 + bob, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.06, y - r * 0.46 + bob, r * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // ---- KATANA (right side, slanted) ----
        var swb = weaponBob(1.5);
        // blade
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.52, y - r * 0.35 + bob + swb);
        ctx.lineTo(x + r * 0.2, y + r * 0.4 + bob + swb);
        ctx.stroke();
        // blade edge highlight
        ctx.strokeStyle = '#eceff1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.52, y - r * 0.35 + bob + swb);
        ctx.lineTo(x + r * 0.2, y + r * 0.4 + bob + swb);
        ctx.stroke();
        // tsuba (guard)
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + r * 0.52, y - r * 0.35 + bob + swb, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // handle (tsuka)
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x + r * 0.46, y - r * 0.48 + bob + swb, r * 0.12, r * 0.14);
        // pommel
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.arc(x + r * 0.52, y - r * 0.5 + bob + swb, r * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // ---- WIND EFFECTS (swirling blue lines) ----
        ctx.save();
        var wt = Date.now() * 0.002;
        ctx.globalAlpha = 0.2 + 0.15 * Math.sin(wt);
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1;
        for (var wi = 0; wi < 3; wi++) {
            var wa = wt + wi * 2.094;
            var wx = x + Math.cos(wa) * r * 0.4;
            var wy = y + Math.sin(wa) * r * 0.3 + bob;
            ctx.beginPath();
            ctx.moveTo(wx - r * 0.15, wy);
            ctx.quadraticCurveTo(wx, wy - r * 0.1, wx + r * 0.15, wy);
            ctx.stroke();
        }
        ctx.restore();

        // ---- FLOATING PARTICLES (wind sparks) ----
        var pt = Date.now() * 0.001;
        for (var pi = 0; pi < 4; pi++) {
            var angle = pt * 0.6 + pi * 1.57;
            var dist = r * (0.5 + 0.15 * Math.sin(pt * 0.7 + pi * 1.8));
            var px = x + Math.cos(angle) * dist;
            var py = y + Math.sin(angle) * dist + bob;
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.2 * Math.sin(pt + pi * 1.4);
            ctx.fillStyle = '#4fc3f7';
            ctx.shadowColor = '#4fc3f7';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        Toon.drawOutline(ctx, x, y + bob, r, '#0a0a14', 2);
        ctx.restore();
    };

    // ==========================================================
    // Also patch SpriteRenderer so the methods it delegates to
    // the global functions pick up our overrides
    // v7.9: 优先 PNG，回退到详细程序化绘制
    // ==========================================================
    if (typeof SpriteRenderer !== 'undefined') {
        SpriteRenderer.drawKnightToon = function(ctx, x, y, r, color) {
            SpriteRenderer._ensureImages();
            if (SpriteRenderer._tryDrawClassImage(ctx, 'knight', 'idle', x, y, r)) return;
            drawKnightToon(ctx, x, y, r, color);
        };
        SpriteRenderer.drawMageToon = function(ctx, x, y, r, color) {
            SpriteRenderer._ensureImages();
            if (SpriteRenderer._tryDrawClassImage(ctx, 'mage', 'idle', x, y, r)) return;
            drawMageToon(ctx, x, y, r, color);
        };
        SpriteRenderer.drawAssassinToon = function(ctx, x, y, r, color) {
            SpriteRenderer._ensureImages();
            if (SpriteRenderer._tryDrawClassImage(ctx, 'assassin', 'idle', x, y, r)) return;
            drawAssassinToon(ctx, x, y, r, color);
        };
        SpriteRenderer.drawSummonerToon = function(ctx, x, y, r, color) {
            SpriteRenderer._ensureImages();
            if (SpriteRenderer._tryDrawClassImage(ctx, 'summoner', 'idle', x, y, r)) return;
            drawSummonerToon(ctx, x, y, r, color);
        };
        SpriteRenderer.drawWarriorToon = function(ctx, x, y, r, color) {
            SpriteRenderer._ensureImages();
            if (SpriteRenderer._tryDrawClassImage(ctx, 'warrior', 'idle', x, y, r)) return;
            drawWarriorToon(ctx, x, y, r, color);
        };
        SpriteRenderer.drawSageToon = function(ctx, x, y, r, color) {
            SpriteRenderer._ensureImages();
            if (SpriteRenderer._tryDrawClassImage(ctx, 'sage', 'idle', x, y, r)) return;
            drawSageToon(ctx, x, y, r, color);
        };
        SpriteRenderer.drawNecromancerToon = function(ctx, x, y, r, color) {
            SpriteRenderer._ensureImages();
            if (SpriteRenderer._tryDrawClassImage(ctx, 'necromancer', 'idle', x, y, r)) return;
            drawNecromancerToon(ctx, x, y, r, color);
        };
        SpriteRenderer.drawSwordsmanToon = function(ctx, x, y, r, color) {
            SpriteRenderer._ensureImages();
            if (SpriteRenderer._tryDrawClassImage(ctx, 'swordsman', 'idle', x, y, r)) return;
            drawSwordsmanToon(ctx, x, y, r, color);
        };
    }

})();
