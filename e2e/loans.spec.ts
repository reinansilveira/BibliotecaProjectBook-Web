import { expect, test } from '@playwright/test';
import { createBook, newMember, register } from './support/api';

test.describe('Loans', () => {
  test('a member borrows a printed copy and sees it in My library', async ({ page, request }) => {
    const title = `Borrowable ${Date.now()}`;
    const id = await createBook(request, title);
    await register(page, newMember());

    await page.goto(`/books/${id}`);
    await page.getByRole('button', { name: 'Borrow print copy' }).click();

    await expect(page).toHaveURL(/\/account\/loans/);
    const loan = page.getByRole('article', { name: title });
    await expect(loan).toBeVisible();
    await expect(loan.getByText('Active')).toBeVisible();
    await expect(loan.getByText('7 days left')).toBeVisible();
    await expect(loan.getByRole('button', { name: 'Renew for 7 more days' })).toBeVisible();
  });

  test('when every copy is out, the next reader joins the waiting list', async ({
    page,
    browser,
    request,
  }) => {
    const title = `Popular ${Date.now()}`;
    const id = await createBook(request, title);
    await register(page, newMember());
    await page.goto(`/books/${id}`);
    await page.getByRole('button', { name: 'Borrow print copy' }).click();
    await expect(page).toHaveURL(/\/account\/loans/);

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await register(otherPage, newMember());
    await otherPage.goto(`/books/${id}`);

    await expect(otherPage.getByRole('button', { name: 'Borrow print copy' })).toHaveCount(0);
    await otherPage.getByRole('button', { name: 'Join the waiting list' }).click();
    await expect(otherPage.getByText('Your position: 1.')).toBeVisible();

    await otherPage.goto('/account/reservations');
    await expect(otherPage.getByText('Position 1 in line')).toBeVisible();
    await otherContext.close();
  });

  test('members cannot open the admin area', async ({ page }) => {
    await register(page, newMember());

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/books/);
    await expect(page.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);
  });
});
