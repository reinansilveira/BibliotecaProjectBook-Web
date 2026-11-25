import { expect, test } from '@playwright/test';
import { newMember, register } from './support/api';

test.describe('Authentication', () => {
  test('a visitor creates an account and is signed in', async ({ page }) => {
    const member = newMember();

    await register(page, member);

    await expect(page.getByText(`Welcome, ${member.name}!`)).toBeVisible();
    await expect(page.getByRole('link', { name: 'My library' })).toBeVisible();
  });

  test('the session survives a page reload', async ({ page }) => {
    await register(page, newMember());

    await page.reload();

    await expect(page.getByRole('link', { name: 'My library' })).toBeVisible();
  });

  test('protected pages send visitors to the login page', async ({ page }) => {
    await page.goto('/account/loans');

    await expect(page).toHaveURL(/\/login\?returnUrl=%2Faccount%2Floans/);
  });

  test('wrong credentials show an error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@tests.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('signing out ends the session', async ({ page }) => {
    await register(page, newMember());

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();
  });
});
