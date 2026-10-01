import { expect, test } from '@playwright/test';
import { apiPost, recordExpense, seedWorld, signUpAndCompleteProfile } from './helpers';

test('threshold alerts appear within 5 seconds and can be managed (US8, quickstart 7, SC-006)', async ({ page }) => {
  test.setTimeout(90_000);
  await signUpAndCompleteProfile(page);
  const w = await seedWorld(page);
  // 5,100 is within 10% of 5,000: no alert yet
  for (const [amount, d] of [['5000.00', '2027-03-18'], ['100.00', '2027-03-25']] as const) {
    await apiPost(page, '/transactions', {
      kind: 'EXPENSE', amount, currency: 'USD', occurredAt: `${d}T10:00:00-05:00`,
      itemId: w.rent.id, financialAccountId: w.checking.id, vendorId: w.landlord.id,
    });
  }
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Alerts', exact: true })).toBeVisible();

  // 450 more → 5,550 > 5,500: alert
  const started = Date.now();
  await recordExpense(page, { item: 'Rent', amount: '450', date: '2027-03-28' });
  const bell = page.getByRole('button', { name: /Alerts, \d+ unread/ });
  await expect(bell).toBeVisible({ timeout: 5_000 });
  expect(Date.now() - started).toBeLessThan(5_000 + 3_000); // save + redirect + badge, well inside SC-006
  await expect(page.getByText(/Rent is \$550\.00 over its \$5,000\.00 estimate/).first()).toBeVisible();

  await bell.click();
  const panel = page.getByRole('list', { name: 'Alerts' });
  await expect(panel).toContainText('Rent is $550.00 over');
  await panel.getByRole('button', { name: 'Mark as read' }).first().click();
  await expect(page.getByRole('button', { name: 'Alerts', exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Dismiss' }).first().click();
  await expect(page.getByText("You're all caught up.")).toBeVisible();
});
