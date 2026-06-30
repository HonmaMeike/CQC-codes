/* global ConfigLoader, Formulas */
/* exported EQUIP_SLOTS, AFFIX_POOL, QUALITY, QUALITY_MULT, QUALITY_MAX_AFFIX, QUALITY_SOCKETS */

// ========== 装备/词条数据（v2 — 数据从 ConfigLoader 读取）==========
// 数据来源：data/game_config.json
// 游戏启动时通过 ConfigLoader.syncLoad() 同步预加载，
// 失败/缺字段时降级到内置的 _FALLBACK_* 兜底数据。

(function () {
    'use strict';

    // ---------- 1. 同步预加载 ConfigLoader ----------
    try {
        if (typeof ConfigLoader !== 'undefined' && ConfigLoader.syncLoad) {
            ConfigLoader.syncLoad();
        }
    } catch (e) {
        if (typeof console !== 'undefined' && console.warn) {
            console.warn('[equipment.js] ConfigLoader.syncLoad failed, using fallback', e);
        }
    }

    // ---------- 2. 兜底数据（与原 equipment.js 等价）----------

    var _FALLBACK_EQUIP_SLOTS = [
        { id: 'weapon', name: '武器', icon: 'assets/images/equip/63.png', baseStat: { id: 'atk_flat', stat: 'atk', name: '攻击力', icon: '⚔️', basePerLvl: 6 } },
        { id: 'offhand', name: '副手', icon: 'assets/images/equip/108.png', baseStat: { id: 'def_flat', stat: 'def', name: '防御力', icon: '🛡', basePerLvl: 5 } },
        { id: 'helmet', name: '头盔', icon: 'assets/images/equip/50.png', baseStat: { id: 'hp_flat', stat: 'hp', name: '生命', icon: '❤️', basePerLvl: 22 } },
        { id: 'armor', name: '护甲', icon: 'assets/images/equip/30.png', baseStat: { id: 'def_flat', stat: 'def', name: '防御力', icon: '🛡', basePerLvl: 5 } },
        { id: 'boots', name: '鞋子', icon: 'assets/images/equip/1.png', baseStat: { id: 'spd', stat: 'spd', name: '速度', icon: '💨', basePerLvl: 3 } }
    ];

    // ★ v4.1 同步 game_config.json 的 v3.x 平衡值 (之前 file:// 模式读不到 JSON 时用旧版会超模)
    var _FALLBACK_AFFIX_POOL = [
        // ★ v2.6.4 Round 11 平衡调整: 词条属性稍微加 + 拉品质差
        //   之前 Round 8 砍太狠: 白绿蓝紫 4 档品质差几乎为 0
        //   现在 6 档品质差: 白装 1× → 金装 7-10×
        //   配合 levelMult 0.02/级 (LV37=1.72x, LV50=1.98x, LV100=2.98x) — 不爆炸
        //   单件 LV37 金装: 词条 max × 1.72 = 期望总值
        { id: 'atk_flat', name: '攻击力', stat: 'atk', type: 'flat', weight: 10, min: [3, 6, 9, 15, 24, 33], max: [6, 9, 15, 21, 30, 45] },
        { id: 'atk_pct', name: '攻击%', stat: 'atk', type: 'pct', weight: 8, min: [3, 3, 6, 9, 15, 18], max: [3, 6, 9, 12, 15, 21] },
        { id: 'def_flat', name: '防御力', stat: 'def', type: 'flat', weight: 10, min: [3, 6, 9, 12, 21, 30], max: [6, 9, 12, 18, 27, 42] },
        { id: 'def_pct', name: '防御%', stat: 'def', type: 'pct', weight: 8, min: [3, 3, 6, 9, 12, 15], max: [3, 6, 9, 9, 12, 18] },
        { id: 'hp_flat', name: '生命', stat: 'hp', type: 'flat', weight: 10, min: [9, 18, 30, 48, 72, 96], max: [18, 30, 45, 66, 96, 150] },
        { id: 'hp_pct', name: '生命%', stat: 'hp', type: 'pct', weight: 8, min: [3, 3, 6, 9, 12, 15], max: [3, 6, 9, 9, 12, 18] },
        { id: 'spd', name: '速度', stat: 'spd', type: 'flat', weight: 6, min: [3, 3, 6, 6, 9, 12], max: [6, 6, 9, 12, 15, 24] },
        { id: 'crit', name: '暴击率', stat: 'crit', type: 'flat', weight: 5, min: [3, 3, 3, 3, 6, 6], max: [3, 3, 6, 6, 9, 12] },
        { id: 'crit_dmg', name: '暴击伤害', stat: 'critDmg', type: 'flat', weight: 5, min: [3, 3, 6, 9, 15, 18], max: [3, 6, 9, 15, 18, 27] },
        { id: 'elem_mastery', name: '元素精通', stat: 'elemMastery', type: 'flat', weight: 4, min: [3, 3, 3, 6, 9, 12], max: [3, 6, 6, 9, 12, 18] },
        { id: 'phys_mastery', name: '物理精通', stat: 'physMastery', type: 'flat', weight: 4, min: [3, 3, 3, 6, 9, 12], max: [3, 6, 6, 9, 12, 18] },
        { id: 'heal_bonus', name: '治疗加成', stat: 'healBonus', type: 'flat', weight: 3, min: [3, 3, 3, 3, 6, 9], max: [3, 3, 6, 9, 12, 15] },
        { id: 'effect_hit', name: '效果命中', stat: 'effectHit', type: 'flat', weight: 3, min: [3, 3, 3, 6, 9, 12], max: [3, 6, 6, 9, 12, 15] },
        { id: 'effect_res', name: '效果抵抗', stat: 'effectRes', type: 'flat', weight: 3, min: [3, 3, 3, 6, 9, 12], max: [3, 6, 6, 9, 12, 15] },
        { id: 'exp_bonus', name: '经验加成', stat: 'expBonus', type: 'flat', weight: 2, min: [3, 3, 3, 6, 9, 12], max: [3, 3, 6, 9, 12, 15] },
        { id: 'loot_bonus', name: '掉落加成', stat: 'lootBonus', type: 'flat', weight: 1, min: [3, 3, 3, 3, 6, 6], max: [3, 3, 3, 6, 9, 12] }
    ];

    // ★ v4.1 同步 JSON v3.x 平衡值: 金装倍率 2.7x → 2.0x (跨度从 2.7× 收敛到 2.0×)
    var _FALLBACK_QUALITY_MULT = [1.0, 1.3, 1.7, 2.2, 3.0, 4.0];

    var _FALLBACK_WEAPON_TYPES_BY_SLOT = {
        // ★ v4.2 修复: 'orb' 之前错放在 weapon slot, 但无任何职业的 weaponType=='orb' (mage/sage 是 offhand)
        //   → 随机掉"武器法球" → 玩家什么职业都装不上 → 占背包. 现已移除
        weapon: ['sword', 'staff', 'dagger', 'tome', 'axe', 'scythe', 'katana'],
        offhand: ['shield', 'tome', 'orb', 'dagger', 'katana']
    };

    var _FALLBACK_WEAPON_TYPE_NAMES = {
        sword: '剑', staff: '法杖/魔杖', dagger: '匕首',
        tome: '法书/秘典', axe: '战斧', scythe: '镰刀',
        katana: '太刀', shield: '盾牌', orb: '法球'
    };

    var _FALLBACK_ARMOR_TYPE_NAMES = { heavy: '重甲', mage: '法系布甲', light: '轻甲', universal: '通用' };

    var _FALLBACK_CLASS_ARMOR_MAP = {
        knight: ['heavy'], mage: ['mage'], assassin: ['light'], summoner: ['mage'],
        warrior: ['heavy'], sage: ['mage'], necromancer: ['mage'], swordsman: ['light']
    };

    // ★ v4.2 扩展: 每个武器类型池扩充到 14-22 条, 主题与对应职业匹配
    //   适配: knight→sword / mage/sage→staff / assassin→dagger / summoner/necromancer→tome
    //         warrior→axe / necromancer→scythe / swordsman→katana
    var _FALLBACK_WEAPON_NAMES_BY_TYPE = {
        sword: [
            // 原有
            '审判巨剑', '骨剑', '王剑', '勇者之剑', '圣光之剑', '暗影之剑', '龙息之剑', '破晓', '黄昏', '星辰之刃', '霜噬', '龙骨巨剑', '审判之剑', '嗜血魔剑', '冰晶刺剑', '狮王之剑',
            // 新增 (骑士 — 神圣/勇气/守护主题)
            '苍蓝圣剑', '黎明之刃', '帝国之剑', '风暴之剑', '圣裁者', '铁誓之剑', '太阳王之剑', '胜利之刃', '银月圣剑', '炽焰之刃', '圣印之剑', '守誓者', '净化之剑', '战歌之剑', '永恒誓约', '圣裁之剑'
        ],
        staff: [
            // 原有
            '大天使之杖', '巫师法杖', '秘法之杖', '回想之杖', '元素之杖', '星辰法杖', '虚空法杖', '永恒之杖', '霜冻之杖', '烈焰法杖', '奥术之杖', '时光之杖', '唤星之杖', '龙息法杖', '魔力洪流', '元素调和',
            // 新增 (法师/贤者 — 奥术/智慧/元素主题)
            '命运之杖', '雷鸣之杖', '智慧之杖', '星界之杖', '苍穹之柱', '末日预言', '凤凰之杖', '时间之杖', '灵魂回响', '创世之杖', '守护之杖', '暴君之怒', '神使之杖', '净焰之杖', '真理之杖', '咒文权杖'
        ],
        dagger: [
            // 原有
            '暗影之牙', '毒刃', '幻影匕首', '割喉者', '夜刃', '血刺', '流影刃', '淬毒匕首', '影袭',
            // 新增 (刺客 — 毒/暗影/血主题)
            '噬心者', '寒蝉', '暗月之吻', '血蔷薇', '午夜凶刃', '冰锥', '暮光之刃', '黑羽', '食魂者', '暮刃', '血宴', '凋零', '断喉', '寂灭', '影绣', '寒刺', '怨灵之匕', '噬魂刃'
        ],
        tome: [
            // 原有
            '奥秘法典', '虚空秘典', '恶魔之书', '时光之书', '死灵之书', '禁忌之书', '贤者之石',
            // 新增 (召唤师/亡灵法师 — 召唤/恶魔/死灵主题)
            '暗影契约', '灵魂之书', '召唤秘典', '异界之门', '死亡之书', '幽冥之书', '暗影圣经', '禁咒', '血之书', '灵界之书', '混沌法典', '死灵秘典', '灵语之书', '远古之书', '失落之书', '末日预言书', '灵魂典籍', '暗黑真经'
        ],
        axe: [
            // 原有
            '雷霆战斧', '裂地战斧', '巨人粉碎者', '狂怒之斧', '霜冻战斧', '炎魔锤', '鲜血战斧',
            // 新增 (战士 — 狂暴/血/战争主题)
            '碎山斧', '战争之斧', '怒斩', '破晓斧', '蛮王之斧', '蛮荒之斧', '碎颅者', '战嚎', '屠龙斧', '嗜血之斧', '山崩', '巨人之握', '战争使者', '断罪者', '劈山斧', '战怒之斧', '狂战斧', '风暴斧', '银斧', '毁灭之斧'
        ],
        scythe: [
            // 原有
            '深渊之镰', '灵魂收割者', '死亡镰刀', '虚空镰刀', '骨镰', '死神之镰', '暗影之镰',
            // 新增 (亡灵法师 — 死/收割/冥界主题)
            '收割者', '末日之镰', '灵魂收割', '凋零之镰', '沉默之镰', '死亡信使', '嗜魂镰', '死灵之镰', '黄昏之镰', '寂灭镰刀', '冥王之镰', '永夜镰刀', '轮回之镰', '寒霜之镰', '暗影死镰', '亡者之镰', '终结之镰', '亡魂收割'
        ],
        katana: [
            // 原有
            '村雨', '鬼切', '天丛云', '斩魔刀', '影月', '风行者', '千本樱', '雪走',
            // 新增 (剑客 — 刀/风/月/雷主题)
            '霜月', '雾隐', '红月', '樱花', '寒月', '雷切', '紫电', '龙月', '苍月', '风切', '雷光', '晓', '疾风', '雾雨', '苍岚', '夜叉', '飞燕', '霜刃', '夜鸦', '雪风', '千羽'
        ]
    };

    // ★ v4.2 扩展: 副手池扩充 (重点补 dagger 5→14, katana 3→9, 之前太薄)
    var _FALLBACK_OFFHAND_NAMES_BY_TYPE = {
        shield: [
            // 原有
            '圣光之盾', '龙鳞盾', '精灵之盾', '符文之盾', '龙骨盾', '不灭之盾', '荆棘之盾', '远古之盾', '铁壁之盾', '圣旗',
            // 新增 (骑士/战士)
            '圣盾', '神木盾', '永夜之盾', '寒铁盾', '钻石盾', '银月之盾', '阳炎盾', '钢铁壁垒', '寒冰之盾', '圣光壁垒', '钢之盾', '王者之盾'
        ],
        orb: [
            // 原有
            '灵能球', '暗影宝珠', '星辰法器', '元素之心', '暗月之印', '虚空宝珠', '凤凰之羽', '龙魂宝珠', '混沌之球', '星辉之球',
            // 新增 (法师/贤者)
            '灵能宝珠', '幽冥宝珠', '月之宝珠', '太阳宝珠', '雷鸣宝珠', '寒冰宝珠', '烈焰宝珠', '紫电宝珠', '圣光宝珠', '星空宝珠', '碧海宝珠', '翠玉宝珠', '苍雷宝珠'
        ],
        tome: [
            // 原有
            '奥秘法典', '元素之书', '恶魔之书', '贤者之石', '光辉圣典', '虚空秘典', '时光之书', '死灵之书', '禁忌之书', '自然之书',
            // 新增 (召唤师/亡灵法师)
            '灵魂典籍', '灵语之书', '死亡真经', '恶魔法典', '虚空之书', '元素典籍', '召唤之书', '灵界典籍', '沉默之书', '死灵秘典'
        ],
        dagger: [
            // 原有
            '影刃', '短刃', '手里剑', '苦无', '淬毒短刃',
            // 新增 (刺客)
            '飞刀', '暗器', '飞刃', '短匕', '飞镖', '袖箭', '毒针', '寒铁小刀', '暗刃', '淬毒飞针', '夜行飞刃'
        ],
        katana: [
            // 原有
            '肋差', '小太刀', '肋差剑',
            // 新增 (剑客 — 备刀/短刀)
            '短刀', '半太刀', '打刀', '怀剑', '短胁', '备用刀', '小肋差', '战斗短刀'
        ]
    };

    // ★ v4.2 扩展: 防具池扩充 (heavy 9-11→15-18, mage/light/universal 也加)
    var _FALLBACK_ARMOR_NAMES_BY_TYPE = {
        heavy: {
            helmet: [
                '铁盔', '钢盔', '龙首盔', '龙角之盔', '兽王战盔', '无畏战盔', '不朽战盔', '龙骨战盔', '远古铁面', '狮王头盔',
                // 新增 (骑士/战士)
                '钢之王冠', '银铁头盔', '战王之盔', '圣堂盔', '战神圣盔', '钢铁面甲', '圣光战盔'
            ],
            armor: [
                '锁甲', '板甲', '龙鳞甲', '暗影战甲', '不朽板甲', '圣光板甲', '龙骨战甲', '不朽战铠', '远古板甲', '龙血战甲', '狮心战甲',
                // 新增
                '钢甲', '银甲', '战王甲', '钢之壁垒', '圣堂甲', '钢铁战衣', '圣光战甲', '龙血圣甲'
            ],
            boots: [
                '铁靴', '钢靴', '龙鳞靴', '龙鳞战靴', '不朽战靴', '龙骨战靴', '远古胫甲', '狮王战靴', '无畏之靴',
                // 新增
                '战靴', '钢之靴', '战王之靴', '圣堂靴', '钢铁之靴', '龙血战靴'
            ]
        },
        mage: {
            helmet: [
                '法师帽', '智慧之冠', '秘术之冠', '星辰之冕', '精灵王冠', '永恒王冠', '奥术之冠', '召唤师兜帽', '圣光头环',
                // 新增 (法师/召唤/贤者/亡灵)
                '奥术之冠', '真理之冠', '大法师之冠', '元素之冠', '仙灵之冠', '灵语兜帽', '智慧星冠'
            ],
            armor: [
                '法袍', '星辰法袍', '深渊法袍', '虚空法袍', '秘法长袍', '大贤者法袍', '奥术编织者', '月光法袍',
                // 新增
                '仙灵法袍', '真理法袍', '圣光法袍', '大法师法袍', '元素法袍', '灵语法袍', '奥术织法袍', '召唤法袍'
            ],
            boots: [
                '法靴', '星辰之靴', '虚空之靴', '秘法之靴', '奥术之靴', '贤者便鞋', '元素之履',
                // 新增
                '真理之靴', '圣光之靴', '元素之靴', '仙灵之靴', '灵语之靴', '智慧便鞋', '召唤法鞋'
            ]
        },
        light: {
            helmet: [
                '暗影面具', '刺客面罩', '幽冥鬼面', '深渊面具', '暗影兜帽', '凤凰之冠', '鬼面',
                // 新增 (刺客/剑客)
                '夜行兜帽', '银影面具', '幻影面具', '暗杀者面罩', '暗影冠', '夜鸦面具', '风行者面甲'
            ],
            armor: [
                '暗夜皮甲', '精灵链甲', '霜鳞甲', '炎魔胸甲', '凤凰羽衣', '龙魂战甲', '风行者皮甲', '影袭轻甲',
                // 新增
                '夜行衣', '银影甲', '幻影甲', '暗杀者甲', '暗影轻甲', '风行者轻甲', '霜月皮甲'
            ],
            boots: [
                '暗影步靴', '霜冻行者', '炎魔之靴', '深渊之靴', '风行者之靴', '影步', '圣光之靴',
                // 新增
                '银影靴', '幻影靴', '暗杀者靴', '夜行之靴', '霜月步靴', '疾风轻靴', '风行者步靴'
            ]
        },
        universal: {
            helmet: [
                '星辰冠冕', '不朽王冠', '圣光之冠',
                // 新增
                '王者冠', '圣者之冠', '神使之冠', '星辉冕', '永恒圣冠'
            ],
            armor: [
                '布甲', '精灵链甲',
                // 新增
                '神使之衣', '圣者之衣', '王者之袍', '星辉法衣', '永恒圣袍'
            ],
            boots: [
                '布靴', '疾风靴', '凤凰之履',
                // 新增
                '神使之履', '圣者之履', '王者之靴', '星辉便鞋', '永恒圣靴'
            ]
        }
    };

    var _FALLBACK_WEAPON_TYPE_NAMES = {
        sword: '剑', staff: '法杖/魔杖', dagger: '匕首',
        tome: '法书/秘典', axe: '战斧', scythe: '镰刀',
        katana: '太刀', shield: '盾牌', orb: '法球'
    };

    var _FALLBACK_ARMOR_TYPE_NAMES = { heavy: '重甲', mage: '法系布甲', light: '轻甲', universal: '通用' };

    var _FALLBACK_CLASS_ARMOR_MAP = {
        knight: ['heavy'], mage: ['mage'], assassin: ['light'], summoner: ['mage'],
        warrior: ['heavy'], sage: ['mage'], necromancer: ['mage'], swordsman: ['light']
    };

    var _FALLBACK_WEAPON_NAMES_BY_TYPE = {
        sword: ['审判巨剑', '骨剑', '王剑', '勇者之剑', '圣光之剑', '暗影之剑', '龙息之剑', '破晓', '黄昏', '星辰之刃', '霜噬', '龙骨巨剑', '审判之剑', '嗜血魔剑', '冰晶刺剑', '狮王之剑'],
        staff: ['大天使之杖', '巫师法杖', '秘法之杖', '回想之杖', '元素之杖', '星辰法杖', '虚空法杖', '永恒之杖', '霜冻之杖', '烈焰法杖', '奥术之杖', '时光之杖', '唤星之杖', '龙息法杖', '魔力洪流', '元素调和'],
        dagger: ['暗影之牙', '毒刃', '幻影匕首', '割喉者', '夜刃', '血刺', '流影刃', '淬毒匕首', '影袭'],
        tome: ['奥秘法典', '虚空秘典', '恶魔之书', '时光之书', '死灵之书', '禁忌之书', '贤者之石'],
        axe: ['雷霆战斧', '裂地战斧', '巨人粉碎者', '狂怒之斧', '霜冻战斧', '炎魔锤', '鲜血战斧'],
        scythe: ['深渊之镰', '灵魂收割者', '死亡镰刀', '虚空镰刀', '骨镰', '死神之镰', '暗影之镰'],
        katana: ['村雨', '鬼切', '天丛云', '斩魔刀', '影月', '风行者', '千本樱', '雪走']
    };

    var _FALLBACK_OFFHAND_NAMES_BY_TYPE = {
        shield: ['圣光之盾', '龙鳞盾', '精灵之盾', '符文之盾', '龙骨盾', '不灭之盾', '荆棘之盾', '远古之盾', '铁壁之盾', '圣旗'],
        orb: ['灵能球', '暗影宝珠', '星辰法器', '元素之心', '暗月之印', '虚空宝珠', '凤凰之羽', '龙魂宝珠', '混沌之球', '星辉之球'],
        tome: ['奥秘法典', '元素之书', '恶魔之书', '贤者之石', '光辉圣典', '虚空秘典', '时光之书', '死灵之书', '禁忌之书', '自然之书'],
        dagger: ['影刃', '短刃', '手里剑', '苦无', '淬毒短刃'],
        katana: ['肋差', '小太刀', '肋差剑']
    };

    var _FALLBACK_ARMOR_NAMES_BY_TYPE = {
        heavy: {
            helmet: ['铁盔', '钢盔', '龙首盔', '龙角之盔', '兽王战盔', '无畏战盔', '不朽战盔', '龙骨战盔', '远古铁面', '狮王头盔'],
            armor: ['锁甲', '板甲', '龙鳞甲', '暗影战甲', '不朽板甲', '圣光板甲', '龙骨战甲', '不朽战铠', '远古板甲', '龙血战甲', '狮心战甲'],
            boots: ['铁靴', '钢靴', '龙鳞靴', '龙鳞战靴', '不朽战靴', '龙骨战靴', '远古胫甲', '狮王战靴', '无畏之靴']
        },
        mage: {
            helmet: ['法师帽', '智慧之冠', '秘术之冠', '星辰之冕', '精灵王冠', '永恒王冠', '奥术之冠', '召唤师兜帽', '圣光头环'],
            armor: ['法袍', '星辰法袍', '深渊法袍', '虚空法袍', '秘法长袍', '大贤者法袍', '奥术编织者', '月光法袍', '星辰法袍'],
            boots: ['法靴', '星辰之靴', '虚空之靴', '秘法之靴', '奥术之靴', '贤者便鞋', '元素之履']
        },
        light: {
            helmet: ['暗影面具', '刺客面罩', '幽冥鬼面', '深渊面具', '暗影兜帽', '凤凰之冠', '鬼面'],
            armor: ['暗夜皮甲', '精灵链甲', '霜鳞甲', '炎魔胸甲', '凤凰羽衣', '龙魂战甲', '风行者皮甲', '影袭轻甲'],
            boots: ['暗影步靴', '霜冻行者', '炎魔之靴', '深渊之靴', '风行者之靴', '影步', '圣光之靴']
        },
        universal: {
            helmet: ['星辰冠冕', '不朽王冠', '圣光之冠'],
            armor: ['布甲', '精灵链甲'],
            boots: ['布靴', '疾风靴', '凤凰之履']
        }
    };

    // ★ v4.2 清理: _FALLBACK_EQUIP_NAMES / getEquipNames / EQUIP_NAMES 整条死链已删除
    //   原先存在的目的是 v2 之前按 slot 平铺的兜底名字, 已被类型分池 (WEAPON_NAMES_BY_TYPE 等) 完全替代
    //   全工程零引用, 同步从 game_config.json 移除 equipNames 字段

    // ---------- 3. 数据访问器（统一从 ConfigLoader 读）----------

    function _cfg(path, fallback) {
        if (typeof ConfigLoader !== 'undefined') {
            var v = ConfigLoader.get(path);
            if (v !== undefined && v !== null) return v;
        }
        return fallback;
    }

    function getEquipSlots() {
        return _cfg('equipSlots.slots', _FALLBACK_EQUIP_SLOTS);
    }
    function getAffixPool() {
        return _cfg('equipAffixPool.affixes', _FALLBACK_AFFIX_POOL);
    }
    function getQualityMultiplier() {
        // 优先按数组形态(旧逻辑)，缺则从对象(common/uncommon/...)组装
        var arr = _cfg('equipQualityMultiplier._array', null);
        if (Array.isArray(arr) && arr.length === 6) return arr;
        var obj = _cfg('equipQualityMultiplier', null);
        if (obj && typeof obj === 'object') {
            return [
                obj.common !== undefined ? obj.common : 1.0,
                obj.uncommon !== undefined ? obj.uncommon : 1.2,
                obj.rare !== undefined ? obj.rare : 1.5,
                obj.epic !== undefined ? obj.epic : 1.8,
                obj.legendary !== undefined ? obj.legendary : 2.2,
                obj.immortal !== undefined ? obj.immortal : 2.7
            ];
        }
        return _FALLBACK_QUALITY_MULT;
    }
    function getWeaponTypesBySlot() {
        return _cfg('equipWeaponTypes.bySlot', _FALLBACK_WEAPON_TYPES_BY_SLOT);
    }
    function getWeaponTypeNames() {
        return _cfg('equipWeaponTypes.names', _FALLBACK_WEAPON_TYPE_NAMES);
    }
    function getArmorTypeNames() {
        return _cfg('equipArmorTypes.names', _FALLBACK_ARMOR_TYPE_NAMES);
    }
    function getClassArmorMap() {
        return _cfg('equipClassArmorMap', _FALLBACK_CLASS_ARMOR_MAP);
    }
    function getWeaponNamesByType() {
        return _cfg('equipWeaponNames', _FALLBACK_WEAPON_NAMES_BY_TYPE);
    }
    function getOffhandNamesByType() {
        return _cfg('equipOffhandNames', _FALLBACK_OFFHAND_NAMES_BY_TYPE);
    }
    function getArmorNamesByType() {
        return _cfg('equipArmorNames', _FALLBACK_ARMOR_NAMES_BY_TYPE);
    }

    // ---------- 4. 暴露给外部（保持原 API 兼容）----------

    // 全局变量：业务代码继续引用 EQUIP_SLOTS / AFFIX_POOL 等
    // 这些变量在 hot reload 时会被重新赋值
    var EQUIP_SLOTS = getEquipSlots();
    var AFFIX_POOL = getAffixPool();
    var WEAPON_TYPES_BY_SLOT = getWeaponTypesBySlot();
    var WEAPON_TYPE_NAMES = getWeaponTypeNames();
    var ARMOR_TYPE_NAMES = getArmorTypeNames();
    var CLASS_ARMOR_MAP = getClassArmorMap();
    var WEAPON_NAMES_BY_TYPE = getWeaponNamesByType();
    var OFFHAND_NAMES_BY_TYPE = getOffhandNamesByType();
    var ARMOR_NAMES_BY_TYPE = getArmorNamesByType();

    // 监听 ConfigLoader 变化，热重载后自动刷新所有全局数据
    if (typeof ConfigLoader !== 'undefined' && ConfigLoader.onChange) {
        ConfigLoader.onChange(function () {
            EQUIP_SLOTS = getEquipSlots();
            AFFIX_POOL = getAffixPool();
            WEAPON_TYPES_BY_SLOT = getWeaponTypesBySlot();
            WEAPON_TYPE_NAMES = getWeaponTypeNames();
            ARMOR_TYPE_NAMES = getArmorTypeNames();
            CLASS_ARMOR_MAP = getClassArmorMap();
            WEAPON_NAMES_BY_TYPE = getWeaponNamesByType();
            OFFHAND_NAMES_BY_TYPE = getOffhandNamesByType();
            ARMOR_NAMES_BY_TYPE = getArmorNamesByType();
            if (typeof console !== 'undefined' && console.info) {
                console.info('[equipment.js] data reloaded, slots=' + EQUIP_SLOTS.length + ', affixes=' + AFFIX_POOL.length);
            }
        });
    }

    // ===== 业务函数 =====

    // 获取装备基础属性值
    function getEquipBaseStat(slotId, level, quality) {
        var slotData = null;
        for (var i = 0; i < EQUIP_SLOTS.length; i++) {
            if (EQUIP_SLOTS[i].id === slotId) { slotData = EQUIP_SLOTS[i]; break; }
        }
        if (!slotData || !slotData.baseStat) return null;
        var bs = slotData.baseStat;
        var qMult = getQualityMultiplier();
        var value = Math.floor(bs.basePerLvl * (level || 1) * (qMult[quality] || 1.0));
        return {
            stat: bs.stat,
            name: bs.name,
            icon: bs.icon,
            value: value
        };
    }

    // 获取武器类型可配带的职业列表
    function getWeaponCompatibleClasses(slot, weaponType) {
        var list = [];
        for (var i = 0; i < CLASS_DATA.length; i++) {
            var cls = CLASS_DATA[i];
            var allowed = (slot === 'offhand') ? cls.offhandType : cls.weaponType;
            if (allowed === weaponType) list.push(cls.name);
        }
        return list;
    }

    // 获取护甲类型可配带的职业列表
    function getArmorCompatibleClasses(armorType) {
        var list = [];
        for (var i = 0; i < CLASS_DATA.length; i++) {
            var cls = CLASS_DATA[i];
            var allowed = getClassArmorTypes(cls.id);
            if (allowed.indexOf(armorType) !== -1) list.push(cls.name);
        }
        return list;
    }

    // 获取职业可穿戴的护甲类型
    function getClassArmorTypes(classId) {
        var types = CLASS_ARMOR_MAP[classId] || ['universal'];
        if (types.indexOf('universal') === -1) types.push('universal');
        return types;
    }

    // 根据 slot 和 armorType 获取随机防具名称
    function getRandomArmorName(slotId, armorType) {
        var pool = ARMOR_NAMES_BY_TYPE[armorType];
        if (pool && pool[slotId] && pool[slotId].length > 0) {
            return randPick(pool[slotId]);
        }
        if (armorType !== 'universal') return getRandomArmorName(slotId, 'universal');
        var slotFallback = null;
        for (var fi = 0; fi < EQUIP_SLOTS.length; fi++) {
            if (EQUIP_SLOTS[fi].id === slotId) { slotFallback = EQUIP_SLOTS[fi]; break; }
        }
        return '普通' + ((slotFallback && slotFallback.name) || '装备');
    }

    // 根据 weaponType 和 slot 获取随机武器名称
    function getRandomWeaponName(slotId, weaponType) {
        var pool = (slotId === 'weapon') ? WEAPON_NAMES_BY_TYPE : OFFHAND_NAMES_BY_TYPE;
        if (pool[weaponType] && pool[weaponType].length > 0) {
            return randPick(pool[weaponType]);
        }
        return '未知' + (WEAPON_TYPE_NAMES[weaponType] || weaponType);
    }

    // ====================================================================
    // 属性战力转换权重表（v3 统一架构：唯一来源 = Formulas.POWER_WEIGHTS）
    //   本文件不再重复定义权重表，统一委托给 Formulas.js
    // ====================================================================

    // 便捷获取权重表（安全回退）
    function _getPowerWeights() {
        return (typeof Formulas !== 'undefined' && Formulas.POWER_WEIGHTS)
            ? Formulas.POWER_WEIGHTS
            : {
                atk: 1.5, def: 3.5, hp: 0.25, spd: 1.2, crit: 2.5, critDmg: 0.8,
                effectHit: 1, effectRes: 1, dmgBonus: 5, dmgReduction: 5,
                elemMastery: 1, physMastery: 0.5, healRate: 1, healBonus: 1,
                expBonus: 0.3, lootBonus: 0.3
            };
    }

    // Fallback for Formulas.statToPower (Formulas 不可用时仍可跑老代码路径, Formulas 内部也调用)
    function statToPower(stat, value) {
        if (typeof Formulas !== 'undefined' && Formulas.statToPower) {
            return Formulas.statToPower(stat, value);
        }
        var w = _getPowerWeights()[stat];
        if (w === undefined) w = 1;
        return (value || 0) * w;
    }

    // Fallback for Formulas.getStatWeight (Formulas 不可用时仍可跑老代码路径)
    function getStatWeight(stat) {
        if (typeof Formulas !== 'undefined' && Formulas.getStatWeight) {
            return Formulas.getStatWeight(stat);
        }
        var w = _getPowerWeights()[stat];
        return w === undefined ? 1 : w;
    }

    // Fallback for Formulas.calcEquipScore (Formulas 不可用时仍可跑老代码路径, Formulas 内部也调用)
    function calcEquipScore(eq, enhanceMult) {
        if (typeof Formulas !== 'undefined' && Formulas.calcEquipScore && !enhanceMult) {
            return Formulas.calcEquipScore(eq);
        }
        if (!eq) return 0;
        var q = eq.quality || 0;
        var eqLevel = eq.level || 1;
        var mult = enhanceMult || 1;

        // 基础属性（含强化倍率）
        var rawBasePower = 0;
        if (eq.baseStats && Array.isArray(eq.baseStats) && eq.baseStats.length > 0) {
            for (var bsi = 0; bsi < eq.baseStats.length; bsi++) {
                var bs = eq.baseStats[bsi];
                if (bs && bs.stat) {
                    rawBasePower += statToPower(bs.stat, Math.floor(bs.value * mult));
                }
            }
        } else {
            var baseStat = getEquipBaseStat(eq.slot, eqLevel, q);
            if (baseStat) {
                rawBasePower = statToPower(baseStat.stat, Math.floor(baseStat.value * mult));
            }
        }

        var affPower = 0;
        var affCount = 0;
        if (eq.affixes) {
            for (var i = 0; i < eq.affixes.length; i++) {
                var aff = eq.affixes[i];
                if (aff) {
                    affPower += statToPower(aff.stat, aff.value);
                    affCount++;
                }
            }
        }

        var gemPower = 0;
        var gemCount = 0;
        var totalGemLvl = 0;
        if (eq.gems) {
            for (var gi = 0; gi < eq.gems.length; gi++) {
                var g = eq.gems[gi];
                if (!g) continue;
                gemCount++;
                totalGemLvl += (g.level || 1);
                var gt = null;
                if (typeof GEM_TYPES !== 'undefined') {
                    for (var _fi = 0; _fi < GEM_TYPES.length; _fi++) {
                        if (GEM_TYPES[_fi].id === g.gemTypeId) { gt = GEM_TYPES[_fi]; break; }
                    }
                }
                if (gt) {
                    var gemLvl = g.level || 1;
                    var gemPct = getGemValue(gt, gemLvl);
                    if (gt.statType === 'pct') {
                        var estBase = (gt.stat === 'hp') ? (300 + eqLevel * 100)
                                    : (gt.stat === 'atk') ? (30 + eqLevel * 12)
                                    : (gt.stat === 'def') ? (25 + eqLevel * 10)
                                    : (gt.stat === 'spd') ? (10 + eqLevel * 3)
                                    : (gt.stat === 'critDmg') ? (50 + eqLevel * 8)
                                    : (5 + eqLevel * 1);
                        gemPower += statToPower(gt.stat, Math.floor(estBase * gemPct / 100));
                    } else {
                        gemPower += statToPower(gt.stat, gemPct);
                    }
                    if (gt.isCompound && gt.extraStat) {
                        gemPower += statToPower(gt.extraStat, getGemExtraValue(gt, gemLvl));
                    }
                }
            }
        }

        var rawPower = rawBasePower + affPower + gemPower;
        var qMultFallback = getQualityMultiplier();
        var qualityMult = (typeof Quality !== 'undefined' && Quality.getStatMult)
            ? Quality.getStatMult(q)
            : (qMultFallback[q] || 1.0);
        rawPower *= qualityMult;
        var affCountMult = 1 + Math.log10(Math.max(1, affCount + 1)) * 0.5;
        rawPower *= affCountMult;
        if (gemCount > 0) {
            var avgGemLvl = totalGemLvl / gemCount;
            rawPower *= (1 + (avgGemLvl - 1) * 0.25);
        }
        return Math.floor(rawPower);
    }

    // 计算装备金币价值（保留旧实现，不在 Formulas 中）
    function calcEquipValue(eq) {
        if (!eq) return 0;
        var baseVal = (eq.quality + 1) * 50;
        if (eq.affixes) {
            for (var i = 0; i < eq.affixes.length; i++) {
                var a = eq.affixes[i];
                var affQ = a.affixQuality !== undefined ? a.affixQuality : eq.quality;
                baseVal += a.value * (1 + affQ * 0.3);
            }
        }
        var lvlV = 1 + ((eq.level || 1) - 1) * 0.1;
        baseVal = Math.floor(baseVal * lvlV);
        if (eq.gems) {
            for (var gi = 0; gi < eq.gems.length; gi++) {
                var g = eq.gems[gi];
                if (!g) continue;
                var gt = null;
                if (typeof GEM_TYPES !== 'undefined') {
                    for (var _fj = 0; _fj < GEM_TYPES.length; _fj++) {
                        if (GEM_TYPES[_fj].id === g.gemTypeId) { gt = GEM_TYPES[_fj]; break; }
                    }
                }
                if (gt) {
                    var gemPct = getGemValue(gt, g.level);
                    if (gt.statType === 'pct') {
                        var estBase = gt.stat === 'hp' ? 300 + (eq.level || 1) * 100 : 50 + (eq.level || 1) * 20;
                        baseVal += Math.floor(estBase * gemPct / 100) * 5;
                    } else {
                        baseVal += gemPct * 5;
                    }
                }
            }
        }
        return Math.floor(baseVal);
    }

    // ---------- 5. 暴露到全局 ----------

    // 暴露 var 数据 + 函数（保持与旧 equipment.js API 完全兼容）
    window.EQUIP_SLOTS = EQUIP_SLOTS;
    window.AFFIX_POOL = AFFIX_POOL;
    window.WEAPON_TYPES_BY_SLOT = WEAPON_TYPES_BY_SLOT;
    window.WEAPON_TYPE_NAMES = WEAPON_TYPE_NAMES;
    window.ARMOR_TYPE_NAMES = ARMOR_TYPE_NAMES;
    window.CLASS_ARMOR_MAP = CLASS_ARMOR_MAP;
    window.WEAPON_NAMES_BY_TYPE = WEAPON_NAMES_BY_TYPE;
    window.OFFHAND_NAMES_BY_TYPE = OFFHAND_NAMES_BY_TYPE;
    window.ARMOR_NAMES_BY_TYPE = ARMOR_NAMES_BY_TYPE;
    window.getEquipBaseStat = getEquipBaseStat;
    window.getWeaponCompatibleClasses = getWeaponCompatibleClasses;
    window.getArmorCompatibleClasses = getArmorCompatibleClasses;
    window.getClassArmorTypes = getClassArmorTypes;
    window.getRandomArmorName = getRandomArmorName;
    window.getRandomWeaponName = getRandomWeaponName;
    window.statToPower = statToPower;
    window.getStatWeight = getStatWeight;
    window.calcEquipScore = calcEquipScore;
    window.calcEquipValue = calcEquipValue;
    // 新增访问器
    window.getEquipSlots = getEquipSlots;
    window.getAffixPool = getAffixPool;
    window.getQualityMultiplier = getQualityMultiplier;
    window.getWeaponTypesBySlot = getWeaponTypesBySlot;
    window.getArmorNamesByType = getArmorNamesByType;
    window.getClassArmorMap = getClassArmorMap;
    window.getWeaponNamesByType = getWeaponNamesByType;
    window.getOffhandNamesByType = getOffhandNamesByType;
})();
