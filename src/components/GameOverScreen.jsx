export default function GameOverScreen({ floor, level, gold, killCount, savedAmount, saveRate, onRestart }) {
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
          <div className="gameover-stat">
            <span className="gameover-label">撃破数</span>
            <span className="gameover-value">{killCount || 0}</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-label">所持金</span>
            <span className="gameover-value gameover-gold">{gold || 0}G</span>
          </div>
        </div>
        {savedAmount > 0 && (
          <div className="gameover-saved">
            <span className="gameover-saved-text">
              {saveRate}%を貯蓄 → +{savedAmount}G
            </span>
          </div>
        )}
        <button className="gameover-btn" onClick={onRestart}>
          拠点に戻る
        </button>
      </div>
    </div>
  )
}
