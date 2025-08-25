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