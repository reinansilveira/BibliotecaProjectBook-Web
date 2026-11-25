import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { aBook, aPage } from '../../../testing/test-data';
import { BooksApi } from '../../core/api/books-api';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogPage, fanPosition } from './catalog-page';

describe('CatalogPage', () => {
  const list = vi.fn();
  const session = signal<object | null>(null);

  beforeEach(() => {
    list.mockReset();
    session.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: BooksApi,
          useValue: { list, genres: () => of([{ name: 'Romance', books: 3 }]) },
        },
        {
          provide: AuthService,
          useValue: { isAuthenticated: computed(() => session() !== null) },
        },
      ],
    });
  });

  async function render(search?: string) {
    const fixture = TestBed.createComponent(CatalogPage);
    fixture.componentRef.setInput('search', search);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  it('shows a card for every book and features them on the hero shelf', async () => {
    list.mockReturnValue(
      of(
        aPage([
          aBook({ id: '1', title: 'Dune' }),
          aBook({ id: '2', title: 'Emma', author: 'Jane Austen' }),
        ]),
      ),
    );

    const page = await render();

    expect(page.querySelectorAll('app-book-card')).toHaveLength(2);
    expect(page.querySelectorAll('.fan-item app-book-cover')).toHaveLength(2);
    expect(page.textContent).toContain('2 books');
    expect(page.textContent).toContain('Join for free');
  });

  it('hides the sign-up call to action from members', async () => {
    session.set({});
    list.mockReturnValue(of(aPage([aBook()])));

    const page = await render();

    expect(page.textContent).not.toContain('Join for free');
  });

  it('sends the search term to the API', async () => {
    list.mockReturnValue(of(aPage([])));

    const page = await render('tolkien');

    expect(list).toHaveBeenCalledWith({ page: 1, pageSize: 12, search: 'tolkien' });
    expect(page.textContent).toContain('Results for “tolkien”');
    expect(page.textContent).toContain('No books found');
  });

  it('spreads the hero covers around the center', () => {
    expect(fanPosition(0, 5)).toEqual({ offset: -2, distance: 2 });
    expect(fanPosition(2, 5)).toEqual({ offset: 0, distance: 0 });
    expect(fanPosition(1, 2)).toEqual({ offset: 0.5, distance: 0.5 });
  });
});
