'use client';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

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

  useEffect(() => {
    if (!outputPath) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('path') !== outputPath) {
      url.searchParams.set('path', outputPath);
      window.history.replaceState({}, '', url.toString());
    }
    (window as any).VISUALIZER_API_BASE = API_BASE;
    const head = document.head;
    let cssLink: HTMLLinkElement | null = null;
    let createdD3: HTMLScriptElement | null = null;

    const load = async () => {
      if (!document.getElementById('visualizer-css')) {
        cssLink = document.createElement('link');
        cssLink.id = 'visualizer-css';
        cssLink.rel = 'stylesheet';
        cssLink.href = '/visualizer/css/main.css';
        head.appendChild(cssLink);
      }

      await new Promise<void>(resolve => {
        const existing = document.getElementById('d3-script');
        if (existing) return resolve();
        createdD3 = document.createElement('script');
        createdD3.id = 'd3-script';
        createdD3.src = 'https://d3js.org/d3.v7.min.js';
        createdD3.onload = () => resolve();
        head.appendChild(createdD3);
      });

      const scripts = [
        '/visualizer/js/state.js',
        '/visualizer/js/main.js',
        '/visualizer/js/mainUI.js',
        '/visualizer/js/sidebar.js',
        '/visualizer/js/graph.js',
        '/visualizer/js/performance.js',
        '/visualizer/js/list.js',
      ];
      const addedScripts: HTMLScriptElement[] = [];
      scripts.forEach(src => {
        if (!document.querySelector(`script[src="${src}"]`)) {
          const s = document.createElement('script');
          s.type = 'module';
          s.src = src;
          document.body.appendChild(s);
          addedScripts.push(s);
        }
      });

      return () => {
        cssLink?.remove();
        createdD3?.remove();
        addedScripts.forEach(s => s.remove());
      };
    };

    const cleanupPromise = load();

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [outputPath]);

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
    return <div className="p-4">No visualization available.</div>;
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
      <div id="toolbar">
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '220px' }}>
          <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>OpenEvolve Evolution Visualizer</span>
          <span id="checkpoint-label" style={{ fontSize: '0.9em', color: '#888' }}>Checkpoint: None</span>
        </div>
        <div className="toolbar-spacer"></div>
        <div className="tabs">
          <div className="tab active" id="tab-branching">Branching</div>
          <div className="tab" id="tab-performance">Performance</div>
          <div className="tab" id="tab-list">List</div>
        </div>
        <label className="toolbar-label" htmlFor="metric-select">Metric:
          <select id="metric-select" defaultValue="combined_score">
            <option value="combined_score">combined_score</option>
          </select>
        </label>
        <label className="toolbar-label" htmlFor="highlight-select">Highlight:
          <select id="highlight-select" defaultValue="top">
            <option value="none">None</option>
            <option value="top">Top score</option>

            <option value="first">First generation</option>
            <option value="failed">Failed</option>
            <option value="unset">Metric unset</option>
          </select>
        </label>
        <div className="toolbar-darkmode">
          <label className="toolbar-label">Dark mode:</label>
          <input type="checkbox" id="darkmode-toggle" />
          <span id="darkmode-label">🌙</span>
        </div>
      </div>
      <div id="sidebar">
        <div id="sidebar-content">
          <span style={{ color: '#888' }}>Select a node to see details.</span>
        </div>
      </div>
      <div id="view-branching" className="active" style={{ paddingTop: '3.5em' }}>
        <div id="graph"></div>
      </div>
      <div id="view-list" style={{ display: 'none', paddingTop: '3.5em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginBottom: '1em' }}>
          <input
            id="list-search"
            type="text"
            placeholder="Search program ID..."
            style={{ fontSize: '1em', padding: '0.4em 1em', borderRadius: '6px', border: '1px solid #ccc', minWidth: '220px' }}
          />
          <select
            id="list-sort"
            defaultValue="generation"
            style={{ fontSize: '1em', padding: '0.3em 1em', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="id">Sort by ID</option>
            <option value="generation">Sort by generation</option>

            <option value="island">Sort by island</option>
            <option value="score">Sort by score</option>
          </select>
        </div>
        <div id="node-list-container"></div>
      </div>
      <div id="view-performance" style={{ paddingTop: '4.5em' }}></div>
      <div id="view-prompts" style={{ paddingTop: '3.5em' }}></div>
    </div>
  );
}
