export const ITEM_TEMPLATES = [
  // 回復薬
  {
    type: 'potion',
    name: '薬草',
    sprite: 'potion_green',
    rarity: 'common',
    stats: { heal: 12 },
    description: 'HPを12回復する',
    minFloor: 1,
    weight: 5,
  },
  {
    type: 'potion',
    name: '回復薬',
    sprite: 'potion_red',
    rarity: 'uncommon',
    stats: { healPercent: 30 },
    description: '最大HPの30%回復',
    minFloor: 3,
    weight: 3,
  },
  {
    type: 'potion',
    name: '上級回復薬',
    sprite: 'potion_gold',
    rarity: 'rare',
    stats: { healPercent: 50 },
    description: '最大HPの50%回復',
    minFloor: 7,
    weight: 1,
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

// 付与効果の定義
export const ENCHANTMENTS = [
  { id: 'poison', name: '毒付与', desc: '攻撃時10%で毒(3ターン,毎ターン3ダメージ)', appliesTo: 'weapon' },
  { id: 'lifesteal', name: 'HP吸収', desc: '与ダメージの15%をHP回復', appliesTo: 'weapon' },
  { id: 'critical_up', name: '会心率アップ', desc: '会心率+10%', appliesTo: 'weapon' },
  { id: 'thorns', name: '反撃', desc: '被ダメージ時、攻撃者に2ダメージ', appliesTo: 'shield' },
  { id: 'guard_heal', name: '守護回復', desc: 'ターン終了時1%の確率でHP5回復', appliesTo: 'shield' },
  { id: 'damage_reduce', name: 'ダメージ軽減', desc: '被ダメージ-1(最低1)', appliesTo: 'shield' },
]

// 付与効果がつく確率 (12%)
const ENCHANT_CHANCE = 0.12

let _nextItemId = 1

/**
 * フロアに出現しうるアイテムリストを重み付きで返す
 */
export function getItemPoolForFloor(floor) {
  return ITEM_TEMPLATES.filter((t) => floor >= t.minFloor)
}

function rollEnchantment(type) {
  if (type !== 'weapon' && type !== 'shield') return null
  if (Math.random() >= ENCHANT_CHANCE) return null
  const pool = ENCHANTMENTS.filter((e) => e.appliesTo === type)
  return pool[Math.floor(Math.random() * pool.length)]
}

function buildItem(t) {
  const enchant = rollEnchantment(t.type)
  const item = {
    id: `item_${_nextItemId++}`,
    type: t.type,
    name: t.name,
    sprite: t.sprite,
    rarity: t.rarity,
    stats: { ...t.stats },
    description: t.description,
    enhance: 0,
  }
  if (enchant) {
    item.enchant = { id: enchant.id, name: enchant.name, desc: enchant.desc }
    item.name = `${t.name}【${enchant.name}】`
    item.rarity = item.rarity === 'common' ? 'uncommon' : 'rare'
  }
  return item
}

/**
 * 重み付きランダム選択でアイテムインスタンスを生成
 */
export function createItemInstance(pool) {
  const totalWeight = pool.reduce((s, t) => s + t.weight, 0)
  let roll = Math.random() * totalWeight
  for (const t of pool) {
    roll -= t.weight
    if (roll <= 0) return buildItem(t)
  }
  return buildItem(pool[0])
}
