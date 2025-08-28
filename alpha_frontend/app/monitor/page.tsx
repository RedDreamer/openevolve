'use client';
import { useEffect, useState } from 'react';
// import LineChart from '@/components/LineChart';
// import Sparkline from '@/components/Sparkline';
// import { generateWorld } from '@/lib/world';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

// Demo data components commented out for now
// function IslandCard({ island, currentGen }:{ island: ReturnType<typeof generateWorld>['islands'][number]; currentGen:number }){
//   const maxSeries = useMemo(()=> island.gens.map(g=> Math.max(...g.codes.map(c=>c.score))), [island]);
//   const seriesToNow = maxSeries.slice(0, Math.min(currentGen+1, maxSeries.length));
//   const snap = island.gens[Math.min(currentGen, island.gens.length-1)];
//   const topNow = [...snap.codes].sort((a,b)=> b.score - a.score).slice(0,3);
//   return (
//     <div className="rounded-2xl border border-slate-200 bg-white p-4">
//       <div className="mb-2 flex items-center justify-between">
//         <div className="text-sm font-semibold text-slate-900">{island.id}</div>
//         <div className="text-xs text-slate-500">Max now: {Math.max(...snap.codes.map(c=>c.score)).toFixed(3)}</div>
//       </div>
//       <Sparkline data={seriesToNow} height={64} testid={`spark-${island.id}`} />
//       <div className="mt-3 space-y-1">
//         {topNow.map((cs, idx)=> (
//           <div key={idx} className="flex items-center justify-between text-xs">
//             <code className="truncate text-slate-700">{cs.code}</code>
//             <span className="ml-3 tabular-nums text-slate-600">{cs.score.toFixed(3)}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

export default function MonitorPage(){
  // const world = useMemo(()=> generateWorld({ islands: 4, generations: 60, codesPerGen: 6, seed: 2025 }), []);
  // const [gen, setGen] = useState<number>(0);
  // const [paused, setPaused] = useState<boolean>(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');

  // Get runId and outputPath from localStorage or URL
  useEffect(() => {
    const storedRunId = localStorage.getItem('currentRunId');
    const storedPath = localStorage.getItem('currentOutputPath');
    if (storedRunId) {
      setRunId(storedRunId);
    }
    if (storedPath) {
      setOutputPath(storedPath);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlRunId = urlParams.get('runId');
    const urlPath = urlParams.get('path');
    if (urlRunId) {
      setRunId(urlRunId);
      localStorage.setItem('currentRunId', urlRunId);
    }
    if (urlPath) {
      setOutputPath(urlPath);
      localStorage.setItem('currentOutputPath', urlPath);
    }
  }, []);

  // Check evolution status
  useEffect(() => {
    if (!runId) return;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/evolution-status/${runId}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error checking evolution status:', error);
        setStatus('error');
      }
    };
    
    // Check status every 2 seconds
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  // Demo data animation commented out for now
  // useEffect(()=>{
  //   if (paused) return;
  //   const id = setInterval(()=> setGen(g=> Math.min(world.generations-1, g+1)), 700);
  //   return ()=> clearInterval(id);
  // }, [paused, world.generations]);

  // const overallToNow = world.overallBest.slice(0, gen+1);

  const handleStop = async () => {
    if (!runId) return;
    
    try {
      const response = await fetch(`${API_BASE}/stop-evolution/${runId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setStatus('stopped');
        setRunId(null);
        setOutputPath(null);
        localStorage.removeItem('currentRunId');
        localStorage.removeItem('currentOutputPath');
      }
    } catch (error) {
      console.error('Error stopping evolution:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monitoring Dashboard</h1>
          <p className="text-sm text-slate-600">Track active evolution runs in real time</p>
          {runId && (
            <p className="mt-1 text-xs text-slate-500">
              Run ID: {runId} • Status: <span className="font-medium">{status}</span>
            </p>
          )}
        </div>
        {runId && outputPath && (
          <div className="flex gap-2">
            <a
              href={`/visualize?path=${encodeURIComponent(outputPath)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              Visualize
            </a>
            <button
              onClick={handleStop}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
            >
              Stop
            </button>
          </div>
        )}
      </header>

      {/* Future charts and island cards will go here */}

      {!runId && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-medium text-slate-600">No active evolution</p>
          <p className="mt-1 text-sm text-slate-500">
            Start an evolution from the Project Hub to see real-time monitoring data here.
          </p>
        </div>
      )}
    </div>
  );
}