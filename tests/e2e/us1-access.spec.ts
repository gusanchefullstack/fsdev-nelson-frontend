import { expect, test } from '@playwright/test';
import { logout, signUpAndCompleteProfile, uniqueUser } from './helpers';

test('sign up, complete profile, log out and log back in with username (US1)', async ({ page }) => {
  const user = await signUpAndCompleteProfile(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ana');

  await logout(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);

  await page.getByLabel('Email or username').fill(user.username);
  await page.getByLabel('Password', { exact: true }).fill('wrong-pass1');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid email/username or password.');

  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test('the app is blocked until the profile is complete (FR-003)', async ({ page }) => {
  const user = uniqueUser();
  await page.goto('/signup');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/onboarding\/profile/);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/onboarding\/profile/);

  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByText('First name is required')).toBeVisible();
});
