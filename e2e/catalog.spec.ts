import { expect, test } from '@playwright/test';
import { createBook } from './support/api';

test.describe('Catalog', () => {
  test('visitors can browse the catalog without signing in', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Find your next great read' })).toBeVisible();
    await expect(page.locator('app-book-card').first()).toBeVisible();
  });

  test('searching from the header filters the catalog', async ({ page, request }) => {
    const title = `Searchable ${Date.now()}`;
    await createBook(request, title);

    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search books by title or author' }).fill(title);
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: `Results for “${title}”` })).toBeVisible();
    await expect(page.locator('app-book-card')).toHaveCount(1);
  });

  test('a book page shows the details and asks visitors to sign in to borrow', async ({
    page,
    request,
  }) => {
    const title = `Detail ${Date.now()}`;
    const id = await createBook(request, title);

    await page.goto(`/books/${id}`);

    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to borrow' })).toBeVisible();
  });
});

test.describe('Appearance', () => {
  test('the dark theme can be switched on and is remembered', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await page.getByRole('button', { name: 'Use dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Use light theme' })).toBeVisible();
  });
});
