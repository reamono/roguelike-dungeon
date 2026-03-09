// 職業定義
export const CLASSES = [
  {
    id: 'warrior',
    name: '戦士',
    description: 'HP・攻撃力が高い近接型。硬さと火力でゴリ押す。',
    icon: '⚔️',
    color: '#cc4444',
    stats: {
      hp: 40,
      baseAttack: 7,
      baseDefense: 3,
    },
    // 魔法使い以外はMP不要
    mp: 0,
    maxMp: 0,
  },
  {
    id: 'mage',
    name: '魔法使い',
    description: 'MPを消費して強力な魔法を使う。遠距離攻撃が可能。',
    icon: '🔮',
    color: '#6644cc',
    stats: {
      hp: 22,
      baseAttack: 3,
      baseDefense: 2,
    },
    mp: 20,
    maxMp: 20,
  },
  {
    id: 'thief',
    name: '盗賊',
    description: '素早さとアイテム運に優れる。先制攻撃が得意。',
    icon: '🗡️',
    color: '#44aa44',
    stats: {
      hp: 28,
      baseAttack: 5,
      baseDefense: 2,
    },
    mp: 0,
    maxMp: 0,
  },
]

// 職業専用スキル
export const CLASS_SKILLS = {
  warrior: [
    {
      id: 'guard',
      name: 'かばう',
      description: 'HP25%以下で被ダメージ半減',
      category: 'defense',
      icon: '🛡️',
      color: '#cc8844',
      classOnly: 'warrior',
    },
    {
      id: 'power_strike',
      name: '渾身の一撃',
      description: '20%でHP5消費して攻撃2倍',
      category: 'attack',
      icon: '💥',
      color: '#ff4444',
      classOnly: 'warrior',
    },
    {
      id: 'war_cry',
      name: 'ウォークライ',
      description: 'ボス戦開始時に3ターン攻撃+5',
      category: 'attack',
      icon: '📯',
      color: '#ff8800',
      classOnly: 'warrior',
    },
  ],
  mage: [
    {
      id: 'fireball',
      name: 'ファイアボール',
      description: '攻撃時MP5で1.8倍ダメージ',
      category: 'attack',
      icon: '🔥',
      color: '#ff5500',
      classOnly: 'mage',
      mpCost: 5,
    },
    {
      id: 'teleport',
      name: 'テレポート',
      description: 'HP15%以下でMP8消費し安全な部屋に逃げる',
      category: 'explore',
      icon: '✨',
      color: '#aa44ff',
      classOnly: 'mage',
      mpCost: 8,
    },
    {
      id: 'magic_shield',
      name: '魔力の盾',
      description: '被攻撃時MP3消費でダメージ70%軽減',
      category: 'defense',
      icon: '🔷',
      color: '#4488ff',
      classOnly: 'mage',
      mpCost: 3,
    },
  ],
  thief: [
    {
      id: 'ambush',
      name: '奇襲',
      description: '未行動の敵に2倍ダメージ',
      category: 'attack',
      icon: '🌙',
      color: '#448844',
      classOnly: 'thief',
    },
    {
      id: 'trap_sense',
      name: '罠感知',
      description: 'アイテム出現数+3',
      category: 'explore',
      icon: '👁️',
      color: '#aaaa44',
      classOnly: 'thief',
    },
    {
      id: 'steal',
      name: '盗む',
      description: '敵撃破時30%でアイテムドロップ',
      category: 'explore',
      icon: '🤚',
      color: '#44cc88',
      classOnly: 'thief',
    },
  ],
}

export function getClassById(classId) {
  return CLASSES.find((c) => c.id === classId) || CLASSES[0]
}
