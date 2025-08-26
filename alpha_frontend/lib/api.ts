import type { Metric, RunConfig } from './world';

export async function startEvolution(payload: { code: string; evaluator?: string; metrics: Metric[]; config: RunConfig }){
  await new Promise((r)=>setTimeout(r, 80));
  if (!payload?.code) throw new Error('startEvolution: code required');
  if (!Array.isArray(payload?.metrics)) throw new Error('startEvolution: metrics must be array');
  console.log('startEvolution:success', { runId: `run_${Date.now()}` });
  return { ok: true as const, runId: `run_${Date.now()}` };
}