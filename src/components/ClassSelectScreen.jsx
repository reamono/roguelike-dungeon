import { CLASSES } from '../data/classes'

// スプライト画像パス（public/sprites/player/ の実画像を使用）
const CLASS_SPRITE_PATHS = {
  warrior: '/sprites/player/warrior.png',
  mage: '/sprites/player/mage.png',
  thief: '/sprites/player/thief.png',
}

function ClassSpriteIcon({ classId, size = 64 }) {
  const src = CLASS_SPRITE_PATHS[classId]
  if (!src) return null
  return (
    <img
      src={src}
      alt={classId}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export default function ClassSelectScreen({ onSelect }) {
  return (
    <div className="class-select-screen">
      <div className="class-select-header">
        <h1 className="class-select-title">職業を選択</h1>
        <p className="class-select-subtitle">冒険のスタイルを決めよう</p>
      </div>
      <div className="class-cards">
        {CLASSES.map((cls, i) => (
          <button
            key={cls.id}
            className="class-card"
            style={{
              borderColor: cls.color,
              animationDelay: `${i * 0.12}s`,
            }}
            onClick={() => onSelect(cls.id)}
          >
            <div className="class-card-icon">
              <ClassSpriteIcon classId={cls.id} size={56} />
            </div>
            <div className="class-card-name" style={{ color: cls.color }}>
              {cls.icon} {cls.name}
            </div>
            <div className="class-card-desc">{cls.description}</div>
            <div className="class-card-stats">
              <span className="class-stat">HP {cls.stats.hp}</span>
              <span className="class-stat">ATK {cls.stats.baseAttack}</span>
              <span className="class-stat">DEF {cls.stats.baseDefense}</span>
              {cls.mp > 0 && <span className="class-stat class-stat-mp">MP {cls.mp}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
