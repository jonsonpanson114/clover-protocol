import { GoogleGenerativeAI } from "@google/generative-ai";

// CharacterId enum
const CharacterId = {
  JACK: 'jack',
  HAL: 'hal',
  SAKI: 'saki',
  REN: 'ren',
  OPERATOR: 'operator',
  HIDDEN: 'hidden'
};

// Character instructions (simplified for serverless function)
const CHARACTER_INSTRUCTIONS = {
  jack: (day, stats) => `あなたはジャック。陣内孝正の小説『グラスホッパー』に登場する主人公。
現在はDay ${day}。ユーザーのステータス: ${JSON.stringify(stats)}`,
  hal: (day, stats) => `あなたはハル。陣内孝正の小説に登場する天才プログラマー。
現在はDay ${day}。ユーザーのステータス: ${JSON.stringify(stats)}`,
  saki: (day, stats) => `あなたはサキ。陣内孝正の小説に登場する女子高生。
現在はDay ${day}。ユーザーのステータス: ${JSON.stringify(stats)}`,
  ren: (day, stats) => `あなたはレン。陣内孝正の小説に登場する青年。
現在はDay ${day}。ユーザーのステータス: ${JSON.stringify(stats)}`,
  operator: (day, stats) => `あなたはオペレーター。人生を最適化するシステム管理者。
現在はDay ${day}。ユーザーのステータス: ${JSON.stringify(stats)}`,
  hidden: (day, stats) => `あなたは？？？。
現在はDay ${day}。ユーザーのステータス: ${JSON.stringify(stats)}`
};

const getCharacterInstruction = (charId, day, stats) => {
  const instructionFn = CHARACTER_INSTRUCTIONS[charId];
  return instructionFn ? instructionFn(day, stats) : `あなたはキャラクター。現在はDay ${day}`;
};

// Placeholder for logging (not needed in serverless function)
const sendLog = () => {};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { history, currentCharId, day, userPrompt, stats } = req.body;

    // Get API key from environment variable (server-side only)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const modelId = "gemini-2.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: getCharacterInstruction(currentCharId, day, stats)
    });

    // Defensive check: Remove duplicate last message
    let cleanHistory = history;
    if (history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.sender === 'user' && lastMsg.text === userPrompt) {
        cleanHistory = history.slice(0, -1);
      }
    }

    const chat = model.startChat({
      history: cleanHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      generationConfig: {
        temperature: 0.9,
      }
    });

    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    sendLog("INFO", `チャット成功: ${currentCharId} Day${day}`, { model: modelId });
    return res.status(200).json({ text });

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    const errorMessage = error.message || JSON.stringify(error) || "Unknown Error";

    let userMessage = `……通信が途絶えた。原因はこれだ：${errorMessage}。（システムエラー: 再試行してください）`;

    if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded")) {
      userMessage = `……通信が制限されている。どうやらこちらの「出力」が限界を超えたらしいな。
[DEBUG] Quota Exceeded (429).
時間を置くか、別のポート（APIキー）を試すしかなさそうだ。陣内なら「今日はもう閉店だ」って言うところだろうよ。`;
    }

    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      userMessage = `……通信が途絶えた。
[DEBUG] Model Selection Failure (gemini-2.5-flash).
どうやら「今の型」が古いか、存在しないらしい。
システムエラー詳細: ${errorMessage}`;
    }

    return res.status(500).json({ error: errorMessage, userMessage });
  }
}
