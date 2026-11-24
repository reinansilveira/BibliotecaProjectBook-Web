import { expect, test } from '@playwright/test';
import { createBook, newMember, register } from './support/api';

test.describe('Loans', () => {
  test('a member borrows a book and sees it in My loans', async ({ page, request }) => {
    const title = `Borrowable ${Date.now()}`;
    const id = await createBook(request, title);
    await register(page, newMember());

    await page.goto(`/books/${id}`);
    await page.getByRole('button', { name: 'Borrow this book' }).click();

    await expect(page).toHaveURL(/\/my-loans/);
    const loan = page.getByRole('article', { name: title });
    await expect(loan).toBeVisible();
    await expect(loan.getByText('Active')).toBeVisible();
    await expect(loan.getByText('7 days left')).toBeVisible();
  });

  test('a book on loan cannot be borrowed by someone else', async ({ page, browser, request }) => {
    const title = `Popular ${Date.now()}`;
    const id = await createBook(request, title);
    await register(page, newMember());
    await page.goto(`/books/${id}`);
    await page.getByRole('button', { name: 'Borrow this book' }).click();
    await expect(page).toHaveURL(/\/my-loans/);

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await register(otherPage, newMember());
    await otherPage.goto(`/books/${id}`);
    await otherPage.getByRole('button', { name: 'Borrow this book' }).click();

    await expect(otherPage.getByText('The book is already on loan.')).toBeVisible();
    await otherContext.close();
  });

  test('members cannot open the admin area', async ({ page }) => {
    await register(page, newMember());

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/books/);
    await expect(page.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);
  });
});
