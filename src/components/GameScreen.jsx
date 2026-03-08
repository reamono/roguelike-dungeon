import { useState, useCallback, useRef, useEffect } from 'react'
import {
  createInitialState, movePlayer, descendStairs,
  useItemFromInventory, dropItemFromInventory, sortInventory,
  selectSkill, dismissBossWarning, dismissBlacksmith, forgeItem,
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
import BossWarning from './BossWarning'
import BossHPBar from './BossHPBar'
import Minimap from './Minimap'
import BlacksmithModal from './BlacksmithModal'
import { sfxAttack, sfxHit, sfxPickup, sfxLevelUp, sfxGameOver, sfxGold, sfxStairs, initAudio } from '../utils/sound'

export default function GameScreen({ bonuses, onGameOver }) {
  const [state, setState] = useState(() => createInitialState(bonuses))
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

  const handleDropItem = useCallback((itemId) => {
    setState((prev) => dropItemFromInventory(prev, itemId))
  }, [])

  const handleSort = useCallback(() => {
    setState((prev) => sortInventory(prev))
  }, [])

  const handleSelectSkill = useCallback((skillId) => {
    setState((prev) => selectSkill(prev, skillId))
  }, [])

  const handleRestart = useCallback(() => {
    onGameOver({
      gold: state.player.gold || 0,
      floor: state.floor,
      killCount: state.player.killCount || 0,
      level: state.player.level,
    })
  }, [onGameOver, state])

  const handleDismissBossWarning = useCallback(() => {
    setState((prev) => dismissBossWarning(prev))
  }, [])

  const handleDismissBlacksmith = useCallback(() => {
    setState((prev) => dismissBlacksmith(prev))
  }, [])

  const handleForge = useCallback((baseId, materialId) => {
    setState((prev) => forgeItem(prev, baseId, materialId))
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

  // サウンドエフェクト: 状態変化を検知して再生
  const prevStateRef = useRef(null)
  useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = state
    if (!prev) return

    // ダメージポップアップ増加 → 攻撃音
    const prevPopups = prev.damagePopups?.length || 0
    const curPopups = state.damagePopups?.length || 0
    if (curPopups > prevPopups) {
      const hasPlayerDmg = state.damagePopups?.some(p => p.color === '#ff4444' && p.timer >= 28)
      if (hasPlayerDmg) sfxHit()
      else sfxAttack()
    }

    // レベルアップ
    if (state.levelUpFlash && !prev.levelUpFlash) sfxLevelUp()

    // ゲームオーバー
    if (state.gameOver && !prev.gameOver) sfxGameOver()

    // フロア移動
    if (state.floor > prev.floor) sfxStairs()

    // ゴールド拾得
    if ((state.player.gold || 0) > (prev.player.gold || 0) && state.message?.includes('Gを拾った')) sfxGold()

    // アイテム拾得
    if (state.player.inventory.length > prev.player.inventory.length) sfxPickup()
  }, [state])

  const touchHandlers = useInput(handleMove, handleAction)

  // AudioContext起動（初回タッチ時）
  const handleFirstInteraction = useCallback(() => {
    initAudio()
  }, [])

  return (
    <div className="game-screen" onClick={handleFirstInteraction}>
      <StatusPanel floor={state.floor} player={state.player} message={state.message} onShowLog={() => setShowLog(true)} />

      {state.boss && state.boss.hp > 0 && (
        <BossHPBar boss={state.boss} />
      )}

      <div className="canvas-wrapper">
        <Canvas state={state} touchHandlers={touchHandlers} onTickPopups={handleTickPopups} />
        <Minimap
          tiles={state.tiles}
          revealed={state.revealed}
          visible={state.visible}
          player={state.player}
          enemies={state.enemies}
          boss={state.boss}
          stairs={state.stairs}
        />
      </div>

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
          onDropItem={handleDropItem}
          onSort={handleSort}
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

      {state.bossWarning && (
        <BossWarning
          key={state.floor}
          bossName={state.bossWarning}
          onDismiss={handleDismissBossWarning}
        />
      )}

      {state.showBlacksmith && (
        <BlacksmithModal
          player={state.player}
          onForge={handleForge}
          onClose={handleDismissBlacksmith}
        />
      )}

      {showLog && (
        <LogPanel log={state.messageLog} onClose={() => setShowLog(false)} />
      )}

      {state.gameOver && (
        <GameOverScreen
          floor={state.floor}
          level={state.player.level}
          gold={state.player.gold || 0}
          killCount={state.player.killCount || 0}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
