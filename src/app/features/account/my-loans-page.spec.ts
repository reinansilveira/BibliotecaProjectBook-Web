import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { text } from '../../../testing/dom';
import { aBook, aLoan, aPage } from '../../../testing/test-data';
import { BooksApi } from '../../core/api/books-api';
import { MembersApi } from '../../core/api/members-api';
import { AuthService } from '../../core/auth/auth.service';
import { MyLoansPage, toShelf } from './my-loans-page';

describe('MyLoansPage', () => {
  function setup(loans: ReturnType<typeof aLoan>[]) {
    const membersApi = { loans: vi.fn().mockReturnValue(of(aPage(loans))) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: MembersApi, useValue: membersApi },
        { provide: BooksApi, useValue: { get: () => of(aBook({ title: 'Dune' })) } },
        { provide: AuthService, useValue: { session: signal({ memberId: 'member-1' }) } },
      ],
    });

    return membersApi;
  }

  it('lists the loans of the signed-in member with the book titles', async () => {
    const membersApi = setup([
      aLoan({ status: 'Overdue' }),
      aLoan({ id: 'loan-2', status: 'Returned', returnedAt: '2026-02-01T00:00:00Z' }),
    ]);
    const fixture = TestBed.createComponent(MyLoansPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(membersApi.loans).toHaveBeenCalledWith('member-1', 1, 50);
    expect(text(fixture)).toContain('Dune');
    expect(text(fixture)).toContain('Overdue');
    expect(element.querySelectorAll('.loan')).toHaveLength(1);
    expect(element.querySelectorAll('.history-item')).toHaveLength(1);
  });

  it('invites new members to browse the catalog', async () => {
    setup([]);
    const fixture = TestBed.createComponent(MyLoansPage);
    await fixture.whenStable();

    expect(text(fixture)).toContain('No loans yet');
  });

  it('puts the loans due first on top and counts the overdue ones', () => {
    const book = aBook();
    const shelf = toShelf(
      aPage([
        { ...aLoan({ id: 'later', dueDate: '2026-03-20T00:00:00Z' }), book },
        { ...aLoan({ id: 'late', status: 'Overdue' }), book },
        { ...aLoan({ id: 'done', status: 'Returned' }), book },
      ]),
      Date.parse('2026-03-10T00:00:00Z'),
    );

    expect(shelf.reading.map((loan) => loan.id)).toEqual(['late', 'later']);
    expect(shelf.history.map((loan) => loan.id)).toEqual(['done']);
    expect(shelf.overdue).toBe(1);
  });
});
