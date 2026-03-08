import { useEffect, useState } from 'react'

export default function BossWarning({ bossName, onDismiss }) {
  const [phase, setPhase] = useState(0) // 0: warning, 1: name reveal

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => onDismiss(), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDismiss])

  return (
    <div className="boss-warning-overlay">
      <div className="boss-warning-content">
        {phase === 0 && (
          <div className="boss-warning-text">WARNING</div>
        )}
        {phase === 1 && (
          <>
            <div className="boss-warning-label">BOSS</div>
            <div className="boss-warning-name">{bossName}</div>
          </>
        )}
      </div>
    </div>
  )
}
