export interface Character {
  id: string;
  domain: string[];
  avatar: string;
  color: string;
  systemPrompt: string;
}

export interface ModelOption {
  id: string;
  name: string;
}

export type ThinkingLevel = 'off' | 'low' | 'medium' | 'high';

export interface ChatParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model: string;
  apiKey: string;
  corsProxy?: string;
  thinkingLevel?: ThinkingLevel;
  signal?: AbortSignal;
}

export interface LLMAdapter {
  id: string;
  name: string;
  models: ModelOption[];
  docsUrl?: string;
  apiKeyUrl?: string;
  validateKey(key: string, corsProxy?: string): Promise<boolean>;
  chat(params: ChatParams): AsyncGenerator<string>;
}

export interface Message {
  id: string;
  role: 'user' | 'character';
  characterId?: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  type: 'single' | 'roundtable';
  title?: string;
  characters: string[];
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  apiKeys: Record<string, string>;
  defaultProvider: string;
  defaultModel: string;
  language: string;
  theme: 'light' | 'dark';
  corsProxy: string;
  thinkingLevel: ThinkingLevel;
}
