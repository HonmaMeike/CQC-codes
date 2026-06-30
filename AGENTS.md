# AGENTS.md — CQC 放置 RPG 项目

> v2.6.4 项目状态。CQC 是单人维护的放置类 RPG 项目 (idle-rpg),主战场是 Canvas2D + PixiJS WebGL 渲染,数据通过 `game_config.json` 加载 + localStorage 持久化。本文件是改这个项目时 Mavis 翻一下就懂的速查手册。

---

## 0. 工作流铁律 (改任何东西前先确认)

1. **两套独立代码**: `www/js/*` 是开发入口, `js/*` 是 Capacitor 打包源。**现在不用手动同步** — 用 `npm run sync` 或 `npm run dev`（自动监听同步）。
2. **cache-busting**: 改完文件, `www/index.html` 里对应 `?v=N` +1,同时同步根 `index.html`。
3. **开发服务器**: 用 `npm run dev` 启动 http-server, 访问 `http://localhost:8080` 测试。CORS 限制消失 → `FALLBACK_CONFIG` + `game_config.json` 不再需要双改。用 `npm run build` 一键同步。
4. **JS 验证**: 改完 JS 后跑 `npm test`（全量语法检查 + 核心数值单元测试）。
5. **强刷**: 用户测前可能需要 `Ctrl+Shift+R` 强刷。
6. **battle.js 已拆分为三文件**: 场景背景在 `battleScenes.js`，日志系统在 `battleLog.js`。改渲染/背景找 battleScenes.js，改日志找 battleLog.js。

---

## 1. 模块清单 (按目录)

### 1.1 `www/js/data/` — 数据层 (静态配置)

| 文件 | 作用 | 关键导出 | 注意事项 |
|---|---|---|---|
| `configLoader.js` | **配置加载器** (FALLBACK_CONFIG 内置 + game_config.json 远程) | `FALLBACK_CONFIG` (巨大 dict), `cfg(path, fallback)` | **FALLBACK 现在由 `npm run build` 自动从 game_config.json 生成**，不再手动双改 |
| `quality.js` | 品质枚举/映射 | `QUALITY`(0-5: 白绿蓝紫橙金), `QUALITY_NAMES`, `getQuality*` 函数 | 全局 6 档品质引用 |
| `gems.js` | 宝石类型 + 数值表 | `GEM_TYPES`(8 种), `GEM_SINGLE_VALUES` / `GEM_COMPOUND_VALUES` (1-15 级数组), `GEM_RESONANCE_THRESHOLDS` | 数值是百分比, 等级越高数值越大 |
| `equipment.js` | 装备基础 + 词条池 + 套装 | `EQUIP_SLOTS`(5 槽), `AFFIX_POOL`(16 词条), `SET_DATA`(5 套装), `getAffixPool()` | 改词条表两处都改 (FALLBACK_AFFIX_POOL + configLoader FALLBACK) |
| `monsters.js` | 怪物库 + 实例化 | `MONSTER_POOL`, `createMonsterInstance(stage, levelIdx, isBoss, isElite)`, `calcChapterMonsterStats` | 7 网友怪 (`friend: true`) 特殊处理 |
| `skills.js` | 技能数据 | `SKILL_DATA`, `getSkillData(id)` | 8 职业每职业 4 技能 |
| `talents.js` | 天赋树 | `TALENT_DATA`, `TALENT_TYPES`, `getTalentValue/getTalentIsPct/getTalentCost/...` | 仓库扩容 (expand_warehouse) 改 `warehouseExpandLevels` |
| `classes.js` | 职业定义 | `getClassData(classId)`, `getUnlockedClasses()` | 8 职业: 骑士/法师/刺客/召唤/战士/贤者/死灵/剑士 |
| `statusEffects.js` | 状态效果 | `STATUS_EFFECTS`, 各种 effect 模板 | 增减益数据 |
| `enemySkills.js` | 怪物技能 | `getMonsterSkills(monsterId, isElite)` | 怪物 BOSS/精英技能池 |
| `bonds.js` | 羁绊 (玩家+怪物/原版怪) | `calcActiveBonds(heroes)`, `BOND_DEFS` | 友情值/羁绊加成 |
| `towerConfig.js` | 爬塔配置 | `getTowerFloorType`, `getTowerFloorMult`, `calcTowerReward` | **爬塔唯一副本系统** |
| `lotteryConfig.js` | 抽奖品质概率 + 资源奖励 | `LOTTERY_CONFIG.normal/advanced` | 改品质概率或附赠资源 |

### 1.2 `www/js/systems/` — 业务层 (大对象 + 大函数)

| 文件 | 作用 | 关键导出 | 注意事项 |
|---|---|---|---|
| `battle.js` | **核心** (4917行, 从6647行拆出) | `BattleManager` 巨型对象 | 主战场战斗循环 + 副本战斗 + BOSS/精英/刷怪 + 召唤物 + 弹道 + 战斗日志 UI |
| `battleScenes.js` ⭐ | **场景背景渲染** (1662行, 从 battle.js 拆出) | `drawSceneBackground`, `_drawScene_*`(18种场景) | **改背景/视觉特效找这里** |
| `battleLog.js` ⭐ | **战斗日志核心** (从 battle.js 拆出) | `_initLogFilter`, `addBattleLog`, `_logIconMap` | 日志核心方法；UI筛选/统计留在 battle.js |
| `pixiFx.js` | **核心** (WebGL 特效层) | `PixiFx` 单例: `init/destroy/addParticles/addEffect/addProjectile/...` | 单例模式, `_reinitPixiFx(canvas, w, h)` |
| `sprites.js` | **核心** (226KB, 92 个画 sprite 函数) | `drawClassSprite`, `drawMonsterSprite`, `drawKnight/Mage/...` | 纯 Canvas2D 画人物/怪物 |
| `skeleton.js` | 骨骼系统 | `Bone`, `AnimationTrack`, `Skeleton` | 动画基础类 |
| `classSkeletons.js` | 职业骨骼绑定 | `buildClassSkeleton`, `attachClassSprites`, `buildMonsterSkeleton` | 8 职业 + 怪物的骨骼生成 |
| `cartoon.js` | 卡通风格填充 | `drawKnightToon`/`drawMageToon`/..., `celPalette` | 给 sprites 用的美术辅助 |
| `forge.js` | 装备分解 + 重铸业务 | `decomposeEquip(equip)`, `reforgeEquip(equip, lockedIndices)` | **重铸词条生成** — 改平衡时生成端 + 应用端统一 |
| `loot.js` | 战利品生成 (战斗掉落) | `rollAffixQuality(quality)`, `createEquipInstance()`, `generateBattleLoot()` | 词条生成 (同 forge.js) |
| `gemSystem.js` | 宝石系统业务 | `synthesizeGems(type, level, count)`, `calcGemResonance()` | 共鸣 + 镶嵌 + 3合1合成 |
| `lottery.js` | 抽奖业务 | `rollLotteryOnce(quality)`, `doLottery(action, count)` | 单抽 + 十连 + 保底 |
| `audioManager.js` | 音频管理 | `AudioManager.play/playBGM/toggleBGM/toggleSFX` | 用户首次点击后预加载 |
| `iconRenderer.js` | 图标 canvas 缓存 | `getIcon(type, id)`, `getEquipIcon(equip)`, `preRenderAll` | canvas cache |
| `save.js` | **存档** (加密 + checksum + 自动存档迁移) | `saveGame()`, `loadGame()`, `exportSave()`, `importSave()`, `startAutoSave()`, `migrateSave()` | localStorage + AES 加密 + CRC 校验 + v3→v4 自动迁移 |
| `StaminaManager.js` | 体力恢复 | `regenStamina`, `updateStaminaDisplay` | 1 体力/分钟自动恢复 |

### 1.3 `www/js/ui/` — UI 层 (DOM 渲染 + 事件)

| 文件 | 作用 | 关键函数 | 改这个找这里 |
|---|---|---|---|
| `mainUI.js` | 主菜单 + 章节选择 + Screen 切换 | `switchScreen(id)`, `updateResources`, `showStageSelect/selectStage` | 改主菜单 / 章节选择 |
| `homeUI.js` | 家园系统 (38KB) | `HomeSystem.start/stop/setScene`, `renderHomeSceneTabs` | 改家园场景/装饰/原版怪 |
| `inventoryUI.js` | **仓库** (50KB) | `refreshInventoryUI`, `showItemDetail`, `openSmartAction`, `switchDetailActTab` | 仓库任何 UI 改这里 |
| `heroUI.js` | 角色详情 (29KB) | `refreshHeroUI`, `showEquipDetail`, `equipHero`, `reforgeEquippedItem` | 角色装备/镶嵌 |
| `teamUI.js` | 队伍编辑 (27KB) | `refreshTeamUI`, `assignHeroToSlot/removeHeroFromSlot`, `autoBestTeam` | 改阵型/队伍 |
| `forgeUI.js` | **宝石工坊 (1.7KB)** | `switchForgeTab`, `refreshForgeUI` | 委托给 gemUI 渲染 |
| `gemUI.js` | **宝石 UI 全套 (32KB)** | `renderGemSynthesizeUI/renderGemInlayUI/renderGemResonanceUI` | 宝石系统 UI 改这里 |
| `reforgeUI.js` | **重铸 UI (15KB)** | `openReforgeLockUI`, `doReforgeWithLock`, `buildReforgeAffixRows` | 重铸相关改这里 |
| `dungeonUI.js` | 副本大厅 + 爬塔 (14KB) | `showDungeonScreen`, `enterTower`, `openDungeonBattleModal` | 副本/爬塔 UI |
| `lotteryUI.js` | 抽奖 UI (14KB) | `openLotteryScreen`, `doLotteryAction`, `showLotteryAnimation` | 抽奖动画改这里 |
| `talentUI.js` | 天赋页 (12KB) | `refreshTalentUI`, `activateTalent`, `applyTalentFunction` | 改天赋/仓库扩容 |
| `skillUI.js` | 技能升级 (6KB) | `refreshSkillUI`, `upgradeSkill` | 技能加点 |
| `settingsUI.js` | **设置 (76KB, 最大)** | `refreshSettingsUI`, 调试密码 modal, 战斗速度切换, 自动战斗切换 | 设置 + 调试工具 |
| `monsterCodexUI.js` | 怪物图鉴 (15KB) | `showMonsterCodex`, `renderCodexGrid`, `getUnlockedCodexIds` | 图鉴改这里 |
| `lockHelper.js` | 战斗/暂停/Dungeon 状态检查 | `_checkInBattle(action)`, `isInBattle`, `isInDungeon` | 任何「战斗时锁定操作」加这个守卫 |

### 1.4 `www/js/utils/` — 工具

| 文件 | 作用 | 关键函数 |
|---|---|---|
| `helpers.js` | 全局工具 | `showToast`, `showConfirm`, `closeAllModals`, `getQualityName/Class/Bg/Color`, `getStatName`, `getWarehouseCapacity` (= 100 + warehouseExpandLevels × 50), `clamp` |
| `random.js` | 随机工具 | `randInt`, `randPick`, `weightedPick`, `chance`, `rollQuality`, `rollQualityWithBonus`, `randNormal` |

### 1.5 `www/js/view/` — 派生数据视图 (Round 4 加, 未启用)

| 文件 | 作用 | 关键函数 |
|---|---|---|
| `ViewBase.js` | 视图基类 | 视图层基础 |
| `HeroView.js` | 英雄派生数据 | 英雄等级/经验等只读视图 |
| `EquipView.js` | 装备派生数据 | 装备评分/战力贡献等只读视图 |
| `GemView.js` | 宝石派生数据 | 宝石等级/已镶嵌位置等只读视图 |
| `MonsterView.js` | 怪物派生数据 | 怪物属性/推荐战力等只读视图 |
| `SkillView.js` | 技能派生数据 | 技能效果值等只读视图 |
| `GameView.js` | 全局派生数据 | `refreshAll`, `refreshHeroRelated`, `refreshEconomy` |

> **注意**: View 层是新加的, 业务层 (battle.js calcAllyStats / heroUI refreshHeroUI 等) 还在用老的直接读 `gameState` 的方式, View 层目前**没被业务代码使用**。

---

## 2. 改各类东西的 SOP (速查)

### 2.1 改品质 / 词条 / 装备数值

| 改什么 | 改哪里 | 提醒 |
|---|---|---|
| 词条数值表 | `data/equipment.js:31-47` (`_FALLBACK_AFFIX_POOL`) + `data/configLoader.js` (先用 `npm run build` 同步) | **两处必须改**, 否则 file:// 协议用户看不到新效果 |
| 词条生成缩放 | `systems/forge.js` (重铸) + `systems/loot.js` (掉落) + `systems/battle.js` (应用) | **三处必须改 + 公式统一** |
| 装备等级缩放 | `systems/battle.js` `levelMult` | - |
| 品质概率 | `data/quality.js` | - |
| 装备基础属性 | `data/equipment.js` (`EQUIP_SLOTS` 数组) | - |
| 套装 | `systems/forge.js` (`SET_DATA`) | - |

### 2.2 改战斗 / 怪物 / 技能

| 改什么 | 改哪里 |
|---|---|
| 怪物属性公式 | `data/monsters.js` `calcChapterMonsterStats(stage, levelIdx, isBoss, isElite)` |
| 怪物池 | `data/monsters.js` `MONSTER_POOL` |
| 怪物技能 | `data/enemySkills.js` |
| 技能数值 | `data/skills.js` `SKILL_DATA` |
| 职业被动 | `data/classes.js` + `data/skills.js` |
| 战斗循环 (update/render) | `systems/battle.js` `gameLoop` + `update` + `render` |
| 状态效果 | `data/statusEffects.js` + `systems/battle.js` `updateUnitStatusEffects` |

### 2.3 改宝石系统

| 改什么 | 改哪里 |
|---|---|
| 宝石类型 / 数值 | `data/gems.js` |
| 宝石共鸣阈值 | `data/gems.js` `GEM_RESONANCE_THRESHOLDS` |
| 宝石合成 | `systems/gemSystem.js` `synthesizeGems` |
| 宝石工坊 UI | `ui/gemUI.js` (3 个 render 函数) |
| 宝石工坊 tab 入口 | `ui/forgeUI.js` (委托给 gemUI) + `index.html` tab 文字 |

### 2.4 改副本 / 爬塔

| 改什么 | 改哪里 |
|---|---|
| 爬塔配置 | `data/towerConfig.js` |
| 爬塔奖励 | `data/towerConfig.js` `calcTowerReward` |
| 副本 modal 视觉 | `css/ui.css` `.dungeon-battle-modal` + `.dungeon-battle-panel` |
| 副本战斗流程 | `ui/dungeonUI.js` + `systems/battle.js` `startTowerBattle` |

### 2.5 改抽奖

| 改什么 | 改哪里 |
|---|---|
| 品质概率 | `data/lotteryConfig.js` `equipTierRates` |
| 附赠资源 | `data/lotteryConfig.js` `bonusReward` |
| 保底 | `data/lotteryConfig.js` `pityTier` |
| 抽奖动画 | `ui/lotteryUI.js` `showLotteryAnimation` |

### 2.6 改保存 / 加载

| 改什么 | 改哪里 |
|---|---|
| 存档加密 | `systems/save.js` `encryptData/decryptData` |
| 存档迁移 | `js/game.js` `loadGame` 里的迁移代码 |
| 存档字段 | `js/game.js` `initGameState` 初始字段 |

### 2.7 改性能

| 改什么 | 改哪里 | 提醒 |
|---|---|---|
| 帧率限制 (30fps) | `systems/battle.js` `targetFPS: 30`, `frameInterval`, gameLoop 节流 | 放置游戏不需要 60fps，降低移动端发热 |
| 弹道/特效/粒子上限 | `systems/battle.js` 数组上限 | 100/200/80 上限保护 |
| `setInterval` 守卫 | `js/game.js` | 已加 `_mainBattlePaused / isDungeon / isRunning` 守卫 |
| PixiFx 切 canvas | `systems/battle.js:_reinitPixiFx` | destroy + init, Round 1.5 加了 spawnInterval 重置 |
| gameLoop 异常 | `systems/battle.js` gameLoop | try/catch 包 update/render |

---

## 3. 关键调用栈 / 数据流

### 3.1 战斗循环 (主战场)

```
gameLoop(time)  [battle.js]
  ├─ update(dt)  [battle.js]
  │   ├─ _mainBattlePaused 守卫
  │   ├─ 检测全灭 → exitDungeon 或 deathTimer
  │   ├─ resting → restTimer 倒计时 → startNewWave
  │   ├─ active → spawnTimer → spawnEnemy
  │   ├─ updateAllies / updateSummons / updateEnemies
  │   ├─ updateProjectiles / updateUnitStatusEffects
  │   └─ onWaveComplete → 副本模式: exitDungeon / 主战场: 推进
  └─ render()  [battle.js]
      ├─ drawSceneBackground  [battleScenes.js]
      ├─ drawUnit (敌方/友方/召唤物)
      ├─ drawEffects (Canvas2D fallback, 100 上限)
      └─ PixiFx (WebGL 粒子/弹道/特效)
```

### 3.2 战斗入口 (4 个)

| 入口 | 调 | 文件 |
|---|---|---|
| 主线 | `BattleManager.startBattle()` | `systems/battle.js` |
| 爬塔 | `BattleManager.startTowerBattle(floor)` | `systems/battle.js` |
| 旧 4 副本 | `BattleManager.startDungeonBattle(type, level)` (已废) | `systems/battle.js` |
| 退出 | `BattleManager.exitDungeon()` | `systems/battle.js` |

### 3.3 装备词条 → 角色属性 计算链路

```
词条 (affixes[].value) →
  forge.js (生成)  或  loot.js (掉落)  或  battle.js (应用)
    val = floor(baseVal * (1 + (level-1) * 0.02))
  → battle.js 装备词条循环:
    _applyAffix(stats, affix, levelMult)  ← 委托 Formulas.applyAffix
      ├─ type=pct: stats[stat] += floor(stats[stat] * scaledVal / 100)
      └─ type=flat: stats[stat] += scaledVal
  → battle.js 宝石加成: _applyGem 委托 Formulas.applyGem
  → battle.js 天赋加成: _applyTalentStat
  → 战斗: damage = atk * (1 + critMultiplier * critRate) 等等
```

**关键陷阱**: 装备 + 宝石 + 天赋 + 被动 ×4-6 源 的 pct 是乘法叠加。

### 3.4 持久化数据流

```
localStorage ('cqc_save_X') ← AES 加密 + CRC  ← gameState (runtime)
   ↑                                                ↑
   saveGame(slot)                        用户操作
   ↑                                                ↑
   index.html save.js / settingsUI (自动/手动存档)
```

---

## 4. 踩坑记录

### 4.1 词条数值平衡 Round 9 — 0.7+0.3*level 爆炸

- `forge.js` 词条生成公式 `val = floor(baseVal * (0.7 + 0.3 * level))` → 40 级就是 12.7× 爆炸
- 修复: 改成 `levelMult = 1 + (level - 1) * 0.02` → 37 级 1.72×, 50 级 1.98×, 100 级 2.98×
- forge/loot/battle 三处统一公式

### 4.2 Round 9 品质差消失

- 白装 1×、绿 1.2×、蓝 1.5×、紫 1.8× 品质差几乎为 0 → 玩家没有追求高装备的驱动力
- **任何改品质乘数的操作, 必须关注极端品质差 + 品质间差距, 不要只改单个品质**

### 4.3 副本战斗画面污染 (BUG#1)

- 根因: `exitDungeon()` 恢复了 `savedNormalState.enemies` → 旧/空的敌人实例染主战场
- 修复: `this.enemies = []` 加两处, boss/elite 标志归零
- **加副本/爬塔新入口时, 记得清空 enemies + 重置波次标志 + 用独立 canvas**

### 4.4 爬塔 BOSS 残留 BUG#3

- `exitDungeon()` 没有重置 `isBossWave / isEliteWave / elitesRemaining` → 主战场下一波走 BOSS 分支
- 修复: `exitDungeon()` 开头重置三个标志

### 4.5 重铸锁 Index 漂移

- 前端传的 lockedIndices 是 UI 行号 (visible) — 不是 `equip.affixes[]` 实际索引
- `forge.js:doReforgeWithLock` 内部有 lockedSet 映射, 改重铸时检查 UI ↔ 数据索引映射

### 4.6 CSS 容器 ID 全局匹配

- `#forge-content` 与 `#gem-content` 等 ID 被多处 grep 硬编码
- 改名时: 先 grep 全部引用, 再 rename → 否则 modal 不显

### 4.7 `npm test` 覆盖的数值单元

- `test/run-tests.js` 覆盖: Formulas.calcHeroPower, statToPower, applyAffix, calcDamage, calcHeroScore, getRecommendedPower, random 工具 (randInt, weightedPick, chance, rollQuality), gem 数据 (GEM_TYPES, GEM_SINGLE_VALUES, GEM_RESONANCE_THRESHOLDS)
- 改公式/数值/概率时, 先跑 `npm test` 确认基线, 改完再跑一遍

### 4.8 魔王副本黑屏 (v7.4.1) — PixiFx API 名 typo

- `systems/battle.js:_spawnDemonKing` 调 `PixiFx.addParticle(...)` (单数), 实际 `pixiFx.js` 只导出 `addParticles(...)` (复数)
- 导致 `TypeError: PixiFx.addParticle is not a function` → `_spawnDemonKing` 中断 → `startDemonKingBattle` 后续代码 (改 modal 标题、调 startBattle) 全跳过 → gameLoop 没启动 → canvas 保持 modal wrap 的黑色背景
- 调试线索: 用户 JSON 输出显示 `isDungeon=true, dungeonType='demonking', enemies=1, isRunning=false` — 跑到 push boss 但没启动 gameLoop
- **加新副本/新特效调用前必须 grep 验证 API 名**: `grep -r "PixiFx\." www/js/ | grep -v "PixiFx\."`
- 修复后还加了 `try/catch` 兜底, 防止下次再出现类似 typo 把整个战斗流程打死

### 4.9 副本入口必须三件套 + 扣资源回滚 (v7.4.1)

- `enterTower / enterGoldDungeon / enterDustDungeon / enterDemonKingDungeon` 必须三件套:
  1. **`_checkInBattle(actionName)` 守卫** — 副本中拒绝再次进入
  2. **防御性清理 `isDungeon` 残留** — 用户按返回键/异常退出没走正常 exit 流程, `isDungeon` 残留 `true`, 下次进入被早期 return 拦住。入口开头 `if (BattleManager.isDungeon && BattleManager.exitDungeon) BattleManager.exitDungeon()` 强制清理
  3. **try/catch 包住启动流程 + 失败回滚资源** — 扣体力/扣金币/扣次数放在 try 块里, 启动成功后才标记已消耗; 任何一步 throw 都用 `preStamina / preLastDate` 之类回滚
- 之前 `enterDemonKingDungeon` 是「扣体力 → 设今日已挑战 → 开 modal → 启动战斗」, 启动失败时玩家白扣 20 体力 + 浪费今日次数
- `stopBattle()` 不重置 `isDungeon` — 这是有意设计, 但调用方必须自己处理残留

### 4.10 副本 modal 标题硬编码 (v7.4.1)

- `openDungeonBattleModal(type)` 之前 `nameEl.textContent = type === 'tower' ? '爬塔·无尽' : '副本'`
- 只有 `tower` 显示正确标题, `gold/stone/gem/equip/demonking` 全部显示"副本"
- 改成查表 `DUNGEON_MODAL_TITLES = { tower, demonking, gold, stone, gem, equip }`, 加新副本类型时记得补表

---

## 5. 构建 / 测试命令

```
npm run dev           # 开发服务器 + 自动同步 www→js
npm run dev:simple    # 仅开发服务器,不同步
npm run test          # 核心数值单元测试 (26 项)
npm run sync          # 手动同步 www/js → js/
npm run sync:watch    # 监听 www/js 变化自动同步
npm run build         # 同步 + 生成 FALLBACK_CONFIG
npm run build:android # 完整构建 APK
```

---

## 6. 工具脚本参考

| 脚本 | 作用 |
|---|---|
| `tools/sync-www-to-root.js` | 单向同步 www/js → js/ |
| `tools/sync-watch.js` | 监听文件变化自动同步 |
| `tools/build-config.js` | 从 game_config.json 生成 FALLBACK_CONFIG |
| `tools/archive/` | 旧修复脚本 + 旧 APK 归档 |
| `test/run-tests.js` | 核心数值单元测试 |

---

## 7. 测试 Checklist (改完跑一遍)

- [ ] `npm test` (语法检查 + 26 项单元测试全通过)
- [ ] 改文件后 `www/index.html` 对应 `?v=N` +1
- [ ] `npm run sync` 同步 www → 根 (如果没开 dev)
- [ ] `npm run build` 同步配置 (如果改了 game_config.json)
- [ ] 改战斗数值时, 确认生成端 (forge/loot) + 应用端 (battle) 都改 + 公式统一
- [ ] 改 UI 容器 ID 时, 检查所有 grep 该 ID 的代码
- [ ] 改完给用户简短说明: 改了什么 + 怎么测 + 风险点

---

## 8. 记忆 (Mavis agent memory 关键条目)

> 修平衡时 grep 全部缩放公式 (0.7+0.3*level, 1+0.04*level, levelMult 等), 生成端 + 应用端同时改 + 公式统一。
> 改大块代码后必须 `npm test`, 不要只检查改的那个文件 — orphan 闭花括号会静默通过 grep。
> 跨页面复用的渲染函数, 容器查找要兼容多 ID (#gem-content || #forge-content)。
> 业务完成后只关自己的 modal, 别用 closeAllModals 全关 — 误关其他 modal。
> 用户语义反义时不要急着自己脑补, 用户重反馈后要立刻承认 + 回头重做。

---

## 9. 不该用本文件做的事

- ❌ 当 API 文档用 — 文件路径/行号会过期, 改完不一定更新
- ❌ 跨项目套用 — 项目结构差异大, 本文件 CQC 专属
- ❌ 长期标准化模板 — 写「标准」易过期, 下一个项目按实际情况 grep
- ✅ 当**改这个项目时**翻一遍的速查手册 — 5-10 分钟过一遍
- ✅ 当**遇到 bug**时翻「踩坑记录」— 直接找到根因
- ✅ 当**改数值平衡**时翻「改各类东西的 SOP」+ 「踩坑记录 4.1」
