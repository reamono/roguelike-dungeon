import { useRef, useCallback, useEffect } from 'react'

const STICK_RADIUS = 50    // ジョイスティック外周半径(px)
const MOVE_THRESHOLD = 0.35 // 移動発動閾値 — 外周の35%以上倒したとき
const ACTION_ZONE = 10      // タップ判定(px) — これ以下ならアクション
const REPEAT_FIRST = 350    // 初回移動後、連続移動開始までの遅延(ms)
const REPEAT_INTERVAL = 170 // 連続移動の間隔(ms)

// 移動が発動する最小距離(px)
const MOVE_DIST = STICK_RADIUS * MOVE_THRESHOLD

/**
 * 8方向バーチャルジョイスティック（精度改善版）
 * - デッドゾーン: 外周の35%未満では移動しない
 * - 連続移動: 初回即移動→350ms待機→170ms間隔でリピート
 * - 8方向を均等45°で判定
 */
export default function VirtualJoystick({ onMove, onAction }) {
  const baseRef = useRef(null)
  const stickRef = useRef(null)
  const originRef = useRef(null)
  const currentDirRef = useRef(null)
  const repeatTimerRef = useRef(null)
  const movedRef = useRef(false) // 移動が1回でも発生したか

  useEffect(() => {
    return () => {
      if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current)
    }
  }, [])

  const stopRepeat = useCallback(() => {
    currentDirRef.current = null
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current)
      repeatTimerRef.current = null
    }
  }, [])

  const startRepeat = useCallback((dir) => {
    stopRepeat()
    currentDirRef.current = dir
    movedRef.current = true
    onMove(dir.dx, dir.dy)

    const scheduleNext = (delay) => {
      repeatTimerRef.current = setTimeout(() => {
        if (!currentDirRef.current) return
        onMove(currentDirRef.current.dx, currentDirRef.current.dy)
        scheduleNext(REPEAT_INTERVAL)
      }, delay)
    }
    scheduleNext(REPEAT_FIRST)
  }, [onMove, stopRepeat])

  const resetStick = useCallback(() => {
    if (stickRef.current) {
      stickRef.current.style.transform = 'translate(-50%, -50%)'
    }
  }, [])

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    const rect = baseRef.current.getBoundingClientRect()
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    movedRef.current = false
    baseRef.current.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e) => {
    if (!originRef.current) return
    e.preventDefault()
    const dx = e.clientX - originRef.current.x
    const dy = e.clientY - originRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // スティックのビジュアル移動（外周でクランプ）
    const clampedDist = Math.min(dist, STICK_RADIUS)
    const angle = Math.atan2(dy, dx)
    const sx = clampedDist * Math.cos(angle)
    const sy = clampedDist * Math.sin(angle)
    if (stickRef.current) {
      stickRef.current.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`
    }

    // デッドゾーン判定: 閾値以上で移動発動
    if (dist >= MOVE_DIST) {
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
      const dir = snapTo8Dir(angleDeg)
      if (!currentDirRef.current || currentDirRef.current.dx !== dir.dx || currentDirRef.current.dy !== dir.dy) {
        startRepeat(dir)
      }
    } else {
      stopRepeat()
    }
  }, [startRepeat, stopRepeat])

  const handlePointerUp = useCallback((e) => {
    if (!originRef.current) return
    e.preventDefault()
    const dx = e.clientX - originRef.current.x
    const dy = e.clientY - originRef.current.y

    originRef.current = null
    stopRepeat()
    resetStick()

    // 移動が一度も発生せず、かつタップ範囲内ならアクション
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (!movedRef.current && dist < ACTION_ZONE) {
      onAction()
    }
  }, [onAction, stopRepeat, resetStick])

  const handlePointerCancel = useCallback(() => {
    originRef.current = null
    stopRepeat()
    resetStick()
  }, [stopRepeat, resetStick])

  return (
    <div
      ref={baseRef}
      className="joystick-base"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div ref={stickRef} className="joystick-stick" />
      <div className="joystick-guide">
        <span className="jg jg-u">↑</span>
        <span className="jg jg-d">↓</span>
        <span className="jg jg-l">←</span>
        <span className="jg jg-r">→</span>
        <span className="jg jg-ul">↖</span>
        <span className="jg jg-ur">↗</span>
        <span className="jg jg-dl">↙</span>
        <span className="jg jg-dr">↘</span>
      </div>
    </div>
  )
}

/**
 * 角度（度）を8方向の dx,dy にスナップ
 * 均等45°刻み: 各方向の中心角 ± 22.5°
 *
 *        -90° (上)
 *   -135°  |  -45°
 *     ↖    ↑    ↗
 * ±180° ← ● → 0°
 *     ↙    ↓    ↘
 *   +135°  |  +45°
 *        +90° (下)
 */
function snapTo8Dir(angleDeg) {
  // -180〜180° を 0〜360° に正規化
  const a = ((angleDeg % 360) + 360) % 360

  //   0〜 22.5 → 右      337.5〜360 → 右
  //  22.5〜 67.5 → 右下
  //  67.5〜112.5 → 下
  // 112.5〜157.5 → 左下
  // 157.5〜202.5 → 左
  // 202.5〜247.5 → 左上
  // 247.5〜292.5 → 上
  // 292.5〜337.5 → 右上

  if (a < 22.5 || a >= 337.5) return { dx: 1,  dy: 0  } // →
  if (a < 67.5)               return { dx: 1,  dy: 1  } // ↘
  if (a < 112.5)              return { dx: 0,  dy: 1  } // ↓
  if (a < 157.5)              return { dx: -1, dy: 1  } // ↙
  if (a < 202.5)              return { dx: -1, dy: 0  } // ←
  if (a < 247.5)              return { dx: -1, dy: -1 } // ↖
  if (a < 292.5)              return { dx: 0,  dy: -1 } // ↑
                               return { dx: 1,  dy: -1 } // ↗
}
