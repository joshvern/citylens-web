'use client';

import type { ReactNode } from 'react';
import { useSelectedLayoutSegments } from 'next/navigation';

// Route checks use layout segments, not usePathname(): during ISR background
// regeneration usePathname() is null in this root-layout client component, and
// a wrong server class survives hydration.
export function isParcelWorkspaceRoute(segments: string[]): boolean {
  return segments[0] === 'parcel-intel';
}

export function SiteMain({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const isParcelWorkspace = isParcelWorkspaceRoute(segments);
  // The homepage lays out its own full-width dateline and column.
  const isHome = segments.length === 0;

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
  const segments = useSelectedLayoutSegments();
  if (isParcelWorkspaceRoute(segments)) {
    return null;
  }
  return children;
}
