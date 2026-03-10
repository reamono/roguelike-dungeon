export default function DPad({ onMove, onAction }) {
  const btn = (label, dx, dy, className) => (
    <button
      className={`dpad-btn ${className}`}
      onPointerDown={(e) => {
        e.preventDefault()
        onMove(dx, dy)
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="dpad">
      <div className="dpad-row">
        {btn('↖', -1, -1, 'dpad-diag')}
        {btn('▲', 0, -1, 'dpad-up')}
        {btn('↗', 1, -1, 'dpad-diag')}
      </div>
      <div className="dpad-row">
        {btn('◀', -1, 0, 'dpad-left')}
        <button
          className="dpad-btn dpad-center"
          onPointerDown={(e) => {
            e.preventDefault()
            onAction()
          }}
        >
          ●
        </button>
        {btn('▶', 1, 0, 'dpad-right')}
      </div>
      <div className="dpad-row">
        {btn('↙', -1, 1, 'dpad-diag')}
        {btn('▼', 0, 1, 'dpad-down')}
        {btn('↘', 1, 1, 'dpad-diag')}
      </div>
    </div>
  )
}
