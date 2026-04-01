import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '../utils/persistStorage';
import { nanoid } from 'nanoid';
import type { Conversation, Message } from '../types';

interface ConversationState {
  conversations: Conversation[];
  createConversation: (type: 'single' | 'roundtable', characters: string[], title?: string) => string;
  addMessage: (
    conversationId: string,
    role: 'user' | 'character',
    content: string,
    characterId: string | undefined,
  ) => string;
  updateMessageContent: (conversationId: string, messageId: string, content: string) => void;
  deleteConversation: (id: string) => void;
  getConversation: (id: string) => Conversation | undefined;
  renameConversation: (id: string, title: string) => void;
  updateCharacters: (id: string, characters: string[]) => void;
  removeMessagesFrom: (conversationId: string, messageId: string) => void;
  branchConversation: (conversationId: string, fromMessageId: string) => string;
  importConversations: (conversations: Conversation[]) => number;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],

      createConversation: (type, characters, title?) => {
        const id = nanoid();
        const now = Date.now();
        const conv: Conversation = {
          id,
          type,
          characters,
          messages: [],
          createdAt: now,
          updatedAt: now,
          ...(title && { title }),
        };
        set((s) => ({ conversations: [conv, ...s.conversations] }));
        return id;
      },

      addMessage: (conversationId, role, content, characterId) => {
        const msgId = nanoid();
        const message: Message = {
          id: msgId,
          role,
          content,
          timestamp: Date.now(),
          ...(characterId && { characterId }),
        };
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const updated: Conversation = {
              ...c,
              messages: [...c.messages, message],
              updatedAt: Date.now(),
            };
            if (!c.title && role === 'user' && content) {
              updated.title = content.slice(0, 29);
            }
            return updated;
          }),
        }));
        return msgId;
      },

      updateMessageContent: (conversationId, messageId, content) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }));
      },

      deleteConversation: (id) => {
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
        }));
      },

      getConversation: (id) => {
        return get().conversations.find((c) => c.id === id);
      },

      renameConversation: (id, title) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
          ),
        }));
      },

      removeMessagesFrom: (conversationId, messageId) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const idx = c.messages.findIndex((m) => m.id === messageId);
            if (idx === -1) return c;
            return { ...c, messages: c.messages.slice(0, idx), updatedAt: Date.now() };
          }),
        }));
      },

      updateCharacters: (id, characters) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id
              ? {
                  ...c,
                  characters,
                  type: characters.length > 1 ? 'roundtable' : 'single',
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }));
      },

      branchConversation: (conversationId, fromMessageId) => {
        const source = get().conversations.find((c) => c.id === conversationId);
        if (!source) return '';
        const msgIdx = source.messages.findIndex((m) => m.id === fromMessageId);
        if (msgIdx === -1) return '';
        const newId = nanoid();
        const now = Date.now();
        const branchedMessages = source.messages.slice(0, msgIdx + 1).map((m) => ({
          ...m,
          id: nanoid(),
          timestamp: m.timestamp,
        }));
        const conv: Conversation = {
          id: newId,
          type: source.type,
          characters: [...source.characters],
          messages: branchedMessages,
          title: (source.title || '') + ' (branch)',
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ conversations: [conv, ...s.conversations] }));
        return newId;
      },
      importConversations: (imported) => {
        const existing = get().conversations;
        const existingIds = new Set(existing.map((c) => c.id));
        const newConvs = imported.filter((c) => !existingIds.has(c.id));
        if (newConvs.length > 0) {
          set({ conversations: [...newConvs, ...existing] });
        }
        return newConvs.length;
      },
    }),
    { name: 'legend-talk-conversations', storage: createJSONStorage(() => persistStorage) },
  ),
);
