import { useEffect, useRef, useState } from 'react';
import { query, Message } from '../models/aiQuery.ts';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import Input from './ui/Input';
import Spinner from './ui/Spinner';

// example questions shown before the first message
const SUGGESTIONS = [
  'How many leads toured this week?',
  'Show me all approved applications',
  'Which leads need follow-up?',
];

// Leasing CRM assistant
export default function ChatAssistant() {

  // tracking open state
  const [isOpen, setIsOpen] = useState(false);
  // message thread
  const [messages, setMessages] = useState<Message[]>([]);
  // input for user
  const [input, setInput] = useState('');
  // for loading state
  const [loading, setLoading] = useState(false);

  // focus targets and scroll area
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // focus the input on open, hand focus back to the launcher on close
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else if (wasOpen.current) {
      launcherRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  // keep the newest message in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const question = input;
    const userMessage: Message = { role: 'user', content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const answer = await query(question, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <IconButton
          ref={launcherRef}
          variant="primary"
          label="Open leasing assistant"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-floating !h-14 !w-14 !rounded-full shadow-raised"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </IconButton>
      )}

      {/* Chat Panel (non-modal: no focus trap) */}
      {isOpen && (
        <section
          role="dialog"
          aria-label="Leasing assistant"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          className="fixed bottom-6 right-6 z-floating flex w-[calc(100vw-3rem)] sm:w-96 h-[min(600px,calc(100vh-3rem))] flex-col rounded-card border border-line bg-surface shadow-overlay motion-safe:animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-label text-fg">Leasing assistant</h2>
              <p className="text-caption text-fg-muted">Ask about your leads</p>
            </div>
            <IconButton label="Close assistant" size="sm" onClick={() => setIsOpen(false)}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
                className="h-4 w-4"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </IconButton>
          </div>

          {/* Messages */}
          <div ref={scrollRef} aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-body text-fg-muted">Hi! I can help you query your leads.</p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      className="!h-auto py-1.5 text-left !justify-start"
                      onClick={() => handleSuggestion(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`w-fit max-w-[80%] rounded-card px-3 py-2 text-body whitespace-pre-wrap break-words ${msg.role === 'user'
                      ? 'ml-auto rounded-br-sm bg-brand text-fg-inverse'
                      : 'mr-auto rounded-bl-sm bg-surface-muted text-fg'
                    }`}
                >
                  {msg.content}
                </div>
              ))
            )}
            {loading && (
              <div className="mr-auto w-fit max-w-[80%] rounded-card rounded-bl-sm bg-surface-muted px-3 py-2 text-body text-fg">
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" aria-hidden="true" />
                  Thinking…
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 border-t border-line p-3"
          >
            <Input
              ref={inputRef}
              aria-label="Message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your leads..."
              autoComplete="off"
              className="min-w-0 flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              Send
            </Button>
          </form>
        </section>
      )}
    </>
  );
}
