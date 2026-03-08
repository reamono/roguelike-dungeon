export const ITEM_TEMPLATES = [
  // 回復薬
  {
    type: 'potion',
    name: '薬草',
    sprite: 'potion_green',
    rarity: 'common',
    stats: { heal: 15 },
    description: 'HPを15回復する',
    minFloor: 1,
    weight: 10,
  },
  {
    type: 'potion',
    name: '回復薬',
    sprite: 'potion_red',
    rarity: 'uncommon',
    stats: { heal: 40 },
    description: 'HPを40回復する',
    minFloor: 3,
    weight: 6,
  },
  {
    type: 'potion',
    name: '上級回復薬',
    sprite: 'potion_gold',
    rarity: 'rare',
    stats: { heal: 100 },
    description: 'HPを100回復する',
    minFloor: 7,
    weight: 2,
  },
  // 武器
  {
    type: 'weapon',
    name: '木の棒',
    sprite: 'weapon_stick',
    rarity: 'common',
    stats: { attack: 2 },
    description: '攻撃力+2',
    minFloor: 1,
    weight: 8,
  },
  {
    type: 'weapon',
    name: '銅の剣',
    sprite: 'weapon_copper',
    rarity: 'common',
    stats: { attack: 5 },
    description: '攻撃力+5',
    minFloor: 2,
    weight: 6,
  },
  {
    type: 'weapon',
    name: '鉄の剣',
    sprite: 'weapon_iron',
    rarity: 'uncommon',
    stats: { attack: 10 },
    description: '攻撃力+10',
    minFloor: 5,
    weight: 3,
  },
  {
    type: 'weapon',
    name: '鋼の剣',
    sprite: 'weapon_steel',
    rarity: 'rare',
    stats: { attack: 18 },
    description: '攻撃力+18',
    minFloor: 10,
    weight: 1,
  },
  // 盾
  {
    type: 'shield',
    name: '木の盾',
    sprite: 'shield_wood',
    rarity: 'common',
    stats: { defense: 2 },
    description: '防御力+2',
    minFloor: 1,
    weight: 8,
  },
  {
    type: 'shield',
    name: '鉄の盾',
    sprite: 'shield_iron',
    rarity: 'uncommon',
    stats: { defense: 5 },
    description: '防御力+5',
    minFloor: 4,
    weight: 4,
  },
  {
    type: 'shield',
    name: '鋼の盾',
    sprite: 'shield_steel',
    rarity: 'rare',
    stats: { defense: 10 },
    description: '防御力+10',
    minFloor: 8,
    weight: 1,
  },
]

let _nextItemId = 1

/**
 * フロアに出現しうるアイテムリストを重み付きで返す
 */
export function getItemPoolForFloor(floor) {
  return ITEM_TEMPLATES.filter((t) => floor >= t.minFloor)
}

/**
 * 重み付きランダム選択でアイテムインスタンスを生成
 */
export function createItemInstance(pool) {
  const totalWeight = pool.reduce((s, t) => s + t.weight, 0)
  let roll = Math.random() * totalWeight
  for (const t of pool) {
    roll -= t.weight
    if (roll <= 0) {
      return {
        id: `item_${_nextItemId++}`,
        type: t.type,
        name: t.name,
        sprite: t.sprite,
        rarity: t.rarity,
        stats: { ...t.stats },
        description: t.description,
      }
    }
  }
  // fallback
  const t = pool[0]
  return {
    id: `item_${_nextItemId++}`,
    type: t.type,
    name: t.name,
    sprite: t.sprite,
    rarity: t.rarity,
    stats: { ...t.stats },
    description: t.description,
  }
}
