// Vercel Serverless Function: ボスセリフ生成
// POST /api/ai-boss
// Body: { bossName, bossId, triggerType: "taunt"|"angry"|"death", floor }
// Response: { dialogue: string }

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const BOSS_PERSONALITIES = {
  goblin_king: '粗暴で傲慢な蛮族の王。部下を従える力を誇示し、人間を見下す。口調は荒々しく威圧的。',
  dragon: '古代から生きる誇り高き竜。圧倒的な力を持ち、矮小な人間を哀れむ。口調は威厳があり重厚。',
  lich_king: '冷酷で知的な死霊術師の王。死と闇の力を操り、生者を嘲笑う。口調は冷たく不気味。',
}

const TRIGGER_INSTRUCTIONS = {
  taunt: '戦闘開始時の挑発セリフ。相手を威嚇し、自分の強さを誇示する内容。',
  angry: 'HP半分以下になった時の怒りのセリフ。驚きと怒り、本気を出す宣言。',
  death: '撃破された時の断末魔。悔しさ、驚き、または最後の警告。',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ dialogue: null })
  }

  try {
    const { bossName, bossId, triggerType, floor } = req.body
    const personality = BOSS_PERSONALITIES[bossId] || BOSS_PERSONALITIES.goblin_king
    const instruction = TRIGGER_INSTRUCTIONS[triggerType] || TRIGGER_INSTRUCTIONS.taunt

    const prompt = `あなたはローグライクダンジョンゲームのボスキャラクター「${bossName}」です。
ダンジョン${floor}階のボスとして登場しています。

キャラクター設定: ${personality}

${instruction}

以下の条件でセリフを1つ生成してください:
- 1〜2文の短いセリフ（テンポを崩さない）
- キャラクターの性格に合った口調
- ゲームの雰囲気に合ったファンタジー風の表現

以下のJSON形式で出力してください:
{ "dialogue": "セリフ文" }`

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 1.0,
          maxOutputTokens: 256,
        },
      }),
    })

    if (!response.ok) {
      console.error('Gemini API error:', response.status)
      return res.status(200).json({ dialogue: null })
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return res.status(200).json({ dialogue: null })
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        return res.status(200).json({ dialogue: null })
      }
    }

    return res.status(200).json({ dialogue: parsed.dialogue || null })
  } catch (err) {
    console.error('ai-boss error:', err)
    return res.status(200).json({ dialogue: null })
  }
}
