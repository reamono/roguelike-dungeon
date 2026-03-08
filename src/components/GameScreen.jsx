import { useState, useCallback } from 'react'
import { createInitialState, movePlayer, descendStairs } from '../game/GameState'
import { useInput } from '../hooks/useInput'
import Canvas from './Canvas'
import DPad from './DPad'
import StatusPanel from './StatusPanel'

export default function GameScreen() {
  const [state, setState] = useState(createInitialState)

  const handleMove = useCallback((dx, dy) => {
    setState((prev) => movePlayer(prev, dx, dy))
  }, [])

  const handleAction = useCallback(() => {
    setState((prev) => descendStairs(prev))
  }, [])

  const touchHandlers = useInput(handleMove, handleAction)

  return (
    <div className="game-screen">
      <StatusPanel floor={state.floor} message={state.message} />
      <Canvas state={state} touchHandlers={touchHandlers} />
      <DPad onMove={handleMove} onAction={handleAction} />
    </div>
  )
}
