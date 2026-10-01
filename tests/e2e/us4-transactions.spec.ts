import { expect, test } from '@playwright/test';
import { chooseSelect, recordExpense, seedWorld, signUpAndCompleteProfile } from './helpers';

test('record transactions into buckets (US4, quickstart 5, 6, 10)', async ({ page }) => {
  test.setTimeout(90_000);
  await signUpAndCompleteProfile(page);
  const w = await seedWorld(page);

  // Scenario 5: expense lands in the Mar 5 – Apr 4 bucket and lowers the balance
  await recordExpense(page, { item: 'Rent', amount: '5000', date: '2027-03-18' });
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByRole('list', { name: 'Transactions' })).toContainText('Main Checking → Landlord');

  await recordExpense(page, { item: 'Rent', amount: '100', date: '2027-03-25' });
  await page.goto(`/budgets/${w.budget.id}/items/${w.rent.id}`);
  const march = page.getByRole('row').filter({ hasText: 'Mar 5 – Apr 4' });
  await expect(march).toContainText('$5,100.00');
  await expect(march).toContainText('Mar 25, 2027');
  await expect(march).toContainText('Over');

  await page.goto('/accounts');
  await expect(page.getByRole('link', { name: /Main Checking/ })).toContainText('$4,900.00');

  // Outside the item range is rejected with a friendly message
  await recordExpense(page, { item: 'Rent', amount: '10', date: '2028-01-10' }, { expectSaved: false });
  await expect(page.getByText(/Choose a date in that range/).first()).toBeVisible();

  // A COP account can't be used on the USD budget: it isn't offered
  await page.goto('/transactions/new');
  await page.getByLabel('From (account)', { exact: true }).click();
  await expect(page.getByRole('option', { name: 'Pesos' })).toHaveCount(0);
  await page.keyboard.press('Escape');

  // Changing the profile time zone keeps existing transactions as recorded (FR-031)
  await page.goto('/profile');
  await page.getByLabel('Time zone', { exact: true }).click();
  await page.getByPlaceholder(/Search/).last().fill('Tokyo');
  await page.getByRole('listbox').last().getByRole('option', { name: /Asia\/Tokyo/ }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Profile updated')).toBeVisible();
  await page.goto('/transactions');
  await expect(page.getByRole('list', { name: 'Transactions' })).toContainText('Mar 25, 2027');

  // Scenario 6: unplanned spending shows as unbudgeted
  await recordExpense(page, { item: 'Unplanned', amount: '300', date: '2027-03-10', vendor: 'PGE' });
  await expect(page).toHaveURL(/\/transactions$/);
  await page.goto(`/budgets/${w.budget.id}`);
  await expect(page.getByRole('region', { name: 'Totals' })).toContainText('$300.00');

  // Scenario 10: in-use vendor can't be deleted; deleting Housing restores the balance
  await page.goto(`/vendors/${w.landlord.id}`);
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('alertdialog')).toContainText("can't be deleted");
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText(/has transactions/).last()).toBeVisible();

  await page.goto(`/budgets/${w.budget.id}`);
  await page.getByRole('button', { name: 'Delete Housing' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('1 item');
  await expect(dialog).toContainText('12 buckets');
  await expect(dialog).toContainText('2 transactions');
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: 'Housing' })).toHaveCount(0);
  await page.goto('/accounts');
  await expect(page.getByRole('link', { name: /Main Checking/ })).toContainText('$9,700.00');
});

test('editing a transaction keeps its original time zone label', async ({ page }) => {
  await signUpAndCompleteProfile(page);
  await seedWorld(page);
  await recordExpense(page, { item: 'Rent', amount: '42', date: '2027-02-10' });
  await page.getByRole('link', { name: /Rent/ }).first().click();
  await expect(page.getByText('Recorded in America/Bogota')).toBeVisible();
  await page.getByLabel('Amount').fill('43');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Transaction updated')).toBeVisible();
  await chooseSelect(page, 'Budget item', 'Rent');
});
