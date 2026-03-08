/**
 * アイテム使用処理
 */
export function useItem(player, item) {
  if (item.type === 'potion') {
    const healed = Math.min(item.stats.heal, player.maxHp - player.hp)
    return {
      player: { ...player, hp: player.hp + healed },
      message: `${item.name}を使った！ HPが${healed}回復した`,
      consumed: true,
    }
  }
  return { player, message: 'このアイテムは使えない', consumed: false }
}

/**
 * 装備処理: 武器 or 盾を装備し、既存装備をインベントリに戻す
 */
export function equipItem(player, item) {
  if (item.type !== 'weapon' && item.type !== 'shield') {
    return { player, message: 'これは装備できない' }
  }

  const slot = item.type === 'weapon' ? 'weapon' : 'shield'
  const current = player.equipment[slot]
  let newInventory = player.inventory.filter((i) => i.id !== item.id)
  if (current) {
    newInventory = [...newInventory, current]
  }

  return {
    player: {
      ...player,
      equipment: { ...player.equipment, [slot]: item },
      inventory: newInventory,
    },
    message: `${item.name}を装備した！`,
  }
}
