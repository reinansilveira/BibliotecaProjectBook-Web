import { HttpErrorResponse } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { buttonWithText, text } from '../../../testing/dom';
import { aBook, aLoan, aPage } from '../../../testing/test-data';
import { BooksApi } from '../../core/api/books-api';
import { ReservationsApi, ReviewsApi } from '../../core/api/library-api';
import { LoansApi } from '../../core/api/loans-api';
import { MembersApi } from '../../core/api/members-api';
import { Book } from '../../core/api/models';
import { AuthService, Session } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { WishlistStore } from '../../core/wishlist/wishlist-store';
import { BookDetailPage, formatOptions } from './book-detail-page';

const member: Session = { memberId: 'member-1', name: 'Ana', role: 'Member', accessToken: 'token' };

describe('BookDetailPage', () => {
  const session = signal<Session | null>(null);
  const book = signal<Book>(aBook({ title: 'Dune' }));
  const borrow = vi.fn();
  const reserve = vi.fn();
  const notifier = { success: vi.fn(), error: vi.fn() };
  const wishlist = { has: vi.fn().mockReturnValue(false), toggle: vi.fn() };

  beforeEach(() => {
    session.set(null);
    book.set(aBook({ title: 'Dune' }));
    borrow.mockReset();
    reserve.mockReset();
    notifier.error.mockReset();
    notifier.success.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: BooksApi,
          useValue: {
            get: () => of(book()),
            refresh: () => of(book()),
            alsoRead: () => of([aBook({ id: 'book-4', title: 'Hyperion', author: 'Dan Simmons' })]),
            list: () =>
              of(
                aPage([
                  aBook({ title: 'Dune' }),
                  aBook({ id: 'book-2', title: 'Children of Dune' }),
                  aBook({ id: 'book-3', title: 'Emma', author: 'Jane Austen' }),
                ]),
              ),
          },
        },
        { provide: LoansApi, useValue: { borrow } },
        { provide: ReservationsApi, useValue: { create: reserve } },
        {
          provide: ReviewsApi,
          useValue: { list: () => of(aPage([])), mine: () => of(null) },
        },
        {
          provide: MembersApi,
          useValue: {
            standing: () =>
              of({
                canBorrow: true,
                activeLoans: 0,
                maxActiveLoans: 3,
                overdueLoans: 0,
                unpaidFines: 0,
                currency: 'USD',
                reasons: [],
              }),
          },
        },
        { provide: WishlistStore, useValue: wishlist },
        { provide: Notifier, useValue: notifier },
        {
          provide: AuthService,
          useValue: { session, isAuthenticated: computed(() => session() !== null) },
        },
      ],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(BookDetailPage);
    fixture.componentRef.setInput('id', 'book-1');
    await fixture.whenStable();

    return fixture;
  }

  it('asks visitors to sign in before borrowing', async () => {
    const fixture = await render();

    expect(text(fixture)).toContain('Dune');
    expect(text(fixture)).toContain('Sign in to borrow');
    expect(text(fixture)).toContain('1 of 2 available');
  });

  it('shows what readers also read and other books by the same author', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(text(fixture)).toContain('Readers also read');
    expect(text(fixture)).toContain('Hyperion');
    expect(text(fixture)).toContain('More by Frank Herbert');
    expect(element.querySelectorAll('.shelf app-book-card')).toHaveLength(2);
  });

  it('borrows the printed book for the signed-in member', async () => {
    session.set(member);
    borrow.mockReturnValue(of(aLoan()));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await render();

    buttonWithText(fixture, 'Borrow print copy').click();

    expect(borrow).toHaveBeenCalledWith('book-1', 'member-1', 'Print');
    expect(notifier.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/account/loans']);
  });

  it('opens the reader after borrowing an e-book', async () => {
    session.set(member);
    book.set(aBook({ hasEbook: true, ebookLicenses: 2, availableEbookLicenses: 1 }));
    borrow.mockReturnValue(of(aLoan({ id: 'loan-7', format: 'Ebook' })));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await render();

    buttonWithText(fixture, 'Borrow e-book').click();

    expect(navigate).toHaveBeenCalledWith(['/read', 'loan-7']);
  });

  it('joins the waiting list when every copy is out', async () => {
    session.set(member);
    book.set(aBook({ availableCopies: 0, waitingCount: 2 }));
    reserve.mockReturnValue(of({ position: 3 }));
    const fixture = await render();

    expect(text(fixture)).toContain('2 readers are waiting for this book');

    buttonWithText(fixture, 'Join the waiting list').click();

    expect(reserve).toHaveBeenCalledWith('book-1', 'member-1', 'Print');
    expect(notifier.success).toHaveBeenCalledWith('You joined the waiting list. Your position: 3.');
  });

  it('shows why the loan was refused', async () => {
    session.set(member);
    const error = new HttpErrorResponse({
      status: 422,
      error: { detail: 'You already have 3 active loans.' },
    });
    borrow.mockReturnValue(throwError(() => error));
    const fixture = await render();

    buttonWithText(fixture, 'Borrow print copy').click();

    expect(notifier.error).toHaveBeenCalledWith(error);
  });

  it('decides between borrowing, reserving and unavailable formats', () => {
    expect(formatOptions(aBook()).map((option) => option.action)).toEqual(['borrow']);
    expect(
      formatOptions(
        aBook({ availableCopies: 0, hasEbook: true, ebookLicenses: 0, availableEbookLicenses: 0 }),
      ).map((option) => option.action),
    ).toEqual(['reserve', 'unavailable']);
  });
});
