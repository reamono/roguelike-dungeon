import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'

/**
 * カメラ（ビューポート）の位置を計算
 * プレイヤーが中心に来るようにオフセットを返す
 *
 * @param {{x:number, y:number}} player - プレイヤーのタイル座標
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {{ offsetX: number, offsetY: number }}
 */
export function getCameraOffset(player, canvasWidth, canvasHeight) {
  // プレイヤーをキャンバス中央に配置
  let offsetX = canvasWidth / 2 - (player.x + 0.5) * TILE_SIZE
  let offsetY = canvasHeight / 2 - (player.y + 0.5) * TILE_SIZE

  // マップ端でのクランプ
  const mapPixelW = MAP_WIDTH * TILE_SIZE
  const mapPixelH = MAP_HEIGHT * TILE_SIZE

  // マップが画面より小さい場合は中央寄せ
  if (mapPixelW <= canvasWidth) {
    offsetX = (canvasWidth - mapPixelW) / 2
  } else {
    offsetX = Math.min(0, Math.max(canvasWidth - mapPixelW, offsetX))
  }

  if (mapPixelH <= canvasHeight) {
    offsetY = (canvasHeight - mapPixelH) / 2
  } else {
    offsetY = Math.min(0, Math.max(canvasHeight - mapPixelH, offsetY))
  }

  return { offsetX, offsetY }
}
