import { Book, Loan, PagedResult } from '../app/core/api/models';

export function aBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'Dune',
    author: 'Frank Herbert',
    description: 'Science fiction classic.',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function aLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: 'loan-1',
    bookId: 'book-1',
    memberId: 'member-1',
    loanDate: '2026-03-01T00:00:00Z',
    dueDate: '2026-03-08T00:00:00Z',
    status: 'Active',
    ...overrides,
  };
}

export function aPage<T>(items: T[]): PagedResult<T> {
  return {
    items,
    page: 1,
    pageSize: 10,
    totalItems: items.length,
    totalPages: items.length === 0 ? 0 : 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}
