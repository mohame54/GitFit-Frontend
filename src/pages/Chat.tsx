import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { ChatMessageBubble } from '@/components/ChatMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorBox } from '@/components/ui/Feedback';
import { useChat } from '@/hooks/useChat';

export function ChatPage() {
  const { messages, sending, error, sendMessage, clear } = useChat();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setText('');
    await sendMessage(value);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-lg flex-col px-4 pt-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recommendation chat</h1>
          <p className="text-xs text-slate-500">
            Latest message + sessionId each turn · X-User-Id header
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clear}
          aria-label="Clear chat"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            Ask for meal ideas, recipe tweaks, or preference setup.
          </p>
        ) : null}
        {messages.map((m, i) => (
          <ChatMessageBubble
            key={`${m.role}-${i}-${m.content.slice(0, 24)}`}
            role={m.role}
            content={m.content}
          />
        ))}
        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2 text-sm text-slate-500">
              Thinking…
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <div className="mt-2">
          <ErrorBox message={error} />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-3 flex gap-2 pb-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What should I eat tonight?"
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !text.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
