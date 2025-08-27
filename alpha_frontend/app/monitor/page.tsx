'use client';
import { useEffect, useMemo, useState } from 'react';
import LineChart from '@/components/LineChart';
import Sparkline from '@/components/Sparkline';
import { generateWorld } from '@/lib/world';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
const VISUALIZER_BASE = process.env.NEXT_PUBLIC_VISUALIZER_BASE || 'http://localhost:8080';

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

  useEffect(()=>{
    if (paused) return; 
    const id = setInterval(()=> setGen(g=> Math.min(world.generations-1, g+1)), 700); 
    return ()=> clearInterval(id);
  }, [paused, world.generations]);

  const overallToNow = world.overallBest.slice(0, gen+1);

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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Monitoring Dashboard</h1>
          <p className="text-sm text-slate-500">Overall performance and island states</p>
          {runId && (
            <p className="text-xs text-slate-500 mt-1">
              Run ID: {runId} | Status: {status}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">Gen <span className="font-semibold">{gen}</span> / {world.generations-1}</div>
          <button onClick={()=> setPaused(p=>!p)} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-violet-700">
            {paused?'Resume':'Pause'}
          </button>
          {runId && outputPath && (
            <>
              <a
                href={`${VISUALIZER_BASE}/?path=${encodeURIComponent(outputPath)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
              >
                Visualize
              </a>
              <button
                onClick={handleStop}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
              >
                Stop
              </button>
            </>
          )}
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

      {!runId ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-medium text-amber-800">No active evolution</div>
          <p className="text-sm text-amber-700 mt-1">
            Start an evolution from the Project Hub to see real-time monitoring data here.
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Demo data shown. In a production implementation, this would display real-time data from the evolution process.
        </p>
      )}
    </div>
  );
}