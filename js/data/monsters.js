// ========== 怪物数据（v2 — 数据从 ConfigLoader 读取）==========
// 数据来源：data/game_config.json
// 数据结构：
//   - monsterPool.monsters        怪物基础池
//   - monsterStageScaling         章节基础系数
//   - monsterLevelScaling         关卡内平滑增长
//   - monsterBase                 基础属性 (HP/ATK/DEF/速度)
//   - monsterElite                精英怪倍率
//   - monsterBoss                 BOSS 倍率
// 游戏启动时通过 ConfigLoader.syncLoad() 同步预加载，
// 失败/缺字段时降级到内置的 _FALLBACK_MONSTER_DATA + 硬编码系数。

(function () {
    'use strict';

    // ---------- 1. 同步预加载 ConfigLoader（不阻塞业务）----------
    var _configReady = false;
    try {
        if (typeof ConfigLoader !== 'undefined' && ConfigLoader.syncLoad) {
            ConfigLoader.syncLoad();
            _configReady = true;
        }
    } catch (e) {
        if (typeof console !== 'undefined' && console.warn) {
            console.warn('[monsters.js] ConfigLoader.syncLoad failed, using fallback', e);
        }
    }

    // ---------- 2. 兜底数据（ConfigLoader 缺失字段时使用）----------

    // 怪物基础池兜底（与旧 monsters.js 等价）
    var _FALLBACK_MONSTER_DATA = [
        { id: 'slime', name: '史莱姆', icon: '\u{1F9DF}', hp: 30, atk: 2, def: 1, spd: 50, exp: 5, gold: 3, minStage: 1 },
        { id: 'goblin', name: '哥布林', icon: '\u{1F479}', hp: 28, atk: 3, def: 0, spd: 80, exp: 7, gold: 5, minStage: 1 },
        { id: 'skeleton', name: '骷髅兵', icon: '\u{1F480}', hp: 35, atk: 4, def: 2, spd: 60, exp: 10, gold: 6, minStage: 2 },
        { id: 'wolf', name: '荒野狼', icon: '\u{1F43A}', hp: 32, atk: 5, def: 1, spd: 100, exp: 12, gold: 7, minStage: 2 },
        { id: 'bat', name: '吸血蝙蝠', icon: '\u{1F987}', hp: 25, atk: 6, def: 0, spd: 120, exp: 8, gold: 4, minStage: 3 },
        { id: 'slime_king', name: '史莱姆王', icon: '\u{1F9DF}', hp: 50, atk: 8, def: 3, spd: 40, exp: 25, gold: 15, minStage: 3, elite: true },
        { id: 'orc', name: '兽人战士', icon: '\u{1F47A}', hp: 45, atk: 7, def: 4, spd: 70, exp: 18, gold: 10, minStage: 4 },
        { id: 'dark_mage', name: '暗黑法师', icon: '\u{1F9D9}', hp: 30, atk: 9, def: 1, spd: 90, exp: 20, gold: 12, minStage: 4 },
        { id: 'golem', name: '石魔像', icon: '\u{1F9BE}', hp: 60, atk: 6, def: 6, spd: 30, exp: 30, gold: 18, minStage: 5 },
        { id: 'dragon_whelp', name: '幼龙', icon: '\u{1F409}', hp: 55, atk: 10, def: 4, spd: 75, exp: 40, gold: 25, minStage: 5, elite: true },
        { id: 'wraith', name: '幽魂', icon: '\u{1F47B}', hp: 35, atk: 10, def: 0, spd: 110, exp: 22, gold: 14, minStage: 6 },
        { id: 'minotaur', name: '牛头人', icon: '\u{1F404}', hp: 55, atk: 8, def: 5, spd: 65, exp: 28, gold: 16, minStage: 6 },
        { id: 'lich', name: '巫妖', icon: '\u{2620}', hp: 40, atk: 12, def: 2, spd: 85, exp: 35, gold: 22, minStage: 7, elite: true },
        { id: 'demon', name: '恶魔', icon: '\u{1F608}', hp: 55, atk: 11, def: 4, spd: 75, exp: 40, gold: 28, minStage: 8 },
        { id: 'elder_dragon', name: '上古巨龙', icon: '\u{1F432}', hp: 70, atk: 14, def: 6, spd: 60, exp: 80, gold: 50, minStage: 9, elite: true },
        { id: 'frost_giant', name: '冰霜巨人', icon: '\u{1F9CC}', hp: 80, atk: 15, def: 8, spd: 40, exp: 100, gold: 60, minStage: 10, elite: true },
        { id: 'hell_hound', name: '地狱犬', icon: '\u{1F436}', hp: 60, atk: 18, def: 4, spd: 110, exp: 85, gold: 45, minStage: 11 },
        { id: 'harpy', name: '鹰身女妖', icon: '\u{1F985}', hp: 50, atk: 20, def: 2, spd: 130, exp: 75, gold: 40, minStage: 12 },
        { id: 'stone_giant', name: '山岭巨人', icon: '\u{1F9DF}', hp: 90, atk: 14, def: 10, spd: 25, exp: 120, gold: 70, minStage: 13, elite: true },
        { id: 'phantom', name: '幻影刺客', icon: '\u{1F978}', hp: 55, atk: 22, def: 2, spd: 140, exp: 90, gold: 55, minStage: 14 },
        { id: 'basilisk', name: '石化蛇妖', icon: '\u{1F40D}', hp: 75, atk: 17, def: 6, spd: 60, exp: 110, gold: 65, minStage: 15, elite: true },
        { id: 'vampire', name: '血族伯爵', icon: '\u{1F9DB}', hp: 65, atk: 24, def: 4, spd: 95, exp: 130, gold: 80, minStage: 16 },
        { id: 'void_walker', name: '虚空行者', icon: '\u{1F47E}', hp: 60, atk: 26, def: 3, spd: 100, exp: 140, gold: 85, minStage: 17 },
        { id: 'chimera', name: '奇美拉', icon: '\u{1F992}', hp: 85, atk: 20, def: 7, spd: 70, exp: 160, gold: 90, minStage: 18, elite: true },
        { id: 'behemoth', name: '贝希摩斯', icon: '\u{1F98B}', hp: 100, atk: 18, def: 12, spd: 35, exp: 180, gold: 100, minStage: 20, elite: true },
        { id: 'phoenix', name: '凤凰', icon: '\u{1F426}', hp: 75, atk: 30, def: 5, spd: 105, exp: 200, gold: 110, minStage: 22, elite: true },
        { id: 'titan', name: '泰坦巨人', icon: '\u{1F9B6}', hp: 110, atk: 25, def: 14, spd: 30, exp: 250, gold: 130, minStage: 25, elite: true },
        { id: 'shadow_lord', name: '暗影领主', icon: '\u{1F47D}', hp: 80, atk: 32, def: 6, spd: 90, exp: 260, gold: 140, minStage: 28 },
        { id: 'hydra', name: '九头蛇', icon: '\u{1F409}', hp: 100, atk: 24, def: 9, spd: 55, exp: 300, gold: 150, minStage: 30, elite: true },
        { id: 'void_devourer', name: '虚空吞噬者', icon: '\u{1F7E2}', hp: 95, atk: 35, def: 10, spd: 75, exp: 350, gold: 170, minStage: 35, elite: true },
        { id: 'archangel', name: '天使统帅', icon: '\u{1F607}', hp: 90, atk: 40, def: 8, spd: 100, exp: 400, gold: 200, minStage: 40, elite: true },
        { id: 'chaos_origin', name: '混沌之源', icon: '\u{2622}', hp: 120, atk: 45, def: 15, spd: 80, exp: 500, gold: 250, minStage: 45, elite: true },
        { id: 'abyss_god', name: '深渊之主', icon: '\u{1F451}', hp: 130, atk: 50, def: 16, spd: 70, exp: 600, gold: 300, minStage: 48 },
        { id: 'eternal_dragon', name: '永恒之龙', icon: '\u{1F432}', hp: 120, atk: 55, def: 18, spd: 90, exp: 800, gold: 400, minStage: 50, elite: true },
        { id: 'friend_xiaoyang', name: '小羊角', icon: '\u{1F411}', hp: 35, atk: 6, def: 2, spd: 70, exp: 15, gold: 8, minStage: 1, friend: true,
            desc: '芙门的羊秘书，不过若是撒点孜然应该会很香吧！' },
        { id: 'friend_dapan', name: '大盘鱼', icon: '\u{1F41F}', hp: 40, atk: 7, def: 3, spd: 55, exp: 18, gold: 10, minStage: 1, friend: true,
            desc: '身形巨大如盘的神秘古鱼，潜伏在深水中，一口吞天噬地的传说令无数冒险者闻风丧胆。' },
        { id: 'friend_wusheng', name: '无声乐章', icon: '\u{1F3B5}', hp: 30, atk: 9, def: 1, spd: 90, exp: 20, gold: 12, minStage: 1, friend: true,
            desc: '由失落乐章幻化而成的音符精灵，在寂静中奏响毁灭之曲，每一个音符都带着致命的魔力。' },
        { id: 'friend_keda', name: '可达鸭煲汤', icon: '\u{1F986}', hp: 38, atk: 8, def: 2, spd: 65, exp: 22, gold: 14, minStage: 1, friend: true,
            desc: '一只总在发呆的可达鸭意外掉入汤锅，获得了烈火烹煮之力，喷出的滚汤能灼穿最厚的铠甲。' },
        { id: 'friend_zanmei', name: '赞美魔法之神', icon: '\u{2728}', hp: 28, atk: 10, def: 0, spd: 100, exp: 25, gold: 15, minStage: 1, friend: true,
            desc: '黑奴' },
        { id: 'friend_huaqing', name: '花轻影', icon: '\u{1F338}', hp: 32, atk: 9, def: 1, spd: 95, exp: 24, gold: 13, minStage: 1, friend: true,
            desc: '花间幻化出的轻盈精灵，身形飘忽如影，花瓣飞舞间暗藏致命杀机，美艳而危险。' },
        { id: 'friend_juebie', name: '诀别诗', icon: '\u{1F4DD}', hp: 36, atk: 10, def: 2, spd: 80, exp: 28, gold: 16, minStage: 1, friend: true,
            desc: '以离别之诗为躯的幽魂诗人，吟唱的诗句化作利刃，每一字都是一段未了的遗憾。' },
        { id: 'friend_neige', name: '内阁', icon: '\u{1F3DB}', hp: 42, atk: 8, def: 4, spd: 60, exp: 30, gold: 18, minStage: 1, friend: true,
            desc: '古老王朝遗留下的机关造物，精密齿轮驱动，算无遗策，攻防兼备，冷静如机械。' },
        { id: 'friend_xueying', name: '雪映梅', icon: '\u{2744}', hp: 30, atk: 11, def: 1, spd: 85, exp: 32, gold: 20, minStage: 1, friend: true,
            desc: '寒雪中绽放的梅花精怪，冰晶为骨、花瓣为刃，凛冽寒风即是它的怒吼，美丽而刺骨。' },
        { id: 'friend_weiduo', name: '维多喵', icon: '\u{1F431}', hp: 28, atk: 12, def: 0, spd: 110, exp: 35, gold: 22, minStage: 1, friend: true,
            desc: '来自维多利亚的神秘猫妖，优雅而狡黠，九条尾巴各藏一种秘术，速度冠绝群怪。' },
        { id: 'friend_echo', name: 'Echo', icon: '\u{1F50A}', hp: 35, atk: 11, def: 2, spd: 95, exp: 38, gold: 24, minStage: 1, friend: true,
            desc: '峡谷深处的声音化身，能完美复制敌人的攻击并以双倍力量回敬，以彼之道还施彼身。' },
        { id: 'friend_qiuyu', name: '秋语', icon: '\u{1F342}', hp: 33, atk: 12, def: 1, spd: 90, exp: 40, gold: 25, minStage: 1, friend: true,
            desc: '秋日落叶堆积而成的精灵，低语着季节的哀愁，触碰到的生灵都会被凋零之力侵蚀。' },
        { id: 'friend_ju', name: '菊', icon: '\u{1F33B}', hp: 30, atk: 13, def: 2, spd: 85, exp: 42, gold: 26, minStage: 1, friend: true,
            desc: '傲霜秋菊修炼成精，花瓣如金针般锋利，散发出的幽香能令人陷入沉睡，温柔而致命。' },
        { id: 'friend_xingyundan', name: '幸运蛋', icon: '\u{1F95A}', hp: 25, atk: 14, def: 0, spd: 100, exp: 45, gold: 28, minStage: 1, friend: true,
            desc: '一枚来历不明的巨大彩蛋，看似人畜无害，但撞到它的人总会遭遇意想不到的霉运。' },
        { id: 'friend_fengyuan', name: '枫原万叶', icon: '\u{1F341}', hp: 38, atk: 13, def: 2, spd: 105, exp: 48, gold: 30, minStage: 1, friend: true,
            desc: '手持红叶的流浪武士，剑法如秋风扫落叶般迅捷，万叶飞舞之处无人可挡其锋。' },
        { id: 'friend_xingyunfj', name: '幸运风见', icon: '\u{1F4A8}', hp: 32, atk: 15, def: 1, spd: 110, exp: 50, gold: 32, minStage: 1, friend: true,
            desc: '随风而行的幸运精灵，身形缥缈不可捉摸，所过之处留下祝福之风，带来好运与生机。' },
        { id: 'friend_xingyunmj', name: '幸运魔角', icon: '\u{1F451}', hp: 40, atk: 14, def: 3, spd: 75, exp: 55, gold: 35, minStage: 1, friend: true,
            desc: '头顶魔法尖角的祥瑞之兽，角尖凝聚星辰之力，能为追随者带来无尽的好运与庇护。' },
        { id: 'friend_xingyunlj', name: '幸运鹿角', icon: '\u{1F98C}', hp: 42, atk: 15, def: 3, spd: 80, exp: 58, gold: 38, minStage: 1, friend: true,
            desc: '林中圣鹿化形的守护者，鹿角如珊瑚般璀璨璀璨，踏过之处草木逢春，生机盎然。' },
        { id: 'friend_laodeng', name: '老登看雷', icon: '\u{26A1}', hp: 36, atk: 17, def: 2, spd: 95, exp: 65, gold: 40, minStage: 1, friend: true,
            desc: '背着我偷偷退坑，太坏了！！！' },
        { id: 'friend_yaltor', name: '亚尔托莉', icon: '\u{1F6E1}', hp: 45, atk: 16, def: 5, spd: 70, exp: 70, gold: 45, minStage: 1, friend: true,
            desc: '传说中的圣剑骑士，金发碧眼身披铠甲，手持誓约之剑，为守护信念而战，正气凛然。' },
        { id: 'friend_baiju', name: '白菊', icon: '\u{1F33C}', hp: 35, atk: 18, def: 2, spd: 90, exp: 75, gold: 48, minStage: 1, friend: true,
            desc: '月光下绽放的纯白菊花精灵，圣洁而不可侵犯，花瓣飘落之处万物归于永恒的宁静。' },
        { id: 'friend_xingyunhm', name: '幸运黑妹', icon: '\u{1F478}', hp: 38, atk: 19, def: 2, spd: 100, exp: 80, gold: 50, minStage: 1, friend: true,
            desc: '黑肤如夜的幸运女神化身，笑容灿烂夺目，身上的幸运符能逆转一切厄运，带来奇迹。' },
        { id: 'friend_huaqingz', name: '花轻斋', icon: '\u{1F33A}', hp: 40, atk: 20, def: 3, spd: 85, exp: 90, gold: 55, minStage: 1, friend: true,
            desc: '隐居花斋的植物大师，能操控百花百草，花园即是它的战场，一草一木皆为致命利器。' },

        // ===== v4.x 网友定制怪 (2026-06) — 15 名新网友 =====
        //   设计原则: 名称/图标/属性/描述全部与本人特征相关, 走诙谐调侃风 (与老登看雷/可达鸭煲汤等老网友怪一致)
        //   全部 minStage:1 → 主线关卡 + 爬塔BOSS层 (100%网友) + 精英层 (50%网友) 都会出现
        { id: 'friend_zhaohua', name: '朝花夕拾', icon: '\u{1F338}', hp: 32, atk: 7, def: 1, spd: 60, exp: 14, gold: 7, minStage: 1, friend: true,
            desc: '朝开暮落的花朵精怪，每次绽放都在追忆昨日的自己——或许正因为短暂才格外珍贵。' },
        { id: 'friend_dingshi', name: '定时说说', icon: '\u{23F0}', hp: 30, atk: 8, def: 1, spd: 95, exp: 16, gold: 9, minStage: 1, friend: true,
            desc: '永远在整点报时却从不说自己想说的话的钟表精灵。它把真心话都藏在了秒针的第 60 次跳动里。' },
        { id: 'friend_qic', name: '弃C', icon: '\u{1F4BB}', hp: 28, atk: 11, def: 0, spd: 88, exp: 20, gold: 12, minStage: 1, friend: true,
            desc: '曾深爱 C++ 如今却抛弃它的程序员怨灵，一边掉头发一边朝你扔出 segmentation fault。' },
        { id: 'friend_wodemignzi', name: '我的名字', icon: '\u{2753}', hp: 33, atk: 6, def: 2, spd: 75, exp: 18, gold: 10, minStage: 1, friend: true,
            desc: '失去了自己名字的存在，连自我介绍都变得支支吾吾。或许它唯一的真名早就被岁月遗忘。' },
        { id: 'friend_litals', name: 'LitALS', icon: '\u{1F56F}', hp: 26, atk: 14, def: 1, spd: 100, exp: 22, gold: 13, minStage: 1, friend: true,
            desc: '诗歌之火与冰桶之寒的奇异结合体。读它的诗句你会先冷后热——据说这就是"刺骨入魂"。' },
        { id: 'friend_xuanji', name: '宣姬', icon: '\u{1F478}', hp: 38, atk: 9, def: 3, spd: 70, exp: 24, gold: 14, minStage: 1, friend: true,
            desc: '古代宣姓公主的转世碎片，手中的团扇一摇就扇起三丈红尘。说起来，她的宫斗段位比战斗段位还高。' },
        { id: 'friend_aobatian', name: '奥霸天', icon: '\u{1F479}', hp: 55, atk: 18, def: 5, spd: 50, exp: 60, gold: 35, minStage: 1, friend: true,
            desc: '号称霸天无敌的机甲狂战士，扬言要把所有"草根玩家"都踩在脚下——可至今没人见到过它的脚。' },
        { id: 'friend_dabaie', name: '大白鹅', icon: '\u{1F9A2}', hp: 30, atk: 10, def: 2, spd: 85, exp: 18, gold: 11, minStage: 1, friend: true,
            desc: '鹅鹅鹅，曲项向天歌！被它啄一口的冒险者，从此再也不敢吃烧鹅了。' },
        { id: 'friend_xiaoyu', name: '热心网友小余', icon: '\u{1F9DA}', hp: 27, atk: 7, def: 1, spd: 90, exp: 28, gold: 18, minStage: 1, friend: true,
            desc: '永远在评论区抢沙发和前排的模范网友。打它一下它先说"没事吧？"再还手，搞得你都不好意思继续。' },
        { id: 'friend_wls', name: 'WLS', icon: '\u{1F3AD}', hp: 36, atk: 12, def: 3, spd: 80, exp: 30, gold: 20, minStage: 1, friend: true,
            desc: '只露出三个字母的神秘人，据说从没有人见过它的真面目。有人说它就是下一个你。' },
        { id: 'friend_wujiu', name: '无咎', icon: '\u{1F4FF}', hp: 50, atk: 6, def: 6, spd: 50, exp: 35, gold: 25, minStage: 1, friend: true,
            desc: '心如止水的修行者，据说它从不犯错也不怨天尤人。可惜它的存在本身就是对所有玩家的讽刺。' },
        { id: 'friend_zide', name: '活得自在\u{1F9F8}', icon: '\u{1F9F8}', hp: 45, atk: 5, def: 4, spd: 40, exp: 22, gold: 16, minStage: 1, friend: true,
            desc: '一只长不大的泰迪熊精怪，活得比任何人都自在。抱紧它的人据说都忘记了自己在玩放置手游。' },
        { id: 'friend_linyoude', name: '林有德', icon: '\u{1F333}', hp: 42, atk: 9, def: 4, spd: 60, exp: 26, gold: 15, minStage: 1, friend: true,
            desc: '百年老树的化身，眉宇间总带着几分书卷气。据说它每年秋天都会结出写满诗句的果实。' },
        { id: 'friend_shejishi', name: '设计师', icon: '\u{1F3A8}', hp: 32, atk: 10, def: 2, spd: 75, exp: 24, gold: 16, minStage: 1, friend: true,
            desc: '永远在加班改稿的平面设计精怪。它的笔触能重塑现实——但经常把队友 P 得亲妈都认不出来。' },
        { id: 'friend_feifei', name: '气急败坏的妃妃', icon: '\u{1F63E}', hp: 34, atk: 13, def: 1, spd: 95, exp: 26, gold: 18, minStage: 1, friend: true,
            desc: '一口一个"气死偶咧"的暴躁郡主。一言不合就跺脚，但跺着跺着你就忍不住笑了出来。' }
    ];

    // 公式系数兜底（与旧 calcChapterMonsterStats 等价）
    var _FALLBACK_SCALING = {
        earlyStageMult: 0.3,      // 第1-4章每章×1.3
        lateStageBase: 3,         // 第5章起每章翻3倍：章节系数=期数×3
        lateStageThreshold: 5,
        hpGrowth: 0.08,           // 关卡内 HP 增长
        atkGrowth: 0.07,          // 关卡内 ATK 增长
        defGrowth: 0.05,          // 关卡内 DEF 增长
        baseHP: 120, baseATK: 8, baseDEF: 4,
        normalSpeed: 85, eliteSpeed: 75, bossSpeed: 60,
        // 精英
        eliteHpMult: 6, eliteAtkMult: 2.2, eliteDefMult: 1.8,
        eliteExpBase: 80, eliteExpGrowth: 0.2,
        eliteGoldBase: 50, eliteGoldGrowth: 0.2,
        // BOSS
        bossHpMult: 16, bossAtkMult: 3, bossDefMult: 2.5,
        bossExpBase: 200, bossGoldBase: 100,
        bossExpGoldGrowth: 1.5
    };

    // ---------- 3. 数据访问函数（统一通过 ConfigLoader 读取）----------

    /** 获取怪物基础池（优先 ConfigLoader，缺则用 fallback）*/
    function getMonsterPool() {
        if (typeof ConfigLoader !== 'undefined') {
            var pool = ConfigLoader.get('monsterPool.monsters');
            if (Array.isArray(pool) && pool.length > 0) return pool;
        }
        return _FALLBACK_MONSTER_DATA;
    }

    /** 获取公式系数（统一从 ConfigLoader 读，缺字段走 fallback）*/
    function getMonsterScaling() {
        var cfg = (typeof ConfigLoader !== 'undefined') ? ConfigLoader.getAll() : null;
        if (!cfg) return _FALLBACK_SCALING;

        return {
            earlyStageMult:     (cfg.monsterStageScaling && cfg.monsterStageScaling.earlyStageMultiplierPerChapter !== undefined)
                ? cfg.monsterStageScaling.earlyStageMultiplierPerChapter : _FALLBACK_SCALING.earlyStageMult,
            lateStageBase:      (cfg.monsterStageScaling && cfg.monsterStageScaling.lateStageBase !== undefined)
                ? cfg.monsterStageScaling.lateStageBase : _FALLBACK_SCALING.lateStageBase,
            lateStageThreshold: (cfg.monsterStageScaling && cfg.monsterStageScaling.lateStageThreshold !== undefined)
                ? cfg.monsterStageScaling.lateStageThreshold : _FALLBACK_SCALING.lateStageThreshold,
            hpGrowth:           (cfg.monsterLevelScaling && cfg.monsterLevelScaling.hpGrowthPerLevel !== undefined)
                ? cfg.monsterLevelScaling.hpGrowthPerLevel : _FALLBACK_SCALING.hpGrowth,
            atkGrowth:          (cfg.monsterLevelScaling && cfg.monsterLevelScaling.atkGrowthPerLevel !== undefined)
                ? cfg.monsterLevelScaling.atkGrowthPerLevel : _FALLBACK_SCALING.atkGrowth,
            defGrowth:          (cfg.monsterLevelScaling && cfg.monsterLevelScaling.defGrowthPerLevel !== undefined)
                ? cfg.monsterLevelScaling.defGrowthPerLevel : _FALLBACK_SCALING.defGrowth,
            baseHP:             (cfg.monsterBase && cfg.monsterBase.baseHP !== undefined)
                ? cfg.monsterBase.baseHP : _FALLBACK_SCALING.baseHP,
            baseATK:            (cfg.monsterBase && cfg.monsterBase.baseATK !== undefined)
                ? cfg.monsterBase.baseATK : _FALLBACK_SCALING.baseATK,
            baseDEF:            (cfg.monsterBase && cfg.monsterBase.baseDEF !== undefined)
                ? cfg.monsterBase.baseDEF : _FALLBACK_SCALING.baseDEF,
            normalSpeed:        (cfg.monsterBase && cfg.monsterBase.normalSpeed !== undefined)
                ? cfg.monsterBase.normalSpeed : _FALLBACK_SCALING.normalSpeed,
            eliteSpeed:         (cfg.monsterBase && cfg.monsterBase.eliteSpeed !== undefined)
                ? cfg.monsterBase.eliteSpeed : _FALLBACK_SCALING.eliteSpeed,
            bossSpeed:          (cfg.monsterBase && cfg.monsterBase.bossSpeed !== undefined)
                ? cfg.monsterBase.bossSpeed : _FALLBACK_SCALING.bossSpeed,
            eliteHpMult:        (cfg.monsterElite && cfg.monsterElite.hpMultiplier !== undefined)
                ? cfg.monsterElite.hpMultiplier : _FALLBACK_SCALING.eliteHpMult,
            eliteAtkMult:       (cfg.monsterElite && cfg.monsterElite.atkMultiplier !== undefined)
                ? cfg.monsterElite.atkMultiplier : _FALLBACK_SCALING.eliteAtkMult,
            eliteDefMult:       (cfg.monsterElite && cfg.monsterElite.defMultiplier !== undefined)
                ? cfg.monsterElite.defMultiplier : _FALLBACK_SCALING.eliteDefMult,
            eliteExpBase:       (cfg.monsterElite && cfg.monsterElite.expBase !== undefined)
                ? cfg.monsterElite.expBase : _FALLBACK_SCALING.eliteExpBase,
            eliteExpGrowth:     (cfg.monsterElite && cfg.monsterElite.expGrowth !== undefined)
                ? cfg.monsterElite.expGrowth : _FALLBACK_SCALING.eliteExpGrowth,
            eliteGoldBase:      (cfg.monsterElite && cfg.monsterElite.goldBase !== undefined)
                ? cfg.monsterElite.goldBase : _FALLBACK_SCALING.eliteGoldBase,
            eliteGoldGrowth:    (cfg.monsterElite && cfg.monsterElite.goldGrowth !== undefined)
                ? cfg.monsterElite.goldGrowth : _FALLBACK_SCALING.eliteGoldGrowth,
            bossHpMult:         (cfg.monsterBoss && cfg.monsterBoss.hpMultiplier !== undefined)
                ? cfg.monsterBoss.hpMultiplier : _FALLBACK_SCALING.bossHpMult,
            bossAtkMult:        (cfg.monsterBoss && cfg.monsterBoss.atkMultiplier !== undefined)
                ? cfg.monsterBoss.atkMultiplier : _FALLBACK_SCALING.bossAtkMult,
            bossDefMult:        (cfg.monsterBoss && cfg.monsterBoss.defMultiplier !== undefined)
                ? cfg.monsterBoss.defMultiplier : _FALLBACK_SCALING.bossDefMult,
            bossExpBase:        (cfg.monsterBoss && cfg.monsterBoss.expBase !== undefined)
                ? cfg.monsterBoss.expBase : _FALLBACK_SCALING.bossExpBase,
            bossGoldBase:       (cfg.monsterBoss && cfg.monsterBoss.goldBase !== undefined)
                ? cfg.monsterBoss.goldBase : _FALLBACK_SCALING.bossGoldBase,
            bossExpGoldGrowth:  (cfg.monsterBoss && cfg.monsterBoss.expGoldBonusPerFiveLevels !== undefined)
                ? cfg.monsterBoss.expGoldBonusPerFiveLevels : _FALLBACK_SCALING.bossExpGoldGrowth
        };
    }

    // ---------- 4. 暴露给外部（保持原 API 兼容）----------

    // MONSTER_DATA：业务代码（battle.js / monsterCodexUI.js）继续引用此变量
    // 注意：每次访问 getMonsterPool() 都能拿到 ConfigLoader 的最新数据
    var MONSTER_DATA = getMonsterPool();

    // 监听 ConfigLoader 变化，热重载后自动刷新 MONSTER_DATA
    if (typeof ConfigLoader !== 'undefined' && ConfigLoader.onChange) {
        ConfigLoader.onChange(function () {
            MONSTER_DATA = getMonsterPool();
            if (typeof console !== 'undefined' && console.info) {
                console.info('[monsters.js] MONSTER_DATA reloaded, size=' + MONSTER_DATA.length);
            }
        });
    }

    // ===== 公式化数值系统（系数从 ConfigLoader 读取）=====
    // levelIdx: 1-20（当前章内的关卡号）
    // isBoss: 是否BOSS波
    // isElite: 是否精英波
    function calcChapterMonsterStats(stage, levelIdx, isBoss, isElite) {
        var s = getMonsterScaling();

        // 章节基础系数
        var stageBaseMult;
        if (stage <= 5) {
            stageBaseMult = 1 + (stage - 1) * 0.3;
        } else {
            // 6章=20, 100章=500, 平滑线性: 20 + (stage-6) * 480/94
            stageBaseMult = 20 + (stage - 6) * 480 / 94;
        }

        // 关卡内平滑增长
        var hpGrowth = 1 + (levelIdx - 1) * s.hpGrowth;
        var atkGrowth = 1 + (levelIdx - 1) * s.atkGrowth;
        var defGrowth = 1 + (levelIdx - 1) * s.defGrowth;

        // 基础属性
        var baseHP = Math.floor(s.baseHP * stageBaseMult * hpGrowth);
        var baseATK = Math.floor(s.baseATK * stageBaseMult * atkGrowth);
        var baseDEF = Math.floor(s.baseDEF * stageBaseMult * defGrowth);

        var specialName = '';
        var specialDesc = '';
        var bossSkills = [];

        if (isBoss) {
            baseHP = Math.floor(baseHP * s.bossHpMult);
            baseATK = Math.floor(baseATK * s.bossAtkMult);
            baseDEF = Math.floor(baseDEF * s.bossDefMult);

            if (levelIdx === 10) {
                specialName = '石魔像';
                specialDesc = '阶段1(0-15s):重击眩晕 | 阶段2(15-30s):地震 | 阶段3(30s+):狂暴';
                bossSkills = ['heavy_strike', 'boss_earthquake', 'boss_enrage'];
            } else if (levelIdx === 20) {
                specialName = '幼龙·焚天';
                specialDesc = '阶段1(0-15s):火焰吐息 | 阶段2(15-30s):龙威 | 阶段3(30-45s):扫尾 | 阶段4(45s+):狂暴';
                bossSkills = ['fire_breath', 'shadow_bolt', 'boss_earthquake', 'boss_enrage'];
            }

            var expGoldMult = 8 + Math.floor(levelIdx / 5) * s.bossExpGoldGrowth;
            return {
                hp: baseHP, atk: baseATK, def: baseDEF, spd: s.bossSpeed,
                exp: Math.floor(s.bossExpBase * stageBaseMult * expGoldMult),
                gold: Math.floor(s.bossGoldBase * stageBaseMult * expGoldMult),
                isBoss: true, isElite: false,
                specialName: specialName, specialDesc: specialDesc,
                bossSkills: bossSkills
            };
        } else if (isElite) {
            baseHP = Math.floor(baseHP * s.eliteHpMult);
            baseATK = Math.floor(baseATK * s.eliteAtkMult);
            baseDEF = Math.floor(baseDEF * s.eliteDefMult);

            if (levelIdx === 5) {
                specialName = '史莱姆王';
                specialDesc = '减速攻击：每次攻击概率附带减速';
            } else if (levelIdx === 15) {
                specialName = '暗影刺客';
                specialDesc = '暗影步：70%血量以下概率闪避并反击';
            }

            return {
                hp: baseHP, atk: baseATK, def: baseDEF, spd: s.eliteSpeed,
                exp: Math.floor(s.eliteExpBase * stageBaseMult * (1 + levelIdx * s.eliteExpGrowth)),
                gold: Math.floor(s.eliteGoldBase * stageBaseMult * (1 + levelIdx * s.eliteGoldGrowth)),
                isBoss: false, isElite: true,
                specialName: specialName, specialDesc: specialDesc,
                bossSkills: []
            };
        }

        // 普通怪
        return {
            hp: baseHP, atk: baseATK, def: baseDEF, spd: s.normalSpeed,
            exp: Math.floor(10 * stageBaseMult * (1 + levelIdx * 0.12)),
            gold: Math.floor(5 * stageBaseMult * (1 + levelIdx * 0.12)),
            isBoss: false, isElite: false,
            specialName: '', specialDesc: '',
            bossSkills: []
        };
    }

    // 根据关卡获取可用怪物
    function getMonstersForStage(stage) {
        return getMonsterPool().filter(function (m) { return m.minStage <= stage; });
    }

    // 生成怪物实例（新版公式化数值）
    function createMonsterInstance(stage, levelIdx, isBoss, isElite) {
        var pool = getMonstersForStage(stage);

        // 限制网友怪物出现概率(~20%)，避免淹没原版怪物
        var hasFriend = false;
        for (var fi = 0; fi < pool.length; fi++) { if (pool[fi].friend) { hasFriend = true; break; } }
        if (hasFriend && Math.random() > 0.2) {
            var normalPool = [];
            for (var fj = 0; fj < pool.length; fj++) { if (!pool[fj].friend) normalPool.push(pool[fj]); }
            if (normalPool.length > 0) pool = normalPool;
        }
        var base = randPick(pool);

        // 使用公式计算精确数值
        var stats = calcChapterMonsterStats(stage, levelIdx, isBoss, isElite);

        // v3.x 平衡调整：网友怪 (friend=true) 随章节/关卡动态缩放
        //   旧行为：friend_* 怪属性写死，全章节刷新 → 早期可能刷出 boss 级怪碾压新手
        //   新行为：friend 怪 = base 值 × (1 + (stage-1)*0.08 + (level-1)*0.05) × 0.85（atk/def 略弱）
        //   效果：maxStage=1 保持原强度；maxStage=30 强度 ×3.3
        if (base && base.friend) {
            var friendScale = 1 + (stage - 1) * 0.08 + (levelIdx) * 0.05;
            stats.hp  = Math.floor(stats.hp  * friendScale);
            stats.atk = Math.floor(stats.atk * friendScale * 0.85);
            stats.def = Math.floor(stats.def * friendScale * 0.85);
        }

        // ★ BUG#3b 修复：副本模式下 BOSS/精英 高概率替换为网友怪物
        var isDungeonMode = (typeof BattleManager !== 'undefined' && BattleManager.isDungeon);
        var allMonsters = getMonsterPool();
        if (isBoss) {
            if (isDungeonMode) {
                var friendPoolBoss = allMonsters.filter(function (m) { return m.friend; });
                if (friendPoolBoss.length > 0) {
                    var friendBoss = randPick(friendPoolBoss);
                    base = friendBoss;
                    stats.specialName = friendBoss.name;
                    stats.specialDesc = 'BOSS ' + (friendBoss.desc || '');
                }
            } else if (Math.random() < 0.3) {
                var friendPool = allMonsters.filter(function (m) { return m.friend; });
                if (friendPool.length > 0) {
                    var friendBase = randPick(friendPool);
                    base = friendBase;
                    stats.specialName = friendBase.name;
                    stats.specialDesc = '\u{1F389} 网友乱入！';
                }
            }
        } else if (isElite && isDungeonMode) {
            if (Math.random() < 0.5) {
                var friendPoolElite = allMonsters.filter(function (m) { return m.friend; });
                if (friendPoolElite.length > 0) {
                    var friendElite = randPick(friendPoolElite);
                    base = friendElite;
                    stats.specialName = friendElite.name;
                    stats.specialDesc = '精英 ' + (friendElite.desc || '');
                }
            }
        }

        return {
            id: base.id,
            name: stats.specialName || base.name,
            icon: base.icon,
            maxHp: stats.hp,
            hp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            spd: stats.spd || 80,
            exp: stats.exp,
            gold: stats.gold,
            stage: stage,
            level: levelIdx,
            elite: stats.isElite || false,
            isBoss: stats.isBoss || false,
            specialName: stats.specialName || '',
            specialDesc: stats.specialDesc || '',
            skills: (stats.bossSkills && stats.bossSkills.length > 0) ? stats.bossSkills : getMonsterSkills(base.id, stats.isElite || stats.isBoss),
            statusEffects: [],
            friend: base.friend || false
        };
    }

    // ---------- 5. 暴露到全局 ----------

    // 暴露 var MONSTER_DATA / functions 保持与旧 monsters.js API 完全兼容
    window.MONSTER_DATA = MONSTER_DATA;
    window.calcChapterMonsterStats = calcChapterMonsterStats;
    window.getMonstersForStage = getMonstersForStage;
    window.createMonsterInstance = createMonsterInstance;
    // 新增访问器
    window.getMonsterPool = getMonsterPool;
    window.getMonsterScaling = getMonsterScaling;
})();
