// API失敗時のフォールバックデータ

const FALLBACK_EVENTS = [
  {
    type: 'stone_tablet',
    title: '謎の石碑',
    description: '古代文字が刻まれた石碑が通路の脇に立っている。微かに光を放ち、何かの力を宿しているようだ。',
    choices: [
      { text: '石碑に触れる', outcome: '石碑から温かい光が溢れ、体に活力が満ちた。', effect: { hp: 10 } },
      { text: '文字を読み解く', outcome: '古代の知恵が頭に流れ込み、戦闘の心得を得た。', effect: { attack: 1 } },
      { text: '無視して進む', outcome: '何事もなく通り過ぎた。', effect: {} },
    ],
  },
  {
    type: 'treasure_chest',
    title: '怪しい宝箱',
    description: '部屋の隅に古びた宝箱が置かれている。鍵はかかっていないが、罠の気配もする。',
    choices: [
      { text: '慎重に開ける', outcome: '中には金貨が入っていた！', effect: { gold: 15 } },
      { text: '力ずくで開ける', outcome: '罠が発動し、毒針が飛んできた！', effect: { hp: -8, gold: 20 } },
      { text: '開けない', outcome: '危険を避けて先に進んだ。', effect: {} },
    ],
  },
  {
    type: 'merchant',
    title: '旅の商人',
    description: 'ダンジョンの中で商人と出会った。「やあ冒険者、何か買わないかい？」と声をかけてくる。',
    choices: [
      { text: '体力の秘薬を買う', outcome: '商人から秘薬を購入し、飲み干した。体が軽くなった。', effect: { hp: 15, gold: -10 } },
      { text: '護身の護符を買う', outcome: '商人から護符を購入した。守りが固くなった気がする。', effect: { defense: 1, gold: -10 } },
      { text: '立ち去る', outcome: '商人に別れを告げて先に進んだ。', effect: {} },
    ],
  },
  {
    type: 'spring',
    title: '不思議な泉',
    description: '澄んだ水が湧き出る泉を見つけた。水面がかすかに光っており、神秘的な雰囲気が漂っている。',
    choices: [
      { text: '水を飲む', outcome: '清らかな水が体に染み渡り、傷が癒えた。', effect: { hp: 20 } },
      { text: '水を浴びる', outcome: '全身に力がみなぎり、攻守ともに強化された。', effect: { attack: 1, defense: 1, hp: -5 } },
    ],
  },
  {
    type: 'altar',
    title: '古の祭壇',
    description: '暗い部屋の中央に、かすかに紫色に光る祭壇がある。生贄を捧げれば力を授けてくれそうだ。',
    choices: [
      { text: 'HPを捧げる', outcome: '祭壇が輝き、強大な力が体に宿った。', effect: { hp: -10, attack: 2 } },
      { text: 'ゴールドを捧げる', outcome: '祭壇が光り、守護の加護を受けた。', effect: { gold: -15, defense: 2 } },
      { text: '祭壇を離れる', outcome: '危険な力には手を出さず、先に進んだ。', effect: {} },
    ],
  },
  {
    type: 'stone_tablet',
    title: '冒険者の遺言',
    description: '壁に刻まれたメッセージを発見した。先人の冒険者が残したもののようだ。',
    choices: [
      { text: '最後まで読む', outcome: '冒険者の知恵が記されていた。心身が少し強くなった。', effect: { hp: 5, attack: 1 } },
      { text: '読まずに進む', outcome: '何も起こらなかった。', effect: {} },
    ],
  },
]

export const FALLBACK_BOSS_DIALOGUES = {
  goblin_king: {
    taunt: 'フハハ、人間ごときがこの俺様に挑むとはな！踏み潰してやろう！',
    angry: 'ぐぬぬ…この俺様を怒らせたな！本気を見せてやる！',
    death: 'バカな…この俺様が…こんな人間に…',
  },
  dragon: {
    taunt: '矮小なる者よ、我が炎の前に跪くがいい。',
    angry: '…面白い。久しぶりに血が滾る。全力で焼き尽くしてやろう。',
    death: 'この我が…倒れるとは…見事だ、人間よ…',
  },
  lich_king: {
    taunt: '愚かな生者よ、死の安らぎを与えてやろう。',
    angry: '…貴様、まさかこの私を追い詰めるとは。死の恐怖を教えてやる。',
    death: 'この肉体は滅びようと…我が魂は永遠に…',
  },
}

export function getRandomFallbackEvent(floor) {
  const idx = Math.floor(Math.random() * FALLBACK_EVENTS.length)
  const event = FALLBACK_EVENTS[idx]

  // 階層に応じてeffect値をスケーリング
  const scale = 1 + (floor - 1) * 0.05
  const scaledChoices = event.choices.map((c) => ({
    ...c,
    effect: Object.fromEntries(
      Object.entries(c.effect).map(([k, v]) => [k, Math.round(v * scale)])
    ),
  }))

  return { ...event, choices: scaledChoices }
}

export function getFallbackBossDialogue(bossId, triggerType) {
  const baseId = bossId?.replace('boss_', '') || 'goblin_king'
  const dialogues = FALLBACK_BOSS_DIALOGUES[baseId] || FALLBACK_BOSS_DIALOGUES.goblin_king
  return dialogues[triggerType] || dialogues.taunt
}
