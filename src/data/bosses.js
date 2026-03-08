// ボスデータ定義
// 5階ごとにボスフロア

export const BOSSES = [
  {
    floor: 5,
    id: 'goblin_king',
    name: 'ゴブリンキング',
    sprite: 'goblin_king',
    color: '#44aa44',
    hp: 80,
    attack: 12,
    defense: 4,
    exp: 100,
    // 特殊攻撃: 周囲1マス範囲攻撃（2ターンに1回）
    specialType: 'aoe_melee',
    specialInterval: 2,
    specialDesc: '周囲を薙ぎ払った！',
    dropItem: {
      id: 'kings_axe',
      name: '王の戦斧',
      type: 'weapon',
      rarity: 'rare',
      description: 'ゴブリンキングの巨大な斧',
      stats: { attack: 15 },
    },
  },
  {
    floor: 10,
    id: 'dragon',
    name: 'ドラゴン',
    sprite: 'dragon',
    color: '#cc4444',
    hp: 150,
    attack: 18,
    defense: 8,
    exp: 250,
    // 特殊攻撃: 2マス先まで届くブレス（2ターンに1回）
    specialType: 'breath',
    specialInterval: 2,
    specialDesc: '灼熱のブレスを吐いた！',
    dropItem: {
      id: 'dragon_shield',
      name: '竜鱗の盾',
      type: 'shield',
      rarity: 'rare',
      description: 'ドラゴンの鱗で作られた盾',
      stats: { defense: 15 },
    },
  },
  {
    floor: 15,
    id: 'lich_king',
    name: '死霊の王',
    sprite: 'lich_king',
    color: '#aa44cc',
    hp: 200,
    attack: 22,
    defense: 10,
    exp: 500,
    // 特殊攻撃: HP吸収 + 3ターンに1回ザコ召喚
    specialType: 'drain_summon',
    specialInterval: 3,
    specialDesc: '暗黒の力を解放した！',
    dropItem: {
      id: 'lich_staff',
      name: '死霊の杖',
      type: 'weapon',
      rarity: 'rare',
      description: '闇の力が宿る杖',
      stats: { attack: 22 },
    },
  },
]

export function getBossForFloor(floor) {
  // 定義済みボスを探す
  const exact = BOSSES.find((b) => b.floor === floor)
  if (exact) return exact

  // 16F以降: ボスを循環させてスケーリング
  if (floor % 5 !== 0) return null
  const idx = Math.floor((floor / 5 - 1) % BOSSES.length)
  const base = BOSSES[idx]
  const scale = 1 + (floor - base.floor) * 0.08
  return {
    ...base,
    floor,
    hp: Math.floor(base.hp * scale),
    attack: Math.floor(base.attack * scale),
    defense: Math.floor(base.defense * scale),
    exp: Math.floor(base.exp * scale),
    dropItem: {
      ...base.dropItem,
      stats: Object.fromEntries(
        Object.entries(base.dropItem.stats).map(([k, v]) => [k, Math.floor(v * scale)])
      ),
    },
  }
}

export function isBossFloor(floor) {
  return floor > 0 && floor % 5 === 0
}
