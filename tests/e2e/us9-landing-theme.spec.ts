import { expect, test } from '@playwright/test';
import { signUpAndCompleteProfile } from './helpers';

test('landing shows the hero, actions and an animated hummingbird (US9)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Every dollar, on the wing.');
  await expect(page.getByRole('link', { name: /Create your budget/ })).toHaveAttribute('href', '/signup');
  await expect(page.getByRole('main').getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  // The WebGL canvas loads lazily
  await expect(page.locator('canvas')).toHaveCount(1, { timeout: 10_000 });
});

test('reduced motion shows the static hummingbird instead (FR-044)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('main svg polygon').first()).toBeVisible();
});

test('theme choice persists, logged out and logged in (FR-045)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await signUpAndCompleteProfile(page);
  // The choice made while logged out carries into the app
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const saved = page.waitForResponse((r) => r.url().includes('/me/preferences'));
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  // Stored on the server too: survives clearing local storage
  await saved;
  await page.evaluate(() => localStorage.clear());
  await page.goto('/dashboard');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
