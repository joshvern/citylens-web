import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/PreviewImage', () => ({
  PreviewImage: ({ src, alt }: { src: string; alt: string }) => (
    <div data-testid="preview-image">{alt}:{src}</div>
  ),
}));

vi.mock('@/components/GeojsonMap', () => ({
  GeojsonMap: ({ url }: { url: string }) => <div data-testid="geojson-map">{url}</div>,
}));

vi.mock('@/components/MeshViewer', () => ({
  MeshViewer: ({ url }: { url: string }) => <div data-testid="mesh-viewer">{url}</div>,
}));

import { ArtifactsPanel } from '@/components/ArtifactsPanel';

describe('ArtifactsPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes named artifacts and renders the mesh viewer', () => {
    render(
      <ArtifactsPanel
        run={{
          run_id: 'run-1',
          artifacts: {
            preview: { name: 'preview.png', signed_url: 'https://example.test/preview.png' },
            change: { name: 'change.geojson', signed_url: 'https://example.test/change.geojson' },
            mesh: { name: 'mesh.ply', signed_url: 'https://example.test/mesh.ply' },
            summary: { name: 'run_summary.json', signed_url: 'https://example.test/run_summary.json' },
          },
        }}
      />,
    );

    expect(screen.getByTestId('preview-image')).toHaveTextContent('preview.png:https://example.test/preview.png');
    expect(screen.getByTestId('geojson-map')).toHaveTextContent('https://example.test/change.geojson');
    expect(screen.getByTestId('mesh-viewer')).toHaveTextContent('https://example.test/mesh.ply');
    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
  });

  it('renders summary QA and performance fields after loading', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          qa: {
            reference_case_id: '100 E 21st St Brooklyn, NY 11226',
            baseline_footprints_used: true,
            lidar_used: true,
            mask_iou: 0.91,
            change_polygon_f1: 0.87,
            mesh_footprint_iou: 0.86,
            parity_status: 'near_match',
          },
          performance: {
            total_runtime_seconds: 123.4,
            stage_timings_seconds: {
              fetch: 4.2,
              segment: 31.1,
              change: 6.8,
            },
          },
        }),
        text: async () => '',
      } as Response),
    );

    render(
      <ArtifactsPanel
        run={{
          run_id: 'run-3',
          artifacts: {
            preview: { name: 'preview.png', signed_url: 'https://example.test/preview.png' },
            change: { name: 'change.geojson', signed_url: 'https://example.test/change.geojson' },
            mesh: { name: 'mesh.ply', signed_url: 'https://example.test/mesh.ply' },
            summary: { name: 'run_summary.json', signed_url: 'https://example.test/run_summary.json' },
          },
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Load' }));

    expect(await screen.findByText('Reference case')).toBeInTheDocument();
    expect(screen.getByText('100 E 21st St Brooklyn, NY 11226')).toBeInTheDocument();
    expect(screen.getByText('0.91')).toBeInTheDocument();
    expect(screen.getByText('near_match')).toBeInTheDocument();
    expect(screen.getByText('3 stage timings recorded')).toBeInTheDocument();
  });

  it('shows a fallback when a mesh URL is missing', () => {
    render(
      <ArtifactsPanel
        run={{
          run_id: 'run-2',
          artifacts: {
            'preview.png': { name: 'preview.png', signed_url: 'https://example.test/preview.png' },
            'change.geojson': { name: 'change.geojson', signed_url: 'https://example.test/change.geojson' },
            'run_summary.json': { name: 'run_summary.json', signed_url: 'https://example.test/run_summary.json' },
            'mesh.ply': { name: 'mesh.ply' },
          },
        }}
      />,
    );

    expect(screen.getByText('No signed_url available for mesh.ply yet.')).toBeInTheDocument();
  });
});
