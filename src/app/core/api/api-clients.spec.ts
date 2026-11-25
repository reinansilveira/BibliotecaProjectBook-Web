import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { aBook, aPage } from '../../../testing/test-data';
import { absoluteApiUrl } from './api-url';
import { BooksApi } from './books-api';
import {
  AccountApi,
  AuditApi,
  FinesApi,
  NotificationsApi,
  ReservationsApi,
  ReviewsApi,
} from './library-api';
import { LoansApi } from './loans-api';
import { MembersApi } from './members-api';
import { ReportsApi } from './reports-api';

const book = { title: 'Dune', author: 'Frank Herbert', description: '', genre: 'Science Fiction' };

describe('API clients', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists books with every catalog filter and skips empty ones', () => {
    TestBed.inject(BooksApi)
      .list({
        page: 2,
        pageSize: 12,
        search: 'dune',
        genre: 'Science Fiction',
        format: 'Ebook',
        availableOnly: true,
        sort: 'Rating',
        yearFrom: 1950,
      })
      .subscribe();

    expect(
      http.expectOne(
        '/api/v1/books?page=2&pageSize=12&search=dune&genre=Science%20Fiction&format=Ebook&availableOnly=true&sort=Rating&yearFrom=1950',
      ).request.method,
    ).toBe('GET');
  });

  it('caches books by id and forgets them after an update', () => {
    const api = TestBed.inject(BooksApi);

    api.get('book-1').subscribe();
    api.get('book-1').subscribe();
    http.expectOne('/api/v1/books/book-1').flush(aBook());

    api.update('book-1', book).subscribe();
    http.expectOne({ method: 'PUT', url: '/api/v1/books/book-1' }).flush(aBook());

    api.get('book-1').subscribe();
    http.expectOne('/api/v1/books/book-1').flush(aBook());
  });

  it('creates, imports and deletes books', () => {
    const api = TestBed.inject(BooksApi);

    api.create({ ...book, copies: 2 }).subscribe();
    api.lookup('9780141439600').subscribe();
    api.import({ isbn: '9780141439600', copies: 1, genre: null }).subscribe();
    api.delete('book-2').subscribe();

    expect(http.expectOne({ method: 'POST', url: '/api/v1/books' }).request.body.copies).toBe(2);
    http.expectOne('/api/v1/books/lookup?isbn=9780141439600');
    http.expectOne({ method: 'POST', url: '/api/v1/books/import' });
    http.expectOne({ method: 'DELETE', url: '/api/v1/books/book-2' });
  });

  it('reads suggestions, genres and related books', () => {
    const api = TestBed.inject(BooksApi);

    api.suggestions('du').subscribe();
    api.genres().subscribe();
    api.alsoRead('book-1').subscribe();
    api.waitingList('book-1').subscribe();

    http.expectOne('/api/v1/books/suggestions?query=du');
    http.expectOne('/api/v1/books/genres');
    http.expectOne('/api/v1/books/book-1/also-read');
    http.expectOne('/api/v1/books/book-1/reservations');
  });

  it('manages copies and e-books', () => {
    const api = TestBed.inject(BooksApi);
    const file = new File(['epub'], 'dune.epub');

    api.copies('book-1').subscribe();
    api.addCopies('book-1', 3).subscribe();
    api.withdrawCopy('book-1', 'copy-1').subscribe();
    api.uploadEbook('book-1', file, 5).subscribe();
    api.importGutenberg('book-1', 84, 2).subscribe();
    api.setLicenses('book-1', 4).subscribe();

    http.expectOne({ method: 'GET', url: '/api/v1/books/book-1/copies' });
    expect(
      http.expectOne({ method: 'POST', url: '/api/v1/books/book-1/copies' }).request.body,
    ).toEqual({ quantity: 3 });
    http.expectOne({ method: 'DELETE', url: '/api/v1/books/book-1/copies/copy-1' });
    const upload = http.expectOne('/api/v1/books/book-1/ebook').request.body as FormData;
    expect(upload.get('Licenses')).toBe('5');
    expect(http.expectOne('/api/v1/books/book-1/ebook/gutenberg').request.body).toEqual({
      gutenbergId: 84,
      licenses: 2,
    });
    http.expectOne({ method: 'PUT', url: '/api/v1/books/book-1/ebook/licenses' });
  });

  it('borrows, renews, returns and reads loans', () => {
    const api = TestBed.inject(LoansApi);

    api.borrow('book-1', 'member-1', 'Ebook').subscribe();
    api.renew('loan-1').subscribe();
    api.return('loan-1').subscribe();
    api.readingLink('loan-1').subscribe();
    api.saveProgress('loan-1', 'epubcfi(/6/4)', 42).subscribe();

    expect(http.expectOne({ method: 'POST', url: '/api/v1/loans' }).request.body).toEqual({
      bookId: 'book-1',
      memberId: 'member-1',
      format: 'Ebook',
    });
    http.expectOne({ method: 'POST', url: '/api/v1/loans/loan-1/renew' });
    http.expectOne({ method: 'POST', url: '/api/v1/loans/loan-1/return' });
    http.expectOne({ method: 'POST', url: '/api/v1/loans/loan-1/reading-link' });
    expect(http.expectOne('/api/v1/loans/loan-1/progress').request.body).toEqual({
      location: 'epubcfi(/6/4)',
      percentage: 42,
    });
  });

  it('reads and updates members and their account', () => {
    const api = TestBed.inject(MembersApi);

    api.me().subscribe();
    api.list({ page: 1, pageSize: 10, search: 'ana' }).subscribe();
    api.loans('member-1', 3, 10).subscribe();
    api.reservations('member-1').subscribe();
    api.fines('member-1', 'Unpaid').subscribe();
    api.standing('member-1').subscribe();
    api.readingStats('member-1').subscribe();
    api.wishlist('member-1').subscribe();
    api.addToWishlist('member-1', 'book-1').subscribe();
    api.removeFromWishlist('member-1', 'book-1').subscribe();
    api
      .update('member-1', {
        name: 'Ana',
        email: 'ana@email.com',
        phone: '1',
        birthDate: '1990-01-01',
      })
      .subscribe();
    api.delete('member-1').subscribe();

    http.expectOne('/api/v1/auth/me');
    http.expectOne('/api/v1/members?page=1&pageSize=10&search=ana').flush(aPage([]));
    http.expectOne('/api/v1/members/member-1/loans?page=3&pageSize=10');
    http.expectOne('/api/v1/members/member-1/reservations?page=1&pageSize=50');
    http.expectOne('/api/v1/members/member-1/fines?status=Unpaid&page=1&pageSize=50');
    http.expectOne('/api/v1/members/member-1/standing');
    http.expectOne('/api/v1/members/member-1/reading-stats');
    http.expectOne({ method: 'GET', url: '/api/v1/members/member-1/wishlist' });
    http.expectOne({ method: 'PUT', url: '/api/v1/members/member-1/wishlist/book-1' });
    http.expectOne({ method: 'DELETE', url: '/api/v1/members/member-1/wishlist/book-1' });
    http.expectOne({ method: 'PUT', url: '/api/v1/members/member-1' });
    http.expectOne({ method: 'DELETE', url: '/api/v1/members/member-1' });
  });

  it('handles reservations, reviews and fines', () => {
    TestBed.inject(ReservationsApi).create('book-1', 'member-1', 'Print').subscribe();
    TestBed.inject(ReservationsApi).cancel('res-1').subscribe();
    TestBed.inject(ReviewsApi).list('book-1', 1, 5).subscribe();
    TestBed.inject(ReviewsApi).mine('book-1').subscribe();
    TestBed.inject(ReviewsApi).save('book-1', { rating: 5, comment: 'Great' }).subscribe();
    TestBed.inject(ReviewsApi).delete('book-1').subscribe();
    TestBed.inject(FinesApi).list('Unpaid', 1, 10).subscribe();
    TestBed.inject(FinesApi).pay('fine-1').subscribe();
    TestBed.inject(FinesApi).waive('fine-1').subscribe();

    http.expectOne({ method: 'POST', url: '/api/v1/reservations' });
    http.expectOne({ method: 'DELETE', url: '/api/v1/reservations/res-1' });
    http.expectOne('/api/v1/books/book-1/reviews?page=1&pageSize=5');
    http.expectOne({ method: 'GET', url: '/api/v1/books/book-1/reviews/mine' });
    http.expectOne({ method: 'PUT', url: '/api/v1/books/book-1/reviews/mine' });
    http.expectOne({ method: 'DELETE', url: '/api/v1/books/book-1/reviews/mine' });
    http.expectOne('/api/v1/fines?status=Unpaid&page=1&pageSize=10');
    http.expectOne('/api/v1/fines/fine-1/pay');
    http.expectOne('/api/v1/fines/fine-1/waive');
  });

  it('handles notifications, audit and account recovery', () => {
    const notifications = TestBed.inject(NotificationsApi);
    const account = TestBed.inject(AccountApi);

    notifications.list(true, 1, 8).subscribe();
    notifications.unreadCount().subscribe();
    notifications.markRead('n-1').subscribe();
    notifications.markAllRead().subscribe();
    TestBed.inject(AuditApi).list({ page: 1, pageSize: 15, entityType: 'Book' }).subscribe();
    account.forgotPassword('ana@email.com').subscribe();
    account.resetPassword('token', 'secret1').subscribe();
    account.confirmEmail('token').subscribe();
    account.resendConfirmation().subscribe();
    account.changePassword('old', 'new-secret').subscribe();

    http.expectOne('/api/v1/notifications?unreadOnly=true&page=1&pageSize=8');
    http.expectOne('/api/v1/notifications/unread-count');
    http.expectOne('/api/v1/notifications/n-1/read');
    http.expectOne('/api/v1/notifications/read-all');
    http.expectOne('/api/v1/audit?page=1&pageSize=15&entityType=Book');
    http.expectOne('/api/v1/auth/forgot-password');
    http.expectOne('/api/v1/auth/reset-password');
    http.expectOne('/api/v1/auth/confirm-email');
    http.expectOne('/api/v1/auth/resend-confirmation');
    http.expectOne('/api/v1/auth/change-password');
  });

  it('requests the reports, exports and maintenance', () => {
    const api = TestBed.inject(ReportsApi);

    api.dashboard().subscribe();
    api.mostBorrowedBooks(null, '2026-03-31', 10).subscribe();
    api.overdueByMonth(2026).subscribe();
    api.export('overdue-by-month', { year: 2026 }).subscribe();
    api.runMaintenance().subscribe();

    http.expectOne('/api/v1/reports/dashboard');
    http.expectOne('/api/v1/reports/most-borrowed-books?to=2026-03-31&top=10');
    http.expectOne('/api/v1/reports/overdue-by-month?year=2026');
    expect(
      http.expectOne('/api/v1/reports/overdue-by-month/export?year=2026').request.responseType,
    ).toBe('blob');
    http.expectOne({ method: 'POST', url: '/api/v1/maintenance/run' });
  });

  it('turns relative API paths into absolute ones', () => {
    expect(absoluteApiUrl('/api/v1/ebooks/1/content')).toBe('/api/v1/ebooks/1/content');
    expect(absoluteApiUrl('api/v1/x')).toBe('/api/v1/x');
    expect(absoluteApiUrl('https://cdn.example.com/a')).toBe('https://cdn.example.com/a');
  });
});
