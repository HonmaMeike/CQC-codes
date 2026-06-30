// ========== 程序化像素精灵绘制系统 ==========
// 为8个职业和每种怪物生成独特的像素风格精灵图

var SpriteRenderer = {

    // ========== 精灵图缓存系统 (v7.9 - 图片替换) ==========
    // 从 assets/images/sprites/ 加载 PNG 替换程序化绘制
    _images: null,
    _imagesLoaded: false,

    // 初始化加载所有精灵图
    _ensureImages: function() {
        if (this._imagesLoaded) return true;
        if (typeof Image === 'undefined') return false;
        this._images = {};
        var basePath = 'assets/images/sprites/';
        var classes = ['knight','mage','assassin','summoner','warrior','sage','necromancer','swordsman'];
        var states = ['idle','attack','hit','skill','victory'];
        var loaded = 0, total = classes.length * states.length;
        var self = this;
        for (var ci = 0; ci < classes.length; ci++) {
            for (var si = 0; si < states.length; si++) {
                var key = classes[ci] + '_' + states[si];
                var img = new Image();
                img.onload = (function(k) {
                    return function() { loaded++; if (loaded >= total) self._imagesLoaded = true; };
                })(key);
                img.onerror = function() { loaded++; };
                img.src = basePath + key + '.png';
                this._images[key] = img;
            }
        }
        // 预加载怪物精灵图
        var monsterPath = basePath + 'monsters/';
        var monsterNames = ['史莱姆','史莱姆王','哥布林','骷髅兵','荒野狼','吸血蝙蝠','兽人战士','暗黑法师',
            '石魔像','幼龙','幽魂','牛头人','巫妖','恶魔','上古巨龙','冰霜巨人','地狱犬','鹰身女妖',
            '山岭巨人','幻影刺客','石化蛇妖','血族伯爵','虚空行者','奇美拉','贝希摩斯','凤凰',
            '泰坦巨人','暗影领主','九头蛇','虚空吞噬者','天使统帅','混沌之源','深渊之主','永恒之龙',
            '小羊角','大盘鱼','无声乐章','可达鸭煲汤','赞美魔法之神','花轻影','诀别诗','花轻斋','白菊',
            '无咎','宣姬','定时说说','我的名字','秋语','幸运蛋','幸运鹿角','幸运魔角','幸运风见',
            '幸运黑妹','大白鹅','奥霸天','内阁','老登看雷','林有德','枫原万叶','雪映梅','亚尔托莉',
            '设计师','气急败坏的妃妃','热心网友小余','维多喵','花夕拾','弃C','Echo','LitALS','WLS',
            '活得自在🧸','菊','世界之主·芦笋'];
        for (var mi = 0; mi < monsterNames.length; mi++) {
            var mn = monsterNames[mi];
            var mImg = new Image();
            mImg.onload = (function() { loaded++; if (loaded >= total + monsterNames.length) self._imagesLoaded = true; })();
            mImg.onerror = function() { loaded++; };
            mImg.src = monsterPath + mn + '.png';
            this._images['monster_' + mn] = mImg;
        }
        return false;
    },

    // 尝试从精灵图绘制角色，返回 true 如果成功绘制
    _tryDrawClassImage: function(ctx, classId, state, x, y, r) {
        state = state || 'idle';
        var key = classId + '_' + state;
        if (this._images && this._images[key] && this._images[key].complete && this._images[key].naturalWidth > 0) {
            var size = r * 2.4;
            ctx.drawImage(this._images[key], x - size/2, y - size/2, size, size);
            return true;
        }
        // 尝试 idle 兜底
        if (state !== 'idle') {
            return this._tryDrawClassImage(ctx, classId, 'idle', x, y, r);
        }
        return false;
    },

    // 尝试从精灵图绘制怪物
    _tryDrawMonsterImage: function(ctx, name, x, y, r, elite) {
        if (!name) return false;
        // 尝试精确匹配
        var key = 'monster_' + name;
        if (this._images && this._images[key] && this._images[key].complete && this._images[key].naturalWidth > 0) {
            var size = r * 2.4;
            if (elite) size *= 1.2;
            ctx.drawImage(this._images[key], x - size/2, y - size/2, size, size);
            return true;
        }
        // 子串匹配（处理 '史莱姆王' 匹配 '史莱姆' 等）
        for (var k in this._images) {
            if (!this._images.hasOwnProperty(k)) continue;
            if (k.indexOf('monster_') !== 0) continue;
            var mName = k.substring(8);
            if (name.indexOf(mName) !== -1) {
                var img = this._images[k];
                if (img.complete && img.naturalWidth > 0) {
                    var sz = r * 2.4;
                    if (elite) sz *= 1.2;
                    ctx.drawImage(img, x - sz/2, y - sz/2, sz, sz);
                    return true;
                }
            }
        }
        return false;
    },

    // 绘制职业精灵（英雄）— 优先 PNG，回退程序化绘制
    drawClassSprite: function(ctx, classId, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, classId, 'idle', x, y, r)) return;
        // 回退到程序化绘制
        switch (classId) {
            case 'knight': this.drawKnight(ctx, x, y, r, color); break;
            case 'mage': this.drawMage(ctx, x, y, r, color); break;
            case 'assassin': this.drawAssassin(ctx, x, y, r, color); break;
            case 'summoner': this.drawSummoner(ctx, x, y, r, color); break;
            case 'warrior': this.drawWarrior(ctx, x, y, r, color); break;
            case 'sage': this.drawSage(ctx, x, y, r, color); break;
            case 'necromancer': this.drawNecromancer(ctx, x, y, r, color); break;
            case 'swordsman': this.drawSwordsman(ctx, x, y, r, color); break;
            default: this.drawGenericHero(ctx, x, y, r, color); break;
        }
    },

    // 绘制怪物精灵 — 优先 PNG，回退程序化绘制
    drawMonsterSprite: function(ctx, name, x, y, r, color, elite, isFriend) {
        this._ensureImages();
        if (name && this._tryDrawMonsterImage(ctx, name, x, y, r, elite)) return;
        var n = name || '';
        // 网友定制怪物：使用特色模型
        if (isFriend) {
            this.drawFriendMonster(ctx, name, x, y, r, color);
            return;
        }
        // 优先匹配最具体的名字（避免子串误匹配）
        if (n.indexOf('永恒之龙') !== -1) { this.drawEternalDragon(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('上古巨龙') !== -1) { this.drawElderDragon(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('幼龙') !== -1) { this.drawDragonWhelp(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('史莱姆王') !== -1) { this.drawSlimeKing(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('史莱姆') !== -1) { this.drawSlime(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('哥布林') !== -1) { this.drawGoblin(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('骷髅') !== -1) { this.drawSkeleton(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('吸血蝙蝠') !== -1) { this.drawBat(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('荒野狼') !== -1) { this.drawWolf(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('兽人') !== -1) { this.drawOrc(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('暗黑法师') !== -1) { this.drawDarkMage(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('石魔像') !== -1) { this.drawGolem(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('幽魂') !== -1) { this.drawWraith(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('牛头人') !== -1) { this.drawMinotaur(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('巫妖') !== -1) { this.drawLich(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('鹰身女妖') !== -1) { this.drawHarpy(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('幻影刺客') !== -1) { this.drawPhantom(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('石化蛇妖') !== -1) { this.drawBasilisk(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('血族伯爵') !== -1) { this.drawVampire(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('虚空吞噬者') !== -1) { this.drawVoidDevourer(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('虚空行者') !== -1) { this.drawVoidWalker(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('奇美拉') !== -1) { this.drawChimera(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('贝希摩斯') !== -1) { this.drawBehemoth(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('凤凰') !== -1) { this.drawPhoenix(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('泰坦巨人') !== -1) { this.drawTitan(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('山岭巨人') !== -1) { this.drawStoneGiant(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('冰霜巨人') !== -1) { this.drawFrostGiant(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('地狱犬') !== -1) { this.drawHellHound(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('暗影领主') !== -1) { this.drawShadowLord(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('九头蛇') !== -1) { this.drawHydra(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('天使统帅') !== -1) { this.drawArchangel(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('混沌之源') !== -1) { this.drawChaosOrigin(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('深渊之主') !== -1) { this.drawAbyssGod(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('芦笋') !== -1) { this.drawBambooShootBoss(ctx, x, y, r, color, elite); return; }
        if (n.indexOf('恶魔') !== -1) { this.drawDemon(ctx, x, y, r, color, elite); return; }
        this.drawGenericMonster(ctx, x, y, r, color, elite);
    },

    // ====== 职业精灵绘制 ======

    // 骑士：蓝银铠甲 + 头盔 + 盾牌 + 披风
    drawKnight: function(ctx, x, y, r, color) {
        var bodyC = '#4a90d9';
        var darkC = '#2a5a8a';
        var lightC = '#7ab8f0';
        var goldC = '#ffd700';
        var s = r / 18;

        // 阴影 (drop shadow under feet)
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.8, r * 0.7, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // 披风（红色 — 加渐变 + 内阴影）
        var capeGrd = ctx.createLinearGradient(x, y - r * 0.3, x, y + r * 0.6);
        capeGrd.addColorStop(0, '#ef5350');
        capeGrd.addColorStop(0.6, '#c62828');
        capeGrd.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = capeGrd;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.3);
        ctx.lineTo(x - r * 0.7, y + r * 0.6);
        ctx.lineTo(x + r * 0.7, y + r * 0.6);
        ctx.lineTo(x + r * 0.3, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
        // 披风内边缘高光（金线）
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.3);
        ctx.lineTo(x + r * 0.3, y - r * 0.3);
        ctx.stroke();

        // 身体（铠甲 — 多层渐变制造金属感）
        var armorGrd = ctx.createLinearGradient(x - r * 0.5, y, x + r * 0.5, y);
        armorGrd.addColorStop(0, darkC);
        armorGrd.addColorStop(0.4, lightC);
        armorGrd.addColorStop(0.6, bodyC);
        armorGrd.addColorStop(1, darkC);
        ctx.fillStyle = armorGrd;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.7, r * 0.1);
        ctx.fill();
        ctx.strokeStyle = '#0d2840';
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // 胸甲中央宝石（发光感）
        var gemGrd = ctx.createRadialGradient(x, y, 0, x, y, r * 0.12);
        gemGrd.addColorStop(0, '#b3e5fc');
        gemGrd.addColorStop(0.5, '#4fc3f7');
        gemGrd.addColorStop(1, '#01579b');
        ctx.fillStyle = gemGrd;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 铠甲纹路（金色高光边）
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 1 * s;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.2);
        ctx.lineTo(x, y + r * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y);
        ctx.lineTo(x + r * 0.25, y);
        ctx.stroke();

        // 盾牌（左臂 — 加渐变 + 高光）
        var shieldGrd = ctx.createLinearGradient(x - r * 0.75, y, x - r * 0.4, y);
        shieldGrd.addColorStop(0, '#1a3a5c');
        shieldGrd.addColorStop(0.5, '#4a90d9');
        shieldGrd.addColorStop(1, '#1a3a5c');
        ctx.fillStyle = shieldGrd;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.75, y - r * 0.15, r * 0.35, r * 0.5, r * 0.05);
        ctx.fill();
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        // 盾牌十字（发光感）
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 1.5 * s;
        ctx.shadowColor = goldC;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.57, y);
        ctx.lineTo(x - r * 0.57, y + r * 0.15);
        ctx.moveTo(x - r * 0.67, y + r * 0.05);
        ctx.lineTo(x - r * 0.47, y + r * 0.05);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 头盔（金属渐变 + 顶部高光）
        var helmGrd = ctx.createLinearGradient(x, y - r * 0.9, x, y - r * 0.3);
        helmGrd.addColorStop(0, lightC);
        helmGrd.addColorStop(0.4, bodyC);
        helmGrd.addColorStop(1, darkC);
        ctx.fillStyle = helmGrd;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.6, r * 0.4, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0d2840';
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        // 头盔顶部高光斑
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.1, y - r * 0.78, r * 0.15, r * 0.08, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 面罩缝隙（发光的红眼）
        var visorGrd = ctx.createLinearGradient(x - r * 0.2, y - r * 0.65, x + r * 0.2, y - r * 0.65);
        visorGrd.addColorStop(0, '#1a1a2e');
        visorGrd.addColorStop(0.5, '#ff6b6b');
        visorGrd.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = visorGrd;
        ctx.fillRect(x - r * 0.2, y - r * 0.65, r * 0.4, r * 0.08);
        // 头盔羽冠（带高光）
        var plumeGrd = ctx.createLinearGradient(x, y - r * 1.1, x, y - r * 0.9);
        plumeGrd.addColorStop(0, '#ef5350');
        plumeGrd.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = plumeGrd;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.9);
        ctx.quadraticCurveTo(x - r * 0.05, y - r * 1.15, x, y - r * 1.1);
        ctx.quadraticCurveTo(x + r * 0.05, y - r * 1.15, x + r * 0.15, y - r * 0.9);
        ctx.closePath();
        ctx.fill();

        // 腿（金属渐变）
        var legGrd = ctx.createLinearGradient(x, y + r * 0.4, x, y + r * 0.75);
        legGrd.addColorStop(0, darkC);
        legGrd.addColorStop(1, '#0d2840');
        ctx.fillStyle = legGrd;
        ctx.fillRect(x - r * 0.3, y + r * 0.4, r * 0.2, r * 0.35);
        ctx.fillRect(x + r * 0.1, y + r * 0.4, r * 0.2, r * 0.35);
        // 靴子（皮革质感）
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x - r * 0.35, y + r * 0.65, r * 0.25, r * 0.12);
        ctx.fillRect(x + r * 0.1, y + r * 0.65, r * 0.25, r * 0.12);
        // 靴子高光
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x - r * 0.32, y + r * 0.66, r * 0.19, r * 0.03);
        ctx.fillRect(x + r * 0.13, y + r * 0.66, r * 0.19, r * 0.03);
    },

    // 法师：紫袍 + 尖帽 + 法杖 + 魔法星
    drawMage: function(ctx, x, y, r, color) {
        var bodyC = '#7b1fa2';
        var darkC = '#4a148c';
        var lightC = '#ce93d8';
        var goldC = '#ffd700';
        var s = r / 18;

        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.8, r * 0.65, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // 法袍（紫渐变 + 蓝色光晕）
        var robeGrd = ctx.createLinearGradient(x - r * 0.5, y, x + r * 0.5, y);
        robeGrd.addColorStop(0, darkC);
        robeGrd.addColorStop(0.5, bodyC);
        robeGrd.addColorStop(1, darkC);
        ctx.fillStyle = robeGrd;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.15);
        ctx.fill();
        // 袍边金线
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        // 袍子装饰（金色符文带）
        ctx.fillStyle = goldC;
        ctx.fillRect(x - r * 0.1, y - r * 0.15, r * 0.2, r * 0.05);
        ctx.fillRect(x - r * 0.1, y + r * 0.1, r * 0.2, r * 0.05);
        ctx.fillRect(x - r * 0.1, y + r * 0.25, r * 0.2, r * 0.05);
        // 中心魔法宝石（径向渐变）
        var robeGemGrd = ctx.createRadialGradient(x, y + r * 0.2, 0, x, y + r * 0.2, r * 0.12);
        robeGemGrd.addColorStop(0, '#e1bee7');
        robeGemGrd.addColorStop(0.5, '#ce93d8');
        robeGemGrd.addColorStop(1, '#4a148c');
        ctx.fillStyle = robeGemGrd;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.2, r * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 尖帽（深紫 + 顶部高光）
        var hatGrd = ctx.createLinearGradient(x, y - r * 1.15, x, y - r * 0.4);
        hatGrd.addColorStop(0, lightC);
        hatGrd.addColorStop(0.5, bodyC);
        hatGrd.addColorStop(1, darkC);
        ctx.fillStyle = hatGrd;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.4, y - r * 0.4);
        ctx.lineTo(x, y - r * 1.15);
        ctx.lineTo(x + r * 0.4, y - r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1 * s;
        ctx.stroke();
        // 帽沿
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.4, r * 0.45, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        // 帽尖星（发光感）
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffd700';
        this.drawStar(ctx, x, y - r * 1.15, r * 0.06);
        ctx.shadowBlur = 0;

        // 脸
        var faceGrd = ctx.createRadialGradient(x - r * 0.1, y - r * 0.5, 0, x, y - r * 0.45, r * 0.25);
        faceGrd.addColorStop(0, '#ffe0b2');
        faceGrd.addColorStop(1, '#d4a574');
        ctx.fillStyle = faceGrd;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.45, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // 眼睛（魔法蓝光）
        var eyeGrd = ctx.createRadialGradient(x, y - r * 0.45, 0, x, y - r * 0.45, r * 0.04);
        eyeGrd.addColorStop(0, '#b3e5fc');
        eyeGrd.addColorStop(1, '#01579b');
        ctx.fillStyle = eyeGrd;
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.45, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.45, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 法杖（深木 + 金属环）
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.6, y - r * 0.2);
        ctx.lineTo(x + r * 0.9, y + r * 0.6);
        ctx.stroke();
        // 法杖金属环
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.66, y - r * 0.05);
        ctx.lineTo(x + r * 0.74, y + r * 0.1);
        ctx.stroke();
        // 法杖顶端宝石（径向渐变 + 发光）
        var gemGrd = ctx.createRadialGradient(x + r * 0.6, y - r * 0.25, 0, x + r * 0.6, y - r * 0.25, r * 0.1);
        gemGrd.addColorStop(0, '#f8bbd0');
        gemGrd.addColorStop(0.5, '#e040fb');
        gemGrd.addColorStop(1, '#4a148c');
        ctx.shadowColor = '#e040fb';
        ctx.shadowBlur = 8;
        ctx.fillStyle = gemGrd;
        ctx.beginPath();
        ctx.arc(x + r * 0.6, y - r * 0.25, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 魔法星（环绕 + 发光）
        var t = Date.now() / 800;
        for (var i = 0; i < 3; i++) {
            var angle = t + i * Math.PI * 2 / 3;
            var sx = x + Math.cos(angle) * r * 0.7;
            var sy = y + Math.sin(angle) * r * 0.5;
            ctx.shadowColor = '#ce93d8';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#ce93d8';
            this.drawStar(ctx, sx, sy, r * 0.04);
            ctx.shadowBlur = 0;
        }

        // 腿（深紫渐变）
        var legGrd = ctx.createLinearGradient(x, y + r * 0.45, x, y + r * 0.75);
        legGrd.addColorStop(0, darkC);
        legGrd.addColorStop(1, '#1a0033');
        ctx.fillStyle = legGrd;
        ctx.fillRect(x - r * 0.25, y + r * 0.45, r * 0.15, r * 0.3);
        ctx.fillRect(x + r * 0.1, y + r * 0.45, r * 0.15, r * 0.3);
    },

    // 刺客：黑衣 + 头巾 + 双匕首
    drawAssassin: function(ctx, x, y, r, color) {
        var bodyC = '#263238';
        var darkC = '#1a1a1a';
        var lightC = '#78909c';
        var s = r / 18;

        // 黑衣斗篷
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.45, y - r * 0.3, r * 0.9, r * 0.7, r * 0.1);
        ctx.fill();

        // 头巾
        ctx.fillStyle = darkC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.6, r * 0.35, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 面罩（仅露眼睛）
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x - r * 0.25, y - r * 0.62, r * 0.5, r * 0.1);
        // 眼睛（发光）
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.58, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.58, r * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // 匕首（双手交叉）
        ctx.strokeStyle = '#b0bec5';
        ctx.lineWidth = 1.5 * s;
        // 左手匕首
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y - r * 0.1);
        ctx.lineTo(x - r * 0.8, y - r * 0.6);
        ctx.stroke();
        // 右手匕首
        ctx.beginPath();
        ctx.moveTo(x + r * 0.5, y - r * 0.1);
        ctx.lineTo(x + r * 0.8, y - r * 0.6);
        ctx.stroke();
        // 匕首刃光
        ctx.fillStyle = '#ffffff44';
        ctx.beginPath();
        ctx.arc(x - r * 0.8, y - r * 0.6, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.8, y - r * 0.6, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 腰带
        ctx.fillStyle = '#37474f';
        ctx.fillRect(x - r * 0.4, y + r * 0.05, r * 0.8, r * 0.06);

        // 腿（紧身裤）
        ctx.fillStyle = darkC;
        ctx.fillRect(x - r * 0.25, y + r * 0.4, r * 0.15, r * 0.35);
        ctx.fillRect(x + r * 0.1, y + r * 0.4, r * 0.15, r * 0.35);
        // 靴子
        ctx.fillStyle = '#37474f';
        ctx.fillRect(x - r * 0.3, y + r * 0.65, r * 0.22, r * 0.12);
        ctx.fillRect(x + r * 0.08, y + r * 0.65, r * 0.22, r * 0.12);
    },

    // 召唤师：绿袍 + 符文书 + 召唤环
    drawSummoner: function(ctx, x, y, r, color) {
        var bodyC = '#2e7d32';
        var darkC = '#1b5e20';
        var lightC = '#81c784';
        var s = r / 18;

        // 绿袍
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.2, r * 1.0, r * 0.65, r * 0.12);
        ctx.fill();
        ctx.strokeStyle = darkC;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // 符文装饰
        ctx.fillStyle = lightC;
        for (var i = 0; i < 3; i++) {
            ctx.fillRect(x - r * 0.15 + i * r * 0.15, y + r * 0.05, r * 0.08, r * 0.04);
        }

        // 头
        ctx.fillStyle = '#f5d6c1';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.5, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // 兜帽
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.35, r * 0.28, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkC;
        ctx.lineWidth = 1 * s;
        ctx.stroke();
        // 眼睛
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.5, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.5, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 符文书（右手持书）
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.roundRect(x + r * 0.35, y - r * 0.25, r * 0.35, r * 0.25, r * 0.03);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1 * s;
        ctx.stroke();
        // 书页
        ctx.fillStyle = '#fff8e1';
        ctx.fillRect(x + r * 0.4, y - r * 0.18, r * 0.25, r * 0.12);

        // 召唤环（脚下法阵）
        var t = Date.now() / 1000;
        ctx.strokeStyle = '#66bb6a66';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.45, r * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#81c78444';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.45, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        // 旋转符文
        for (var i = 0; i < 4; i++) {
            var angle = t + i * Math.PI / 2;
            var rx = x + Math.cos(angle) * r * 0.5;
            var ry = y + r * 0.45 + Math.sin(angle) * r * 0.5;
            ctx.fillStyle = '#66bb6a88';
            this.drawStar(ctx, rx, ry, r * 0.04);
        }
    },

    // 战士：红棕战甲 + 角盔 + 战斧
    drawWarrior: function(ctx, x, y, r, color) {
        var bodyC = '#bf360c';
        var darkC = '#871f0a';
        var lightC = '#ff8a65';
        var goldC = '#ffb300';
        var s = r / 18;

        // 战甲（红棕）
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.55, y - r * 0.3, r * 1.1, r * 0.7, r * 0.08);
        ctx.fill();
        ctx.strokeStyle = darkC;
        ctx.lineWidth = 2 * s;
        ctx.stroke();

        // 胸甲纹路
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.1);
        ctx.lineTo(x, y + r * 0.15);
        ctx.lineTo(x + r * 0.35, y - r * 0.1);
        ctx.stroke();

        // 毛皮披肩
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.35, r * 0.5, r * 0.12, 0, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // 角盔
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.6, r * 0.38, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        // 角
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.75);
        ctx.lineTo(x - r * 0.5, y - r * 1.1);
        ctx.lineTo(x - r * 0.2, y - r * 0.75);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.75);
        ctx.lineTo(x + r * 0.5, y - r * 1.1);
        ctx.lineTo(x + r * 0.2, y - r * 0.75);
        ctx.closePath();
        ctx.fill();
        // 面罩（T字）
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x - r * 0.2, y - r * 0.62, r * 0.4, r * 0.06);
        ctx.fillRect(x - r * 0.03, y - r * 0.62, r * 0.06, r * 0.12);

        // 战斧（右手）
        ctx.fillStyle = '#78909c';
        ctx.beginPath();
        ctx.roundRect(x + r * 0.5, y - r * 0.6, r * 0.15, r * 0.5, r * 0.02);
        ctx.fill();
        // 斧头
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.57, y - r * 0.6);
        ctx.lineTo(x + r * 0.9, y - r * 0.4);
        ctx.lineTo(x + r * 0.9, y - r * 0.15);
        ctx.lineTo(x + r * 0.57, y - r * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#607d8b';
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // 腿
        ctx.fillStyle = darkC;
        ctx.fillRect(x - r * 0.3, y + r * 0.4, r * 0.2, r * 0.35);
        ctx.fillRect(x + r * 0.1, y + r * 0.4, r * 0.2, r * 0.35);
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(x - r * 0.35, y + r * 0.65, r * 0.27, r * 0.12);
        ctx.fillRect(x + r * 0.08, y + r * 0.65, r * 0.27, r * 0.12);
    },

    // 贤者：白袍 + 光环 + 十字
    drawSage: function(ctx, x, y, r, color) {
        var bodyC = '#eceff1';
        var darkC = '#b0bec5';
        var goldC = '#ffd700';
        var s = r / 18;

        // 光环（头顶）
        var t = Date.now() / 600;
        ctx.strokeStyle = '#ffd70066';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.75, r * 0.2 + Math.sin(t) * r * 0.03, r * 0.06, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 白袍
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.2, r * 1.0, r * 0.65, r * 0.12);
        ctx.fill();
        ctx.strokeStyle = darkC;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // 圣职披肩
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.25, r * 0.55, r * 0.12, 0, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        // 胸前十字
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.05);
        ctx.lineTo(x, y + r * 0.2);
        ctx.moveTo(x - r * 0.1, y + r * 0.07);
        ctx.lineTo(x + r * 0.1, y + r * 0.07);
        ctx.stroke();

        // 头
        ctx.fillStyle = '#f5d6c1';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.5, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // 白发
        ctx.fillStyle = '#eeeeee';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.65, r * 0.28, r * 0.12, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        // 眼睛（闭眼温和）
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 1 * s;
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.5, r * 0.03, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.5, r * 0.03, 0, Math.PI);
        ctx.stroke();

        // 法杖（蛇杖）
        ctx.strokeStyle = '#795548';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.55, y - r * 0.1);
        ctx.lineTo(x + r * 0.75, y + r * 0.6);
        ctx.stroke();
        // 蛇形杖头
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + r * 0.55, y - r * 0.15, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
    },

    // 亡灵法师：暗紫斗篷 + 骷髅标记 + 镰刀
    drawNecromancer: function(ctx, x, y, r, color) {
        var bodyC = '#4a148c';
        var darkC = '#1a0033';
        var lightC = '#9c27b0';
        var greenC = '#66bb6a';
        var s = r / 18;

        // 暗紫斗篷
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.55, y - r * 0.35, r * 1.1, r * 0.8, r * 0.15);
        ctx.fill();

        // 骷髅头标记（胸前）
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.05, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        // 骷髅眼睛
        ctx.fillStyle = '#1a0033';
        ctx.beginPath();
        ctx.arc(x - r * 0.04, y + r * 0.03, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.04, y + r * 0.03, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        // 骷髅嘴
        ctx.fillRect(x - r * 0.05, y + r * 0.08, r * 0.1, r * 0.025);

        // 兜帽（遮脸，只见眼睛发光）
        ctx.fillStyle = darkC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.38, r * 0.3, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        // 发光眼睛
        ctx.fillStyle = greenC;
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.55, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.55, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff88';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.56, r * 0.015, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.12, y - r * 0.56, r * 0.015, 0, Math.PI * 2);
        ctx.fill();

        // 镰刀（右手高举）
        ctx.fillStyle = '#607d8b';
        ctx.beginPath();
        ctx.roundRect(x + r * 0.45, y - r * 0.9, r * 0.08, r * 1.3, r * 0.02);
        ctx.fill();
        // 镰刀刃
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.49, y - r * 0.9);
        ctx.lineTo(x + r * 1.0, y - r * 0.5);
        ctx.lineTo(x + r * 0.9, y - r * 0.2);
        ctx.lineTo(x + r * 0.49, y - r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#78909c';
        ctx.lineWidth = 1 * s;
        ctx.stroke();

        // 死亡气息
        var t = Date.now() / 500;
        for (var i = 0; i < 3; i++) {
            var dx = x + Math.sin(t + i * 2) * r * 0.6;
            var dy = y - r * 0.3 + Math.cos(t + i * 2) * r * 0.4;
            ctx.fillStyle = '#9c27b022';
            ctx.beginPath();
            ctx.arc(dx, dy, r * 0.05 + Math.sin(t + i) * r * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 剑客：红白铠甲 + 长发 + 太刀
    drawSwordsman: function(ctx, x, y, r, color) {
        var bodyC = '#e53935';
        var whiteC = '#f5f5f5';
        var darkC = '#b71c1c';
        var s = r / 18;

        // 白底红纹铠甲
        ctx.fillStyle = whiteC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.7, r * 0.08);
        ctx.fill();
        // 红色胸甲
        ctx.fillStyle = bodyC;
        ctx.fillRect(x - r * 0.35, y - r * 0.25, r * 0.7, r * 0.35);
        // 铠甲纹
        ctx.fillStyle = '#ffcdd2';
        ctx.fillRect(x - r * 0.05, y - r * 0.25, r * 0.1, r * 0.35);

        // 长发
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.55);
        ctx.lineTo(x - r * 0.4, y + r * 0.1);
        ctx.lineTo(x - r * 0.2, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.25, y - r * 0.55);
        ctx.lineTo(x + r * 0.4, y + r * 0.1);
        ctx.lineTo(x + r * 0.2, y - r * 0.3);
        ctx.closePath();
        ctx.fill();

        // 头
        ctx.fillStyle = '#f5d6c1';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.5, r * 0.23, 0, Math.PI * 2);
        ctx.fill();
        // 眼神锐利
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.5, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.5, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        // 眉（剑眉）
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.56);
        ctx.lineTo(x - r * 0.02, y - r * 0.55);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.56);
        ctx.lineTo(x + r * 0.02, y - r * 0.55);
        ctx.stroke();

        // 太刀（腰间斜挂）
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.roundRect(x + r * 0.15, y + r * 0.2, r * 0.06, r * 0.55, r * 0.01);
        ctx.fill();
        // 刀柄
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(x + r * 0.15, y + r * 0.65, r * 0.06, r * 0.12);
        // 刀尖闪光
        ctx.fillStyle = '#ffffff88';
        ctx.beginPath();
        ctx.arc(x + r * 0.18, y + r * 0.2, r * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // 腿
        ctx.fillStyle = whiteC;
        ctx.fillRect(x - r * 0.25, y + r * 0.4, r * 0.18, r * 0.35);
        ctx.fillRect(x + r * 0.07, y + r * 0.4, r * 0.18, r * 0.35);
        // 红靴
        ctx.fillStyle = bodyC;
        ctx.fillRect(x - r * 0.3, y + r * 0.65, r * 0.25, r * 0.12);
        ctx.fillRect(x + r * 0.05, y + r * 0.65, r * 0.25, r * 0.12);
    },

    // 通用英雄
    drawGenericHero: function(ctx, x, y, r, color) {
        ctx.fillStyle = color + '66';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y - 2, r * 0.5, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y - r * 0.7, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    },

    // ====== 怪物精灵绘制 ======

    // 史莱姆：水滴果冻 + 大眼睛
    drawSlime: function(ctx, x, y, r, color, elite) {
        ctx.fillStyle = elite ? '#66bb6a' : '#4caf50';
        ctx.strokeStyle = '#388e3c';
        ctx.lineWidth = 2;
        // 果冻身体
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.7, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 顶部凸起
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.3, r * 0.45, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.2, y - r * 0.3, r * 0.15, r * 0.1, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 大眼
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.25, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.15, y - r * 0.25, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.25, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.15, y - r * 0.25, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        // 嘴（微笑）
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.12, 0.1, Math.PI - 0.1);
        ctx.stroke();
    },

    // 史莱姆王：大果冻 + 皇冠
    drawSlimeKing: function(ctx, x, y, r, color, elite) {
        this.drawSlime(ctx, x, y, r * 1.2, color, true);
        // 皇冠
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.55);
        ctx.lineTo(x - r * 0.4, y - r * 0.85);
        ctx.lineTo(x - r * 0.25, y - r * 0.75);
        ctx.lineTo(x, y - r * 0.95);
        ctx.lineTo(x + r * 0.25, y - r * 0.75);
        ctx.lineTo(x + r * 0.4, y - r * 0.85);
        ctx.lineTo(x + r * 0.35, y - r * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff8f00';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 宝石
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.8, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
    },

    // 哥布林：小身材 + 尖耳 + 短刀
    drawGoblin: function(ctx, x, y, r, color, elite) {
        var skinC = elite ? '#a5d6a7' : '#81c784';
        var clothC = '#5d4037';
        var s = r / 18;

        // 身体
        ctx.fillStyle = clothC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.4, y - r * 0.25, r * 0.8, r * 0.55, r * 0.06);
        ctx.fill();

        // 头
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.35, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 尖耳
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.55);
        ctx.lineTo(x - r * 0.5, y - r * 0.85);
        ctx.lineTo(x - r * 0.2, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.55);
        ctx.lineTo(x + r * 0.5, y - r * 0.85);
        ctx.lineTo(x + r * 0.2, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        // 红眼
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.55, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.55, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 龇牙
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - r * 0.08, y - r * 0.42, r * 0.16, r * 0.04);

        // 短刀
        ctx.strokeStyle = '#b0bec5';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.1);
        ctx.lineTo(x + r * 0.6, y + r * 0.2);
        ctx.stroke();
    },

    // 骷髅兵：骷髅头 + 骨架
    drawSkeleton: function(ctx, x, y, r, color, elite) {
        var boneC = '#e0e0e0';
        var darkC = '#9e9e9e';

        // 腿骨
        ctx.strokeStyle = boneC;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y + r * 0.4);
        ctx.lineTo(x - r * 0.2, y + r * 0.75);
        ctx.moveTo(x + r * 0.15, y + r * 0.4);
        ctx.lineTo(x + r * 0.2, y + r * 0.75);
        ctx.stroke();

        // 肋骨笼
        ctx.fillStyle = boneC + '66';
        ctx.strokeStyle = boneC;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.05, r * 0.3, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 肋骨线
        for (var i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y - r * 0.25 + i * r * 0.15);
            ctx.lineTo(x + r * 0.25, y - r * 0.2 + i * r * 0.15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y - r * 0.25 + i * r * 0.15);
            ctx.lineTo(x - r * 0.25, y - r * 0.2 + i * r * 0.15);
            ctx.stroke();
        }

        // 骷髅头
        ctx.fillStyle = boneC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.3, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkC;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 眼眶
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.1, y - r * 0.55, r * 0.07, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + r * 0.1, y - r * 0.55, r * 0.07, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // 嘴
        ctx.fillRect(x - r * 0.12, y - r * 0.38, r * 0.24, r * 0.04);

        // 臂骨
        ctx.strokeStyle = boneC;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.1);
        ctx.lineTo(x - r * 0.55, y + r * 0.3);
        ctx.moveTo(x + r * 0.3, y - r * 0.1);
        ctx.lineTo(x + r * 0.55, y + r * 0.3);
        ctx.stroke();

        if (elite) {
            // 精英骷髅头顶红色标记
            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.arc(x, y - r * 0.8, r * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 荒野狼：四足
    drawWolf: function(ctx, x, y, r, color, elite) {
        var furC = elite ? '#78909c' : '#607d8b';
        var darkC = '#455a64';

        // 身体
        ctx.fillStyle = furC;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.7, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkC;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 头
        ctx.fillStyle = furC;
        ctx.beginPath();
        ctx.ellipse(x + r * 0.55, y - r * 0.35, r * 0.35, r * 0.25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 耳朵
        ctx.beginPath();
        ctx.moveTo(x + r * 0.5, y - r * 0.55);
        ctx.lineTo(x + r * 0.55, y - r * 0.75);
        ctx.lineTo(x + r * 0.65, y - r * 0.55);
        ctx.closePath();
        ctx.fill();
        // 眼睛
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x + r * 0.65, y - r * 0.35, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x + r * 0.65, y - r * 0.35, r * 0.018, 0, Math.PI * 2);
        ctx.fill();
        // 嘴
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(x + r * 0.82, y - r * 0.35, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 腿
        ctx.fillStyle = furC;
        for (var i = 0; i < 4; i++) {
            var lx = x - r * 0.35 + i * r * 0.25;
            var ly = y + r * 0.3;
            ctx.fillRect(lx - r * 0.04, ly, r * 0.08, r * 0.35);
        }

        // 尾巴
        ctx.strokeStyle = furC;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.55, y - r * 0.1);
        ctx.lineTo(x - r * 0.75, y - r * 0.35);
        ctx.stroke();
    },

    // 吸血蝙蝠：翅膀 + 尖牙
    drawBat: function(ctx, x, y, r, color, elite) {
        var wingC = elite ? '#6a1b9a' : '#4a148c';
        var bodyC = '#311b92';

        // 翅膀（张开）
        ctx.fillStyle = wingC;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.1);
        ctx.lineTo(x - r * 0.9, y - r * 0.2);
        ctx.lineTo(x - r * 0.5, y + r * 0.1);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.1);
        ctx.lineTo(x + r * 0.9, y - r * 0.2);
        ctx.lineTo(x + r * 0.5, y + r * 0.1);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();

        // 身体
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.25, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.35, r * 0.22, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // 小耳朵
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.5);
        ctx.lineTo(x - r * 0.12, y - r * 0.65);
        ctx.lineTo(x - r * 0.05, y - r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.5);
        ctx.lineTo(x + r * 0.12, y - r * 0.65);
        ctx.lineTo(x + r * 0.05, y - r * 0.5);
        ctx.closePath();
        ctx.fill();
        // 红眼
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x - r * 0.06, y - r * 0.35, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.06, y - r * 0.35, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        // 尖牙
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.04, y - r * 0.22);
        ctx.lineTo(x, y - r * 0.16);
        ctx.lineTo(x + r * 0.04, y - r * 0.22);
        ctx.closePath();
        ctx.fill();
    },

    // 兽人战士：壮硕 + 獠牙
    drawOrc: function(ctx, x, y, r, color, elite) {
        var skinC = elite ? '#6d4c41' : '#5d4037';
        var armorC = '#424242';
        var s = r / 18;

        // 壮硕身体
        ctx.fillStyle = armorC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.55, y - r * 0.25, r * 1.1, r * 0.6, r * 0.08);
        ctx.fill();

        // 肩甲
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.6, y - r * 0.25, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + r * 0.6, y - r * 0.25, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.58, r * 0.4, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // 獠牙
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.35);
        ctx.lineTo(x - r * 0.18, y - r * 0.2);
        ctx.lineTo(x - r * 0.1, y - r * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.35);
        ctx.lineTo(x + r * 0.18, y - r * 0.2);
        ctx.lineTo(x + r * 0.1, y - r * 0.35);
        ctx.closePath();
        ctx.fill();
        // 红眼
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.6, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.6, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 战斧
        ctx.fillStyle = '#78909c';
        ctx.beginPath();
        ctx.roundRect(x + r * 0.5, y - r * 0.4, r * 0.1, r * 0.7, r * 0.02);
        ctx.fill();
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.55, y - r * 0.4);
        ctx.lineTo(x + r * 0.85, y - r * 0.2);
        ctx.lineTo(x + r * 0.85, y);
        ctx.lineTo(x + r * 0.55, y);
        ctx.closePath();
        ctx.fill();
    },

    // 暗黑法师
    drawDarkMage: function(ctx, x, y, r, color, elite) {
        var robeC = '#1a1a2e';
        var glowC = '#9c27b0';

        // 暗黑法袍
        ctx.fillStyle = robeC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.25, r * 1.0, r * 0.7, r * 0.12);
        ctx.fill();

        // 兜帽
        ctx.fillStyle = '#0d0d1a';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.4, r * 0.32, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        // 紫色眼睛
        ctx.fillStyle = glowC;
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.55, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.55, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 骷髅法杖
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.roundRect(x + r * 0.4, y - r * 0.8, r * 0.06, r * 1.2, r * 0.01);
        ctx.fill();
        // 骷髅头杖顶
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.arc(x + r * 0.43, y - r * 0.8, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x + r * 0.4, y - r * 0.8, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.46, y - r * 0.8, r * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // 暗黑光环
        var t = Date.now() / 800;
        ctx.strokeStyle = '#9c27b044';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.2, r * 0.5 + Math.sin(t) * r * 0.05, 0, Math.PI * 2);
        ctx.stroke();
    },

    // 石魔像
    drawGolem: function(ctx, x, y, r, color, elite) {
        var rockC = elite ? '#78909c' : '#607d8b';
        var darkC = '#455a64';
        var crackC = '#37474f';

        // 方形身体
        ctx.fillStyle = rockC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.6, y - r * 0.3, r * 1.2, r * 0.65, r * 0.06);
        ctx.fill();
        ctx.strokeStyle = darkC;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 裂缝
        ctx.strokeStyle = crackC;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.15);
        ctx.lineTo(x, y + r * 0.15);
        ctx.lineTo(x + r * 0.3, y);
        ctx.stroke();

        // 方形头
        ctx.fillStyle = rockC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.35, y - r * 0.8, r * 0.7, r * 0.45, r * 0.04);
        ctx.fill();
        ctx.strokeStyle = darkC;
        ctx.stroke();
        // 发光眼睛
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.6, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.6, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 嘴（裂缝）
        ctx.strokeStyle = crackC;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.1, y - r * 0.45);
        ctx.lineTo(x + r * 0.1, y - r * 0.45);
        ctx.stroke();

        // 手臂
        ctx.fillStyle = rockC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.8, y - r * 0.2, r * 0.2, r * 0.5, r * 0.03);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + r * 0.6, y - r * 0.2, r * 0.2, r * 0.5, r * 0.03);
        ctx.fill();
    },

    // 幼龙
    drawDragonWhelp: function(ctx, x, y, r, color, elite) {
        var scaleC = elite ? '#4e342e' : '#3e2723';
        var bellyC = '#8d6e63';
        var wingC = '#5d4037';

        // 翅膀
        ctx.fillStyle = wingC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.15);
        ctx.lineTo(x - r * 0.8, y - r * 0.6);
        ctx.lineTo(x - r * 0.4, y);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.15);
        ctx.lineTo(x + r * 0.8, y - r * 0.6);
        ctx.lineTo(x + r * 0.4, y);
        ctx.closePath();
        ctx.fill();

        // 身体
        ctx.fillStyle = scaleC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.05, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2c1a0e';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 肚皮
        ctx.fillStyle = bellyC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.25, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头
        ctx.fillStyle = scaleC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.4, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // 眼睛
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.42, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.42, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.42, r * 0.018, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.42, r * 0.018, 0, Math.PI * 2);
        ctx.fill();
        // 角
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.6);
        ctx.lineTo(x - r * 0.2, y - r * 0.8);
        ctx.lineTo(x - r * 0.05, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.6);
        ctx.lineTo(x + r * 0.2, y - r * 0.8);
        ctx.lineTo(x + r * 0.05, y - r * 0.6);
        ctx.closePath();
        ctx.fill();

        // 尾巴
        ctx.strokeStyle = scaleC;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.4, y + r * 0.15);
        ctx.lineTo(x - r * 0.7, y + r * 0.3);
        ctx.stroke();
    },

    // 幽魂：半透明
    drawWraith: function(ctx, x, y, r, color, elite) {
        var ghostC = elite ? 'rgba(200,200,255,0.5)' : 'rgba(180,180,255,0.4)';

        // 幽魂身体（半透明飘动）
        ctx.fillStyle = ghostC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.45, y - r * 0.35);
        ctx.quadraticCurveTo(x - r * 0.5, y + r * 0.2, x - r * 0.3, y + r * 0.45);
        ctx.quadraticCurveTo(x, y + r * 0.55, x + r * 0.3, y + r * 0.45);
        ctx.quadraticCurveTo(x + r * 0.5, y + r * 0.2, x + r * 0.45, y - r * 0.35);
        ctx.quadraticCurveTo(x, y - r * 0.5, x - r * 0.45, y - r * 0.35);
        ctx.closePath();
        ctx.fill();

        // 头部区域
        ctx.fillStyle = elite ? 'rgba(220,220,255,0.6)' : 'rgba(200,200,255,0.5)';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.3, r * 0.3, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 空洞眼睛
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.3, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.3, r * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // 飘带
        var t = Date.now() / 600;
        for (var i = 0; i < 2; i++) {
            var wx = x - r * 0.2 + i * r * 0.4;
            var wy = y + r * 0.2 + Math.sin(t + i) * r * 0.08;
            ctx.fillStyle = 'rgba(180,180,255,0.2)';
            ctx.beginPath();
            ctx.arc(wx, wy, r * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 牛头人
    drawMinotaur: function(ctx, x, y, r, color, elite) {
        var furC = elite ? '#6d4c41' : '#5d4037';
        var armorC = '#9e9e9e';

        // 壮硕身体
        ctx.fillStyle = furC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.55, y - r * 0.3, r * 1.1, r * 0.65, r * 0.08);
        ctx.fill();
        // 胸甲
        ctx.fillStyle = armorC;
        ctx.fillRect(x - r * 0.35, y - r * 0.2, r * 0.7, r * 0.3);

        // 牛头
        ctx.fillStyle = furC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.6, r * 0.4, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // 牛角
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.8);
        ctx.lineTo(x - r * 0.5, y - r * 1.15);
        ctx.lineTo(x - r * 0.1, y - r * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.25, y - r * 0.8);
        ctx.lineTo(x + r * 0.5, y - r * 1.15);
        ctx.lineTo(x + r * 0.1, y - r * 0.85);
        ctx.closePath();
        ctx.fill();
        // 鼻孔
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.5, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.5, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        // 红眼
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.62, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.62, r * 0.035, 0, Math.PI * 2);
        ctx.fill();

        // 双斧
        ctx.fillStyle = '#78909c';
        ctx.beginPath();
        ctx.roundRect(x - r * 0.65, y - r * 0.1, r * 0.08, r * 0.5, r * 0.02);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + r * 0.57, y - r * 0.1, r * 0.08, r * 0.5, r * 0.02);
        ctx.fill();
        // 斧刃
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.61, y - r * 0.1);
        ctx.lineTo(x - r * 0.35, y - r * 0.3);
        ctx.lineTo(x - r * 0.35, y);
        ctx.lineTo(x - r * 0.61, y);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.61, y - r * 0.1);
        ctx.lineTo(x + r * 0.35, y - r * 0.3);
        ctx.lineTo(x + r * 0.35, y);
        ctx.lineTo(x + r * 0.61, y);
        ctx.closePath();
        ctx.fill();
    },

    // 巫妖
    drawLich: function(ctx, x, y, r, color, elite) {
        var robeC = '#1a0033';
        var glowC = '#00e676';

        // 法袍
        ctx.fillStyle = robeC;
        ctx.beginPath();
        ctx.roundRect(x - r * 0.5, y - r * 0.3, r * 1.0, r * 0.75, r * 0.12);
        ctx.fill();

        // 皇冠
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.6);
        ctx.lineTo(x - r * 0.35, y - r * 0.85);
        ctx.lineTo(x - r * 0.15, y - r * 0.7);
        ctx.lineTo(x, y - r * 0.9);
        ctx.lineTo(x + r * 0.15, y - r * 0.7);
        ctx.lineTo(x + r * 0.35, y - r * 0.85);
        ctx.lineTo(x + r * 0.3, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        // 皇冠宝石
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.82, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 骷髅脸（绿色发光）
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.3, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // 绿色眼睛
        ctx.fillStyle = glowC;
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.55, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.55, r * 0.035, 0, Math.PI * 2);
        ctx.fill();

        // 法杖
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.roundRect(x + r * 0.45, y - r * 0.3, r * 0.08, r * 0.8, r * 0.02);
        ctx.fill();
        // 法杖顶
        ctx.fillStyle = glowC;
        ctx.beginPath();
        ctx.arc(x + r * 0.49, y - r * 0.35, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + r * 0.48, y - r * 0.37, r * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // 死亡光环
        var t = Date.now() / 700;
        ctx.strokeStyle = '#00e67644';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.2, r * 0.5 + Math.sin(t) * r * 0.05, 0, Math.PI * 2);
        ctx.stroke();
    },

    // 世界之主·芦笋（魔王级BOSS — 巨型竹笋）
    drawBambooShootBoss: function(ctx, x, y, r, color, elite) {
        var s = r / 24;
        // 竹笋主体 — 上尖下宽的三角形
        var bodyW = r * 1.2;
        var bodyH = r * 2.5;
        var topY = y - bodyH * 0.55;
        var botY = y + bodyH * 0.45;

        // 主体渐变（深绿→棕→金）
        var bodyGrad = ctx.createLinearGradient(x, topY, x, botY);
        bodyGrad.addColorStop(0, '#2d5a1e');
        bodyGrad.addColorStop(0.3, '#3d7a28');
        bodyGrad.addColorStop(0.6, '#5a8a30');
        bodyGrad.addColorStop(0.85, '#8b6914');
        bodyGrad.addColorStop(1, '#6b4410');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.quadraticCurveTo(x + bodyW, topY + bodyH * 0.3, x + bodyW * 0.7, botY);
        ctx.quadraticCurveTo(x, botY + bodyH * 0.05, x - bodyW * 0.7, botY);
        ctx.quadraticCurveTo(x - bodyW, topY + bodyH * 0.3, x, topY);
        ctx.fill();

        // 竹笋鳞片（横向纹理）
        for (var i = 0; i < 7; i++) {
            var sy = topY + bodyH * 0.1 + i * bodyH * 0.12;
            var sw = bodyW * (1 - i * 0.12);
            ctx.strokeStyle = 'rgba(20,40,10,0.5)';
            ctx.lineWidth = 1.5 * s;
            ctx.beginPath();
            ctx.moveTo(x - sw * 0.5, sy);
            ctx.quadraticCurveTo(x, sy + 3 * s, x + sw * 0.3, sy + 2 * s);
            ctx.stroke();
            // 鳞片尖端
            ctx.fillStyle = 'rgba(80,120,40,0.4)';
            ctx.beginPath();
            ctx.moveTo(x + sw * 0.25, sy);
            ctx.lineTo(x + sw * 0.45, sy - 4 * s);
            ctx.lineTo(x + sw * 0.55, sy + 3 * s);
            ctx.fill();
        }

        // 顶部嫩芽
        ctx.fillStyle = '#6aaa3a';
        ctx.beginPath();
        ctx.moveTo(x - 3 * s, topY);
        ctx.quadraticCurveTo(x - 6 * s, topY - r * 0.6, x + 2 * s, topY - r * 0.5);
        ctx.quadraticCurveTo(x + 8 * s, topY - r * 0.3, x + 4 * s, topY + 2 * s);
        ctx.fill();
        ctx.fillStyle = '#8cc63f';
        ctx.beginPath();
        ctx.moveTo(x + 1 * s, topY);
        ctx.quadraticCurveTo(x - 3 * s, topY - r * 0.4, x + 4 * s, topY - r * 0.35);
        ctx.quadraticCurveTo(x + 10 * s, topY - r * 0.2, x + 5 * s, topY + 1 * s);
        ctx.fill();

        // BOSS 光晕
        if (elite) {
            var glowGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2);
            glowGrad.addColorStop(0, 'rgba(255,200,50,0.3)');
            glowGrad.addColorStop(0.5, 'rgba(255,150,30,0.1)');
            glowGrad.addColorStop(1, 'rgba(255,100,20,0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(x, y, r * 2, 0, Math.PI * 2);
            ctx.fill();

            // 金色边框
            ctx.strokeStyle = 'rgba(255,215,0,0.6)';
            ctx.lineWidth = 3 * s;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
            ctx.stroke();
        }
    },

    // 恶魔
    drawDemon: function(ctx, x, y, r, color, elite) {
        var skinC = elite ? '#b71c1c' : '#8b0000';
        var wingC = '#4a0000';

        // 翅膀
        ctx.fillStyle = wingC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.1);
        ctx.lineTo(x - r * 0.9, y - r * 0.5);
        ctx.lineTo(x - r * 0.5, y + r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.1);
        ctx.lineTo(x + r * 0.9, y - r * 0.5);
        ctx.lineTo(x + r * 0.5, y + r * 0.2);
        ctx.closePath();
        ctx.fill();

        // 身体
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.05, r * 0.5, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.45, r * 0.35, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 恶魔角
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.65);
        ctx.lineTo(x - r * 0.4, y - r * 1.0);
        ctx.lineTo(x - r * 0.05, y - r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.2, y - r * 0.65);
        ctx.lineTo(x + r * 0.4, y - r * 1.0);
        ctx.lineTo(x + r * 0.05, y - r * 0.7);
        ctx.closePath();
        ctx.fill();
        // 燃烧眼睛
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.45, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.45, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        // 嘴
        ctx.fillStyle = '#4a0000';
        ctx.fillRect(x - r * 0.08, y - r * 0.35, r * 0.16, r * 0.03);

        // 尾巴
        ctx.strokeStyle = skinC;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y + r * 0.4);
        ctx.quadraticCurveTo(x - r * 0.5, y + r * 0.7, x - r * 0.2, y + r * 0.6);
        ctx.stroke();

        // 火焰光环
        var t = Date.now() / 500;
        ctx.fillStyle = '#ff660033';
        for (var i = 0; i < 5; i++) {
            var fx = x + Math.cos(t + i * 1.2) * r * 0.8;
            var fy = y + r * 0.3 + Math.sin(t + i * 1.2) * r * 0.15;
            ctx.beginPath();
            ctx.arc(fx, fy, r * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 上古巨龙
    drawElderDragon: function(ctx, x, y, r, color, elite) {
        var scaleC = '#4e342e';
        var bellyC = '#a1887f';
        var wingC = '#3e2723';

        // 大翅膀（展开）
        ctx.fillStyle = wingC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.2);
        ctx.lineTo(x - r * 1.0, y - r * 0.6);
        ctx.lineTo(x - r * 0.6, y + r * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.2);
        ctx.lineTo(x + r * 1.0, y - r * 0.6);
        ctx.lineTo(x + r * 0.6, y + r * 0.1);
        ctx.closePath();
        ctx.fill();

        // 身体
        ctx.fillStyle = scaleC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.6, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 肚皮
        ctx.fillStyle = bellyC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 0.3, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 长颈
        ctx.fillStyle = scaleC;
        ctx.beginPath();
        ctx.ellipse(x + r * 0.3, y - r * 0.3, r * 0.2, r * 0.45, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 龙头
        ctx.fillStyle = scaleC;
        ctx.beginPath();
        ctx.ellipse(x + r * 0.6, y - r * 0.7, r * 0.4, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 龙眼
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x + r * 0.7, y - r * 0.75, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x + r * 0.7, y - r * 0.75, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        // 龙角
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.45, y - r * 0.9);
        ctx.lineTo(x + r * 0.5, y - r * 1.2);
        ctx.lineTo(x + r * 0.6, y - r * 0.95);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.65, y - r * 0.9);
        ctx.lineTo(x + r * 0.75, y - r * 1.2);
        ctx.lineTo(x + r * 0.8, y - r * 0.95);
        ctx.closePath();
        ctx.fill();
        // 龙嘴
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + r * 0.9, y - r * 0.6, r * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // 长尾
        ctx.strokeStyle = scaleC;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y + r * 0.2);
        ctx.quadraticCurveTo(x - r * 0.9, y + r * 0.5, x - r * 1.0, y + r * 0.8);
        ctx.stroke();

        // 精英金色光环
        if (elite) {
            ctx.strokeStyle = '#ffd70044';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.8 + Math.sin(Date.now() / 600) * r * 0.05, 0, Math.PI * 2);
            ctx.stroke();
        }
    },

    // ====== 第5章后怪物特化绘制 ======

    // 鹰身女妖：鸟身女妖 + 大翅膀 + 利爪
    drawHarpy: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var featherC = elite ? '#5e35b1' : '#7b1fa2';
        var darkFeather = elite ? '#311b92' : '#4a148c';
        var beakC = '#ffb300';

        // 大翅膀（后层）
        ctx.fillStyle = featherC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.2);
        ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.8, x - r * 0.9, y + r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.1, x - r * 0.2, y - r * 0.2);
        ctx.fill();
        ctx.fillStyle = darkFeather;
        for (var i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x - r * 0.3 - i * r * 0.05, y - r * 0.2);
            ctx.lineTo(x - r * (0.5 + i * 0.1), y - r * (0.1 - i * 0.05));
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = darkFeather;
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x + r * 0.2, y - r * 0.2);
        ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.8, x + r * 0.9, y + r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.1, x + r * 0.2, y - r * 0.2);
        ctx.fill();
        ctx.stroke();

        // 鸟身
        ctx.fillStyle = '#f5e6c8';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 0.4, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 羽毛纹理
        ctx.fillStyle = '#d4a574';
        for (var j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.ellipse(x, y + r * (0.1 + j * 0.12), r * 0.32, r * 0.04, 0, 0, Math.PI);
            ctx.fill();
        }

        // 头部（鸟）
        ctx.fillStyle = '#f5e6c8';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.45, r * 0.3, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头羽
        ctx.fillStyle = featherC;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.55);
        ctx.lineTo(x - r * 0.1, y - r * 0.85);
        ctx.lineTo(x + r * 0.1, y - r * 0.85);
        ctx.closePath();
        ctx.fill();
        // 锐眼
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x - r * 0.12, y - r * 0.45, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.12, y - r * 0.45, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.12, y - r * 0.45, r * 0.025, 0, Math.PI * 2);
        ctx.arc(x + r * 0.12, y - r * 0.45, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        // 喙
        ctx.fillStyle = beakC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.06, y - r * 0.32);
        ctx.lineTo(x + r * 0.06, y - r * 0.32);
        ctx.lineTo(x, y - r * 0.18);
        ctx.closePath();
        ctx.fill();

        // 利爪
        ctx.fillStyle = '#212121';
        for (var k = 0; k < 2; k++) {
            var cx = x + (k === 0 ? -r * 0.2 : r * 0.2);
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.1, y + r * 0.55);
            ctx.lineTo(cx, y + r * 0.75);
            ctx.lineTo(cx + r * 0.1, y + r * 0.55);
            ctx.closePath();
            ctx.fill();
        }

        // 翅膀扇动动画
        var t = Date.now() / 300;
        var wingY = Math.sin(t) * r * 0.05;
        ctx.fillStyle = featherC + '44';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.6, y - r * 0.4 + wingY, r * 0.15, r * 0.3, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.6, y - r * 0.4 - wingY, r * 0.15, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 精英光环
        if (elite) {
            ctx.strokeStyle = '#ffd70066';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
            ctx.stroke();
        }
    },

    // 幻影刺客：暗影兜帽 + 双匕首 + 紫雾
    drawPhantom: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var cloakC = elite ? '#4a148c' : '#311b92';
        var daggerC = '#b0bec5';
        var eyeC = elite ? '#ff1744' : '#00e5ff';

        // 紫雾（背景）
        var t = Date.now() / 400;
        ctx.fillStyle = '#7b1fa244';
        for (var i = 0; i < 6; i++) {
            var fx = x + Math.cos(t + i * 1.05) * r * 0.7;
            var fy = y + Math.sin(t + i * 1.05) * r * 0.7;
            ctx.beginPath();
            ctx.arc(fx, fy, r * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }

        // 披风
        ctx.fillStyle = cloakC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.45, y - r * 0.4);
        ctx.lineTo(x + r * 0.45, y - r * 0.4);
        ctx.lineTo(x + r * 0.6, y + r * 0.7);
        ctx.lineTo(x, y + r * 0.55);
        ctx.lineTo(x - r * 0.6, y + r * 0.7);
        ctx.closePath();
        ctx.fill();
        // 披风褶皱
        ctx.strokeStyle = '#1a0033';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.2);
        ctx.lineTo(x - r * 0.4, y + r * 0.4);
        ctx.moveTo(x + r * 0.3, y - r * 0.2);
        ctx.lineTo(x + r * 0.4, y + r * 0.4);
        ctx.stroke();

        // 头兜
        ctx.fillStyle = cloakC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.35, r * 0.35, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 兜帽阴影
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.25, r * 0.2, r * 0.15, 0, 0, Math.PI);
        ctx.fill();
        // 神秘双眸
        ctx.fillStyle = eyeC;
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.35, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.08, y - r * 0.35, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 双匕首
        ctx.fillStyle = daggerC;
        // 左匕首
        ctx.save();
        ctx.translate(x - r * 0.4, y + r * 0.05);
        ctx.rotate(-Math.PI / 4);
        ctx.fillRect(-r * 0.05, 0, r * 0.1, r * 0.5);
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(-r * 0.1, -r * 0.05, r * 0.2, r * 0.1);
        ctx.restore();
        // 右匕首
        ctx.save();
        ctx.translate(x + r * 0.4, y + r * 0.05);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = daggerC;
        ctx.fillRect(-r * 0.05, 0, r * 0.1, r * 0.5);
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(-r * 0.1, -r * 0.05, r * 0.2, r * 0.1);
        ctx.restore();

        // 精英拖影
        if (elite) {
            ctx.fillStyle = '#ff174422';
            ctx.beginPath();
            ctx.ellipse(x, y + r * 0.2, r * 0.5, r * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 石化蛇妖：巨蛇 + 6只石化之眼
    drawBasilisk: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var bodyC = elite ? '#558b2f' : '#33691e';
        var scaleC = elite ? '#827717' : '#4e342e';
        var eyeC = elite ? '#ffeb3b' : '#ffd600';

        // 蛇身盘绕（圈状）
        ctx.fillStyle = bodyC;
        // 大圈（最外层）
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.85, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 中圈
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.55, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = scaleC;
        for (var i = 0; i < 12; i++) {
            var angle = i * Math.PI * 2 / 12;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(angle) * r * 0.7, y + r * 0.1 + Math.sin(angle) * r * 0.4, r * 0.05, r * 0.07, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // 蛇头
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.35, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头鳞
        ctx.fillStyle = scaleC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.75, r * 0.1, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        // 6只石化之眼
        var eyePositions = [
            [-0.2, -0.6, 0.05], [-0.05, -0.65, 0.04], [0.1, -0.6, 0.05],
            [-0.2, -0.5, 0.05], [0.05, -0.5, 0.04], [0.15, -0.55, 0.04]
        ];
        for (var k = 0; k < eyePositions.length; k++) {
            var ep = eyePositions[k];
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + r * ep[0], y + r * ep[1], r * ep[2], 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = eyeC;
            ctx.beginPath();
            ctx.arc(x + r * ep[0], y + r * ep[1], r * ep[2] * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + r * ep[0], y + r * ep[1], r * ep[2] * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        // 蛇信
        ctx.fillStyle = '#d50000';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.02, y - r * 0.4);
        ctx.lineTo(x, y - r * 0.32);
        ctx.lineTo(x + r * 0.02, y - r * 0.4);
        ctx.closePath();
        ctx.fill();

        // 石化光环
        var t = Date.now() / 500;
        ctx.strokeStyle = '#9e9e9e44';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r * (0.9 + Math.sin(t) * 0.05), 0, Math.PI * 2);
        ctx.stroke();
    },

    // 血族伯爵：苍白贵族 + 披风 + 獠牙 + 红酒杯
    drawVampire: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var skinC = '#f5f5f5';
        var capeC = elite ? '#1a0033' : '#311b92';
        var innerC = elite ? '#b71c1c' : '#7b1fa2';
        var eyeC = '#d50000';

        // 披风（外层）
        ctx.fillStyle = capeC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.3);
        ctx.lineTo(x - r * 0.85, y - r * 0.1);
        ctx.lineTo(x - r * 0.7, y + r * 0.7);
        ctx.lineTo(x, y + r * 0.5);
        ctx.lineTo(x + r * 0.7, y + r * 0.7);
        ctx.lineTo(x + r * 0.85, y - r * 0.1);
        ctx.lineTo(x + r * 0.3, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
        // 披风内衬
        ctx.fillStyle = innerC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.25);
        ctx.lineTo(x - r * 0.5, y + r * 0.6);
        ctx.lineTo(x, y + r * 0.45);
        ctx.lineTo(x + r * 0.5, y + r * 0.6);
        ctx.lineTo(x + r * 0.2, y - r * 0.25);
        ctx.closePath();
        ctx.fill();

        // 西装身体
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 0.4, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 白色衬领
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.2);
        ctx.lineTo(x - r * 0.05, y - r * 0.05);
        ctx.lineTo(x + r * 0.05, y - r * 0.2);
        ctx.lineTo(x + r * 0.15, y - r * 0.05);
        ctx.closePath();
        ctx.fill();
        // 红色领结
        ctx.fillStyle = '#d50000';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.08, y - r * 0.18);
        ctx.lineTo(x, y - r * 0.1);
        ctx.lineTo(x + r * 0.08, y - r * 0.18);
        ctx.lineTo(x, y - r * 0.05);
        ctx.closePath();
        ctx.fill();

        // 苍白脸
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.45, r * 0.3, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        // 黑发
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.32, r * 0.18, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        // 血眼
        ctx.fillStyle = eyeC;
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.45, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.45, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.45, r * 0.02, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.45, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        // 獠牙
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.05, y - r * 0.3);
        ctx.lineTo(x - r * 0.04, y - r * 0.22);
        ctx.lineTo(x - r * 0.03, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.05, y - r * 0.3);
        ctx.lineTo(x + r * 0.04, y - r * 0.22);
        ctx.lineTo(x + r * 0.03, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
        // 血嘴
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.28, r * 0.06, r * 0.02, 0, 0, Math.PI * 2);
        ctx.fill();

        // 蝙蝠飞舞（背景动画）
        var t = Date.now() / 600;
        ctx.fillStyle = '#000';
        for (var i = 0; i < 3; i++) {
            var angle = t + i * 2.1;
            var bx = x + Math.cos(angle) * r * 0.7;
            var by = y + Math.sin(angle) * r * 0.5;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx - r * 0.06, by - r * 0.04);
            ctx.lineTo(bx - r * 0.03, by);
            ctx.lineTo(bx, by - r * 0.02);
            ctx.lineTo(bx + r * 0.03, by);
            ctx.lineTo(bx + r * 0.06, by - r * 0.04);
            ctx.closePath();
            ctx.fill();
        }
    },

    // 虚空行者：浮动虚影 + 虚空触手
    drawVoidWalker: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var voidC = elite ? '#7b1fa2' : '#4527a0';
        var darkVoid = '#1a0033';

        // 浮动虚影核心
        var t = Date.now() / 400;
        var floatY = Math.sin(t) * r * 0.08;
        var floatX = Math.cos(t * 0.7) * r * 0.04;

        // 触手（后层）
        ctx.strokeStyle = voidC;
        ctx.lineWidth = 3;
        for (var i = 0; i < 6; i++) {
            var angle = t * 0.5 + i * Math.PI * 2 / 6;
            ctx.beginPath();
            ctx.moveTo(x + floatX, y + floatY);
            var cp1x = x + floatX + Math.cos(angle) * r * 0.5;
            var cp1y = y + floatY + Math.sin(angle) * r * 0.5;
            var tipX = x + floatX + Math.cos(angle + Math.sin(t + i) * 0.3) * r * 0.85;
            var tipY = y + floatY + Math.sin(angle + Math.cos(t + i) * 0.3) * r * 0.85;
            ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
            ctx.stroke();
        }

        // 虚影主体
        ctx.fillStyle = voidC + 'aa';
        ctx.beginPath();
        ctx.ellipse(x + floatX, y + floatY, r * 0.5, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        // 内部虚空核
        ctx.fillStyle = darkVoid;
        ctx.beginPath();
        ctx.ellipse(x + floatX, y + floatY, r * 0.3, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // 虚空之眼
        var eyePulse = 0.5 + Math.sin(t * 2) * 0.5;
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(x + floatX, y + floatY - r * 0.1, r * 0.12 * eyePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + floatX, y + floatY - r * 0.1, r * 0.05 * eyePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + floatX, y + floatY - r * 0.1, r * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // 虚空粒子
        ctx.fillStyle = '#b388ff';
        for (var k = 0; k < 8; k++) {
            var px = x + floatX + Math.cos(t * 2 + k * 0.8) * r * 0.6;
            var py = y + floatY + Math.sin(t * 2 + k * 0.8) * r * 0.6;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 奇美拉：狮身羊头龙尾三合一
    drawChimera: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var lionC = elite ? '#f9a825' : '#f57f17';
        var goatC = '#f5f5dc';
        var dragonC = elite ? '#388e3c' : '#1b5e20';
        var scaleC = '#3e2723';

        // 狮身
        ctx.fillStyle = lionC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 0.65, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 狮腿
        for (var i = 0; i < 2; i++) {
            var lx = x + (i === 0 ? -r * 0.3 : r * 0.3);
            ctx.fillStyle = lionC;
            ctx.fillRect(lx - r * 0.08, y + r * 0.45, r * 0.16, r * 0.25);
            ctx.fillStyle = scaleC;
            ctx.fillRect(lx - r * 0.08, y + r * 0.65, r * 0.16, r * 0.05);
        }

        // 狮头（主头，左）
        ctx.fillStyle = lionC;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        // 狮鬃
        ctx.fillStyle = '#bf360c';
        for (var j = 0; j < 8; j++) {
            var a = j * Math.PI * 2 / 8;
            ctx.beginPath();
            ctx.moveTo(x - r * 0.35, y - r * 0.35);
            ctx.lineTo(x - r * 0.35 + Math.cos(a) * r * 0.35, y - r * 0.35 + Math.sin(a) * r * 0.35);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#bf360c';
            ctx.stroke();
        }
        // 狮嘴
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.4, y - r * 0.25, r * 0.06, r * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        // 狮眼
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x - r * 0.45, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.45, y - r * 0.4, r * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // 羊头（中上）
        ctx.fillStyle = goatC;
        ctx.beginPath();
        ctx.ellipse(x + r * 0.1, y - r * 0.5, r * 0.25, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        // 羊角（卷曲）
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.7);
        ctx.quadraticCurveTo(x - r * 0.15, y - r * 0.95, x - r * 0.05, y - r * 0.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.2, y - r * 0.7);
        ctx.quadraticCurveTo(x + r * 0.35, y - r * 0.95, x + r * 0.25, y - r * 0.85);
        ctx.stroke();
        // 羊眼（垂直矩形）
        ctx.fillStyle = '#000';
        ctx.fillRect(x + r * 0.05, y - r * 0.55, r * 0.02, r * 0.04);
        ctx.fillRect(x + r * 0.15, y - r * 0.55, r * 0.02, r * 0.04);
        // 山羊胡
        ctx.fillStyle = goatC;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.1, y - r * 0.35);
        ctx.lineTo(x + r * 0.05, y - r * 0.2);
        ctx.lineTo(x + r * 0.15, y - r * 0.2);
        ctx.closePath();
        ctx.fill();

        // 龙尾（右后）
        ctx.strokeStyle = dragonC;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.5, y + r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.8, y + r * 0.3, x + r * 0.7, y + r * 0.55);
        ctx.stroke();
        // 龙尾尖刺
        ctx.fillStyle = dragonC;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.7, y + r * 0.55);
        ctx.lineTo(x + r * 0.65, y + r * 0.65);
        ctx.lineTo(x + r * 0.75, y + r * 0.6);
        ctx.closePath();
        ctx.fill();

        // 火焰吐息
        var t = Date.now() / 300;
        ctx.fillStyle = '#ff6f00aa';
        for (var k = 0; k < 4; k++) {
            var fx = x - r * 0.55 - k * r * 0.08;
            var fy = y - r * 0.25 + Math.sin(t + k) * r * 0.04;
            ctx.beginPath();
            ctx.arc(fx, fy, r * 0.05 * (1 - k * 0.2), 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 贝希摩斯：庞然巨兽 + 巨角
    drawBehemoth: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var hideC = elite ? '#4e342e' : '#3e2723';
        var hornC = '#f5e6c8';
        var maneC = elite ? '#5d4037' : '#3e2723';
        var tuskC = '#fff';

        // 巨兽身躯（巨大椭圆）
        ctx.fillStyle = hideC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.85, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        // 巨腹
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.35, r * 0.6, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // 粗腿
        for (var i = 0; i < 2; i++) {
            var lx = x + (i === 0 ? -r * 0.4 : r * 0.4);
            ctx.fillStyle = hideC;
            ctx.beginPath();
            ctx.ellipse(lx, y + r * 0.6, r * 0.15, r * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            // 蹄
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(lx - r * 0.12, y + r * 0.75, r * 0.24, r * 0.08);
        }

        // 巨头
        ctx.fillStyle = hideC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.45, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 鬃毛
        ctx.fillStyle = maneC;
        for (var j = 0; j < 6; j++) {
            ctx.beginPath();
            ctx.moveTo(x - r * 0.4 + j * r * 0.15, y - r * 0.7);
            ctx.lineTo(x - r * 0.35 + j * r * 0.15, y - r * 0.95);
            ctx.lineTo(x - r * 0.3 + j * r * 0.15, y - r * 0.7);
            ctx.closePath();
            ctx.fill();
        }

        // 巨角
        ctx.fillStyle = hornC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.7);
        ctx.quadraticCurveTo(x - r * 0.55, y - r * 1.1, x - r * 0.2, y - r * 0.95);
        ctx.quadraticCurveTo(x - r * 0.3, y - r * 0.85, x - r * 0.3, y - r * 0.7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.7);
        ctx.quadraticCurveTo(x + r * 0.55, y - r * 1.1, x + r * 0.2, y - r * 0.95);
        ctx.quadraticCurveTo(x + r * 0.3, y - r * 0.85, x + r * 0.3, y - r * 0.7);
        ctx.fill();
        // 角环
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 1;
        for (var k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(x - r * 0.35, y - r * (0.78 + k * 0.05), r * 0.04, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + r * 0.35, y - r * (0.78 + k * 0.05), r * 0.04, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 小眼
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.15, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.4, r * 0.02, 0, Math.PI * 2);
        ctx.arc(x + r * 0.15, y - r * 0.4, r * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // 獠牙
        ctx.fillStyle = tuskC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.2);
        ctx.lineTo(x - r * 0.1, y + r * 0.05);
        ctx.lineTo(x - r * 0.05, y - r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.05, y - r * 0.2);
        ctx.lineTo(x + r * 0.1, y + r * 0.05);
        ctx.lineTo(x + r * 0.15, y - r * 0.2);
        ctx.closePath();
        ctx.fill();

        // 鼻环
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.25, r * 0.04, 0, Math.PI * 2);
        ctx.stroke();
    },

    // 凤凰：烈焰神鸟 + 长尾羽
    drawPhoenix: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var fireC = elite ? '#ff6f00' : '#ff8f00';
        var coreFire = elite ? '#ffeb3b' : '#fff176';
        var tailC = elite ? '#d84315' : '#bf360c';

        // 长尾羽（后层）
        ctx.fillStyle = tailC;
        for (var i = 0; i < 5; i++) {
            var tailX = x - r * 0.3 + i * r * 0.15;
            var tailWobble = Math.sin(Date.now() / 200 + i) * r * 0.05;
            ctx.beginPath();
            ctx.moveTo(tailX, y + r * 0.2);
            ctx.quadraticCurveTo(tailX + r * 0.05, y + r * 0.7 + tailWobble, tailX + r * 0.1, y + r * 0.95);
            ctx.quadraticCurveTo(tailX + r * 0.15, y + r * 0.7, tailX + r * 0.2, y + r * 0.2);
            ctx.closePath();
            ctx.fill();
        }

        // 火焰大尾
        ctx.fillStyle = fireC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y + r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.4, y + r * 0.95, x + r * 0.5, y + r * 0.4);
        ctx.quadraticCurveTo(x + r * 0.3, y + r * 0.2, x - r * 0.3, y + r * 0.1);
        ctx.fill();

        // 大翅膀
        var wingFlap = Math.sin(Date.now() / 150) * r * 0.1;
        ctx.fillStyle = fireC;
        // 左翅
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.95, y - r * 0.4 + wingFlap, x - r * 0.6, y + r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.4, y + r * 0.05, x - r * 0.2, y - r * 0.1);
        ctx.fill();
        // 右翅
        ctx.beginPath();
        ctx.moveTo(x + r * 0.2, y - r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.95, y - r * 0.4 - wingFlap, x + r * 0.6, y + r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.4, y + r * 0.05, x + r * 0.2, y - r * 0.1);
        ctx.fill();

        // 鸟身
        ctx.fillStyle = fireC;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.4, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 火焰核心
        ctx.fillStyle = coreFire;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.25, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头部
        ctx.fillStyle = fireC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.45, r * 0.25, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        // 凤冠
        ctx.fillStyle = coreFire;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.1, y - r * 0.6);
        ctx.lineTo(x - r * 0.05, y - r * 0.8);
        ctx.lineTo(x, y - r * 0.65);
        ctx.lineTo(x + r * 0.05, y - r * 0.8);
        ctx.lineTo(x + r * 0.1, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        // 凤眼
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.45, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.08, y - r * 0.45, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d50000';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.45, r * 0.03, 0, Math.PI * 2);
        ctx.arc(x + r * 0.08, y - r * 0.45, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        // 尖喙
        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.05, y - r * 0.32);
        ctx.lineTo(x + r * 0.05, y - r * 0.32);
        ctx.lineTo(x, y - r * 0.2);
        ctx.closePath();
        ctx.fill();

        // 飘散火星
        var t = Date.now() / 200;
        ctx.fillStyle = '#ffeb3b';
        for (var k = 0; k < 6; k++) {
            var sx = x + Math.cos(t + k * 1.05) * r * 0.7;
            var sy = y + Math.sin(t + k * 1.05) * r * 0.5 - r * 0.3;
            ctx.beginPath();
            ctx.arc(sx, sy, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 泰坦巨人：巨型强壮人形 + 雷电纹身
    drawTitan: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var skinC = elite ? '#90a4ae' : '#78909c';
        var clothC = '#5d4037';
        var tattooC = '#00e5ff';
        var eyeC = elite ? '#ffeb3b' : '#fdd835';

        // 巨大身躯
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.7, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // 巨臂
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.75, y + r * 0.1, r * 0.18, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + r * 0.75, y + r * 0.1, r * 0.18, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // 巨拳
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.arc(x - r * 0.85, y + r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.arc(x + r * 0.85, y + r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 腰布
        ctx.fillStyle = clothC;
        ctx.fillRect(x - r * 0.45, y + r * 0.5, r * 0.9, r * 0.3);
        // 布条
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1.5;
        for (var i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x - r * 0.45 + i * r * 0.22, y + r * 0.5);
            ctx.lineTo(x - r * 0.45 + i * r * 0.22, y + r * 0.8);
            ctx.stroke();
        }

        // 巨腿
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.25, y + r * 0.85, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.25, y + r * 0.85, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 巨头
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.5, r * 0.4, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头带
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(x - r * 0.42, y - r * 0.6, r * 0.84, r * 0.08);
        // 头带装饰
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.56, r * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // 雷电纹身（身体）
        ctx.strokeStyle = tattooC;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.2);
        ctx.lineTo(x - r * 0.3, y + r * 0.1);
        ctx.lineTo(x - r * 0.1, y + r * 0.2);
        ctx.lineTo(x - r * 0.2, y + r * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.2, y - r * 0.2);
        ctx.lineTo(x + r * 0.3, y + r * 0.1);
        ctx.lineTo(x + r * 0.1, y + r * 0.2);
        ctx.lineTo(x + r * 0.2, y + r * 0.4);
        ctx.stroke();

        // 怒目
        ctx.fillStyle = eyeC;
        ctx.beginPath();
        ctx.arc(x - r * 0.13, y - r * 0.5, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.13, y - r * 0.5, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.13, y - r * 0.5, r * 0.02, 0, Math.PI * 2);
        ctx.arc(x + r * 0.13, y - r * 0.5, r * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // 雷电光环（动画）
        var t = Date.now() / 200;
        for (var k = 0; k < 4; k++) {
            var lx = x + Math.cos(t + k * 1.57) * r * 0.95;
            var ly = y + Math.sin(t + k * 1.57) * r * 0.95;
            ctx.fillStyle = tattooC;
            ctx.beginPath();
            ctx.arc(lx, ly, r * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 暗影领主：黑暗之王 + 暗影王冠 + 紫黑披风
    drawShadowLord: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var cloakC = elite ? '#000' : '#1a0033';
        var innerC = elite ? '#7b1fa2' : '#4a148c';
        var skinC = '#ce93d8';
        var crownC = '#311b92';
        var gemC = '#ff1744';

        // 暗影背景圈
        var t = Date.now() / 500;
        ctx.fillStyle = '#4a148c33';
        ctx.beginPath();
        ctx.arc(x, y, r * 1.0, 0, Math.PI * 2);
        ctx.fill();

        // 巨大披风
        ctx.fillStyle = cloakC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.3);
        ctx.lineTo(x - r * 1.0, y + r * 0.1);
        ctx.lineTo(x - r * 0.85, y + r * 0.85);
        ctx.lineTo(x, y + r * 0.7);
        ctx.lineTo(x + r * 0.85, y + r * 0.85);
        ctx.lineTo(x + r * 1.0, y + r * 0.1);
        ctx.lineTo(x + r * 0.35, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
        // 披风内衬
        ctx.fillStyle = innerC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.25);
        ctx.lineTo(x - r * 0.6, y + r * 0.7);
        ctx.lineTo(x, y + r * 0.6);
        ctx.lineTo(x + r * 0.6, y + r * 0.7);
        ctx.lineTo(x + r * 0.25, y - r * 0.25);
        ctx.closePath();
        ctx.fill();

        // 紫黑铠甲
        ctx.fillStyle = '#311b92';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.45, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 胸甲金边
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.1, r * 0.45, Math.PI * 0.7, Math.PI * 1.3);
        ctx.stroke();

        // 幽灵头
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.4, r * 0.32, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // 暗影王冠
        ctx.fillStyle = crownC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.6);
        ctx.lineTo(x - r * 0.35, y - r * 0.85);
        ctx.lineTo(x - r * 0.2, y - r * 0.7);
        ctx.lineTo(x - r * 0.1, y - r * 0.95);
        ctx.lineTo(x, y - r * 0.7);
        ctx.lineTo(x + r * 0.1, y - r * 0.95);
        ctx.lineTo(x + r * 0.2, y - r * 0.7);
        ctx.lineTo(x + r * 0.35, y - r * 0.85);
        ctx.lineTo(x + r * 0.35, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        // 王冠宝石
        ctx.fillStyle = gemC;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.78, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 暗影之眼（发光）
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.4, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.4, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 魔嘴
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.25, r * 0.08, r * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();

        // 暗影触手（背景）
        for (var i = 0; i < 5; i++) {
            var a = t * 0.3 + i * Math.PI * 2 / 5;
            ctx.strokeStyle = '#4a148c88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
            ctx.lineTo(x + Math.cos(a + 0.5) * r * 1.1, y + Math.sin(a + 0.5) * r * 1.1);
            ctx.stroke();
        }
    },

    // 九头蛇：多首巨蛇
    drawHydra: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var bodyC = elite ? '#2e7d32' : '#1b5e20';
        var scaleC = elite ? '#558b2f' : '#33691e';
        var headC = '#388e3c';
        var eyeC = '#ffeb3b';

        // 主体（粗壮蛇身）
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.25, r * 0.75, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        // 鳞片
        ctx.fillStyle = scaleC;
        for (var i = 0; i < 16; i++) {
            var a = i * Math.PI * 2 / 16;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(a) * r * 0.55, y + r * 0.25 + Math.sin(a) * r * 0.4, r * 0.06, r * 0.08, a, 0, Math.PI * 2);
            ctx.fill();
        }

        // 9个蛇头
        var t = Date.now() / 600;
        var headAngles = [
            -1.4, -1.0, -0.6, -0.3, 0, 0.3, 0.6, 1.0, 1.4
        ];
        for (var k = 0; k < 9; k++) {
            var baseAngle = headAngles[k];
            var wiggle = Math.sin(t + k) * 0.15;
            var hx = x + Math.cos(baseAngle + wiggle) * r * 0.85;
            var hy = y - r * 0.1 + Math.sin(baseAngle + wiggle) * r * 0.7;
            // 颈
            ctx.strokeStyle = bodyC;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(baseAngle) * r * 0.45, y + r * 0.1 + Math.sin(baseAngle) * r * 0.4);
            ctx.quadraticCurveTo(x + Math.cos(baseAngle) * r * 0.65, y + Math.sin(baseAngle) * r * 0.55, hx, hy);
            ctx.stroke();
            // 头
            ctx.fillStyle = headC;
            ctx.beginPath();
            ctx.ellipse(hx, hy, r * 0.13, r * 0.1, baseAngle, 0, Math.PI * 2);
            ctx.fill();
            // 眼
            ctx.fillStyle = eyeC;
            ctx.beginPath();
            ctx.arc(hx + Math.cos(baseAngle - 0.5) * r * 0.05, hy + Math.sin(baseAngle - 0.5) * r * 0.05, r * 0.025, 0, Math.PI * 2);
            ctx.arc(hx + Math.cos(baseAngle + 0.5) * r * 0.05, hy + Math.sin(baseAngle + 0.5) * r * 0.05, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
            // 嘴
            ctx.fillStyle = '#d50000';
            ctx.beginPath();
            ctx.moveTo(hx - r * 0.04, hy);
            ctx.lineTo(hx + r * 0.04, hy);
            ctx.lineTo(hx, hy + r * 0.04);
            ctx.closePath();
            ctx.fill();
        }
    },

    // 虚空吞噬者：虚空巨口 + 中心魔眼
    drawVoidDevourer: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var voidC = elite ? '#311b92' : '#1a0033';
        var ringC = elite ? '#7b1fa2' : '#4a148c';
        var eyeC = elite ? '#ff1744' : '#00e5ff';

        var t = Date.now() / 400;

        // 外圈虚空扭曲
        for (var i = 0; i < 3; i++) {
            var radius = r * (0.95 + i * 0.1) + Math.sin(t + i) * r * 0.05;
            ctx.strokeStyle = ringC;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 主体（圆盘状）
        ctx.fillStyle = voidC;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.9, r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();

        // 须状触手
        for (var j = 0; j < 12; j++) {
            var angle = (j * Math.PI * 2 / 12) + Math.sin(t + j) * 0.1;
            var tipWiggle = Math.sin(t * 2 + j * 0.7) * r * 0.15;
            ctx.strokeStyle = ringC;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * r * 0.7, y + Math.sin(angle) * r * 0.65);
            ctx.quadraticCurveTo(
                x + Math.cos(angle) * r * 0.95 + tipWiggle,
                y + Math.sin(angle) * r * 0.95 + tipWiggle,
                x + Math.cos(angle) * r * 1.05 + tipWiggle,
                y + Math.sin(angle) * r * 1.05 + tipWiggle
            );
            ctx.stroke();
        }

        // 中心魔眼
        var eyePulse = 0.8 + Math.sin(t * 2) * 0.2;
        ctx.fillStyle = eyeC;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.3 * eyePulse, 0, Math.PI * 2);
        ctx.fill();
        // 黑瞳
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.12 * eyePulse, r * 0.25 * eyePulse, 0, 0, Math.PI * 2);
        ctx.fill();
        // 高光
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.1, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
    },

    // 天使统帅：六翼天神 + 金色铠甲 + 圣光
    drawArchangel: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var armorC = elite ? '#ffd700' : '#ffc107';
        var wingC = '#fff';
        var wingEdge = '#e0e0e0';
        var haloC = '#ffeb3b';
        var clothC = '#1976d2';

        // 圣光背景
        var t = Date.now() / 500;
        ctx.fillStyle = '#ffeb3b22';
        ctx.beginPath();
        ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
        ctx.fill();

        // 6只翅膀（2大2中2小）
        // 大翅膀（后层）
        var wingFlap = Math.sin(t) * r * 0.1;
        ctx.fillStyle = wingC;
        ctx.strokeStyle = wingEdge;
        ctx.lineWidth = 1;
        // 左大翅
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.3);
        ctx.quadraticCurveTo(x - r * 1.0, y - r * 0.7 - wingFlap, x - r * 0.9, y + r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.1, x - r * 0.2, y - r * 0.3);
        ctx.fill();
        // 右大翅
        ctx.beginPath();
        ctx.moveTo(x + r * 0.2, y - r * 0.3);
        ctx.quadraticCurveTo(x + r * 1.0, y - r * 0.7 - wingFlap, x + r * 0.9, y + r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.1, x + r * 0.2, y - r * 0.3);
        ctx.fill();
        // 中翅
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.15);
        ctx.quadraticCurveTo(x - r * 0.6, y - r * 0.4 - wingFlap, x - r * 0.5, y + r * 0.15);
        ctx.quadraticCurveTo(x - r * 0.3, y + r * 0.05, x - r * 0.15, y - r * 0.15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.15);
        ctx.quadraticCurveTo(x + r * 0.6, y - r * 0.4 - wingFlap, x + r * 0.5, y + r * 0.15);
        ctx.quadraticCurveTo(x + r * 0.3, y + r * 0.05, x + r * 0.15, y - r * 0.15);
        ctx.fill();
        // 小翅
        ctx.beginPath();
        ctx.moveTo(x - r * 0.1, y);
        ctx.quadraticCurveTo(x - r * 0.3, y - r * 0.15, x - r * 0.25, y + r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.15, y + r * 0.05, x - r * 0.1, y);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.1, y);
        ctx.quadraticCurveTo(x + r * 0.3, y - r * 0.15, x + r * 0.25, y + r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.15, y + r * 0.05, x + r * 0.1, y);
        ctx.fill();
        // 羽骨
        ctx.strokeStyle = wingEdge;
        ctx.lineWidth = 1;
        for (var w = 0; w < 2; w++) {
            var side = w === 0 ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(x + side * r * 0.2, y - r * 0.3);
            ctx.lineTo(x + side * r * 0.9, y + r * 0.1);
            ctx.stroke();
        }

        // 金色身体
        ctx.fillStyle = armorC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 0.4, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 护胸纹章
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.05);
        ctx.lineTo(x - r * 0.08, y + r * 0.1);
        ctx.lineTo(x + r * 0.08, y + r * 0.1);
        ctx.closePath();
        ctx.fill();
        // 蓝色披风
        ctx.fillStyle = clothC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y);
        ctx.lineTo(x - r * 0.5, y + r * 0.7);
        ctx.lineTo(x, y + r * 0.55);
        ctx.lineTo(x + r * 0.5, y + r * 0.7);
        ctx.lineTo(x + r * 0.35, y);
        ctx.closePath();
        ctx.fill();

        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.45, r * 0.28, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 金发
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.32, r * 0.18, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - r * 0.32, y - r * 0.5, r * 0.05, r * 0.25);
        ctx.fillRect(x + r * 0.27, y - r * 0.5, r * 0.05, r * 0.25);
        // 圣光之眼
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.45, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.45, r * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // 头顶光环
        ctx.strokeStyle = haloC;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.85, r * 0.3, r * 0.06, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = haloC + '88';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.85, r * 0.38, r * 0.09, 0, 0, Math.PI * 2);
        ctx.stroke();
    },

    // 混沌之源：混乱多色实体
    drawChaosOrigin: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var t = Date.now() / 200;
        var colors = ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#00b0ff', '#7c4dff', '#f50057'];

        // 混沌光环（多层旋转）
        for (var i = 0; i < 5; i++) {
            var a = t * (0.5 + i * 0.2) * (i % 2 === 0 ? 1 : -1);
            ctx.fillStyle = colors[i % colors.length] + '44';
            ctx.beginPath();
            ctx.ellipse(x, y, r * 0.85, r * (0.2 + i * 0.05), a, 0, Math.PI * 2);
            ctx.fill();
        }

        // 混沌核心（多色球）
        var gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 0.55);
        gradient.addColorStop(0, colors[Math.floor(t) % colors.length]);
        gradient.addColorStop(0.5, colors[Math.floor(t + 1) % colors.length]);
        gradient.addColorStop(1, colors[Math.floor(t + 2) % colors.length]);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // 混沌触手（随机）
        for (var k = 0; k < 8; k++) {
            var ang = t * 0.5 + k * Math.PI * 2 / 8;
            var len = r * 0.6 + Math.sin(t * 3 + k) * r * 0.2;
            ctx.strokeStyle = colors[(k + 2) % colors.length] + 'aa';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(
                x + Math.cos(ang + 0.3) * len * 0.5,
                y + Math.sin(ang + 0.3) * len * 0.5,
                x + Math.cos(ang) * len,
                y + Math.sin(ang) * len
            );
            ctx.stroke();
        }

        // 中心眼
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // 混沌粒子
        for (var m = 0; m < 10; m++) {
            var px = x + Math.cos(t * 2 + m * 0.7) * r * 0.9;
            var py = y + Math.sin(t * 2 + m * 0.7) * r * 0.9;
            ctx.fillStyle = colors[m % colors.length];
            ctx.beginPath();
            ctx.arc(px, py, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 深渊之主：触手邪神 + 深渊眼
    drawAbyssGod: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var skinC = elite ? '#311b92' : '#1a0033';
        var tentacleC = elite ? '#4a148c' : '#311b92';
        var eyeC = elite ? '#ff1744' : '#00e5ff';
        var pupilC = '#000';

        var t = Date.now() / 500;

        // 巨大触手
        for (var i = 0; i < 10; i++) {
            var baseAngle = i * Math.PI * 2 / 10;
            var wave = Math.sin(t + i * 0.7) * 0.4;
            ctx.strokeStyle = tentacleC;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(
                x + Math.cos(baseAngle + wave) * r * 0.7,
                y + Math.sin(baseAngle + wave) * r * 0.7,
                x + Math.cos(baseAngle + wave * 1.5) * r * 1.1,
                y + Math.sin(baseAngle + wave * 1.5) * r * 1.1
            );
            ctx.stroke();
            // 触手吸盘
            ctx.fillStyle = '#7b1fa2';
            ctx.beginPath();
            ctx.arc(x + Math.cos(baseAngle + wave * 1.5) * r * 1.1, y + Math.sin(baseAngle + wave * 1.5) * r * 1.1, r * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }

        // 主体（眼状核心）
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.6, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 巨大魔眼
        var eyePulse = 0.7 + Math.sin(t * 1.5) * 0.15;
        // 眼白
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.35 * eyePulse, r * 0.25 * eyePulse, 0, 0, Math.PI * 2);
        ctx.fill();
        // 虹膜
        ctx.fillStyle = eyeC;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.2 * eyePulse, 0, Math.PI * 2);
        ctx.fill();
        // 黑瞳
        ctx.fillStyle = pupilC;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.07 * eyePulse, r * 0.12 * eyePulse, 0, 0, Math.PI * 2);
        ctx.fill();
        // 高光
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.05, y - r * 0.05, r * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // 触手芒刺
        for (var k = 0; k < 6; k++) {
            var a = t * 0.3 + k * Math.PI * 2 / 6;
            ctx.fillStyle = '#9c27b0';
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5);
            ctx.lineTo(x + Math.cos(a + 0.2) * r * 0.75, y + Math.sin(a + 0.2) * r * 0.75);
            ctx.lineTo(x + Math.cos(a - 0.2) * r * 0.75, y + Math.sin(a - 0.2) * r * 0.75);
            ctx.closePath();
            ctx.fill();
        }
    },

    // 冰霜巨人：冰晶覆盖巨人
    drawFrostGiant: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var skinC = elite ? '#b3e5fc' : '#81d4fa';
        var iceC = '#e1f5fe';
        var iceEdge = '#0277bd';
        var crystalC = '#00bcd4';

        // 巨身
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.7, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        // 巨臂
        ctx.beginPath();
        ctx.ellipse(x - r * 0.75, y + r * 0.1, r * 0.18, r * 0.35, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.75, y + r * 0.1, r * 0.18, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // 巨拳
        ctx.beginPath();
        ctx.arc(x - r * 0.85, y + r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.arc(x + r * 0.85, y + r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // 巨腿
        ctx.beginPath();
        ctx.ellipse(x - r * 0.25, y + r * 0.85, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.25, y + r * 0.85, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 冰晶覆盖
        for (var i = 0; i < 6; i++) {
            var a = i * Math.PI * 2 / 6;
            var cx = x + Math.cos(a) * r * 0.55;
            var cy = y + r * 0.1 + Math.sin(a) * r * 0.5;
            ctx.fillStyle = iceC;
            ctx.beginPath();
            ctx.moveTo(cx, cy - r * 0.1);
            ctx.lineTo(cx + r * 0.08, cy);
            ctx.lineTo(cx, cy + r * 0.1);
            ctx.lineTo(cx - r * 0.08, cy);
            ctx.closePath();
            ctx.fill();
        }
        // 冰晶装饰
        ctx.fillStyle = crystalC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.05, y - r * 0.1);
        ctx.lineTo(x + r * 0.05, y - r * 0.1);
        ctx.lineTo(x, y + r * 0.05);
        ctx.closePath();
        ctx.fill();

        // 巨头
        ctx.fillStyle = skinC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.5, r * 0.4, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 冰晶头冠
        ctx.fillStyle = iceC;
        for (var j = 0; j < 5; j++) {
            var cx2 = x - r * 0.3 + j * r * 0.15;
            var ch = r * (0.1 + (j === 2 ? 0.08 : 0));
            ctx.beginPath();
            ctx.moveTo(cx2, y - r * 0.7);
            ctx.lineTo(cx2 + r * 0.04, y - r * 0.7 - ch);
            ctx.lineTo(cx2 + r * 0.08, y - r * 0.7);
            ctx.closePath();
            ctx.fill();
        }
        // 冰霜之眼
        ctx.fillStyle = iceEdge;
        ctx.beginPath();
        ctx.arc(x - r * 0.13, y - r * 0.5, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.13, y - r * 0.5, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 冰霜之嘴
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.3, r * 0.1, r * 0.03, 0, 0, Math.PI);
        ctx.fill();
        // 冰雾
        ctx.fillStyle = '#e1f5fe44';
        for (var k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.arc(x + (k - 1.5) * r * 0.3, y - r * 0.2, r * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        // 霜雪飘落
        var t = Date.now() / 200;
        ctx.fillStyle = '#fff';
        for (var m = 0; m < 5; m++) {
            var sx = x + Math.sin(t + m) * r * 0.8;
            var sy = y + r * 0.4 + Math.cos(t + m) * r * 0.1;
            ctx.beginPath();
            ctx.arc(sx, sy, r * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 地狱犬：三头地狱犬
    drawHellHound: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var furC = elite ? '#212121' : '#000';
        var furEdge = '#3e2723';
        var eyeC = '#ff6f00';
        var flameC = elite ? '#ff6f00' : '#bf360c';
        var flameEdge = '#ffeb3b';

        // 身体
        ctx.fillStyle = furC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 0.7, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 腿
        for (var i = 0; i < 4; i++) {
            var lx = x - r * 0.45 + (i % 2) * r * 0.9;
            var ly = y + (i < 2 ? r * 0.3 : r * 0.45);
            ctx.fillStyle = furC;
            ctx.fillRect(lx - r * 0.05, ly, r * 0.1, r * 0.2);
        }
        // 长尾
        ctx.strokeStyle = furC;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.7, y + r * 0.15);
        ctx.quadraticCurveTo(x + r * 0.95, y - r * 0.1, x + r * 0.85, y - r * 0.4);
        ctx.stroke();

        // 三个头
        var t = Date.now() / 400;
        var headPositions = [
            { x: -0.45, y: -0.2, scale: 0.7 },
            { x: 0, y: -0.3, scale: 0.85 },
            { x: 0.45, y: -0.2, scale: 0.7 }
        ];
        for (var k = 0; k < 3; k++) {
            var hp = headPositions[k];
            var wiggle = Math.sin(t + k * 1.2) * 0.05;
            var hx = x + (hp.x + wiggle) * r;
            var hy = y + hp.y * r;
            var scaleR = r * hp.scale;
            // 颈
            ctx.fillStyle = furC;
            ctx.beginPath();
            ctx.moveTo(x + hp.x * r * 0.6, y + r * 0.1);
            ctx.lineTo(x + hp.x * r * 0.3, y);
            ctx.lineTo(hx, hy + scaleR * 0.2);
            ctx.lineTo(hx + scaleR * 0.2, hy + scaleR * 0.3);
            ctx.closePath();
            ctx.fill();
            // 头
            ctx.beginPath();
            ctx.ellipse(hx, hy, scaleR * 0.4, scaleR * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            // 尖耳
            ctx.fillStyle = furEdge;
            ctx.beginPath();
            ctx.moveTo(hx - scaleR * 0.25, hy - scaleR * 0.2);
            ctx.lineTo(hx - scaleR * 0.4, hy - scaleR * 0.5);
            ctx.lineTo(hx - scaleR * 0.1, hy - scaleR * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(hx + scaleR * 0.25, hy - scaleR * 0.2);
            ctx.lineTo(hx + scaleR * 0.4, hy - scaleR * 0.5);
            ctx.lineTo(hx + scaleR * 0.1, hy - scaleR * 0.3);
            ctx.closePath();
            ctx.fill();
            // 燃烧之眼
            ctx.fillStyle = eyeC;
            ctx.beginPath();
            ctx.arc(hx - scaleR * 0.12, hy - scaleR * 0.05, scaleR * 0.06, 0, Math.PI * 2);
            ctx.arc(hx + scaleR * 0.12, hy - scaleR * 0.05, scaleR * 0.06, 0, Math.PI * 2);
            ctx.fill();
            // 牙
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(hx - scaleR * 0.1, hy + scaleR * 0.15);
            ctx.lineTo(hx - scaleR * 0.05, hy + scaleR * 0.3);
            ctx.lineTo(hx, hy + scaleR * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(hx, hy + scaleR * 0.15);
            ctx.lineTo(hx + scaleR * 0.05, hy + scaleR * 0.3);
            ctx.lineTo(hx + scaleR * 0.1, hy + scaleR * 0.15);
            ctx.closePath();
            ctx.fill();
            // 嘴中火焰
            ctx.fillStyle = flameC;
            ctx.beginPath();
            ctx.ellipse(hx, hy + scaleR * 0.18, scaleR * 0.08, scaleR * 0.04, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 脚下火焰
        for (var j = 0; j < 6; j++) {
            var fx = x - r * 0.4 + (j % 3) * r * 0.4;
            var fy = y + r * 0.5 + Math.sin(t + j) * r * 0.05;
            ctx.fillStyle = flameC + '88';
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.quadraticCurveTo(fx - r * 0.06, fy - r * 0.1, fx, fy - r * 0.15);
            ctx.quadraticCurveTo(fx + r * 0.06, fy - r * 0.1, fx, fy);
            ctx.fill();
        }
    },

    // 山岭巨人：山岩覆盖巨人
    drawStoneGiant: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var stoneC = elite ? '#757575' : '#616161';
        var stoneEdge = '#424242';
        var mossC = '#558b2f';
        var crystalC = '#ffeb3b';

        // 巨身
        ctx.fillStyle = stoneC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.75, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        // 不规则边缘
        for (var i = 0; i < 8; i++) {
            var a = i * Math.PI * 2 / 8;
            ctx.fillStyle = stoneC;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * r * 0.7, y + r * 0.1 + Math.sin(a) * r * 0.65);
            ctx.lineTo(x + Math.cos(a + 0.1) * r * 0.85, y + r * 0.1 + Math.sin(a + 0.1) * r * 0.8);
            ctx.lineTo(x + Math.cos(a - 0.1) * r * 0.85, y + r * 0.1 + Math.sin(a - 0.1) * r * 0.8);
            ctx.closePath();
            ctx.fill();
        }

        // 巨臂
        ctx.fillStyle = stoneC;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.8, y + r * 0.05, r * 0.2, r * 0.4, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.8, y + r * 0.05, r * 0.2, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 巨拳
        ctx.beginPath();
        ctx.arc(x - r * 0.95, y + r * 0.2, r * 0.18, 0, Math.PI * 2);
        ctx.arc(x + r * 0.95, y + r * 0.2, r * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // 巨腿
        ctx.beginPath();
        ctx.ellipse(x - r * 0.3, y + r * 0.9, r * 0.2, r * 0.3, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.3, y + r * 0.9, r * 0.2, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 巨头
        ctx.fillStyle = stoneC;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.5, r * 0.45, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头顶尖石
        ctx.fillStyle = stoneC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.1, y - r * 0.85);
        ctx.lineTo(x, y - r * 1.05);
        ctx.lineTo(x + r * 0.1, y - r * 0.85);
        ctx.closePath();
        ctx.fill();
        // 苔藓
        ctx.fillStyle = mossC;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.25, y - r * 0.75, r * 0.08, r * 0.04, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.2, y - r * 0.7, r * 0.06, r * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();
        // 岩石眼
        ctx.fillStyle = crystalC;
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.5, r * 0.06, 0, Math.PI * 2);
        ctx.arc(x + r * 0.15, y - r * 0.5, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.5, r * 0.02, 0, Math.PI * 2);
        ctx.arc(x + r * 0.15, y - r * 0.5, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        // 嘴（岩石裂缝）
        ctx.fillStyle = stoneEdge;
        ctx.fillRect(x - r * 0.15, y - r * 0.28, r * 0.3, r * 0.04);
        // 裂缝
        ctx.strokeStyle = stoneEdge;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.3);
        ctx.lineTo(x - r * 0.1, y - r * 0.1);
        ctx.lineTo(x + r * 0.1, y + r * 0.1);
        ctx.lineTo(x + r * 0.3, y + r * 0.3);
        ctx.stroke();
    },

    // 永恒之龙：宇宙级传奇巨龙
    drawEternalDragon: function(ctx, x, y, r, color, elite) {
        var s = r / 18;
        var t = Date.now() / 400;
        var bodyC = '#1a0033';
        var starC = '#fff';
        var nebulaC1 = '#7b1fa2';
        var nebulaC2 = '#1976d2';
        var nebulaC3 = '#ff1744';
        var goldC = '#ffd700';

        // 宇宙星云背景
        var grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.1);
        grad.addColorStop(0, '#1a003388');
        grad.addColorStop(0.5, '#311b9244');
        grad.addColorStop(1, '#00000000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // 星云
        ctx.fillStyle = nebulaC1 + '44';
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(t * 0.3) * r * 0.5, y + Math.sin(t * 0.3) * r * 0.3, r * 0.7, r * 0.4, t * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = nebulaC2 + '44';
        ctx.beginPath();
        ctx.ellipse(x - Math.cos(t * 0.4) * r * 0.4, y + Math.sin(t * 0.4) * r * 0.4, r * 0.6, r * 0.35, -t * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = nebulaC3 + '44';
        ctx.beginPath();
        ctx.ellipse(x + Math.sin(t * 0.5) * r * 0.3, y - Math.cos(t * 0.5) * r * 0.5, r * 0.5, r * 0.3, t * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // 巨大翅膀
        var wingFlap = Math.sin(t) * r * 0.12;
        var wingC = '#311b92';
        // 左大翅
        ctx.fillStyle = wingC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.2);
        ctx.quadraticCurveTo(x - r * 1.3, y - r * 0.6 + wingFlap, x - r * 1.0, y + r * 0.4);
        ctx.quadraticCurveTo(x - r * 0.6, y + r * 0.1, x - r * 0.3, y - r * 0.2);
        ctx.fill();
        // 右大翅
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.2);
        ctx.quadraticCurveTo(x + r * 1.3, y - r * 0.6 + wingFlap, x + r * 1.0, y + r * 0.4);
        ctx.quadraticCurveTo(x + r * 0.6, y + r * 0.1, x + r * 0.3, y - r * 0.2);
        ctx.fill();
        // 翼骨
        ctx.strokeStyle = '#1a0033';
        ctx.lineWidth = 2;
        for (var w = 0; w < 2; w++) {
            var side = w === 0 ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(x + side * r * 0.3, y - r * 0.2);
            ctx.lineTo(x + side * r * 1.0, y + r * 0.4);
            ctx.stroke();
        }
        // 翼上星辰
        for (var s2 = 0; s2 < 4; s2++) {
            ctx.fillStyle = starC;
            ctx.beginPath();
            ctx.arc(x - r * (0.4 + s2 * 0.15), y - r * (0.05 - s2 * 0.05) + wingFlap * 0.5, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + r * (0.4 + s2 * 0.15), y - r * (0.05 - s2 * 0.05) + wingFlap * 0.5, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }

        // 身体
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.05, r * 0.55, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 金鳞
        ctx.fillStyle = goldC;
        for (var s3 = 0; s3 < 6; s3++) {
            var a3 = s3 * Math.PI * 2 / 6;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(a3) * r * 0.4, y + r * 0.05 + Math.sin(a3) * r * 0.45, r * 0.05, r * 0.07, a3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 长颈
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.3);
        ctx.quadraticCurveTo(x - r * 0.05, y - r * 0.7, x + r * 0.1, y - r * 0.8);
        ctx.quadraticCurveTo(x + r * 0.3, y - r * 0.6, x + r * 0.3, y - r * 0.3);
        ctx.closePath();
        ctx.fill();

        // 龙头
        ctx.fillStyle = bodyC;
        ctx.beginPath();
        ctx.ellipse(x + r * 0.2, y - r * 0.85, r * 0.3, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // 龙角（弯月）
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.05, y - r * 1.0);
        ctx.quadraticCurveTo(x - r * 0.05, y - r * 1.2, x + r * 0.0, y - r * 1.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.35, y - r * 1.0);
        ctx.quadraticCurveTo(x + r * 0.45, y - r * 1.2, x + r * 0.4, y - r * 1.1);
        ctx.stroke();
        // 龙头金须
        ctx.strokeStyle = goldC;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.1, y - r * 0.7);
        ctx.quadraticCurveTo(x - r * 0.1, y - r * 0.6, x - r * 0.05, y - r * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.7);
        ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.6, x + r * 0.45, y - r * 0.5);
        ctx.stroke();
        // 宇宙之眼
        ctx.fillStyle = starC;
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.85, r * 0.06, 0, Math.PI * 2);
        ctx.arc(x + r * 0.3, y - r * 0.85, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = nebulaC1;
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.85, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.3, y - r * 0.85, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 鼻息
        ctx.fillStyle = nebulaC2 + '88';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.55, y - r * 0.8, r * 0.08, r * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        // 长尾
        ctx.strokeStyle = bodyC;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.4, y + r * 0.4);
        ctx.quadraticCurveTo(x - r * 0.8, y + r * 0.7, x - r * 0.5, y + r * 0.95);
        ctx.stroke();
        // 尾尖
        ctx.fillStyle = goldC;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y + r * 0.95);
        ctx.lineTo(x - r * 0.55, y + r * 1.1);
        ctx.lineTo(x - r * 0.45, y + r * 1.1);
        ctx.closePath();
        ctx.fill();

        // 绕体星辰
        for (var k = 0; k < 8; k++) {
            var sa = t * 0.5 + k * Math.PI * 2 / 8;
            var sx = x + Math.cos(sa) * r * 0.95;
            var sy = y + Math.sin(sa) * r * 0.95;
            ctx.fillStyle = starC;
            ctx.beginPath();
            ctx.arc(sx, sy, r * 0.03, 0, Math.PI * 2);
            ctx.fill();
            // 光芒
            ctx.strokeStyle = starC + '66';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(sx - r * 0.06, sy);
            ctx.lineTo(sx + r * 0.06, sy);
            ctx.moveTo(sx, sy - r * 0.06);
            ctx.lineTo(sx, sy + r * 0.06);
            ctx.stroke();
        }
    },

    // 通用怪物
    drawGenericMonster: function(ctx, x, y, r, color, elite) {
        ctx.fillStyle = elite ? '#ef5350' : '#e53935';
        ctx.beginPath();
        ctx.ellipse(x, y - 2, r * 0.55, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 眼睛
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x - r * 0.12, y - r * 0.1, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.12, y - r * 0.1, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.08, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.14, y - r * 0.08, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
    },

    // 工具：五角星（多伴生使用）
    drawStar: function(ctx, cx, cy, r) {
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
            var angle = -Math.PI / 2 + i * Math.PI * 2 / 5;
            var innerAngle = angle + Math.PI / 5;
            var ox = cx + Math.cos(angle) * r;
            var oy = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
            var ix = cx + Math.cos(innerAngle) * r * 0.4;
            var iy = cy + Math.sin(innerAngle) * r * 0.4;
            ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fill();
    },

    // 白菊：白色菊花
    drawFriendWhiteChrys: function(ctx, x, y, r, color) {
        // 白色花瓣层
        function drawPetalLayer(count, radius, length, width, fillC) {
            ctx.fillStyle = fillC;
            for (var i = 0; i < count; i++) {
                var a = i * Math.PI * 2 / count;
                ctx.beginPath();
                ctx.ellipse(x + Math.cos(a) * radius, y + Math.sin(a) * radius, length, width, a, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        drawPetalLayer(16, r * 0.32, r * 0.38, r * 0.08, '#fff');
        drawPetalLayer(12, r * 0.22, r * 0.28, r * 0.06, '#f5f5f5');
        // 黄花心
        ctx.fillStyle = '#fdd835';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
        // 茎
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + r * 0.3);
        ctx.lineTo(x + r * 0.1, y + r * 0.9);
        ctx.stroke();
    },

    // 幸运蛋：金蛋 + 四叶草
    drawFriendEgg: function(ctx, x, y, r, color) {
        // 光环背景
        var t = Date.now() / 400;
        ctx.fillStyle = 'rgba(255,215,0,0.15)';
        for (var i = 0; i < 8; i++) {
            var a = t + i * Math.PI * 2 / 8;
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }
        // 蛋身
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.5, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        // 蛋高光
        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.15, y - r * 0.2, r * 0.12, r * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 装饰带
        ctx.strokeStyle = '#bf360c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y + r * 0.05);
        ctx.lineTo(x + r * 0.5, y + r * 0.05);
        ctx.stroke();
        // 顶端四叶草
        ctx.fillStyle = '#43a047';
        for (var li = 0; li < 4; li++) {
            var la = li * Math.PI / 2;
            ctx.beginPath();
            ctx.arc(x + Math.cos(la) * r * 0.1, y - r * 0.7 + Math.sin(la) * r * 0.1, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.7, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
    },

    // 枫原万叶：枫叶武士
    drawFriendKaedehara: function(ctx, x, y, r, color) {
        // 武士身体
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 0.45, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 红色和服
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.4, y - r * 0.1);
        ctx.lineTo(x - r * 0.55, y + r * 0.6);
        ctx.lineTo(x + r * 0.55, y + r * 0.6);
        ctx.lineTo(x + r * 0.4, y - r * 0.1);
        ctx.closePath();
        ctx.fill();
        // 腰带
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x - r * 0.45, y + r * 0.2, r * 0.9, r * 0.1);
        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.4, r * 0.3, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 绿发
        ctx.fillStyle = '#388e3c';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.32, r * 0.2, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - r * 0.32, y - r * 0.5, r * 0.05, r * 0.25);
        ctx.fillRect(x + r * 0.27, y - r * 0.5, r * 0.05, r * 0.25);
        // 眼
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 枫叶佩饰
        ctx.fillStyle = '#d32f2f';
        ctx.save();
        ctx.translate(x - r * 0.5, y + r * 0.05);
        for (var fi = 0; fi < 5; fi++) {
            var fa = fi * Math.PI * 2 / 5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(fa) * r * 0.12, Math.sin(fa) * r * 0.12);
            ctx.lineTo(Math.cos(fa + 0.3) * r * 0.06, Math.sin(fa + 0.3) * r * 0.06);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        // 武士刀
        ctx.save();
        ctx.translate(x + r * 0.5, y - r * 0.1);
        ctx.rotate(0.5);
        ctx.fillStyle = '#bdbdbd';
        ctx.fillRect(0, 0, r * 0.05, r * 0.5);
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(-r * 0.02, r * 0.45, r * 0.09, r * 0.08);
        ctx.restore();
    },

    // 幸运风见：风神
    drawFriendWind: function(ctx, x, y, r, color) {
        // 风圈（背景动画）
        var t = Date.now() / 300;
        for (var i = 0; i < 3; i++) {
            var a = t * 0.5 + i * 2.1;
            ctx.strokeStyle = 'rgba(179,229,252,' + (0.5 - i * 0.15) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (var j = 0; j < 20; j++) {
                var sa = a + j * 0.3;
                var sr = r * (0.3 + j * 0.04);
                if (j === 0) ctx.moveTo(x + Math.cos(sa) * sr, y + Math.sin(sa) * sr);
                else ctx.lineTo(x + Math.cos(sa) * sr, y + Math.sin(sa) * sr);
            }
            ctx.stroke();
        }
        // 风核心
        ctx.fillStyle = '#b3e5fc';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // 风眼
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0277bd';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        // 飘散叶片
        ctx.fillStyle = '#43a047';
        for (var k = 0; k < 5; k++) {
            var la = t + k * 1.2;
            ctx.save();
            ctx.translate(x + Math.cos(la) * r * 0.85, y + Math.sin(la) * r * 0.85);
            ctx.rotate(la * 3);
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.04, r * 0.025, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    // 幸运魔角：魔法双角
    drawFriendMagicHorn: function(ctx, x, y, r, color) {
        // 光晕背景
        ctx.fillStyle = 'rgba(124,77,255,0.2)';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        // 主体球
        ctx.fillStyle = '#7c4dff';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.1, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // 角（左）
        ctx.fillStyle = '#e1bee7';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.3);
        ctx.quadraticCurveTo(x - r * 0.55, y - r * 0.95, x - r * 0.15, y - r * 0.85);
        ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.55, x - r * 0.25, y - r * 0.3);
        ctx.fill();
        // 角（右）
        ctx.beginPath();
        ctx.moveTo(x + r * 0.25, y - r * 0.3);
        ctx.quadraticCurveTo(x + r * 0.55, y - r * 0.95, x + r * 0.15, y - r * 0.85);
        ctx.quadraticCurveTo(x + r * 0.2, y - r * 0.55, x + r * 0.25, y - r * 0.3);
        ctx.fill();
        // 角环
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        for (var i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x - r * 0.32, y - r * (0.4 + i * 0.12), r * 0.03, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + r * 0.32, y - r * (0.4 + i * 0.12), r * 0.03, 0, Math.PI * 2);
            ctx.stroke();
        }
        // 魔眼
        var t = Date.now() / 300;
        var pulse = 0.5 + Math.sin(t) * 0.2;
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.1, r * 0.18 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.1, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
    },

    // 幸运鹿角：魔法鹿
    drawFriendDeer: function(ctx, x, y, r, color) {
        // 身体
        ctx.fillStyle = '#a1887f';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.2, r * 0.55, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 腿
        for (var i = 0; i < 4; i++) {
            var lx = x - r * 0.35 + (i % 2) * r * 0.7;
            var ly = y + r * 0.5 + Math.floor(i / 2) * r * 0.1;
            ctx.fillStyle = '#a1887f';
            ctx.fillRect(lx - r * 0.04, ly, r * 0.08, r * 0.18);
        }
        // 头
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.3, r * 0.25, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 鹿角（丰富分支）
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 2.5;
        // 左角
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.55);
        ctx.quadraticCurveTo(x - r * 0.4, y - r * 0.85, x - r * 0.5, y - r * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.7);
        ctx.lineTo(x - r * 0.35, y - r * 0.95);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.75);
        ctx.lineTo(x - r * 0.4, y - r * 0.8);
        ctx.stroke();
        // 右角
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.55);
        ctx.quadraticCurveTo(x + r * 0.4, y - r * 0.85, x + r * 0.5, y - r * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.25, y - r * 0.7);
        ctx.lineTo(x + r * 0.35, y - r * 0.95);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.3, y - r * 0.75);
        ctx.lineTo(x + r * 0.4, y - r * 0.8);
        ctx.stroke();
        // 角上金点
        ctx.fillStyle = '#ffd700';
        for (var k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.arc(x - r * 0.3 - k * 0.05, y - r * 0.75 - k * 0.03, r * 0.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + r * 0.3 + k * 0.05, y - r * 0.75 - k * 0.03, r * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
        // 眼
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.3, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.08, y - r * 0.3, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 红鼻
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.18, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 白斑点
        ctx.fillStyle = '#fff';
        for (var wi = 0; wi < 5; wi++) {
            ctx.beginPath();
            ctx.arc(x - r * 0.2 + (wi % 3) * r * 0.2, y + r * 0.2 + Math.floor(wi / 3) * r * 0.1, r * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 老登看雷：老者望天 + 闪电
    drawFriendOldMan: function(ctx, x, y, r, color) {
        // 雷电背景
        ctx.fillStyle = 'rgba(255,235,59,0.15)';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        // 老者身体（灰袍）
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.25, r * 0.5, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // 头顶白发
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.45, r * 0.32, r * 0.15, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        // 仰视眼（眼望上方）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.35, r * 0.06, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.35, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.4, r * 0.025, 0, Math.PI * 2);
        ctx.arc(x + r * 0.12, y - r * 0.4, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        // 白胡须
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.18, y - r * 0.2);
        ctx.quadraticCurveTo(x, y + r * 0.1, x + r * 0.18, y - r * 0.2);
        ctx.lineTo(x + r * 0.1, y - r * 0.2);
        ctx.quadraticCurveTo(x, y + r * 0.05, x - r * 0.1, y - r * 0.2);
        ctx.closePath();
        ctx.fill();
        // 头顶雷云
        ctx.fillStyle = '#455a64';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.85, r * 0.35, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - r * 0.2, y - r * 0.8, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + r * 0.2, y - r * 0.8, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // 闪电
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 2;
        var t = Date.now() / 200;
        for (var li = 0; li < 3; li++) {
            var lx = x - r * 0.2 + li * r * 0.2;
            ctx.beginPath();
            ctx.moveTo(lx, y - r * 0.7);
            ctx.lineTo(lx + r * 0.05, y - r * 0.55);
            ctx.lineTo(lx - r * 0.05, y - r * 0.5);
            ctx.lineTo(lx, y - r * 0.35);
            ctx.stroke();
        }
    },

    // 亚尔托莉：蓝发金甲骑士
    drawFriendArtoria: function(ctx, x, y, r, color) {
        // 身体（金甲）
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.4, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 蓝色披风
        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.1);
        ctx.lineTo(x - r * 0.55, y + r * 0.6);
        ctx.lineTo(x, y + r * 0.5);
        ctx.lineTo(x + r * 0.55, y + r * 0.6);
        ctx.lineTo(x + r * 0.35, y - r * 0.1);
        ctx.closePath();
        ctx.fill();
        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.4, r * 0.28, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 蓝发
        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.32, r * 0.2, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - r * 0.32, y - r * 0.5, r * 0.05, r * 0.4);
        ctx.fillRect(x + r * 0.27, y - r * 0.5, r * 0.05, r * 0.4);
        // 金发带
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - r * 0.32, y - r * 0.55, r * 0.64, r * 0.06);
        // 圣绿眼
        ctx.fillStyle = '#7cb342';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 圣剑
        ctx.save();
        ctx.translate(x + r * 0.5, y - r * 0.2);
        ctx.rotate(-0.3);
        // 剑柄
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(0, 0, r * 0.05, r * 0.1);
        // 剑刃
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(r * 0.025, 0);
        ctx.lineTo(r * 0.025, -r * 0.6);
        ctx.lineTo(0, -r * 0.7);
        ctx.lineTo(-r * 0.025, -r * 0.6);
        ctx.lineTo(-r * 0.025, 0);
        ctx.closePath();
        ctx.fill();
        // 护手
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-r * 0.06, -r * 0.02, r * 0.12, r * 0.04);
        ctx.restore();
    },

    // 幸运黑妹：黑发少女 + 闪亮
    drawFriendBlackGirl: function(ctx, x, y, r, color) {
        // 闪亮背景
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        // 身体
        ctx.fillStyle = '#ec407a';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.15, r * 0.4, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 衣领
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.15);
        ctx.lineTo(x, y - r * 0.05);
        ctx.lineTo(x + r * 0.15, y - r * 0.15);
        ctx.lineTo(x + r * 0.1, y - r * 0.05);
        ctx.lineTo(x, y);
        ctx.lineTo(x - r * 0.1, y - r * 0.05);
        ctx.closePath();
        ctx.fill();
        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.4, r * 0.28, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 黑长双马尾
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.55, r * 0.32, r * 0.2, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - r * 0.4, y - r * 0.4, r * 0.1, r * 0.5);
        ctx.fillRect(x + r * 0.3, y - r * 0.4, r * 0.1, r * 0.5);
        // 蝴蝶结
        ctx.fillStyle = '#d81b60';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.1, y - r * 0.6);
        ctx.lineTo(x - r * 0.2, y - r * 0.7);
        ctx.lineTo(x - r * 0.05, y - r * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.1, y - r * 0.6);
        ctx.lineTo(x + r * 0.2, y - r * 0.7);
        ctx.lineTo(x + r * 0.05, y - r * 0.65);
        ctx.closePath();
        ctx.fill();
        // 大眼
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.12, y - r * 0.4, r * 0.1, r * 0.12, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.12, y - r * 0.4, r * 0.1, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5e35b1';
        ctx.beginPath();
        ctx.arc(x - r * 0.12, y - r * 0.38, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.12, y - r * 0.38, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.36, r * 0.02, 0, Math.PI * 2);
        ctx.arc(x + r * 0.14, y - r * 0.36, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        // 嘴
        ctx.fillStyle = '#d81b60';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.22, r * 0.04, r * 0.015, 0, 0, Math.PI * 2);
        ctx.fill();
        // 腮红
        ctx.fillStyle = 'rgba(244,67,54,0.3)';
        ctx.beginPath();
        ctx.arc(x - r * 0.2, y - r * 0.25, r * 0.05, 0, Math.PI * 2);
        ctx.arc(x + r * 0.2, y - r * 0.25, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 闪光
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.5);
        ctx.lineTo(x - r * 0.27, y - r * 0.45);
        ctx.lineTo(x - r * 0.25, y - r * 0.5);
        ctx.lineTo(x - r * 0.27, y - r * 0.55);
        ctx.closePath();
        ctx.fill();
    },

    // 花轻斋：古风书斋 + 兰花
    drawFriendStudio: function(ctx, x, y, r, color) {
        // 桌子
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - r * 0.7, y + r * 0.3, r * 1.4, r * 0.1);
        // 砚台
        ctx.fillStyle = '#212121';
        ctx.fillRect(x - r * 0.55, y + r * 0.15, r * 0.2, r * 0.1);
        // 毛笔架
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x - r * 0.2, y + r * 0.05, r * 0.05, r * 0.25);
        // 毛笔
        ctx.save();
        ctx.translate(x - r * 0.18, y + r * 0.05);
        ctx.rotate(-0.3);
        ctx.fillStyle = '#212121';
        ctx.fillRect(0, 0, r * 0.04, r * 0.3);
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.moveTo(r * 0.04, 0);
        ctx.lineTo(r * 0.07, -r * 0.03);
        ctx.lineTo(r * 0.07, r * 0.33);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // 书册
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(x + r * 0.05, y + r * 0.1, r * 0.4, r * 0.2);
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + r * 0.05, y + r * 0.1, r * 0.4, r * 0.2);
        // 文字
        ctx.fillStyle = '#000';
        for (var li = 0; li < 3; li++) {
            ctx.fillRect(x + r * 0.1, y + r * 0.15 + li * r * 0.05, r * 0.3, 1);
        }
        // 兰花
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.4, y - r * 0.4);
        ctx.quadraticCurveTo(x + r * 0.3, y - r * 0.2, x + r * 0.35, y);
        ctx.stroke();
        // 兰叶
        ctx.fillStyle = '#388e3c';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.25, y - r * 0.1, r * 0.04, r * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + r * 0.45, y - r * 0.15, r * 0.04, r * 0.15, 0.5, 0, Math.PI * 2);
        ctx.fill();
        // 兰花
        ctx.fillStyle = '#e1bee7';
        for (var fi = 0; fi < 5; fi++) {
            var fa = fi * Math.PI * 2 / 5 - Math.PI / 2;
            ctx.beginPath();
            ctx.ellipse(x + r * 0.4 + Math.cos(fa) * r * 0.06, y - r * 0.4 + Math.sin(fa) * r * 0.06, r * 0.06, r * 0.04, fa, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(x + r * 0.4, y - r * 0.4, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
    },

    // 网友定制怪物：按名字精确分发到独特精灵
    drawFriendMonster: function(ctx, name, x, y, r, color) {
        var n = name || '';
        if (n.indexOf('小羊角') !== -1) { this.drawFriendSheep(ctx, x, y, r, color); return; }
        if (n.indexOf('大盘鱼') !== -1) { this.drawFriendFish(ctx, x, y, r, color); return; }
        if (n.indexOf('无声乐章') !== -1) { this.drawFriendMusic(ctx, x, y, r, color); return; }
        if (n.indexOf('可达鸭') !== -1) { this.drawFriendPsyduck(ctx, x, y, r, color); return; }
        if (n.indexOf('赞美魔法之神') !== -1) { this.drawFriendMageGod(ctx, x, y, r, color); return; }
        if (n.indexOf('花轻影') !== -1) { this.drawFriendPetal(ctx, x, y, r, color); return; }
        if (n.indexOf('诀别诗') !== -1) { this.drawFriendPoem(ctx, x, y, r, color); return; }
        if (n.indexOf('内阁') !== -1) { this.drawFriendCabinet(ctx, x, y, r, color); return; }
        if (n.indexOf('雪映梅') !== -1) { this.drawFriendSnowPlum(ctx, x, y, r, color); return; }
        if (n.indexOf('维多喵') !== -1) { this.drawFriendCat(ctx, x, y, r, color); return; }
        if (n.indexOf('Echo') !== -1 || n.indexOf('echo') !== -1) { this.drawFriendEcho(ctx, x, y, r, color); return; }
        if (n.indexOf('秋语') !== -1) { this.drawFriendAutumn(ctx, x, y, r, color); return; }
        if (n.indexOf('白菊') !== -1) { this.drawFriendWhiteChrys(ctx, x, y, r, color); return; }
        if (n.indexOf('菊') !== -1) { this.drawFriendChrys(ctx, x, y, r, color); return; }
        if (n.indexOf('幸运蛋') !== -1) { this.drawFriendEgg(ctx, x, y, r, color); return; }
        if (n.indexOf('枫原万叶') !== -1) { this.drawFriendKaedehara(ctx, x, y, r, color); return; }
        if (n.indexOf('幸运风见') !== -1) { this.drawFriendWind(ctx, x, y, r, color); return; }
        if (n.indexOf('幸运魔角') !== -1) { this.drawFriendMagicHorn(ctx, x, y, r, color); return; }
        if (n.indexOf('幸运鹿角') !== -1) { this.drawFriendDeer(ctx, x, y, r, color); return; }
        if (n.indexOf('老登看雷') !== -1) { this.drawFriendOldMan(ctx, x, y, r, color); return; }
        if (n.indexOf('亚尔托莉') !== -1) { this.drawFriendArtoria(ctx, x, y, r, color); return; }
        if (n.indexOf('幸运黑妹') !== -1) { this.drawFriendBlackGirl(ctx, x, y, r, color); return; }
        if (n.indexOf('花轻斋') !== -1) { this.drawFriendStudio(ctx, x, y, r, color); return; }
        if (n.indexOf('朝花夕拾') !== -1) { this.drawFriendZhaohua(ctx, x, y, r, color); return; }
        if (n.indexOf('定时说说') !== -1) { this.drawFriendDingshi(ctx, x, y, r, color); return; }
        if (n.indexOf('弃C') !== -1) { this.drawFriendQiC(ctx, x, y, r, color); return; }
        if (n.indexOf('我的名字') !== -1) { this.drawFriendWodeMignzi(ctx, x, y, r, color); return; }
        if (n.indexOf('LitALS') !== -1) { this.drawFriendLitals(ctx, x, y, r, color); return; }
        if (n.indexOf('宣姬') !== -1) { this.drawFriendXuanji(ctx, x, y, r, color); return; }
        if (n.indexOf('奥霸天') !== -1) { this.drawFriendAobatian(ctx, x, y, r, color); return; }
        if (n.indexOf('大白鹅') !== -1) { this.drawFriendDabaie(ctx, x, y, r, color); return; }
        if (n.indexOf('热心网友小余') !== -1) { this.drawFriendXiaoyu(ctx, x, y, r, color); return; }
        if (n.indexOf('WLS') !== -1) { this.drawFriendWLS(ctx, x, y, r, color); return; }
        if (n.indexOf('无咎') !== -1) { this.drawFriendWujiu(ctx, x, y, r, color); return; }
        if (n.indexOf('活得自在') !== -1) { this.drawFriendZide(ctx, x, y, r, color); return; }
        if (n.indexOf('林有德') !== -1) { this.drawFriendLinyoude(ctx, x, y, r, color); return; }
        if (n.indexOf('设计师') !== -1) { this.drawFriendShejishi(ctx, x, y, r, color); return; }
        if (n.indexOf('气急败坏的妃妃') !== -1) { this.drawFriendFeifei(ctx, x, y, r, color); return; }
        // v2.6.1: 召唤物精灵（与网友怪同等优先级，名字精确匹配避免与 '凤凰'/'狼' 等怪冲突）
        if (n === '灵狼' || n === 'wolf_summon') { this.drawSummonWolf(ctx, x, y, r, color); return; }
        if (n === '凤凰' || n === 'phoenix_summon') { this.drawSummonPhoenix(ctx, x, y, r, color); return; }
        if (n === '元素精灵' || n === 'elemental_summon') { this.drawSummonElemental(ctx, x, y, r, color); return; }
        this.drawGenericMonster(ctx, x, y, r, color, false);
    },

    // ====== 网友定制怪物精灵（24个独特造型） ======

    // 小羊角：蓬松小羊 + 羊角 + 秘书小本子
    drawFriendSheep: function(ctx, x, y, r, color) {
        // 蓬松身体（多个毛球）
        ctx.fillStyle = '#f5f5f5';
        for (var i = 0; i < 8; i++) {
            var a = i * Math.PI * 2 / 8;
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * r * 0.4, y + r * 0.1 + Math.sin(a) * r * 0.3, r * 0.18, 0, Math.PI * 2);
            ctx.fill();
        }
        // 主体
        ctx.beginPath();
        ctx.arc(x, y + r * 0.1, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // 脸
        ctx.fillStyle = '#f5e6c8';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.3, r * 0.25, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        // 卷曲羊角
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.4);
        ctx.quadraticCurveTo(x - r * 0.4, y - r * 0.65, x - r * 0.15, y - r * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.4);
        ctx.quadraticCurveTo(x + r * 0.4, y - r * 0.65, x + r * 0.15, y - r * 0.5);
        ctx.stroke();
        // 眯笑眼
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.12, y - r * 0.3);
        ctx.quadraticCurveTo(x - r * 0.08, y - r * 0.27, x - r * 0.04, y - r * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.04, y - r * 0.3);
        ctx.quadraticCurveTo(x + r * 0.08, y - r * 0.27, x + r * 0.12, y - r * 0.3);
        ctx.stroke();
        // 小红晕
        ctx.fillStyle = 'rgba(244,67,54,0.3)';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.2, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.15, y - r * 0.2, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 秘书小本子
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + r * 0.35, y, r * 0.25, r * 0.2);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + r * 0.35, y, r * 0.25, r * 0.2);
        ctx.fillStyle = '#000';
        for (var li = 0; li < 3; li++) {
            ctx.fillRect(x + r * 0.38, y + r * 0.04 + li * r * 0.05, r * 0.18, 1);
        }
    },

    // 大盘鱼：大鱼 + 盘子 + 鱼腥味
    drawFriendFish: function(ctx, x, y, r, color) {
        // 大盘子
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.5, r * 0.85, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 鱼身
        ctx.fillStyle = '#64b5f6';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.6, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // 鱼鳞
        ctx.fillStyle = '#1e88e5';
        for (var si = 0; si < 5; si++) {
            ctx.beginPath();
            ctx.arc(x - r * 0.3 + si * r * 0.15, y, r * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
        // 鱼尾
        ctx.fillStyle = '#1976d2';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y);
        ctx.lineTo(x - r * 0.85, y - r * 0.3);
        ctx.lineTo(x - r * 0.7, y);
        ctx.lineTo(x - r * 0.85, y + r * 0.3);
        ctx.closePath();
        ctx.fill();
        // 鱼眼
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + r * 0.3, y - r * 0.08, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + r * 0.32, y - r * 0.08, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 嘴+气泡
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.55, y + r * 0.05);
        ctx.lineTo(x + r * 0.6, y + r * 0.15);
        ctx.stroke();
        // 气泡
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = 1.5;
        for (var bi = 0; bi < 3; bi++) {
            ctx.beginPath();
            ctx.arc(x + r * 0.4 + bi * r * 0.1, y - r * 0.3 - bi * r * 0.1, r * 0.05 - bi * 0.01, 0, Math.PI * 2);
            ctx.stroke();
        }
    },

    // 无声乐章：五线谱 + 音符 + 静止
    drawFriendMusic: function(ctx, x, y, r, color) {
        // 五线谱底
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1;
        for (var li = 0; li < 5; li++) {
            ctx.beginPath();
            ctx.moveTo(x - r * 0.8, y - r * 0.2 + li * r * 0.1);
            ctx.lineTo(x + r * 0.8, y - r * 0.2 + li * r * 0.1);
            ctx.stroke();
        }
        // 谱号（高音谱号简化）
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(x - r * 0.55, y - r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - r * 0.6, y - r * 0.15, r * 0.05, r * 0.4);
        ctx.beginPath();
        ctx.arc(x - r * 0.55, y + r * 0.25, r * 0.06, 0, Math.PI);
        ctx.stroke();
        // 音符
        var notePos = [
            { x: -0.15, y: -0.05 }, { x: 0.05, y: 0.05 }, { x: 0.25, y: -0.1 },
            { x: 0.4, y: 0.1 }, { x: 0.55, y: 0 }
        ];
        for (var ni = 0; ni < notePos.length; ni++) {
            var np = notePos[ni];
            // 符头
            ctx.fillStyle = '#311b92';
            ctx.beginPath();
            ctx.ellipse(x + r * np.x, y + r * np.y, r * 0.06, r * 0.045, -0.4, 0, Math.PI * 2);
            ctx.fill();
            // 符杆
            ctx.fillRect(x + r * np.x + r * 0.05, y + r * np.y - r * 0.3, r * 0.015, r * 0.3);
        }
        // 静止符号 (Zzz)
        ctx.fillStyle = '#7b1fa2';
        ctx.font = 'bold ' + (r * 0.2) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('z', x - r * 0.3, y - r * 0.55);
        ctx.fillText('z', x - r * 0.15, y - r * 0.7);
    },

    // 可达鸭煲汤：鸭子在汤锅里
    drawFriendPsyduck: function(ctx, x, y, r, color) {
        // 汤锅
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.4, r * 0.7, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 锅沿
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.25, r * 0.7, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        // 锅耳
        ctx.fillRect(x - r * 0.75, y + r * 0.3, r * 0.08, r * 0.15);
        ctx.fillRect(x + r * 0.67, y + r * 0.3, r * 0.08, r * 0.15);
        // 汤
        ctx.fillStyle = '#ffcc80';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.25, r * 0.6, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // 鸭头（冒出来）
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.1, r * 0.3, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        // 鸭嘴
        ctx.fillStyle = '#f57f17';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.05, r * 0.12, r * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
        // 鸭眼（迷茫圈圈）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.15, r * 0.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.15, r * 0.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.15, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.15, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        // 头顶三根毛
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.35);
        ctx.lineTo(x - r * 0.05, y - r * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.35);
        ctx.lineTo(x, y - r * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.35);
        ctx.lineTo(x + r * 0.05, y - r * 0.5);
        ctx.stroke();
        // 蒸汽
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (var si = 0; si < 3; si++) {
            var sw = Date.now() / 400 + si;
            ctx.beginPath();
            ctx.arc(x - r * 0.2 + Math.sin(sw) * r * 0.1, y - r * 0.5 - si * r * 0.15, r * 0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + r * 0.2 + Math.cos(sw) * r * 0.1, y - r * 0.5 - si * r * 0.15, r * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 赞美魔法之神：法神 + 金光 + 魔法阵
    drawFriendMageGod: function(ctx, x, y, r, color) {
        // 魔法阵（地面）
        var t = Date.now() / 500;
        ctx.strokeStyle = '#ffd70066';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + r * 0.5, r * 0.7 + Math.sin(t) * r * 0.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#ffd70044';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.5, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        // 阵上符文
        for (var ri = 0; ri < 6; ri++) {
            var ra = ri * Math.PI * 2 / 6 + t;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(x + Math.cos(ra) * r * 0.65, y + r * 0.5 + Math.sin(ra) * r * 0.65, r * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
        // 身体（金袍）
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.5, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 袍摆
        ctx.fillStyle = '#ffa000';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y + r * 0.2);
        ctx.lineTo(x - r * 0.65, y + r * 0.6);
        ctx.lineTo(x + r * 0.65, y + r * 0.6);
        ctx.lineTo(x + r * 0.5, y + r * 0.2);
        ctx.closePath();
        ctx.fill();
        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.45, r * 0.28, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 法神帽
        ctx.fillStyle = '#311b92';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.5);
        ctx.lineTo(x + r * 0.3, y - r * 0.5);
        ctx.lineTo(x, y - r * 0.95);
        ctx.closePath();
        ctx.fill();
        // 帽星
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.7, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 大胡须
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.3);
        ctx.quadraticCurveTo(x, y + r * 0.1, x + r * 0.2, y - r * 0.3);
        ctx.lineTo(x + r * 0.1, y - r * 0.3);
        ctx.quadraticCurveTo(x, y, x - r * 0.1, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
        // 圣光眼神
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.45, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.45, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 漂浮魔法书
        ctx.fillStyle = '#7b1fa2';
        ctx.fillRect(x + r * 0.55, y - r * 0.1, r * 0.3, r * 0.25);
        ctx.fillStyle = '#fff';
        for (var bi = 0; bi < 3; bi++) {
            ctx.fillRect(x + r * 0.58, y - r * 0.05 + bi * r * 0.05, r * 0.24, 1);
        }
    },

    // 花轻影：花瓣飘舞
    drawFriendPetal: function(ctx, x, y, r, color) {
        var t = Date.now() / 400;
        // 中心花蕊
        ctx.fillStyle = '#f8bbd0';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // 花瓣
        var petalC = ['#f48fb1', '#f06292', '#ec407a', '#ff80ab'];
        for (var pi = 0; pi < 6; pi++) {
            var pa = pi * Math.PI * 2 / 6 + Math.sin(t + pi) * 0.1;
            ctx.fillStyle = petalC[pi % petalC.length];
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(pa) * r * 0.4, y + Math.sin(pa) * r * 0.4, r * 0.2, r * 0.13, pa, 0, Math.PI * 2);
            ctx.fill();
        }
        // 飘落花瓣
        for (var fi = 0; fi < 5; fi++) {
            var fa = t * 0.7 + fi * 1.2;
            var fr = r * (0.7 + Math.sin(t + fi) * 0.2);
            ctx.fillStyle = petalC[fi % petalC.length] + 'aa';
            ctx.save();
            ctx.translate(x + Math.cos(fa) * fr, y + Math.sin(fa) * fr);
            ctx.rotate(fa * 2);
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.05, r * 0.03, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // 中心点
        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
    },

    // 诀别诗：古书卷轴
    drawFriendPoem: function(ctx, x, y, r, color) {
        // 桌布
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - r * 0.7, y + r * 0.4, r * 1.4, r * 0.3);
        // 卷轴
        ctx.fillStyle = '#fff8e1';
        ctx.fillRect(x - r * 0.6, y - r * 0.3, r * 1.2, r * 0.5);
        // 卷轴轴
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x - r * 0.7, y - r * 0.35, r * 0.12, r * 0.6);
        ctx.fillRect(x + r * 0.58, y - r * 0.35, r * 0.12, r * 0.6);
        // 文字行
        ctx.fillStyle = '#3e2723';
        for (var li = 0; li < 4; li++) {
            ctx.fillRect(x - r * 0.55, y - r * 0.2 + li * r * 0.1, r * 1.0 - li * r * 0.15, 1.5);
        }
        // 标题
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(x - r * 0.4, y - r * 0.25, r * 0.4, r * 0.06);
        // 墨滴
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + r * 0.3, y + r * 0.1, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        // 毛笔
        ctx.fillStyle = '#212121';
        ctx.save();
        ctx.translate(x + r * 0.6, y + r * 0.55);
        ctx.rotate(0.5);
        ctx.fillRect(0, 0, r * 0.05, r * 0.3);
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.moveTo(r * 0.05, 0);
        ctx.lineTo(r * 0.1, -r * 0.03);
        ctx.lineTo(r * 0.1, r * 0.33);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    // 内阁：内阁大臣 + 官帽 + 笏板
    drawFriendCabinet: function(ctx, x, y, r, color) {
        // 官袍
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y - r * 0.1);
        ctx.lineTo(x - r * 0.6, y + r * 0.65);
        ctx.lineTo(x + r * 0.6, y + r * 0.65);
        ctx.lineTo(x + r * 0.5, y - r * 0.1);
        ctx.closePath();
        ctx.fill();
        // 衣领
        ctx.fillStyle = '#fdd835';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.15);
        ctx.lineTo(x, y - r * 0.05);
        ctx.lineTo(x + r * 0.15, y - r * 0.15);
        ctx.lineTo(x + r * 0.1, y - r * 0.05);
        ctx.lineTo(x, y);
        ctx.lineTo(x - r * 0.1, y - r * 0.05);
        ctx.closePath();
        ctx.fill();
        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.4, r * 0.3, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 乌纱帽
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.65, r * 0.35, r * 0.2, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - r * 0.05, y - r * 0.95, r * 0.1, r * 0.15);
        // 帽翅
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.7);
        ctx.quadraticCurveTo(x - r * 0.55, y - r * 0.85, x - r * 0.45, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.35, y - r * 0.7);
        ctx.quadraticCurveTo(x + r * 0.55, y - r * 0.85, x + r * 0.45, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        // 八字胡
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.18, y - r * 0.32);
        ctx.quadraticCurveTo(x - r * 0.1, y - r * 0.25, x - r * 0.05, y - r * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.18, y - r * 0.32);
        ctx.quadraticCurveTo(x + r * 0.1, y - r * 0.25, x + r * 0.05, y - r * 0.3);
        ctx.stroke();
        // 笏板
        ctx.fillStyle = '#fdd835';
        ctx.fillRect(x + r * 0.4, y + r * 0.05, r * 0.05, r * 0.3);
        // 圆眼
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.arc(x + r * 0.1, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
    },

    // 雪映梅：雪中红梅
    drawFriendSnowPlum: function(ctx, x, y, r, color) {
        // 雪堆底
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.5, r * 0.7, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        // 枝干
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.1, y + r * 0.5);
        ctx.quadraticCurveTo(x - r * 0.15, y + r * 0.2, x - r * 0.2, y - r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.25, y - r * 0.3, x - r * 0.15, y - r * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.1);
        ctx.lineTo(x + r * 0.1, y - r * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.3);
        ctx.lineTo(x + r * 0.05, y - r * 0.45);
        ctx.stroke();
        // 梅花
        function drawMum(px, py, size) {
            ctx.fillStyle = '#d32f2f';
            for (var mi = 0; mi < 5; mi++) {
                var ma = mi * Math.PI * 2 / 5 - Math.PI / 2;
                ctx.beginPath();
                ctx.arc(px + Math.cos(ma) * size * 0.3, py + Math.sin(ma) * size * 0.3, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#fdd835';
            ctx.beginPath();
            ctx.arc(px, py, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        drawMum(x - r * 0.18, y - r * 0.55, r);
        drawMum(x + r * 0.1, y - r * 0.3, r * 0.7);
        drawMum(x - r * 0.05, y - r * 0.5, r * 0.8);
        // 雪点
        ctx.fillStyle = '#fff';
        for (var si = 0; si < 6; si++) {
            var sa = si * Math.PI * 2 / 6;
            ctx.beginPath();
            ctx.arc(x + Math.cos(sa) * r * 0.6, y + Math.sin(sa) * r * 0.6, r * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
        // 雪花飘
        var t = Date.now() / 400;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (var fi = 0; fi < 4; fi++) {
            var fx = x + Math.sin(t + fi * 1.5) * r * 0.5;
            var fy = y + r * 0.7 + Math.cos(t + fi) * r * 0.1;
            ctx.beginPath();
            ctx.arc(fx, fy, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 维多喵：英短蓝猫
    drawFriendCat: function(ctx, x, y, r, color) {
        // 身体
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.2, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头
        ctx.beginPath();
        ctx.arc(x, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        // 耳朵
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y - r * 0.4);
        ctx.lineTo(x - r * 0.2, y - r * 0.65);
        ctx.lineTo(x - r * 0.1, y - r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.1, y - r * 0.4);
        ctx.lineTo(x + r * 0.2, y - r * 0.65);
        ctx.lineTo(x + r * 0.3, y - r * 0.4);
        ctx.closePath();
        ctx.fill();
        // 内耳粉
        ctx.fillStyle = '#f8bbd0';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.27, y - r * 0.45);
        ctx.lineTo(x - r * 0.2, y - r * 0.6);
        ctx.lineTo(x - r * 0.15, y - r * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.45);
        ctx.lineTo(x + r * 0.2, y - r * 0.6);
        ctx.lineTo(x + r * 0.27, y - r * 0.45);
        ctx.closePath();
        ctx.fill();
        // 大眼（猫眼）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.13, y - r * 0.25, r * 0.07, r * 0.1, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.13, y - r * 0.25, r * 0.07, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // 绿瞳
        ctx.fillStyle = '#7cb342';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.13, y - r * 0.25, r * 0.04, r * 0.08, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.13, y - r * 0.25, r * 0.04, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        // 瞳仁
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.13, y - r * 0.25, r * 0.015, r * 0.06, 0, 0, Math.PI * 2);
        ctx.ellipse(x + r * 0.13, y - r * 0.25, r * 0.015, r * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        // 鼻子
        ctx.fillStyle = '#f8bbd0';
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.18);
        ctx.lineTo(x - r * 0.03, y - r * 0.13);
        ctx.lineTo(x + r * 0.03, y - r * 0.13);
        ctx.closePath();
        ctx.fill();
        // 嘴（w形）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.13);
        ctx.lineTo(x, y - r * 0.1);
        ctx.moveTo(x - r * 0.05, y - r * 0.07);
        ctx.quadraticCurveTo(x, y - r * 0.1, x + r * 0.05, y - r * 0.07);
        ctx.stroke();
        // 胡须
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1;
        for (var wi = 0; wi < 3; wi++) {
            ctx.beginPath();
            ctx.moveTo(x - r * 0.15, y - r * 0.1 + wi * r * 0.04);
            ctx.lineTo(x - r * 0.4, y - r * 0.15 + wi * r * 0.04);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + r * 0.15, y - r * 0.1 + wi * r * 0.04);
            ctx.lineTo(x + r * 0.4, y - r * 0.15 + wi * r * 0.04);
            ctx.stroke();
        }
        // 尾巴
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.45, y + r * 0.2);
        ctx.quadraticCurveTo(x + r * 0.7, y - r * 0.1, x + r * 0.6, y - r * 0.4);
        ctx.stroke();
    },

    // Echo：声波 + 麦克风
    drawFriendEcho: function(ctx, x, y, r, color) {
        // 麦克风主体
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.2, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // 麦克风网格
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 1;
        for (var gi = 0; gi < 4; gi++) {
            ctx.beginPath();
            ctx.arc(x, y - r * 0.2, r * 0.1 + gi * r * 0.04, 0, Math.PI * 2);
            ctx.stroke();
        }
        // 麦克风柄
        ctx.fillRect(x - r * 0.05, y + r * 0.05, r * 0.1, r * 0.35);
        // 声波圈（动画）
        var t = Date.now() / 300;
        for (var si = 0; si < 4; si++) {
            var phase = (t + si * 0.25) % 1;
            var radius = phase * r * 0.7;
            var alpha = 1 - phase;
            ctx.strokeStyle = 'rgba(0, 229, 255,' + alpha + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y - r * 0.2, radius, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
        }
        // 反方向声波
        for (var sj = 0; sj < 4; sj++) {
            var phase2 = (t + sj * 0.25 + 0.5) % 1;
            var radius2 = phase2 * r * 0.7;
            var alpha2 = 1 - phase2;
            ctx.strokeStyle = 'rgba(255, 64, 129,' + alpha2 + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y - r * 0.2, radius2, Math.PI - Math.PI / 3, Math.PI + Math.PI / 3);
            ctx.stroke();
        }
        // Echo 文字
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold ' + (r * 0.18) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Echo', x, y + r * 0.6);
    },

    // 秋语：秋叶 + 字
    drawFriendAutumn: function(ctx, x, y, r, color) {
        // 落叶
        function drawLeaf(lx, ly, size, angle, color) {
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(angle);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.quadraticCurveTo(size * 0.5, -size * 0.5, size * 0.3, 0);
            ctx.quadraticCurveTo(size * 0.5, size * 0.5, 0, size);
            ctx.quadraticCurveTo(-size * 0.5, size * 0.5, -size * 0.3, 0);
            ctx.quadraticCurveTo(-size * 0.5, -size * 0.5, 0, -size);
            ctx.fill();
            // 茎
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, size);
            ctx.lineTo(0, -size);
            ctx.stroke();
            ctx.restore();
        }
        var t = Date.now() / 500;
        drawLeaf(x - r * 0.3, y - r * 0.1, r * 0.3, Math.sin(t) * 0.3, '#ff6f00');
        drawLeaf(x + r * 0.4, y, r * 0.25, Math.cos(t) * 0.3 + 0.5, '#d84315');
        drawLeaf(x, y + r * 0.2, r * 0.28, Math.sin(t + 1) * 0.3, '#f57f17');
        drawLeaf(x - r * 0.1, y + r * 0.4, r * 0.22, Math.cos(t) * 0.3 + 1, '#bf360c');
        // 中心字“秋”
        ctx.fillStyle = '#3e2723';
        ctx.font = 'bold ' + (r * 0.5) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('秋', x, y);
    },

    // 菊：黄色菊花
    drawFriendChrys: function(ctx, x, y, r, color) {
        // 花瓣层（多层）
        function drawPetalLayer(count, radius, length, width, fillC) {
            ctx.fillStyle = fillC;
            for (var i = 0; i < count; i++) {
                var a = i * Math.PI * 2 / count;
                ctx.beginPath();
                ctx.ellipse(x + Math.cos(a) * radius, y + Math.sin(a) * radius, length, width, a, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        drawPetalLayer(14, r * 0.3, r * 0.35, r * 0.08, '#ffeb3b');
        drawPetalLayer(12, r * 0.2, r * 0.25, r * 0.06, '#ffc107');
        // 花心
        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // 花心点
        ctx.fillStyle = '#fdd835';
        for (var di = 0; di < 8; di++) {
            var da = di * Math.PI * 2 / 8;
            ctx.beginPath();
            ctx.arc(x + Math.cos(da) * r * 0.08, y + Math.sin(da) * r * 0.08, r * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }
        // 茎
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + r * 0.3);
        ctx.lineTo(x - r * 0.1, y + r * 0.85);
        ctx.stroke();
        // 叶
        ctx.fillStyle = '#388e3c';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.1, y + r * 0.6, r * 0.15, r * 0.05, 0.3, 0, Math.PI * 2);
        ctx.fill();
    },

    // ====== v2.6.1 召唤物精灵（3 种） ======

    // 灵狼：紫蓝色灵体狼 + 鬼火眼睛 + 飘浮粒子
    drawSummonWolf: function(ctx, x, y, r, color) {
        // 灵体光晕
        var grd = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 0.9);
        grd.addColorStop(0, 'rgba(179,136,255,0.4)');
        grd.addColorStop(1, 'rgba(179,136,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        // 狼身（紫蓝色透明）
        ctx.fillStyle = 'rgba(126,87,194,0.85)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.55, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        // 狼头
        ctx.beginPath();
        ctx.arc(x + r * 0.45, y - r * 0.1, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        // 狼耳（尖）
        ctx.beginPath();
        ctx.moveTo(x + r * 0.32, y - r * 0.25);
        ctx.lineTo(x + r * 0.4, y - r * 0.45);
        ctx.lineTo(x + r * 0.48, y - r * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.48, y - r * 0.25);
        ctx.lineTo(x + r * 0.55, y - r * 0.45);
        ctx.lineTo(x + r * 0.6, y - r * 0.25);
        ctx.closePath();
        ctx.fill();
        // 鬼火眼睛（亮黄）
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x + r * 0.5, y - r * 0.12, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.4, y - r * 0.08, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 鼻尖
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + r * 0.62, y - r * 0.05, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        // 飘浮粒子
        ctx.fillStyle = 'rgba(179,136,255,0.6)';
        var t = Date.now() / 500;
        for (var pi = 0; pi < 3; pi++) {
            var pa = t + pi * Math.PI * 2 / 3;
            var px = x + Math.cos(pa) * r * 0.7;
            var py = y + Math.sin(pa) * r * 0.4;
            ctx.beginPath();
            ctx.arc(px, py, r * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 凤凰：金红色神鸟 + 火焰尾 + 火羽
    drawSummonPhoenix: function(ctx, x, y, r, color) {
        // 火焰光晕
        var grd = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
        grd.addColorStop(0, 'rgba(255,152,0,0.6)');
        grd.addColorStop(0.5, 'rgba(255,87,34,0.3)');
        grd.addColorStop(1, 'rgba(255,87,34,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        // 身体（金红色）
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.05, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头
        ctx.beginPath();
        ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // 凤冠（3 根金羽）
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        for (var ci = 0; ci < 3; ci++) {
            ctx.beginPath();
            ctx.moveTo(x + r * 0.32, y - r * 0.32);
            ctx.lineTo(x + r * 0.25 + ci * r * 0.05, y - r * 0.55 - ci * r * 0.04);
            ctx.stroke();
        }
        // 尖嘴
        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.45, y - r * 0.15);
        ctx.lineTo(x + r * 0.6, y - r * 0.12);
        ctx.lineTo(x + r * 0.45, y - r * 0.08);
        ctx.closePath();
        ctx.fill();
        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + r * 0.35, y - r * 0.18, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 翅膀（金色，向上展开）
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.05, y - r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.4, y - r * 0.6, x - r * 0.6, y - r * 0.2);
        ctx.quadraticCurveTo(x - r * 0.3, y + r * 0.05, x - r * 0.05, y - r * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.05, y + r * 0.1);
        ctx.quadraticCurveTo(x - r * 0.4, y + r * 0.5, x - r * 0.55, y + r * 0.25);
        ctx.quadraticCurveTo(x - r * 0.3, y + r * 0.2, x - r * 0.05, y + r * 0.1);
        ctx.closePath();
        ctx.fill();
        // 长尾羽（3 根，向后飘逸）
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        for (var ti = 0; ti < 3; ti++) {
            var tw = (Date.now() / 300 + ti) % (Math.PI * 2);
            var ty = y + r * 0.15 + ti * r * 0.06 + Math.sin(tw) * r * 0.05;
            ctx.beginPath();
            ctx.moveTo(x - r * 0.3, y + r * 0.1);
            ctx.quadraticCurveTo(x - r * 0.7, ty, x - r * 0.95, ty - r * 0.1);
            ctx.stroke();
        }
    },

    // 元素精灵：六角星 + 旋转能量环 + 元素粒子
    drawSummonElemental: function(ctx, x, y, r, color) {
        // 外圈光晕（紫蓝渐变）
        var grd = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 0.9);
        grd.addColorStop(0, 'rgba(79,195,247,0.5)');
        grd.addColorStop(0.6, 'rgba(156,39,176,0.3)');
        grd.addColorStop(1, 'rgba(156,39,176,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        // 旋转能量环（3 圈，旋转方向不同）
        var t = Date.now() / 600;
        var colors = ['#4fc3f7', '#ce93d8', '#80deea'];
        for (var ri = 0; ri < 3; ri++) {
            ctx.strokeStyle = colors[ri];
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, r * (0.35 + ri * 0.15), t * (ri % 2 ? 1 : -1) + ri, t * (ri % 2 ? 1 : -1) + ri + Math.PI * 1.5);
            ctx.stroke();
        }
        // 中心六角星
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        for (var si = 0; si < 6; si++) {
            var sa = si * Math.PI / 3 - Math.PI / 2;
            var sx = x + Math.cos(sa) * r * 0.22;
            var sy = y + Math.sin(sa) * r * 0.22;
            if (si === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        // 中心核（亮紫）
        var cgrd = ctx.createRadialGradient(x, y, 0, x, y, r * 0.12);
        cgrd.addColorStop(0, '#fff');
        cgrd.addColorStop(0.5, '#ce93d8');
        cgrd.addColorStop(1, '#7b1fa2');
        ctx.fillStyle = cgrd;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        // 8 个元素粒子（围绕旋转）
        for (var pi = 0; pi < 8; pi++) {
            var pa = t * 2 + pi * Math.PI * 2 / 8;
            var pr = r * (0.5 + Math.sin(t * 3 + pi) * 0.08);
            var px = x + Math.cos(pa) * pr;
            var py = y + Math.sin(pa) * pr;
            ctx.fillStyle = pi % 2 ? '#4fc3f7' : '#ce93d8';
            ctx.beginPath();
            ctx.arc(px, py, r * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // ====== v2.6.1 新增 15 个网友定制怪物精灵 ======

    // 朝花夕拾：半开花朵 + 朝阳（左亮）/暮色（右暗）渐变 + 露珠
    drawFriendZhaohua: function(ctx, x, y, r, color) {
        // 茎
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y + r * 0.4);
        ctx.lineTo(x, y + r * 0.85);
        ctx.stroke();
        // 5 瓣花（左 3 瓣朝阳暖色 / 右 2 瓣暮色冷色）
        for (var i = 0; i < 5; i++) {
            var a = (i - 2) * 0.55 - Math.PI / 2;
            var px = x + Math.cos(a) * r * 0.35;
            var py = y + Math.sin(a) * r * 0.35;
            ctx.fillStyle = i < 2 ? '#ffb74d' : (i < 4 ? '#fff176' : '#ce93d8');
            ctx.beginPath();
            ctx.ellipse(px, py, r * 0.25, r * 0.18, a + Math.PI / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // 花心
        ctx.fillStyle = '#ff8a65';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
        // 露珠（左上 - 朝露）
        ctx.fillStyle = 'rgba(180,230,255,0.85)';
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.05, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.32, y - r * 0.07, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        // 飘落的花瓣（右下 - 夕拾）
        ctx.fillStyle = '#ce93d8';
        ctx.save();
        ctx.translate(x + r * 0.4, y + r * 0.3);
        ctx.rotate(0.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.1, r * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // 定时说说：圆盘钟面 + 时分秒针 + 罗马数字 + 隐藏的真心话在秒针第 60 次跳动里
    drawFriendDingshi: function(ctx, x, y, r, color) {
        // 钟外圈
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        // 钟内圈
        ctx.fillStyle = '#fff8e1';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        // 罗马数字 12 3 6 9（简化）
        ctx.fillStyle = '#5d4037';
        ctx.font = 'bold ' + (r * 0.22) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('XII', x, y - r * 0.5);
        ctx.fillText('III', x + r * 0.5, y);
        ctx.fillText('VI', x, y + r * 0.5);
        ctx.fillText('IX', x - r * 0.5, y);
        // 时针（指向 10 点）
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - r * 0.25, y - r * 0.25);
        ctx.stroke();
        // 分针（指向 12 点）
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - r * 0.45);
        ctx.stroke();
        // 秒针（彩色 + 闪烁 + 隐藏消息的秒 - 红色细针指向 60 秒位置）
        ctx.strokeStyle = '#e53935';
        ctx.lineWidth = 1.5;
        var secAng = (Date.now() / 1000 % 60) / 60 * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(secAng) * r * 0.55, y + Math.sin(secAng) * r * 0.55);
        ctx.stroke();
        // 中心铆钉
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 顶部铃铛
        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.85, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.3, y - r * 0.85, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
    },

    // 弃C：秃头程序员 + 显示器显示 segfault
    drawFriendQiC: function(ctx, x, y, r, color) {
        // 显示器
        ctx.fillStyle = '#263238';
        ctx.fillRect(x - r * 0.7, y - r * 0.3, r * 1.4, r * 0.7);
        ctx.fillStyle = '#000';
        ctx.fillRect(x - r * 0.65, y - r * 0.25, r * 1.3, r * 0.6);
        // 屏幕内容 "segfault" 红字
        ctx.fillStyle = '#e53935';
        ctx.font = 'bold ' + (r * 0.18) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('segfault', x, y + r * 0.05);
        // 屏幕光标闪烁
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + r * 0.3, y + r * 0.15, r * 0.05, r * 0.12);
        // 显示器底座
        ctx.fillStyle = '#37474f';
        ctx.fillRect(x - r * 0.15, y + r * 0.4, r * 0.3, r * 0.08);
        ctx.fillRect(x - r * 0.4, y + r * 0.48, r * 0.8, r * 0.05);
        // 程序员秃头（顶部小圈）
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.55, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // 秃头反光
        ctx.fillStyle = '#fff8e1';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.05, y - r * 0.65, r * 0.08, r * 0.04, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 黑眼圈
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x - r * 0.07, y - r * 0.55, r * 0.04, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.07, y - r * 0.55, r * 0.04, 0, Math.PI * 2);
        ctx.stroke();
        // 掉落的头发
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1;
        for (var hi = 0; hi < 4; hi++) {
            var hx = x - r * 0.3 + hi * r * 0.15;
            ctx.beginPath();
            ctx.moveTo(hx, y + r * 0.55);
            ctx.lineTo(hx + r * 0.05, y + r * 0.7);
            ctx.stroke();
        }
    },

    // 我的名字：朦胧剪影 + 空白名牌 + 大问号遮脸
    drawFriendWodeMignzi: function(ctx, x, y, r, color) {
        // 朦胧剪影（深灰渐变）
        var grd = ctx.createRadialGradient(x, y - r * 0.1, r * 0.1, x, y, r * 0.7);
        grd.addColorStop(0, 'rgba(120,120,140,0.9)');
        grd.addColorStop(1, 'rgba(80,80,100,0.4)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.45, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头部（更暗）
        ctx.fillStyle = 'rgba(60,60,80,0.95)';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.3, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // 大问号遮脸（白色 + 描边）
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + (r * 0.6) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y - r * 0.3);
        // 空白名牌（胸口）
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - r * 0.25, y + r * 0.15, r * 0.5, r * 0.18);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - r * 0.25, y + r * 0.15, r * 0.5, r * 0.18);
        // 名牌里空空如也（几个点表示残留的笔迹）
        ctx.fillStyle = '#bdbdbd';
        for (var di = 0; di < 3; di++) {
            ctx.beginPath();
            ctx.arc(x - r * 0.12 + di * r * 0.12, y + r * 0.24, r * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
        // 飘散的碎片（名字散落）
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = (r * 0.18) + 'px sans-serif';
        ctx.fillText('?', x - r * 0.6, y + r * 0.05);
        ctx.fillText('?', x + r * 0.55, y - r * 0.55);
    },

    // LitALS：蜡烛 + 冰晶外壳 + 蓝火焰
    drawFriendLitals: function(ctx, x, y, r, color) {
        // 冰晶外壳（六角雪花）
        ctx.strokeStyle = 'rgba(180,230,255,0.7)';
        ctx.lineWidth = 1.5;
        for (var ai = 0; ai < 6; ai++) {
            var ang = ai * Math.PI / 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(ang) * r * 0.85, y + Math.sin(ang) * r * 0.85);
            ctx.stroke();
            // 分支
            var bx = x + Math.cos(ang) * r * 0.5;
            var by = y + Math.sin(ang) * r * 0.5;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(ang + 0.5) * r * 0.2, by + Math.sin(ang + 0.5) * r * 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(ang - 0.5) * r * 0.2, by + Math.sin(ang - 0.5) * r * 0.2);
            ctx.stroke();
        }
        // 烛身
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - r * 0.12, y + r * 0.1, r * 0.24, r * 0.45);
        // 烛芯
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - r * 0.02, y - r * 0.05, r * 0.04, r * 0.15);
        // 蓝火焰（冷色 + 渐变）
        var fgrd = ctx.createRadialGradient(x, y - r * 0.25, r * 0.02, x, y - r * 0.1, r * 0.2);
        fgrd.addColorStop(0, '#e1f5fe');
        fgrd.addColorStop(0.5, '#4fc3f7');
        fgrd.addColorStop(1, 'rgba(79,195,247,0.3)');
        ctx.fillStyle = fgrd;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.2, r * 0.12, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        // 烛底
        ctx.fillStyle = '#90a4ae';
        ctx.fillRect(x - r * 0.2, y + r * 0.55, r * 0.4, r * 0.08);
    },

    // 宣姬：团扇 + 古装 + 凤冠
    drawFriendXuanji: function(ctx, x, y, r, color) {
        // 袍身（红色古装）
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y - r * 0.2);
        ctx.lineTo(x - r * 0.7, y + r * 0.85);
        ctx.lineTo(x + r * 0.7, y + r * 0.85);
        ctx.lineTo(x + r * 0.5, y - r * 0.2);
        ctx.closePath();
        ctx.fill();
        // 袍边金线
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y - r * 0.2);
        ctx.lineTo(x - r * 0.7, y + r * 0.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.5, y - r * 0.2);
        ctx.lineTo(x + r * 0.7, y + r * 0.85);
        ctx.stroke();
        // 衣领（V 形）
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.3);
        ctx.lineTo(x, y + r * 0.1);
        ctx.lineTo(x + r * 0.2, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
        // 脸
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.45, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        // 眉眼
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x - r * 0.08, y - r * 0.45, r * 0.04, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.08, y - r * 0.45, r * 0.04, 0, Math.PI * 2);
        ctx.stroke();
        // 凤冠
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.7, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
        // 凤冠宝石
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.78, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        // 凤冠两侧流苏
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.6);
        ctx.lineTo(x - r * 0.35, y - r * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.25, y - r * 0.6);
        ctx.lineTo(x + r * 0.35, y - r * 0.4);
        ctx.stroke();
        // 团扇（左侧）
        ctx.fillStyle = '#fff8e1';
        ctx.beginPath();
        ctx.arc(x - r * 0.6, y, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#e53935';
        ctx.font = 'bold ' + (r * 0.18) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('宫', x - r * 0.6, y);
    },

    // 奥霸天：巨型机甲 + 蒸汽朋克风
    drawFriendAobatian: function(ctx, x, y, r, color) {
        // 蒸汽
        ctx.fillStyle = 'rgba(200,200,200,0.5)';
        for (var si = 0; si < 3; si++) {
            var sw = Date.now() / 300 + si;
            ctx.beginPath();
            ctx.arc(x - r * 0.5 + Math.sin(sw) * r * 0.1, y - r * 0.7 - si * r * 0.15, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + r * 0.5 + Math.cos(sw) * r * 0.1, y - r * 0.7 - si * r * 0.15, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        // 腿
        ctx.fillStyle = '#37474f';
        ctx.fillRect(x - r * 0.35, y + r * 0.4, r * 0.2, r * 0.5);
        ctx.fillRect(x + r * 0.15, y + r * 0.4, r * 0.2, r * 0.5);
        // 身体（机甲）
        ctx.fillStyle = '#455a64';
        ctx.fillRect(x - r * 0.5, y - r * 0.2, r * 1.0, r * 0.7);
        // 螺丝
        ctx.fillStyle = '#ffeb3b';
        for (var bi = 0; bi < 4; bi++) {
            ctx.beginPath();
            ctx.arc(x - r * 0.4 + bi * r * 0.27, y - r * 0.1, r * 0.04, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x - r * 0.4 + bi * r * 0.27 - r * 0.025, y - r * 0.115, r * 0.05, r * 0.03);
            ctx.fillStyle = '#ffeb3b';
        }
        // 头部
        ctx.fillStyle = '#263238';
        ctx.fillRect(x - r * 0.25, y - r * 0.6, r * 0.5, r * 0.4);
        // 红色独眼
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.4, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.4, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 天线
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.6);
        ctx.lineTo(x, y - r * 0.85);
        ctx.stroke();
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.85, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 手臂（粗壮）
        ctx.fillStyle = '#37474f';
        ctx.fillRect(x - r * 0.7, y - r * 0.05, r * 0.15, r * 0.55);
        ctx.fillRect(x + r * 0.55, y - r * 0.05, r * 0.15, r * 0.55);
        // 拳头
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.arc(x - r * 0.625, y + r * 0.55, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.625, y + r * 0.55, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
    },

    // 大白鹅：白鹅 + 长颈 + 红嘴 + 翅膀
    drawFriendDabaie: function(ctx, x, y, r, color) {
        // 身体（椭圆）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.2, r * 0.55, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // 翅膀
        ctx.fillStyle = '#eceff1';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.25, y + r * 0.15, r * 0.25, r * 0.18, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + r * 0.25, y + r * 0.15, r * 0.25, r * 0.18, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // 长颈（向上弯曲）
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = r * 0.18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y - r * 0.05);
        ctx.quadraticCurveTo(x + r * 0.4, y - r * 0.3, x + r * 0.3, y - r * 0.6);
        ctx.stroke();
        // 头
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + r * 0.3, y - r * 0.65, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // 红嘴
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.4, y - r * 0.65);
        ctx.lineTo(x + r * 0.6, y - r * 0.6);
        ctx.lineTo(x + r * 0.4, y - r * 0.6);
        ctx.closePath();
        ctx.fill();
        // 鼻孔
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.arc(x + r * 0.5, y - r * 0.62, r * 0.015, 0, Math.PI * 2);
        ctx.fill();
        // 黑眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + r * 0.27, y - r * 0.68, r * 0.025, 0, Math.PI * 2);
        ctx.fill();
        // 鹅冠（头顶小红瘤）
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x + r * 0.28, y - r * 0.78, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 黄色脚掌
        ctx.fillStyle = '#ffb300';
        ctx.fillRect(x - r * 0.2, y + r * 0.55, r * 0.4, r * 0.08);
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y + r * 0.6);
        ctx.lineTo(x - r * 0.05, y + r * 0.7);
        ctx.lineTo(x + r * 0.05, y + r * 0.7);
        ctx.lineTo(x + r * 0.2, y + r * 0.6);
        ctx.closePath();
        ctx.fill();
    },

    // 热心网友小余：仙气飘带 + 沙发/前排标语
    drawFriendXiaoyu: function(ctx, x, y, r, color) {
        // 飘带（背后）
        ctx.fillStyle = 'rgba(179,229,252,0.4)';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.3, y + r * 0.7);
        ctx.quadraticCurveTo(x - r * 0.7, y + r * 0.3, x - r * 0.5, y);
        ctx.quadraticCurveTo(x, y - r * 0.3, x - r * 0.3, y - r * 0.5);
        ctx.lineTo(x + r * 0.1, y - r * 0.5);
        ctx.quadraticCurveTo(x + r * 0.4, y - r * 0.2, x + r * 0.5, y + r * 0.1);
        ctx.quadraticCurveTo(x + r * 0.7, y + r * 0.4, x + r * 0.3, y + r * 0.7);
        ctx.closePath();
        ctx.fill();
        // 身体（淡蓝小仙）
        ctx.fillStyle = '#b3e5fc';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.05, r * 0.3, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.4, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // 大眼（星星眼）
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(x - r * 0.07, y - r * 0.4, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.07, y - r * 0.4, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - r * 0.07, y - r * 0.4, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.07, y - r * 0.4, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
        // 微笑
        ctx.strokeStyle = '#d84315';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.32, r * 0.06, 0, Math.PI);
        ctx.stroke();
        // 标语横幅 "沙发!"
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - r * 0.35, y + r * 0.5, r * 0.7, r * 0.2);
        ctx.strokeStyle = '#e53935';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - r * 0.35, y + r * 0.5, r * 0.7, r * 0.2);
        ctx.fillStyle = '#e53935';
        ctx.font = 'bold ' + (r * 0.13) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('沙发!', x, y + r * 0.6);
    },

    // WLS：戏剧面具 + 三个字母光晕
    drawFriendWLS: function(ctx, x, y, r, color) {
        // 紫色光晕
        var grd = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 0.9);
        grd.addColorStop(0, 'rgba(171,71,188,0.5)');
        grd.addColorStop(1, 'rgba(171,71,188,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        // 戏剧面具（笑脸 - 左白）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.2, y, r * 0.28, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 戏剧面具（哭脸 - 右黑）
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.2, y, r * 0.28, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 左笑脸眼睛（弯月）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - r * 0.28, y - r * 0.05, r * 0.06, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - r * 0.12, y - r * 0.05, r * 0.06, Math.PI, Math.PI * 2);
        ctx.stroke();
        // 左笑脸嘴（笑）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - r * 0.2, y + r * 0.1, r * 0.1, 0, Math.PI);
        ctx.stroke();
        // 右哭脸眼睛（弯月反向）
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + r * 0.12, y - r * 0.05, r * 0.06, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.28, y - r * 0.05, r * 0.06, 0, Math.PI);
        ctx.stroke();
        // 右哭脸嘴（哭）
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + r * 0.2, y + r * 0.15, r * 0.1, Math.PI, Math.PI * 2);
        ctx.stroke();
        // 三个字母光晕（顶部）
        ctx.fillStyle = '#e1bee7';
        ctx.font = 'bold ' + (r * 0.18) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('W·L·S', x, y - r * 0.7);
    },

    // 无咎：修行者 + 佛珠 + 僧袍 + 莲花
    drawFriendWujiu: function(ctx, x, y, r, color) {
        // 莲花座（底部）
        ctx.fillStyle = '#f8bbd0';
        for (var li = 0; li < 5; li++) {
            var la = li * Math.PI / 4 - Math.PI / 2;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(la) * r * 0.4, y + r * 0.75 + Math.sin(la) * r * 0.1, r * 0.18, r * 0.08, la, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.75, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // 僧袍（橘黄）
        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.45, y + r * 0.75);
        ctx.lineTo(x - r * 0.55, y + r * 0.1);
        ctx.lineTo(x - r * 0.2, y - r * 0.1);
        ctx.lineTo(x + r * 0.2, y - r * 0.1);
        ctx.lineTo(x + r * 0.55, y + r * 0.1);
        ctx.lineTo(x + r * 0.45, y + r * 0.75);
        ctx.closePath();
        ctx.fill();
        // 头
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.35, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        // 光头（头顶反光）
        ctx.fillStyle = '#fff8e1';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.45, r * 0.18, Math.PI, 0);
        ctx.fill();
        // 闭眼
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.13, y - r * 0.32);
        ctx.lineTo(x - r * 0.04, y - r * 0.32);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.04, y - r * 0.32);
        ctx.lineTo(x + r * 0.13, y - r * 0.32);
        ctx.stroke();
        // 佛珠（围绕脖子）
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1.5;
        for (var bi = 0; bi < 12; bi++) {
            var ba = bi * Math.PI * 2 / 12 + Math.PI;
            var bx = x + Math.cos(ba) * r * 0.3;
            var by = y + r * 0.05 + Math.sin(ba) * r * 0.08;
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.arc(bx, by, r * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
        // 佛珠中央宝石（绿色）
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(x, y + r * 0.13, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        // 头顶光环
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.65, r * 0.3, r * 0.08, 0, 0, Math.PI * 2);
        ctx.stroke();
    },

    // 活得自在：泰迪熊 + 抱枕
    drawFriendZide: function(ctx, x, y, r, color) {
        // 身体（棕色泰迪）
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.25, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头
        ctx.beginPath();
        ctx.arc(x, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        // 耳朵
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.55, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.25, y - r * 0.55, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a1887f';
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.55, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.25, y - r * 0.55, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        // 脸（米色）
        ctx.fillStyle = '#d7ccc8';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.18, r * 0.22, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // 眼睛（闭眼笑 - 弯月）
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - r * 0.1, y - r * 0.25, r * 0.05, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.25, r * 0.05, Math.PI, Math.PI * 2);
        ctx.stroke();
        // 鼻子（三角）
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.05, y - r * 0.15);
        ctx.lineTo(x + r * 0.05, y - r * 0.15);
        ctx.lineTo(x, y - r * 0.08);
        ctx.closePath();
        ctx.fill();
        // 嘴（笑）
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.08);
        ctx.lineTo(x, y - r * 0.02);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - r * 0.04, y - r * 0.02, r * 0.04, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.04, y - r * 0.02, r * 0.04, 0, Math.PI);
        ctx.stroke();
        // 抱枕（蓝色心形）
        ctx.fillStyle = '#e91e63';
        ctx.beginPath();
        ctx.moveTo(x, y + r * 0.55);
        ctx.bezierCurveTo(x - r * 0.25, y + r * 0.3, x - r * 0.25, y + r * 0.1, x, y + r * 0.25);
        ctx.bezierCurveTo(x + r * 0.25, y + r * 0.1, x + r * 0.25, y + r * 0.3, x, y + r * 0.55);
        ctx.fill();
    },

    // 林有德：树人 + 胡须 + 年轮
    drawFriendLinyoude: function(ctx, x, y, r, color) {
        // 树身（粗壮）
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.25, r * 0.45, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        // 树皮纹路
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.2, y - r * 0.05);
        ctx.lineTo(x - r * 0.25, y + r * 0.65);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.15, y + r * 0.05);
        ctx.lineTo(x + r * 0.2, y + r * 0.7);
        ctx.stroke();
        // 树冠（深绿圆）
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.4, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // 树冠亮色
        ctx.fillStyle = '#388e3c';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.55, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // 脸（凹陷 - 树洞）
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.1, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // 眼睛（洞里两点白光）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - r * 0.07, y + r * 0.05, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.07, y + r * 0.05, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
        // 长胡须（藤蔓下垂）
        ctx.strokeStyle = '#a1887f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.05, y + r * 0.25);
        ctx.quadraticCurveTo(x - r * 0.15, y + r * 0.45, x - r * 0.1, y + r * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.05, y + r * 0.25);
        ctx.quadraticCurveTo(x + r * 0.15, y + r * 0.45, x + r * 0.1, y + r * 0.7);
        ctx.stroke();
        // 头顶年轮光环（3 圈）
        ctx.strokeStyle = 'rgba(255,235,59,0.5)';
        ctx.lineWidth = 1;
        for (var ri = 1; ri <= 3; ri++) {
            ctx.beginPath();
            ctx.arc(x, y - r * 0.4, r * 0.6 + ri * r * 0.08, 0, Math.PI * 2);
            ctx.stroke();
        }
        // 几个小果实（红）
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x - r * 0.4, y - r * 0.3, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.35, y - r * 0.2, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
    },

    // 设计师：调色板 + 画笔 + 圆框眼镜
    drawFriendShejishi: function(ctx, x, y, r, color) {
        // 调色板（左侧椭圆）
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.3, y + r * 0.1, r * 0.35, r * 0.4, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 拇指孔
        ctx.fillStyle = '#16213e';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.15, y + r * 0.1, r * 0.08, r * 0.1, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // 颜料点
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x - r * 0.4, y - r * 0.1, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e88e5';
        ctx.beginPath();
        ctx.arc(x - r * 0.5, y + r * 0.05, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43a047';
        ctx.beginPath();
        ctx.arc(x - r * 0.4, y + r * 0.25, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fdd835';
        ctx.beginPath();
        ctx.arc(x - r * 0.2, y + r * 0.35, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 画笔（右上）
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.4, y - r * 0.6);
        ctx.lineTo(x + r * 0.6, y);
        ctx.stroke();
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(x + r * 0.55, y - r * 0.1);
        ctx.lineTo(x + r * 0.7, y + r * 0.1);
        ctx.lineTo(x + r * 0.6, y + r * 0.15);
        ctx.lineTo(x + r * 0.45, y - r * 0.05);
        ctx.closePath();
        ctx.fill();
        // 脸
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.15, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // 圆框眼镜
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.18, r * 0.1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.2, y - r * 0.18, r * 0.1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.1, y - r * 0.18);
        ctx.lineTo(x + r * 0.1, y - r * 0.18);
        ctx.stroke();
        // 眼镜里的眼
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.18, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.2, y - r * 0.18, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // 头发（乱）
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y - r * 0.45, r * 0.3, Math.PI, 0);
        ctx.fill();
        for (var hi = 0; hi < 3; hi++) {
            ctx.beginPath();
            ctx.moveTo(x - r * 0.05 + hi * r * 0.1, y - r * 0.55);
            ctx.lineTo(x - r * 0.05 + hi * r * 0.1, y - r * 0.65);
            ctx.stroke();
        }
    },

    // 气急败坏的妃妃：古装郡主 + 怒发冲冠 + 跺脚
    drawFriendFeifei: function(ctx, x, y, r, color) {
        // 头发炸开（怒发冲冠 - 多条线向上散开）
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3;
        for (var fi = 0; fi < 9; fi++) {
            var fa = -Math.PI + (fi / 8) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(fa) * r * 0.2, y - r * 0.3 + Math.sin(fa) * r * 0.1);
            ctx.lineTo(x + Math.cos(fa) * r * 0.5, y - r * 0.6 + Math.sin(fa) * r * 0.05);
            ctx.stroke();
        }
        // 头顶火焰符号（怒气）
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.08, y - r * 0.7);
        ctx.quadraticCurveTo(x - r * 0.05, y - r * 0.85, x, y - r * 0.75);
        ctx.quadraticCurveTo(x + r * 0.05, y - r * 0.85, x + r * 0.08, y - r * 0.7);
        ctx.quadraticCurveTo(x + r * 0.05, y - r * 0.65, x, y - r * 0.68);
        ctx.quadraticCurveTo(x - r * 0.05, y - r * 0.65, x - r * 0.08, y - r * 0.7);
        ctx.fill();
        // 脸（通红）
        ctx.fillStyle = '#ffccbc';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.3, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        // 红脸蛋
        ctx.fillStyle = '#ff8a65';
        ctx.beginPath();
        ctx.arc(x - r * 0.13, y - r * 0.22, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.13, y - r * 0.22, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // 怒眉（倒八）
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.4);
        ctx.lineTo(x - r * 0.04, y - r * 0.36);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.04, y - r * 0.36);
        ctx.lineTo(x + r * 0.15, y - r * 0.4);
        ctx.stroke();
        // 怒眼（倒水滴）
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.09, y - r * 0.3);
        ctx.lineTo(x - r * 0.06, y - r * 0.22);
        ctx.lineTo(x - r * 0.12, y - r * 0.22);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.09, y - r * 0.3);
        ctx.lineTo(x + r * 0.06, y - r * 0.22);
        ctx.lineTo(x + r * 0.12, y - r * 0.22);
        ctx.closePath();
        ctx.fill();
        // 嘴（嘟嘴）
        ctx.fillStyle = '#d84315';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.15, r * 0.05, r * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();
        // 古装（粉色）
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.4, y - r * 0.05);
        ctx.lineTo(x - r * 0.65, y + r * 0.85);
        ctx.lineTo(x + r * 0.65, y + r * 0.85);
        ctx.lineTo(x + r * 0.4, y - r * 0.05);
        ctx.closePath();
        ctx.fill();
        // 衣领
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y - r * 0.1);
        ctx.lineTo(x, y + r * 0.1);
        ctx.lineTo(x + r * 0.15, y - r * 0.1);
        ctx.closePath();
        ctx.fill();
        // 跺脚（地面震动线）
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.75, y + r * 0.9);
        ctx.lineTo(x - r * 0.45, y + r * 0.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + r * 0.45, y + r * 0.85);
        ctx.lineTo(x + r * 0.75, y + r * 0.9);
        ctx.stroke();
        // 怒气符号 "!!"
        ctx.fillStyle = '#f44336';
        ctx.font = 'bold ' + (r * 0.25) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!!', x + r * 0.5, y - r * 0.1);
    },

    // ============================================================
    // 卡通渲染版 (v7.9) - 优先 PNG，回退 cartoon.js
    // ============================================================
    drawKnightToon: function(ctx, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, 'knight', 'idle', x, y, r)) return;
        drawKnightToon(ctx, x, y, r, color);
    },
    drawMageToon: function(ctx, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, 'mage', 'idle', x, y, r)) return;
        drawMageToon(ctx, x, y, r, color);
    },
    drawWarriorToon: function(ctx, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, 'warrior', 'idle', x, y, r)) return;
        drawWarriorToon(ctx, x, y, r, color);
    },
    drawAssassinToon: function(ctx, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, 'assassin', 'idle', x, y, r)) return;
        drawAssassinToon(ctx, x, y, r, color);
    },
    drawSummonerToon: function(ctx, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, 'summoner', 'idle', x, y, r)) return;
        drawSummonerToon(ctx, x, y, r, color);
    },
    drawSageToon: function(ctx, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, 'sage', 'idle', x, y, r)) return;
        drawSageToon(ctx, x, y, r, color);
    },
    drawNecromancerToon: function(ctx, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, 'necromancer', 'idle', x, y, r)) return;
        drawNecromancerToon(ctx, x, y, r, color);
    },
    drawSwordsmanToon: function(ctx, x, y, r, color) {
        this._ensureImages();
        if (this._tryDrawClassImage(ctx, 'swordsman', 'idle', x, y, r)) return;
        drawSwordsmanToon(ctx, x, y, r, color);
    }
};
