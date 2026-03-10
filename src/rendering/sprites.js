import { TILE_SIZE } from '../utils/constants'

// ========== 画像スプライトのプリロード ==========

const imageCache = {}
let imagesLoaded = false

const SPRITE_PATHS = {
  // プレイヤー
  player_warrior: '/sprites/player/warrior.png',
  player_mage: '/sprites/player/mage.png',
  player_thief: '/sprites/player/thief.png',
  // 通常敵
  enemy_slime: '/sprites/enemies/slime.png',
  enemy_bat: '/sprites/enemies/bat.png',
  enemy_goblin: '/sprites/enemies/goblin.png',
  enemy_skeleton: '/sprites/enemies/skeleton.png',
  enemy_orc: '/sprites/enemies/orc.png',
  enemy_demon: '/sprites/enemies/demon.png',
  // ボス
  boss_goblin_king: '/sprites/bosses/goblin_king.png',
  boss_dragon: '/sprites/bosses/dragon.png',
  boss_lich_king: '/sprites/bosses/lich_king.png',
  // アイテム
  item_potion_green: '/sprites/items/potion_green.png',
  item_potion_red: '/sprites/items/potion_red.png',
  item_potion_gold: '/sprites/items/potion_gold.png',
  item_weapon_stick: '/sprites/items/weapon_stick.png',
  item_weapon_copper: '/sprites/items/weapon_copper.png',
  item_weapon_iron: '/sprites/items/weapon_iron.png',
  item_weapon_steel: '/sprites/items/weapon_steel.png',
  item_shield_wood: '/sprites/items/shield_wood.png',
  item_shield_iron: '/sprites/items/shield_iron.png',
  item_shield_steel: '/sprites/items/shield_steel.png',
  item_gold: '/sprites/items/gold.png',
  // オブジェクト
  obj_stairs: '/sprites/objects/stairs.png',
  obj_blacksmith: '/sprites/objects/blacksmith.png',
}

// 起動時にすべての画像をプリロード
;(function preloadImages() {
  let loaded = 0
  const total = Object.keys(SPRITE_PATHS).length
  for (const [key, path] of Object.entries(SPRITE_PATHS)) {
    const img = new Image()
    img.onload = () => {
      imageCache[key] = img
      loaded++
      if (loaded >= total) imagesLoaded = true
    }
    img.onerror = () => {
      loaded++
      if (loaded >= total) imagesLoaded = true
    }
    img.src = path
  }
})()

function getSprite(key) {
  return imageCache[key] || null
}

// ========== プレイヤー描画 ==========

export function drawPlayer(ctx, screenX, screenY, classId) {
  const spriteKey = `player_${classId || 'warrior'}`
  const img = getSprite(spriteKey)
  if (img) {
    ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE)
    return
  }
  // フォールバック: コード描画
  drawPlayerFallback(ctx, screenX, screenY)
}

function drawPlayerFallback(ctx, screenX, screenY) {
  const s = TILE_SIZE
  const x = screenX
  const y = screenY

  ctx.fillStyle = '#8B6914'
  ctx.fillRect(x + s * 0.25, y + s * 0.45, s * 0.5, s * 0.45)
  ctx.fillStyle = '#ffcc44'
  ctx.fillRect(x + s * 0.3, y + s * 0.15, s * 0.4, s * 0.35)
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(x + s * 0.35, y + s * 0.28, s * 0.08, s * 0.08)
  ctx.fillRect(x + s * 0.55, y + s * 0.28, s * 0.08, s * 0.08)
  ctx.fillStyle = '#cc4444'
  ctx.fillRect(x + s * 0.2, y + s * 0.1, s * 0.6, s * 0.12)
  ctx.fillRect(x + s * 0.3, y + s * 0.0, s * 0.4, s * 0.12)
}

// ========== 敵描画 ==========

export function drawEnemy(ctx, screenX, screenY, enemy) {
  const spriteKey = `enemy_${enemy.sprite}`
  const img = getSprite(spriteKey)
  if (img) {
    ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE)
    // HPバー
    drawEnemyHPBar(ctx, screenX, screenY, enemy)
    return
  }
  // フォールバック: コード描画
  drawEnemyFallback(ctx, screenX, screenY, enemy)
}

function drawEnemyHPBar(ctx, screenX, screenY, enemy) {
  const s = TILE_SIZE
  ctx.fillStyle = '#333333'
  ctx.fillRect(screenX + s * 0.1, screenY + s * 0.92, s * 0.8, s * 0.06)
  const hpRatio = Math.max(0, enemy.hp / enemy.maxHp)
  const barColor = hpRatio > 0.5 ? '#44cc44' : hpRatio > 0.25 ? '#cccc44' : '#cc4444'
  ctx.fillStyle = barColor
  ctx.fillRect(screenX + s * 0.1, screenY + s * 0.92, s * 0.8 * hpRatio, s * 0.06)
}

function drawEnemyFallback(ctx, screenX, screenY, enemy) {
  const s = TILE_SIZE
  const x = screenX
  const y = screenY
  const c = enemy.color

  ctx.fillStyle = c
  ctx.fillRect(x + s * 0.2, y + s * 0.3, s * 0.6, s * 0.55)
  ctx.fillRect(x + s * 0.25, y + s * 0.1, s * 0.5, s * 0.3)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x + s * 0.3, y + s * 0.18, s * 0.14, s * 0.1)
  ctx.fillRect(x + s * 0.56, y + s * 0.18, s * 0.14, s * 0.1)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + s * 0.36, y + s * 0.2, s * 0.06, s * 0.06)
  ctx.fillRect(x + s * 0.6, y + s * 0.2, s * 0.06, s * 0.06)
  drawEnemyHPBar(ctx, screenX, screenY, enemy)
}

// ========== ボス描画 ==========

export function drawBoss(ctx, screenX, screenY, boss) {
  const spriteKey = `boss_${boss.sprite}`
  const img = getSprite(spriteKey)
  if (img) {
    const size = TILE_SIZE * 2
    ctx.drawImage(img, screenX, screenY, size, size)
    return
  }
  // フォールバック: コード描画
  drawBossFallback(ctx, screenX, screenY, boss)
}

function drawBossFallback(ctx, screenX, screenY, boss) {
  const s = TILE_SIZE * 2
  const x = screenX
  const y = screenY
  const c = boss.color

  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(x + s * 0.1, y + s * 0.85, s * 0.8, s * 0.1)
  ctx.fillStyle = c
  ctx.fillRect(x + s * 0.15, y + s * 0.3, s * 0.7, s * 0.55)
  ctx.fillRect(x + s * 0.2, y + s * 0.08, s * 0.6, s * 0.3)

  if (boss.sprite === 'goblin_king') {
    ctx.fillStyle = '#ffcc44'
    ctx.fillRect(x + s * 0.25, y + s * 0.02, s * 0.5, s * 0.08)
    ctx.fillRect(x + s * 0.28, y - s * 0.03, s * 0.08, s * 0.08)
    ctx.fillRect(x + s * 0.46, y - s * 0.03, s * 0.08, s * 0.08)
    ctx.fillRect(x + s * 0.64, y - s * 0.03, s * 0.08, s * 0.08)
  } else if (boss.sprite === 'dragon') {
    ctx.fillStyle = '#882222'
    ctx.fillRect(x + s * 0.2, y + s * 0.02, s * 0.1, s * 0.12)
    ctx.fillRect(x + s * 0.7, y + s * 0.02, s * 0.1, s * 0.12)
    ctx.fillStyle = c
    ctx.fillRect(x + s * 0.02, y + s * 0.25, s * 0.15, s * 0.35)
    ctx.fillRect(x + s * 0.83, y + s * 0.25, s * 0.15, s * 0.35)
  } else if (boss.sprite === 'lich_king') {
    ctx.fillStyle = '#3a2a5a'
    ctx.fillRect(x + s * 0.1, y + s * 0.35, s * 0.8, s * 0.55)
    ctx.fillStyle = '#2a1a4a'
    ctx.fillRect(x + s * 0.18, y + s * 0.05, s * 0.64, s * 0.25)
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x + s * 0.3, y + s * 0.16, s * 0.12, s * 0.1)
  ctx.fillRect(x + s * 0.58, y + s * 0.16, s * 0.12, s * 0.1)
  ctx.fillStyle = '#ff2222'
  ctx.fillRect(x + s * 0.33, y + s * 0.18, s * 0.06, s * 0.06)
  ctx.fillRect(x + s * 0.61, y + s * 0.18, s * 0.06, s * 0.06)
}

// ========== アイテム描画 ==========

export function drawItem(ctx, screenX, screenY, item) {
  const spriteKey = `item_${item.sprite}`
  const img = getSprite(spriteKey)
  if (img) {
    ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE)
    return
  }
  // フォールバック: コード描画
  drawItemFallback(ctx, screenX, screenY, item)
}

function drawItemFallback(ctx, screenX, screenY, item) {
  const s = TILE_SIZE
  const x = screenX
  const y = screenY

  if (item.type === 'potion') {
    const potionColor =
      item.rarity === 'rare' ? '#ffcc44' : item.rarity === 'uncommon' ? '#cc4444' : '#44cc88'
    ctx.fillStyle = potionColor
    ctx.fillRect(x + s * 0.35, y + s * 0.35, s * 0.3, s * 0.4)
    ctx.fillRect(x + s * 0.4, y + s * 0.25, s * 0.2, s * 0.15)
    ctx.fillStyle = '#aaaaaa'
    ctx.fillRect(x + s * 0.38, y + s * 0.22, s * 0.24, s * 0.06)
  } else if (item.type === 'weapon') {
    const bladeColor =
      item.rarity === 'rare' ? '#aaccff' : item.rarity === 'uncommon' ? '#cccccc' : '#aa8866'
    ctx.fillStyle = bladeColor
    ctx.fillRect(x + s * 0.46, y + s * 0.15, s * 0.08, s * 0.45)
    ctx.fillStyle = '#886644'
    ctx.fillRect(x + s * 0.36, y + s * 0.58, s * 0.28, s * 0.08)
    ctx.fillRect(x + s * 0.44, y + s * 0.64, s * 0.12, s * 0.2)
  } else if (item.type === 'shield') {
    const shieldColor =
      item.rarity === 'rare' ? '#aaccff' : item.rarity === 'uncommon' ? '#cccccc' : '#aa8844'
    ctx.fillStyle = shieldColor
    ctx.fillRect(x + s * 0.25, y + s * 0.2, s * 0.5, s * 0.55)
    ctx.fillRect(x + s * 0.3, y + s * 0.75, s * 0.4, s * 0.1)
    ctx.fillStyle = '#666666'
    ctx.fillRect(x + s * 0.4, y + s * 0.35, s * 0.2, s * 0.25)
  }
}

// ========== ゴールド描画 ==========

export function drawGold(ctx, screenX, screenY) {
  const img = getSprite('item_gold')
  if (img) {
    ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE)
    return
  }
  // フォールバック: コード描画
  const s = TILE_SIZE
  const x = screenX
  const y = screenY
  ctx.fillStyle = '#ffcc44'
  ctx.fillRect(x + s * 0.3, y + s * 0.35, s * 0.4, s * 0.35)
  ctx.fillRect(x + s * 0.35, y + s * 0.3, s * 0.3, s * 0.45)
  ctx.fillStyle = '#ffe888'
  ctx.fillRect(x + s * 0.38, y + s * 0.38, s * 0.12, s * 0.12)
  ctx.fillStyle = '#aa8822'
  ctx.fillRect(x + s * 0.42, y + s * 0.48, s * 0.16, s * 0.04)
  ctx.fillRect(x + s * 0.42, y + s * 0.44, s * 0.04, s * 0.12)
}

// ========== ダメージポップアップ ==========

export function drawDamagePopup(ctx, screenX, screenY, popup) {
  const progress = (30 - popup.timer) / 30
  const floatY = screenY - progress * 36
  const alpha = Math.min(1, popup.timer / 10)

  let scale = 1
  if (popup.timer > 25) {
    scale = 1 + (popup.timer - 25) * 0.12
  }

  const cx = screenX + TILE_SIZE / 2
  const fontSize = popup.text === 'MISS' ? 12 : 16

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(cx, floatY)
  ctx.scale(scale, scale)
  ctx.font = `bold ${fontSize}px monospace`
  ctx.textAlign = 'center'
  ctx.fillStyle = '#000000'
  ctx.fillText(popup.text, 1, 1)
  ctx.fillText(popup.text, -1, -1)
  ctx.fillStyle = popup.color
  ctx.fillText(popup.text, 0, 0)
  ctx.restore()
}

// ========== 階段 ==========

export function drawStairs(ctx, screenX, screenY) {
  const img = getSprite('obj_stairs')
  if (img) {
    ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE)
    return
  }
  // フォールバック: コード描画
  const s = TILE_SIZE
  ctx.fillStyle = '#44aa66'
  ctx.fillRect(screenX + s * 0.1, screenY + s * 0.7, s * 0.8, s * 0.15)
  ctx.fillRect(screenX + s * 0.2, screenY + s * 0.5, s * 0.6, s * 0.15)
  ctx.fillRect(screenX + s * 0.3, screenY + s * 0.3, s * 0.4, s * 0.15)
  ctx.fillRect(screenX + s * 0.4, screenY + s * 0.1, s * 0.2, s * 0.15)

  ctx.fillStyle = '#66cc88'
  ctx.fillRect(screenX + s * 0.45, screenY + s * 0.05, s * 0.1, s * 0.1)
}

// ========== 壁 ==========

export function drawWall(ctx, screenX, screenY) {
  const s = TILE_SIZE
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(screenX, screenY, s, s)

  ctx.fillStyle = '#222244'
  ctx.fillRect(screenX + 1, screenY + 1, s * 0.45 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.5, screenY + 1, s * 0.5 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + 1, screenY + s * 0.35, s * 0.25 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.3, screenY + s * 0.35, s * 0.45 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.78, screenY + s * 0.35, s * 0.22 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + 1, screenY + s * 0.7, s * 0.45 - 1, s * 0.3 - 1)
  ctx.fillRect(screenX + s * 0.5, screenY + s * 0.7, s * 0.5 - 1, s * 0.3 - 1)
}

// ========== 床タイル ==========

export function drawFloor(ctx, screenX, screenY) {
  const s = TILE_SIZE
  ctx.fillStyle = '#2a2a4a'
  ctx.fillRect(screenX, screenY, s, s)

  ctx.fillStyle = '#333366'
  ctx.fillRect(screenX + s * 0.2, screenY + s * 0.3, 2, 2)
  ctx.fillRect(screenX + s * 0.7, screenY + s * 0.6, 2, 2)
  ctx.fillRect(screenX + s * 0.5, screenY + s * 0.8, 2, 2)
}

// ========== 通路タイル ==========

export function drawCorridor(ctx, screenX, screenY) {
  const s = TILE_SIZE
  ctx.fillStyle = '#222244'
  ctx.fillRect(screenX, screenY, s, s)

  ctx.fillStyle = '#282850'
  ctx.fillRect(screenX + s * 0.4, screenY + s * 0.4, 2, 2)
}

// ========== 鍛冶屋NPC ==========

export function drawBlacksmith(ctx, screenX, screenY) {
  const img = getSprite('obj_blacksmith')
  if (img) {
    ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE)
    // 「!」マークは画像の上にも表示
    const s = TILE_SIZE
    ctx.fillStyle = '#ffcc44'
    ctx.font = `bold ${Math.floor(s * 0.35)}px monospace`
    ctx.textAlign = 'center'
    ctx.fillText('!', screenX + s * 0.5, screenY + s * 0.06)
    return
  }
  // フォールバック: コード描画
  const s = TILE_SIZE
  const x = screenX
  const y = screenY

  ctx.fillStyle = '#886644'
  ctx.fillRect(x + s * 0.2, y + s * 0.4, s * 0.6, s * 0.5)
  ctx.fillStyle = '#ddaa77'
  ctx.fillRect(x + s * 0.3, y + s * 0.12, s * 0.4, s * 0.32)
  ctx.fillStyle = '#cc4444'
  ctx.fillRect(x + s * 0.25, y + s * 0.12, s * 0.5, s * 0.08)
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(x + s * 0.36, y + s * 0.24, s * 0.06, s * 0.06)
  ctx.fillRect(x + s * 0.56, y + s * 0.24, s * 0.06, s * 0.06)
  ctx.fillStyle = '#aaaaaa'
  ctx.fillRect(x + s * 0.7, y + s * 0.2, s * 0.15, s * 0.12)
  ctx.fillStyle = '#664422'
  ctx.fillRect(x + s * 0.74, y + s * 0.32, s * 0.06, s * 0.3)
  ctx.fillStyle = '#ffcc44'
  ctx.font = `bold ${Math.floor(s * 0.35)}px monospace`
  ctx.textAlign = 'center'
  ctx.fillText('!', x + s * 0.5, y + s * 0.06)
}
