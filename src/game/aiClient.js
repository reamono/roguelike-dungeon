// クライアント側AI API呼び出し層
// レート制限・タイムアウト・フォールバック付き

import { getRandomFallbackEvent, getFallbackBossDialogue } from '../data/fallbacks'

// レート制限: 1分5リクエスト
const requestTimestamps = []
const RATE_LIMIT = 5
const RATE_WINDOW = 60000

function canMakeRequest() {
  const now = Date.now()
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_WINDOW) {
    requestTimestamps.shift()
  }
  return requestTimestamps.length < RATE_LIMIT
}

function recordRequest() {
  requestTimestamps.push(Date.now())
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

/**
 * AIイベントを取得する。失敗時はフォールバックを返す。
 * 例外は投げない。
 */
export async function fetchAIEvent(floor, player) {
  if (!canMakeRequest()) {
    return getRandomFallbackEvent(floor)
  }

  try {
    recordRequest()
    const items = [
      ...(player.equipment.weapon ? [player.equipment.weapon.name] : []),
      ...(player.equipment.shield ? [player.equipment.shield.name] : []),
      ...player.inventory.map((i) => i.name),
    ]

    const res = await fetchWithTimeout(
      '/api/ai-event',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floor,
          hp: player.hp,
          maxHp: player.maxHp,
          items,
        }),
      },
      8000
    )

    if (!res.ok) {
      return getRandomFallbackEvent(floor)
    }

    const data = await res.json()
    if (data.error || !data.title || !data.choices) {
      return getRandomFallbackEvent(floor)
    }

    return data
  } catch {
    return getRandomFallbackEvent(floor)
  }
}

/**
 * ボスセリフを取得する。失敗時はフォールバックを返す。
 * 例外は投げない。
 */
export async function fetchBossDialogue(bossId, bossName, triggerType, floor) {
  if (!canMakeRequest()) {
    return getFallbackBossDialogue(bossId, triggerType)
  }

  try {
    recordRequest()
    const res = await fetchWithTimeout(
      '/api/ai-boss',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bossName, bossId, triggerType, floor }),
      },
      5000
    )

    if (!res.ok) {
      return getFallbackBossDialogue(bossId, triggerType)
    }

    const data = await res.json()
    if (!data.dialogue) {
      return getFallbackBossDialogue(bossId, triggerType)
    }

    return data.dialogue
  } catch {
    return getFallbackBossDialogue(bossId, triggerType)
  }
}
