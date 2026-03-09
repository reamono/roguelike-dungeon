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
- **Phase 5**: メタ進行 — ゴールドシステム、死亡時30-50%貯蓄、拠点画面で恒久強化ショップ、localStorage永続化
- **Phase 6**: UI改善 — インベントリ（ドロップ/ソート）、カードUI統一、ミニマップ（タップ拡大）、ダメージポップアップ強化＆画面シェイク、Web Audio API効果音、タイトル画面、初回チュートリアル

### バランス調整（Phase 6後に実施、全て完了済み）

**① 装備システム拡張**
- 武器/盾に12%確率でランダム付与効果（毒付与/HP吸収/会心率UP/反撃/ダメージ軽減/守護回復）
- 10F以降10%で鍛冶屋NPC出現、同種装備2つで+1強化（最大+5、+2ステータス/段階）
- 袋画面で装備タップ→付与効果の詳細確認可能
- `BlacksmithModal.jsx` 新規作成

**② ゴールド調整**
- 雑魚敵のゴールドドロップ約半減、床ゴールド出現数・金額削減
- 拠点強化コスト乗数引き上げ（1.5→1.7, 1.8→2.0, 1.6→1.8）
- ボスゴールドは据え置き

**③ 雑魚敵の強化**
- 全敵HP/ATK/DEFを1.3〜1.4倍に引き上げ
- スケーリングに指数項追加（`1 + depth*0.12 + depth^1.4*0.02`）
- 特殊行動: コウモリ(2回攻撃)、オーク(20%で仲間召喚)、デーモン(HP25%以下で自爆)

**④ 回復薬の調整**
- 出現weight半減、薬草12HP固定、回復薬→最大HP30%、上級→50%
- 5ターンごとにHP1自然回復

## 主要ファイル構成

```
src/
├── game/
│   ├── GameState.js      ← 中核。状態管理（移動/攻撃/階段/インベントリ/鍛冶屋/毒/自然回復）
│   ├── dungeon.js        ← generateFloor, generateBossFloor
│   ├── combat.js         ← calcDamage, calcPlayerDamage(付与効果対応), getPlayerStats(強化値対応), applyShieldEnchant, getThornsDamage, checkEvasion
│   ├── enemyAI.js        ← processEnemyTurns（特殊行動: 2回攻撃/召喚/自爆）
│   ├── bossAI.js         ← processBossTurn
│   ├── fov.js            ← computeFOV
│   ├── metaProgress.js   ← localStorage保存/読込、貯蓄ゴールド管理
├── data/
│   ├── enemies.js        ← 6種敵（special属性付き）、急カーブスケーリング
│   ├── items.js          ← アイテムテンプレ、ENCHANTMENTS定義、rollEnchantment、buildItem
│   ├── bosses.js         ← 3種ボス定義
│   ├── skills.js         ← 6種スキル
│   ├── upgrades.js       ← 5種恒久強化（コスト乗数1.7〜2.0）
├── components/
│   ├── GameScreen.jsx    ← メイン画面、全UIオーケストレーション（鍛冶屋モーダル含む）
│   ├── StatusPanel.jsx   ← フロア/HP/ATK/DEF/Gold/LOGボタン
│   ├── GameOverScreen.jsx← リザルト画面（貯蓄表示付き）
│   ├── Inventory.jsx     ← インベントリ（付与効果表示、強化値表示、ドロップ/ソート）
│   ├── BlacksmithModal.jsx← 鍛冶屋UI（ベース選択→素材選択→強化）
│   ├── BaseScreen.jsx    ← 拠点画面（強化ショップ）
│   ├── TitleOverlay.jsx  ← タイトル画面（初回訪問時）
│   ├── Tutorial.jsx      ← 操作チュートリアル（初回のみ）
│   ├── Minimap.jsx       ← Canvas右上ミニマップ（タップ拡大）
│   ├── BossWarning.jsx, BossHPBar.jsx, LogPanel.jsx
│   ├── Canvas.jsx, DPad.jsx, SkillSelectModal.jsx, LevelUpFlash.jsx
├── rendering/
│   ├── renderer.js       ← renderGame（鍛冶屋NPC描画含む）
│   ├── sprites.js        ← 全ドット絵描画（drawBlacksmith追加済み）
│   ├── camera.js
├── hooks/
│   ├── useGameLoop.js    ← RAFループ（画面シェイク付き）
│   ├── useInput.js       ← スワイプ/キーボード入力
├── utils/
│   ├── constants.js      ← TILE_SIZE=32, MAP 80x50, TILE enum
│   ├── random.js         ← randInt, pick, shuffle
│   ├── sound.js          ← Web Audio API効果音（sfxAttack等）
├── App.jsx               ← 画面遷移（title/base/game）、メタ進行管理
├── App.css               ← 全スタイル（~1500行）
```

## 現在の状態

- 全フェーズ(1〜6) + バランス調整が完了済み
- 最新コミット: `e342fca` (master, pushed)
- ビルド成功確認済み

## 次に着手すべき作業候補

以下は未実装のアイデア（ユーザーの指示待ち）:

1. **フェーズ7（未定義）** — ユーザーから具体的な指示があれば実装
2. **追加バランス調整** — プレイテスト後のフィードバックに基づく微調整
3. **新コンテンツ** — 新しい敵種、アイテム種、スキル、ダンジョンギミック等

## 変更時の注意点

- `GameState.js` が最も大きく複雑（~824行）。イミュータブル状態パターン（関数が新stateを返す）
- `combat.js` の `calcPlayerDamage` は第4引数 `weapon` で付与効果を処理する
- `enemyAI.js` の `processEnemyTurns` は `special` 属性で特殊行動を分岐
- 装備の `enhance` (0〜5) と `enchant` (付与効果オブジェクト) は別概念
- 回復薬は `stats.heal`（固定値）と `stats.healPercent`（最大HP割合）の2方式がある
- 既存ファイルは必ず先に Read してから最小限の変更で進めること
- ビルド確認: `npm run build` でエラーがないことを確認してからコミット
