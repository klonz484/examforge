import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    // Build into a separate folder using the real GitHub Pages base path.
    // Never overwrite dist/, which contains the artifact that will be deployed.
    command: 'GITHUB_ACTIONS=true npm run build -- --outDir dist-e2e && npm run preview -- --outDir dist-e2e --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/examforge/',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      GITHUB_ACTIONS: 'true',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
  },
})
