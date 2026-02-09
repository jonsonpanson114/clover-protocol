import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, CharacterId } from '../types';
import { getCharacterInstruction } from '../constants';
import { sendLog } from './driveLogger';

// Initialize Gemini Client
const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).VITE_GEMINI_API_KEY || "";
  return new GoogleGenerativeAI(String(apiKey));
};

export const generateResponse = async (
  history: Message[],
  currentCharId: CharacterId,
  day: number,
  userPrompt: string
): Promise<string> => {
  // Adaptation to Gemini 2.5 Flash as explicitly requested
  const modelId = "gemini-2.5-flash";
  try {
    const genAI = getClient();

    // Use gemini-2.0-flash as it's the most likely 'latest' model the user refers to
    console.log(`[GeminiService] Attempting access with: ${modelId}`);
    sendLog("INFO", `チャット送信: ${currentCharId} Day${day}`, { model: modelId });

    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: getCharacterInstruction(currentCharId, day)
    });

    // Defensive check: If the last message history matches userPrompt, remove it from history passed to API
    // This handles race conditions where the prompt might be double-added
    let cleanHistory = history;
    if (history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.sender === 'user' && lastMsg.text === userPrompt) {
        console.log("Found duplicate last message in history, removing for API call");
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

    if (!text) throw new Error("Empty response from AI");
    sendLog("INFO", `チャット成功: ${currentCharId} Day${day}`);
    return text;

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    sendLog("ERROR", `チャットエラー: ${currentCharId} Day${day}`, { error: error.message });
    const errorMessage = error.message || JSON.stringify(error) || "Unknown Error";

    if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded")) {
      return `……通信が制限されている。どうやらこちらの「出力」が限界を超えたらしいな。
[DEBUG] Quota Exceeded (429). 
時間を置くか、別のポート（APIキー）を試すしかなさそうだ。陣内なら「今日はもう閉店だ」って言うところだろうよ。`;
    }

    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      return `……通信が途絶えた。
[DEBUG] Model Selection Failure (${modelId}). 
どうやら「今の型」が古いか、存在しないらしい。
システムエラー詳細: ${errorMessage}`;
    }

    return `……通信が途絶えた。原因はこれだ：${errorMessage}。（システムエラー: 再試行してください）`;
  }
};