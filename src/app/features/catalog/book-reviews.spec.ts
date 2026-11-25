import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { buttonWithText, text } from '../../../testing/dom';
import { aBook, aPage } from '../../../testing/test-data';
import { ReviewsApi } from '../../core/api/library-api';
import { Review } from '../../core/api/models';
import { AuthService, Session } from '../../core/auth/auth.service';
import { Notifier } from '../../core/notifications/notifier';
import { BookReviews } from './book-reviews';

function aReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    bookId: 'book-1',
    memberId: 'member-2',
    reviewerName: 'Maria S.',
    rating: 5,
    comment: 'A masterpiece.',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

describe('BookReviews', () => {
  const session = signal<Session | null>(null);
  const notifier = { success: vi.fn(), error: vi.fn() };
  const api = {
    list: vi.fn(),
    mine: vi.fn().mockReturnValue(of(null)),
    save: vi.fn(),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(() => {
    session.set(null);
    notifier.success.mockReset();
    api.list.mockReturnValue(of({ ...aPage([aReview()]), totalItems: 6 }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ReviewsApi, useValue: api },
        { provide: Notifier, useValue: notifier },
        {
          provide: AuthService,
          useValue: { session, isAuthenticated: computed(() => session() !== null) },
        },
      ],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(BookReviews);
    fixture.componentRef.setInput('book', aBook({ averageRating: 4.5, ratingsCount: 6 }));
    await fixture.whenStable();
    await vi.waitFor(() => expect(text(fixture)).toContain('Maria S.'));

    return fixture;
  }

  it('shows the reviews and loads more on demand', async () => {
    const fixture = await render();

    expect(text(fixture)).toContain('4.5');
    expect(text(fixture)).toContain('A masterpiece.');
    expect(text(fixture)).toContain('to rate and review this book.');

    buttonWithText(fixture, 'Show more reviews').click();
    await fixture.whenStable();

    expect(api.list).toHaveBeenLastCalledWith('book-1', 2, 5);
  });

  it('publishes the review of a signed-in member', async () => {
    session.set({ memberId: 'member-1', name: 'Ana', role: 'Member', accessToken: 'token' });
    api.save.mockReturnValue(of(aReview({ memberId: 'member-1', rating: 4 })));
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    buttonWithText(fixture, 'Publish review').click();
    await fixture.whenStable();
    expect(notifier.success).toHaveBeenCalledWith('Choose from 1 to 5 stars.');

    element.querySelectorAll<HTMLButtonElement>('app-star-input button')[3].click();
    buttonWithText(fixture, 'Publish review').click();
    await vi.waitFor(() =>
      expect(api.save).toHaveBeenCalledWith('book-1', { rating: 4, comment: '' }),
    );
    await fixture.whenStable();

    expect(notifier.success).toHaveBeenCalledWith('Thanks! Your review was saved.');

    buttonWithText(fixture, 'Delete').click();
    await vi.waitFor(() => expect(api.delete).toHaveBeenCalledWith('book-1'));
  });
});
