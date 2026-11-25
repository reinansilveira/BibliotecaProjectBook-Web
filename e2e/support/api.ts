import { APIRequestContext, expect, Page } from '@playwright/test';

export const ADMIN = {
  email: process.env['E2E_ADMIN_EMAIL'] ?? 'admin@library.local',
  password: process.env['E2E_ADMIN_PASSWORD'] ?? 'Admin@123',
};

export interface TestMember {
  name: string;
  email: string;
  password: string;
}

export function newMember(): TestMember {
  const id = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

  return { name: `E2E Reader ${id}`, email: `e2e-${id}@tests.com`, password: 'Password@123' };
}

let cachedAdminToken: Promise<string> | null = null;

async function requestAdminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post('/api/v1/auth/login', { data: ADMIN });
  expect(response.ok(), `admin sign-in failed with ${response.status()}`).toBeTruthy();

  return (await response.json()).accessToken as string;
}

export function adminToken(request: APIRequestContext): Promise<string> {
  cachedAdminToken ??= requestAdminToken(request).catch((error: unknown) => {
    cachedAdminToken = null;
    throw error;
  });

  return cachedAdminToken;
}

export async function expectNewestBook(page: Page, title: string): Promise<void> {
  await page.goto('/books?sort=Newest');
  await expect(page.locator('app-book-card a').first()).toHaveAttribute('aria-label', title);
}

export async function createBook(request: APIRequestContext, title: string): Promise<string> {
  const token = await adminToken(request);
  const response = await request.post('/api/v1/books', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      author: 'E2E Author',
      description: 'Created by the end-to-end tests.',
      genre: 'Mystery',
      copies: 1,
    },
  });
  expect(response.ok()).toBeTruthy();

  return (await response.json()).id as string;
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/books/);
}

export async function register(page: Page, member: TestMember): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Full name').fill(member.name);
  await page.getByLabel('Email').fill(member.email);
  await page.getByLabel('Phone').fill('555-0100');
  await page.getByLabel('Birth date').fill('1995-05-10');
  await page.getByLabel('Password').fill(member.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/books/);
}
