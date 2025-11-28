import { GoogleGenAI, Type } from "@google/genai";

// Helper to safely get the API Key and Base URL from Env or LocalStorage
const getClientConfig = () => {
  // 1. Try LocalStorage (User Settings)
  const localKey = localStorage.getItem('gv_api_key');
  const localBaseUrl = localStorage.getItem('gv_base_url');

  // 2. Try Env Vars
  let envKey = '';
  let envBaseUrl = '';
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      envKey = import.meta.env.VITE_GAME_VAULT_API_KEY;
      // @ts-ignore
      envBaseUrl = import.meta.env.VITE_GOOGLE_API_BASE_URL;
    }
  } catch (e) {}

  if (!envKey) {
    try {
      envKey = process.env.API_KEY || '';
      envBaseUrl = process.env.GOOGLE_API_BASE_URL || '';
    } catch (e) {}
  }

  const finalKey = localKey || envKey;
  const finalBaseUrl = localBaseUrl || envBaseUrl;

  return { apiKey: finalKey, baseUrl: finalBaseUrl };
};

// We create a function to get the client instead of a static instance
// This ensures we pick up changes from localStorage if the user updates settings
const getAIClient = () => {
  const { apiKey, baseUrl } = getClientConfig();
  
  if (!apiKey) {
    console.warn("API Key is missing! Please set via Settings or Environment Variables.");
  }

  const clientOptions: any = { apiKey: apiKey || 'dummy_key' };
  if (baseUrl) {
    clientOptions.baseUrl = baseUrl;
  }
  return new GoogleGenAI(clientOptions);
};

export interface GameMetadata {
  title: string;
  releaseYear: string;
  genres: string[];
  platforms: string[];
  description: string;
}

export const fetchGameMetadata = async (query: string): Promise<GameMetadata> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `你是一个专业的中文游戏资料库助手。请检索游戏 "${query}" 的详细元数据。
      
      请模拟从权威中文游戏网站（如豆瓣游戏、游民星空、Bangumi、Steam国区）获取数据。
      
      要求：
      1. title: 返回最通用的官方简体中文译名（如果不存在中文名，则用英文原名）。
      2. releaseYear: 游戏的*首发*年份 (YYYY)。
      3. genres: 2-3 个核心游戏类型，必须使用简体中文标准术语（如：动作、角色扮演、肉鸽、模拟经营）。
      4. platforms: 游戏登录的所有主要平台。
      5. description: 50-80字的精炼中文简介，像百科词条一样客观。
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Official Simplified Chinese Title" },
            releaseYear: { type: Type.STRING, description: "Initial Release Year (YYYY)" },
            genres: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Primary genres in Simplified Chinese"
            },
            platforms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of platforms (e.g., PC, Switch, PS5)"
            },
            description: { type: Type.STRING, description: "Concise summary in Simplified Chinese" }
          },
          required: ["title", "releaseYear", "genres", "platforms", "description"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");
    
    // Clean up potential markdown code blocks if AI ignores mimeType in rare cases
    const cleanedText = text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanedText) as GameMetadata;
  } catch (error) {
    console.error("AI Fetch Error:", error);
    throw error;
  }
};

export const generateGameCover = async (title: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Create a vertical, high-quality, cinematic video game cover art for the game "${title}". The style should be digital art, suitable for a game box. No text overlay.` }
        ]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("AI Image Gen Error:", error);
    throw error;
  }
};
