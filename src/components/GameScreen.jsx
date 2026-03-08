import { useState, useCallback } from 'react'
import {
  createInitialState, movePlayer, descendStairs,
  useItemFromInventory, restartGame,
} from '../game/GameState'
import { useInput } from '../hooks/useInput'
import Canvas from './Canvas'
import DPad from './DPad'
import StatusPanel from './StatusPanel'
import Inventory from './Inventory'
import GameOverScreen from './GameOverScreen'

export default function GameScreen() {
  const [state, setState] = useState(createInitialState)
  const [showInventory, setShowInventory] = useState(false)

  const handleMove = useCallback((dx, dy) => {
    setState((prev) => movePlayer(prev, dx, dy))
  }, [])

  const handleAction = useCallback(() => {
    setState((prev) => descendStairs(prev))
  }, [])

  const handleUseItem = useCallback((itemId) => {
    setState((prev) => useItemFromInventory(prev, itemId))
  }, [])

  const handleRestart = useCallback(() => {
    setState(restartGame())
    setShowInventory(false)
  }, [])

  const handleTickPopups = useCallback(() => {
    setState((prev) => {
      const popups = prev.damagePopups
      if (!popups || popups.length === 0) return prev
      const updated = popups
        .map((p) => ({ ...p, timer: p.timer - 1 }))
        .filter((p) => p.timer > 0)
      if (updated.length === popups.length && updated.every((p, i) => p.timer === popups[i].timer - 0)) {
        // 実際に変わったかチェック（無限ループ防止）
      }
      return { ...prev, damagePopups: updated }
    })
  }, [])

  const touchHandlers = useInput(handleMove, handleAction)

  return (
    <div className="game-screen">
      <StatusPanel floor={state.floor} player={state.player} message={state.message} />
      <Canvas state={state} touchHandlers={touchHandlers} onTickPopups={handleTickPopups} />

      <div className="bottom-bar">
        <DPad onMove={handleMove} onAction={handleAction} />
        <div className="side-buttons">
          <button
            className="side-btn inv-btn"
            onClick={() => setShowInventory(true)}
          >
            袋
            {state.player.inventory.length > 0 && (
              <span className="inv-badge">{state.player.inventory.length}</span>
            )}
          </button>
        </div>
      </div>

      {showInventory && (
        <Inventory
          player={state.player}
          onUseItem={handleUseItem}
          onClose={() => setShowInventory(false)}
        />
      )}

      {state.gameOver && (
        <GameOverScreen
          floor={state.floor}
          level={state.player.level}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
