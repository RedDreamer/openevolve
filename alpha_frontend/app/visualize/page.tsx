'use client';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
const VISUALIZER_BASE = process.env.NEXT_PUBLIC_VISUALIZER_BASE || 'http://localhost:8080';

export default function VisualizePage() {
  const [runId, setRunId] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);

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

  const handleStop = async () => {
    if (!runId) return;
    try {
      const response = await fetch(`${API_BASE}/stop-evolution/${runId}`, {
        method: 'POST',
      });
      if (response.ok) {
        setRunId(null);
        setOutputPath(null);
        localStorage.removeItem('currentRunId');
        localStorage.removeItem('currentOutputPath');
      }
    } catch (error) {
      console.error('Error stopping evolution:', error);
    }
  };

  if (!outputPath) {
    return (
      <div className="p-4">No visualization available.</div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-end">
        {runId && (
          <button
            onClick={handleStop}
            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
          >
            Stop
          </button>
        )}
      </div>
      <iframe
        src={`${VISUALIZER_BASE}/?path=${encodeURIComponent(outputPath)}`}
        className="w-full h-[calc(100vh-5rem)] border-0"
      />
    </div>
  );
}
