import { expect, test } from '@playwright/test';

test('demo mode renders a precomputed run and its artifacts', async ({ page }) => {
  await page.route('**/v1/demo/featured', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        featured: [
          {
            run_id: 'demo-1',
            title: 'Brooklyn demo',
            address: '100 E 21st St Brooklyn, NY 11226',
          },
        ],
      }),
    });
  });

  await page.route('**/v1/demo/runs/demo-1', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        run_id: 'demo-1',
        status: 'succeeded',
        stage: 'complete',
        progress: 1,
        artifacts: {
          preview: { name: 'preview.png', signed_url: 'https://example.test/preview.png' },
          change: { name: 'change.geojson', signed_url: 'https://example.test/change.geojson' },
          mesh: { name: 'mesh.ply', signed_url: 'https://example.test/mesh.ply' },
          summary: { name: 'run_summary.json', signed_url: 'https://example.test/run_summary.json' },
        },
      }),
    });
  });

  await page.route('https://example.test/preview.png', async (route) => {
    await route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  });
  await page.route('https://example.test/change.geojson', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { kind: 'added' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[73.9, 40.7], [73.91, 40.7], [73.91, 40.71], [73.9, 40.71], [73.9, 40.7]]],
            },
          },
          {
            type: 'Feature',
            properties: { kind: 'removed' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[73.92, 40.7], [73.93, 40.7], [73.93, 40.71], [73.92, 40.71], [73.92, 40.7]]],
            },
          },
        ],
      }),
    });
  });
  await page.route('https://example.test/mesh.ply', async (route) => {
    await route.fulfill({
      contentType: 'text/plain',
      body: `ply
format ascii 1.0
element vertex 4
property float x
property float y
property float z
element face 2
property list uchar int vertex_indices
end_header
0 0 0
1 0 0
1 1 0
0 1 0
3 0 1 2
3 0 2 3
`,
    });
  });
  await page.route('https://example.test/run_summary.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
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
    });
  });

  await page.goto('/');
  await expect(page.getByText(/Demo mode \(precomputed\)/i)).toBeVisible();
  await page.getByLabel('Select a featured demo run').selectOption('demo-1');

  await expect(page).toHaveURL(/\/runs\/demo-1\?demo=1/);
  await expect(page.getByRole('heading', { name: 'Run demo-1' })).toBeVisible();
  await expect(page.getByText('Demo run')).toBeVisible();
  await expect(page.getByText('preview.png', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('canvas')).toBeVisible();

  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.getByText('Reference case')).toBeVisible();
  await expect(page.getByText('Added: 1')).toBeVisible();
  await expect(page.getByText('Removed: 1')).toBeVisible();
});
