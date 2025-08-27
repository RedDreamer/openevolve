/*
export interface Metric { id: string; label: string; weight: number }
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
*/

// Demo world generator is commented out for now
export {};