export default function GameOverScreen({ floor, level, onRestart }) {
  return (
    <div className="gameover-overlay">
      <div className="gameover-panel">
        <h2 className="gameover-title">GAME OVER</h2>
        <div className="gameover-stats">
          <div className="gameover-stat">
            <span className="gameover-label">到達階</span>
            <span className="gameover-value">B{floor}F</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-label">レベル</span>
            <span className="gameover-value">Lv.{level}</span>
          </div>
        </div>
        <button className="gameover-btn" onClick={onRestart}>
          もう一度挑戦する
        </button>
      </div>
    </div>
  )
}
