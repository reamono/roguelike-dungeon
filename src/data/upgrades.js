// 拠点で購入できる恒久強化の定義
export const UPGRADES = [
  {
    id: 'max_hp',
    name: '生命力強化',
    description: '最大HP +10',
    baseCost: 100,
    costMultiplier: 1.7,
    apply: (bonuses, count) => { bonuses.maxHp += 10 * count },
  },
  {
    id: 'attack',
    name: '攻撃力強化',
    description: '基礎攻撃力 +3',
    baseCost: 150,
    costMultiplier: 1.7,
    apply: (bonuses, count) => { bonuses.baseAttack += 3 * count },
  },
  {
    id: 'defense',
    name: '防御力強化',
    description: '基礎防御力 +3',
    baseCost: 150,
    costMultiplier: 1.7,
    apply: (bonuses, count) => { bonuses.baseDefense += 3 * count },
  },
  {
    id: 'inventory',
    name: '持ち物枠拡張',
    description: '初期アイテム枠 +1',
    baseCost: 200,
    costMultiplier: 2.0,
    apply: (bonuses, count) => { bonuses.extraInventory += count },
  },
  {
    id: 'start_potion',
    name: '備蓄の心得',
    description: '回復薬1個持ちスタート',
    baseCost: 80,
    costMultiplier: 1.8,
    apply: (bonuses, count) => { bonuses.startPotions += count },
  },
]

/**
 * 購入回数に応じたコストを算出
 */
export function getUpgradeCost(upgrade, purchaseCount) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, purchaseCount))
}

/**
 * meta.upgrades から恒久ボーナスを計算
 */
export function calcBonuses(upgradeCounts) {
  const bonuses = {
    maxHp: 0,
    baseAttack: 0,
    baseDefense: 0,
    extraInventory: 0,
    startPotions: 0,
  }
  for (const upgrade of UPGRADES) {
    const count = upgradeCounts[upgrade.id] || 0
    if (count > 0) upgrade.apply(bonuses, count)
  }
  return bonuses
}
