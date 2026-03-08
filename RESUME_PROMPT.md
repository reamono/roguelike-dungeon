# 再開用プロンプト（次回チャットにこのまま貼り付け）

---

## プロジェクト概要

`c:/Users/81801/Documents/claude-projects/roguelike-dungeon/` にあるシレン風ターン制ローグライクダンジョンゲーム。React 19 + Vite 7 + Canvas 2D、モバイルファースト PWA。

- GitHub: `reamono/roguelike-dungeon`（public）
- Vercel: `roguelike-dungeon.vercel.app`（GitHub push で自動デプロイ）
- Git Bash で `gh` コマンドを使う場合: `export PATH="/c/Program Files/GitHub CLI:$PATH"` が必要

## 実装済みフェーズ

- **Phase 1**: BSP ダンジョン生成、プレイヤー移動、FOV、タッチ操作（スワイプ+仮想D-pad）
- **Phase 2**: 敵AI、戦闘、アイテム（ポーション/武器/盾）、インベントリ、ゲームオーバー
- **Phase 3**: 経験値・レベルアップ、スキル選択（Lv3,5,7,10）、6種スキル
- **Phase 4**: ボス戦（5F毎）、3種ボス（ゴブリンキング/ドラゴン/死霊の王）、2x2表示、特殊攻撃、WARNING演出、ボスHPバー、階段ロック、レアドロップ、16F以降スケーリング循環
- **追加UI**: スキルツールチップ（インベントリ内タップ）、メッセージログ（直近50件、LOGボタン）

## 次に着手すべき作業: フェーズ5（メタ進行）

以下を実装してください。既存コード（Phase 1〜4）を壊さないよう注意。

1. **ゴールドシステム**
   - 敵を倒すとゴールドドロップ（強い敵・ボスほど多い）
   - ダンジョン床にもゴールドがランダムで落ちている
   - 所持ゴールドをステータスパネルに常時表示

2. **死亡時の引き継ぎ**
   - ゲームオーバー時に所持ゴールドの30〜50%を「貯蓄ゴールド」として引き継ぎ
   - 到達フロア・倒した敵数などのリザルト画面表示

3. **拠点画面（冒険前に表示）**
   - 貯蓄ゴールドで恒久強化を購入：最大HP+10(100G)、基礎攻撃力+3(150G)、基礎防御力+3(150G)、初期アイテム枠+1(200G)、回復薬1個持ちスタート(80G)
   - 購入ごとに同じ強化の次回コスト上昇（インフレ対策）
   - カードUI風に表示、購入済み回数もわかるように
   - 「冒険に出る」ボタンでダンジョンへ

4. **localStorage 永続化**
   - 貯蓄ゴールドと購入済み強化を保存、ブラウザを閉じても残る

## 主要ファイル構成

```
src/
├── game/
│   ├── GameState.js      ← 中核。createInitialState, movePlayer, attackEnemy, attackBoss, descendStairs 等
│   ├── dungeon.js        ← generateFloor, generateBossFloor
│   ├── combat.js         ← calcDamage, calcPlayerDamage, getPlayerStats, checkEvasion
│   ├── enemyAI.js        ← processEnemyTurns
│   ├── bossAI.js         ← processBossTurn
│   ├── fov.js            ← computeFOV
├── data/
│   ├── enemies.js        ← 6種の敵定義、scaleEnemy ← ゴールド値を追加する
│   ├── items.js          ← アイテムテンプレ、createItemInstance
│   ├── bosses.js         ← 3種ボス定義、getBossForFloor ← ボスゴールドを追加する
│   ├── skills.js         ← 6種スキル
├── components/
│   ├── GameScreen.jsx    ← メイン画面、state管理、全UIオーケストレーション
│   ├── StatusPanel.jsx   ← フロア/HP/ATK/DEF/LOGボタン表示 ← ゴールド表示追加
│   ├── GameOverScreen.jsx← ゲームオーバー画面 ← リザルト表示に拡張
│   ├── Inventory.jsx     ← インベントリ（スキルツールチップ付き）
│   ├── BossWarning.jsx   ← ボス演出
│   ├── BossHPBar.jsx     ← ボスHP表示
│   ├── LogPanel.jsx      ← メッセージログ
│   ├── Canvas.jsx, DPad.jsx, SkillSelectModal.jsx, LevelUpFlash.jsx
├── rendering/
│   ├── renderer.js       ← renderGame（タイル/敵/ボス/プレイヤー/ポップアップ描画）
│   ├── sprites.js        ← drawPlayer, drawEnemy, drawBoss, drawItem 等
│   ├── camera.js         ← getCameraOffset
├── hooks/
│   ├── useGameLoop.js    ← RAF ループ
│   ├── useInput.js       ← スワイプ/キーボード入力
├── utils/
│   ├── constants.js      ← TILE_SIZE=32, MAP 40x30, TILE enum
│   ├── random.js         ← randInt, pick, shuffle
├── App.jsx               ← 現在は GameScreen を直接表示 ← 拠点/ゲーム画面の切替を追加
├── App.css               ← 全スタイル（~780行）
```

## 新規作成が必要なファイル

- `src/data/upgrades.js` — 強化定義（名前、コスト、効果、コスト上昇率）
- `src/game/metaProgress.js` — localStorage 保存/読込、貯蓄ゴールド管理
- `src/components/BaseScreen.jsx` — 拠点画面（強化ショップ + 冒険出発）

## 変更時の注意点

- `GameState.js` の `createPlayer()` に強化ボーナスを反映させる（引数で受け取る）
- `createInitialState()` も強化ボーナスを受け取れるように変更
- ゴールドは `state.player.gold` として管理
- 敵撃破時のゴールド加算は `attackEnemy` と `attackBoss` 内で行う
- 床ゴールドはアイテムと同様に `floorItems` に `type: 'gold'` で混ぜるか、別配列で管理
- `App.jsx` で画面遷移（拠点 ↔ ゲーム）を管理する
- 既存ファイルは必ず先に Read してから最小限の変更で進めること
- git push や destructive な git コマンドは実行前に確認すること
- ビルド確認: `npm run build` でエラーがないことを確認してからコミット

## 実装の流れ（推奨順）

1. `enemies.js` / `bosses.js` にゴールド値を追加
2. `metaProgress.js` 作成（localStorage 読書き）
3. `upgrades.js` 作成（強化定義）
4. `GameState.js` を修正（ゴールド管理、createPlayer に強化反映、敵撃破時ゴールド加算、床ゴールド生成）
5. `StatusPanel.jsx` にゴールド表示追加
6. `GameOverScreen.jsx` をリザルト画面に拡張（ゴールド引き継ぎ処理）
7. `BaseScreen.jsx` 作成（強化ショップUI）
8. `App.jsx` で画面遷移管理（拠点 → ゲーム → ゲームオーバー → 拠点）
9. `App.css` にスタイル追加
10. ビルド確認 → コミット → push
