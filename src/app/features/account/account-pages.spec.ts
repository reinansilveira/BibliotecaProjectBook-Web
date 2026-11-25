import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { buttonWithText, text } from '../../../testing/dom';
import { aBook, aPage } from '../../../testing/test-data';
import { FinesApi, ReservationsApi } from '../../core/api/library-api';
import { LoansApi } from '../../core/api/loans-api';
import { MembersApi } from '../../core/api/members-api';
import { Fine, Reservation, Standing } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { WishlistStore } from '../../core/wishlist/wishlist-store';
import { AccountShell } from './account-shell';
import { FinesPage, unpaidTotal } from './fines-page';
import { isOpenReservation, ReservationsPage } from './reservations-page';
import { monthBars, StatsPage } from './stats-page';
import { WishlistPage } from './wishlist-page';

function aReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-1',
    bookId: 'book-1',
    bookTitle: 'Dune',
    bookAuthor: 'Frank Herbert',
    coverUrl: null,
    memberId: 'member-1',
    memberName: 'Ana',
    format: 'Print',
    status: 'Waiting',
    position: 2,
    createdAt: '2026-03-01T10:00:00Z',
    readyAt: null,
    expiresAt: null,
    ...overrides,
  };
}

function aFine(overrides: Partial<Fine> = {}): Fine {
  return {
    id: 'fine-1',
    memberId: 'member-1',
    memberName: 'Ana',
    loanId: 'loan-1',
    bookTitle: 'Dune',
    daysOverdue: 3,
    dailyRate: 0.5,
    amount: 1.5,
    currency: 'USD',
    status: 'Unpaid',
    issuedAt: '2026-03-10T10:00:00Z',
    resolvedAt: null,
    paymentReference: null,
    ...overrides,
  };
}

const standing: Standing = {
  canBorrow: false,
  activeLoans: 1,
  maxActiveLoans: 3,
  overdueLoans: 0,
  unpaidFines: 1.5,
  currency: 'USD',
  reasons: ['Pay your outstanding fines before borrowing again.'],
};

describe('My library pages', () => {
  const notifier = { success: vi.fn(), error: vi.fn() };
  const membersApi = {
    reservations: vi.fn(),
    fines: vi.fn(),
    standing: vi.fn(),
    readingStats: vi.fn(),
  };
  const reservationsApi = { cancel: vi.fn().mockReturnValue(of(undefined)) };
  const loansApi = { borrow: vi.fn().mockReturnValue(of({})) };
  const finesApi = { pay: vi.fn() };
  const wishlist = { loaded: signal(true), books: signal([aBook()]), reload: vi.fn() };

  beforeEach(() => {
    notifier.success.mockReset();
    membersApi.reservations.mockReturnValue(
      of(
        aPage([
          aReservation(),
          aReservation({ id: 'res-2', status: 'Ready', expiresAt: '2026-03-12T10:00:00Z' }),
        ]),
      ),
    );
    membersApi.fines.mockReturnValue(of(aPage([aFine(), aFine({ id: 'fine-2', status: 'Paid' })])));
    membersApi.standing.mockReturnValue(of(standing));
    membersApi.readingStats.mockReturnValue(
      of({
        totalLoans: 9,
        booksRead: 7,
        ebooksRead: 2,
        activeLoans: 1,
        booksThisYear: 5,
        reviewsWritten: 3,
        averageRatingGiven: 4.3,
        favoriteGenre: 'Gothic',
        topGenres: [{ genre: 'Gothic', loans: 4 }],
        lastTwelveMonths: [
          { month: '2026-02', loans: 1 },
          { month: '2026-03', loans: 4 },
        ],
      }),
    );
    finesApi.pay.mockReturnValue(of(aFine({ status: 'Paid', paymentReference: 'PAY-123' })));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: MembersApi, useValue: membersApi },
        { provide: ReservationsApi, useValue: reservationsApi },
        { provide: LoansApi, useValue: loansApi },
        { provide: FinesApi, useValue: finesApi },
        { provide: WishlistStore, useValue: wishlist },
        { provide: Notifier, useValue: notifier },
        { provide: AuthService, useValue: { session: signal({ memberId: 'member-1' }) } },
      ],
    });
  });

  it('explains why borrowing is paused', async () => {
    const fixture = TestBed.createComponent(AccountShell);
    await fixture.whenStable();

    expect(text(fixture)).toContain('Borrowing is paused on your account');
    expect(text(fixture)).toContain('Pay your outstanding fines before borrowing again.');
    expect(text(fixture)).toContain('Pay USD 1.50');
  });

  it('lists the waiting lists, borrows ready holds and leaves a list', async () => {
    const fixture = TestBed.createComponent(ReservationsPage);
    await fixture.whenStable();

    expect(text(fixture)).toContain('Position 2 in line');
    expect(text(fixture)).toContain('Your copy is ready!');

    buttonWithText(fixture, 'Borrow now').click();
    expect(loansApi.borrow).toHaveBeenCalledWith('book-1', 'member-1', 'Print');

    buttonWithText(fixture, 'Leave the list').click();
    expect(reservationsApi.cancel).toHaveBeenCalledWith('res-1');
    expect(isOpenReservation(aReservation({ status: 'Fulfilled' }))).toBe(false);
  });

  it('shows the fines and pays one', async () => {
    const fixture = TestBed.createComponent(FinesPage);
    await fixture.whenStable();

    expect(text(fixture)).toContain('USD 1.50');

    buttonWithText(fixture, 'Pay').click();

    expect(finesApi.pay).toHaveBeenCalledWith('fine-1');
    expect(notifier.success).toHaveBeenCalledWith('Paid! Reference PAY-123.');
    expect(unpaidTotal([aFine(), aFine({ amount: 2 }), aFine({ status: 'Waived' })])).toBe(3.5);
  });

  it('shows the reading year', async () => {
    const fixture = TestBed.createComponent(StatsPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(text(fixture)).toContain('5 this year');
    expect(text(fixture)).toContain('Gothic');
    expect(element.querySelectorAll('.month')).toHaveLength(2);
    expect(monthBars([{ month: '2026-03', loans: 2 }], 'en-US')).toEqual([
      { label: 'Mar', loans: 2, height: 100 },
    ]);
  });

  it('shows the saved books', async () => {
    const fixture = TestBed.createComponent(WishlistPage);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-book-card')).toHaveLength(
      1,
    );
    expect(wishlist.reload).toHaveBeenCalled();
  });
});
