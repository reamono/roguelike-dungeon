export const ENEMY_TYPES = [
  {
    name: 'スライム',
    sprite: 'slime',
    baseHp: 8,
    baseAttack: 3,
    baseDefense: 1,
    baseExp: 5,
    baseGold: 2,
    minFloor: 1,
    maxFloor: 5,
    color: '#44cc88',
  },
  {
    name: 'コウモリ',
    sprite: 'bat',
    baseHp: 8,
    baseAttack: 6,
    baseDefense: 0,
    baseExp: 6,
    baseGold: 2,
    minFloor: 1,
    maxFloor: 8,
    color: '#aa66cc',
    special: 'double_attack',
  },
  {
    name: 'ゴブリン',
    sprite: 'goblin',
    baseHp: 20,
    baseAttack: 8,
    baseDefense: 3,
    baseExp: 12,
    baseGold: 4,
    minFloor: 3,
    maxFloor: 10,
    color: '#66aa44',
  },
  {
    name: 'スケルトン',
    sprite: 'skeleton',
    baseHp: 28,
    baseAttack: 11,
    baseDefense: 5,
    baseExp: 18,
    baseGold: 6,
    minFloor: 5,
    maxFloor: 15,
    color: '#ccccaa',
  },
  {
    name: 'オーク',
    sprite: 'orc',
    baseHp: 42,
    baseAttack: 16,
    baseDefense: 7,
    baseExp: 25,
    baseGold: 9,
    minFloor: 8,
    maxFloor: 20,
    color: '#886644',
    special: 'summon',
  },
  {
    name: 'デーモン',
    sprite: 'demon',
    baseHp: 56,
    baseAttack: 22,
    baseDefense: 10,
    baseExp: 40,
    baseGold: 15,
    minFloor: 12,
    maxFloor: 99,
    color: '#cc4444',
    special: 'explode',
  },
]

/**
 * フロアに出現しうる敵種別を返す
 */
export function getEnemyTypesForFloor(floor) {
  return ENEMY_TYPES.filter((e) => floor >= e.minFloor && floor <= e.maxFloor)
}

/**
 * フロア補正付きの敵ステータスを算出
 */
export function scaleEnemy(type, floor) {
  const depth = floor - type.minFloor
  // 後半ほど急カーブ: 線形 + 指数的な上昇
  const scaling = 1 + depth * 0.12 + Math.pow(depth, 1.4) * 0.02
  return {
    hp: Math.floor(type.baseHp * scaling),
    maxHp: Math.floor(type.baseHp * scaling),
    attack: Math.floor(type.baseAttack * scaling),
    defense: Math.floor(type.baseDefense * scaling),
    exp: Math.floor(type.baseExp * scaling),
    gold: Math.floor(type.baseGold * scaling),
    special: type.special || null,
  }
}
