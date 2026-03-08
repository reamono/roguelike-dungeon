import { getPlayerStats } from '../game/combat'

export default function StatusPanel({ floor, player, message, onShowLog }) {
  const { attack, defense } = getPlayerStats(player)

  return (
    <div className="status-panel">
      <div className="status-row-top">
        <div className="status-floor">
          <span className="status-label">B</span>
          <span className="status-floor-num">{floor}</span>
          <span className="status-label">F</span>
        </div>

        <div className="status-hp">
          <div className="hp-bar-bg">
            <div
              className="hp-bar-fill"
              style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
            />
          </div>
          <span className="hp-text">{player.hp}/{player.maxHp}</span>
        </div>

        <div className="status-stats">
          <span className="stat">Lv{player.level}</span>
          <span className="stat">ATK{attack}</span>
          <span className="stat">DEF{defense}</span>
          <span className="stat stat-gold">{player.gold || 0}G</span>
        </div>

        <button className="log-btn" onClick={onShowLog}>LOG</button>
      </div>

      <div className="status-message">{message}</div>
    </div>
  )
}
