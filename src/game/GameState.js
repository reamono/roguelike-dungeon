import { generateFloor } from './dungeon'
import { computeFOV } from './fov'
import { calcDamage, getPlayerStats } from './combat'
import { processEnemyTurns } from './enemyAI'
import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'
import { getEnemyTypesForFloor, scaleEnemy } from '../data/enemies'
import { getItemPoolForFloor, createItemInstance } from '../data/items'
import { randInt, pick } from '../utils/random'

const MAX_INVENTORY = 10

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

function spawnItems(rooms, playerStart, floor, tiles, enemies) {
  const pool = getItemPoolForFloor(floor)
  if (pool.length === 0) return []

  const items = []
  const itemCount = randInt(2, 4)

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

function buildFloorState(floor, player) {
  const floorData = generateFloor(floor)
  const revealed = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  )
  const newPlayer = { ...player, x: floorData.playerStart.x, y: floorData.playerStart.y }
  const enemies = spawnEnemies(floorData.rooms, floorData.playerStart, floor, floorData.tiles)
  const floorItems = spawnItems(floorData.rooms, floorData.playerStart, floor, floorData.tiles, enemies)
  const fov = computeFOV(floorData.tiles, newPlayer, floorData.rooms, revealed)

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
    message: `${floor}階に降りた...`,
    damagePopups: [],
    gameOver: false,
  }
}

export function createInitialState() {
  return buildFloorState(1, createPlayer())
}

export function movePlayer(state, dx, dy) {
  if (state.gameOver) return state

  const nx = state.player.x + dx
  const ny = state.player.y + dy

  if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) return state
  if (state.tiles[ny][nx] === TILE.WALL) return state

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
    message = '階段を見つけた！ タップで次の階へ'
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

  // 敵のターン
  const result = processEnemyTurn(state.enemies, newPlayer, state.tiles)
  const fov = computeFOV(state.tiles, result.player, state.rooms, state.revealed)

  return {
    ...state,
    player: result.player,
    enemies: result.enemies,
    floorItems,
    visible: fov.visible,
    revealed: fov.revealed,
    message: result.message || message,
    damagePopups: [...newPopups, ...result.damagePopups],
    gameOver: result.gameOver,
  }
}

function attackEnemy(state, enemy) {
  const { attack } = getPlayerStats(state.player)
  const damage = calcDamage(attack, enemy.defense)
  const newHp = enemy.hp - damage
  const popups = [{ id: Date.now(), x: enemy.x, y: enemy.y, text: `${damage}`, color: '#ffcc44', timer: 30 }]
  let message = `${enemy.name}に${damage}のダメージ！`
  let expGain = 0

  const newEnemies = state.enemies.map((e) => {
    if (e.id === enemy.id) {
      return { ...e, hp: Math.max(0, newHp) }
    }
    return e
  })

  if (newHp <= 0) {
    message = `${enemy.name}を倒した！ (${enemy.exp} EXP)`
    expGain = enemy.exp
  }

  let newPlayer = { ...state.player }
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
    }
  }

  const aliveEnemies = newEnemies.filter((e) => e.hp > 0)
  const result = processEnemyTurn(aliveEnemies, newPlayer, state.tiles)
  const fov = computeFOV(state.tiles, result.player, state.rooms, state.revealed)

  return {
    ...state,
    player: result.player,
    enemies: result.enemies,
    visible: fov.visible,
    revealed: fov.revealed,
    message: result.message || message,
    damagePopups: [...popups, ...result.damagePopups],
    gameOver: result.gameOver,
  }
}

function processEnemyTurn(enemies, player, tiles) {
  const { defense } = getPlayerStats(player)
  const { enemies: movedEnemies, damageEvents } = processEnemyTurns(enemies, player, defense, tiles)

  let totalDamage = 0
  const damagePopups = []
  let message = null

  for (const event of damageEvents) {
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

export function descendStairs(state) {
  if (state.gameOver) return state
  if (state.player.x !== state.stairs.x || state.player.y !== state.stairs.y) {
    return state
  }

  const nextFloor = state.floor + 1
  return buildFloorState(nextFloor, state.player)
}

export function useItemFromInventory(state, itemId) {
  if (state.gameOver) return state

  const item = state.player.inventory.find((i) => i.id === itemId)
  if (!item) return state

  if (item.type === 'potion') {
    const healed = Math.min(item.stats.heal, state.player.maxHp - state.player.hp)
    return {
      ...state,
      player: {
        ...state.player,
        hp: state.player.hp + healed,
        inventory: state.player.inventory.filter((i) => i.id !== itemId),
      },
      message: `${item.name}を使った！ HPが${healed}回復した`,
    }
  }

  if (item.type === 'weapon' || item.type === 'shield') {
    const slot = item.type
    const current = state.player.equipment[slot]
    let newInventory = state.player.inventory.filter((i) => i.id !== itemId)
    if (current) {
      newInventory = [...newInventory, current]
    }
    return {
      ...state,
      player: {
        ...state.player,
        equipment: { ...state.player.equipment, [slot]: item },
        inventory: newInventory,
      },
      message: `${item.name}を装備した！`,
    }
  }

  return state
}

export function restartGame() {
  return createInitialState()
}
