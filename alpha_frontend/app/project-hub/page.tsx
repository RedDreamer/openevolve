'use client';
import { useEffect, useMemo, useState } from 'react';
import MonacoEditor from '@/components/MonacoEditor';
import { useStarted } from '@/lib/state';
import { startEvolution, getPromptDefaults } from '@/lib/api';
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
  const { started } = useStarted();
  const router = useRouter();

  useEffect(() => {
    if (!started) {
      router.replace('/');
    }
  }, [started, router]);

  const [code, setCode] = useState<string>(SAMPLE);
  const [seedCode, setSeedCode] = useState<string>('');
  const [seedFileName, setSeedFileName] = useState<string>('');
  const [evaluatorText, setEvaluatorText] = useState<string>('');
  const [evalFileName, setEvalFileName] = useState<string>('');
  const [cfgFile, setCfgFile] = useState<File | null>(null);
  const [cfgFileName, setCfgFileName] = useState<string>('');
  const [cfgText, setCfgText] = useState<string>('');
  const [contextText, setContextText] = useState<string>('');
  const [contextError, setContextError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [diffUserPrompt, setDiffUserPrompt] = useState<string>('');
  const [fullRewritePrompt, setFullRewritePrompt] = useState<string>('');
  const [evaluationPrompt, setEvaluationPrompt] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<'system' | 'diff' | 'full' | 'evaluation'>('system');
  const [promptFileName, setPromptFileName] = useState<string>('');

  const promptValue =
    activePrompt === 'system'
      ? systemPrompt
      : activePrompt === 'diff'
      ? diffUserPrompt
      : activePrompt === 'full'
      ? fullRewritePrompt
      : evaluationPrompt;
  const setPromptValue =
    activePrompt === 'system'
      ? setSystemPrompt
      : activePrompt === 'diff'
      ? setDiffUserPrompt
      : activePrompt === 'full'
      ? setFullRewritePrompt
      : setEvaluationPrompt;
  const promptTabs: { key: typeof activePrompt; label: string }[] = [
    { key: 'system', label: 'System' },
    { key: 'diff', label: 'Diff' },
    { key: 'full', label: 'Full Rewrite' },
    { key: 'evaluation', label: 'Evaluation' },
  ];

  const usedSeed = useMemo(()=> chooseSeed(seedCode, code), [seedCode, code]);

  useEffect(() => {
    getPromptDefaults()
      .then((p) => {
        setDiffUserPrompt(p.diff_user || '');
        setSystemPrompt(p.system_message || '');
        setFullRewritePrompt(p.full_rewrite_user || '');
        setEvaluationPrompt(p.evaluation || '');
      })
      .catch(() => {});
  }, []);

  const handleStartEvolution = async () => {
    setIsStarting(true);
    try {
      if (contextError) {
        alert('Invalid context JSON');
        return;
      }
      let context: Record<string, unknown> | undefined;
      if (contextText) {
        try {
          context = JSON.parse(contextText);
        } catch (err) {
          alert('Invalid context JSON');
          return;
        }
      }
      const result = await startEvolution({
        code: usedSeed,
        evaluator: evaluatorText,
        configFile: cfgFile || undefined,
        context,
        prompts: {
          diff_user: diffUserPrompt,
          system_message: systemPrompt,
          full_rewrite_user: fullRewritePrompt,
          evaluation: evaluationPrompt,
        },
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

  if (!started) return null;

  return (
    <div className="min-h-screen">
      <div id="hub" className="mx-auto max-w-6xl space-y-6 p-6">
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

          <div className="space-y-6">
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
                      <MonacoEditor value={evaluatorText} height={160} language="python" readOnly />
                    </>
                  ) : (
                    <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600">

                      Upload an evaluator script (.py)
                      <input data-testid="upload-evaluator" type="file" className="hidden" accept=".py" onChange={async (e)=>{ const f = e.target.files?.[0]; if(!f) return; setEvaluatorText(await readFileAsText(f)); setEvalFileName(f.name); }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900">Run Configuration</div>
                {cfgFileName && (
                  <button
                    data-testid="clear-config"
                    className="rounded-md px-2 py-1 hover:bg-slate-100"
                    onClick={()=>{ setCfgFile(null); setCfgFileName(''); setCfgText(''); }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {cfgFileName ? (
                <>
                  <div className="text-xs text-slate-500">Uploaded: {cfgFileName}</div>
                  <MonacoEditor value={cfgText} height={180} language="yaml" readOnly />
                </>
              ) : (
                <label className="mt-2 flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600">

                  Upload a config file (.yaml)
                  <input
                    data-testid="upload-config"
                    type="file"
                    className="hidden"
                    accept=".yaml"
                    onChange={async (e)=>{ const f = e.target.files?.[0]; if(!f) return; setCfgFile(f); setCfgFileName(f.name); setCfgText(await readFileAsText(f)); }}
                  />
                </label>
              )}
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">View example config</summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-left font-mono leading-5 text-slate-700">{SAMPLE_CONFIG}</pre>
              </details>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900">Prompts</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100">
                    <span>Upload</span>
                    <input
                      data-testid="upload-prompts"
                      type="file"
                      className="hidden"
                      accept=".json,.txt"
                      onChange={async (e)=>{
                        const f = e.target.files?.[0];
                        if(!f) return;
                        const text = await readFileAsText(f);
                        try {
                          const d = JSON.parse(text);
                          setSystemPrompt(d.system_message || '');
                          setDiffUserPrompt(d.diff_user || '');
                          setFullRewritePrompt(d.full_rewrite_user || '');
                          setEvaluationPrompt(d.evaluation || '');
                        } catch {
                          setPromptValue(text);
                        }
                        setPromptFileName(f.name);
                      }}
                    />
                  </label>
                  {promptFileName && (
                    <button
                      data-testid="clear-prompts"
                      className="rounded-md px-2 py-1 hover:bg-slate-100"
                      onClick={()=>{
                        setPromptFileName('');
                        setSystemPrompt('');
                        setDiffUserPrompt('');
                        setFullRewritePrompt('');
                        setEvaluationPrompt('');
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {promptFileName && <div className="mb-2 truncate text-xs text-slate-500">Uploaded: {promptFileName}</div>}
              <div className="mb-3 flex flex-wrap gap-2">
                {promptTabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActivePrompt(t.key)}
                    className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                      activePrompt === t.key
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <MonacoEditor height={420} value={promptValue} onChange={setPromptValue} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900">Context</div>
                {!showContext ? (
                  <button
                    className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                    onClick={() => setShowContext(true)}
                  >
                    Add
                  </button>
                ) : (
                  <button
                    className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                    onClick={() => {
                      setShowContext(false);
                      setContextText('');
                      setContextError(null);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {showContext && (
                <>
                  <MonacoEditor
                    height={200}
                    value={contextText}
                    language="json"
                    onChange={(v)=>{
                      setContextText(v);
                      if (v) {
                        try { JSON.parse(v); setContextError(null); }
                        catch { setContextError('Invalid JSON'); }
                      } else {
                        setContextError(null);
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-slate-500">Optional JSON context passed to evaluator</p>
                  {contextError && <p className="mt-1 text-xs text-red-600">{contextError}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}