import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { refreshProfileQueries } from '@/hooks/useApi';
import {
  clearChatHistory,
  loadChatState,
  saveChatState,
} from '@/store/chatStore';
import type { ChatMessage, ChatRequest, ChatResponse } from '@/types/api';

/** Exact first onboarding turn — no sessionId yet; user via the Supabase JWT. */
export const ONBOARDING_MESSAGE =
  "I'm new, help me set up my food preferences";

/** The automatic opener is sent to the agent, but it is not a user-typed bubble. */
function withoutOnboardingPrompt(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (message) =>
      message.role !== 'user' || message.content.trim() !== ONBOARDING_MESSAGE,
  );
}

/**
 * Chat protocol: send only the latest { message, sessionId? }.
 * Identity is the Supabase access token (Authorization: Bearer). Backend owns the transcript.
 * Local messages are UI-only bubbles.
 */
export function useChat() {
  const { profileId } = useAuth();
  const queryClient = useQueryClient();
  const initial = loadChatState();
  const [sessionId, setSessionId] = useState<string | null>(initial.sessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    withoutOnboardingPrompt(initial.messages),
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveChatState({ sessionId, messages: withoutOnboardingPrompt(messages) });
  }, [sessionId, messages]);

  const postChat = useCallback(
    async (message: string, currentSessionId: string | null) => {
      if (!profileId) throw new Error('Missing profile id');

      const body: ChatRequest = {
        message,
        ...(currentSessionId ? { sessionId: currentSessionId } : {}),
      };

      return api<ChatResponse>('/api/agent/chat', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    [profileId],
  );

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!profileId || !userText.trim()) return;

      const message = userText.trim();
      setError(null);
      setSending(true);

      const previous = messages;
      setMessages([...previous, { role: 'user', content: message }]);

      try {
        const response = await postChat(message, sessionId);
        setSessionId(response.sessionId);
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: response.text },
        ]);
        refreshProfileQueries(queryClient, profileId);
      } catch (err) {
        setMessages(previous);
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setSending(false);
      }
    },
    [messages, postChat, profileId, queryClient, sessionId],
  );

  /** First onboarding turn: message only, no sessionId. Persist returned sessionId. */
  const startOnboardingSession = useCallback(async () => {
    if (!profileId) throw new Error('Missing profile id');

    setError(null);
    setSending(true);
    setSessionId(null);
    setMessages([]);

    try {
      const response = await postChat(ONBOARDING_MESSAGE, null);
      const nextMessages: ChatMessage[] = [
        { role: 'assistant', content: response.text },
      ];

      setSessionId(response.sessionId);
      setMessages(nextMessages);
      refreshProfileQueries(queryClient, profileId);
      saveChatState({
        sessionId: response.sessionId,
        messages: nextMessages,
      });

      return response;
    } catch (err) {
      setMessages([]);
      setSessionId(null);
      saveChatState({ sessionId: null, messages: [] });
      throw err;
    } finally {
      setSending(false);
    }
  }, [postChat, profileId, queryClient]);

  const clear = useCallback(() => {
    clearChatHistory();
    setSessionId(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    sending,
    error,
    sendMessage,
    startOnboardingSession,
    clear,
  };
}
