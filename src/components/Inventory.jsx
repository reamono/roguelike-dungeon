import { useState } from 'react'

export default function Inventory({ player, onUseItem, onClose }) {
  const { inventory, equipment, skills } = player
  const [selectedSkill, setSelectedSkill] = useState(null)

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-panel" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h3>持ち物</h3>
          <button className="inv-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 装備中 */}
        <div className="equip-section">
          <div className="equip-slot">
            <span className="equip-label">武器</span>
            <span className="equip-name">
              {equipment.weapon ? `${equipment.weapon.name} (ATK+${equipment.weapon.stats.attack})` : '---'}
            </span>
          </div>
          <div className="equip-slot">
            <span className="equip-label">盾</span>
            <span className="equip-name">
              {equipment.shield ? `${equipment.shield.name} (DEF+${equipment.shield.stats.defense})` : '---'}
            </span>
          </div>
        </div>

        {/* 習得済みスキル */}
        {skills && skills.length > 0 && (
          <div className="skills-section">
            <div className="skills-title">習得スキル</div>
            <div className="skills-list">
              {skills.map((s) => (
                <div
                  key={s.id}
                  className="skill-tag"
                  style={{ borderColor: s.color }}
                  onClick={() => setSelectedSkill(selectedSkill?.id === s.id ? null : s)}
                >
                  <span className="skill-tag-icon">{s.icon}</span>
                  <span className="skill-tag-name">{s.name}</span>
                </div>
              ))}
            </div>
            {selectedSkill && (
              <div className="skill-tooltip" onClick={() => setSelectedSkill(null)}>
                <span className="skill-tooltip-icon" style={{ color: selectedSkill.color }}>{selectedSkill.icon}</span>
                <span className="skill-tooltip-name">{selectedSkill.name}</span>
                <span className="skill-tooltip-desc">{selectedSkill.description}</span>
              </div>
            )}
          </div>
        )}

        {/* アイテム一覧 */}
        <div className="inv-list">
          {inventory.length === 0 && (
            <div className="inv-empty">アイテムがない</div>
          )}
          {inventory.map((item) => (
            <button
              key={item.id}
              className={`inv-item rarity-${item.rarity}`}
              onClick={() => onUseItem(item.id)}
            >
              <span className="inv-item-name">{item.name}</span>
              <span className="inv-item-desc">{item.description}</span>
              <span className="inv-item-action">
                {item.type === 'potion' ? '使う' : '装備'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
