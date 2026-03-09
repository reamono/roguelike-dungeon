/**
 * ダメージ計算
 * damage = max(1, attack - defense + random(-1, 1))
 */
export function calcDamage(attackerAtk, defenderDef) {
  const variance = Math.floor(Math.random() * 3) - 1 // -1, 0, 1
  return Math.max(1, attackerAtk - defenderDef + variance)
}

/**
 * プレイヤーの実効ステータスを計算（装備 + スキル + 強化値込み）
 */
export function getPlayerStats(player) {
  let attack = player.baseAttack
  let defense = player.baseDefense
  if (player.equipment.weapon) {
    const w = player.equipment.weapon
    attack += (w.stats.attack || 0) + (w.enhance || 0) * 2
  }
  if (player.equipment.shield) {
    const s = player.equipment.shield
    defense += (s.stats.defense || 0) + (s.enhance || 0) * 2
  }
  // 鉄壁スキル
  const skills = player.skills || []
  if (skills.some((s) => s.id === 'iron_wall')) {
    defense += 5
  }
  // ウォークライバフ
  if (player.warCryTurns > 0) {
    attack += 5
  }
  return { attack, defense }
}

/**
 * プレイヤー攻撃時のダメージ計算（スキル効果 + 付与効果込み）
 */
export function calcPlayerDamage(attack, defenderDef, skills, weapon, player) {
  let damage = calcDamage(attack, defenderDef)
  let isCritical = false
  let isFireSlash = false
  let isLifesteal = false
  let isPoisonApplied = false
  let isPowerStrike = false
  let isFireball = false
  let mpCost = 0

  // 渾身の一撃: 20%でHP5消費して2倍
  if (skills.some((s) => s.id === 'power_strike') && player && player.hp > 5 && Math.random() < 0.2) {
    damage = damage * 2
    isPowerStrike = true
  }

  // ファイアボール: MP5消費で1.8倍
  if (skills.some((s) => s.id === 'fireball') && player && (player.mp || 0) >= 5) {
    damage = Math.floor(damage * 1.8)
    isFireball = true
    mpCost += 5
  }

  // 火炎斬り: 常に 1.5 倍
  if (!isFireball && skills.some((s) => s.id === 'fire_slash')) {
    damage = Math.floor(damage * 1.5)
    isFireSlash = true
  }

  // 会心の一撃: 基本20% + 付与効果で+10%
  let critChance = 0.2
  if (weapon?.enchant?.id === 'critical_up') critChance += 0.1
  if (skills.some((s) => s.id === 'critical') && Math.random() < critChance) {
    damage = damage * 2
    isCritical = true
  }

  // HP吸収付与
  if (weapon?.enchant?.id === 'lifesteal') {
    isLifesteal = true
  }

  // 毒付与: 10%確率
  if (weapon?.enchant?.id === 'poison' && Math.random() < 0.1) {
    isPoisonApplied = true
  }

  return {
    damage: Math.max(1, damage),
    isCritical,
    isFireSlash,
    isLifesteal,
    lifestealAmount: isLifesteal ? Math.max(1, Math.floor(damage * 0.15)) : 0,
    isPoisonApplied,
    isPowerStrike,
    isFireball,
    mpCost,
  }
}

/**
 * 盾の付与効果によるダメージ軽減を計算
 */
export function applyShieldEnchant(damage, shield) {
  if (!shield?.enchant) return damage
  if (shield.enchant.id === 'damage_reduce') {
    return Math.max(1, damage - 1)
  }
  return damage
}

/**
 * 盾の反撃ダメージを返す
 */
export function getThornsDamage(shield) {
  if (shield?.enchant?.id === 'thorns') return 2
  return 0
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

/**
 * 被ダメージにバフ効果を適用（かばう・魔力の盾）
 * mutatesPlayer: trueの場合、playerオブジェクトのmpを直接変更する
 */
export function applyDefensiveBuffs(damage, player) {
  let reduced = damage
  const skills = player.skills || []

  // かばう: HP25%以下で被ダメ半減
  if (skills.some((s) => s.id === 'guard') && player.hp <= player.maxHp * 0.25) {
    reduced = Math.max(1, Math.floor(reduced * 0.5))
  }

  // 魔力の盾: 被攻撃時MP3消費で70%軽減
  if (skills.some((s) => s.id === 'magic_shield') && (player.mp || 0) >= 3) {
    reduced = Math.max(1, Math.floor(reduced * 0.3))
    player.mp -= 3
  }

  return reduced
}
