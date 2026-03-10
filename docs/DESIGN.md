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
| プレイヤー移動 | スワイプ / 仮想十字キー / ジョイスティックで8方向移動 |
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

### フェーズ7: AI連携（Groq API）

> Groq API（Llama 3.3）によるランダムイベント生成とボスセリフ生成

| 機能 | 詳細 |
|------|------|
| バックエンド | Vercel Serverless Functions (`api/ai-event.js`, `api/ai-boss.js`) |
| AIモデル | Llama 3.3 70B Versatile (`llama-3.3-70b-versatile`) via Groq API |
| APIキー管理 | サーバー側環境変数 `GROQ_API_KEY` |
| ランダムイベント | 2F以降20%確率でAIが状況に応じたイベント文と2〜3選択肢を生成 |
| イベント種類 | 謎の石碑 / 怪しい宝箱 / 旅の商人 / 泉 / 祭壇 など |
| イベント効果 | HP回復・ダメージ・ゴールド獲得・ステータス変化など、JSONで数値反映 |
| ボスセリフ | 戦闘開始時の挑発、HP50%以下で怒り、撃破時に断末魔（1〜2文）。Few-shot参考例＋自然な日本語指示、temperature 0.8 |
| エラーハンドリング | API失敗時はフォールバックテキスト表示、ゲーム停止なし |
| レート制限 | クライアント側で1分5リクエスト制限 |
| ローディング | API呼び出し中は待機アニメーション表示 |

### フェーズ8: 職業システム

> 冒険開始時に職業を選択し、職業ごとの固有ステータス・スキルでプレイスタイルが分岐

| 機能 | 詳細 |
|------|------|
| 職業選択画面 | 冒険開始時にカードUI風で3枚から選択 |
| 戦士 | HP・攻撃力が高い。専用スキル：かばう（1ターン被ダメ半減）、渾身の一撃（HP消費で大ダメージ）、ウォークライ（数ターン攻撃力アップ） |
| 魔法使い | MPを持ち遠距離魔法が使える。専用スキル：ファイアボール（2マス先まで攻撃）、テレポート（ランダムな部屋に移動）、魔力の盾（MP消費でダメージ軽減） |
| 盗賊 | 素早さが高くアイテム運が良い。専用スキル：奇襲（先制攻撃で2倍ダメージ）、罠感知（罠を可視化）、盗む（敵からアイテムドロップ率大幅アップ） |
| MPシステム | 魔法使い専用。ステータスにMPゲージ表示、フロア移動時に少し回復 |
| スキル選択 | レベルアップ時は共通スキル＋職業専用スキルの混合で3択表示 |
| 拠点表示 | 拠点画面に選択中の職業を表示 |
| 職業アイコン | 各職業のドット絵風アイコンを職業選択画面に表示 |

### フェーズ9: カスタムスプライト（完了）

> 全キャラクター・敵・ボス・アイテム・オブジェクトをPNG画像に置き換え

| 機能 | 詳細 |
|------|------|
| プレイヤー画像 | `public/sprites/player/` — warrior.png, mage.png, thief.png (32x32) |
| 敵画像 | `public/sprites/enemies/` — slime, bat, goblin, skeleton, orc, demon (32x32) |
| ボス画像 | `public/sprites/bosses/` — goblin_king, dragon, lich_king (64x64) |
| アイテム画像 | `public/sprites/items/` — potion_green/red/gold, weapon_stick/copper/iron/steel, shield_wood/iron/steel, gold (32x32) |
| オブジェクト画像 | `public/sprites/objects/` — stairs.png, blacksmith.png (32x32) |
| 画像読み込み | `sprites.js` で全画像をプリロード、Canvas drawImage描画 |
| フォールバック | 画像読み込み失敗時はコード描画にフォールバック |
| 職業選択画面 | ClassSelectScreen.jsx でスプライト画像を直接表示 |

### バランス調整（Phase 6後に実施、完了済み）

| 項目 | 詳細 |
|------|------|
| 装備付与効果 | 武器/盾に12%確率でランダム付与（毒付与/HP吸収/会心率UP/反撃/ダメージ軽減/守護回復） |
| 鍛冶屋NPC | 10F以降10%で出現。同種装備2つで+1強化（最大+5） |
| ゴールド調整 | 雑魚ドロップ約半減、床ゴールド削減、拠点コスト乗数引き上げ |
| 雑魚敵強化 | HP/ATK/DEF 1.3〜1.4倍、指数項スケーリング、特殊行動（コウモリ2回攻撃/オーク召喚/デーモン自爆） |
| 回復薬調整 | 出現weight半減、薬草12HP固定、回復薬→最大HP30%、上級→50% |
| 自然回復 | 5ターンごとにHP1回復 |

### 操作システム改善（Phase 9後に実施、完了済み）

| 機能 | 詳細 |
|------|------|
| 8方向移動 | キーボード斜め: q/e/z/c またはテンキー 7/9/1/3 |
| バーチャルジョイスティック | `VirtualJoystick.jsx` — 正円、8方向、連続移動（150ms初回→200msリピート）、デッドゾーン50%、方向ハイライト |
| 操作モード切替 | D-Pad / ジョイスティック切替ボタン。設定はlocalStorage保存 |
| 壁への移動で足踏み | 壁・範囲外への移動でもターン経過（シレン準拠）。`stayInPlace()` 関数 |
| 斜め移動制限 | 両隣が壁なら斜め移動不可（壁角すり抜け防止） |

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
├── api/                       # Vercel Serverless Functions
│   ├── ai-event.js            # ランダムイベント生成（Groq API）
│   └── ai-boss.js             # ボスセリフ生成（Groq API、Few-shot参考例付き）
├── public/
│   ├── sprites/
│   │   ├── player/            # warrior.png, mage.png, thief.png (32x32)
│   │   ├── enemies/           # slime, bat, goblin, skeleton, orc, demon (32x32)
│   │   ├── bosses/            # goblin_king, dragon, lich_king (64x64)
│   │   ├── items/             # potion_green/red/gold, weapon_*, shield_*, gold (32x32)
│   │   └── objects/           # stairs.png, blacksmith.png (32x32)
│   ├── favicon.svg
│   ├── pwa-192x192.svg
│   └── pwa-512x512.svg
├── src/
│   ├── main.jsx               # エントリポイント
│   ├── App.jsx                # ルートコンポーネント・画面遷移管理（title/base/classSelect/game）
│   ├── App.css                # 全スタイル（~1700行、ジョイスティックCSS含む）
│   ├── index.css              # グローバルスタイル
│   │
│   ├── components/            # UIコンポーネント
│   │   ├── GameScreen.jsx     # ゲーム画面全体（AIイベント/ボスセリフのuseEffect、操作モード切替含む）
│   │   ├── Canvas.jsx         # ダンジョン描画用 Canvas
│   │   ├── DPad.jsx           # 仮想十字キー（4方向）
│   │   ├── VirtualJoystick.jsx # 8方向バーチャルジョイスティック（連続移動、方向ハイライト）
│   │   ├── ClassSelectScreen.jsx # 職業選択カードUI（スプライト画像表示）
│   │   ├── StatusPanel.jsx    # フロア/HP/MP/ATK/DEF/Gold/LOGボタン
│   │   ├── Inventory.jsx      # インベントリ（付与効果表示、強化値表示、ドロップ/ソート）
│   │   ├── BlacksmithModal.jsx # 鍛冶屋UI（ベース選択→素材選択→強化）
│   │   ├── AIEventModal.jsx   # AIイベント表示モーダル（ローディング/選択肢/結果表示）
│   │   ├── BossDialogue.jsx   # ボスセリフ吹き出し（フェードイン/アウト）
│   │   ├── Minimap.jsx        # Canvas右上ミニマップ（タップ拡大）
│   │   ├── BossWarning.jsx    # ボス登場WARNING演出
│   │   ├── BossHPBar.jsx      # ボスHP表示
│   │   ├── TitleOverlay.jsx   # タイトル画面（初回訪問時）
│   │   ├── BaseScreen.jsx     # 拠点画面（強化ショップ、前回職業表示）
│   │   ├── GameOverScreen.jsx # リザルト画面（貯蓄表示付き）
│   │   ├── Tutorial.jsx       # 操作チュートリアル（初回のみ）
│   │   ├── SkillSelectModal.jsx # レベルアップ時のスキル選択
│   │   ├── LevelUpFlash.jsx   # レベルアップ演出
│   │   └── LogPanel.jsx       # 戦闘ログパネル
│   │
│   ├── game/                  # ゲームロジック（UIに依存しない純粋なロジック）
│   │   ├── GameState.js       # 中核。状態管理（移動/攻撃/階段/インベントリ/鍛冶屋/毒/自然回復/AIイベント/ボスセリフ/職業バフ/足踏み）
│   │   ├── dungeon.js         # generateFloor, generateBossFloor（BSP法）
│   │   ├── fov.js             # 視界計算
│   │   ├── combat.js          # calcDamage, calcPlayerDamage, getPlayerStats, applyShieldEnchant等
│   │   ├── enemyAI.js         # processEnemyTurns（特殊行動: 2回攻撃/召喚/自爆）
│   │   ├── bossAI.js          # processBossTurn
│   │   ├── metaProgress.js    # localStorage保存/読込、貯蓄ゴールド管理
│   │   └── aiClient.js        # fetchAIEvent, fetchBossDialogue（Groq API、レート制限、フォールバック付き）
│   │
│   ├── data/                  # マスタデータ（定数）
│   │   ├── enemies.js         # 6種敵（special属性付き）、急カーブスケーリング
│   │   ├── items.js           # アイテムテンプレ（sprite属性付き）、ENCHANTMENTS定義、rollEnchantment、buildItem
│   │   ├── bosses.js          # 3種ボス定義
│   │   ├── skills.js          # 6種共通スキル + CLASS_SKILLSインポート、getSkillChoices
│   │   ├── classes.js         # 3職業定義（CLASSES）、9種職業スキル（CLASS_SKILLS）、getClassById
│   │   ├── upgrades.js        # 5種恒久強化（コスト乗数1.7〜2.0）
│   │   └── fallbacks.js       # AIイベント・ボスセリフのフォールバックデータ
│   │
│   ├── rendering/             # Canvas 描画
│   │   ├── renderer.js        # renderGame（鍛冶屋NPC描画含む、drawPlayerにclassId渡し）
│   │   ├── sprites.js         # 全画像プリロード＋drawImage描画（player/enemy/boss/item/gold/stairs/blacksmith）、フォールバック付き
│   │   └── camera.js          # カメラ（ビューポート）制御
│   │
│   ├── hooks/                 # カスタムフック
│   │   ├── useGameLoop.js     # RAFループ（画面シェイク付き）
│   │   └── useInput.js        # スワイプ/キーボード入力（8方向対応: q/e/z/c, テンキー7/9/1/3）
│   │
│   └── utils/                 # ユーティリティ
│       ├── constants.js       # TILE_SIZE=32, MAP 40x30, TILE enum
│       ├── random.js          # randInt, pick, shuffle
│       └── sound.js           # Web Audio API効果音（sfxAttack等）
│
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
├── RESUME_PROMPT.md           # 次回セッション引継ぎ用プロンプト
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
| **Canvas 2D Context** | スプライト画像の描画（外部ライブラリ不使用） |
| PNG画像スプライト | `public/sprites/` に配置したPNG画像をプリロード＋drawImage描画。読込失敗時はコード描画にフォールバック |

### データ永続化

| 技術 | 用途 |
|------|------|
| **localStorage** | セーブデータ・恒久進行データの保存 |

### デプロイ

| 技術 | 用途 |
|------|------|
| **Vercel** | ホスティング・自動デプロイ |
| **GitHub** | ソースコード管理 |

### AI連携

| 技術 | 用途 |
|------|------|
| **Groq API** | Llama 3.3 70B Versatile（OpenAI互換形式）によるテキスト生成 |
| **Vercel Serverless Functions** | APIキーをサーバー側で管理（`api/ai-event.js`, `api/ai-boss.js`） |

### 使用しないもの（意図的な選択）

- **状態管理ライブラリ (Redux等)**: React の useState / useReducer で十分
- **ゲームエンジン (Phaser等)**: Canvas API 直接操作でシンプルに保つ
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
- 仮想十字キー（DPad）またはバーチャルジョイスティック（8方向）を選択可能
- ジョイスティック: 正円、デッドゾーン50%、連続移動（150ms初回→200msリピート）、方向ガイドハイライト
- 操作モード切替ボタンで即座に切り替え（設定はlocalStorage保存）
- 壁への移動で足踏み（ターン経過、シレン準拠）
- UI要素は親指が届く画面下半分に集中配置
