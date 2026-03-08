/**
 * ダメージ計算
 * damage = max(1, attack - defense + random(-1, 1))
 */
export function calcDamage(attackerAtk, defenderDef) {
  const variance = Math.floor(Math.random() * 3) - 1 // -1, 0, 1
  return Math.max(1, attackerAtk - defenderDef + variance)
}

/**
 * プレイヤーの実効ステータスを計算（装備 + スキル込み）
 */
export function getPlayerStats(player) {
  let attack = player.baseAttack
  let defense = player.baseDefense
  if (player.equipment.weapon) {
    attack += player.equipment.weapon.stats.attack || 0
  }
  if (player.equipment.shield) {
    defense += player.equipment.shield.stats.defense || 0
  }
  // 鉄壁スキル
  const skills = player.skills || []
  if (skills.some((s) => s.id === 'iron_wall')) {
    defense += 5
  }
  return { attack, defense }
}

/**
 * プレイヤー攻撃時のダメージ計算（スキル効果込み）
 */
export function calcPlayerDamage(attack, defenderDef, skills) {
  let damage = calcDamage(attack, defenderDef)
  let isCritical = false
  let isFireSlash = false

  // 火炎斬り: 常に 1.5 倍
  if (skills.some((s) => s.id === 'fire_slash')) {
    damage = Math.floor(damage * 1.5)
    isFireSlash = true
  }

  // 会心の一撃: 20% で 2 倍
  if (skills.some((s) => s.id === 'critical') && Math.random() < 0.2) {
    damage = damage * 2
    isCritical = true
  }

  return { damage: Math.max(1, damage), isCritical, isFireSlash }
}

/**
 * 敵攻撃時の回避判定（見切りスキル）
 */
export function checkEvasion(skills) {
  if (skills.some((s) => s.id === 'evasion') && Math.random() < 0.25) {
    return true
  }
  return false
}
