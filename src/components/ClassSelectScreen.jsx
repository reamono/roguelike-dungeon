import { CLASSES } from '../data/classes'

// 各職業のドット絵風アイコン（Canvas描画用の簡易ピクセルアート）
function ClassPixelIcon({ classId, size = 64 }) {
  const pixels = CLASS_PIXELS[classId] || []
  const gridSize = 8
  const pixelSize = size / gridSize

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pixels.map((row, y) =>
        row.split('').map((cell, x) => {
          const color = PIXEL_COLORS[cell]
          if (!color) return null
          return (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          )
        })
      )}
    </svg>
  )
}

const PIXEL_COLORS = {
  R: '#cc4444', r: '#ff6666', // 赤系
  B: '#4444cc', b: '#6688ff', // 青系
  G: '#44aa44', g: '#66cc66', // 緑系
  Y: '#ccaa44', y: '#ffdd66', // 黄系
  W: '#cccccc', w: '#ffffff', // 白系
  S: '#886644', s: '#aa8866', // 肌色
  K: '#333333', k: '#555555', // 黒・暗
  P: '#8844cc', p: '#aa66ff', // 紫系
  O: '#cc8844', o: '#ffaa66', // オレンジ
}

// 8x8ドット絵定義
const CLASS_PIXELS = {
  warrior: [
    '..Yk....',
    '..SS....',
    '.RRRR..',
    '.RRRR..',
    '..RR.Y..',
    '..RR....',
    '.K..K...',
    '.K..K...',
  ],
  mage: [
    '..Pp....',
    '..SS....',
    '.bBBb..',
    '.BBBB..',
    '..BB.p..',
    '..BB....',
    '.K..K...',
    '.K..K...',
  ],
  thief: [
    '..KK....',
    '..SS....',
    '.gGGg..',
    '.GGGG..',
    '..GG....',
    '..GG.k..',
    '.K..K...',
    '.K..K...',
  ],
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
              <ClassPixelIcon classId={cls.id} size={56} />
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
