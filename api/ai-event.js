// Vercel Serverless Function: ランダムイベント生成
// POST /api/ai-event
// Body: { floor, hp, maxHp, items: string[] }
// Response: { type, title, description, choices: [{ text, outcome, effect }] }

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error('GROQ_API_KEY is not set')
    return res.status(500).json({ error: true, message: 'API key not configured' })
  }

  try {
    const body = req.body || {}
    const floor = body.floor || 1
    const hp = body.hp || 30
    const maxHp = body.maxHp || 30
    const items = Array.isArray(body.items) ? body.items : []

    console.log('ai-event called:', { floor, hp, maxHp, itemCount: items.length })

    const systemPrompt = `あなたはローグライクダンジョンゲームのイベント生成AIです。
指示に従い、必ず指定されたJSON形式のみを出力してください。説明文やマークダウンは不要です。`

    const userPrompt = `プレイヤーの現在の状況:
- ダンジョン${floor}階
- HP: ${hp}/${maxHp}
- 所持アイテム: ${items.length > 0 ? items.join('、') : 'なし'}

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

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('Groq API error:', groqRes.status, errText)
      return res.status(500).json({ error: true })
    }

    const data = await groqRes.json()
    const text = data?.choices?.[0]?.message?.content
    const finishReason = data?.choices?.[0]?.finish_reason
    console.log('Groq response:', { finishReason, textLength: text?.length || 0 })
    if (!text) {
      console.error('Groq returned no text:', JSON.stringify(data).slice(0, 500))
      return res.status(500).json({ error: true })
    }

    // JSONパース（複数の方法を試行）
    let eventData = null

    // 1. 直接パース
    try { eventData = JSON.parse(text) } catch {}

    // 2. マークダウンコードブロックから抽出
    if (!eventData) {
      const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlock) {
        try { eventData = JSON.parse(codeBlock[1]) } catch {}
      }
    }

    // 3. 最外の{...}を正規表現で抽出
    if (!eventData) {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try { eventData = JSON.parse(jsonMatch[0]) } catch {}
      }
    }

    if (!eventData) {
      console.error('Failed to parse Groq response:', text.slice(0, 1000))
      return res.status(500).json({ error: true })
    }

    // バリデーション
    if (!eventData.title || !eventData.choices || !Array.isArray(eventData.choices)) {
      console.error('Invalid event data:', JSON.stringify(eventData).slice(0, 500))
      return res.status(500).json({ error: true })
    }

    return res.status(200).json(eventData)
  } catch (err) {
    console.error('ai-event error:', err.message, err.stack)
    return res.status(500).json({ error: true })
  }
}
