'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Download, FileJson, Image as ImageIcon } from 'lucide-react';

import type { RunResponse, ArtifactRecord } from '@/lib/types';
import { safeJsonStringify } from '@/lib/utils';
import { PreviewImage } from '@/components/PreviewImage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RunSummaryPanel } from '@/components/RunSummaryPanel';

const GeojsonMap = dynamic(
  () => import('@/components/GeojsonMap').then((mod) => mod.GeojsonMap),
  {
    ssr: false,
    loading: () => <div className="text-sm text-slate-600">Loading change.geojson viewer…</div>,
  },
);

const MeshViewer = dynamic(
  () => import('@/components/MeshViewer').then((mod) => mod.MeshViewer),
  {
    ssr: false,
    loading: () => <div className="text-sm text-slate-600">Loading mesh viewer…</div>,
  },
);

const EXPECTED = ['preview.png', 'change.geojson', 'mesh.ply', 'run_summary.json'] as const;

type ExpectedArtifactName = (typeof EXPECTED)[number];

function isExpectedArtifactName(v: string): v is ExpectedArtifactName {
  return (EXPECTED as readonly string[]).includes(v);
}

function pickUrl(a?: ArtifactRecord): string | null {
  if (!a) return null;
  const u = (a.signed_url ?? a.url) as string | undefined;
  return u && u.trim().length > 0 ? u : null;
}

function normalizeArtifacts(run?: RunResponse): Record<ExpectedArtifactName, ArtifactRecord | undefined> {
  const rawArtifacts = run?.artifacts;
  const map = (
    Array.isArray(rawArtifacts)
      ? Object.fromEntries(
          rawArtifacts
            .filter((artifact): artifact is ArtifactRecord => Boolean(artifact))
            .map((artifact, index) => [String(index), artifact]),
        )
      : (rawArtifacts ?? {})
  ) as Record<string, ArtifactRecord>;

  const direct = {
    'preview.png': map['preview.png'],
    'change.geojson': map['change.geojson'],
    'mesh.ply': map['mesh.ply'],
    'run_summary.json': map['run_summary.json'],
  } as const;

  const missing = EXPECTED.filter((k) => !direct[k]);
  if (missing.length === 0) return { ...direct };

  // Some backends may key artifacts by id but include the filename in a `name` field.
  const byName: Partial<Record<ExpectedArtifactName, ArtifactRecord>> = {};
  for (const v of Object.values(map)) {
    const n = typeof v?.name === 'string' ? v.name : undefined;
    if (n && isExpectedArtifactName(n) && !byName[n]) byName[n] = v;
  }

  return {
    'preview.png': direct['preview.png'] ?? byName['preview.png'],
    'change.geojson': direct['change.geojson'] ?? byName['change.geojson'],
    'mesh.ply': direct['mesh.ply'] ?? byName['mesh.ply'],
    'run_summary.json': direct['run_summary.json'] ?? byName['run_summary.json'],
  };
}

export function ArtifactsPanel({ run }: { run?: RunResponse }) {
  const artifacts = useMemo(() => normalizeArtifacts(run), [run]);
  const previewUrl = pickUrl(artifacts['preview.png']);
  const changeUrl = pickUrl(artifacts['change.geojson']);
  const meshUrl = pickUrl(artifacts['mesh.ply']);
  const summaryUrl = pickUrl(artifacts['run_summary.json']);

  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<Record<string, unknown> | null>(null);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setSummaryText(null);
    setSummaryData(null);
    setSummaryErr(null);
    setSummaryLoading(false);
  }, [summaryUrl, run?.run_id]);

  function errorMessage(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  async function loadSummary() {
    if (!summaryUrl) return;
    setSummaryLoading(true);
    setSummaryErr(null);
    setSummaryText(null);
    setSummaryData(null);
    try {
      const res = await fetch(summaryUrl);
      if (!res.ok) throw new Error(`run_summary.json fetch failed (${res.status})`);
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        const json = await res.json();
        setSummaryData((json && typeof json === 'object' ? (json as Record<string, unknown>) : null) ?? null);
        setSummaryText(safeJsonStringify(json, 2));
      } else {
        const txt = await res.text();
        setSummaryText(txt);
      }
    } catch (e: unknown) {
      setSummaryErr(errorMessage(e));
    } finally {
      setSummaryLoading(false);
    }
  }

  if (!run) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium">Artifacts</div>
        <div className="p-4 text-sm text-slate-600">Run data not loaded yet.</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="text-sm font-medium">Artifacts</div>
        <div className="text-xs text-slate-600">Expected: {EXPECTED.join(', ')}</div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4" /> preview.png
            </div>
            {previewUrl && (
              <a
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-4 w-4" /> Download
              </a>
            )}
          </div>
          {previewUrl ? (
            <ErrorBoundary title="preview.png" message="The preview image could not be rendered.">
              <PreviewImage src={previewUrl} alt="preview.png" />
            </ErrorBoundary>
          ) : (
            <div className="text-sm text-slate-600">No signed_url available for preview.png yet.</div>
          )}
        </div>

        {/* GeoJSON */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileJson className="h-4 w-4" /> change.geojson
            </div>
            {changeUrl && (
              <a
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                href={changeUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-4 w-4" /> Download
              </a>
            )}
          </div>
          {changeUrl ? (
            <ErrorBoundary title="change.geojson" message="The change map could not be rendered.">
              <GeojsonMap url={changeUrl} />
            </ErrorBoundary>
          ) : (
            <div className="text-sm text-slate-600">No signed_url available for change.geojson yet.</div>
          )}
        </div>

        {/* Mesh */}
        {meshUrl ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Download className="h-4 w-4" /> mesh.ply
              </div>
              <a
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                href={meshUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-4 w-4" /> Download
              </a>
            </div>
            <ErrorBoundary title="mesh.ply" message="The mesh viewer could not be rendered.">
              <MeshViewer url={meshUrl} />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No signed_url available for mesh.ply yet.
          </div>
        )}

        <RunSummaryPanel
          summaryUrl={summaryUrl}
          summary={summaryData}
          rawText={summaryText}
          loading={summaryLoading}
          error={summaryErr}
          onLoad={loadSummary}
        />
      </div>
    </div>
  );
}
