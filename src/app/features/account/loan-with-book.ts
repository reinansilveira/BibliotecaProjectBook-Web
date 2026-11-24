import { forkJoin, map, Observable, of } from 'rxjs';
import { BooksApi } from '../../core/api/books-api';
import { Book, Loan, PagedResult } from '../../core/api/models';

export interface LoanWithBook extends Loan {
  book: Book;
}

export function withBooks(
  page: PagedResult<Loan>,
  booksApi: BooksApi,
): Observable<PagedResult<LoanWithBook>> {
  if (page.items.length === 0) {
    return of({ ...page, items: [] });
  }

  const books = page.items.map((loan) => booksApi.get(loan.bookId));

  return forkJoin(books).pipe(
    map((loadedBooks) => ({
      ...page,
      items: page.items.map((loan, index) => ({ ...loan, book: loadedBooks[index] })),
    })),
  );
}
