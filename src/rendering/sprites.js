import { TILE_SIZE } from '../utils/constants'

/**
 * ドット絵風プレイヤーを描画
 */
export function drawPlayer(ctx, screenX, screenY) {
  const s = TILE_SIZE
  const x = screenX
  const y = screenY

  // 体（茶色のローブ）
  ctx.fillStyle = '#8B6914'
  ctx.fillRect(x + s * 0.25, y + s * 0.45, s * 0.5, s * 0.45)

  // 頭（肌色）
  ctx.fillStyle = '#ffcc44'
  ctx.fillRect(x + s * 0.3, y + s * 0.15, s * 0.4, s * 0.35)

  // 目
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(x + s * 0.35, y + s * 0.28, s * 0.08, s * 0.08)
  ctx.fillRect(x + s * 0.55, y + s * 0.28, s * 0.08, s * 0.08)

  // 帽子（冒険者風）
  ctx.fillStyle = '#cc4444'
  ctx.fillRect(x + s * 0.2, y + s * 0.1, s * 0.6, s * 0.12)
  ctx.fillRect(x + s * 0.3, y + s * 0.0, s * 0.4, s * 0.12)
}

/**
 * 階段を描画
 */
export function drawStairs(ctx, screenX, screenY) {
  const s = TILE_SIZE
  ctx.fillStyle = '#44aa66'
  ctx.fillRect(screenX + s * 0.1, screenY + s * 0.7, s * 0.8, s * 0.15)
  ctx.fillRect(screenX + s * 0.2, screenY + s * 0.5, s * 0.6, s * 0.15)
  ctx.fillRect(screenX + s * 0.3, screenY + s * 0.3, s * 0.4, s * 0.15)
  ctx.fillRect(screenX + s * 0.4, screenY + s * 0.1, s * 0.2, s * 0.15)

  // 矢印的な装飾
  ctx.fillStyle = '#66cc88'
  ctx.fillRect(screenX + s * 0.45, screenY + s * 0.05, s * 0.1, s * 0.1)
}

/**
 * 壁のドット絵パターン
 */
export function drawWall(ctx, screenX, screenY) {
  const s = TILE_SIZE
  // 基本の壁色
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(screenX, screenY, s, s)

  // レンガ模様
  ctx.fillStyle = '#222244'
  // 上段
  ctx.fillRect(screenX + 1, screenY + 1, s * 0.45 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.5, screenY + 1, s * 0.5 - 1, s * 0.3 - 1)
  // 中段（ずらす）
  ctx.fillRect(screenX + 1, screenY + s * 0.35, s * 0.25 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.3, screenY + s * 0.35, s * 0.45 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.78, screenY + s * 0.35, s * 0.22 - 1, s * 0.3 - 1)
  // 下段
  ctx.fillRect(screenX + 1, screenY + s * 0.7, s * 0.45 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.5, screenY + s * 0.7, s * 0.5 - 1, s * 0.3 - 1)
}

/**
 * 床タイル
 */
export function drawFloor(ctx, screenX, screenY) {
  const s = TILE_SIZE
  ctx.fillStyle = '#2a2a4a'
  ctx.fillRect(screenX, screenY, s, s)

  // ドット装飾（まばらな点）
  ctx.fillStyle = '#333366'
  ctx.fillRect(screenX + s * 0.2, screenY + s * 0.3, 2, 2)
  ctx.fillRect(screenX + s * 0.7, screenY + s * 0.6, 2, 2)
  ctx.fillRect(screenX + s * 0.5, screenY + s * 0.8, 2, 2)
}

/**
 * 通路タイル
 */
export function drawCorridor(ctx, screenX, screenY) {
  const s = TILE_SIZE
  ctx.fillStyle = '#222244'
  ctx.fillRect(screenX, screenY, s, s)

  ctx.fillStyle = '#282850'
  ctx.fillRect(screenX + s * 0.4, screenY + s * 0.4, 2, 2)
}
