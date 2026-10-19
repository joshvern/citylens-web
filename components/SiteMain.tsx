'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export function SiteMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isParcelWorkspace =
    pathname === '/parcel-intel' || pathname?.startsWith('/parcel-intel/');
  // The homepage lays out its own full-width dateline and column.
  const isHome = pathname === '/';

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={
        isParcelWorkspace
          ? 'ws-tabular w-full min-w-0 flex-1 px-3 pb-3 outline-none md:px-4'
          : isHome
            ? 'w-full flex-1 outline-none'
            : 'mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none'
      }
    >
      {children}
    </main>
  );
}

export function SiteFooterBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/parcel-intel' || pathname?.startsWith('/parcel-intel/')) {
    return null;
  }
  return children;
}
