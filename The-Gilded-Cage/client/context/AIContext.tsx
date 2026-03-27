import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AIProvider = "ollama" | "lmstudio" | "openai" | "custom";

export interface AISettings {
  provider: AIProvider;
  endpoint: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

interface AIContextType {
  aiSettings: AISettings;
  updateAISettings: (settings: Partial<AISettings>) => void;
  generateResponse: (
    characterName: string,
    characterPersonality: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[],
    userMessage: string
  ) => Promise<string>;
  isLoading: boolean;
}

const defaultAISettings: AISettings = {
  provider: "ollama",
  endpoint: "http://localhost:11434",
  apiKey: "",
  model: "llama2",
  enabled: false,
};

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [aiSettings, setAISettings] = useState<AISettings>(defaultAISettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem("aiSettings");
      if (saved) {
        setAISettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load AI settings:", error);
    }
  };

  const updateAISettings = async (settings: Partial<AISettings>) => {
    const updated = { ...aiSettings, ...settings };
    setAISettings(updated);
    try {
      await AsyncStorage.setItem("aiSettings", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save AI settings:", error);
    }
  };

  const generateResponse = async (
    characterName: string,
    characterPersonality: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[],
    userMessage: string
  ): Promise<string> => {
    if (!aiSettings.enabled) {
      return getDefaultResponse(characterName);
    }

    setIsLoading(true);

    const systemPrompt = `You are ${characterName}, a character in a fantasy tavern RPG. ${characterPersonality}

Important rules:
- Stay in character at all times
- Respond naturally as ${characterName} would
- Keep responses concise (2-4 sentences)
- Be engaging and hint at the mystery of the tavern
- Never break character or acknowledge being an AI`;

    try {
      let response: string;

      switch (aiSettings.provider) {
        case "ollama":
          response = await callOllama(systemPrompt, conversationHistory, userMessage);
          break;
        case "lmstudio":
          response = await callLMStudio(systemPrompt, conversationHistory, userMessage);
          break;
        case "openai":
          response = await callOpenAI(systemPrompt, conversationHistory, userMessage);
          break;
        case "custom":
          response = await callCustomEndpoint(systemPrompt, conversationHistory, userMessage);
          break;
        default:
          response = getDefaultResponse(characterName);
      }

      return response;
    } catch (error) {
      console.error("AI generation error:", error);
      return getDefaultResponse(characterName);
    } finally {
      setIsLoading(false);
    }
  };

  const callOllama = async (
    systemPrompt: string,
    history: { role: string; content: string }[],
    userMessage: string
  ): Promise<string> => {
    const response = await fetch(`${aiSettings.endpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: aiSettings.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    const data = await response.json();
    return data.message?.content || getDefaultResponse("character");
  };

  const callLMStudio = async (
    systemPrompt: string,
    history: { role: string; content: string }[],
    userMessage: string
  ): Promise<string> => {
    const response = await fetch(`${aiSettings.endpoint}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: aiSettings.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || getDefaultResponse("character");
  };

  const callOpenAI = async (
    systemPrompt: string,
    history: { role: string; content: string }[],
    userMessage: string
  ): Promise<string> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiSettings.apiKey}`,
      },
      body: JSON.stringify({
        model: aiSettings.model || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || getDefaultResponse("character");
  };

  const callCustomEndpoint = async (
    systemPrompt: string,
    history: { role: string; content: string }[],
    userMessage: string
  ): Promise<string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (aiSettings.apiKey) {
      headers["Authorization"] = `Bearer ${aiSettings.apiKey}`;
    }

    const response = await fetch(`${aiSettings.endpoint}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: aiSettings.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || getDefaultResponse("character");
  };

  const getDefaultResponse = (characterName: string): string => {
    const responses = [
      `*${characterName} looks at you thoughtfully* There's much I could tell you, if you help me first...`,
      `*${characterName} sighs* This place holds many secrets. Perhaps in time, I'll share mine.`,
      `*${characterName} glances around nervously* We shouldn't talk here. The walls have ears.`,
      `*${characterName} manages a small smile* Your kindness is rare in this place. Thank you for speaking with me.`,
      `*${characterName} lowers their voice* Be careful who you trust here. Not everyone is as they seem.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <AIContext.Provider value={{ aiSettings, updateAISettings, generateResponse, isLoading }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
}
