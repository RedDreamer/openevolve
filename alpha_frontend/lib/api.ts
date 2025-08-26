import type { Metric } from './world';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function startEvolution(payload: { code: string; evaluator?: string; metrics: Metric[]; configFile?: File }){
  if (!payload?.code) throw new Error('startEvolution: code required');
  if (!Array.isArray(payload?.metrics)) throw new Error('startEvolution: metrics must be array');

  const body: Record<string, unknown> = {
    code: payload.code,
    metrics: payload.metrics,
  };
  if (payload.evaluator) body.evaluator = payload.evaluator;
  if (payload.configFile) body.config = await payload.configFile.text();

  const response = await fetch(`${API_BASE}/start-evolution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`startEvolution failed: ${response.status}`);
  }

  return response.json();
}