import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'
import { getEnemyTypesForFloor, scaleEnemy } from '../data/enemies'
import { randInt, pick } from '../utils/random'

let _nextEnemyId = 10000

/**
 * 全敵のターンを処理する
 * 隣接していれば攻撃、そうでなければプレイヤーに向かって移動
 *
 * @returns {{ enemies, damageEvents }} 更新された敵配列とダメージイベント
 */
export function processEnemyTurns(enemies, player, playerDef, tiles) {
  const damageEvents = []
  const newEnemies = []
  const summonQueue = []

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue

    const dx = player.x - enemy.x
    const dy = player.y - enemy.y
    const dist = Math.abs(dx) + Math.abs(dy)

    if (dist === 1) {
      // 隣接 → 攻撃
      const variance = Math.floor(Math.random() * 3) - 1
      const damage = Math.max(1, enemy.attack - playerDef + variance)

      // 特殊行動: 自爆（デーモン、HP25%以下で隣接時に自爆）
      if (enemy.special === 'explode' && enemy.hp <= enemy.maxHp * 0.25) {
        const explodeDmg = Math.floor(enemy.maxHp * 0.4)
        damageEvents.push({
          type: 'enemy_attack',
          enemyName: enemy.name,
          damage: explodeDmg,
          x: player.x,
          y: player.y,
          isExplode: true,
        })
        // 自爆で死亡
        newEnemies.push({ ...enemy, hp: 0 })
        continue
      }

      damageEvents.push({
        type: 'enemy_attack',
        enemyName: enemy.name,
        damage,
        x: player.x,
        y: player.y,
      })

      // 特殊行動: 2回攻撃（コウモリ）
      if (enemy.special === 'double_attack') {
        const variance2 = Math.floor(Math.random() * 3) - 1
        const damage2 = Math.max(1, Math.floor(enemy.attack * 0.6) - playerDef + variance2)
        damageEvents.push({
          type: 'enemy_attack',
          enemyName: enemy.name,
          damage: damage2,
          x: player.x,
          y: player.y,
        })
      }

      newEnemies.push(enemy)
    } else if (dist <= 8) {
      // 特殊行動: 仲間を呼ぶ（オーク、20%確率、隣接前に発動）
      if (enemy.special === 'summon' && Math.random() < 0.2) {
        summonQueue.push({ callerFloor: enemy._floor || 5, x: enemy.x, y: enemy.y })
      }

      // 接近（簡易AI: プレイヤー方向に1歩）
      const moved = tryMoveToward(enemy, player, tiles, enemies, newEnemies)
      newEnemies.push(moved)
    } else {
      // 遠い → 動かない
      newEnemies.push(enemy)
    }
  }

  // 仲間召喚処理
  for (const summon of summonQueue) {
    const spawned = trySummonNearby(summon, tiles, newEnemies, player)
    if (spawned) newEnemies.push(spawned)
  }

  return { enemies: newEnemies, damageEvents }
}

function trySummonNearby(summon, tiles, enemies, player) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [ddx, ddy] of dirs) {
    const nx = summon.x + ddx
    const ny = summon.y + ddy
    if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue
    if (tiles[ny][nx] === TILE.WALL) continue
    if (nx === player.x && ny === player.y) continue
    if (enemies.some((e) => e.hp > 0 && e.x === nx && e.y === ny)) continue

    // ゴブリンを召喚
    const types = getEnemyTypesForFloor(summon.callerFloor)
    const weakType = types.find((t) => t.sprite === 'goblin') || types[0]
    if (!weakType) return null
    const scaled = scaleEnemy(weakType, summon.callerFloor)
    return {
      id: `enemy_${_nextEnemyId++}`,
      name: weakType.name,
      sprite: weakType.sprite,
      color: weakType.color,
      x: nx,
      y: ny,
      ...scaled,
      _floor: summon.callerFloor,
    }
  }
  return null
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
