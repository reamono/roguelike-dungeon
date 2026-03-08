export default function BossHPBar({ boss }) {
  if (!boss || boss.hp <= 0) return null

  const hpRatio = Math.max(0, boss.hp / boss.maxHp)
  const barColor = hpRatio > 0.5 ? '#cc4444' : hpRatio > 0.25 ? '#cc8844' : '#ffcc44'

  return (
    <div className="boss-hp-bar">
      <span className="boss-hp-name">{boss.name}</span>
      <div className="boss-hp-bg">
        <div
          className="boss-hp-fill"
          style={{ width: `${hpRatio * 100}%`, background: barColor }}
        />
      </div>
      <span className="boss-hp-text">{boss.hp}/{boss.maxHp}</span>
    </div>
  )
}
