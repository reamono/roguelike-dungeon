import { useState } from 'react'

export default function Inventory({ player, onUseItem, onDropItem, onSort, onClose }) {
  const { inventory, equipment, skills } = player
  const maxInv = player.maxInventory || 10
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [confirmDrop, setConfirmDrop] = useState(null)

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-panel" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h3>持ち物 <span className="inv-capacity">{inventory.length}/{maxInv}</span></h3>
          <div className="inv-header-actions">
            <button className="inv-sort-btn" onClick={onSort}>整理</button>
            <button className="inv-close-btn" onClick={onClose}>&#x2715;</button>
          </div>
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
            <div key={item.id} className={`inv-item rarity-${item.rarity}`}>
              <button
                className="inv-item-main"
                onClick={() => onUseItem(item.id)}
              >
                <span className="inv-item-name">{item.name}</span>
                <span className="inv-item-desc">{item.description}</span>
                <span className="inv-item-action">
                  {item.type === 'potion' ? '使う' : '装備'}
                </span>
              </button>
              <button
                className="inv-drop-btn"
                onClick={() => setConfirmDrop(item)}
                title="捨てる"
              >
                捨
              </button>
            </div>
          ))}
        </div>

        {/* 捨てる確認ダイアログ */}
        {confirmDrop && (
          <div className="inv-confirm-overlay" onClick={() => setConfirmDrop(null)}>
            <div className="inv-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <p className="inv-confirm-text">
                <strong>{confirmDrop.name}</strong>を捨てますか？
              </p>
              <div className="inv-confirm-btns">
                <button
                  className="inv-confirm-yes"
                  onClick={() => { onDropItem(confirmDrop.id); setConfirmDrop(null) }}
                >
                  捨てる
                </button>
                <button
                  className="inv-confirm-no"
                  onClick={() => setConfirmDrop(null)}
                >
                  やめる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
