import { useState } from 'react'

function formatItemDesc(item) {
  let desc = item.description || ''
  if (item.enhance > 0) {
    desc += ` (強化+${item.enhance})`
  }
  return desc
}

function formatEquipName(equip) {
  if (!equip) return '---'
  let name = equip.name
  const stat = equip.type === 'weapon'
    ? `ATK+${(equip.stats.attack || 0) + (equip.enhance || 0) * 2}`
    : `DEF+${(equip.stats.defense || 0) + (equip.enhance || 0) * 2}`
  return `${name} (${stat})`
}

export default function Inventory({ player, onUseItem, onDropItem, onSort, onClose }) {
  const { inventory, equipment, skills } = player
  const maxInv = player.maxInventory || 10
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [confirmDrop, setConfirmDrop] = useState(null)
  const [detailItem, setDetailItem] = useState(null)

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
          <div
            className="equip-slot equip-clickable"
            onClick={() => equipment.weapon && setDetailItem(detailItem?.id === equipment.weapon.id ? null : equipment.weapon)}
          >
            <span className="equip-label">武器</span>
            <span className="equip-name">{formatEquipName(equipment.weapon)}</span>
            {equipment.weapon?.enchant && (
              <span className="equip-enchant">{equipment.weapon.enchant.name}</span>
            )}
          </div>
          <div
            className="equip-slot equip-clickable"
            onClick={() => equipment.shield && setDetailItem(detailItem?.id === equipment.shield.id ? null : equipment.shield)}
          >
            <span className="equip-label">盾</span>
            <span className="equip-name">{formatEquipName(equipment.shield)}</span>
            {equipment.shield?.enchant && (
              <span className="equip-enchant">{equipment.shield.enchant.name}</span>
            )}
          </div>
          {detailItem?.enchant && (
            <div className="equip-detail" onClick={() => setDetailItem(null)}>
              <span className="equip-detail-name">{detailItem.enchant.name}</span>
              <span className="equip-detail-desc">{detailItem.enchant.desc}</span>
            </div>
          )}
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
                <span className="inv-item-desc">
                  {formatItemDesc(item)}
                  {item.enchant && <span className="inv-enchant-tag"> [{item.enchant.name}]</span>}
                </span>
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
