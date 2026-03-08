import { useEffect, useRef } from 'react'

export default function LogPanel({ log, onClose }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [])

  return (
    <div className="log-overlay" onClick={onClose}>
      <div className="log-panel" onClick={(e) => e.stopPropagation()}>
        <div className="log-header">
          <h3>メッセージログ</h3>
          <button className="inv-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="log-list" ref={listRef}>
          {(!log || log.length === 0) && (
            <div className="log-empty">ログがありません</div>
          )}
          {log && log.map((msg, i) => (
            <div key={i} className="log-entry">{msg}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
