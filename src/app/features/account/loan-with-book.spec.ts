import { firstValueFrom, of } from 'rxjs';
import { BooksApi } from '../../core/api/books-api';
import { Book, Loan, PagedResult } from '../../core/api/models';
import { withBooks } from './loan-with-book';

const book = (id: string): Book => ({
  id,
  title: `Book ${id}`,
  author: 'Author',
  description: '',
  createdAt: '',
});

const loan = (id: string, bookId: string): Loan => ({
  id,
  bookId,
  memberId: 'member-1',
  loanDate: '2026-03-01',
  dueDate: '2026-03-08',
  status: 'Active',
});

const page = (items: Loan[]): PagedResult<Loan> => ({
  items,
  page: 1,
  pageSize: 10,
  totalItems: items.length,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

describe('withBooks', () => {
  it('attaches the book to each loan', async () => {
    const booksApi = { get: (id: string) => of(book(id)) } as unknown as BooksApi;

    const result = await firstValueFrom(
      withBooks(page([loan('l1', 'b1'), loan('l2', 'b2')]), booksApi),
    );

    expect(result.items.map((item) => item.book.title)).toEqual(['Book b1', 'Book b2']);
  });

  it('does not call the API for an empty page', async () => {
    const get = vi.fn();

    const result = await firstValueFrom(withBooks(page([]), { get } as unknown as BooksApi));

    expect(result.items).toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });
});
