// Vercel Serverless Function: ランダムイベント生成
// POST /api/ai-event
// Body: { floor, hp, maxHp, items: string[] }
// Response: { type, title, description, choices: [{ text, outcome, effect }] }

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: true, message: 'API key not configured' })
  }

  try {
    const { floor, hp, maxHp, items } = req.body

    const prompt = `あなたはローグライクダンジョンゲームのイベント生成AIです。
プレイヤーの現在の状況:
- ダンジョン${floor}階
- HP: ${hp}/${maxHp}
- 所持アイテム: ${items && items.length > 0 ? items.join('、') : 'なし'}

以下の条件でランダムイベントを1つ生成してください:
- イベントの種類は「石碑」「宝箱」「旅の商人」「泉」「祭壇」のいずれか
- プレイヤーの状況に合った内容にすること（HPが低ければ回復系、高階層なら高リスク高リターンなど）
- 説明文は2〜3文で雰囲気のある日本語
- 選択肢は2〜3個
- 各選択肢にはoutcome（結果の説明文）とeffect（数値効果）を含める
- effectは以下のキーを組み合わせ可能: hp（正で回復、負でダメージ）, gold, attack, defense
- effectの値はゲームバランスに配慮（HPの回復/ダメージは5〜20程度、goldは5〜30程度、attack/defenseは1〜3程度）

以下のJSON形式で出力してください:
{
  "type": "stone_tablet|treasure_chest|merchant|spring|altar",
  "title": "イベントタイトル",
  "description": "イベントの説明文",
  "choices": [
    {
      "text": "選択肢のテキスト",
      "outcome": "結果の説明文",
      "effect": { "hp": 0, "gold": 0 }
    }
  ]
}`

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.9,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API error:', response.status, errText)
      return res.status(500).json({ error: true })
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return res.status(500).json({ error: true })
    }

    // JSONパース（直接 or 正規表現抽出）
    let eventData
    try {
      eventData = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        eventData = JSON.parse(match[0])
      } else {
        return res.status(500).json({ error: true })
      }
    }

    // バリデーション
    if (!eventData.title || !eventData.choices || !Array.isArray(eventData.choices)) {
      return res.status(500).json({ error: true })
    }

    return res.status(200).json(eventData)
  } catch (err) {
    console.error('ai-event error:', err)
    return res.status(500).json({ error: true })
  }
}
