import { useState, useCallback } from 'react'
import GameScreen from './components/GameScreen'
import BaseScreen from './components/BaseScreen'
import { loadMeta, saveMeta, processRunEnd, purchaseUpgrade } from './game/metaProgress'
import { calcBonuses } from './data/upgrades'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('base') // 'base' | 'game' | 'gameover'
  const [meta, setMeta] = useState(loadMeta)
  const [runResult, setRunResult] = useState(null)

  const handleStartGame = useCallback(() => {
    setScreen('game')
  }, [])

  const handleGameOver = useCallback((result) => {
    // result: { gold, floor, killCount, level }
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

  if (screen === 'game') {
    const bonuses = calcBonuses(meta.upgrades)
    return <GameScreen bonuses={bonuses} onGameOver={handleGameOver} />
  }

  return (
    <BaseScreen
      meta={meta}
      runResult={runResult}
      onPurchase={handlePurchase}
      onStartGame={handleStartGame}
    />
  )
}
