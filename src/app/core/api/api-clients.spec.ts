import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { aBook, aPage } from '../../../testing/test-data';
import { BlacklistApi } from './blacklist-api';
import { BooksApi } from './books-api';
import { LoansApi } from './loans-api';
import { MembersApi } from './members-api';
import { ReportsApi } from './reports-api';

describe('API clients', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists books with paging and search', () => {
    TestBed.inject(BooksApi).list({ page: 2, pageSize: 12, search: 'dune' }).subscribe();

    expect(http.expectOne('/api/books?page=2&pageSize=12&search=dune').request.method).toBe('GET');
  });

  it('caches books by id and forgets them after an update', () => {
    const api = TestBed.inject(BooksApi);

    api.get('book-1').subscribe();
    api.get('book-1').subscribe();
    http.expectOne('/api/books/book-1').flush(aBook());

    api.update('book-1', { title: 'Dune', author: 'Frank Herbert', description: '' }).subscribe();
    http.expectOne({ method: 'PUT', url: '/api/books/book-1' }).flush(aBook());

    api.get('book-1').subscribe();
    http.expectOne('/api/books/book-1').flush(aBook());
  });

  it('creates and deletes books', () => {
    const api = TestBed.inject(BooksApi);

    api.create({ title: 'Emma', author: 'Jane Austen', description: '' }).subscribe();
    api.delete('book-2').subscribe();

    expect(http.expectOne({ method: 'POST', url: '/api/books' }).request.body.title).toBe('Emma');
    http.expectOne({ method: 'DELETE', url: '/api/books/book-2' });
  });

  it('borrows and returns loans', () => {
    const api = TestBed.inject(LoansApi);

    api.borrow('book-1', 'member-1').subscribe();
    api.return('loan-1').subscribe();

    expect(http.expectOne({ method: 'POST', url: '/api/loans' }).request.body).toEqual({
      bookId: 'book-1',
      memberId: 'member-1',
    });
    http.expectOne({ method: 'POST', url: '/api/loans/loan-1/return' });
  });

  it('reads and updates members', () => {
    const api = TestBed.inject(MembersApi);

    api.me().subscribe();
    api.list({ page: 1, pageSize: 10, search: 'ana' }).subscribe();
    api.loans('member-1', 3, 10).subscribe();
    api
      .update('member-1', {
        name: 'Ana',
        email: 'ana@email.com',
        phone: '1',
        birthDate: '1990-01-01',
      })
      .subscribe();
    api.delete('member-1').subscribe();

    http.expectOne('/api/auth/me');
    http.expectOne('/api/members?page=1&pageSize=10&search=ana').flush(aPage([]));
    http.expectOne('/api/members/member-1/loans?page=3&pageSize=10');
    http.expectOne({ method: 'PUT', url: '/api/members/member-1' });
    http.expectOne({ method: 'DELETE', url: '/api/members/member-1' });
  });

  it('manages the blacklist', () => {
    const api = TestBed.inject(BlacklistApi);

    api.list(1, 10).subscribe();
    api.refresh().subscribe();
    api.remove('member-1').subscribe();

    http.expectOne('/api/blacklist?page=1&pageSize=10');
    http.expectOne({ method: 'POST', url: '/api/blacklist/refresh' });
    http.expectOne({ method: 'DELETE', url: '/api/blacklist/member-1' });
  });

  it('requests the reports and skips empty filters', () => {
    const api = TestBed.inject(ReportsApi);

    api.mostBorrowedBooks(null, '2026-03-31', 10).subscribe();
    api.overdueByMonth(2026).subscribe();

    http.expectOne('/api/reports/most-borrowed-books?to=2026-03-31&top=10');
    http.expectOne('/api/reports/overdue-by-month?year=2026');
  });
});
