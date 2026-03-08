import { useRef, useEffect, useCallback } from 'react'
import { renderGame } from '../rendering/renderer'

/**
 * Canvas描画ループを管理するフック
 * ダメージポップアップのアニメーション用に RAF ループを使用
 */
export function useGameLoop(canvasRef, state, onTickPopups) {
  const stateRef = useRef(state)
  const rafRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  stateRef.current = state

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    sizeRef.current = { w: rect.width, h: rect.height, dpr }
  }, [canvasRef])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let running = true

    const loop = () => {
      if (!running) return

      const { w, h, dpr } = sizeRef.current
      if (w === 0) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      ctx.save()
      ctx.setTransform(dpr || 1, 0, 0, dpr || 1, 0, 0)
      ctx.imageSmoothingEnabled = false
      renderGame(ctx, { width: w, height: h }, stateRef.current)
      ctx.restore()

      // ポップアップのタイマーを進める
      const popups = stateRef.current.damagePopups
      if (popups && popups.some((p) => p.timer > 0)) {
        onTickPopups()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [canvasRef, onTickPopups])
}
