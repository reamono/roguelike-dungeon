export default function TitleOverlay({ onStart }) {
  return (
    <div className="title-overlay">
      <div className="title-content">
        <div className="title-logo">
          <div className="title-main">ROGUE</div>
          <div className="title-sub">DUNGEON</div>
        </div>
        <div className="title-tagline">-- Turn-Based Roguelike --</div>
        <button className="title-start-btn" onClick={onStart}>
          冒険を始める
        </button>
      </div>
    </div>
  )
}
