import { useState, useCallback } from 'react'
import GameScreen from './components/GameScreen'
import BaseScreen from './components/BaseScreen'
import TitleOverlay from './components/TitleOverlay'
import Tutorial, { hasTutorialBeenSeen } from './components/Tutorial'
import { loadMeta, saveMeta, processRunEnd, purchaseUpgrade } from './game/metaProgress'
import { calcBonuses } from './data/upgrades'
import { initAudio } from './utils/sound'
import './App.css'

export default function App() {
  const meta0 = loadMeta()
  const isFirstVisit = meta0.totalRuns === 0
  const [screen, setScreen] = useState(isFirstVisit ? 'title' : 'base')
  const [meta, setMeta] = useState(meta0)
  const [runResult, setRunResult] = useState(null)
  const [showTutorial, setShowTutorial] = useState(false)

  const handleTitleStart = useCallback(() => {
    initAudio()
    setScreen('base')
    if (!hasTutorialBeenSeen()) {
      setShowTutorial(true)
    }
  }, [])

  const handleStartGame = useCallback(() => {
    initAudio()
    setScreen('game')
  }, [])

  const handleGameOver = useCallback((result) => {
    const currentMeta = loadMeta()
    const newMeta = processRunEnd(currentMeta, result)
    saveMeta(newMeta)
    setMeta(newMeta)
    setRunResult({
      ...result,
      savedAmount: newMeta._lastSavedAmount,
      saveRate: newMeta._lastSaveRate,
    })
    setScreen('base')
  }, [])

  const handlePurchase = useCallback((upgradeId, cost) => {
    setMeta((prev) => {
      const newMeta = purchaseUpgrade(prev, upgradeId, cost)
      if (!newMeta) return prev
      saveMeta(newMeta)
      return newMeta
    })
  }, [])

  if (screen === 'title') {
    return <TitleOverlay onStart={handleTitleStart} />
  }

  if (screen === 'game') {
    const bonuses = calcBonuses(meta.upgrades)
    return <GameScreen bonuses={bonuses} onGameOver={handleGameOver} />
  }

  return (
    <>
      <BaseScreen
        meta={meta}
        runResult={runResult}
        onPurchase={handlePurchase}
        onStartGame={handleStartGame}
      />
      {showTutorial && (
        <Tutorial onClose={() => setShowTutorial(false)} />
      )}
    </>
  )
}
