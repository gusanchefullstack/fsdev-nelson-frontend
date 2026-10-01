import { expect, test } from '@playwright/test';
import { createSource, signUpAndCompleteProfile } from './helpers';

test('accounts, payors and vendors (US3, quickstart 2)', async ({ page }) => {
  await signUpAndCompleteProfile(page);

  await createSource(page, 'accounts', { name: 'Main Checking', type: 'Checking', balance: '10000' });
  await expect(page.getByRole('link', { name: /Main Checking/ })).toContainText('$10,000.00');

  await createSource(page, 'payors', { name: 'Acme Corp', type: 'Employer' });
  await expect(page.getByRole('link', { name: /Acme Corp/ })).toBeVisible();

  await createSource(page, 'vendors', { name: 'PGE', type: 'Utility' });
  await createSource(page, 'vendors', { name: 'Landlord', type: 'Housing / landlord' });
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(2);

  // Missing mandatory fields are highlighted
  await page.goto('/accounts/new');
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByText('Name is required')).toBeVisible();
  await expect(page.getByText('Choose a type')).toBeVisible();

  // Edit, then delete a vendor
  await page.goto('/vendors');
  await page.getByRole('link', { name: /PGE/ }).click();
  await page.getByLabel('Description (optional)').fill('Electricity and gas');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Changes saved')).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/vendors$/);
  await expect(page.getByRole('link', { name: /PGE/ })).toHaveCount(0);
});
