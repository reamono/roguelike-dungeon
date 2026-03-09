import { useRef, useCallback, useEffect, useState } from 'react'

const MOVE_THRESHOLD = 0.55  // 外周の55%以上倒したとき移動発動
const ACTION_ZONE = 12       // タップ判定(px)
const INITIAL_DELAY = 200    // 倒してから最初の1歩までの遅延(ms)
const REPEAT_INTERVAL = 200  // 連続移動の間隔(ms)

// 方向名 → CSSクラスのマッピング
const DIR_TO_CLASS = {
  '1,0':   'jg-r',
  '-1,0':  'jg-l',
  '0,-1':  'jg-u',
  '0,1':   'jg-d',
  '1,-1':  'jg-ur',
  '1,1':   'jg-dr',
  '-1,-1': 'jg-ul',
  '-1,1':  'jg-dl',
}

/**
 * 8方向バーチャルジョイスティック
 * - 正円（aspect-ratio: 1/1）、画面幅の40%
 * - デッドゾーン55%、初回200ms遅延→200msリピート
 * - 方向確定時にガイド矢印をハイライト
 */
export default function VirtualJoystick({ onMove, onAction }) {
  const baseRef = useRef(null)
  const stickRef = useRef(null)
  const originRef = useRef(null)
  const currentDirRef = useRef(null)
  const repeatTimerRef = useRef(null)
  const movedRef = useRef(false)
  const radiusRef = useRef(60) // 実際の半径(px)、レイアウト時に計算

  const [activeDir, setActiveDir] = useState(null) // ハイライト用 'dx,dy'

  useEffect(() => {
    return () => {
      if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current)
    }
  }, [])

  const stopRepeat = useCallback(() => {
    currentDirRef.current = null
    setActiveDir(null)
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current)
      repeatTimerRef.current = null
    }
  }, [])

  const startDirection = useCallback((dir) => {
    stopRepeat()
    currentDirRef.current = dir
    movedRef.current = true
    setActiveDir(`${dir.dx},${dir.dy}`)

    // 初回遅延後に1歩目、その後リピート
    const scheduleNext = (delay) => {
      repeatTimerRef.current = setTimeout(() => {
        if (!currentDirRef.current) return
        onMove(currentDirRef.current.dx, currentDirRef.current.dy)
        scheduleNext(REPEAT_INTERVAL)
      }, delay)
    }
    scheduleNext(INITIAL_DELAY)
  }, [onMove, stopRepeat])

  const resetStick = useCallback(() => {
    if (stickRef.current) {
      stickRef.current.style.transform = 'translate(-50%, -50%)'
    }
  }, [])

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    const rect = baseRef.current.getBoundingClientRect()
    // 実際のレンダリングサイズから半径を取得（正円なので幅/2）
    radiusRef.current = rect.width / 2
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
    const radius = radiusRef.current

    // スティックのビジュアル移動（外周でクランプ）
    const clampedDist = Math.min(dist, radius)
    const angle = Math.atan2(dy, dx)
    const sx = clampedDist * Math.cos(angle)
    const sy = clampedDist * Math.sin(angle)
    if (stickRef.current) {
      stickRef.current.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`
    }

    // デッドゾーン判定
    const moveDist = radius * MOVE_THRESHOLD
    if (dist >= moveDist) {
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
      const dir = snapTo8Dir(angleDeg)
      if (!currentDirRef.current || currentDirRef.current.dx !== dir.dx || currentDirRef.current.dy !== dir.dy) {
        startDirection(dir)
      }
    } else {
      stopRepeat()
    }
  }, [startDirection, stopRepeat])

  const handlePointerUp = useCallback((e) => {
    if (!originRef.current) return
    e.preventDefault()
    const dx = e.clientX - originRef.current.x
    const dy = e.clientY - originRef.current.y

    originRef.current = null
    stopRepeat()
    resetStick()

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

  // ガイド矢印のクラス名生成（アクティブ方向をハイライト）
  const jgClass = (base) => {
    if (!activeDir) return `jg ${base}`
    return DIR_TO_CLASS[activeDir] === base ? `jg ${base} jg-active` : `jg ${base}`
  }

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
        <span className={jgClass('jg-u')}>↑</span>
        <span className={jgClass('jg-d')}>↓</span>
        <span className={jgClass('jg-l')}>←</span>
        <span className={jgClass('jg-r')}>→</span>
        <span className={jgClass('jg-ul')}>↖</span>
        <span className={jgClass('jg-ur')}>↗</span>
        <span className={jgClass('jg-dl')}>↙</span>
        <span className={jgClass('jg-dr')}>↘</span>
      </div>
    </div>
  )
}

/**
 * 角度（度）を8方向の dx,dy にスナップ
 * 均等45°刻み
 */
function snapTo8Dir(angleDeg) {
  const a = ((angleDeg % 360) + 360) % 360
  if (a < 22.5 || a >= 337.5) return { dx: 1,  dy: 0  }
  if (a < 67.5)               return { dx: 1,  dy: 1  }
  if (a < 112.5)              return { dx: 0,  dy: 1  }
  if (a < 157.5)              return { dx: -1, dy: 1  }
  if (a < 202.5)              return { dx: -1, dy: 0  }
  if (a < 247.5)              return { dx: -1, dy: -1 }
  if (a < 292.5)              return { dx: 0,  dy: -1 }
                               return { dx: 1,  dy: -1 }
}
