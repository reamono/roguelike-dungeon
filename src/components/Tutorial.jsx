const TUTORIAL_KEY = 'roguelike_tutorial_seen'

export function hasTutorialBeenSeen() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1'
  } catch {
    return false
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1')
  } catch {
    // ignore
  }
}

export default function Tutorial({ onClose }) {
  const handleClose = () => {
    markTutorialSeen()
    onClose()
  }

  return (
    <div className="tutorial-overlay" onClick={handleClose}>
      <div className="tutorial-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="tutorial-title">操作方法</h2>
        <div className="tutorial-items">
          <div className="tutorial-item">
            <span className="tutorial-icon">D-Pad</span>
            <span className="tutorial-text">十字キーまたはスワイプで移動</span>
          </div>
          <div className="tutorial-item">
            <span className="tutorial-icon">決定</span>
            <span className="tutorial-text">中央ボタンまたはタップで階段を降りる</span>
          </div>
          <div className="tutorial-item">
            <span className="tutorial-icon">袋</span>
            <span className="tutorial-text">アイテムの使用・装備・整理</span>
          </div>
          <div className="tutorial-item">
            <span className="tutorial-icon">敵</span>
            <span className="tutorial-text">敵の方向に移動すると攻撃</span>
          </div>
          <div className="tutorial-item">
            <span className="tutorial-icon">MAP</span>
            <span className="tutorial-text">右上のミニマップをタップで拡大</span>
          </div>
        </div>
        <button className="tutorial-close-btn" onClick={handleClose}>
          了解！
        </button>
      </div>
    </div>
  )
}
