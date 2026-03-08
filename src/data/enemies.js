export const ENEMY_TYPES = [
  {
    name: 'スライム',
    sprite: 'slime',
    baseHp: 8,
    baseAttack: 3,
    baseDefense: 1,
    baseExp: 5,
    baseGold: 3,
    minFloor: 1,
    maxFloor: 5,
    color: '#44cc88',
  },
  {
    name: 'コウモリ',
    sprite: 'bat',
    baseHp: 6,
    baseAttack: 4,
    baseDefense: 0,
    baseExp: 6,
    baseGold: 4,
    minFloor: 1,
    maxFloor: 8,
    color: '#aa66cc',
  },
  {
    name: 'ゴブリン',
    sprite: 'goblin',
    baseHp: 15,
    baseAttack: 6,
    baseDefense: 2,
    baseExp: 12,
    baseGold: 8,
    minFloor: 3,
    maxFloor: 10,
    color: '#66aa44',
  },
  {
    name: 'スケルトン',
    sprite: 'skeleton',
    baseHp: 20,
    baseAttack: 8,
    baseDefense: 4,
    baseExp: 18,
    baseGold: 12,
    minFloor: 5,
    maxFloor: 15,
    color: '#ccccaa',
  },
  {
    name: 'オーク',
    sprite: 'orc',
    baseHp: 30,
    baseAttack: 12,
    baseDefense: 5,
    baseExp: 25,
    baseGold: 18,
    minFloor: 8,
    maxFloor: 20,
    color: '#886644',
  },
  {
    name: 'デーモン',
    sprite: 'demon',
    baseHp: 40,
    baseAttack: 16,
    baseDefense: 8,
    baseExp: 40,
    baseGold: 30,
    minFloor: 12,
    maxFloor: 99,
    color: '#cc4444',
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
  const scaling = 1 + (floor - type.minFloor) * 0.1
  return {
    hp: Math.floor(type.baseHp * scaling),
    maxHp: Math.floor(type.baseHp * scaling),
    attack: Math.floor(type.baseAttack * scaling),
    defense: Math.floor(type.baseDefense * scaling),
    exp: Math.floor(type.baseExp * scaling),
    gold: Math.floor(type.baseGold * scaling),
  }
}
