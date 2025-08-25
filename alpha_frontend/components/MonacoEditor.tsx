'use client';
export default function MonacoEditor({ value, onChange, height=420 }:{ value:string; onChange?:(v:string)=>void; height?:number }){
  return (
    <textarea
      value={value}
      onChange={(e)=>onChange?.(e.target.value)}
      spellCheck={false}
      style={{height}}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-sm leading-6 text-slate-900"
    />
  );
}