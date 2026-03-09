// Vercel Serverless Function: ボスセリフ生成
// POST /api/ai-boss
// Body: { bossName, bossId, triggerType: "taunt"|"angry"|"death", floor }
// Response: { dialogue: string }

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const BOSS_PERSONALITIES = {
  goblin_king: '粗暴で傲慢な蛮族の王。部下を従える力を誇示し、人間を見下す。口調は荒々しく威圧的。',
  dragon: '古代から生きる誇り高き竜。圧倒的な力を持ち、矮小な人間を哀れむ。口調は威厳があり重厚。',
  lich_king: '冷酷で知的な死霊術師の王。死と闇の力を操り、生者を嘲笑う。口調は冷たく不気味。',
}

const TRIGGER_INSTRUCTIONS = {
  taunt: `戦闘開始時の挑発セリフ。相手を威嚇し、自分の強さを誇示する内容。

参考例（これらをそのまま出力せず、雰囲気を参考に新しいセリフを考えること）:
- 「愚かな冒険者め…この先は貴様の墓場だ」
- 「ほう、わざわざ死にに来たか。殊勝な心がけだな」
- 「我が領域に足を踏み入れたこと、後悔させてやろう」`,

  angry: `HP半分以下になった時の怒りのセリフ。驚きと怒り、本気を出す宣言。

参考例（これらをそのまま出力せず、雰囲気を参考に新しいセリフを考えること）:
- 「小癪な…！この程度で調子に乗るなよ」
- 「面白い…ここからが本当の地獄だ」
- 「まさか、この私に血を流させるとは…許さん！」`,

  death: `撃破された時の断末魔。悔しさ、驚き、または最後の警告。

参考例（これらをそのまま出力せず、雰囲気を参考に新しいセリフを考えること）:
- 「馬鹿な…この私が…こんな人間ごときに…」
- 「覚えておけ…さらなる闇が、貴様を待っている…」
- 「ぐっ…見事だ。だが、この先はもっと恐ろしいぞ…」`,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ dialogue: null })
  }

  try {
    const { bossName, bossId, triggerType, floor } = req.body
    const personality = BOSS_PERSONALITIES[bossId] || BOSS_PERSONALITIES.goblin_king
    const instruction = TRIGGER_INSTRUCTIONS[triggerType] || TRIGGER_INSTRUCTIONS.taunt

    const systemPrompt = `あなたはローグライクダンジョンゲームのボスキャラクター「${bossName}」です。
キャラクター設定: ${personality}
自然で正しい日本語を使うこと。不自然な言い回しや慣用句の誤用は避けること。
指示に従い、必ず指定されたJSON形式のみを出力してください。`

    const userPrompt = `ダンジョン${floor}階のボスとして登場しています。

${instruction}

以下の条件でセリフを1つ生成してください:
- 1〜2文の短いセリフ（テンポを崩さない）
- キャラクターの性格に合った口調
- ゲームの雰囲気に合ったファンタジー風の表現
- 参考例とは異なる、新しいオリジナルのセリフにすること

以下のJSON形式で出力してください:
{ "dialogue": "セリフ文" }`

    const response = await fetch(GROQ_URL, {
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
        temperature: 0.8,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      console.error('Groq API error:', response.status)
      return res.status(200).json({ dialogue: null })
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      return res.status(200).json({ dialogue: null })
    }

    let parsed = null
    try { parsed = JSON.parse(text) } catch {}
    if (!parsed) {
      const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlock) { try { parsed = JSON.parse(codeBlock[1]) } catch {} }
    }
    if (!parsed) {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) { try { parsed = JSON.parse(jsonMatch[0]) } catch {} }
    }

    return res.status(200).json({ dialogue: parsed?.dialogue || null })
  } catch (err) {
    console.error('ai-boss error:', err)
    return res.status(200).json({ dialogue: null })
  }
}
