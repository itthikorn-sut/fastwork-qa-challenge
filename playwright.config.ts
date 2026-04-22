import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './automation/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: 'test-results',
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx ts-node --transpile-only -r tsconfig-paths/register automation/utils/mockServer.ts',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
