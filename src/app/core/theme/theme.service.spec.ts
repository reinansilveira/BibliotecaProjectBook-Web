import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => localStorage.clear());

  it('applies the theme to the document and remembers the choice', () => {
    const theme = TestBed.inject(ThemeService);
    const initial = theme.mode();

    theme.toggle();

    const expected = initial === 'dark' ? 'light' : 'dark';
    expect(theme.mode()).toBe(expected);
    expect(document.documentElement.dataset['theme']).toBe(expected);
    expect(localStorage.getItem('library.theme')).toBe(expected);
  });

  it('restores the stored choice', () => {
    localStorage.setItem('library.theme', 'dark');

    expect(TestBed.inject(ThemeService).mode()).toBe('dark');
  });
});
