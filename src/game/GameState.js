import { generateFloor, generateBossFloor } from './dungeon'
import { computeFOV } from './fov'
import { calcPlayerDamage, getPlayerStats, checkEvasion, applyShieldEnchant, getThornsDamage, applyDefensiveBuffs } from './combat'
import { processEnemyTurns } from './enemyAI'
import { processBossTurn } from './bossAI'
import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'
import { getEnemyTypesForFloor, scaleEnemy } from '../data/enemies'
import { getItemPoolForFloor, createItemInstance } from '../data/items'
import { SKILL_LEVELS, getSkillChoices } from '../data/skills'
import { isBossFloor, getBossForFloor } from '../data/bosses'
import { getClassById } from '../data/classes'
import { randInt, pick } from '../utils/random'

const BASE_MAX_INVENTORY = 10
const MAX_LOG = 50

let _nextEnemyId = 1
let _nextGoldId = 1

function createPlayer(bonuses, classId) {
  const b = bonuses || {}
  const cls = getClassById(classId)
  return {
    x: 0,
    y: 0,
    hp: cls.stats.hp + (b.maxHp || 0),
    maxHp: cls.stats.hp + (b.maxHp || 0),
    baseAttack: cls.stats.baseAttack + (b.baseAttack || 0),
    baseDefense: cls.stats.baseDefense + (b.baseDefense || 0),
    level: 1,
    exp: 0,
    expToNext: 20,
    equipment: { weapon: null, shield: null },
    inventory: [],
    skills: [],
    gold: 0,
    killCount: 0,
    maxInventory: BASE_MAX_INVENTORY + (b.extraInventory || 0),
    turnCount: 0,
    classId: cls.id,
    mp: cls.mp,
    maxMp: cls.maxMp,
    // 一時バフ
    guardTurns: 0,       // かばう残りターン
    warCryTurns: 0,      // ウォークライ残りターン
    magicShieldTurns: 0, // 魔力の盾残りターン
  }
}

function spawnEnemies(rooms, playerStart, floor, tiles) {
  const types = getEnemyTypesForFloor(floor)
  if (types.length === 0) return []

  const enemies = []
  const enemyCount = randInt(3, 5) + Math.floor(floor * 0.5)

  for (let i = 0; i < enemyCount; i++) {
    const room = pick(rooms)
    let attempts = 0
    while (attempts < 20) {
      attempts++
      const x = randInt(room.x + 1, room.x + room.width - 2)
      const y = randInt(room.y + 1, room.y + room.height - 2)
      if (x === playerStart.x && y === playerStart.y) continue
      if (enemies.some((e) => e.x === x && e.y === y)) continue
      if (tiles[y][x] === TILE.WALL) continue

      const type = pick(types)
      const scaled = scaleEnemy(type, floor)
      enemies.push({
        id: `enemy_${_nextEnemyId++}`,
        name: type.name,
        sprite: type.sprite,
        color: type.color,
        x,
        y,
        ...scaled,
        _floor: floor,
      })
      break
    }
  }
  return enemies
}

function spawnItems(rooms, playerStart, floor, tiles, enemies, skills) {
  const pool = getItemPoolForFloor(floor)
  if (pool.length === 0) return []

  const items = []
  let itemCount = randInt(2, 4)
  // 強欲スキル: +2
  if (skills.some((s) => s.id === 'greed')) {
    itemCount += 2
  }
  // 罠感知スキル（盗賊）: +3
  if (skills.some((s) => s.id === 'trap_sense')) {
    itemCount += 3
  }

  for (let i = 0; i < itemCount; i++) {
    const room = pick(rooms)
    let attempts = 0
    while (attempts < 20) {
      attempts++
      const x = randInt(room.x + 1, room.x + room.width - 2)
      const y = randInt(room.y + 1, room.y + room.height - 2)
      if (x === playerStart.x && y === playerStart.y) continue
      if (enemies.some((e) => e.x === x && e.y === y)) continue
      if (items.some((it) => it.x === x && it.y === y)) continue
      if (tiles[y][x] === TILE.WALL) continue

      const item = createItemInstance(pool)
      items.push({ ...item, x, y })
      break
    }
  }
  return items
}

function spawnFloorGold(rooms, playerStart, floor, tiles, enemies, floorItems) {
  const golds = []
  const goldCount = randInt(1, 2) + Math.floor(floor * 0.15)
  for (let i = 0; i < goldCount; i++) {
    const room = pick(rooms)
    let attempts = 0
    while (attempts < 20) {
      attempts++
      const x = randInt(room.x + 1, room.x + room.width - 2)
      const y = randInt(room.y + 1, room.y + room.height - 2)
      if (x === playerStart.x && y === playerStart.y) continue
      if (enemies.some((e) => e.x === x && e.y === y)) continue
      if (floorItems.some((it) => it.x === x && it.y === y)) continue
      if (golds.some((g) => g.x === x && g.y === y)) continue
      if (tiles[y][x] === TILE.WALL) continue

      const amount = randInt(2, 5) + Math.floor(floor * 0.8)
      golds.push({
        id: `gold_${_nextGoldId++}`,
        type: 'gold',
        name: `${amount}G`,
        amount,
        x,
        y,
      })
      break
    }
  }
  return golds
}

function appendLog(log, msg) {
  if (!msg) return log || []
  const newLog = [...(log || []), msg]
  if (newLog.length > MAX_LOG) return newLog.slice(newLog.length - MAX_LOG)
  return newLog
}

function createBoss(bossData, bossStart) {
  return {
    id: `boss_${bossData.id}`,
    name: bossData.name,
    sprite: bossData.sprite,
    color: bossData.color,
    x: bossStart.x,
    y: bossStart.y,
    hp: bossData.hp,
    maxHp: bossData.hp,
    attack: bossData.attack,
    defense: bossData.defense,
    exp: bossData.exp,
    gold: bossData.gold || 0,
    isBoss: true,
    specialType: bossData.specialType,
    specialInterval: bossData.specialInterval,
    specialDesc: bossData.specialDesc,
    dropItem: bossData.dropItem,
    turnCount: 0,
  }
}

function trySpawnBlacksmith(rooms, playerStart, floor, tiles, enemies, floorItems) {
  // 10F以降、10%の確率で出現
  if (floor < 10 || Math.random() >= 0.10) return null
  const room = pick(rooms)
  for (let attempts = 0; attempts < 20; attempts++) {
    const x = randInt(room.x + 1, room.x + room.width - 2)
    const y = randInt(room.y + 1, room.y + room.height - 2)
    if (x === playerStart.x && y === playerStart.y) continue
    if (enemies.some((e) => e.x === x && e.y === y)) continue
    if (floorItems.some((it) => it.x === x && it.y === y)) continue
    if (tiles[y][x] === TILE.WALL) continue
    return { x, y }
  }
  return null
}

function buildFloorState(floor, player, prevLog) {
  const boss = isBossFloor(floor) ? getBossForFloor(floor) : null

  let floorData, enemies, floorItems, blacksmith = null
  if (boss) {
    floorData = generateBossFloor()
    enemies = []
    floorItems = []
  } else {
    floorData = generateFloor(floor)
    enemies = spawnEnemies(floorData.rooms, floorData.playerStart, floor, floorData.tiles)
    floorItems = spawnItems(floorData.rooms, floorData.playerStart, floor, floorData.tiles, enemies, player.skills || [])
    // 床ゴールドを追加
    const floorGold = spawnFloorGold(floorData.rooms, floorData.playerStart, floor, floorData.tiles, enemies, floorItems)
    floorItems = [...floorItems, ...floorGold]
    // 鍛冶屋
    blacksmith = trySpawnBlacksmith(floorData.rooms, floorData.playerStart, floor, floorData.tiles, enemies, floorItems)
  }

  const revealed = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  )
  const newPlayer = { ...player, x: floorData.playerStart.x, y: floorData.playerStart.y }
  // ウォークライ: ボス戦開始時に自動発動
  if (boss && (newPlayer.skills || []).some((s) => s.id === 'war_cry')) {
    newPlayer.warCryTurns = 3
  }
  const fov = computeFOV(floorData.tiles, newPlayer, floorData.rooms, revealed)

  const msg = boss ? `${floor}階 ボスフロアに降りた...` : `${floor}階に降りた...`
  return {
    floor,
    player: newPlayer,
    tiles: floorData.tiles,
    rooms: floorData.rooms,
    stairs: floorData.stairs,
    enemies,
    floorItems,
    visible: fov.visible,
    revealed: fov.revealed,
    message: msg,
    messageLog: appendLog(prevLog, msg),
    damagePopups: [],
    gameOver: false,
    pendingSkillChoice: null,
    levelUpFlash: false,
    // ボス関連
    boss: boss ? createBoss(boss, floorData.bossStart) : null,
    bossWarning: boss ? boss.name : null,
    stairsLocked: !!boss,
    // 鍛冶屋NPC
    blacksmith,
    showBlacksmith: false,
    // AI関連
    aiEvent: null,
    aiEventPending: false,
    lastAIEventFloor: 0,
    bossDialogue: null,
    bossDialogueTrigger: null,
  }
}

export function createInitialState(bonuses, classId) {
  const player = createPlayer(bonuses, classId)
  // 備蓄の心得: 回復薬を持ってスタート
  if (bonuses && bonuses.startPotions > 0) {
    for (let i = 0; i < bonuses.startPotions; i++) {
      player.inventory.push({
        id: `start_potion_${i}`,
        type: 'potion',
        name: '薬草',
        sprite: 'potion_green',
        rarity: 'common',
        stats: { heal: 15 },
        description: 'HPを15回復する',
      })
    }
  }
  return buildFloorState(1, player)
}

// ボスの2x2タイル上かチェック
function isOnBossTile(boss, x, y) {
  if (!boss || boss.hp <= 0) return false
  return x >= boss.x && x <= boss.x + 1 && y >= boss.y && y <= boss.y + 1
}

export function movePlayer(state, dx, dy) {
  if (state.gameOver || state.pendingSkillChoice || state.aiEvent || state.aiEventPending || state.bossWarning) return state

  const nx = state.player.x + dx
  const ny = state.player.y + dy

  if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) return state
  if (state.tiles[ny][nx] === TILE.WALL) return state

  // 斜め移動時: 壁の角をすり抜けないようチェック
  if (dx !== 0 && dy !== 0) {
    if (state.tiles[state.player.y][nx] === TILE.WALL && state.tiles[ny][state.player.x] === TILE.WALL) return state
  }

  // ボスがいる場合、ボスタイルに移動しようとしたら攻撃
  if (state.boss && state.boss.hp > 0 && isOnBossTile(state.boss, nx, ny)) {
    return attackBoss(state)
  }

  // 敵がいる場合は攻撃
  const targetEnemy = state.enemies.find((e) => e.x === nx && e.y === ny && e.hp > 0)
  if (targetEnemy) {
    return attackEnemy(state, targetEnemy)
  }

  // 移動
  const newPlayer = { ...state.player, x: nx, y: ny, turnCount: (state.player.turnCount || 0) + 1 }
  let message = state.message
  const newPopups = []

  // バフターン減少
  if (newPlayer.guardTurns > 0) newPlayer.guardTurns--
  if (newPlayer.warCryTurns > 0) newPlayer.warCryTurns--
  if (newPlayer.magicShieldTurns > 0) newPlayer.magicShieldTurns--

  // 自然回復: 5ターンごとにHP1回復
  if (newPlayer.turnCount % 5 === 0 && newPlayer.hp < newPlayer.maxHp && newPlayer.hp > 0) {
    newPlayer.hp = Math.min(newPlayer.hp + 1, newPlayer.maxHp)
  }

  // 鍛冶屋チェック
  if (state.blacksmith && nx === state.blacksmith.x && ny === state.blacksmith.y) {
    message = '鍛冶屋がいる！ 同じ種類の装備を2つ渡すと強化できる'
    const fov = computeFOV(state.tiles, newPlayer, state.rooms, state.revealed)
    return {
      ...state,
      player: newPlayer,
      visible: fov.visible,
      revealed: fov.revealed,
      message,
      messageLog: appendLog(state.messageLog, message),
      showBlacksmith: true,
    }
  }

  // 階段チェック
  if (nx === state.stairs.x && ny === state.stairs.y) {
    if (state.stairsLocked) {
      message = '階段はボスを倒すまでロックされている！'
    } else {
      message = '階段を見つけた！ タップで次の階へ'
    }
  }

  // アイテム拾得チェック
  let floorItems = state.floorItems
  const itemHere = floorItems.find((it) => it.x === nx && it.y === ny)
  if (itemHere) {
    if (itemHere.type === 'gold') {
      newPlayer.gold = (newPlayer.gold || 0) + itemHere.amount
      floorItems = floorItems.filter((it) => it.id !== itemHere.id)
      message = `${itemHere.amount}Gを拾った！`
    } else if (newPlayer.inventory.length < (newPlayer.maxInventory || BASE_MAX_INVENTORY)) {
      const { x, y, ...itemData } = itemHere
      newPlayer.inventory = [...newPlayer.inventory, itemData]
      floorItems = floorItems.filter((it) => it.id !== itemHere.id)
      message = `${itemHere.name}を拾った！`
    } else {
      message = '持ち物がいっぱいだ！'
    }
  }

  // ボスのターン
  let bossResult = null
  let newBoss = state.boss
  let addedEnemies = []
  if (state.boss && state.boss.hp > 0) {
    const { defense } = getPlayerStats(newPlayer)
    bossResult = processBossTurn(state.boss, newPlayer, defense, state.tiles, state.enemies)
    newBoss = bossResult.boss
    addedEnemies = bossResult.summonEnemies || []
  }

  // 通常敵のターン
  const allEnemies = [...state.enemies, ...addedEnemies]
  const result = processEnemyTurn(allEnemies, newPlayer, state.tiles, state.rooms)
  const fov = computeFOV(state.tiles, result.player, state.rooms, state.revealed)

  // ボスダメージ処理
  let bossPopups = []
  let bossMsg = null
  let totalBossDmg = 0
  if (bossResult && bossResult.damageEvents.length > 0) {
    const skills = result.player.skills || []
    for (const event of bossResult.damageEvents) {
      if (checkEvasion(skills)) {
        bossPopups.push({ id: Date.now() + Math.random(), x: event.x, y: event.y, text: 'MISS', color: '#88aaff', timer: 30 })
        bossMsg = `${event.enemyName}の攻撃を見切った！`
        continue
      }
      totalBossDmg += event.damage
      bossPopups.push({ id: Date.now() + Math.random(), x: event.x, y: event.y, text: `${event.damage}`, color: '#ff4444', timer: 30 })
      bossMsg = bossResult.message
    }
  } else if (bossResult) {
    bossMsg = bossResult.message
  }

  const playerAfterBoss = { ...result.player, hp: Math.max(0, result.player.hp - totalBossDmg) }
  const gameOver = result.gameOver || playerAfterBoss.hp <= 0

  const finalMsg = bossMsg || result.message || message
  let log = state.messageLog
  if (message !== state.message) log = appendLog(log, message)
  if (bossMsg) log = appendLog(log, bossMsg)
  if (result.message) log = appendLog(log, result.message)
  if (!bossMsg && !result.message && message === state.message) log = state.messageLog

  return {
    ...state,
    player: playerAfterBoss,
    enemies: result.enemies,
    boss: newBoss,
    floorItems,
    visible: fov.visible,
    revealed: fov.revealed,
    message: finalMsg,
    messageLog: log,
    damagePopups: [...newPopups, ...bossPopups, ...result.damagePopups],
    gameOver,
    levelUpFlash: false,
  }
}

function attackBoss(state) {
  const boss = state.boss
  const { attack } = getPlayerStats(state.player)
  const skills = state.player.skills || []
  const weapon = state.player.equipment.weapon
  const { damage, isCritical, isFireSlash, isLifesteal, lifestealAmount, isPoisonApplied, isPowerStrike, isFireball, mpCost } = calcPlayerDamage(attack, boss.defense, skills, weapon, state.player)
  const newBossHp = boss.hp - damage

  let popupColor = '#ffcc44'
  let popupText = `${damage}`
  if (isPowerStrike) { popupColor = '#ff2222'; popupText = `${damage}!!` }
  else if (isFireball) { popupColor = '#ff5500'; popupText = `${damage}🔥` }
  else if (isCritical) { popupColor = '#ff44ff'; popupText = `${damage}!` }
  else if (isFireSlash) { popupColor = '#ff6633' }

  // ボスの中心にポップアップ
  const popups = [{ id: Date.now(), x: boss.x + 0.5, y: boss.y, text: popupText, color: popupColor, timer: 30 }]

  let message = `${boss.name}に${damage}のダメージ！`
  if (isPowerStrike) message = `渾身の一撃！ ${boss.name}に${damage}のダメージ！`
  else if (isFireball) message = `ファイアボール！ ${boss.name}に${damage}のダメージ！`
  else if (isCritical) message = `会心の一撃！ ${boss.name}に${damage}のダメージ！`
  else if (isFireSlash) message = `火炎斬り！ ${boss.name}に${damage}のダメージ！`

  let newBoss = { ...boss, hp: Math.max(0, newBossHp) }
  if (isPoisonApplied && newBossHp > 0) {
    newBoss.poison = { turns: 3, damage: 3 }
  }
  let newPlayer = { ...state.player }
  // 渾身の一撃HP消費
  if (isPowerStrike) newPlayer.hp = Math.max(1, newPlayer.hp - 5)
  // ファイアボールMP消費
  if (mpCost > 0) newPlayer.mp = Math.max(0, (newPlayer.mp || 0) - mpCost)
  // HP吸収
  if (isLifesteal && lifestealAmount > 0) {
    newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + lifestealAmount)
  }
  let pendingSkillChoice = null
  let levelUpFlash = false
  let stairsLocked = state.stairsLocked
  let floorItems = state.floorItems

  // ボスセリフトリガー: HP50%以下になった瞬間
  let bossDialogueTrigger = null
  if (boss.hp > boss.maxHp * 0.5 && newBossHp <= boss.maxHp * 0.5 && newBossHp > 0) {
    bossDialogueTrigger = 'angry'
  }

  // ボス撃破
  if (newBossHp <= 0) {
    bossDialogueTrigger = 'death'
    const bossGold = boss.gold || 0
    message = `${boss.name}を倒した！ (${boss.exp} EXP${bossGold > 0 ? ` +${bossGold}G` : ''})`
    stairsLocked = false
    newPlayer.gold = (newPlayer.gold || 0) + bossGold
    newPlayer.killCount = (newPlayer.killCount || 0) + 1

    // レアアイテムドロップ
    if (boss.dropItem) {
      const dropItem = { ...boss.dropItem, id: `drop_${Date.now()}`, x: boss.x, y: boss.y }
      floorItems = [...floorItems, dropItem]
      message += ` ${boss.dropItem.name}が落ちた！`
    }

    // EXP
    newPlayer.exp += boss.exp
    while (newPlayer.exp >= newPlayer.expToNext) {
      newPlayer.exp -= newPlayer.expToNext
      newPlayer.level++
      newPlayer.maxHp += 5
      newPlayer.hp = Math.min(newPlayer.hp + 5, newPlayer.maxHp)
      newPlayer.baseAttack += 1
      newPlayer.baseDefense += 1
      newPlayer.expToNext = Math.floor(newPlayer.expToNext * 1.4)
      message += ` レベル${newPlayer.level}に上がった！`
      levelUpFlash = true

      if (SKILL_LEVELS.includes(newPlayer.level)) {
        const choices = getSkillChoices(newPlayer.skills.map((s) => s.id), newPlayer.classId)
        if (choices.length > 0) pendingSkillChoice = choices
      }
    }

    const fov = computeFOV(state.tiles, newPlayer, state.rooms, state.revealed)
    let log = appendLog(state.messageLog, message)

    return {
      ...state,
      player: newPlayer,
      boss: newBoss,
      floorItems,
      visible: fov.visible,
      revealed: fov.revealed,
      message,
      messageLog: log,
      damagePopups: popups,
      gameOver: false,
      stairsLocked: false,
      pendingSkillChoice,
      levelUpFlash,
      bossDialogueTrigger,
    }
  }

  // ボス生存中: ボスのターン
  const { defense } = getPlayerStats(newPlayer)
  const bossResult = processBossTurn(newBoss, newPlayer, defense, state.tiles, state.enemies)
  newBoss = bossResult.boss
  const addedEnemies = bossResult.summonEnemies || []

  // 通常敵のターン
  const allEnemies = [...state.enemies, ...addedEnemies]
  const result = processEnemyTurn(allEnemies, newPlayer, state.tiles, state.rooms)
  const fov = computeFOV(state.tiles, result.player, state.rooms, state.revealed)

  // ボスダメージ処理
  let bossPopups = []
  let bossMsg = null
  let totalBossDmg = 0
  if (bossResult.damageEvents.length > 0) {
    const pSkills = result.player.skills || []
    for (const event of bossResult.damageEvents) {
      if (checkEvasion(pSkills)) {
        bossPopups.push({ id: Date.now() + Math.random(), x: event.x, y: event.y, text: 'MISS', color: '#88aaff', timer: 30 })
        bossMsg = `${event.enemyName}の攻撃を見切った！`
        continue
      }
      totalBossDmg += event.damage
      bossPopups.push({ id: Date.now() + Math.random(), x: event.x, y: event.y, text: `${event.damage}`, color: '#ff4444', timer: 30 })
      bossMsg = bossResult.message
    }
  } else if (bossResult.message) {
    bossMsg = bossResult.message
  }

  const playerAfterBoss = { ...result.player, hp: Math.max(0, result.player.hp - totalBossDmg) }
  const gameOver = result.gameOver || playerAfterBoss.hp <= 0

  const finalMsg = bossMsg || result.message || message
  let log = appendLog(state.messageLog, message)
  if (bossMsg) log = appendLog(log, bossMsg)
  if (result.message) log = appendLog(log, result.message)

  return {
    ...state,
    player: playerAfterBoss,
    enemies: result.enemies,
    boss: newBoss,
    floorItems,
    visible: fov.visible,
    revealed: fov.revealed,
    message: finalMsg,
    messageLog: log,
    damagePopups: [...popups, ...bossPopups, ...result.damagePopups],
    gameOver,
    pendingSkillChoice,
    levelUpFlash,
    stairsLocked,
    bossDialogueTrigger,
  }
}

function attackEnemy(state, enemy) {
  const { attack } = getPlayerStats(state.player)
  const skills = state.player.skills || []
  const weapon = state.player.equipment.weapon
  let { damage, isCritical, isFireSlash, isLifesteal, lifestealAmount, isPoisonApplied, isPowerStrike, isFireball, mpCost } = calcPlayerDamage(attack, enemy.defense, skills, weapon, state.player)

  // 奇襲スキル: 敵が未行動なら2倍ダメージ
  let isAmbush = false
  if (skills.some((s) => s.id === 'ambush') && (enemy.turnCount || 0) === 0) {
    damage = damage * 2
    isAmbush = true
  }

  const newHp = enemy.hp - damage

  let popupColor = '#ffcc44'
  let popupText = `${damage}`
  if (isAmbush) {
    popupColor = '#44ff44'
    popupText = `${damage}!!`
  } else if (isPowerStrike) {
    popupColor = '#ff2222'
    popupText = `${damage}!!`
  } else if (isFireball) {
    popupColor = '#ff5500'
    popupText = `${damage}🔥`
  } else if (isCritical) {
    popupColor = '#ff44ff'
    popupText = `${damage}!`
  } else if (isFireSlash) {
    popupColor = '#ff6633'
  }

  const popups = [{ id: Date.now(), x: enemy.x, y: enemy.y, text: popupText, color: popupColor, timer: 30 }]

  let message = `${enemy.name}に${damage}のダメージ！`
  if (isAmbush) message = `奇襲！ ${enemy.name}に${damage}のダメージ！`
  else if (isPowerStrike) message = `渾身の一撃！ ${enemy.name}に${damage}のダメージ！`
  else if (isFireball) message = `ファイアボール！ ${enemy.name}に${damage}のダメージ！`
  else if (isCritical) message = `会心の一撃！ ${enemy.name}に${damage}のダメージ！`
  else if (isFireSlash) message = `火炎斬り！ ${enemy.name}に${damage}のダメージ！`
  if (isPoisonApplied) message += ' 毒を付与した！'

  let expGain = 0
  const newEnemies = state.enemies.map((e) => {
    if (e.id === enemy.id) {
      const updated = { ...e, hp: Math.max(0, newHp) }
      if (isPoisonApplied && newHp > 0) {
        updated.poison = { turns: 3, damage: 3 }
      }
      return updated
    }
    return e
  })

  if (newHp <= 0) {
    const goldGain = enemy.gold || 0
    message = `${enemy.name}を倒した！ (${enemy.exp} EXP${goldGain > 0 ? ` +${goldGain}G` : ''})`
    expGain = enemy.exp
  }

  let newPlayer = { ...state.player }
  let pendingSkillChoice = null
  let levelUpFlash = false

  // 渾身の一撃HP消費
  if (isPowerStrike) newPlayer.hp = Math.max(1, newPlayer.hp - 5)
  // ファイアボールMP消費
  if (mpCost > 0) newPlayer.mp = Math.max(0, (newPlayer.mp || 0) - mpCost)

  // HP吸収
  if (isLifesteal && lifestealAmount > 0) {
    newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + lifestealAmount)
    message += ` HP${lifestealAmount}吸収！`
  }

  // 盗むスキル: 撃破時30%でアイテムドロップ
  let floorItems = state.floorItems
  if (newHp <= 0 && newPlayer.skills.some((s) => s.id === 'steal') && Math.random() < 0.3) {
    const pool = getItemPoolForFloor(state.floor)
    if (pool.length > 0) {
      const itemType = pick(pool)
      const item = createItemInstance(itemType, enemy.x, enemy.y)
      floorItems = [...floorItems, item]
      message += ` アイテムを盗んだ！`
    }
  }

  if (expGain > 0) {
    newPlayer.exp += expGain
    // ゴールド加算 & キルカウント
    const goldGain = enemy.gold || 0
    newPlayer.gold = (newPlayer.gold || 0) + goldGain
    newPlayer.killCount = (newPlayer.killCount || 0) + 1
    while (newPlayer.exp >= newPlayer.expToNext) {
      newPlayer.exp -= newPlayer.expToNext
      newPlayer.level++
      newPlayer.maxHp += 5
      newPlayer.hp = Math.min(newPlayer.hp + 5, newPlayer.maxHp)
      newPlayer.baseAttack += 1
      newPlayer.baseDefense += 1
      newPlayer.expToNext = Math.floor(newPlayer.expToNext * 1.4)
      message += ` レベル${newPlayer.level}に上がった！`
      levelUpFlash = true

      // スキル選択判定
      if (SKILL_LEVELS.includes(newPlayer.level)) {
        const choices = getSkillChoices(newPlayer.skills.map((s) => s.id), newPlayer.classId)
        if (choices.length > 0) {
          pendingSkillChoice = choices
        }
      }
    }
  }

  const aliveEnemies = newEnemies.filter((e) => e.hp > 0)
  const result = processEnemyTurn(aliveEnemies, newPlayer, state.tiles, state.rooms)
  const fov = computeFOV(state.tiles, result.player, state.rooms, state.revealed)

  const finalMsg = result.message || message
  let log = appendLog(state.messageLog, message)
  if (result.message) log = appendLog(log, result.message)

  return {
    ...state,
    player: result.player,
    enemies: result.enemies,
    floorItems,
    visible: fov.visible,
    revealed: fov.revealed,
    message: finalMsg,
    messageLog: log,
    damagePopups: [...popups, ...result.damagePopups],
    gameOver: result.gameOver,
    pendingSkillChoice,
    levelUpFlash,
  }
}

function processEnemyTurn(enemies, player, tiles, rooms) {
  const { defense } = getPlayerStats(player)
  const skills = player.skills || []
  const shield = player.equipment.shield

  // 毒ダメージ処理 & ターン減少
  let poisonPopups = []
  let poisonMsg = null
  const afterPoisonEnemies = enemies.map((e) => {
    if (e.poison && e.poison.turns > 0 && e.hp > 0) {
      const newHp = Math.max(0, e.hp - e.poison.damage)
      const newTurns = e.poison.turns - 1
      poisonPopups.push({
        id: Date.now() + Math.random(),
        x: e.x, y: e.y,
        text: `${e.poison.damage}`, color: '#88cc44', timer: 30,
      })
      poisonMsg = `${e.name}は毒で${e.poison.damage}ダメージ！`
      return { ...e, hp: newHp, poison: newTurns > 0 ? { ...e.poison, turns: newTurns } : null }
    }
    return e
  }).filter((e) => e.hp > 0)

  const { enemies: movedEnemies, damageEvents } = processEnemyTurns(afterPoisonEnemies, player, defense, tiles)

  let totalDamage = 0
  const damagePopups = [...poisonPopups]
  let message = poisonMsg

  // 反撃ダメージ
  const thornsDmg = getThornsDamage(shield)

  // 被ダメージ後の敵を追跡
  let finalEnemies = movedEnemies

  for (const event of damageEvents) {
    // 見切りスキル: 回避判定
    if (checkEvasion(skills)) {
      damagePopups.push({
        id: Date.now() + Math.random(),
        x: event.x,
        y: event.y,
        text: 'MISS',
        color: '#88aaff',
        timer: 30,
      })
      message = `${event.enemyName}の攻撃を見切った！`
      continue
    }

    // 盾付与効果でダメージ軽減
    let dmg = event.isExplode ? event.damage : applyShieldEnchant(event.damage, shield)
    // バフによるダメージ軽減（かばう・魔力の盾）
    dmg = applyDefensiveBuffs(dmg, player)

    totalDamage += dmg
    damagePopups.push({
      id: Date.now() + Math.random(),
      x: event.x,
      y: event.y,
      text: `${dmg}`,
      color: '#ff4444',
      timer: 30,
    })
    message = event.isExplode
      ? `${event.enemyName}が自爆した！ ${dmg}のダメージ！`
      : `${event.enemyName}から${dmg}のダメージ！`

    // 反撃ダメージ
    if (thornsDmg > 0 && !event.isExplode) {
      finalEnemies = finalEnemies.map((e) => {
        if (e.name === event.enemyName && e.hp > 0) {
          return { ...e, hp: Math.max(0, e.hp - thornsDmg) }
        }
        return e
      })
    }
  }

  let newHp = player.hp - totalDamage
  let newPlayer = { ...player, hp: Math.max(0, newHp) }

  // テレポートスキル: HP15%以下でMP8消費して安全な部屋に逃げる
  if (newHp > 0 && newHp <= player.maxHp * 0.15
    && skills.some((s) => s.id === 'teleport') && (newPlayer.mp || 0) >= 8
    && rooms && rooms.length > 0) {
    newPlayer.mp -= 8
    const room = pick(rooms)
    newPlayer.x = room.x + Math.floor(room.width / 2)
    newPlayer.y = room.y + Math.floor(room.height / 2)
    message = `テレポート！ 安全な場所に逃げた！`
  }

  const gameOver = newHp <= 0

  return {
    player: newPlayer,
    enemies: finalEnemies,
    damagePopups,
    message,
    gameOver,
  }
}

export function dismissBossWarning(state) {
  return { ...state, bossWarning: null, bossDialogueTrigger: state.boss ? 'taunt' : null }
}

export function descendStairs(state) {
  if (state.gameOver || state.pendingSkillChoice) return state
  if (state.stairsLocked) return state
  if (state.player.x !== state.stairs.x || state.player.y !== state.stairs.y) {
    return state
  }

  let player = { ...state.player }
  let message = ''

  // 回復の心得スキル
  if (player.skills.some((s) => s.id === 'healing_wisdom')) {
    const healed = Math.min(15, player.maxHp - player.hp)
    player.hp += healed
    if (healed > 0) message = ` 回復の心得でHP${healed}回復！`
  }

  // 魔法使いMP回復（フロア移動時に3回復）
  if (player.maxMp > 0 && player.mp < player.maxMp) {
    const mpHealed = Math.min(3, player.maxMp - player.mp)
    player.mp += mpHealed
    message += ` MPが${mpHealed}回復！`
  }

  const nextFloor = state.floor + 1
  const newState = buildFloorState(nextFloor, player, state.messageLog)
  if (message) {
    newState.message += message
    newState.messageLog = appendLog(newState.messageLog, message.trim())
  }

  // AIイベント判定: ボス階でなく、前回イベントから4フロア以上空いていれば20%で発生
  const lastEvt = state.lastAIEventFloor || 0
  const isBoss = isBossFloor(nextFloor)
  if (!isBoss && nextFloor > 1 && (nextFloor - lastEvt) >= 4 && Math.random() < 0.20) {
    newState.aiEventPending = true
    newState.lastAIEventFloor = nextFloor
  } else {
    newState.lastAIEventFloor = lastEvt
  }

  return newState
}

export function selectSkill(state, skillId) {
  if (!state.pendingSkillChoice) return state

  const skill = state.pendingSkillChoice.find((s) => s.id === skillId)
  if (!skill) return state

  const newPlayer = {
    ...state.player,
    skills: [...state.player.skills, skill],
  }

  const msg = `スキル「${skill.name}」を習得した！`
  return {
    ...state,
    player: newPlayer,
    pendingSkillChoice: null,
    message: msg,
    messageLog: appendLog(state.messageLog, msg),
  }
}

export function useItemFromInventory(state, itemId) {
  if (state.gameOver) return state

  const item = state.player.inventory.find((i) => i.id === itemId)
  if (!item) return state

  if (item.type === 'potion') {
    let healAmount = item.stats.heal || 0
    if (item.stats.healPercent) {
      healAmount = Math.floor(state.player.maxHp * item.stats.healPercent / 100)
    }
    const healed = Math.min(healAmount, state.player.maxHp - state.player.hp)
    const msg = `${item.name}を使った！ HPが${healed}回復した`
    return {
      ...state,
      player: {
        ...state.player,
        hp: state.player.hp + healed,
        inventory: state.player.inventory.filter((i) => i.id !== itemId),
      },
      message: msg,
      messageLog: appendLog(state.messageLog, msg),
    }
  }

  if (item.type === 'weapon' || item.type === 'shield') {
    const slot = item.type
    const current = state.player.equipment[slot]
    let newInventory = state.player.inventory.filter((i) => i.id !== itemId)
    if (current) {
      newInventory = [...newInventory, current]
    }
    const msg = `${item.name}を装備した！`
    return {
      ...state,
      player: {
        ...state.player,
        equipment: { ...state.player.equipment, [slot]: item },
        inventory: newInventory,
      },
      message: msg,
      messageLog: appendLog(state.messageLog, msg),
    }
  }

  return state
}

export function dropItemFromInventory(state, itemId) {
  if (state.gameOver) return state

  const item = state.player.inventory.find((i) => i.id === itemId)
  if (!item) return state

  const droppedItem = { ...item, x: state.player.x, y: state.player.y }
  const msg = `${item.name}を足元に置いた`
  return {
    ...state,
    player: {
      ...state.player,
      inventory: state.player.inventory.filter((i) => i.id !== itemId),
    },
    floorItems: [...state.floorItems, droppedItem],
    message: msg,
    messageLog: appendLog(state.messageLog, msg),
  }
}

export function sortInventory(state) {
  if (state.gameOver) return state

  const typeOrder = { weapon: 0, shield: 1, potion: 2 }
  const rarityOrder = { rare: 0, uncommon: 1, common: 2 }
  const sorted = [...state.player.inventory].sort((a, b) => {
    const ta = typeOrder[a.type] ?? 3
    const tb = typeOrder[b.type] ?? 3
    if (ta !== tb) return ta - tb
    const ra = rarityOrder[a.rarity] ?? 3
    const rb = rarityOrder[b.rarity] ?? 3
    return ra - rb
  })

  return {
    ...state,
    player: { ...state.player, inventory: sorted },
  }
}

export function dismissBlacksmith(state) {
  return { ...state, showBlacksmith: false }
}

/**
 * 鍛冶屋で装備を強化する
 * baseItemId: 強化するベース装備のID
 * materialItemId: 素材として消費する装備のID
 * 同じtypeの装備2つを渡すと、ベース装備を+1強化（最大+5）
 */
export function forgeItem(state, baseItemId, materialItemId) {
  if (!state.showBlacksmith) return state

  const inv = state.player.inventory
  const equipped = state.player.equipment
  // ベースはインベントリまたは装備中から探す
  let baseItem = inv.find((i) => i.id === baseItemId)
  let baseIsEquipped = null
  if (!baseItem) {
    if (equipped.weapon?.id === baseItemId) { baseItem = equipped.weapon; baseIsEquipped = 'weapon' }
    else if (equipped.shield?.id === baseItemId) { baseItem = equipped.shield; baseIsEquipped = 'shield' }
  }
  const materialItem = inv.find((i) => i.id === materialItemId)
  if (!baseItem || !materialItem) return state
  if (baseItem.type !== materialItem.type) return state
  if ((baseItem.enhance || 0) >= 5) return state

  const enhanced = { ...baseItem, enhance: (baseItem.enhance || 0) + 1 }
  // 名前に+N表示を更新
  const baseName = enhanced.name.replace(/\+\d+$/, '').trim()
  enhanced.name = `${baseName}+${enhanced.enhance}`
  // ステータス更新（説明文）
  if (enhanced.type === 'weapon') {
    const totalAtk = (enhanced.stats.attack || 0) + enhanced.enhance * 2
    enhanced.description = `攻撃力+${totalAtk}`
  } else if (enhanced.type === 'shield') {
    const totalDef = (enhanced.stats.defense || 0) + enhanced.enhance * 2
    enhanced.description = `防御力+${totalDef}`
  }

  let newInventory = inv.filter((i) => i.id !== materialItemId)
  let newEquipment = { ...equipped }
  if (baseIsEquipped) {
    newEquipment[baseIsEquipped] = enhanced
  } else {
    newInventory = newInventory.map((i) => i.id === baseItemId ? enhanced : i)
  }

  const msg = `${enhanced.name}に強化した！`
  return {
    ...state,
    player: {
      ...state.player,
      inventory: newInventory,
      equipment: newEquipment,
    },
    showBlacksmith: false,
    message: msg,
    messageLog: appendLog(state.messageLog, msg),
  }
}

export function restartGame(bonuses) {
  return createInitialState(bonuses)
}

// --- AI関連の状態管理 ---

export function setAIEvent(state, eventData) {
  return { ...state, aiEvent: eventData, aiEventPending: false }
}

export function applyAIEventChoice(state, choiceIndex) {
  if (!state.aiEvent || !state.aiEvent.choices) return state
  const choice = state.aiEvent.choices[choiceIndex]
  if (!choice) return state

  const effect = choice.effect || {}
  let newPlayer = { ...state.player }
  let messages = [choice.outcome]

  if (effect.hp) {
    newPlayer.hp = Math.max(1, Math.min(newPlayer.maxHp, newPlayer.hp + effect.hp))
    if (effect.hp > 0) messages.push(`HPが${effect.hp}回復した`)
    else messages.push(`${Math.abs(effect.hp)}のダメージを受けた`)
  }
  if (effect.gold) {
    newPlayer.gold = Math.max(0, (newPlayer.gold || 0) + effect.gold)
    if (effect.gold > 0) messages.push(`${effect.gold}ゴールドを入手した`)
    else messages.push(`${Math.abs(effect.gold)}ゴールドを失った`)
  }
  if (effect.attack) {
    newPlayer.baseAttack = (newPlayer.baseAttack || 0) + effect.attack
    messages.push(`攻撃力が${effect.attack}上がった`)
  }
  if (effect.defense) {
    newPlayer.baseDefense = (newPlayer.baseDefense || 0) + effect.defense
    messages.push(`防御力が${effect.defense}上がった`)
  }

  const msg = messages.join(' ')
  return {
    ...state,
    player: newPlayer,
    aiEvent: null,
    aiEventPending: false,
    message: msg,
    messageLog: appendLog(state.messageLog, msg),
  }
}

export function setBossDialogue(state, dialogue) {
  return { ...state, bossDialogue: dialogue }
}

export function clearBossDialogue(state) {
  return { ...state, bossDialogue: null }
}

export function clearBossDialogueTrigger(state) {
  return { ...state, bossDialogueTrigger: null }
}
