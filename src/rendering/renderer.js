import { TILE_SIZE, TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'
import { getCameraOffset } from './camera'
import {
  drawWall, drawFloor, drawCorridor, drawStairs,
  drawPlayer, drawEnemy, drawBoss, drawItem, drawGold, drawDamagePopup, drawBlacksmith,
} from './sprites'

/**
 * ゲーム画面を描画
 */
export function renderGame(ctx, canvas, state) {
  const { tiles, player, visible, revealed, enemies, floorItems, damagePopups, boss, stairsLocked, blacksmith } = state
  const w = canvas.width
  const h = canvas.height

  // 背景クリア
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  const { offsetX, offsetY } = getCameraOffset(player, w, h)

  // 描画範囲の計算
  const startCol = Math.max(0, Math.floor(-offsetX / TILE_SIZE))
  const endCol = Math.min(MAP_WIDTH, Math.ceil((w - offsetX) / TILE_SIZE))
  const startRow = Math.max(0, Math.floor(-offsetY / TILE_SIZE))
  const endRow = Math.min(MAP_HEIGHT, Math.ceil((h - offsetY) / TILE_SIZE))

  // タイル描画
  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      const screenX = x * TILE_SIZE + offsetX
      const screenY = y * TILE_SIZE + offsetY

      if (!revealed[y][x]) continue

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
        // ロック中は赤い×を描画
        if (stairsLocked) {
          ctx.strokeStyle = '#cc4444'
          ctx.lineWidth = 3
          const m = TILE_SIZE * 0.2
          ctx.beginPath()
          ctx.moveTo(screenX + m, screenY + m)
          ctx.lineTo(screenX + TILE_SIZE - m, screenY + TILE_SIZE - m)
          ctx.moveTo(screenX + TILE_SIZE - m, screenY + m)
          ctx.lineTo(screenX + m, screenY + TILE_SIZE - m)
          ctx.stroke()
        }
      }

      // 視界外だが探索済み → 暗くする
      if (!visible[y][x]) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE)
      }
    }
  }

  // 床アイテム・ゴールド描画（視界内のみ）
  if (floorItems) {
    for (const item of floorItems) {
      if (!visible[item.y]?.[item.x]) continue
      const sx = item.x * TILE_SIZE + offsetX
      const sy = item.y * TILE_SIZE + offsetY
      if (item.type === 'gold') {
        drawGold(ctx, sx, sy)
      } else {
        drawItem(ctx, sx, sy, item)
      }
    }
  }

  // 敵描画（視界内のみ）
  if (enemies) {
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue
      if (!visible[enemy.y]?.[enemy.x]) continue
      const sx = enemy.x * TILE_SIZE + offsetX
      const sy = enemy.y * TILE_SIZE + offsetY
      drawEnemy(ctx, sx, sy, enemy)
    }
  }

  // ボス描画（2x2タイル）
  if (boss && boss.hp > 0) {
    const bossVisible = visible[boss.y]?.[boss.x] || visible[boss.y]?.[boss.x + 1]
      || visible[boss.y + 1]?.[boss.x] || visible[boss.y + 1]?.[boss.x + 1]
    if (bossVisible) {
      const bx = boss.x * TILE_SIZE + offsetX
      const by = boss.y * TILE_SIZE + offsetY
      drawBoss(ctx, bx, by, boss)
    }
  }

  // 鍛冶屋NPC描画
  if (blacksmith && visible[blacksmith.y]?.[blacksmith.x]) {
    const bsx = blacksmith.x * TILE_SIZE + offsetX
    const bsy = blacksmith.y * TILE_SIZE + offsetY
    drawBlacksmith(ctx, bsx, bsy)
  }

  // プレイヤー描画
  const px = player.x * TILE_SIZE + offsetX
  const py = player.y * TILE_SIZE + offsetY
  drawPlayer(ctx, px, py, player.classId)

  // ダメージポップアップ描画
  if (damagePopups) {
    for (const popup of damagePopups) {
      if (popup.timer <= 0) continue
      const sx = popup.x * TILE_SIZE + offsetX
      const sy = popup.y * TILE_SIZE + offsetY
      drawDamagePopup(ctx, sx, sy, popup)
    }
  }
}
