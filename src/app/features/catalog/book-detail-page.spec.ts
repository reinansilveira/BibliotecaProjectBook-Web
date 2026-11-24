import { HttpErrorResponse } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { buttonWithText, text } from '../../../testing/dom';
import { aBook, aLoan, aPage } from '../../../testing/test-data';
import { BooksApi } from '../../core/api/books-api';
import { LoansApi } from '../../core/api/loans-api';
import { AuthService, Session } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { BookDetailPage } from './book-detail-page';

describe('BookDetailPage', () => {
  const session = signal<Session | null>(null);
  const borrow = vi.fn();
  const notifier = { success: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    session.set(null);
    borrow.mockReset();
    notifier.error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: BooksApi,
          useValue: {
            get: () => of(aBook({ title: 'Dune' })),
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
  });

  it('suggests other books by the same author', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(text(fixture)).toContain('More by Frank Herbert');
    expect(element.querySelectorAll('.shelf app-book-card')).toHaveLength(1);
    expect(text(fixture)).toContain('Children of Dune');
  });

  it('borrows the book for the signed-in member', async () => {
    session.set({ memberId: 'member-1', name: 'Ana', role: 'Member', accessToken: 'token' });
    borrow.mockReturnValue(of(aLoan()));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await render();

    buttonWithText(fixture, 'Borrow this book').click();

    expect(borrow).toHaveBeenCalledWith('book-1', 'member-1');
    expect(notifier.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/my-loans']);
  });

  it('shows why the loan was refused', async () => {
    session.set({ memberId: 'member-1', name: 'Ana', role: 'Member', accessToken: 'token' });
    const error = new HttpErrorResponse({
      status: 422,
      error: { detail: 'The book is already on loan.' },
    });
    borrow.mockReturnValue(throwError(() => error));
    const fixture = await render();

    buttonWithText(fixture, 'Borrow this book').click();

    expect(notifier.error).toHaveBeenCalledWith(error);
  });
});
