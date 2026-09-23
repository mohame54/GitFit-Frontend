import type { ChatMessage, ChatPersistedState } from '@/types/api';

const STORAGE_KEY = 'getfit_chat_state';

const EMPTY_STATE: ChatPersistedState = {
  sessionId: null,
  messages: [],
};

export function loadChatState(): ChatPersistedState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...EMPTY_STATE };
    const parsed = JSON.parse(saved) as Partial<ChatPersistedState>;
    return {
      sessionId:
        typeof parsed.sessionId === 'string' ? parsed.sessionId : null,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export function saveChatState(state: ChatPersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearChatHistory() {
  localStorage.removeItem(STORAGE_KEY);
  // Also clear legacy key from the old transcript design.
  localStorage.removeItem('getfit_chat_history');
}

export function seedChatSession(sessionId: string, messages: ChatMessage[]) {
  saveChatState({ sessionId, messages });
}
