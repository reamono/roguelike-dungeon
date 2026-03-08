import { useRef, useEffect } from 'react'
import { renderGame } from '../rendering/renderer'

/**
 * Canvas描画ループを管理するフック
 * ゲーム状態が変わるたびに再描画する
 */
export function useGameLoop(canvasRef, state) {
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    // Retina対応
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // 描画（ピクセルパーフェクトのためアンチエイリアスを切る）
    ctx.imageSmoothingEnabled = false

    renderGame(ctx, { width: rect.width, height: rect.height }, state)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [canvasRef, state])
}
