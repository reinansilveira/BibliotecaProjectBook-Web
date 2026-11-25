import { expect, test } from '@playwright/test';
import { ADMIN, expectNewestBook, signIn } from './support/api';

test.describe('Administration', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
  });

  test('an admin adds a book to the catalog', async ({ page }) => {
    const title = `Admin Book ${Date.now()}`;

    await page.goto('/admin/books');
    await page.getByRole('button', { name: 'Add book' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: 'Manually' }).click();
    const form = dialog.locator('#manual-form');
    await form.getByLabel('Title').fill(title);
    await form.getByLabel('Author').fill('Admin Author');
    await form.getByLabel('Genre').fill('Mystery');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(`“${title}” was added to the catalog.`)).toBeVisible();

    await expectNewestBook(page, title);
  });

  test('an admin opens every section', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/overview/);
    await expect(page.getByRole('heading', { name: 'Most borrowed' })).toBeVisible();

    const sections = page.getByRole('navigation', { name: 'Administration sections' });
    const paths: Record<string, string> = {
      Members: 'members',
      Fines: 'fines',
      Reports: 'reports',
      'Audit log': 'audit',
      Books: 'books',
      Overview: 'overview',
    };

    for (const [section, path] of Object.entries(paths)) {
      await sections.getByRole('link', { name: section }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/${path}`));
    }

    await sections.getByRole('link', { name: 'Reports' }).click();
    await expect(
      page.getByRole('heading', { name: 'Loans and overdue returns by month' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Most borrowed books' })).toBeVisible();
  });
});
