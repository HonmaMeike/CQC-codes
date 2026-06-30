// ========== 装备图标映射 v6.4（精细分类）==========
// 来源: E:\A_001\SUCAI\装备\
// 分类: 长剑/匕首/弓箭/法杖/法球法典/盾牌/戒指/项链/头盔/法师帽/护甲/法师袍/鞋子

var EQUIP_ICON_MAP = {};

// ===== 武器图标（按 weaponType 细分）=====
EQUIP_ICON_MAP._weaponType = {
    sword:    ['长剑_63.png','长剑_64.png','长剑_65.png','长剑_66.png','长剑_67.png','长剑_68.png','长剑_69.png','长剑_70.png','长剑_71.png'],
    dagger:   ['匕首_72.png','匕首_73.png','匕首_74.png','匕首_75.png','匕首_76.png','匕首_77.png'],
    bow:      ['弓箭_86.png','弓箭_87.png','弓箭_88.png','弓箭_89.png'],
    staff:    ['法杖_78.png','法杖_79.png','法杖_80.png','法杖_81.png','法杖_82.png','法杖_83.png','法杖_84.png','法杖_85.png'],
    // 以下类型合并到法球池
    orb:      ['法球、法典_huaban-1781994660690.png','法球、法典_huaban-1781994693313.png','法球、法典_huaban-2865979204.png','法球、法典_huaban-2865979208.png','法球、法典_huaban-2865979211.png','法球、法典_huaban-2865979215.png','法球、法典_huaban-2865979218.png','法球、法典_huaban-2865979222.png','法球、法典_huaban-2865979226.png','法球、法典_huaban-2865979230.png','法球、法典_huaban-2865979233.png','法球、法典_huaban-2865979236.png','法球、法典_huaban-2865979240.png'],
    tome:     ['法球、法典_huaban-1781994660690.png','法球、法典_huaban-1781994693313.png','法球、法典_huaban-2865979204.png','法球、法典_huaban-2865979208.png','法球、法典_huaban-2865979211.png','法球、法典_huaban-2865979215.png','法球、法典_huaban-2865979218.png','法球、法典_huaban-2865979222.png','法球、法典_huaban-2865979226.png'],
    wand:     ['法球、法典_huaban-2865979230.png','法球、法典_huaban-2865979233.png','法球、法典_huaban-2865979236.png','法球、法典_huaban-2865979240.png','法球、法典_huaban-1781994660690.png'],
    spear:    ['长剑_63.png','长剑_65.png'],  // 矛/枪用剑图标池
    whip:     ['匕首_72.png','匕首_74.png'],   // 鞭用匕首池
    torch:    ['法杖_78.png','法杖_79.png'],   // 火炬用法杖池
};

// ===== 副手图标（按 weaponType 或无武器类型细分）=====
EQUIP_ICON_MAP._offhandType = {
    shield:   ['盾牌_huaban-5138248182.png','盾牌_huaban-5640393038.png','盾牌_huaban-5640393057.png','盾牌_huaban-5640393065.png','盾牌_huaban-5640393072.png','盾牌_huaban-5640393080.png','盾牌_huaban-5640393088.png','盾牌_huaban-5640393095.png','盾牌_huaban-5640393103.png','盾牌_huaban-5640393113.png'],
    ring:     ['戒指_100.png','戒指_101.png','戒指_102.png','戒指_103.png','戒指_104.png','戒指_105.png','戒指_106.png','戒指_90.png','戒指_91.png','戒指_92.png','戒指_93.png','戒指_94.png','戒指_95.png','戒指_96.png','戒指_97.png','戒指_98.png','戒指_99.png'],
    necklace: ['项链_107.png','项链_108.png','项链_109.png','项链_110.png','项链_111.png','项链_112.png','项链_113.png','项链_114.png','项链_115.png'],
    // 法球/匕首等副手武器用武器池
    dagger:   EQUIP_ICON_MAP._weaponType ? EQUIP_ICON_MAP._weaponType.dagger : null,
    orb:      EQUIP_ICON_MAP._weaponType ? EQUIP_ICON_MAP._weaponType.orb : null,
    tome:     EQUIP_ICON_MAP._weaponType ? EQUIP_ICON_MAP._weaponType.tome : null,
    wand:     EQUIP_ICON_MAP._weaponType ? EQUIP_ICON_MAP._weaponType.wand : null,
};

// ===== 头盔图标（按 armorType 细分）=====
EQUIP_ICON_MAP._helmetType = {
    heavy:    ['头盔_48.png','头盔_49.png','头盔_50.png','头盔_51.png','头盔_52.png','头盔_54.png','头盔_55.png','头盔_56.png','头盔_57.png','头盔_60.png','头盔_17.png'],
    mage:     ['法师帽_58.png','法师帽_59.png','法师帽_61.png','法师帽_62.png'],
    light:    ['法师帽_58.png','法师帽_59.png','头盔_53.png'],
    universal:['头盔_50.png','头盔_53.png','头盔_55.png','法师帽_61.png'],
};

// ===== 护甲图标（按 armorType 细分）=====
EQUIP_ICON_MAP._armorType = {
    heavy:    ['护甲_32.png','护甲_33.png','护甲_34.png','护甲_35.png','护甲_36.png','护甲_39.png','护甲_40.png','护甲_44.png','护甲_45.png','护甲_46.png','护甲_47.png','护甲_43.png'],
    mage:     ['法师袍_30.png','法师袍_31.png','法师袍_37.png','法师袍_38.png','法师袍_41.png','法师袍_42.png'],
    light:    ['法师袍_30.png','法师袍_31.png','护甲_36.png'],
    universal:['护甲_32.png','护甲_34.png','法师袍_37.png','护甲_45.png'],
};

// ===== 鞋子图标（按 armorType 细分）=====
EQUIP_ICON_MAP._bootsType = {
    heavy:    ['鞋子_3.png','鞋子_4.png','鞋子_5.png','鞋子_9.png','鞋子_13.png','鞋子_14.png','鞋子_15.png','鞋子_19.png','鞋子_20.png'],
    mage:     ['鞋子_7.png','鞋子_8.png','鞋子_10.png','鞋子_12.png'],
    light:    ['鞋子_1.png','鞋子_2.png','鞋子_6.png','鞋子_10.png','鞋子_11.png','鞋子_12.png'],
    universal:['鞋子_1.png','鞋子_5.png','鞋子_13.png','鞋子_15.png'],
};

// ===== 槽位默认图标 =====
EQUIP_ICON_MAP.weapon   = ['长剑_63.png'];
EQUIP_ICON_MAP.offhand  = ['盾牌_huaban-5138248182.png'];
EQUIP_ICON_MAP.helmet   = ['头盔_50.png'];
EQUIP_ICON_MAP.armor    = ['护甲_32.png'];
EQUIP_ICON_MAP.boots    = ['鞋子_1.png'];

// ====== 图标查找函数 ======
function getEquipIcon(slotId, seed, equipData) {
    var icons = null;
    
    // 1. 先根据 slot + weaponType/armorType 精确定位
    if (equipData && equipData.weaponType) {
        if (slotId === 'offhand') {
            // 副手武器用武器池
            var wtIcons = EQUIP_ICON_MAP._weaponType[equipData.weaponType];
            if (wtIcons) icons = wtIcons;
        } else if (slotId === 'weapon') {
            var wtIcons2 = EQUIP_ICON_MAP._weaponType[equipData.weaponType];
            if (wtIcons2) icons = wtIcons2;
        }
    }
    
    // 2. 副手非武器用副手类型
    if (!icons && slotId === 'offhand' && equipData && equipData.weaponType) {
        var otIcons = EQUIP_ICON_MAP._offhandType[equipData.weaponType];
        if (otIcons) icons = otIcons;
    }
    
    // 3. 头盔/护甲/鞋子按 armorType
    if (!icons && equipData && equipData.armorType) {
        if (slotId === 'helmet') {
            var htIcons = EQUIP_ICON_MAP._helmetType[equipData.armorType];
            if (htIcons) icons = htIcons;
        } else if (slotId === 'armor') {
            var atIcons = EQUIP_ICON_MAP._armorType[equipData.armorType];
            if (atIcons) icons = atIcons;
        } else if (slotId === 'boots') {
            var btIcons = EQUIP_ICON_MAP._bootsType[equipData.armorType];
            if (btIcons) icons = btIcons;
        }
    }
    
    // 4. 副手无武器类型默认戒指
    if (!icons && slotId === 'offhand' && equipData && !equipData.weaponType) {
        icons = EQUIP_ICON_MAP._offhandType['ring'];
    }
    
    // 5. 兜底：槽位默认池
    if (!icons || icons.length === 0) {
        icons = EQUIP_ICON_MAP[slotId];
    }
    
    if (!icons || icons.length === 0) return null;
    
    // 用 ID 哈希固定图标
    var index = 0;
    if (seed) {
        var h = 0;
        for (var i = 0; i < seed.length; i++) {
            h = ((h << 5) - h) + seed.charCodeAt(i);
            h |= 0;
        }
        index = Math.abs(h) % icons.length;
    } else {
        index = Math.floor(Math.random() * icons.length);
    }
    return 'assets/images/equip/' + icons[index];
}

// 获取显示用的图标 HTML
function getSlotIcon(slotId, equipId, equipData) {
    var path = getEquipIcon(slotId, equipId, equipData);
    if (path) {
        return '<img src="' + path + '" style="width:28px;height:28px;object-fit:contain;" onerror="this.style.display=\'none\'">';
    }
    return '📦';
}

// ====== 宝石图标 ======
EQUIP_ICON_MAP._gemIcons = {
    ruby:      '宝石_红宝石.png',
    sapphire:  '宝石_蓝宝石.png',
    emerald:   '宝石_绿宝石.png',
    topaz:     '宝石_黄宝石.png',
    amethyst:  '宝石_紫水晶.png',
    diamond:   '宝石_钻石.png',
    amber:     '宝石_琥珀.png',
    jade:      '宝石_翡翠.png',
    onyx:      '宝石_缟玛瑙.png',
    obsidian:  '宝石_黑曜石.png',
    moonstone: '宝石_月光石.png',
    aquamarine:'宝石_海蓝石.png',
};

function getGemIcon(gemTypeId) {
    var fn = EQUIP_ICON_MAP._gemIcons[gemTypeId];
    if (fn) return 'assets/images/equip/' + fn;
    return null;
}

function getGemIconHtml(gemTypeId, size) {
    size = size || 24;
    var path = getGemIcon(gemTypeId);
    if (path) {
        return '<img src="' + path + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain;" onerror="this.innerHTML=\'💎\'">';
    }
    return '💎';
}
