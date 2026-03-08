import { generateFloor } from './dungeon'
import { computeFOV } from './fov'
import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'

export function createInitialState() {
  const floor = 1
  const floorData = generateFloor(floor)
  const revealed = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  )

  const player = { ...floorData.playerStart }
  const fov = computeFOV(floorData.tiles, player, floorData.rooms, revealed)

  return {
    floor,
    player,
    tiles: floorData.tiles,
    rooms: floorData.rooms,
    stairs: floorData.stairs,
    visible: fov.visible,
    revealed: fov.revealed,
    message: '1階に降りた...',
  }
}

export function movePlayer(state, dx, dy) {
  const nx = state.player.x + dx
  const ny = state.player.y + dy

  // 範囲外チェック
  if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) {
    return state
  }

  // 壁チェック
  if (state.tiles[ny][nx] === TILE.WALL) {
    return state
  }

  const newPlayer = { x: nx, y: ny }
  const fov = computeFOV(state.tiles, newPlayer, state.rooms, state.revealed)

  let message = state.message

  // 階段チェック
  if (nx === state.stairs.x && ny === state.stairs.y) {
    message = '階段を見つけた！ タップで次の階へ'
  }

  return {
    ...state,
    player: newPlayer,
    visible: fov.visible,
    revealed: fov.revealed,
    message,
  }
}

export function descendStairs(state) {
  if (
    state.player.x !== state.stairs.x ||
    state.player.y !== state.stairs.y
  ) {
    return state
  }

  const nextFloor = state.floor + 1
  const floorData = generateFloor(nextFloor)
  const revealed = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  )
  const player = { ...floorData.playerStart }
  const fov = computeFOV(floorData.tiles, player, floorData.rooms, revealed)

  return {
    ...state,
    floor: nextFloor,
    player,
    tiles: floorData.tiles,
    rooms: floorData.rooms,
    stairs: floorData.stairs,
    visible: fov.visible,
    revealed: fov.revealed,
    message: `${nextFloor}階に降りた...`,
  }
}
