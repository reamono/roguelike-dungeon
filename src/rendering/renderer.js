import { TILE_SIZE, TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'
import { getCameraOffset } from './camera'
import { drawWall, drawFloor, drawCorridor, drawStairs, drawPlayer } from './sprites'

/**
 * ゲーム画面を描画
 */
export function renderGame(ctx, canvas, state) {
  const { tiles, player, visible, revealed, stairs } = state
  const w = canvas.width
  const h = canvas.height

  // 背景クリア
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  const { offsetX, offsetY } = getCameraOffset(player, w, h)

  // 描画範囲の計算（画面外は描画しない）
  const startCol = Math.max(0, Math.floor(-offsetX / TILE_SIZE))
  const endCol = Math.min(MAP_WIDTH, Math.ceil((w - offsetX) / TILE_SIZE))
  const startRow = Math.max(0, Math.floor(-offsetY / TILE_SIZE))
  const endRow = Math.min(MAP_HEIGHT, Math.ceil((h - offsetY) / TILE_SIZE))

  // タイル描画
  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      const screenX = x * TILE_SIZE + offsetX
      const screenY = y * TILE_SIZE + offsetY

      if (!revealed[y][x]) continue // 未探索は完全に黒

      const tile = tiles[y][x]

      if (tile === TILE.WALL) {
        drawWall(ctx, screenX, screenY)
      } else if (tile === TILE.FLOOR) {
        drawFloor(ctx, screenX, screenY)
      } else if (tile === TILE.CORRIDOR) {
        drawCorridor(ctx, screenX, screenY)
      } else if (tile === TILE.STAIRS) {
        drawFloor(ctx, screenX, screenY)
        drawStairs(ctx, screenX, screenY)
      }

      // 視界外だが探索済み → 暗くする
      if (!visible[y][x]) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE)
      }
    }
  }

  // プレイヤー描画
  const px = player.x * TILE_SIZE + offsetX
  const py = player.y * TILE_SIZE + offsetY
  drawPlayer(ctx, px, py)
}
