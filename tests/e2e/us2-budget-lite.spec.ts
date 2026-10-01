import { expect, test } from '@playwright/test';
import { addCategory, addItem, createLiteBudget, signUpAndCompleteProfile } from './helpers';

test('Lite budget with categories, items and buckets (US2, quickstart 3–4)', async ({ page }) => {
  await signUpAndCompleteProfile(page);
  await createLiteBudget(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Household 2027' })).toBeVisible();

  // System Unplanned categories exist and can't be renamed or deleted
  const unplanned = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Unplanned' }) });
  await expect(unplanned).toHaveCount(2);
  await expect(unplanned.first().getByRole('button', { name: /Delete Unplanned/ })).toHaveCount(0);

  await addCategory(page, 'Expenses', 'Housing');
  await addItem(page, 'Housing', { name: 'Rent', amount: '5000', exec: '2027-01-20' });

  await page.getByRole('link', { name: 'Rent' }).click();
  const rows = page.getByRole('row');
  await expect(rows).toHaveCount(13); // header + 12 buckets
  await expect(rows.nth(1)).toContainText('Jan 1 – Feb 4');
  await expect(rows.nth(2)).toContainText('Feb 5 – Mar 4');
  await expect(rows.nth(12)).toContainText('Dec 5 – Dec 31');

  // End date beyond the budget is clipped with a notice
  await page.getByRole('link', { name: 'Back to budget' }).click();
  await addCategory(page, 'Expenses', 'Subscriptions');
  await addItem(page, 'Subscriptions', { name: 'Netflix', amount: '20', exec: '2027-03-20', start: '2027-03-15', end: '2028-03-15' });
  await expect(page.getByText(/End date was set to the budget end/)).toBeVisible();

  // Overlapping USD budget is rejected; the same dates in COP are fine
  await createLiteBudget(page, { name: 'Overlap', start: '2027-06-01', end: '2028-05-31' });
  await expect(page.getByText(/already have a budget in this currency/).first()).toBeVisible();
  await createLiteBudget(page, { name: 'Pesos', currency: 'COP', start: '2027-06-01', end: '2028-05-31' });
  await expect(page.getByRole('heading', { level: 1, name: 'Pesos' })).toBeVisible();
});
