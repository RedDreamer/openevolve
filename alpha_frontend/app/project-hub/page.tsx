'use client';
import { useMemo, useRef, useState } from 'react';
import MonacoEditor from '@/components/MonacoEditor';
import { useStarted } from '@/lib/state';
import { startEvolution } from '@/lib/api';
import type { Metric, RunConfig } from '@/lib/world';
import LineChart from '@/components/LineChart';
import { useRouter } from 'next/navigation';

const SAMPLE = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
`;

async function readFileAsText(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function chooseSeed(uploaded: string, editor: string) { return uploaded && uploaded.length > 0 ? uploaded : editor; }

export default function ProjectHubPage(){
  const { started, setStarted } = useStarted();
  const router = useRouter();

  const [code, setCode] = useState<string>(SAMPLE);
  const [seedCode, setSeedCode] = useState<string>('');
  const [seedFileName, setSeedFileName] = useState<string>('');
  const [evaluatorText, setEvaluatorText] = useState<string>('');
  const [evalFileName, setEvalFileName] = useState<string>('');
  const [metrics, setMetrics] = useState<Metric[]>([
    { id: 'latency', label: 'latency', weight: 0.5 },
    { id: 'accuracy', label: 'accuracy', weight: 0.5 },
  ]);
  const [cfg, setCfg] = useState<RunConfig>({ generations: 10, population: 24, mutation: 0.15, seed: 42, model: 'gpt-5' });
  const [cfgFile, setCfgFile] = useState<File | null>(null);
  const [cfgFileName, setCfgFileName] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const usedSeed = useMemo(()=> chooseSeed(seedCode, code), [seedCode, code]);
  const hubRef = useRef<HTMLDivElement | null>(null);

  const handleHeroStart = () => {
    setStarted(true);
    setTimeout(()=> hubRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const handleStartEvolution = async () => {
    setIsStarting(true);
    try {
      const result = await startEvolution({
        code: usedSeed,
        evaluator: evaluatorText,
        metrics,
        config: cfg,
        configFile: cfgFile || undefined,
      });
      
      // Save runId to localStorage
      if (result.ok && result.runId) {
        localStorage.setItem('currentRunId', result.runId);
        // Navigate to monitor page with runId
        router.push(`/monitor?runId=${result.runId}`);
      }
    } catch (error) {
      console.error('Failed to start evolution:', error);
      alert('Failed to start evolution: ' + (error as Error).message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div>
      {/* Landing Hero */}
      <section id="project-hub-hero" className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">AlphaEvolve · Evolutionary Coding</div>
              <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">自动演化与评估，让代码自我进化</h1>
              <p className="mt-3 text-slate-600">AlphaEvolve 将遗传算法与多指标评估结合，自动产生候选实现、并在多个岛屿并行演化。实时监控整体性能曲线，比较不同变体，快速找到更优解。</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-600 list-disc list-inside">
                <li>支持自定义 <span className="font-medium">Seed Algorithm</span> 与 <span className="font-medium">Evaluator</span></li>
                <li>多指标优化（Latency/Accuracy/…）与模型选择</li>
                <li>监控面板与结果工作台，便于对比与回溯</li>
              </ul>
              <div className="mt-6 flex items-center gap-3">
                <button data-testid="hero-start" onClick={handleHeroStart}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700">Start</button>
                {!started && <span className="text-sm text-slate-500">点击 Start 后将解锁页面功能</span>}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-medium text-slate-900">演化过程概览</div>
              <div className="mt-2 text-xs text-slate-500">示意图（Demo 数据）</div>
              <div className="mt-3"><LineChart data={[0.1,0.12,0.2,0.18,0.28,0.33,0.38,0.42,0.5,0.58,0.63,0.71,0.76,0.8,0.83]} height={160}/></div>
            </div>
          </div>
        </div>
      </section>

      {/* Hub Editor Section — only visible after started */}
      {started && (
        <div id="hub" ref={hubRef} className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Project Hub</h2>
              <p className="text-sm text-slate-500">Define problems and start evolution</p>
            </div>
            <button 
              data-testid="start-evolution"
              className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-50"
              onClick={handleStartEvolution}
              disabled={isStarting}
            >
              {isStarting ? 'Starting...' : 'Start Evolution'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900">Seed Algorithm</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100">
                    <span>Upload</span>
                    <input data-testid="upload-seed" type="file" className="hidden" accept=".py,.txt"
                      onChange={async (e)=>{ const f = e.target.files?.[0]; if(!f) return; setSeedCode(await readFileAsText(f)); setSeedFileName(f.name); }} />
                  </label>
                  {seedFileName && (
                    <button data-testid="clear-seed" className="rounded-md px-2 py-1 hover:bg-slate-100" onClick={()=>{ setSeedCode(''); setSeedFileName(''); }}>Clear</button>
                  )}
                </div>
              </div>
              {seedFileName && <div className="mb-2 truncate text-xs text-slate-500">Uploaded: {seedFileName}</div>}
              <MonacoEditor value={usedSeed} onChange={seedCode?undefined:setCode} height={420}/>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-900">Evaluator</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100">
                      <span>Upload</span>
                      <input data-testid="upload-evaluator" type="file" className="hidden" accept=".py,.json,.yaml,.yml,.txt"
                        onChange={async (e)=>{ const f = e.target.files?.[0]; if(!f) return; setEvaluatorText(await readFileAsText(f)); setEvalFileName(f.name); }} />
                    </label>
                    {evalFileName && (
                      <button data-testid="clear-evaluator" className="rounded-md px-2 py-1 hover:bg-slate-100" onClick={()=>{ setEvaluatorText(''); setEvalFileName(''); }}>Clear</button>
                    )}
                  </div>
                </div>
                {evalFileName ? (
                  <>
                    <div className="mb-2 truncate text-xs text-slate-500">Uploaded: {evalFileName}</div>
                    <textarea value={evaluatorText} readOnly className="h-40 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white p-3 font-mono text-sm leading-6 text-slate-900 opacity-80"/>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Upload an evaluator script/spec (.py/.json/.yaml)</div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-medium text-slate-900">Evaluation Metrics</div>
                {metrics.map((m, i)=> (
                  <div key={m.id} className="mb-2 flex items-center gap-3">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{m.label}</span>
                    <input data-testid={`metric-${m.id}`} type="range" min={0} max={1} step={0.05} value={m.weight}
                      onChange={(e)=>{ const v=[...metrics]; v[i].weight=Number(e.target.value); setMetrics(v); }} className="flex-1"/>
                    <span className="w-12 text-right text-xs text-slate-500">{m.weight.toFixed(2)}</span>
                  </div>
                ))}
                <button data-testid="add-metric" className="text-xs text-violet-600 hover:underline"
                  onClick={()=> setMetrics([...metrics, { id: `m-${metrics.length+1}`, label: 'custom', weight: 0.3 }])}>+ Add metric</button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-medium text-slate-900">Run Configuration</div>
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100">
                    <span>Upload</span>
                    <input
                      data-testid="upload-config"
                      type="file"
                      className="hidden"
                      accept=".json,.yaml,.yml"
                      onChange={async (e)=>{ const f = e.target.files?.[0]; if(!f) return; setCfgFile(f); setCfgFileName(f.name); }}
                    />
                  </label>
                  {cfgFileName && (
                    <button
                      data-testid="clear-config"
                      className="rounded-md px-2 py-1 hover:bg-slate-100"
                      onClick={()=>{ setCfgFile(null); setCfgFileName(''); }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {cfgFileName && <div className="mb-2 truncate text-xs text-slate-500">Uploaded: {cfgFileName}</div>}
                <div className="grid grid-cols-2 gap-3">
                  {['generations','population','mutation','seed'].map((k)=> (
                    <label key={k} className="flex flex-col gap-1 text-sm">
                      <span className="text-xs text-slate-500">{k}</span>
                      <input data-testid={`cfg-${k}`} type="number" step={k==='mutation'?0.01:1} 
                        value={(cfg as any)[k]} onChange={(e)=> setCfg({ ...cfg, [k]: Number(e.target.value) })}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-200"/>
                    </label>
                  ))}
                  <label className="col-span-2 flex flex-col gap-1 text-sm">
                    <span className="text-xs text-slate-500">model</span>
                    <select data-testid="cfg-model" value={cfg.model} onChange={(e)=> setCfg({ ...cfg, model: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-200">
                      <option value="gpt-5">GPT-5</option>
<option value="o3">OpenAI o3</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="qwen2.5-coder-32b">Qwen2.5-Coder-32B</option>
                      <option value="deepseek-coder-v2">DeepSeek-Coder-V2</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}