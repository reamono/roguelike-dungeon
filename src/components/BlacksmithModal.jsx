import { useState } from 'react'

export default function BlacksmithModal({ player, onForge, onClose }) {
  const [baseId, setBaseId] = useState(null)
  const [materialId, setMaterialId] = useState(null)

  // 強化対象: インベントリ内 + 装備中の武器/盾
  const allEquipment = []
  if (player.equipment.weapon) allEquipment.push({ ...player.equipment.weapon, _equipped: true })
  if (player.equipment.shield) allEquipment.push({ ...player.equipment.shield, _equipped: true })
  const invEquipment = player.inventory.filter((i) => i.type === 'weapon' || i.type === 'shield')

  const candidates = [...allEquipment, ...invEquipment]

  const baseItem = candidates.find((i) => i.id === baseId)
  // 素材候補: ベースと同じtypeで、ベースとは別のアイテム（インベントリ内のみ）
  const materialCandidates = baseItem
    ? invEquipment.filter((i) => i.id !== baseId && i.type === baseItem.type)
    : []

  const canForge = baseItem && materialId && (baseItem.enhance || 0) < 5

  return (
    <div className="blacksmith-overlay" onClick={onClose}>
      <div className="blacksmith-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="blacksmith-title">鍛冶屋</h3>
        <p className="blacksmith-desc">同じ種類の装備を2つ選んで強化（最大+5）</p>

        <div className="forge-section">
          <div className="forge-label">ベース装備（強化される側）</div>
          <div className="forge-list">
            {candidates.length === 0 && <div className="forge-empty">装備がない</div>}
            {candidates.map((item) => (
              <button
                key={item.id}
                className={`forge-item ${baseId === item.id ? 'forge-selected' : ''} ${(item.enhance || 0) >= 5 ? 'forge-maxed' : ''}`}
                onClick={() => { setBaseId(item.id === baseId ? null : item.id); setMaterialId(null) }}
                disabled={(item.enhance || 0) >= 5}
              >
                <span className="forge-item-name">{item.name}</span>
                {item._equipped && <span className="forge-equipped">装備中</span>}
                {item.enchant && <span className="forge-enchant">{item.enchant.name}</span>}
                <span className="forge-enhance">+{item.enhance || 0}/5</span>
              </button>
            ))}
          </div>
        </div>

        {baseItem && (
          <div className="forge-section">
            <div className="forge-label">素材（消費される側）</div>
            <div className="forge-list">
              {materialCandidates.length === 0 && (
                <div className="forge-empty">同種の装備が持ち物にない</div>
              )}
              {materialCandidates.map((item) => (
                <button
                  key={item.id}
                  className={`forge-item ${materialId === item.id ? 'forge-selected' : ''}`}
                  onClick={() => setMaterialId(item.id === materialId ? null : item.id)}
                >
                  <span className="forge-item-name">{item.name}</span>
                  {item.enchant && <span className="forge-enchant">{item.enchant.name}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="blacksmith-actions">
          <button
            className="forge-btn"
            disabled={!canForge}
            onClick={() => canForge && onForge(baseId, materialId)}
          >
            強化する
          </button>
          <button className="forge-close-btn" onClick={onClose}>
            やめる
          </button>
        </div>
      </div>
    </div>
  )
}
