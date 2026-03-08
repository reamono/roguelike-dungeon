import { useRef } from 'react'
import { useGameLoop } from '../hooks/useGameLoop'

export default function Canvas({ state, touchHandlers }) {
  const canvasRef = useRef(null)
  useGameLoop(canvasRef, state)

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onTouchStart={touchHandlers.onTouchStart}
      onTouchEnd={touchHandlers.onTouchEnd}
    />
  )
}
