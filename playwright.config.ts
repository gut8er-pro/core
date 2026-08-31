import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  snapshotDir: './e2e/__screenshots__',
  updateSnapshots: 'missing',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    // The app UI defaults to German; these specs assert English copy, so pin
    // the language for every request. The middleware seeds NEXT_LOCALE from
    // Accept-Language, so this covers specs with no stored cookie too.
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet-landscape',
      use: { ...devices['iPad Pro 11 landscape'] },
    },
    {
      name: 'tablet-portrait',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
