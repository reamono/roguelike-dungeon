import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'
import { randInt } from '../utils/random'

const MIN_ROOM_SIZE = 5
const MAX_ROOM_SIZE = 10
const MIN_ROOMS = 3
const MAX_ROOMS = 5
const ROOM_PADDING = 2

/**
 * ボスフロア用: 広い1部屋を生成
 */
export function generateBossFloor() {
  const tiles = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(TILE.WALL)
  )

  // 大きな1部屋（マップの大部分を使う）
  const room = {
    x: 4,
    y: 3,
    width: MAP_WIDTH - 8,
    height: MAP_HEIGHT - 6,
  }
  carveRoom(tiles, room)

  // 階段は部屋の奥（上側中央）
  const stairsX = Math.floor(room.x + room.width / 2)
  const stairsY = room.y + 1
  tiles[stairsY][stairsX] = TILE.STAIRS

  // プレイヤーは部屋の手前（下側中央）
  const playerStart = {
    x: Math.floor(room.x + room.width / 2),
    y: room.y + room.height - 2,
  }

  // ボスは部屋の中央付近
  const bossStart = {
    x: Math.floor(room.x + room.width / 2) - 1,
    y: Math.floor(room.y + room.height / 2) - 1,
  }

  return {
    tiles,
    rooms: [room],
    stairs: { x: stairsX, y: stairsY },
    playerStart,
    bossStart,
  }
}

/**
 * BSP法でランダムダンジョンを生成
 * @param {number} floor - 現在のフロア番号
 * @returns {{ tiles: number[][], rooms: object[], stairs: {x:number,y:number}, playerStart: {x:number,y:number} }}
 */
export function generateFloor(floor) {
  // 全体を壁で初期化
  const tiles = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(TILE.WALL)
  )

  // 部屋を生成
  const rooms = []
  const roomCount = randInt(MIN_ROOMS, MAX_ROOMS)
  let attempts = 0

  while (rooms.length < roomCount && attempts < 200) {
    attempts++
    const w = randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE)
    const h = randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE)
    const x = randInt(ROOM_PADDING, MAP_WIDTH - w - ROOM_PADDING)
    const y = randInt(ROOM_PADDING, MAP_HEIGHT - h - ROOM_PADDING)

    const room = { x, y, width: w, height: h }

    // 他の部屋と重なっていないか確認（余白付き）
    const overlaps = rooms.some(
      (r) =>
        x - 1 < r.x + r.width &&
        x + w + 1 > r.x &&
        y - 1 < r.y + r.height &&
        y + h + 1 > r.y
    )

    if (!overlaps) {
      rooms.push(room)
      carveRoom(tiles, room)
    }
  }

  // 部屋を通路でつなぐ
  for (let i = 1; i < rooms.length; i++) {
    connectRooms(tiles, rooms[i - 1], rooms[i])
  }

  // 階段を最後の部屋に配置
  const lastRoom = rooms[rooms.length - 1]
  const stairsX = randInt(lastRoom.x + 1, lastRoom.x + lastRoom.width - 2)
  const stairsY = randInt(lastRoom.y + 1, lastRoom.y + lastRoom.height - 2)
  tiles[stairsY][stairsX] = TILE.STAIRS

  // プレイヤーの開始位置は最初の部屋の中央
  const firstRoom = rooms[0]
  const playerStart = {
    x: Math.floor(firstRoom.x + firstRoom.width / 2),
    y: Math.floor(firstRoom.y + firstRoom.height / 2),
  }

  return {
    tiles,
    rooms,
    stairs: { x: stairsX, y: stairsY },
    playerStart,
  }
}

function carveRoom(tiles, room) {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      tiles[y][x] = TILE.FLOOR
    }
  }
}

function connectRooms(tiles, roomA, roomB) {
  const ax = Math.floor(roomA.x + roomA.width / 2)
  const ay = Math.floor(roomA.y + roomA.height / 2)
  const bx = Math.floor(roomB.x + roomB.width / 2)
  const by = Math.floor(roomB.y + roomB.height / 2)

  // L字型通路：まず水平、次に垂直
  if (Math.random() < 0.5) {
    carveHCorridor(tiles, ax, bx, ay)
    carveVCorridor(tiles, ay, by, bx)
  } else {
    carveVCorridor(tiles, ay, by, ax)
    carveHCorridor(tiles, ax, bx, by)
  }
}

function carveHCorridor(tiles, x1, x2, y) {
  const start = Math.min(x1, x2)
  const end = Math.max(x1, x2)
  for (let x = start; x <= end; x++) {
    if (tiles[y][x] === TILE.WALL) {
      tiles[y][x] = TILE.CORRIDOR
    }
  }
}

function carveVCorridor(tiles, y1, y2, x) {
  const start = Math.min(y1, y2)
  const end = Math.max(y1, y2)
  for (let y = start; y <= end; y++) {
    if (tiles[y][x] === TILE.WALL) {
      tiles[y][x] = TILE.CORRIDOR
    }
  }
}
