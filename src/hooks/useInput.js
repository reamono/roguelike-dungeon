import { useEffect, useRef, useCallback } from 'react'

const SWIPE_THRESHOLD = 30

/**
 * タッチスワイプ & キーボード入力を処理するフック
 * @param {(dx:number, dy:number) => void} onMove - 移動コールバック
 * @param {() => void} onAction - アクションコールバック（階段降りる等）
 */
export function useInput(onMove, onAction) {
  const touchStart = useRef(null)

  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          e.preventDefault()
          onMove(0, -1)
          break
        case 'ArrowDown':
        case 's':
          e.preventDefault()
          onMove(0, 1)
          break
        case 'ArrowLeft':
        case 'a':
          e.preventDefault()
          onMove(-1, 0)
          break
        case 'ArrowRight':
        case 'd':
          e.preventDefault()
          onMove(1, 0)
          break
        case ' ':
        case 'Enter':
          e.preventDefault()
          onAction()
          break
      }
    },
    [onMove, onAction]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const onTouchEnd = useCallback(
    (e) => {
      if (!touchStart.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = touch.clientY - touchStart.current.y
      touchStart.current = null

      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // タップ（移動量が少ない）→ アクション
      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
        onAction()
        return
      }

      // スワイプ方向の判定
      if (absDx > absDy) {
        onMove(dx > 0 ? 1 : -1, 0)
      } else {
        onMove(0, dy > 0 ? 1 : -1)
      }
    },
    [onMove, onAction]
  )

  return { onTouchStart, onTouchEnd }
}
