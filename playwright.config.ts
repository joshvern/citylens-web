import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'line',
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: process.env.CI
      ? 'npm run start -- --hostname 127.0.0.1 --port 3000'
      : 'npm run dev -- --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      // Force the SSR-side featured-demos fetcher to fail fast during e2e
      // by pointing it at a non-listening URL. This makes RunForm fall
      // through to its client-side fetch, which Playwright's `page.route`
      // mocks can intercept. Without this, the homepage's Server
      // Component would hit api.citylens.dev directly and bypass the
      // test's network mocks entirely.
      CITYLENS_API_INTERNAL_URL: 'http://127.0.0.1:1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
