import { expect, test, type Locator, type Page } from '@playwright/test';
import { navTo, signUpAndCompleteProfile } from './helpers';

async function fillItem(scope: Locator, page: Page, item: { name: string; amount: string; exec: string }) {
  await scope.getByLabel('Name', { exact: true }).fill(item.name);
  await scope.getByLabel('Description').fill(`${item.name} item`);
  await scope.getByLabel('Estimated amount').fill(item.amount);
  await scope.getByLabel('First expected date').fill(item.exec);
  void page;
}

async function fillBasics(scope: Page | Locator, name: string) {
  await scope.getByLabel('Budget name').fill(name);
  await scope.getByLabel('Start date', { exact: true }).first().fill('2027-01-01');
  await scope.getByLabel('End date', { exact: true }).first().fill('2027-12-31');
}

async function structure(page: Page) {
  // [category, items...] per section, read from the budget page
  return page.getByRole('article').evaluateAll((articles) =>
    articles.map((a) => [a.querySelector('h3')?.textContent?.trim(), ...[...a.querySelectorAll('li a')].map((l) => l.textContent?.trim())].join('|')),
  );
}

test('Guided and Complete create the same budget; leaving saves nothing (US5, quickstart 8)', async ({ page }) => {
  test.setTimeout(120_000);
  await signUpAndCompleteProfile(page);

  // Leave midway: nothing is saved
  await page.goto('/budgets/new/guided');
  await fillBasics(page, 'Abandoned');
  await navTo(page, 'Budgets');
  await expect(page.getByRole('alertdialog')).toContainText('Leave without saving?');
  await page.getByRole('button', { name: 'Leave' }).click();
  await expect(page).toHaveURL(/\/budgets$/);
  await expect(page.getByText('Abandoned')).toHaveCount(0);

  // Guided
  await page.goto('/budgets/new/guided');
  await fillBasics(page, 'Guided 2027');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add income category' }).click();
  await page.getByLabel('Category name').fill('Salaries');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add item to Salaries' }).click();
  await fillItem(page.getByRole('group', { name: 'Item 1 in Salaries' }), page, { name: 'Salary', amount: '9850', exec: '2027-01-15' });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add expense category' }).click();
  await page.getByLabel('Category name').fill('Housing');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add item to Housing' }).click();
  await fillItem(page.getByRole('group', { name: 'Item 1 in Housing' }), page, { name: 'Rent', amount: '5000', exec: '2027-01-20' });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: /Review/ })).toBeVisible();
  await page.getByRole('button', { name: 'Create budget' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Guided 2027' })).toBeVisible();
  const guided = await structure(page);

  // Complete (COP so the period can repeat)
  await page.goto('/budgets/new/complete');
  await fillBasics(page, 'Complete 2027');
  await page.getByLabel('Currency').click();
  await page.getByRole('option', { name: /COP/ }).click();
  await page.getByRole('button', { name: 'Add income category' }).click();
  await page.getByRole('region', { name: 'income category 1' }).getByLabel('Category name').fill('Salaries');
  await page.getByRole('button', { name: 'Add item to Salaries' }).click();
  await fillItem(page.getByRole('group', { name: 'Item 1 in Salaries' }), page, { name: 'Salary', amount: '9850', exec: '2027-01-15' });
  await page.getByRole('button', { name: 'Add expense category' }).click();
  await page.getByRole('region', { name: 'expense category 2' }).getByLabel('Category name').fill('Housing');
  await page.getByRole('button', { name: 'Add item to Housing' }).click();
  await fillItem(page.getByRole('group', { name: 'Item 1 in Housing' }), page, { name: 'Rent', amount: '5000', exec: '2027-01-20' });
  await page.getByRole('button', { name: 'Create budget' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Complete 2027' })).toBeVisible();
  expect(await structure(page)).toEqual(guided);
});

test('Complete shows server-side errors next to the item', async ({ page }) => {
  await signUpAndCompleteProfile(page);
  await page.goto('/budgets/new/complete');
  await fillBasics(page, 'Errors 2027');
  await page.getByRole('button', { name: 'Add expense category' }).click();
  await page.getByLabel('Category name').fill('Housing');
  await page.getByRole('button', { name: 'Add item to Housing' }).click();
  const item = page.getByRole('group', { name: 'Item 1 in Housing' });
  await fillItem(item, page, { name: 'Rent', amount: '5000', exec: '2027-01-20' });
  await item.getByLabel('Start date').fill('2026-12-01');
  await page.getByRole('button', { name: 'Create budget' }).click();
  await expect(item.getByText(/before the budget starts/)).toBeVisible();
});
