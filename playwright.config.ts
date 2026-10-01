import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    // Backend against the Neon development branch
    { command: 'npm --prefix ../fsdev-nelson-backend run dev', url: 'http://localhost:3000/api/auth/ok', reuseExistingServer: true, timeout: 60_000 },
    { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
  ],
});
