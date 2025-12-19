import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for MD Reader E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only - reduced to 1 retry for faster CI */
  retries: process.env.CI ? 1 : 0,
  /* Use multiple workers on CI for parallel execution */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use */
  reporter: process.env.CI 
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }], ['list']],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Disable video on CI for speed */
    video: process.env.CI ? 'off' : 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI ? 'npm run preview' : 'npm run dev',
    url: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global timeout for each test */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 15000,
  },
});
