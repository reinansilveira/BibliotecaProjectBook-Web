import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CoverService } from '../core/covers/cover.service';
import { BookCover, coverHue } from './book-cover';

describe('BookCover', () => {
  async function render(coverId: number | null) {
    TestBed.configureTestingModule({
      providers: [{ provide: CoverService, useValue: { coverId: () => of(coverId) } }],
    });
    const fixture = TestBed.createComponent(BookCover);
    fixture.componentRef.setInput('title', 'Dune');
    fixture.componentRef.setInput('author', 'Frank Herbert');
    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('always gives the same title the same color', () => {
    expect(coverHue('Dune')).toBe(coverHue('Dune'));
    expect(coverHue('Dune')).toBeGreaterThanOrEqual(0);
    expect(coverHue('Dune')).toBeLessThan(360);
  });

  it('draws a generated cover when there is no picture', async () => {
    const { element } = await render(null);

    expect(element.textContent).toContain('Dune');
    expect(element.textContent).toContain('Frank Herbert');
    expect(element.querySelector('img')).toBeNull();
  });

  it('shows the Open Library picture once it loads', async () => {
    const { fixture, element } = await render(42);
    const image = element.querySelector('img')!;

    expect(image.src).toBe('https://covers.openlibrary.org/b/id/42-L.jpg');

    image.dispatchEvent(new Event('load'));
    await fixture.whenStable();

    expect(element.querySelector('.cover')!.classList).toContain('has-image');
  });

  it('keeps the generated cover when the picture fails', async () => {
    const { fixture, element } = await render(42);

    element.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(element.querySelector('img')).toBeNull();
  });
});
