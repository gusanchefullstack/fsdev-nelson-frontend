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

export async function createLiteBudget(page: Page, opts: { name?: string; currency?: 'USD' | 'COP'; start?: string; end?: string } = {}) {
  await page.goto('/budgets/new/lite');
  await page.getByLabel('Budget name').fill(opts.name ?? 'Household 2027');
  if (opts.currency === 'COP') {
    await page.getByLabel('Currency').click();
    await page.getByRole('option', { name: /COP/ }).click();
  }
  await page.getByLabel('Start date').fill(opts.start ?? '2027-01-01');
  await page.getByLabel('End date').fill(opts.end ?? '2027-12-31');
  await page.getByRole('button', { name: 'Create budget' }).click();
}

export async function addCategory(page: Page, section: 'Income' | 'Expenses', name: string) {
  await page.getByRole('region', { name: section }).getByRole('button', { name: 'Add category' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByRole('button', { name: 'Add category' }).click();
  await expect(dialog).toBeHidden();
}

export async function addItem(
  page: Page,
  category: string,
  item: { name: string; amount: string; exec: string; start?: string; end?: string; frequency?: string },
) {
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: category, exact: true }) });
  await card.getByRole('button', { name: 'Item' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(item.name);
  await dialog.getByLabel('Description').fill(`${item.name} payment`);
  await dialog.getByLabel('Estimated amount').fill(item.amount);
  if (item.frequency) {
    await dialog.getByLabel('Frequency').click();
    await page.getByRole('option', { name: item.frequency, exact: true }).click();
  }
  await dialog.getByLabel(/expected date/i).fill(item.exec);
  if (item.start) await dialog.getByLabel('Start date').fill(item.start);
  if (item.end) await dialog.getByLabel('End date').fill(item.end);
  await dialog.getByRole('button', { name: 'Add item' }).click();
  await expect(dialog).toBeHidden();
}

export async function chooseSelect(page: Page, label: string, option: string | RegExp) {
  await page.getByLabel(label, { exact: true }).click();
  await page.getByRole('option', { name: option, exact: typeof option === 'string' }).click();
}

export async function createSource(
  page: Page,
  kind: 'accounts' | 'payors' | 'vendors',
  data: { name: string; type: string; currency?: 'USD' | 'COP'; balance?: string },
) {
  await page.goto(`/${kind}/new`);
  await page.getByLabel('Name', { exact: true }).fill(data.name);
  await chooseSelect(page, 'Type', data.type);
  if (data.currency === 'COP') await chooseSelect(page, 'Currency', /COP/);
  if (data.balance !== undefined) await page.getByLabel('Current balance').fill(data.balance);
  await page.getByRole('button', { name: /^Save / }).click();
  await expect(page).toHaveURL(new RegExp(`/${kind}$`));
}

/** API call with the page's session cookie — fast setup for UI tests. */
export async function apiPost<T = { id: string }>(page: Page, path: string, body: object): Promise<T> {
  const res = await page.request.post(`/api/v1${path}`, { data: body });
  expect(res.status(), `${path}: ${await res.text()}`).toBeLessThan(300);
  return (await res.json()) as T;
}

/** Quickstart world: USD 2027 budget with Housing/Rent, Main Checking, Pesos (COP), Acme, Landlord, PGE. */
export async function seedWorld(page: Page) {
  const budget = await apiPost<{ id: string }>(page, '/budgets', { name: 'Household 2027', currency: 'USD', startDate: '2027-01-01', endDate: '2027-12-31' });
  const housing = await apiPost(page, `/budgets/${budget.id}/categories`, { kind: 'EXPENSE', name: 'Housing' });
  const rent = await apiPost(page, `/categories/${housing.id}/items`, {
    name: 'Rent',
    description: 'Apartment',
    estimatedAmount: '5000.00',
    estimatedExecutionDate: '2027-01-20',
    frequency: 'MONTHLY',
  });
  const checking = await apiPost(page, '/financial-accounts', { name: 'Main Checking', type: 'CHECKING', currency: 'USD', openingBalance: '10000.00' });
  await apiPost(page, '/financial-accounts', { name: 'Pesos', type: 'SAVINGS', currency: 'COP', openingBalance: '0' });
  await apiPost(page, '/payors', { name: 'Acme Corp', type: 'EMPLOYER', currency: 'USD' });
  const landlord = await apiPost(page, '/vendors', { name: 'Landlord', type: 'HOUSING', currency: 'USD' });
  await apiPost(page, '/vendors', { name: 'PGE', type: 'UTILITY', currency: 'USD' });
  return { budget, housing, rent, checking, landlord };
}

export async function recordExpense(
  page: Page,
  t: { item: string; amount: string; date: string; account?: string; vendor?: string; time?: string },
  opts: { expectSaved?: boolean } = {},
) {
  await page.goto('/transactions/new');
  await chooseSelect(page, 'Budget item', t.item);
  await page.getByLabel('Amount').fill(t.amount);
  await page.getByLabel('Date').fill(t.date);
  await page.getByLabel('Time').fill(t.time ?? '10:00');
  await chooseSelect(page, 'From (account)', t.account ?? 'Main Checking');
  await chooseSelect(page, 'To (vendor)', t.vendor ?? 'Landlord');
  await page.getByRole('button', { name: 'Save transaction' }).click();
  if (opts.expectSaved ?? true) await expect(page).toHaveURL(/\/transactions$/);
}

/** Clicks a main-navigation link, opening the mobile menu first when needed. */
export async function navTo(page: Page, label: string) {
  const menu = page.getByRole('button', { name: 'Open menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label }).filter({ visible: true }).click();
}
