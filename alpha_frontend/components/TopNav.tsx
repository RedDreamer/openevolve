'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStarted } from '@/lib/state';

export default function TopNav(){
  const pathname = usePathname();
  const { started } = useStarted();
  const Item = ({href, label}:{href:string; label:string}) => (
    <Link href={href} className={
      'px-4 py-2 rounded-lg text-base ' + (pathname===href? 'bg-violet-600 text-white':'hover:bg-slate-100 text-slate-700')
    }>
      {label}
    </Link>
  );
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 h-16 backdrop-blur shadow-sm">
      <div className="font-semibold text-slate-900 text-xl">AlphaEvolve</div>
      <div data-testid="nav-tabs" aria-hidden={!started} className="flex items-center gap-3">
        {started && <Item href="/project-hub" label="Project Hub"/>}
        {started && <Item href="/monitor" label="Monitor"/>}
        {started && <Item href="/compare" label="Compare"/>}
        {started && <Item href="/results" label="Results"/>}
      </div>
    </div>
  );
}