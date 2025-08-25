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