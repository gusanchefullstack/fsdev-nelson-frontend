import { expect, test, type Page } from '@playwright/test';
import { signUpAndCompleteProfile } from './helpers';

const RAW = /stack|TypeError|ReferenceError|at Object\.|ECONN|Prisma|<html|undefined/i;

async function expectNoRawErrors(page: Page) {
  expect(await page.locator('body').innerText()).not.toMatch(RAW);
}

test('server and network failures show friendly messages and keep form data (FR-049, SC-008)', async ({ page }) => {
  await signUpAndCompleteProfile(page);
  await page.goto('/accounts/new');
  await page.getByLabel('Name', { exact: true }).fill('Emergency fund');
  await page.getByLabel('Type').click();
  await page.getByRole('option', { name: 'Savings' }).click();
  await page.getByLabel('Current balance').fill('2500');

  // 500 from the API
  await page.route('**/api/v1/financial-accounts', (r) =>
    r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side. Please try again.' } }) }),
  );
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByText('Something went wrong on our side. Please try again.')).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Emergency fund');

  // Network failure
  await page.unroute('**/api/v1/financial-accounts');
  await page.route('**/api/v1/financial-accounts', (r) => r.abort('failed'));
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByText("We couldn't reach Nelson. Check your connection and try again.")).toBeVisible();

  // A proxy error page (HTML) never leaks to the user
  await page.unroute('**/api/v1/financial-accounts');
  await page.route('**/api/v1/financial-accounts', (r) => r.fulfill({ status: 502, contentType: 'text/html', body: '<html><body>Bad Gateway TypeError at Object.x</body></html>' }));
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByText('Something went wrong. Please try again.')).toBeVisible();
  await expect(page.getByLabel('Current balance')).toHaveValue('2500');
  await expectNoRawErrors(page);

  // Recovery: once the API is back the same form saves
  await page.unroute('**/api/v1/financial-accounts');
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page).toHaveURL(/\/accounts$/);
});

test('a failing page load shows the friendly error page with retry', async ({ page }) => {
  await signUpAndCompleteProfile(page);
  await page.route('**/api/v1/budgets', (r) => r.abort('failed'));
  await page.goto('/budgets/new/lite');
  await page.route('**/api/v1/dashboard', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await page.goto('/dashboard');
  await expect(page.getByText(/Something went wrong/).first()).toBeVisible({ timeout: 15_000 });
  await expectNoRawErrors(page);
});

test('an expired session returns to login and then back (edge case)', async ({ page }) => {
  const user = await signUpAndCompleteProfile(page);
  await page.context().clearCookies();
  await page.goto('/budgets');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByLabel('Email or username').fill(user.username);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/budgets$/);
});
