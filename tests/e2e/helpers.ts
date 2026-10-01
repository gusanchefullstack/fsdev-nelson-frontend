import { expect, type Page } from '@playwright/test';

let n = 0;
export function uniqueUser() {
  n += 1;
  const tag = `${Date.now().toString(36)}${n}${Math.floor(Math.random() * 1000)}`;
  return { email: `e2e_${tag}@example.com`, username: `e2e_${tag}`, password: 'Passw0rd!' };
}

export async function chooseFromCombobox(page: Page, label: string, search: string, option: RegExp | string) {
  await page.getByLabel(label, { exact: true }).click();
  await page.getByPlaceholder(/Search/).last().fill(search);
  await page.getByRole('listbox').last().getByRole('option', { name: option }).first().click();
}

/** Signs up through the UI and completes the profile; ends on the dashboard. */
export async function signUpAndCompleteProfile(page: Page, user = uniqueUser()) {
  await page.goto('/signup');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/onboarding\/profile/);

  await page.getByRole('radio', { name: 'Avatar 3' }).check({ force: true });
  await page.getByLabel('First name').fill('Ana');
  await page.getByLabel('Last name').fill('Lopez');
  await page.getByLabel('Address').fill('123 Main St');
  await page.getByLabel('City').fill('Bogota');
  await page.getByLabel('State / province').fill('Cundinamarca');
  await page.getByLabel('Postal code').fill('110111');
  await chooseFromCombobox(page, 'Country', 'Colombia', /Colombia/);
  await page.getByLabel('Phone country code').selectOption('CO');
  await page.getByLabel('Phone number').fill('3001234567');
  await chooseFromCombobox(page, 'Time zone', 'Bogota', /America\/Bogota/);
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page).toHaveURL(/dashboard/);
  return user;
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/$/);
}
