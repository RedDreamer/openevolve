'use client';
import React from 'react';

export default function LineChart({ data, width = 640, height = 200, grid = true, label, testid }:
  { data: number[]; width?: number; height?: number; grid?: boolean; label?: string; testid?: string }) {
  const m = 20;
  const w = width, h = height;
  const innerW = w - m * 2, innerH = h - m * 2;
  const len = Math.max(1, data.length);

  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const scale = maxV - minV || 1;

  const xs = (i: number) => m + (len === 1 ? innerW : (i * (innerW / (len - 1))));
  const ys = (v: number) => m + (innerH - ((v - minV) / scale * innerH));

  const pts = data.map((v, i) => `${xs(i)},${ys(v)}`).join(' ');

  const maxY = ys(maxV);
  const midY = ys(minV + scale / 2);
  const minY = ys(minV);

  return (
    <svg
      role="img"
      aria-label={label || 'line chart'}
      width={w}
      height={h}
      data-testid={testid}
      className="w-full text-violet-600"
    >
      {grid && (
        <g className="text-slate-300">
          <line x1={m} y1={maxY} x2={w - m} y2={maxY} stroke="currentColor" strokeDasharray="3 3" />
          <line x1={m} y1={midY} x2={w - m} y2={midY} stroke="currentColor" strokeDasharray="3 3" />
          <line x1={m} y1={minY} x2={w - m} y2={minY} stroke="currentColor" strokeDasharray="3 3" />
          <text x={w - m} y={maxY - 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            {maxV.toFixed(2)}
          </text>
          <text x={w - m} y={midY - 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            {(minV + scale / 2).toFixed(2)}
          </text>
          <text x={w - m} y={minY - 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            {minV.toFixed(2)}
          </text>
        </g>
      )}
      <polyline fill="none" stroke="currentColor" strokeWidth={2} points={pts} />
    </svg>
  );
}