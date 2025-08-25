# AlphaEvolve Demo (Next.js, App Router)

> 多文件工程版本，包含 Project Hub（含宣传 Hero + 上传/配置）、Monitor（整体曲线 + 多岛屿状态与变化）、Compare、Results。首次进入需在 Project Hub 顶部点击 **Start** 才会展示导航 Tab 并解锁功能；在 Hub 内点击 **Start Evolution** 后会跳转到 **/monitor**。

---

## 项目结构

```
alphaevolve-demo/
├─ README.md
├─ package.json
├─ tsconfig.json
├─ next.config.js
├─ postcss.config.js
├─ tailwind.config.ts
├─ .gitignore
├─ app/
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ page.tsx                 # 入口：重定向到 /project-hub
│  ├─ project-hub/
│  │  └─ page.tsx              # Hero + Hub（上传/配置/Start Evolution）
│  ├─ monitor/
│  │  └─ page.tsx              # 总体曲线 + 多岛屿卡片（sparkline+top code-score）
│  ├─ compare/
│  │  └─ page.tsx
│  └─ results/
│     └─ page.tsx
├─ components/
│  ├─ TopNav.tsx
│  ├─ LineChart.tsx
│  ├─ Sparkline.tsx
│  └─ MonacoEditor.tsx         # 无依赖文本域降级版
└─ lib/
   ├─ state.tsx                # started 门控（Start 后显示 Tabs），sessionStorage 持久化
   ├─ world.ts                 # 类型、随机生成 demo 数据、movingMax
   └─ api.ts                   # startEvolution 存根（成功后在 Hub 页面路由到 /monitor）
```

---

## 安装与运行

```bash
# Node 18+ 建议：v18.18 / v20 LTS
pnpm i        # 或 npm i / yarn
pnpm dev      # http://localhost:3000 （自动重定向到 /project-hub）
```

### 最小 Playwright E2E（可选）
> 如需回归：上传种子/评估器 → 配置 → 启动 → 跳转 monitor。

在 `package.json` 已预置 `test:e2e` 脚本（需安装 `playwright`）：

```ts
// e2e/start-and-monitor.spec.ts
import { test, expect } from '@playwright/test';

test('unlock tabs then start evolution → monitor', async ({ page }) => {
  await page.goto('/project-hub');
  await expect(page.getByTestId('nav-tabs').locator('button')).toHaveCount(0);
  await page.getByTestId('hero-start').click();
  await page.waitForSelector('#hub');
  await expect(page.getByTestId('nav-tabs').locator('button')).toHaveCount(4);
  await Promise.all([
    page.waitForURL('**/monitor'),
    page.getByTestId('start-evolution').click(),
  ]);
  await expect(page.getByTestId('chart-overall')).toBeVisible();
});
```

---

## 关键交互与说明
- **Start 门控**：`lib/state.tsx` 持久化 `started`；`components/TopNav.tsx` 在 `started=false` 时隐藏 Tabs。
- **Project Hub**：顶部 Hero 介绍；点击 **Start** → 设置 `started=true` 并 **scroll 到 #hub**；点击 **Start Evolution** 调用 `lib/api.ts` 存根（不接后端）→ `router.push('/monitor')`。
- **Monitor**：展示 **Overall Best Fitness 折线图** 与 **多岛屿卡片**（每岛 sparkline=该岛每代最大分数的运行最大值；并显示当前代 Top3 代码-分数对）。
- **白色主题**：`app/globals.css` + Tailwind；无深色模式。
- **无外部依赖**：自绘 `LineChart`/`Sparkline`（SVG）。

---

## 源码

> 将以下文件按路径写入到本地工程（已按上方目录分组）。

### `package.json`
```json
{
  "name": "alphaevolve-demo",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.7",
    "@types/react": "^18.2.68",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.0",
    "playwright": "^1.45.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "ES2020"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"]
    },
    "resolveJsonModule": true,
    "allowJs": false,
    "noEmit": true
  },
  "include": ["app", "components", "lib", "e2e"],
  "exclude": ["node_modules"]
}
```

### `next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
module.exports = nextConfig;
```

### `postcss.config.js`
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### `tailwind.config.ts`
```ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

### `.gitignore`
```gitignore
.next/
node_modules/
*.log
.DS_Store
playwright-report/
```

---

### `app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { background: #f8fafc; color: #0f172a; }
```

### `app/layout.tsx`
```tsx
import './globals.css';
import type { Metadata } from 'next';
import { StartedProvider } from '@/lib/state';
import TopNav from '@/components/TopNav';

export const metadata: Metadata = {
  title: 'AlphaEvolve Demo',
  description: 'Evolutionary coding demo (white theme)'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <StartedProvider>
          <TopNav />
          <div className="min-h-screen">{children}</div>
        </StartedProvider>
      </body>
    </html>
  );
}
```

### `app/page.tsx`
```tsx
import { redirect } from 'next/navigation';
export default function Page(){
  redirect('/project-hub');
}
```

---

### `components/TopNav.tsx`
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStarted } from '@/lib/state';

export default function TopNav(){
  const pathname = usePathname();
  const { started } = useStarted();
  const Item = ({href, label}:{href:string; label:string}) => (
    <Link href={href} className={
      'px-3 py-1 rounded-lg text-sm ' + (pathname===href? 'bg-violet-600 text-white':'hover:bg-slate-100 text-slate-700')
    }>
      {label}
    </Link>
  );
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 h-12">
      <div className="font-semibold text-slate-900">AlphaEvolve</div>
      <div data-testid="nav-tabs" aria-hidden={!started} className="flex items-center gap-2">
        {started && <Item href="/project-hub" label="Project Hub"/>}
        {started && <Item href="/monitor" label="Monitor"/>}
        {started && <Item href="/compare" label="Compare"/>}
        {started && <Item href="/results" label="Results"/>}
      </div>
    </div>
  );
}
```

### `components/LineChart.tsx`
```tsx
'use client';
import React from 'react';

function clamp(v:number, lo=0, hi=1){ return Math.max(lo, Math.min(hi, v)); }

export default function LineChart({ data, width=640, height=200, grid=true, label, testid }:
  { data:number[]; width?:number; height?:number; grid?:boolean; label?:string; testid?:string }){
  const m = 20; const w = width, h = height; const innerW = w - m*2, innerH = h - m*2;
  const len = Math.max(1, data.length);
  const xs = (i:number)=> m + (len===1? innerW : (i*(innerW/(len-1))));
  const ys = (v:number)=> m + (innerH - (clamp(v,0,1)*innerH));
  const pts = data.map((v,i)=> `${xs(i)},${ys(v)}`).join(' ');
  const zeroY = ys(0), halfY = ys(0.5), oneY = ys(1);
  return (
    <svg role="img" aria-label={label || 'line chart'} width={w} height={h} data-testid={testid} className="w-full text-violet-600">
      {grid && (
        <g className="text-slate-300">
          <line x1={m} y1={oneY} x2={w-m} y2={oneY} stroke="currentColor" strokeDasharray="3 3"/>
          <line x1={m} y1={halfY} x2={w-m} y2={halfY} stroke="currentColor" strokeDasharray="3 3"/>
          <line x1={m} y1={zeroY} x2={w-m} y2={zeroY} stroke="currentColor" strokeDasharray="3 3"/>
          <text x={w-m} y={oneY-4} textAnchor="end" className="fill-slate-400 text-[10px]">1.0</text>
          <text x={w-m} y={halfY-4} textAnchor="end" className="fill-slate-400 text-[10px]">0.5</text>
          <text x={w-m} y={zeroY-4} textAnchor="end" className="fill-slate-400 text-[10px]">0.0</text>
        </g>
      )}
      <polyline fill="none" stroke="currentColor" strokeWidth={2} points={pts} />
    </svg>
  );
}
```

### `components/Sparkline.tsx`
```tsx
'use client';
import LineChart from './LineChart';
export default function Sparkline({ data, height=56, testid }:{ data:number[]; height?:number; testid?:string }){
  return <LineChart data={data} height={height} grid={false} testid={testid} />;
}
```

### `components/MonacoEditor.tsx`
```tsx
'use client';
export default function MonacoEditor({ value, onChange, height=420 }:{ value:string; onChange?:(v:string)=>void; height?:number }){
  return (
    <textarea
      value={value}
      onChange={(e)=>onChange?.(e.target.value)}
      spellCheck={false}
      style={{height}}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-sm leading-6 text-slate-900"
    />
  );
}
```

---

### `lib/state.tsx`
```tsx
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface StartedCtx { started:boolean; setStarted:(v:boolean)=>void }
const Ctx = createContext<StartedCtx | null>(null);

export function StartedProvider({ children }:{ children: React.ReactNode }){
  const [started, setStarted] = useState<boolean>(()=> {
    try { return sessionStorage.getItem('__ae_started__') === '1'; } catch { return false; }
  });
  useEffect(()=>{ try { sessionStorage.setItem('__ae_started__', started? '1':'0'); } catch {} }, [started]);
  return <Ctx.Provider value={{ started, setStarted }}>{children}</Ctx.Provider>;
}

export function useStarted(){
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStarted must be used within StartedProvider');
  return ctx;
}
```

### `lib/world.ts`
```ts
export interface Metric { id: string; label: string; weight: number }
export interface RunConfig { generations: number; population: number; mutation: number; seed: number; model: string }
export interface CodeScore { code: string; score: number }
export interface GenerationSnapshot { codes: CodeScore[] }
export interface IslandData { id: string; gens: GenerationSnapshot[] }
export interface WorldData { islands: IslandData[]; overallBest: number[]; generations: number }

export function clamp(v:number, lo=0, hi=1){ return Math.max(lo, Math.min(hi, v)); }
export function mulberry32(seed:number){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function movingMax(values:number[]):number[]{
  const out:number[] = []; let m=-Infinity; for(let i=0;i<values.length;i++){ m=Math.max(m, values[i]); out.push(m); } return out;
}

function makeCode(id:string, gen:number, idx:number){ return `def algo_${id}_g${gen}_${idx}(...): pass`; }

export function generateWorld(opts?: { islands?: number; generations?: number; codesPerGen?: number; seed?: number }): WorldData {
  const islands = opts?.islands ?? 4;
  const generations = opts?.generations ?? 40;
  const codesPerGen = opts?.codesPerGen ?? 6;
  const rand = mulberry32((opts?.seed ?? 42) | 0);

  const worldIslands: IslandData[] = [];
  const overallPerGen: number[] = Array(generations).fill(0);

  for (let k=0;k<islands;k++) {
    const id = `island-${k+1}`;
    const gens: GenerationSnapshot[] = [];
    const islandFactor = 0.5 + k * 0.08;
    for (let g=0; g<generations; g++) {
      const target = clamp((g/(generations-1)) * (0.65 + rand()*0.25) * islandFactor, 0, 0.99);
      const codes: CodeScore[] = [];
      for (let c=0; c<codesPerGen; c++) {
        const jitter = (rand()-0.5) * 0.15;
        const score = clamp(target + jitter, 0, 1);
        codes.push({ code: makeCode(id, g, c), score });
      }
      gens.push({ codes });
      const maxHere = Math.max(...codes.map(x=>x.score));
      overallPerGen[g] = Math.max(overallPerGen[g], maxHere);
    }
    worldIslands.push({ id, gens });
  }

  return { islands: worldIslands, overallBest: movingMax(overallPerGen), generations };
}
```

### `lib/api.ts`
```ts
import type { Metric, RunConfig } from './world';

export async function startEvolution(payload: { code: string; evaluator?: string; metrics: Metric[]; config: RunConfig }){
  await new Promise((r)=>setTimeout(r, 80));
  if (!payload?.code) throw new Error('startEvolution: code required');
  if (!Array.isArray(payload?.metrics)) throw new Error('startEvolution: metrics must be array');
  console.log('startEvolution:success', { runId: `run_${Date.now()}` });
  return { ok: true as const, runId: `run_${Date.now()}` };
}
```

---

### `app/project-hub/page.tsx`
```tsx
'use client';
import { useMemo, useRef, useState } from 'react';
import MonacoEditor from '@/components/MonacoEditor';
import { useStarted } from '@/lib/state';
import { startEvolution } from '@/lib/api';
import type { Metric, RunConfig } from '@/lib/world';
import LineChart from '@/components/LineChart';
import { useRouter } from 'next/navigation';

const SAMPLE = `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n`;

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

  const usedSeed = useMemo(()=> chooseSeed(seedCode, code), [seedCode, code]);
  const hubRef = useRef<HTMLDivElement | null>(null);

  const handleHeroStart = () => {
    setStarted(true);
    setTimeout(()=> hubRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
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
            <button data-testid="start-evolution"
              className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-violet-700"
              onClick={async ()=>{
                await startEvolution({ code: usedSeed, evaluator: evaluatorText, metrics, config: cfg });
                router.push('/monitor');
              }}
            >Start Evolution</button>
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
```

---

### `app/monitor/page.tsx`
```tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import LineChart from '@/components/LineChart';
import Sparkline from '@/components/Sparkline';
import { generateWorld } from '@/lib/world';

function IslandCard({ island, currentGen }:{ island: ReturnType<typeof generateWorld>['islands'][number]; currentGen:number }){
  const maxSeries = useMemo(()=> island.gens.map(g=> Math.max(...g.codes.map(c=>c.score))), [island]);
  const seriesToNow = maxSeries.slice(0, Math.min(currentGen+1, maxSeries.length));
  const snap = island.gens[Math.min(currentGen, island.gens.length-1)];
  const topNow = [...snap.codes].sort((a,b)=> b.score - a.score).slice(0,3);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{island.id}</div>
        <div className="text-xs text-slate-500">Max now: {Math.max(...snap.codes.map(c=>c.score)).toFixed(3)}</div>
      </div>
      <Sparkline data={seriesToNow} height={64} testid={`spark-${island.id}`} />
      <div className="mt-3 space-y-1">
        {topNow.map((cs, idx)=> (
          <div key={idx} className="flex items-center justify-between text-xs">
            <code className="truncate text-slate-700">{cs.code}</code>
            <span className="ml-3 tabular-nums text-slate-600">{cs.score.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MonitorPage(){
  const world = useMemo(()=> generateWorld({ islands: 4, generations: 60, codesPerGen: 6, seed: 2025 }), []);
  const [gen, setGen] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);

  useEffect(()=>{
    if (paused) return; const id = setInterval(()=> setGen(g=> Math.min(world.generations-1, g+1)), 700); return ()=> clearInterval(id);
  }, [paused, world.generations]);

  const overallToNow = world.overallBest.slice(0, gen+1);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Monitoring Dashboard</h1>
          <p className="text-sm text-slate-500">Overall performance and island states</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">Gen <span className="font-semibold">{gen}</span> / {world.generations-1}</div>
          <button onClick={()=> setPaused(p=>!p)} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-violet-700">{paused?'Resume':'Pause'}</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-medium text-slate-900">Overall Best Fitness</div>
        <LineChart data={overallToNow} height={220} testid="chart-overall" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {world.islands.map((isl)=> (
          <IslandCard key={isl.id} island={isl} currentGen={gen} />
        ))}
      </div>

      <p className="text-xs text-slate-500">Demo data only. In a real app, stream updates via SSE/WebSocket and recompute series incrementally.</p>
    </div>
  );
}
```

### `app/compare/page.tsx`
```tsx
export default function ComparePage(){
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-semibold text-slate-900">Algorithm Comparison</h1>
      <p className="text-sm text-slate-500">Select two algorithms to compare. (Demo stub)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Left</div><pre className="text-xs text-slate-700">def bubble_sort(...)</pre></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Right</div><pre className="text-xs text-slate-700">def better_sort(...)</pre></div>
      </div>
    </div>
  );
}
```

### `app/results/page.tsx`
```tsx
export default function ResultsPage(){
  const rows = [
    { id: 'alg-1', fitness: 0.92, gen: 5, createdAt: '2024-12-08 14:30:22' },
    { id: 'alg-2', fitness: 0.89, gen: 4, createdAt: '2024-12-08 14:25:15' },
  ];
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-semibold text-slate-900">Results Workbench</h1>
      <div className="rounded-2xl border border-slate-200 bg-white">
        <table className="w-full table-fixed">
          <thead><tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="px-3 py-2">Algorithm ID</th><th className="px-3 py-2">Fitness</th><th className="px-3 py-2">Generation</th><th className="px-3 py-2">Created</th>
          </tr></thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-medium">{r.id}</td>
                <td className="px-3 py-3">{r.fitness.toFixed(2)}</td>
                <td className="px-3 py-3">Gen {r.gen}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{r.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```
