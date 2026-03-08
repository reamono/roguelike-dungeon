export default function StatusPanel({ floor, message }) {
  return (
    <div className="status-panel">
      <div className="status-floor">
        <span className="status-label">B</span>
        <span className="status-floor-num">{floor}</span>
        <span className="status-label">F</span>
      </div>
      <div className="status-message">{message}</div>
    </div>
  )
}
