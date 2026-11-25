import { expect, test } from '@playwright/test';
import { createBook } from './support/api';

test.describe('Catalog', () => {
  test('visitors can browse the catalog without signing in', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Find your next great read' })).toBeVisible();
    await expect(page.locator('app-book-card').first()).toBeVisible();
  });

  test('searching from the header filters the catalog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Search books by title or author' }).fill('Dracula');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Results for “Dracula”' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dracula', exact: true })).toBeVisible();
  });

  test('the header suggests books while typing', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Search books by title or author' }).fill('Drac');

    await page.getByRole('option', { name: /Dracula/ }).click();

    await expect(page).toHaveURL(/\/books\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: 'Dracula', level: 1 })).toBeVisible();
  });

  test('filters narrow the catalog by genre and format', async ({ page }) => {
    await page.goto('/books');
    await page.getByRole('button', { name: /^Gothic/ }).click();
    await page
      .getByRole('group', { name: 'Format' })
      .getByRole('button', { name: 'E-book' })
      .click();

    await expect(page).toHaveURL(/genre=Gothic/);
    await expect(page).toHaveURL(/format=Ebook/);
    await expect(page.getByRole('heading', { name: 'Gothic', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dracula', exact: true })).toBeVisible();
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

test.describe('Language', () => {
  test('the site can be switched to Brazilian Portuguese and remembers it', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('menuitem', { name: 'Português (Brasil)' }).click();

    await expect(
      page.getByRole('heading', { name: 'Encontre sua próxima grande leitura' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page).toHaveTitle('Catálogo · Biblioteca');

    await page.reload();
    await expect(page.getByRole('link', { name: 'Explorar o catálogo' })).toBeVisible();

    await page.getByRole('button', { name: 'Mudar idioma' }).click();
    await page.getByRole('menuitem', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Find your next great read' })).toBeVisible();
  });
});
