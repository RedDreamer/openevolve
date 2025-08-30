'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import MonacoEditor from '@/components/MonacoEditor';
import { useStarted } from '@/lib/state';
import { startEvolution } from '@/lib/api';
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

const SAMPLE_CONFIG = `# OpenEvolve Default Configuration
# This file contains all available configuration options with sensible defaults
# You can use this as a template for your own configuration

# General settings
max_iterations: 100                  # Maximum number of evolution iterations
checkpoint_interval: 10               # Save checkpoints every N iterations
log_level: "INFO"                     # Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
log_dir: null                         # Custom directory for logs (default: output_dir/logs)
random_seed: 42                       # Random seed for reproducibility (null = random, 42 = default)

# Evolution settings
diff_based_evolution: true            # Use diff-based evolution (true) or full rewrites (false)
max_code_length: 10000                # Maximum allowed code length in characters

# LLM configuration
llm:
  # Models for evolution
  models:
    # List of available models with their weights
    - name: "gemini-2.0-flash-lite"
      weight: 0.8
    - name: "gemini-2.0-flash"
      weight: 0.2

  # Models for LLM feedback
  evaluator_models:
    # List of available models with their weights
    - name: "gemini-2.0-flash-lite"
      weight: 0.8
    - name: "gemini-2.0-flash"
      weight: 0.2

  # API configuration
  api_base: "https://generativelanguage.googleapis.com/v1beta/openai/"  # Base URL for API (change for non-OpenAI models)
  api_key: null                       # API key (defaults to OPENAI_API_KEY env variable)

  # Generation parameters
  temperature: 0.7                    # Temperature for generation (higher = more creative)
  top_p: 0.95                         # Top-p sampling parameter
  max_tokens: 4096                    # Maximum tokens to generate
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
  const [cfgFile, setCfgFile] = useState<File | null>(null);
  const [cfgFileName, setCfgFileName] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const usedSeed = useMemo(()=> chooseSeed(seedCode, code), [seedCode, code]);
  const hubRef = useRef<HTMLDivElement | null>(null);

  const handleHeroStart = () => {
    setStarted(true);
  };

  useEffect(() => {
    if (started) {
      hubRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [started]);

  const handleStartEvolution = async () => {
    setIsStarting(true);
    try {
      const result = await startEvolution({
        code: usedSeed,
        evaluator: evaluatorText,
        configFile: cfgFile || undefined,
      });

      // Save runId to localStorage
      if (result.runId) {
        localStorage.setItem('currentRunId', result.runId);
        if (result.path) {
          localStorage.setItem('currentOutputPath', result.path);
        }
        // Navigate directly to visualization page with runId and path
        const pathParam = result.path ? `&path=${encodeURIComponent(result.path)}` : '';
        router.push(`/visualize?runId=${result.runId}${pathParam}`);
      }
    } catch (error) {
      console.error('Failed to start evolution:', error);
      alert('Failed to start evolution: ' + (error as Error).message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Landing Hero */}
      {!started && (
        <>
        <section id="project-hub-hero" className="relative overflow-hidden bg-white">
          <div className="w-full min-h-screen px-4 py-14 md:py-20">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">AlphaEvolve · Evolutionary Coding</div>
                <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">自动演化与评估，让代码自我进化</h1>
                <p className="mt-3 text-slate-600">AlphaEvolve 将遗传算法与多指标评估结合，自动产生候选实现、并在多个岛屿并行演化。实时监控整体性能曲线，比较不同变体，快速找到更优解。</p>
                <ul className="mt-5 list-inside list-disc space-y-2 text-sm text-slate-600">
                  <li>支持自定义 <span className="font-medium">Seed Algorithm</span> 与 <span className="font-medium">Evaluator</span></li>
                  <li>多指标优化（Latency/Accuracy/…）</li>
                  <li>监控面板与结果工作台，便于对比与回溯</li>
                </ul>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    data-testid="hero-start"
                    onClick={handleHeroStart}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700"
                  >
                    Start
                  </button>
                  <span className="text-sm text-slate-500">点击 Start 后将解锁页面功能</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-medium text-slate-900">演化过程概览</div>
                <div className="mt-2 text-xs text-slate-500">示意图（Demo 数据）</div>
                <div className="mt-3">
                  <LineChart data={[0.1,0.12,0.2,0.18,0.28,0.33,0.38,0.42,0.5,0.58,0.63,0.71,0.76,0.8,0.83,0.86,0.9,0.93,0.95,0.98]} height={180}/>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-slate-50 px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">特色与优势</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">自动演化</h3>
                <p className="mt-2 text-sm text-slate-600">根据评估指标自动生成和优化代码实现，不断提高性能。</p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">自定义评估</h3>
                <p className="mt-2 text-sm text-slate-600">拥抱您自定义的评估脚本，以导向演化期望的目标。</p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">交互式监控</h3>
                <p className="mt-2 text-sm text-slate-600">实时可视化评估数据，便于比较不同方案和追踪演化过程。</p>
              </div>
            </div>
          </div>
        </section>
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">工作原理</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-4">
              <div className="rounded-xl bg-white p-6 text-center shadow-sm">
                <div className="text-lg font-semibold text-slate-900">1. 提供 Seed</div>
                <p className="mt-2 text-sm text-slate-600">上传初始算法或直接在编辑器中编写。</p>
              </div>
              <div className="rounded-xl bg-white p-6 text-center shadow-sm">
                <div className="text-lg font-semibold text-slate-900">2. 编写评估</div>
                <p className="mt-2 text-sm text-slate-600">定义度量标准，引导演化方向。</p>
              </div>
              <div className="rounded-xl bg-white p-6 text-center shadow-sm">
                <div className="text-lg font-semibold text-slate-900">3. 自动演化</div>
                <p className="mt-2 text-sm text-slate-600">系统并行生成变体并运行评估。</p>
              </div>
              <div className="rounded-xl bg-white p-6 text-center shadow-sm">
                <div className="text-lg font-semibold text-slate-900">4. 对比结果</div>
                <p className="mt-2 text-sm text-slate-600">监控性能曲线，快速挑选更优解。</p>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-slate-50 px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">示例演化结果</h2>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-slate-900">
                  <tr>
                    <th className="p-3">Variant</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3">Iterations</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-slate-900">Baseline</td>
                    <td className="p-3">120ms</td>
                    <td className="p-3">92%</td>
                    <td className="p-3">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-slate-900">Variant A</td>
                    <td className="p-3">98ms</td>
                    <td className="p-3">93%</td>
                    <td className="p-3">15</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900">Variant B</td>
                    <td className="p-3">85ms</td>
                    <td className="p-3">95%</td>
                    <td className="p-3">30</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        </>
      )}

      {/* Hub Editor Section — only visible after started */}
      {started && (
        <div id="hub" ref={hubRef} className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Project Hub</h2>
              <p className="text-sm text-slate-500">Define problems and start evolution</p>
            </div>
            <button
              data-testid="start-evolution"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-50"
              onClick={handleStartEvolution}
              disabled={isStarting}
            >
              {isStarting ? 'Starting...' : 'Start Evolution'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900">Seed Algorithm</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100">
                    <span>Upload</span>
                    <input
                      data-testid="upload-seed"
                      type="file"
                      className="hidden"
                      accept=".py,.txt"
                      onChange={async (e)=>{ const f = e.target.files?.[0]; if(!f) return; setSeedCode(await readFileAsText(f)); setSeedFileName(f.name); }}
                    />
                  </label>
                  {seedFileName && (
                    <button
                      data-testid="clear-seed"
                      className="rounded-md px-2 py-1 hover:bg-slate-100"
                      onClick={()=>{ setSeedCode(''); setSeedFileName(''); }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {seedFileName && <div className="mb-2 truncate text-xs text-slate-500">Uploaded: {seedFileName}</div>}
              <MonacoEditor value={usedSeed} onChange={seedCode?undefined:setCode} height={420}/>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-900">Evaluator</div>
                  {evalFileName && (
                    <button
                      data-testid="clear-evaluator"
                      className="rounded-md px-2 py-1 hover:bg-slate-100"
                      onClick={()=>{ setEvaluatorText(''); setEvalFileName(''); }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {evalFileName ? (
                  <>
                    <div className="mb-2 truncate text-xs text-slate-500">Uploaded: {evalFileName}</div>
                    <textarea
                      value={evaluatorText}
                      readOnly
                      className="h-40 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white p-3 font-mono text-sm leading-6 text-slate-900 opacity-80"
                    />
                  </>
                ) : (
                  <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600">

                    Upload an evaluator script (.py)
                    <input data-testid="upload-evaluator" type="file" className="hidden" accept=".py" onChange={async (e)=>{ const f = e.target.files?.[0]; if(!f) return; setEvaluatorText(await readFileAsText(f)); setEvalFileName(f.name); }} />
                  </label>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-900">Run Configuration</div>
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
                {cfgFileName ? (
                  <div className="text-xs text-slate-500">Uploaded: {cfgFileName}</div>
                ) : (
                  <label className="mt-2 flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600">

                    Upload a config file (.yaml)
                    <input
                      data-testid="upload-config"
                      type="file"
                      className="hidden"
                      accept=".yaml"
                      onChange={async (e)=>{ const f = e.target.files?.[0]; if(!f) return; setCfgFile(f); setCfgFileName(f.name); }}
                    />
                  </label>
                )}
                <details className="mt-3 text-xs text-slate-500">
                  <summary className="cursor-pointer">View example config</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-left font-mono leading-5 text-slate-700">{SAMPLE_CONFIG}</pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}