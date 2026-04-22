import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

// Dependency-free code block with a minimal TypeScript syntax highlighter.
// Keyword / string / comment / number classes — just enough to look alive.

const KEYWORDS = new Set([
  'const','let','var','function','await','async','return','if','else','import','from','export',
  'new','class','interface','type','extends','implements','true','false','null','undefined',
  'as','for','while','try','catch','throw','void','public','private','this',
])

function highlight(code: string): string {
  // Escape HTML first
  let out = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Block comments, line comments, strings, numbers
  out = out.replace(/\/\*[\s\S]*?\*\//g, m => `<span class="tok-c">${m}</span>`)
  out = out.replace(/(\/\/[^\n]*)/g,     (_, m) => `<span class="tok-c">${m}</span>`)
  out = out.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, m => `<span class="tok-s">${m}</span>`)
  out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-n">$1</span>')

  // Keywords: only in "raw" text nodes — text between HTML tags but not inside an existing span.
  // Split on tag boundaries so we never mutate span attributes (which contain "class", "null" etc.)
  const parts = out.split(/(<[^>]*>)/g)
  let depth = 0
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (p.startsWith('<')) {
      depth += p.startsWith('</') ? -1 : 1
    } else if (depth === 0) {
      parts[i] = p.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (_m, word) =>
        KEYWORDS.has(word) ? `<span class="tok-k">${word}</span>` : word
      )
    }
  }
  return parts.join('')
}

export default function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border border-void-800 bg-void-950/80 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-void-800 bg-void-900/60">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-trust-500/70" />
        </div>
        <span className="text-xs font-mono text-slate-500 ml-2">{label ?? 'example.ts'}</span>
        <button onClick={copy} className="ml-auto text-slate-500 hover:text-trust-400 transition-colors">
          {copied
            ? <Check className="w-3.5 h-3.5 text-trust-400" />
            : <Copy  className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto"
           style={{ tabSize: 2 }}>
        <code
          className="text-slate-300 [&_.tok-k]:text-violet-300 [&_.tok-s]:text-trust-300 [&_.tok-c]:text-slate-500 [&_.tok-n]:text-amber-300"
          dangerouslySetInnerHTML={{ __html: highlight(code.trim()) }}
        />
      </pre>
    </div>
  )
}
