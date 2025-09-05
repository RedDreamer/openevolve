'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LineChart from '@/components/LineChart';
import Sparkline from '@/components/Sparkline';
import CodeBlock from '@/components/CodeBlock';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

interface ProgramSummary {
  id: string;
  code: string;
  fitness: number;
  metrics: Record<string, number>;
}

interface IslandSummary {
  id: number;
  best?: ProgramSummary;
  history: number[];
}

interface MonitorResponse {
  iteration: number;
  history: number[];
  best?: ProgramSummary;
  islands: IslandSummary[];
}

export default function MonitorPage() {
  const [runId, setRunId] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [data, setData] = useState<MonitorResponse | null>(null);
  const [showCode, setShowCode] = useState<Record<number, boolean>>({});
  const router = useRouter();

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

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  // Fetch monitor data
  useEffect(() => {
    if (!runId) return;

    const fetchData = async () => {
      try {
        const resp = await fetch(`${API_BASE}/monitor-data/${runId}`);
        if (resp.ok) {
          const json = await resp.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching monitor data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [runId]);

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
        setData(null);
        localStorage.removeItem('currentRunId');
        localStorage.removeItem('currentOutputPath');
      }
    } catch (error) {
      console.error('Error stopping evolution:', error);
    }
  };

  const toggleCode = (id: number) => {
    setShowCode((prev) => ({ ...prev, [id]: !prev[id] }));
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
          {runId && outputPath && (
            <>
              <button
                onClick={() =>
                  router.push(`/visualize?runId=${runId}&path=${encodeURIComponent(outputPath)}`)
                }
                className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
              >
                Visualize
              </button>
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

      {runId && data && data.history.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 text-sm font-medium text-slate-900">Overall Best Fitness</div>
          <LineChart data={data.history} height={220} testid="chart-overall" />
        </div>
      )}

      {runId && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.islands.map((isl) => (
            <div key={isl.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Island {isl.id + 1}</div>
                <div className="text-xs text-slate-500">
                  {isl.best ? `Score: ${isl.best.fitness.toFixed(3)}` : 'No data'}
                </div>
              </div>
              {isl.history && isl.history.length > 0 && (
                <Sparkline
                  data={isl.history}
                  height={60}
                  testid={`chart-island-${isl.id}`}
                />
              )}
              {isl.best && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-700">Best Code</div>
                    <button
                      onClick={() => toggleCode(isl.id)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      {showCode[isl.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showCode[isl.id] && <CodeBlock code={isl.best.code} />}
                  {isl.best.metrics && Object.keys(isl.best.metrics).length > 0 && (
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {Object.entries(isl.best.metrics)
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <div key={k}>
                            <span className="font-medium">{k}:</span>{' '}
                            {typeof v === 'number' ? v.toFixed(3) : String(v)}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!runId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-medium text-amber-800">No active evolution</div>
          <p className="text-sm text-amber-700 mt-1">
            Start an evolution from the Project Hub to see real-time monitoring data here.
          </p>
        </div>
      )}
    </div>
  );
}

