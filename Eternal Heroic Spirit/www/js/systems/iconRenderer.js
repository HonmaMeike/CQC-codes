// ========== 装备/宝石图标渲染系统 ==========
// 使用SVG文件优先，Canvas绘制作为后备

var IconRenderer = {
    _cache: {},
    ICON_SIZE: 64,
    USE_SVG: true,
    BASE_PATH: 'assets/images/',

    // 装备位 -> 默认SVG文件映射（无 type 信息时的兜底）
    EQUIP_SLOT_FILES: {
        weapon: 'weapon_sword.svg',
        offhand: 'offhand_shield.svg',
        helmet: 'helmet_universal.svg',
        armor: 'armor_universal.svg',
        boots: 'boots_universal.svg'
    },

    // 武器主手类型 -> SVG文件映射
    WEAPON_TYPE_FILES: {
        sword: 'weapon_sword.svg',
        staff: 'weapon_staff.svg',
        dagger: 'weapon_dagger.svg',
        tome: 'weapon_tome.svg',
        axe: 'weapon_axe.svg',
        scythe: 'weapon_scythe.svg',
        katana: 'weapon_katana.svg',
        orb: 'weapon_orb.svg'
    },

    // 副手类型 -> SVG文件映射
    OFFHAND_TYPE_FILES: {
        shield: 'offhand_shield.svg',
        tome: 'offhand_tome.svg',
        orb: 'offhand_orb.svg',
        dagger: 'offhand_dagger.svg',
        katana: 'offhand_katana.svg'
    },

    // 防具类型 -> SVG文件映射（helmet/armor/boots）
    ARMOR_TYPE_FILES: {
        heavy: { helmet: 'helmet_heavy.svg', armor: 'armor_heavy.svg', boots: 'boots_heavy.svg' },
        mage:  { helmet: 'helmet_mage.svg',  armor: 'armor_mage.svg',  boots: 'boots_mage.svg' },
        light: { helmet: 'helmet_light.svg', armor: 'armor_light.svg', boots: 'boots_light.svg' },
        universal: { helmet: 'helmet_universal.svg', armor: 'armor_universal.svg', boots: 'boots_universal.svg' }
    },

    // 宝石 -> SVG文件映射（与 data/gems.js GEM_TYPES.id 一一对应）
    //   v4.2 修复: 之前 onyx/citrine 是错误的旧命名, 现与 gems.js 完全对齐 (obsidian/moonstone/amber)
    GEM_FILES: {
        ruby: 'gem_ruby.svg',
        sapphire: 'gem_sapphire.svg',
        topaz: 'gem_topaz.svg',
        emerald: 'gem_emerald.svg',
        obsidian: 'gem_obsidian.svg',     // 复合 atk + dmgBonus (黑曜石, 旧名 onyx 已废)
        moonstone: 'gem_moonstone.svg',   // 复合 def + dmgReduction (月光石, 旧映射缺失)
        amethyst: 'gem_amethyst.svg',
        amber: 'gem_amber.svg'            // 复合 hp + healRate (琥珀, 旧名 citrine 已废)
    },

    // ===== 新主接口：根据装备对象返回对应图标 =====
    // item: { slot, weaponType, armorType }
    getEquipIcon: function(item) {
        if (!item) return this.BASE_PATH + this.EQUIP_SLOT_FILES.weapon;
        var slot = item.slot;
        var key = 'equip_' + slot + '_' + (item.weaponType || '') + '_' + (item.armorType || '');
        if (this._cache[key]) return this._cache[key];

        var file = null;
        if (slot === 'weapon') {
            file = this.WEAPON_TYPE_FILES[item.weaponType] || this.EQUIP_SLOT_FILES.weapon;
        } else if (slot === 'offhand') {
            file = this.OFFHAND_TYPE_FILES[item.weaponType] || this.EQUIP_SLOT_FILES.offhand;
        } else if (slot === 'helmet' || slot === 'armor' || slot === 'boots') {
            var armorMap = this.ARMOR_TYPE_FILES[item.armorType] || this.ARMOR_TYPE_FILES.universal;
            file = armorMap[slot] || this.EQUIP_SLOT_FILES[slot];
        } else {
            file = this.EQUIP_SLOT_FILES.weapon;
        }
        var result = this.BASE_PATH + file;
        this._cache[key] = result;
        return result;
    },

    // 获取图标（返回图片URL）— 向后兼容旧接口
    getIcon: function(type, id, quality) {
        var key = type + '_' + id + '_' + (quality || 0);
        if (this._cache[key]) return this._cache[key];

        var result = null;
        if (type === 'equip_slot' && this.EQUIP_SLOT_FILES[id]) {
            result = this.BASE_PATH + this.EQUIP_SLOT_FILES[id];
        } else if (type === 'gem' && this.GEM_FILES[id]) {
            result = this.BASE_PATH + this.GEM_FILES[id];
        } else {
            // 后备Canvas绘制（异步转dataURL）
            result = this._renderCanvasIcon(type, id);
        }
        this._cache[key] = result;
        return result;
    },

    // 后备Canvas绘制
    _renderCanvasIcon: function(type, id) {
        var s = this.ICON_SIZE;
        var canvas = document.createElement('canvas');
        canvas.width = s;
        canvas.height = s;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        if (type === 'equip_slot') {
            this.drawEquipSlot(ctx, id);
        } else if (type === 'gem') {
            this.drawGem(ctx, id);
        }
        return canvas.toDataURL('image/png');
    },

    // 清空缓存
    clearCache: function() {
        this._cache = {};
    },

    // ===== 装备位图标（Canvas后备） =====

    drawEquipSlot: function(ctx, slotId) {
        var s = this.ICON_SIZE;
        ctx.clearRect(0, 0, s, s);
        switch (slotId) {
            case 'weapon': this._drawSword(ctx, s); break;
            case 'offhand': this._drawShield(ctx, s); break;
            case 'helmet': this._drawHelmet(ctx, s); break;
            case 'armor': this._drawArmor(ctx, s); break;
            case 'boots': this._drawBoots(ctx, s); break;
            default: this._drawDefault(ctx, s, slotId);
        }
    },

    _drawSword: function(ctx, s) {
        var cx = s / 2, cy = s / 2;
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy + 14);
        ctx.lineTo(cx - 2, cy - 14);
        ctx.lineTo(cx + 2, cy - 14);
        ctx.lineTo(cx + 3, cy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 8, cy + 12, 16, 3);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(cx - 2, cy + 15, 4, 6);
    },

    _drawShield: function(ctx, s) {
        var cx = s / 2, cy = s / 2;
        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy - 15);
        ctx.lineTo(cx + 14, cy - 15);
        ctx.lineTo(cx + 16, cy + 2);
        ctx.lineTo(cx + 10, cy + 13);
        ctx.lineTo(cx, cy + 21);
        ctx.lineTo(cx - 10, cy + 13);
        ctx.lineTo(cx - 16, cy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx, cy + 12);
        ctx.moveTo(cx - 6, cy + 2);
        ctx.lineTo(cx + 6, cy + 2);
        ctx.stroke();
    },

    _drawHelmet: function(ctx, s) {
        var cx = s / 2, cy = s / 2;
        ctx.fillStyle = '#78909c';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 10);
        ctx.lineTo(cx, cy - 18);
        ctx.lineTo(cx + 4, cy - 10);
        ctx.closePath();
        ctx.fill();
    },

    _drawArmor: function(ctx, s) {
        var cx = s / 2, cy = s / 2;
        ctx.fillStyle = '#42a5f5';
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy - 10);
        ctx.lineTo(cx + 14, cy - 10);
        ctx.lineTo(cx + 16, cy + 6);
        ctx.lineTo(cx + 6, cy + 20);
        ctx.lineTo(cx, cy + 22);
        ctx.lineTo(cx - 6, cy + 20);
        ctx.lineTo(cx - 16, cy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 10, cy + 10, 20, 3);
    },

    _drawBoots: function(ctx, s) {
        var cx = s / 2, cy = s / 2;
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.roundRect(cx - 14, cy - 4, 11, 16, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(cx + 3, cy - 4, 11, 16, 2);
        ctx.fill();
        ctx.fillStyle = '#78909c';
        ctx.fillRect(cx - 14, cy + 8, 11, 4);
        ctx.fillRect(cx + 3, cy + 8, 11, 4);
    },

    _drawDefault: function(ctx, s, id) {
        var cx = s / 2, cy = s / 2;
        ctx.fillStyle = '#546e7a';
        ctx.beginPath();
        ctx.roundRect(cx - 12, cy - 12, 24, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy);
    },

    // ===== 宝石图标（Canvas后备） =====

    drawGem: function(ctx, gemTypeId) {
        var s = this.ICON_SIZE;
        var cx = s / 2, cy = s / 2;
        var gemColors = {
            ruby: '#e53935',
            sapphire: '#2196f3',
            topaz: '#ffeb3b',
            emerald: '#4caf50',
            obsidian: '#212121',   // 黑曜石 (深黑带蓝反射)
            moonstone: '#b0bec5', // 月光石 (冷银灰)
            amethyst: '#9c27b0',
            amber: '#ff9800'       // 琥珀 (橙黄)
        };
        var c = gemColors[gemTypeId] || gemColors.ruby;
        ctx.clearRect(0, 0, s, s);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 18);
        ctx.lineTo(cx + 16, cy);
        ctx.lineTo(cx, cy + 18);
        ctx.lineTo(cx - 16, cy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff66';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 主高光
        ctx.fillStyle = '#ffffff88';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 6, 3, 0, Math.PI * 2);
        ctx.fill();
        // 月光石额外中心冷光 (体现 adularescence 特征)
        if (gemTypeId === 'moonstone') {
            ctx.fillStyle = '#e1f5feaa';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // ===== 批量预渲染（仅Canvas后备需要）=====
    preRenderAll: function() {
        // SVG文件无需预渲染，浏览器会缓存
        // 此函数保留向后兼容
        if (!this.USE_SVG) {
            var slots = ['weapon', 'offhand', 'helmet', 'armor', 'boots'];
            for (var i = 0; i < slots.length; i++) {
                this.getIcon('equip_slot', slots[i]);
            }
            var gemTypes = ['ruby', 'sapphire', 'topaz', 'emerald', 'obsidian', 'moonstone', 'amethyst', 'amber'];
            for (var i = 0; i < gemTypes.length; i++) {
                this.getIcon('gem', gemTypes[i]);
            }
        }
    }
};
