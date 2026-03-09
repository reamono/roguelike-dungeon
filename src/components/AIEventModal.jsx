import { useState } from 'react'

const TYPE_ICONS = {
  stone_tablet: '\u{1F5FF}',
  treasure_chest: '\u{1F4E6}',
  merchant: '\u{1F9D9}',
  spring: '\u{1F4A7}',
  altar: '\u{1F54A}',
}

export default function AIEventModal({ event, onChoice, loading }) {
  const [chosen, setChosen] = useState(null)

  if (loading || !event) {
    return (
      <div className="ai-event-overlay">
        <div className="ai-event-modal">
          <div className="ai-loading">
            <span className="ai-loading-dot" />
            <span className="ai-loading-dot" />
            <span className="ai-loading-dot" />
          </div>
        </div>
      </div>
    )
  }

  const handleChoice = (index) => {
    if (chosen !== null) return
    setChosen(index)
    setTimeout(() => onChoice(index), 1500)
  }

  const icon = TYPE_ICONS[event.type] || '\u2728'

  return (
    <div className="ai-event-overlay">
      <div className="ai-event-modal">
        <div className="ai-event-header">
          <span className="ai-event-icon">{icon}</span>
          <span className="ai-event-title">{event.title}</span>
        </div>
        <div className="ai-event-desc">{event.description}</div>

        {chosen === null ? (
          <div className="ai-event-choices">
            {event.choices.map((choice, i) => (
              <button
                key={i}
                className="ai-event-choice"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => handleChoice(i)}
              >
                {choice.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="ai-event-result">
            {event.choices[chosen].outcome}
          </div>
        )}
      </div>
    </div>
  )
}
