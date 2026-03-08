import { generateFloor, generateBossFloor } from './dungeon'
import { computeFOV } from './fov'
import { calcPlayerDamage, getPlayerStats, checkEvasion } from './combat'
import { processEnemyTurns } from './enemyAI'
import { processBossTurn } from './bossAI'
import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'
import { getEnemyTypesForFloor, scaleEnemy } from '../data/enemies'
import { getItemPoolForFloor, createItemInstance } from '../data/items'
import { SKILL_LEVELS, getSkillChoices } from '../data/skills'
import { isBossFloor, getBossForFloor } from '../data/bosses'
import { randInt, pick } from '../utils/random'

const MAX_INVENTORY = 10
const MAX_LOG = 50

let _nextEnemyId = 1

function createPlayer() {
  return {
    x: 0,
    y: 0,
    hp: 30,
    maxHp: 30,
    baseAttack: 5,
    baseDefense: 2,
    level: 1,
    exp: 0,
    expToNext: 20,
    equipment: { weapon: null, shield: null },
    inventory: [],
    skills: [],
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
    isBoss: true,
    specialType: bossData.specialType,
    specialInterval: bossData.specialInterval,
    specialDesc: bossData.specialDesc,
    dropItem: bossData.dropItem,
    turnCount: 0,
  }
}

function buildFloorState(floor, player, prevLog) {
  const boss = isBossFloor(floor) ? getBossForFloor(floor) : null

  let floorData, enemies, floorItems
  if (boss) {
    floorData = generateBossFloor()
    enemies = []
    floorItems = []
  } else {
    floorData = generateFloor(floor)
    enemies = spawnEnemies(floorData.rooms, floorData.playerStart, floor, floorData.tiles)
    floorItems = spawnItems(floorData.rooms, floorData.playerStart, floor, floorData.tiles, enemies, player.skills || [])
  }

  const revealed = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  )
  const newPlayer = { ...player, x: floorData.playerStart.x, y: floorData.playerStart.y }
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
  }
}

export function createInitialState() {
  return buildFloorState(1, createPlayer())
}

// ボスの2x2タイル上かチェック
function isOnBossTile(boss, x, y) {
  if (!boss || boss.hp <= 0) return false
  return x >= boss.x && x <= boss.x + 1 && y >= boss.y && y <= boss.y + 1
}

export function movePlayer(state, dx, dy) {
  if (state.gameOver || state.pendingSkillChoice) return state

  const nx = state.player.x + dx
  const ny = state.player.y + dy

  if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) return state
  if (state.tiles[ny][nx] === TILE.WALL) return state

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
  const newPlayer = { ...state.player, x: nx, y: ny }
  let message = state.message
  const newPopups = []

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
    if (newPlayer.inventory.length < MAX_INVENTORY) {
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
  const result = processEnemyTurn(allEnemies, newPlayer, state.tiles)
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
  const { damage, isCritical, isFireSlash } = calcPlayerDamage(attack, boss.defense, skills)
  const newBossHp = boss.hp - damage

  let popupColor = '#ffcc44'
  let popupText = `${damage}`
  if (isCritical) { popupColor = '#ff44ff'; popupText = `${damage}!` }
  else if (isFireSlash) { popupColor = '#ff6633' }

  // ボスの中心にポップアップ
  const popups = [{ id: Date.now(), x: boss.x + 0.5, y: boss.y, text: popupText, color: popupColor, timer: 30 }]

  let message = `${boss.name}に${damage}のダメージ！`
  if (isCritical) message = `会心の一撃！ ${boss.name}に${damage}のダメージ！`
  else if (isFireSlash) message = `火炎斬り！ ${boss.name}に${damage}のダメージ！`

  let newBoss = { ...boss, hp: Math.max(0, newBossHp) }
  let newPlayer = { ...state.player }
  let pendingSkillChoice = null
  let levelUpFlash = false
  let stairsLocked = state.stairsLocked
  let floorItems = state.floorItems

  // ボス撃破
  if (newBossHp <= 0) {
    message = `${boss.name}を倒した！ (${boss.exp} EXP)`
    stairsLocked = false

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
        const choices = getSkillChoices(newPlayer.skills.map((s) => s.id))
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
    }
  }

  // ボス生存中: ボスのターン
  const { defense } = getPlayerStats(newPlayer)
  const bossResult = processBossTurn(newBoss, newPlayer, defense, state.tiles, state.enemies)
  newBoss = bossResult.boss
  const addedEnemies = bossResult.summonEnemies || []

  // 通常敵のターン
  const allEnemies = [...state.enemies, ...addedEnemies]
  const result = processEnemyTurn(allEnemies, newPlayer, state.tiles)
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
  }
}

function attackEnemy(state, enemy) {
  const { attack } = getPlayerStats(state.player)
  const skills = state.player.skills || []
  const { damage, isCritical, isFireSlash } = calcPlayerDamage(attack, enemy.defense, skills)
  const newHp = enemy.hp - damage

  let popupColor = '#ffcc44'
  let popupText = `${damage}`
  if (isCritical) {
    popupColor = '#ff44ff'
    popupText = `${damage}!`
  } else if (isFireSlash) {
    popupColor = '#ff6633'
  }

  const popups = [{ id: Date.now(), x: enemy.x, y: enemy.y, text: popupText, color: popupColor, timer: 30 }]

  let message = `${enemy.name}に${damage}のダメージ！`
  if (isCritical) message = `会心の一撃！ ${enemy.name}に${damage}のダメージ！`
  else if (isFireSlash) message = `火炎斬り！ ${enemy.name}に${damage}のダメージ！`

  let expGain = 0
  const newEnemies = state.enemies.map((e) => {
    if (e.id === enemy.id) return { ...e, hp: Math.max(0, newHp) }
    return e
  })

  if (newHp <= 0) {
    message = `${enemy.name}を倒した！ (${enemy.exp} EXP)`
    expGain = enemy.exp
  }

  let newPlayer = { ...state.player }
  let pendingSkillChoice = null
  let levelUpFlash = false

  if (expGain > 0) {
    newPlayer.exp += expGain
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
        const choices = getSkillChoices(newPlayer.skills.map((s) => s.id))
        if (choices.length > 0) {
          pendingSkillChoice = choices
        }
      }
    }
  }

  const aliveEnemies = newEnemies.filter((e) => e.hp > 0)
  const result = processEnemyTurn(aliveEnemies, newPlayer, state.tiles)
  const fov = computeFOV(state.tiles, result.player, state.rooms, state.revealed)

  const finalMsg = result.message || message
  let log = appendLog(state.messageLog, message)
  if (result.message) log = appendLog(log, result.message)

  return {
    ...state,
    player: result.player,
    enemies: result.enemies,
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

function processEnemyTurn(enemies, player, tiles) {
  const { defense } = getPlayerStats(player)
  const skills = player.skills || []
  const { enemies: movedEnemies, damageEvents } = processEnemyTurns(enemies, player, defense, tiles)

  let totalDamage = 0
  const damagePopups = []
  let message = null

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

    totalDamage += event.damage
    damagePopups.push({
      id: Date.now() + Math.random(),
      x: event.x,
      y: event.y,
      text: `${event.damage}`,
      color: '#ff4444',
      timer: 30,
    })
    message = `${event.enemyName}から${event.damage}のダメージ！`
  }

  const newHp = player.hp - totalDamage
  const gameOver = newHp <= 0

  return {
    player: { ...player, hp: Math.max(0, newHp) },
    enemies: movedEnemies,
    damagePopups,
    message,
    gameOver,
  }
}

export function dismissBossWarning(state) {
  return { ...state, bossWarning: null }
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

  const nextFloor = state.floor + 1
  const newState = buildFloorState(nextFloor, player, state.messageLog)
  if (message) {
    newState.message += message
    newState.messageLog = appendLog(newState.messageLog, message.trim())
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
    const healed = Math.min(item.stats.heal, state.player.maxHp - state.player.hp)
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

export function restartGame() {
  return createInitialState()
}
