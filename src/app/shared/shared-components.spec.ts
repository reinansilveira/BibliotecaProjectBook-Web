import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { aBook } from '../../testing/test-data';
import { MembersApi } from '../core/api/members-api';
import { AuthService, Session } from '../core/auth/auth.service';
import { WishlistStore } from '../core/wishlist/wishlist-store';
import { Availability, availabilityTone } from './availability';
import { StarInput, starKinds, StarRating } from './stars';

describe('shared components', () => {
  it('rounds ratings to full, half and empty stars', () => {
    expect(starKinds(3.6)).toEqual(['full', 'full', 'full', 'half', 'empty']);
    expect(starKinds(4.8)).toEqual(['full', 'full', 'full', 'full', 'full']);
    expect(starKinds(0)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('shows the rating and the number of ratings', async () => {
    const fixture = TestBed.createComponent(StarRating);
    fixture.componentRef.setInput('rating', 4.25);
    fixture.componentRef.setInput('count', 12);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('4.3');
    expect(element.textContent).toContain('(12)');
    expect(element.querySelector('[role=img]')?.getAttribute('aria-label')).toBe(
      'Rated 4.3 out of 5',
    );
  });

  it('lets the reader pick a rating', async () => {
    const fixture = TestBed.createComponent(StarInput);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelectorAll<HTMLButtonElement>('button')[3].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe(4);
    expect(element.querySelectorAll('button.on')).toHaveLength(4);
  });

  it('describes availability in print and e-book', async () => {
    expect(availabilityTone(aBook())).toBe('available');
    expect(availabilityTone(aBook({ availableCopies: 0 }))).toBe('waiting');
    expect(availabilityTone(aBook({ availableCopies: 0, totalCopies: 0 }))).toBe('none');

    const fixture = TestBed.createComponent(Availability);
    fixture.componentRef.setInput('book', aBook({ hasEbook: true, availableEbookLicenses: 1 }));
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('1 of 2 available');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('E-book');
  });
});

describe('WishlistStore', () => {
  const session = signal<Session | null>(null);
  const api = {
    wishlist: vi.fn().mockReturnValue(of([aBook()])),
    addToWishlist: vi.fn().mockReturnValue(of(undefined)),
    removeFromWishlist: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(() => {
    session.set({ memberId: 'member-1', name: 'Ana', role: 'Member', accessToken: 'token' });
    TestBed.configureTestingModule({
      providers: [
        { provide: MembersApi, useValue: api },
        { provide: AuthService, useValue: { session } },
      ],
    });
  });

  it('loads the saved books and toggles them', async () => {
    const store = TestBed.inject(WishlistStore);
    TestBed.tick();
    await vi.waitFor(() => expect(store.loaded()).toBe(true));

    expect(store.has('book-1')).toBe(true);
    expect(await store.toggle(aBook())).toBe(false);
    expect(api.removeFromWishlist).toHaveBeenCalledWith('member-1', 'book-1');
    expect(store.has('book-1')).toBe(false);

    expect(await store.toggle(aBook({ id: 'book-2' }))).toBe(true);
    expect(api.addToWishlist).toHaveBeenCalledWith('member-1', 'book-2');
    expect(store.has('book-2')).toBe(true);
  });
});
