import { Fragment } from 'react';
import { CopyButton } from './CopyButton';
import { cn } from '@/lib/utils';

type Lang = 'bash' | 'json' | 'javascript' | 'java' | 'http';

const TOKEN_RE = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|#.*$|\b\d+(?:\.\d+)?\b|\b(?:const|let|await|async|return|new|import|from|public|class|void|true|false|null|curl|POST|GET|PUT|DELETE|String|var|function)\b)/gm;

function tokenClass(token: string): string {
  if (token.startsWith('//') || token.startsWith('#')) return 'text-zinc-500 italic';
  if (token.startsWith('"') || token.startsWith("'")) return 'text-emerald-300';
  if (/^\d/.test(token)) return 'text-amber-300';
  return 'text-sky-300';
}

/** Resaltado ligero sin dependencias. Escapa todo por ser texto React (sin innerHTML). */
function highlight(code: string) {
  return code.split('\n').map((line, li) => {
    const parts: { text: string; cls?: string }[] = [];
    let last = 0;
    for (const m of line.matchAll(TOKEN_RE)) {
      const idx = m.index ?? 0;
      if (idx > last) parts.push({ text: line.slice(last, idx) });
      parts.push({ text: m[0], cls: tokenClass(m[0]) });
      last = idx + m[0].length;
    }
    if (last < line.length) parts.push({ text: line.slice(last) });
    return (
      <Fragment key={li}>
        {parts.map((p, pi) => (p.cls ? <span key={pi} className={p.cls}>{p.text}</span> : <Fragment key={pi}>{p.text}</Fragment>))}
        {'\n'}
      </Fragment>
    );
  });
}

export function CodeBlock({ code, lang = 'json', title, className }: { code: string; lang?: Lang; title?: string; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-zinc-800 bg-[#0f0f10] text-zinc-100 shadow-card', className)}>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          </span>
          <span className="text-xs text-zinc-400">{title ?? lang.toUpperCase()}</span>
        </div>
        <CopyButton value={code} label="Copiar código" className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" />
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  );
}
