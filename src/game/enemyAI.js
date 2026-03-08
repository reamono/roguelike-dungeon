import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'

/**
 * 全敵のターンを処理する
 * 隣接していれば攻撃、そうでなければプレイヤーに向かって移動
 *
 * @returns {{ enemies, damageEvents }} 更新された敵配列とダメージイベント
 */
export function processEnemyTurns(enemies, player, playerDef, tiles) {
  const damageEvents = []
  const newEnemies = []

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue

    const dx = player.x - enemy.x
    const dy = player.y - enemy.y
    const dist = Math.abs(dx) + Math.abs(dy)

    if (dist === 1) {
      // 隣接 → 攻撃
      const variance = Math.floor(Math.random() * 3) - 1
      const damage = Math.max(1, enemy.attack - playerDef + variance)
      damageEvents.push({
        type: 'enemy_attack',
        enemyName: enemy.name,
        damage,
        x: player.x,
        y: player.y,
      })
      newEnemies.push(enemy)
    } else if (dist <= 8) {
      // 接近（簡易AI: プレイヤー方向に1歩）
      const moved = tryMoveToward(enemy, player, tiles, enemies, newEnemies)
      newEnemies.push(moved)
    } else {
      // 遠い → 動かない
      newEnemies.push(enemy)
    }
  }

  return { enemies: newEnemies, damageEvents }
}

function tryMoveToward(enemy, target, tiles, allEnemies, resolvedEnemies) {
  const dx = Math.sign(target.x - enemy.x)
  const dy = Math.sign(target.y - enemy.y)

  // 優先方向を試す（主軸 → 副軸）
  const candidates =
    Math.abs(target.x - enemy.x) >= Math.abs(target.y - enemy.y)
      ? [
          { x: enemy.x + dx, y: enemy.y },
          { x: enemy.x, y: enemy.y + dy },
        ]
      : [
          { x: enemy.x, y: enemy.y + dy },
          { x: enemy.x + dx, y: enemy.y },
        ]

  for (const pos of candidates) {
    if (pos.x < 0 || pos.x >= MAP_WIDTH || pos.y < 0 || pos.y >= MAP_HEIGHT) continue
    if (tiles[pos.y][pos.x] === TILE.WALL) continue
    // プレイヤーの位置には移動しない（攻撃は隣接時のみ）
    if (pos.x === target.x && pos.y === target.y) continue
    // 他の敵と重ならない
    const occupied =
      allEnemies.some((e) => e !== enemy && e.hp > 0 && e.x === pos.x && e.y === pos.y) ||
      resolvedEnemies.some((e) => e.x === pos.x && e.y === pos.y)
    if (occupied) continue

    return { ...enemy, x: pos.x, y: pos.y }
  }

  return enemy // 移動できなければ留まる
}
