import { test as base } from '@playwright/test';

// Automated map journeys exercise CityLens behavior, not the public OSM tile
// service. Context routing covers every page before its first navigation,
// including the older subdomain URL used by the run-artifact map.
const testTile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#e9eee6"/></svg>';

export const test = base.extend({
  context: async ({ context }, runTest) => {
    await context.route(
      /^https:\/\/(?:[a-z]\.)?tile\.openstreetmap\.org\//,
      (route) => route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: testTile,
      }),
    );
    await runTest(context);
  },
});

export { expect } from '@playwright/test';
