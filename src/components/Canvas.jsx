import { useRef } from 'react'
import { useGameLoop } from '../hooks/useGameLoop'

export default function Canvas({ state, touchHandlers, onTickPopups }) {
  const canvasRef = useRef(null)
  useGameLoop(canvasRef, state, onTickPopups)

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onTouchStart={touchHandlers.onTouchStart}
      onTouchEnd={touchHandlers.onTouchEnd}
    />
  )
}
