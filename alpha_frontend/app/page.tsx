'use client';

import { useRouter } from 'next/navigation';
import LineChart from '@/components/LineChart';
import { useStarted } from '@/lib/state';

export default function HomePage() {
  const router = useRouter();
  const { setStarted } = useStarted();

  const handleStart = () => {
    setStarted(true);
    router.push('/project-hub');
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-violet-50">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-24">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                AlphaEvolve · Evolutionary Coding
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
                Let your code evolve on its own
              </h1>
              <p className="mt-4 text-slate-600">
                AlphaEvolve combines genetic search and multi-metric evaluation to automatically generate improved implementations.
                Monitor progress and compare variants in real time.
              </p>
              <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-slate-600">
                <li>
                  Bring your own <span className="font-medium">seed algorithm</span> and <span className="font-medium">evaluator</span>
                </li>
                <li>Optimize for latency, accuracy or any custom metric</li>
                <li>Track performance history and revisit past runs</li>
              </ul>
              <div className="mt-8 flex items-center gap-3">
                <button
                  data-testid="landing-start"
                  onClick={handleStart}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-violet-700"
                >
                  Start
                </button>
                <span className="text-sm text-slate-500">Jump into the project hub</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-slate-900">Evolution progress</div>
              <div className="mt-2 text-xs text-slate-500">Demo data</div>
              <div className="mt-3">
                <LineChart
                  data={[0.1, 0.12, 0.2, 0.18, 0.28, 0.33, 0.38, 0.42, 0.5, 0.58, 0.63, 0.71, 0.76, 0.8, 0.83, 0.86, 0.9, 0.93, 0.95, 0.98]}
                  height={180}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">Key features</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="text-2xl">🤖</div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Automated evolution</h3>
              <p className="mt-2 text-sm text-slate-600">
                Generate and refine code implementations with minimal manual work.
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="text-2xl">🧪</div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Custom evaluation</h3>
              <p className="mt-2 text-sm text-slate-600">
                Guide evolution with your own scripts and metrics.
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="text-2xl">📊</div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Interactive monitoring</h3>
              <p className="mt-2 text-sm text-slate-600">
                Visualize progress and compare variants in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">1. Provide seed</div>
              <p className="mt-2 text-sm text-slate-600">Upload an initial algorithm or start from scratch.</p>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">2. Write evaluator</div>
              <p className="mt-2 text-sm text-slate-600">Define the metrics that matter to you.</p>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">3. Evolve automatically</div>
              <p className="mt-2 text-sm text-slate-600">The system explores variants in parallel.</p>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">4. Review results</div>
              <p className="mt-2 text-sm text-slate-600">Compare performance curves and choose the best.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Example Results Section */}
      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">Example evolution</h2>
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
    </main>
  );
}
