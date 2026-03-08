import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'

const VIEW_RADIUS = 5

/**
 * 視界を計算する
 * 部屋内にいる場合は部屋全体が見える
 * 通路にいる場合は周囲 VIEW_RADIUS マスが見える
 *
 * @param {number[][]} tiles
 * @param {{x:number, y:number}} player
 * @param {object[]} rooms
 * @param {boolean[][]} revealed - 既に探索済みのマス
 * @returns {{ visible: boolean[][], revealed: boolean[][] }}
 */
export function computeFOV(tiles, player, rooms, revealed) {
  const visible = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  )
  const newRevealed = revealed.map((row) => [...row])

  // プレイヤーがいる部屋を探す
  const currentRoom = rooms.find(
    (r) =>
      player.x >= r.x &&
      player.x < r.x + r.width &&
      player.y >= r.y &&
      player.y < r.y + r.height
  )

  if (currentRoom) {
    // 部屋全体を可視に
    for (let y = currentRoom.y; y < currentRoom.y + currentRoom.height; y++) {
      for (let x = currentRoom.x; x < currentRoom.x + currentRoom.width; x++) {
        visible[y][x] = true
        newRevealed[y][x] = true
      }
    }
    // 部屋の壁も見せる（1マス外周）
    for (let y = currentRoom.y - 1; y <= currentRoom.y + currentRoom.height; y++) {
      for (let x = currentRoom.x - 1; x <= currentRoom.x + currentRoom.width; x++) {
        if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
          visible[y][x] = true
          newRevealed[y][x] = true
        }
      }
    }
  }

  // 通路や部屋の入口付近の視界: プレイヤー周囲を円形に可視化
  for (let dy = -VIEW_RADIUS; dy <= VIEW_RADIUS; dy++) {
    for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
      if (dx * dx + dy * dy > VIEW_RADIUS * VIEW_RADIUS) continue
      const tx = player.x + dx
      const ty = player.y + dy
      if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue

      // 簡易レイキャスト: プレイヤーからの直線上に壁がなければ見える
      if (hasLineOfSight(tiles, player.x, player.y, tx, ty)) {
        visible[ty][tx] = true
        newRevealed[ty][tx] = true
      }
    }
  }

  return { visible, revealed: newRevealed }
}

function hasLineOfSight(tiles, x0, y0, x1, y1) {
  // Bresenham の直線アルゴリズム
  let dx = Math.abs(x1 - x0)
  let dy = Math.abs(y1 - y0)
  let sx = x0 < x1 ? 1 : -1
  let sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  let cx = x0
  let cy = y0

  while (cx !== x1 || cy !== y1) {
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      cx += sx
    }
    if (e2 < dx) {
      err += dx
      cy += sy
    }
    // 途中のマスが壁なら見えない（目的地が壁自身の場合は壁を見せる）
    if (cx === x1 && cy === y1) return true
    if (tiles[cy][cx] === TILE.WALL) return false
  }
  return true
}
