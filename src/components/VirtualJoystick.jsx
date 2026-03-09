import { useRef, useCallback, useEffect } from 'react'

const DEAD_ZONE = 12     // ピクセル — これ以下はアクション（階段降りる等）
const STICK_RADIUS = 50  // ジョイスティック外周半径
const REPEAT_FIRST = 200 // 最初の移動後、連続移動開始までの遅延(ms)
const REPEAT_INTERVAL = 150 // 連続移動の間隔(ms)

/**
 * 8方向バーチャルジョイスティック（連続移動対応）
 * 倒し続けている間、一定間隔で移動を繰り返す
 */
export default function VirtualJoystick({ onMove, onAction }) {
  const baseRef = useRef(null)
  const stickRef = useRef(null)
  const originRef = useRef(null)
  const currentDirRef = useRef(null)  // 現在倒している方向 { dx, dy }
  const repeatTimerRef = useRef(null) // 連続移動タイマー

  // クリーンアップ
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
    // 最初の移動は即座に
    onMove(dir.dx, dir.dy)

    // 連続移動ループ
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
    baseRef.current.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e) => {
    if (!originRef.current) return
    e.preventDefault()
    const dx = e.clientX - originRef.current.x
    const dy = e.clientY - originRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const clampedDist = Math.min(dist, STICK_RADIUS)
    const angle = Math.atan2(dy, dx)
    const sx = clampedDist * Math.cos(angle)
    const sy = clampedDist * Math.sin(angle)
    if (stickRef.current) {
      stickRef.current.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`
    }

    // デッドゾーン外なら方向を更新して連続移動
    if (dist >= DEAD_ZONE) {
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
      const dir = snapTo8Dir(angleDeg)
      // 方向が変わった場合のみリスタート
      if (!currentDirRef.current || currentDirRef.current.dx !== dir.dx || currentDirRef.current.dy !== dir.dy) {
        startRepeat(dir)
      }
    } else {
      // デッドゾーン内に戻ったら停止
      stopRepeat()
    }
  }, [startRepeat, stopRepeat])

  const handlePointerUp = useCallback((e) => {
    if (!originRef.current) return
    e.preventDefault()
    const dx = e.clientX - originRef.current.x
    const dy = e.clientY - originRef.current.y
    const hadDirection = currentDirRef.current !== null

    originRef.current = null
    stopRepeat()
    resetStick()

    // デッドゾーン内でのタップ＆連続移動していなかった場合のみアクション
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < DEAD_ZONE && !hadDirection) {
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
      {/* 方向ガイド表示 */}
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
 *   0° = 右, 90° = 下, -90° = 上, ±180° = 左
 */
function snapTo8Dir(angleDeg) {
  const dirs = [
    { min: -22.5,  max: 22.5,   dx: 1,  dy: 0  }, // →
    { min: 22.5,   max: 67.5,   dx: 1,  dy: 1  }, // ↘
    { min: 67.5,   max: 112.5,  dx: 0,  dy: 1  }, // ↓
    { min: 112.5,  max: 157.5,  dx: -1, dy: 1  }, // ↙
    { min: -67.5,  max: -22.5,  dx: 1,  dy: -1 }, // ↗
    { min: -112.5, max: -67.5,  dx: 0,  dy: -1 }, // ↑
    { min: -157.5, max: -112.5, dx: -1, dy: -1 }, // ↖
  ]
  for (const d of dirs) {
    if (angleDeg >= d.min && angleDeg < d.max) return d
  }
  // ±180° 付近 = 左
  return { dx: -1, dy: 0 }
}
