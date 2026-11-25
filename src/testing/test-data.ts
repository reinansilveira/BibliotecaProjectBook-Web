import { Book, Loan, PagedResult } from '../app/core/api/models';

export function aBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'Dune',
    author: 'Frank Herbert',
    description: 'Science fiction classic.',
    genre: 'Science Fiction',
    isbn: null,
    publishedYear: 1965,
    coverUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    totalCopies: 2,
    availableCopies: 1,
    hasEbook: false,
    ebookLicenses: 0,
    availableEbookLicenses: 0,
    waitingCount: 0,
    averageRating: 0,
    ratingsCount: 0,
    ...overrides,
  };
}

export function aLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: 'loan-1',
    bookId: 'book-1',
    bookTitle: 'Dune',
    bookAuthor: 'Frank Herbert',
    coverUrl: null,
    memberId: 'member-1',
    format: 'Print',
    loanDate: '2026-03-01T00:00:00Z',
    dueDate: '2026-03-08T00:00:00Z',
    returnedAt: null,
    status: 'Active',
    renewalsLeft: 1,
    readingProgress: 0,
    readingLocation: null,
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
