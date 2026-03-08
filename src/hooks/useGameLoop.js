import { useRef, useEffect, useCallback } from 'react'
import { renderGame } from '../rendering/renderer'

/**
 * Canvas描画ループを管理するフック
 * ダメージポップアップのアニメーション用に RAF ループを使用
 * 画面揺れエフェクト対応
 */
export function useGameLoop(canvasRef, state, onTickPopups) {
  const stateRef = useRef(state)
  const rafRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const shakeRef = useRef({ intensity: 0, duration: 0 })
  const prevPopupCountRef = useRef(0)

  stateRef.current = state

  // ダメージポップアップが増えたら画面揺れ発生
  const popupCount = state.damagePopups?.length || 0
  if (popupCount > prevPopupCountRef.current && prevPopupCountRef.current >= 0) {
    const hasPlayerDamage = state.damagePopups?.some(
      (p) => p.color === '#ff4444' && p.timer >= 28
    )
    if (hasPlayerDamage) {
      shakeRef.current = { intensity: 4, duration: 8 }
    } else if (popupCount > prevPopupCountRef.current) {
      shakeRef.current = { intensity: 2, duration: 5 }
    }
  }
  prevPopupCountRef.current = popupCount

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

      // 画面揺れオフセット計算
      let shakeX = 0, shakeY = 0
      const shake = shakeRef.current
      if (shake.duration > 0) {
        shakeX = (Math.random() - 0.5) * shake.intensity * 2
        shakeY = (Math.random() - 0.5) * shake.intensity * 2
        shake.duration--
        if (shake.duration <= 0) {
          shake.intensity = 0
        }
      }

      ctx.save()
      ctx.setTransform(dpr || 1, 0, 0, dpr || 1, shakeX * (dpr || 1), shakeY * (dpr || 1))
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
