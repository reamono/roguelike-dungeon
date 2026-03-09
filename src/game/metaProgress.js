// メタ進行（永続データ）管理
const STORAGE_KEY = 'roguelike_meta'

const DEFAULT_META = {
  savedGold: 0,
  upgrades: {},   // { upgradeId: 購入回数 }
  totalRuns: 0,
  bestFloor: 0,
  totalKills: 0,
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_META }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_META, ...parsed }
  } catch {
    return { ...DEFAULT_META }
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta))
  } catch {
    // storage full or unavailable — silently fail
  }
}

/**
 * ゲームオーバー時: 所持ゴールドの30〜50%を貯蓄に加算
 */
export function processRunEnd(meta, runResult) {
  const { gold, floor, killCount, classId } = runResult
  const saveRate = 0.3 + Math.random() * 0.2  // 30〜50%
  const savedAmount = Math.floor(gold * saveRate)

  return {
    ...meta,
    savedGold: meta.savedGold + savedAmount,
    totalRuns: meta.totalRuns + 1,
    bestFloor: Math.max(meta.bestFloor, floor),
    totalKills: meta.totalKills + killCount,
    lastClassId: classId || meta.lastClassId || null,
    _lastSavedAmount: savedAmount,
    _lastSaveRate: Math.round(saveRate * 100),
  }
}

/**
 * 強化購入: ゴールドを消費して購入回数を増やす
 */
export function purchaseUpgrade(meta, upgradeId, cost) {
  if (meta.savedGold < cost) return null
  const count = meta.upgrades[upgradeId] || 0
  return {
    ...meta,
    savedGold: meta.savedGold - cost,
    upgrades: { ...meta.upgrades, [upgradeId]: count + 1 },
  }
}
