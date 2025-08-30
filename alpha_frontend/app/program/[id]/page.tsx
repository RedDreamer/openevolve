'use client';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

function renderValue(val: any): JSX.Element {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return (
      <ul>
        {Object.entries(val).map(([k, v]) => (
          <li key={k}>
            <strong>{k}:</strong> {renderValue(v)}
          </li>
        ))}
      </ul>
    );
  }
  if (Array.isArray(val)) {
    return (
      <ul>
        {val.map((item, i) => (
          <li key={i}>{renderValue(item)}</li>
        ))}
      </ul>
    );
  }
  return <pre>{String(val)}</pre>;
}

export default function ProgramPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<any>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);

  useEffect(() => {
    const storedPath = localStorage.getItem('currentOutputPath');
    if (storedPath) {
      setOutputPath(storedPath);
    }
  }, []);

  useEffect(() => {
    if (!outputPath) return;
    fetch(`${API_BASE}/visualizer/program/${id}?path=${encodeURIComponent(outputPath)}`)
      .then(res => res.json())
      .then(setData);
  }, [outputPath, id]);

  if (!data) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Program {data.id}</h1>
        <p className="mt-1 text-sm text-slate-600">Checkpoint: {data.checkpoint_dir}</p>
      </header>

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Details</h2>
        <ul className="space-y-1 text-sm">
          <li><strong>Island:</strong> {data.island}</li>
          <li><strong>Generation:</strong> {data.generation}</li>
          <li><strong>Parent ID:</strong> {data.parent_id || 'None'}</li>
          <li>
            <strong>Metrics:</strong>
            <ul className="ml-4 list-disc space-y-1">
              {data.metrics &&
                Object.entries(data.metrics).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k}:</strong> {String(v)}
                  </li>
                ))}
            </ul>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Code</h2>
        <pre className="whitespace-pre-wrap rounded bg-slate-100 p-3 text-xs">{data.code}</pre>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Prompts</h2>
        <div className="space-y-3">
          {data.prompts &&
            Object.entries(data.prompts).map(([k, v]) => (
              <section key={k}>
                <h3 className="font-medium">{k}</h3>
                {renderValue(v)}
              </section>
            ))}
        </div>
      </section>

      {data.artifacts_json && (
        <section className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold">Artifacts</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-slate-100 p-3 text-xs">
            {JSON.stringify(data.artifacts_json, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}

