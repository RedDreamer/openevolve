const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function getPromptDefaults(){
  const resp = await fetch(`${API_BASE}/prompt-defaults`);
  if (!resp.ok) throw new Error('getPromptDefaults failed');
  return resp.json();
}

export async function startEvolution(payload: { code: string; evaluator?: string; configFile?: File; context?: Record<string, unknown>; prompts?: Record<string, string> }){
  if (!payload?.code) throw new Error('startEvolution: code required');

  const body: Record<string, unknown> = {
    code: payload.code,
  };
  if (payload.evaluator) body.evaluator = payload.evaluator;
  if (payload.configFile) body.config = await payload.configFile.text();
  if (payload.context) body.context = payload.context;
  if (payload.prompts) body.prompts = payload.prompts;

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