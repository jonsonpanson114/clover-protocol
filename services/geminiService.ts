import { Message, CharacterId } from '../types';
import { sendLog } from './driveLogger';

const API_BASE_URL = '/api';

console.log('[GeminiService] API_BASE_URL:', API_BASE_URL);

export const generateResponse = async (
  history: Message[],
  currentCharId: CharacterId,
  day: number,
  userPrompt: string,
  stats?: { kindness: number; fun: number; memory: number; articulation: number; efficiency: number; streak: number }
): Promise<string> => {
  try {
    console.log('[GeminiService] Sending request to:', `${API_BASE_URL}/chat`);
    sendLog("INFO", `チャット送信: ${currentCharId} Day${day}`);

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: history.map(msg => ({
          sender: msg.sender,
          text: msg.text
        })),
        currentCharId,
        day,
        userPrompt,
        stats
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      sendLog("ERROR", `チャットエラー: ${currentCharId} Day${day}`, { error: errorData.error || response.statusText });
      return errorData.userMessage || `……通信が途絶えた。（HTTP ${response.status}）`;
    }

    const data = await response.json();
    if (!data.text) {
      throw new Error("Empty response from AI");
    }

    sendLog("INFO", `チャット成功: ${currentCharId} Day${day}`);
    return data.text;

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    sendLog("ERROR", `チャットエラー: ${currentCharId} Day${day}`, { error: error.message });
    const errorMessage = error.message || JSON.stringify(error) || "Unknown Error";

    if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
      return `……通信が途絶えた。ネットワーク接続を確認してください。（${errorMessage}）`;
    }

    return `……通信が途絶えた。原因はこれだ：${errorMessage}。（システムエラー: 再試行してください）`;
  }
};
