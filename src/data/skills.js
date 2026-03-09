import { CLASS_SKILLS } from './classes'

// 共通スキル（全職業で選択可能）
export const COMMON_SKILLS = [
  {
    id: 'fire_slash',
    name: '火炎斬り',
    description: '攻撃時 1.5倍ダメージ',
    category: 'attack',
    icon: '🔥',
    color: '#ff6633',
  },
  {
    id: 'critical',
    name: '会心の一撃',
    description: '20%の確率で2倍ダメージ',
    category: 'attack',
    icon: '⚡',
    color: '#ffcc00',
  },
  {
    id: 'healing_wisdom',
    name: '回復の心得',
    description: '階段を降りるとHP15回復',
    category: 'defense',
    icon: '💚',
    color: '#44cc88',
  },
  {
    id: 'evasion',
    name: '見切り',
    description: '25%の確率で攻撃回避',
    category: 'defense',
    icon: '💨',
    color: '#88aaff',
  },
  {
    id: 'iron_wall',
    name: '鉄壁',
    description: '防御力+5',
    category: 'defense',
    icon: '🛡',
    color: '#8888cc',
  },
  {
    id: 'greed',
    name: '強欲',
    description: 'アイテム出現数+2',
    category: 'explore',
    icon: '💰',
    color: '#ccaa44',
  },
]

// 後方互換: ALL_SKILLSは共通スキルのエイリアス
export const ALL_SKILLS = COMMON_SKILLS

// スキル選択が発生するレベル
export const SKILL_LEVELS = [3, 5, 7, 10]

/**
 * まだ習得していないスキルからランダムに3つ選ぶ
 * 共通スキル＋職業専用スキルの混合プールから選択
 */
export function getSkillChoices(learnedSkillIds, classId) {
  const classSkills = classId ? (CLASS_SKILLS[classId] || []) : []
  const pool = [...COMMON_SKILLS, ...classSkills]
  const available = pool.filter((s) => !learnedSkillIds.includes(s.id))
  // シャッフルして3つ取る
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}
