import { expect, test } from '@playwright/test';
import { ADMIN, signIn } from './support/api';

test.describe('Administration', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
  });

  test('an admin adds a book to the catalog', async ({ page }) => {
    const title = `Admin Book ${Date.now()}`;

    await page.goto('/admin/books');
    await page.getByRole('button', { name: 'Add book' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Title').fill(title);
    await dialog.getByLabel('Author').fill('Admin Author');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(`“${title}” was added to the catalog.`)).toBeVisible();

    await page.goto(`/books?search=${encodeURIComponent(title)}`);
    await expect(page.locator('app-book-card')).toHaveCount(1);
  });

  test('an admin opens every section', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/overview/);
    await expect(page.getByRole('heading', { name: 'Most borrowed' })).toBeVisible();

    const sections = page.getByRole('navigation', { name: 'Administration sections' });

    for (const section of ['Members', 'Blacklist', 'Reports', 'Books', 'Overview']) {
      await sections.getByRole('link', { name: section }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/${section.toLowerCase()}`));
    }

    await sections.getByRole('link', { name: 'Reports' }).click();
    await expect(
      page.getByRole('heading', { name: 'Loans and overdue returns by month' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Most borrowed books' })).toBeVisible();
  });
});
