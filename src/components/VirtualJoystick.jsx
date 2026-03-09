import { useRef, useCallback } from 'react'

const DEAD_ZONE = 12     // ピクセル — これ以下はアクション（階段降りる等）
const STICK_RADIUS = 50  // ジョイスティック外周半径

/**
 * 8方向バーチャルジョイスティック
 * 親指でドラッグ → 離すと移動確定（ターン制なのでフリック式）
 */
export default function VirtualJoystick({ onMove, onAction }) {
  const baseRef = useRef(null)
  const stickRef = useRef(null)
  const originRef = useRef(null)

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
  }, [])

  const handlePointerUp = useCallback((e) => {
    if (!originRef.current) return
    e.preventDefault()
    const dx = e.clientX - originRef.current.x
    const dy = e.clientY - originRef.current.y
    originRef.current = null
    resetStick()

    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < DEAD_ZONE) {
      onAction()
      return
    }

    // 8方向判定: 角度を45°刻みで分類
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) // -180 ~ 180
    const dir = snapTo8Dir(angle)
    onMove(dir.dx, dir.dy)
  }, [onMove, onAction, resetStick])

  return (
    <div
      ref={baseRef}
      className="joystick-base"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { originRef.current = null; resetStick() }}
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
  // 各方向の角度と対応 dx,dy
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
