# シレン風ローグライクダンジョン探索ゲーム — 設計ドキュメント

## 1. ゲーム概要

ターン制のローグライクダンジョン探索ゲーム。「不思議のダンジョン」シリーズのゲーム性をベースに、モバイルブラウザで快適に遊べるよう設計する。

### コンセプト

- **ターン制**: プレイヤーが1手動くと敵も1手動く。じっくり考えて行動できる
- **ローグライク**: 毎回ランダム生成されるダンジョン。死んだらやり直し（一部引き継ぎあり）
- **モバイルファースト**: スワイプ＆タップで快適操作。PWA対応でホーム画面から起動
- **ドット絵風ビジュアル**: Canvas描画によるレトロなドット絵風タイルマップ
- **カードUI**: ステータスやアイテム情報をカード型パネルで表示

### ゲームフロー

```
タイトル画面 → ダンジョン探索（1階〜） → 階段で次フロアへ
                    ↓                         ↓
               敵と戦闘・アイテム収集    5階ごとにボス戦
                    ↓                         ↓
               死亡 → 拠点に戻る         クリア → 次の階層へ
                    ↓
              ゴールド引き継ぎ → 拠点で恒久強化
```

---

## 2. フェーズ別機能一覧

### フェーズ1: ダンジョン基盤

> ランダムダンジョン生成と基本移動

| 機能 | 詳細 |
|------|------|
| ダンジョン生成 | BSP法による部屋＋通路のランダム生成 |
| タイル描画 | Canvas でフロア・壁・通路・階段を描画 |
| プレイヤー移動 | スワイプ / 仮想十字キーで4方向移動（斜め移動はフェーズ6で検討） |
| 視界システム | プレイヤー周囲のみ表示（部屋内は全体可視） |
| 階段 | 階段タイルに乗って次フロアへ進行 |
| フロア表示 | 現在の階数をUIに表示 |
| カメラ追従 | プレイヤーを中心にビューポートがスクロール |

### フェーズ2: 戦闘とアイテム

> 敵との戦闘システムとアイテムの基本実装

| 機能 | 詳細 |
|------|------|
| 敵配置 | フロアごとにランダムに敵を配置（種類は階層依存） |
| ターン制AI | 敵はプレイヤーに隣接すると攻撃、離れていると接近 |
| 近接攻撃 | 隣接する敵の方向に移動で自動攻撃 |
| HP管理 | プレイヤー・敵ともにHP制。0で死亡 |
| アイテムドロップ | 敵撃破・床落ちでアイテム取得 |
| アイテム種別 | 武器 / 盾 / 回復薬 / 巻物 |
| 装備システム | 武器・盾を装備してステータス変化 |
| インベントリ | 所持アイテム一覧の表示・使用・装備切替 |
| 満腹度 | ターン経過で減少。0になるとHP減少 |

### フェーズ3: 成長システム

> 経験値によるレベルアップとスキル習得

| 機能 | 詳細 |
|------|------|
| 経験値 | 敵撃破で経験値獲得 |
| レベルアップ | 閾値到達でレベルアップ。HP/攻撃力/防御力が上昇 |
| スキル選択 | レベルアップ時に3択からスキルを1つ選択 |
| スキル種別 | 攻撃系（範囲攻撃、貫通）/ 防御系（被ダメ軽減、HP回復）/ 探索系（罠感知、アイテム感知） |
| スキル使用 | ターン消費でスキル発動。クールダウンあり |

### フェーズ4: ボス戦

> 5階ごとのボスフロアと特殊戦闘

| 機能 | 詳細 |
|------|------|
| ボスフロア | 5階, 10階, 15階… に専用マップ |
| ボス敵 | 通常敵より大きいスプライト。専用HP表示 |
| 特殊攻撃 | 範囲攻撃 / 召喚 / バフ・デバフ |
| 行動パターン | HPに応じてフェーズ遷移（通常→怒り→瀕死） |
| 撃破報酬 | 特別なアイテム・大量経験値 |

### フェーズ5: メタ進行

> 死亡時の引き継ぎと拠点システム

| 機能 | 詳細 |
|------|------|
| ゴールド | ダンジョン内で獲得。死亡時も一定割合を保持 |
| 拠点画面 | ダンジョン外の拠点UI |
| 恒久強化 | ゴールドで初期ステータスを永続アップ |
| 強化項目 | 初期HP+ / 初期攻撃力+ / 初期防御力+ / 所持品枠+ / 満腹度上限+ |
| 実績 | 到達階数・撃破数などの記録 |
| セーブ | localStorage によるオートセーブ（中断復帰対応） |

### フェーズ6: UI仕上げ

> ビジュアルとUXの最終仕上げ

| 機能 | 詳細 |
|------|------|
| カードUIパネル | ステータス・アイテム・スキルをカード型UIで表示 |
| ミニマップ | 画面隅に探索済みエリアのミニマップ |
| アニメーション | 攻撃エフェクト / ダメージ数値ポップ / 画面遷移 |
| 効果音・BGM | Web Audio API による最低限のSE |
| チュートリアル | 初回プレイ時の操作ガイド |
| 演出 | フロア遷移演出 / ボス登場演出 / 死亡演出 |

### フェーズ7: AI連携（Gemini API）

> Gemini AIによるランダムイベント生成とボスセリフ生成

| 機能 | 詳細 |
|------|------|
| バックエンド | Vercel Serverless Functions (`api/ai-event.js`, `api/ai-boss.js`) |
| AIモデル | Gemini 2.5 Flash (`gemini-2.5-flash`) |
| APIキー管理 | サーバー側環境変数 `GEMINI_API_KEY` |
| ランダムイベント | 5フロアに1回程度、AIが状況に応じたイベント文と2〜3選択肢を生成 |
| イベント種類 | 謎の石碑 / 怪しい宝箱 / 旅の商人 / 泉 / 祭壇 など |
| イベント効果 | HP回復・ダメージ・ゴールド獲得・ステータス変化など、JSONで数値反映 |
| ボスセリフ | 戦闘開始時の挑発、HP50%以下で怒り、撃破時に断末魔（1〜2文） |
| エラーハンドリング | API失敗時はフォールバックテキスト表示、ゲーム停止なし |
| レート制限 | クライアント側で1分5リクエスト制限 |
| ローディング | API呼び出し中は待機アニメーション表示 |

---

## 3. データ構造設計

### Player

```ts
type Player = {
  x: number              // タイル座標
  y: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  level: number
  exp: number
  expToNext: number
  gold: number
  hunger: number         // 満腹度 (0〜100)
  maxHunger: number
  equipment: {
    weapon: Item | null
    shield: Item | null
  }
  inventory: Item[]      // 最大8〜12枠
  skills: Skill[]
}
```

### Enemy

```ts
type Enemy = {
  id: string             // ユニークID
  type: EnemyType        // 敵種別マスタへの参照
  x: number
  y: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  exp: number            // 撃破時の獲得経験値
  state: 'idle' | 'chase' | 'attack'
  isBoss: boolean
  bossPhase?: number     // ボス用フェーズ (1, 2, 3)
}

type EnemyType = {
  name: string
  sprite: string         // スプライト識別子
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseExp: number
  minFloor: number       // 出現開始階
  maxFloor: number       // 出現終了階
  dropTable: DropEntry[]
}
```

### Item

```ts
type Item = {
  id: string
  type: 'weapon' | 'shield' | 'potion' | 'scroll'
  name: string
  sprite: string
  rarity: 'common' | 'uncommon' | 'rare'
  stats: {
    attack?: number      // 武器用
    defense?: number     // 盾用
    heal?: number        // 回復薬用
  }
  effect?: string        // 巻物等の特殊効果ID
  description: string
}
```

### Dungeon / Floor

```ts
type Dungeon = {
  currentFloor: number
  floors: Floor[]        // 訪問済みフロアのキャッシュ（通常は現在階のみ保持）
}

type Floor = {
  level: number
  width: number          // タイル数（例: 40）
  height: number         // タイル数（例: 30）
  tiles: Tile[][]
  rooms: Room[]
  enemies: Enemy[]
  items: ItemOnFloor[]   // 床に落ちているアイテム
  stairs: { x: number; y: number }
  isBossFloor: boolean
}

type Room = {
  x: number              // 左上タイル座標
  y: number
  width: number
  height: number
}
```

### Tile

```ts
type Tile = {
  type: 'floor' | 'wall' | 'corridor' | 'stairs' | 'door'
  visible: boolean       // 現在視界内か
  revealed: boolean      // 一度でも見たか（ミニマップ用）
}
```

### Skill

```ts
type Skill = {
  id: string
  name: string
  description: string
  category: 'attack' | 'defense' | 'explore'
  cooldown: number       // ターン数
  currentCooldown: number
  effect: SkillEffect
}

type SkillEffect = {
  type: string           // 'damage_area' | 'heal' | 'detect_trap' など
  value: number
  range?: number
}
```

### MetaProgress（恒久進行データ）

```ts
type MetaProgress = {
  gold: number
  upgrades: {
    maxHp: number        // 強化回数
    attack: number
    defense: number
    inventorySlots: number
    maxHunger: number
  }
  bestFloor: number      // 最高到達階
  totalRuns: number
  totalKills: number
}
```

---

## 4. ファイル・フォルダ構成

```
roguelike-dungeon/
├── docs/
│   └── DESIGN.md              # 本ドキュメント
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.svg
│   └── pwa-512x512.svg
├── src/
│   ├── main.jsx               # エントリポイント
│   ├── App.jsx                # ルートコンポーネント・画面遷移管理
│   ├── App.css
│   ├── index.css              # グローバルスタイル
│   │
│   ├── components/            # UIコンポーネント
│   │   ├── GameScreen.jsx     # ゲーム画面全体のレイアウト
│   │   ├── Canvas.jsx         # ダンジョン描画用 Canvas
│   │   ├── DPad.jsx           # 仮想十字キー
│   │   ├── StatusPanel.jsx    # HP / レベル / 階数 などのカードUI
│   │   ├── Inventory.jsx      # アイテム一覧パネル
│   │   ├── SkillBar.jsx       # スキルボタン
│   │   ├── MiniMap.jsx        # ミニマップ (フェーズ6)
│   │   ├── BossHpBar.jsx      # ボスHP表示 (フェーズ4)
│   │   ├── TitleScreen.jsx    # タイトル画面
│   │   ├── BaseScreen.jsx     # 拠点画面 (フェーズ5)
│   │   ├── GameOverScreen.jsx # ゲームオーバー画面
│   │   └── LevelUpModal.jsx   # レベルアップ時のスキル選択 (フェーズ3)
│   │
│   ├── game/                  # ゲームロジック（UIに依存しない純粋なロジック）
│   │   ├── GameState.js       # ゲーム状態の管理・ターン進行
│   │   ├── dungeon.js         # BSP法によるダンジョン生成
│   │   ├── fov.js             # 視界計算
│   │   ├── pathfinding.js     # 敵AIの経路探索 (A*)
│   │   ├── combat.js          # ダメージ計算・戦闘処理
│   │   ├── enemyAI.js         # 敵の行動決定ロジック
│   │   ├── items.js           # アイテム効果・ドロップ処理
│   │   ├── skills.js          # スキル定義・効果処理 (フェーズ3)
│   │   └── boss.js            # ボスの行動パターン (フェーズ4)
│   │
│   ├── data/                  # マスタデータ（定数）
│   │   ├── enemies.js         # 敵種別定義
│   │   ├── items.js           # アイテム定義
│   │   ├── skills.js          # スキル定義 (フェーズ3)
│   │   └── upgrades.js        # 拠点強化の定義 (フェーズ5)
│   │
│   ├── rendering/             # Canvas 描画
│   │   ├── renderer.js        # メイン描画ループ
│   │   ├── sprites.js         # スプライト管理・ドット絵定義
│   │   ├── camera.js          # カメラ（ビューポート）制御
│   │   └── effects.js         # エフェクト描画 (フェーズ6)
│   │
│   ├── hooks/                 # カスタムフック
│   │   ├── useGameLoop.js     # ゲームループ管理
│   │   ├── useInput.js        # タッチ・キーボード入力処理
│   │   └── useSave.js         # localStorage セーブ/ロード (フェーズ5)
│   │
│   └── utils/                 # ユーティリティ
│       ├── random.js          # シード付き乱数
│       └── constants.js       # 定数（タイルサイズ, 画面サイズ等）
│
├── index.html
├── vite.config.js
├── package.json
└── .gitignore
```

---

## 5. 使用技術とライブラリ

### コア

| 技術 | 用途 |
|------|------|
| **React 19** | UIコンポーネント・状態管理 |
| **Vite 7** | ビルドツール・開発サーバー |
| **Canvas API** | ダンジョンのタイルマップ描画 |
| **CSS** | UIスタイリング（CSS Modules or plain CSS） |

### PWA

| 技術 | 用途 |
|------|------|
| **vite-plugin-pwa** | Service Worker 自動生成・マニフェスト管理 |

### 描画

| 技術 | 用途 |
|------|------|
| **Canvas 2D Context** | ドット絵スプライトの描画（外部ライブラリ不使用） |
| コード内スプライト定義 | 画像ファイルを使わず、ピクセル配列でドット絵を定義 |

### データ永続化

| 技術 | 用途 |
|------|------|
| **localStorage** | セーブデータ・恒久進行データの保存 |

### デプロイ

| 技術 | 用途 |
|------|------|
| **Vercel** | ホスティング・自動デプロイ |
| **GitHub** | ソースコード管理 |

### 使用しないもの（意図的な選択）

- **状態管理ライブラリ (Redux等)**: React の useState / useReducer で十分
- **ゲームエンジン (Phaser等)**: Canvas API 直接操作でシンプルに保つ
- **画像アセット**: コード内でドット絵を定義し、外部依存を排除
- **TypeScript**: 段階的開発のため JSDoc コメントで型情報を補完

---

## 6. 設計方針

### ゲームロジックとUIの分離

`src/game/` 配下のロジックは React に一切依存しない純粋な JavaScript として実装する。これにより：

- テストが容易
- ロジックの見通しが良い
- UIの変更がゲームルールに影響しない

### ターン制の実装

```
ユーザー入力 → プレイヤー行動 → 敵全体の行動 → 状態更新 → 再描画
```

1ターンは上記の流れで処理される。プレイヤーの入力がない限りゲームは進行しない。

### Canvas 描画の方針

- タイルサイズ: 32×32px（Retina対応で内部は64×64）
- 描画は `requestAnimationFrame` で毎フレーム実行するが、ゲーム状態の更新はターン単位
- アニメーション（移動補間・エフェクト）は描画レイヤーで処理し、ゲーム状態とは独立

### モバイル最適化

- スワイプ方向でプレイヤー移動
- 画面下部に仮想十字キー（DPad）配置
- ダブルタップで「その場で待機（1ターン消費）」
- 長押しで足元アイテム確認
- UI要素は親指が届く画面下半分に集中配置
