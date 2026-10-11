import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Bot, Maximize2, Minimize2, Minus, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useI18n } from '@/i18n';
import { chatService } from '@/services/api/platform';
import { errorMessage } from '@/services/http/errors';
import type { ChatMessage } from '@/types/platform';
import { cn } from '@/lib/utils';
import { STORAGE_KEYS } from '@/constants/storage';

const HISTORY_KEY = STORAGE_KEYS.chatHistory;
const SEEN_KEY = STORAGE_KEYS.chatGreeted;

const SUGGESTIONS: Record<ChatContext, string[]> = {
  public: ['¿Qué es un e-CF?', '¿Qué módulos ofrece LX e-CF?', '¿Cómo empiezo?'],
  tenant: ['¿Cómo emito una nota de crédito?', '¿Qué significa "Aceptado condicional"?', '¿Cómo cargo mi certificado?'],
  developer: ['¿Cómo me autentico en la API?', '¿Qué es la clave de idempotencia?', '¿Cómo consulto un trackId?'],
  admin: ['¿Cómo suspendo una suscripción?', '¿Dónde veo la auditoría?'],
};

type ChatContext = 'public' | 'tenant' | 'developer' | 'admin';

function loadHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function ChatWidget({ context }: { context: ChatContext }) {
  if (!chatService.available) return null;
  return <ConnectedChatWidget context={context} />;
}

function ConnectedChatWidget({ context }: { context: ChatContext }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const show = window.setTimeout(() => setTeaser(true), 2500);
    const hide = window.setTimeout(() => setTeaser(false), 11000);
    sessionStorage.setItem(SEEN_KEY, '1');
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages, pending, open, reduce]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || pending) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content, createdAt: new Date().toISOString() };
    const history = [...messages.filter((m) => !m.error), userMsg];
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setPending(true);
    abortRef.current = new AbortController();
    try {
      const reply = await chatService.send(history.slice(-12), abortRef.current.signal);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: reply, createdAt: new Date().toISOString() }]);
    } catch (err) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: errorMessage(err), createdAt: new Date().toISOString(), error: true }]);
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label={t('chat.title')}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex origin-bottom-right flex-col overflow-hidden rounded-2xl border bg-card shadow-elevated',
              expanded
                ? 'fixed inset-2 sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(760px,calc(100vh-8rem))] sm:w-[640px]'
                : 'fixed inset-2 sm:static sm:h-[560px] sm:w-[380px]',
            )}
          >
            <header className="flex items-center gap-3 border-b bg-ink px-4 py-3 text-white">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink bg-emerald-400" title="Asistente conectado" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t('chat.title')}</p>
                <p className="text-xs text-zinc-400">{chatService.available ? 'En línea' : 'Vista previa · IA no conectada'}</p>
              </div>
              <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
              {messages.length > 0 && (
                <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setMessages([])} aria-label="Nueva conversación">
                  <RotateCcw />
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Reducir' : 'Expandir'}>
                {expanded ? <Minimize2 /> : <Maximize2 />}
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)} aria-label="Minimizar">
                <Minus />
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white" onClick={() => { abortRef.current?.abort(); setOpen(false); setExpanded(false); }} aria-label="Cerrar">
                <X />
              </Button>
            </header>

            <div ref={listRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
              <Bubble role="assistant" content={t('chat.welcome')} />
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pl-10">
                  {SUGGESTIONS[context].map((s) => (
                    <button key={s} onClick={() => void send(s)} className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-brand hover:text-brand">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m) => (
                <Bubble key={m.id} role={m.role} content={m.content} error={m.error} />
              ))}
              {pending && (
                <div className="flex items-center gap-2 pl-10" aria-label="El asistente está escribiendo">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-2 w-2 rounded-full bg-muted-foreground/60" animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="border-t p-3">
              <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder={t('chat.placeholder')}
                  rows={1}
                  maxLength={2000}
                  className="max-h-32 min-h-[40px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                  aria-label={t('chat.placeholder')}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || pending} aria-label="Enviar">
                  <Send />
                </Button>
              </div>
              <p className="mt-2 px-1 text-[11px] leading-snug text-muted-foreground">{t('chat.disclaimer')}</p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && teaser && (
          <motion.button
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setTeaser(false); setOpen(true); }}
            className="max-w-[260px] rounded-2xl rounded-br-sm border bg-card p-3 text-left text-sm shadow-elevated"
          >
            <span className="mb-1 flex items-center gap-1.5 font-semibold"><Sparkles className="h-4 w-4 text-brand" /> {t('chat.title')}</span>
            <span className="text-muted-foreground">¿Tienes preguntas sobre facturación electrónica? Estoy aquí para orientarte.</span>
          </motion.button>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          onClick={() => { setTeaser(false); setOpen(true); }}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-elevated focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
          aria-label={`Abrir ${t('chat.title')}`}
        >
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand" aria-hidden />
          <Bot className="relative h-6 w-6" />
        </motion.button>
      )}
    </div>
  );
}

function Bubble({ role, content, error }: { role: ChatMessage['role']; content: string; error?: boolean }) {
  const mine = role === 'user';
  return (
    <div className={cn('flex gap-2', mine && 'justify-end')}>
      {!mine && (
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', error ? 'bg-danger-soft text-destructive' : 'bg-brand-soft text-brand')}>
          {error ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </span>
      )}
      <p
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          mine ? 'rounded-br-sm bg-foreground text-background' : error ? 'rounded-tl-sm border border-destructive/30 bg-danger-soft text-foreground' : 'rounded-tl-sm bg-muted text-foreground',
        )}
      >
        {content}
      </p>
    </div>
  );
}
