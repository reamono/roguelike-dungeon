import { useState, useCallback } from 'react'
import {
  createInitialState, movePlayer, descendStairs,
  useItemFromInventory, selectSkill, restartGame,
} from '../game/GameState'
import { useInput } from '../hooks/useInput'
import Canvas from './Canvas'
import DPad from './DPad'
import StatusPanel from './StatusPanel'
import Inventory from './Inventory'
import GameOverScreen from './GameOverScreen'
import SkillSelectModal from './SkillSelectModal'
import LevelUpFlash from './LevelUpFlash'
import LogPanel from './LogPanel'

export default function GameScreen() {
  const [state, setState] = useState(createInitialState)
  const [showInventory, setShowInventory] = useState(false)
  const [showLog, setShowLog] = useState(false)

  const handleMove = useCallback((dx, dy) => {
    setState((prev) => movePlayer(prev, dx, dy))
  }, [])

  const handleAction = useCallback(() => {
    setState((prev) => descendStairs(prev))
  }, [])

  const handleUseItem = useCallback((itemId) => {
    setState((prev) => useItemFromInventory(prev, itemId))
  }, [])

  const handleSelectSkill = useCallback((skillId) => {
    setState((prev) => selectSkill(prev, skillId))
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
      return { ...prev, damagePopups: updated }
    })
  }, [])

  const touchHandlers = useInput(handleMove, handleAction)

  return (
    <div className="game-screen">
      <StatusPanel floor={state.floor} player={state.player} message={state.message} onShowLog={() => setShowLog(true)} />
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

      {state.levelUpFlash && <LevelUpFlash key={state.player.level} />}

      {state.pendingSkillChoice && (
        <SkillSelectModal
          choices={state.pendingSkillChoice}
          onSelect={handleSelectSkill}
        />
      )}

      {showLog && (
        <LogPanel log={state.messageLog} onClose={() => setShowLog(false)} />
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
