export default function SkillSelectModal({ choices, onSelect }) {
  return (
    <div className="skill-overlay">
      <div className="skill-modal">
        <div className="skill-header">
          <div className="skill-levelup">LEVEL UP!</div>
          <div className="skill-subtitle">スキルを1つ選択</div>
        </div>
        <div className="skill-cards">
          {choices.map((skill, i) => (
            <button
              key={skill.id}
              className="skill-card"
              style={{
                borderColor: skill.color,
                animationDelay: `${i * 0.1}s`,
              }}
              onClick={() => onSelect(skill.id)}
            >
              <div className="skill-icon" style={{ color: skill.color }}>
                {skill.icon}
              </div>
              <div className="skill-name">{skill.name}</div>
              <div className="skill-category">
                {skill.category === 'attack' ? '攻撃' : skill.category === 'defense' ? '防御' : '探索'}
              </div>
              <div className="skill-desc">{skill.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
