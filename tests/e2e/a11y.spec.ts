import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { apiPost, seedWorld, signUpAndCompleteProfile, uniqueUser } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const found: string[] = [];

async function audit(page: Page, label: string) {
  // Let lazy content and charts settle
  await page.getByRole('main').first().waitFor();
  await page.waitForTimeout(700);
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of violations) {
    found.push(`${label}: ${v.id} (${v.impact}) ${v.help} → ${v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')} ${n.failureSummary?.split('\n')[1] ?? ''}`).join(' | ')}`);
  }
}

test.afterEach(() => {
  const all = found.splice(0);
  expect(all, all.join('\n')).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`WCAG 2.2 AA – ${scheme} (SC-009)`, () => {
    test.use({ colorScheme: scheme });

    test('public screens', async ({ page }) => {
      for (const path of ['/', '/login', '/signup']) {
        await page.goto(path);
        await audit(page, path);
      }
    });

    test('app screens', async ({ page }) => {
      test.setTimeout(150_000);
      const user = uniqueUser();
      await page.goto('/signup');
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Username').fill(user.username);
      await page.getByLabel('Password', { exact: true }).fill(user.password);
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page).toHaveURL(/onboarding/);
      await audit(page, 'onboarding');
      await page.context().clearCookies();
      await signUpAndCompleteProfile(page);
      const w = await seedWorld(page);
      await apiPost(page, '/transactions', {
        kind: 'EXPENSE', amount: '5600.00', currency: 'USD', occurredAt: '2027-03-18T10:00:00-05:00',
        itemId: w.rent.id, financialAccountId: w.checking.id, vendorId: w.landlord.id,
      });
      const tx = await apiPost<{ transaction: { id: string } }>(page, '/transactions', {
        kind: 'EXPENSE', amount: '10.00', currency: 'USD', occurredAt: '2027-04-18T10:00:00-05:00',
        itemId: w.rent.id, financialAccountId: w.checking.id, vendorId: w.landlord.id,
      });
      const paths = [
        '/dashboard',
        '/budgets',
        '/budgets/new/lite',
        '/budgets/new/guided',
        '/budgets/new/complete',
        `/budgets/${w.budget.id}`,
        `/budgets/${w.budget.id}/items/${w.rent.id}`,
        `/budgets/${w.budget.id}/reports`,
        `/budgets/${w.budget.id}/reports?tab=top`,
        `/budgets/${w.budget.id}/reports?tab=projection`,
        `/budgets/${w.budget.id}/reports?tab=insights`,
        '/accounts',
        '/accounts/new',
        `/accounts/${w.checking.id}`,
        '/payors',
        '/vendors',
        `/vendors/${w.landlord.id}`,
        '/transactions',
        '/transactions/new',
        `/transactions/${tx.transaction.id}`,
        '/profile',
      ];
      for (const path of paths) {
        await page.goto(path);
        await audit(page, path);
      }
      // Overlays: alerts panel and the mobile menu
      await page.goto('/dashboard');
      await page.getByRole('button', { name: /^Alerts/ }).click();
      await audit(page, 'alerts panel');
    });
  });
}

test('keyboard only: skip link, sign up and log in (FR-048)', async ({ page }) => {
  const user = uniqueUser();
  await page.goto('/signup');
  // Reach the first field by keyboard within a few stops (logo, theme toggle, …)
  const email = page.getByLabel('Email');
  for (let i = 0; i < 6 && !(await email.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(email).toBeFocused();
  await page.keyboard.type(user.email);
  await page.keyboard.press('Tab');
  await page.keyboard.type(user.username);
  await page.keyboard.press('Tab');
  await page.keyboard.type(user.password);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/onboarding/);

  await page.context().clearCookies();
  const existing = await signUpAndCompleteProfile(page);
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email or username').focus();
  await page.keyboard.type(existing.username);
  await page.keyboard.press('Tab');
  await page.keyboard.type(existing.password);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/dashboard/);

  // Skip link is the first stop and moves focus to the main content
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});
