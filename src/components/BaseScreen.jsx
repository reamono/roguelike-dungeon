import { UPGRADES, getUpgradeCost } from '../data/upgrades'

export default function BaseScreen({ meta, runResult, onPurchase, onStartGame }) {
  return (
    <div className="base-screen">
      {runResult && runResult.savedAmount > 0 && (
        <div className="base-result">
          <span className="base-result-text">
            前回の冒険: B{runResult.floor}F到達 / {runResult.killCount}体撃破 / {runResult.saveRate}%貯蓄 → +{runResult.savedAmount}G
          </span>
        </div>
      )}
      <div className="base-header">
        <h1 className="base-title">冒険者の拠点</h1>
        <div className="base-gold">
          <span className="base-gold-label">貯蓄</span>
          <span className="base-gold-value">{meta.savedGold}G</span>
        </div>
        {meta.totalRuns > 0 && (
          <div className="base-records">
            <span className="base-record">冒険回数: {meta.totalRuns}</span>
            <span className="base-record">最深到達: B{meta.bestFloor}F</span>
            <span className="base-record">総撃破数: {meta.totalKills}</span>
          </div>
        )}
      </div>

      <div className="base-shop">
        <h2 className="base-shop-title">強化ショップ</h2>
        <div className="upgrade-cards">
          {UPGRADES.map((upgrade) => {
            const count = meta.upgrades[upgrade.id] || 0
            const cost = getUpgradeCost(upgrade, count)
            const canBuy = meta.savedGold >= cost
            return (
              <button
                key={upgrade.id}
                className={`upgrade-card ${canBuy ? '' : 'upgrade-locked'}`}
                onClick={() => canBuy && onPurchase(upgrade.id, cost)}
              >
                <div className="upgrade-name">{upgrade.name}</div>
                <div className="upgrade-desc">{upgrade.description}</div>
                <div className="upgrade-cost">{cost}G</div>
                {count > 0 && (
                  <div className="upgrade-count">購入済: {count}回</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <button className="base-start-btn" onClick={onStartGame}>
        冒険に出る
      </button>
    </div>
  )
}
