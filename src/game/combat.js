/**
 * ダメージ計算
 * damage = max(1, attack - defense + random(-1, 1))
 */
export function calcDamage(attackerAtk, defenderDef) {
  const variance = Math.floor(Math.random() * 3) - 1 // -1, 0, 1
  return Math.max(1, attackerAtk - defenderDef + variance)
}

/**
 * プレイヤーの実効ステータスを計算（装備込み）
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
  return { attack, defense }
}
