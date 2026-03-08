import { calcDamage } from './combat'
import { TILE, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants'

// ボスが占めるタイル（2x2）の中心からの距離を計算
function bossDistToPlayer(boss, player) {
  // ボスの中心座標（2x2の左上がboss.x, boss.y）
  const cx = boss.x + 0.5
  const cy = boss.y + 0.5
  return Math.abs(player.x - cx) + Math.abs(player.y - cy)
}

// ボスの2x2タイルにプレイヤーが隣接しているか
function isAdjacentToBoss(boss, player) {
  const px = player.x
  const py = player.y
  // ボスが占めるマス: (x,y), (x+1,y), (x,y+1), (x+1,y+1)
  // 隣接 = ボスの占めるマスのいずれかにマンハッタン距離1
  for (let bx = boss.x; bx <= boss.x + 1; bx++) {
    for (let by = boss.y; by <= boss.y + 1; by++) {
      const dist = Math.abs(px - bx) + Math.abs(py - by)
      if (dist === 1) return true
    }
  }
  return false
}

// プレイヤーがボスの2x2タイル上にいるか
function isOnBoss(boss, px, py) {
  return px >= boss.x && px <= boss.x + 1 && py >= boss.y && py <= boss.y + 1
}

// ボスの移動（2x2として移動可能かチェック）
function canBossMoveTo(boss, nx, ny, tiles) {
  for (let dx = 0; dx <= 1; dx++) {
    for (let dy = 0; dy <= 1; dy++) {
      const tx = nx + dx
      const ty = ny + dy
      if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false
      if (tiles[ty][tx] === TILE.WALL) return false
    }
  }
  return true
}

// ボスAI処理
export function processBossTurn(boss, player, defense, tiles, enemies) {
  const result = {
    boss: { ...boss },
    damageEvents: [],
    summonEnemies: [],
    message: null,
  }

  // ターンカウンタ
  result.boss.turnCount = (boss.turnCount || 0) + 1
  const isSpecialTurn = result.boss.turnCount % boss.specialInterval === 0

  const adjacent = isAdjacentToBoss(boss, player)

  // 特殊攻撃判定
  if (isSpecialTurn && adjacent) {
    return processBossSpecial(result, boss, player, defense, tiles, enemies)
  }

  // 通常攻撃（隣接時）
  if (adjacent) {
    const damage = calcDamage(boss.attack, defense)
    result.damageEvents.push({
      x: player.x,
      y: player.y,
      damage,
      enemyName: boss.name,
    })
    result.message = `${boss.name}の攻撃！ ${damage}のダメージ！`
    return result
  }

  // 特殊攻撃（遠距離系 - ブレス）
  if (isSpecialTurn && boss.specialType === 'breath') {
    const dist = bossDistToPlayer(boss, player)
    if (dist <= 3) {
      return processBossSpecial(result, boss, player, defense, tiles, enemies)
    }
  }

  // 移動（プレイヤーに向かう）
  const cx = boss.x + 0.5
  const cy = boss.y + 0.5
  const ddx = player.x - cx
  const ddy = player.y - cy

  const moves = []
  if (Math.abs(ddx) >= Math.abs(ddy)) {
    moves.push({ dx: ddx > 0 ? 1 : -1, dy: 0 })
    moves.push({ dx: 0, dy: ddy > 0 ? 1 : -1 })
  } else {
    moves.push({ dx: 0, dy: ddy > 0 ? 1 : -1 })
    moves.push({ dx: ddx > 0 ? 1 : -1, dy: 0 })
  }

  for (const move of moves) {
    const nx = boss.x + move.dx
    const ny = boss.y + move.dy
    if (canBossMoveTo(result.boss, nx, ny, tiles) && !isOnBoss({ x: nx, y: ny }, player.x, player.y)) {
      result.boss.x = nx
      result.boss.y = ny
      break
    }
  }

  return result
}

function processBossSpecial(result, boss, player, defense, tiles, enemies) {
  switch (boss.specialType) {
    case 'aoe_melee': {
      // ゴブリンキング: 周囲1マスに範囲攻撃
      const dist = bossDistToPlayer(boss, player)
      if (dist <= 2.5) {
        const damage = calcDamage(Math.floor(boss.attack * 1.3), defense)
        result.damageEvents.push({
          x: player.x,
          y: player.y,
          damage,
          enemyName: boss.name,
        })
        result.message = `${boss.name}が${boss.specialDesc} ${damage}のダメージ！`
      } else {
        result.message = `${boss.name}が${boss.specialDesc} しかし届かなかった！`
      }
      break
    }
    case 'breath': {
      // ドラゴン: 2マス先まで届くブレス攻撃
      const dist = bossDistToPlayer(boss, player)
      if (dist <= 3) {
        const damage = calcDamage(Math.floor(boss.attack * 1.5), defense)
        result.damageEvents.push({
          x: player.x,
          y: player.y,
          damage,
          enemyName: boss.name,
        })
        result.message = `${boss.name}が${boss.specialDesc} ${damage}のダメージ！`
      } else {
        result.message = `${boss.name}が${boss.specialDesc} しかし届かなかった！`
      }
      break
    }
    case 'drain_summon': {
      // 死霊の王: HP吸収 + ザコ召喚
      const adjacent = isAdjacentToBoss(boss, player)
      if (adjacent) {
        const damage = calcDamage(boss.attack, defense)
        const healAmount = Math.floor(damage * 0.5)
        result.boss.hp = Math.min(boss.hp + healAmount, boss.maxHp || boss.hp)
        result.damageEvents.push({
          x: player.x,
          y: player.y,
          damage,
          enemyName: boss.name,
        })
        result.message = `${boss.name}が${boss.specialDesc} ${damage}のダメージ！ HPを${healAmount}吸収した！`
      }
      // ザコ召喚（最大3体まで）
      if (!enemies || enemies.length < 3) {
        const summon = spawnSummonedEnemy(boss, tiles, player, enemies || [])
        if (summon) {
          result.summonEnemies.push(summon)
          if (!result.message) {
            result.message = `${boss.name}が亡霊を召喚した！`
          } else {
            result.message += ` さらに亡霊を召喚した！`
          }
        }
      }
      break
    }
    default:
      break
  }
  return result
}

function spawnSummonedEnemy(boss, tiles, player, enemies) {
  // ボス周辺の空きマスにザコを配置
  const candidates = []
  for (let dx = -2; dx <= 3; dx++) {
    for (let dy = -2; dy <= 3; dy++) {
      const x = boss.x + dx
      const y = boss.y + dy
      if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue
      if (tiles[y][x] === TILE.WALL) continue
      if (x === player.x && y === player.y) continue
      if (isOnBoss(boss, x, y)) continue
      if (enemies.some((e) => e.x === x && e.y === y)) continue
      candidates.push({ x, y })
    }
  }
  if (candidates.length === 0) return null

  const pos = candidates[Math.floor(Math.random() * candidates.length)]
  return {
    id: `summon_${Date.now()}_${Math.random()}`,
    name: '亡霊',
    sprite: 'skeleton',
    color: '#8866aa',
    x: pos.x,
    y: pos.y,
    hp: 15,
    maxHp: 15,
    attack: 10,
    defense: 3,
    exp: 20,
  }
}
