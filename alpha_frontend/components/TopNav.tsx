'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStarted } from '@/lib/state';

export default function TopNav() {
  const pathname = usePathname();
  const { started } = useStarted();

  const Item = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={
        'px-4 py-2 rounded-lg text-base transition-colors ' +
        (pathname === href
          ? 'bg-violet-600 text-white'
          : 'text-slate-700 hover:bg-slate-100')
      }
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-gradient-to-r from-white to-violet-50/40 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
        <Link href="/" className="font-semibold text-slate-900 text-xl">
          AlphaEvolve
        </Link>
        <nav data-testid="nav-tabs" aria-hidden={!started} className="flex items-center gap-3">
          {started && <Item href="/project-hub" label="Project Hub" />}
          {started && <Item href="/monitor" label="Monitor" />}
          {started && <Item href="/compare" label="Compare" />}
          {started && <Item href="/results" label="Results" />}
        </nav>
      </div>
    </header>
  );
}
