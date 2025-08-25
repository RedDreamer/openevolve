'use client';
import { useEffect, useMemo, useState } from 'react';
import LineChart from '@/components/LineChart';
import Sparkline from '@/components/Sparkline';
import { generateWorld } from '@/lib/world';

function IslandCard({ island, currentGen }:{ island: ReturnType<typeof generateWorld>['islands'][number]; currentGen:number }){
  const maxSeries = useMemo(()=> island.gens.map(g=> Math.max(...g.codes.map(c=>c.score))), [island]);
  const seriesToNow = maxSeries.slice(0, Math.min(currentGen+1, maxSeries.length));
  const snap = island.gens[Math.min(currentGen, island.gens.length-1)];
  const topNow = [...snap.codes].sort((a,b)=> b.score - a.score).slice(0,3);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{island.id}</div>
        <div className="text-xs text-slate-500">Max now: {Math.max(...snap.codes.map(c=>c.score)).toFixed(3)}</div>
      </div>
      <Sparkline data={seriesToNow} height={64} testid={`spark-${island.id}`} />
      <div className="mt-3 space-y-1">
        {topNow.map((cs, idx)=> (
          <div key={idx} className="flex items-center justify-between text-xs">
            <code className="truncate text-slate-700">{cs.code}</code>
            <span className="ml-3 tabular-nums text-slate-600">{cs.score.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MonitorPage(){
  const world = useMemo(()=> generateWorld({ islands: 4, generations: 60, codesPerGen: 6, seed: 2025 }), []);
  const [gen, setGen] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);

  useEffect(()=>{
    if (paused) return; const id = setInterval(()=> setGen(g=> Math.min(world.generations-1, g+1)), 700); return ()=> clearInterval(id);
  }, [paused, world.generations]);

  const overallToNow = world.overallBest.slice(0, gen+1);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Monitoring Dashboard</h1>
          <p className="text-sm text-slate-500">Overall performance and island states</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">Gen <span className="font-semibold">{gen}</span> / {world.generations-1}</div>
          <button onClick={()=> setPaused(p=>!p)} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-violet-700">{paused?'Resume':'Pause'}</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-medium text-slate-900">Overall Best Fitness</div>
        <LineChart data={overallToNow} height={220} testid="chart-overall" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {world.islands.map((isl)=> (
          <IslandCard key={isl.id} island={isl} currentGen={gen} />
        ))}
      </div>

      <p className="text-xs text-slate-500">Demo data only. In a real app, stream updates via SSE/WebSocket and recompute series incrementally.</p>
    </div>
  );
}