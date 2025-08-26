import type { Metric, RunConfig } from './world';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function startEvolution(payload: { code: string; evaluator?: string; metrics: Metric[]; config: RunConfig; configFile?: File }){
  if (!payload?.code) throw new Error('startEvolution: code required');
  if (!Array.isArray(payload?.metrics)) throw new Error('startEvolution: metrics must be array');

  const formData = new FormData();
  formData.append('code', payload.code);
  if (payload.evaluator) formData.append('evaluator', payload.evaluator);
  formData.append('metrics', JSON.stringify(payload.metrics));
  formData.append('config', JSON.stringify(payload.config));
  if (payload.configFile) formData.append('config_file', payload.configFile);

  const response = await fetch(`${API_BASE}/start-evolution`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`startEvolution failed: ${response.status}`);
  }

  return response.json();
}