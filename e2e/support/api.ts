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

export async function adminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post('/api/auth/login', { data: ADMIN });
  expect(response.ok()).toBeTruthy();

  return (await response.json()).accessToken as string;
}

export async function createBook(request: APIRequestContext, title: string): Promise<string> {
  const token = await adminToken(request);
  const response = await request.post('/api/books', {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, author: 'E2E Author', description: 'Created by the end-to-end tests.' },
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
