'use client';
import LineChart from './LineChart';
export default function Sparkline({ data, height=56, testid }:{ data:number[]; height?:number; testid?:string }){
  return <LineChart data={data} height={height} grid={false} testid={testid} />;
}