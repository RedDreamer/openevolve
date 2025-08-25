export default function ComparePage(){
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-semibold text-slate-900">Algorithm Comparison</h1>
      <p className="text-sm text-slate-500">Select two algorithms to compare. (Demo stub)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Left</div><pre className="text-xs text-slate-700">def bubble_sort(...)</pre></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Right</div><pre className="text-xs text-slate-700">def better_sort(...)</pre></div>
      </div>
    </div>
  );
}