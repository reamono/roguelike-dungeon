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
 * ドット絵風の敵を描画
 */
export function drawEnemy(ctx, screenX, screenY, enemy) {
  const s = TILE_SIZE
  const x = screenX
  const y = screenY
  const c = enemy.color

  // 体
  ctx.fillStyle = c
  ctx.fillRect(x + s * 0.2, y + s * 0.3, s * 0.6, s * 0.55)

  // 頭
  ctx.fillRect(x + s * 0.25, y + s * 0.1, s * 0.5, s * 0.3)

  // 目（白＋黒）
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x + s * 0.3, y + s * 0.18, s * 0.14, s * 0.1)
  ctx.fillRect(x + s * 0.56, y + s * 0.18, s * 0.14, s * 0.1)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + s * 0.36, y + s * 0.2, s * 0.06, s * 0.06)
  ctx.fillRect(x + s * 0.6, y + s * 0.2, s * 0.06, s * 0.06)

  // HPバー（背景）
  ctx.fillStyle = '#333333'
  ctx.fillRect(x + s * 0.1, y + s * 0.92, s * 0.8, s * 0.06)
  // HPバー（残量）
  const hpRatio = Math.max(0, enemy.hp / enemy.maxHp)
  const barColor = hpRatio > 0.5 ? '#44cc44' : hpRatio > 0.25 ? '#cccc44' : '#cc4444'
  ctx.fillStyle = barColor
  ctx.fillRect(x + s * 0.1, y + s * 0.92, s * 0.8 * hpRatio, s * 0.06)
}

/**
 * 床に落ちているアイテムを描画
 */
export function drawItem(ctx, screenX, screenY, item) {
  const s = TILE_SIZE
  const x = screenX
  const y = screenY

  if (item.type === 'potion') {
    const potionColor =
      item.rarity === 'rare' ? '#ffcc44' : item.rarity === 'uncommon' ? '#cc4444' : '#44cc88'
    ctx.fillStyle = potionColor
    ctx.fillRect(x + s * 0.35, y + s * 0.35, s * 0.3, s * 0.4)
    ctx.fillRect(x + s * 0.4, y + s * 0.25, s * 0.2, s * 0.15)
    ctx.fillStyle = '#aaaaaa'
    ctx.fillRect(x + s * 0.38, y + s * 0.22, s * 0.24, s * 0.06)
  } else if (item.type === 'weapon') {
    const bladeColor =
      item.rarity === 'rare' ? '#aaccff' : item.rarity === 'uncommon' ? '#cccccc' : '#aa8866'
    ctx.fillStyle = bladeColor
    ctx.fillRect(x + s * 0.46, y + s * 0.15, s * 0.08, s * 0.45)
    ctx.fillStyle = '#886644'
    ctx.fillRect(x + s * 0.36, y + s * 0.58, s * 0.28, s * 0.08)
    ctx.fillRect(x + s * 0.44, y + s * 0.64, s * 0.12, s * 0.2)
  } else if (item.type === 'shield') {
    const shieldColor =
      item.rarity === 'rare' ? '#aaccff' : item.rarity === 'uncommon' ? '#cccccc' : '#aa8844'
    ctx.fillStyle = shieldColor
    ctx.fillRect(x + s * 0.25, y + s * 0.2, s * 0.5, s * 0.55)
    ctx.fillRect(x + s * 0.3, y + s * 0.75, s * 0.4, s * 0.1)
    ctx.fillStyle = '#666666'
    ctx.fillRect(x + s * 0.4, y + s * 0.35, s * 0.2, s * 0.25)
  }
}

/**
 * ダメージポップアップを描画
 */
export function drawDamagePopup(ctx, screenX, screenY, popup) {
  const floatY = screenY - (30 - popup.timer) * 1.2
  const alpha = Math.min(1, popup.timer / 10)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = 'bold 14px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#000000'
  ctx.fillText(popup.text, screenX + TILE_SIZE / 2 + 1, floatY + 1)
  ctx.fillStyle = popup.color
  ctx.fillText(popup.text, screenX + TILE_SIZE / 2, floatY)
  ctx.restore()
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

  ctx.fillStyle = '#66cc88'
  ctx.fillRect(screenX + s * 0.45, screenY + s * 0.05, s * 0.1, s * 0.1)
}

/**
 * 壁のドット絵パターン
 */
export function drawWall(ctx, screenX, screenY) {
  const s = TILE_SIZE
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(screenX, screenY, s, s)

  ctx.fillStyle = '#222244'
  ctx.fillRect(screenX + 1, screenY + 1, s * 0.45 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.5, screenY + 1, s * 0.5 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + 1, screenY + s * 0.35, s * 0.25 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.3, screenY + s * 0.35, s * 0.45 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.78, screenY + s * 0.35, s * 0.22 - 1, s * 0.3 - 1)
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
