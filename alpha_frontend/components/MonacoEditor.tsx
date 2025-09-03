'use client';
import { useMemo } from 'react';

const PY_KEYWORDS = /\b(def|return|for|while|if|else|elif|import|from|as|class|try|except|finally|with|lambda|pass|break|continue|True|False|None)\b/g;

function highlight(code: string) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(PY_KEYWORDS, '<span class="text-purple-600 font-medium">$1</span>');
}

export default function MonacoEditor({ value, onChange, height=420 }:{ value:string; onChange?:(v:string)=>void; height?:number }){
  const highlighted = useMemo(() => highlight(value), [value]);
  return (
    <div className="relative w-full" style={{minHeight: height}}>
      <textarea
        value={value}
        onChange={(e)=>onChange?.(e.target.value)}
        spellCheck={false}
        className="absolute inset-0 w-full h-full resize-none rounded-xl border border-slate-200 bg-transparent p-3 font-mono text-base leading-6 text-transparent caret-slate-900"
      />
      <pre
        aria-hidden
        className="pointer-events-none w-full h-full overflow-auto rounded-xl border border-slate-200 bg-white p-3 font-mono text-base leading-6 text-slate-900"
        dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
      />
    </div>
  );
}
