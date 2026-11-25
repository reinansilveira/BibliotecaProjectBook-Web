import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { I18n, interpolate } from './i18n.service';
import { provideLocalizedPaginator } from './paginator-intl';
import { LocalDatePipe, LocalNumberPipe, TranslatePipe } from './pipes';
import { PT_BR } from './pt-br';
import { LocalizedTitleStrategy } from './title-strategy';

@Component({
  selector: 'app-i18n-host',
  imports: [TranslatePipe, LocalDatePipe, LocalNumberPipe],
  template: `<p>
    {{ 'Discover' | t }} · {{ '2026-03-08T12:00:00Z' | localDate: 'longDate' }} ·
    {{ 1234.5 | localNumber: '1.1-1' }}
  </p>`,
})
class Host {
  readonly i18n = inject(I18n);
}

@Component({ selector: 'app-empty', template: '' })
class Empty {}

describe('I18n', () => {
  beforeEach(() => localStorage.clear());

  it('starts in English for an English browser', () => {
    const i18n = TestBed.inject(I18n);

    expect(i18n.language()).toBe('en');
    expect(i18n.t('Discover')).toBe('Discover');
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches to Brazilian Portuguese and remembers the choice', () => {
    TestBed.inject(I18n).use('pt-BR');

    expect(TestBed.inject(I18n).t('Discover')).toBe('Descobrir');
    expect(document.documentElement.lang).toBe('pt-BR');
    expect(localStorage.getItem('library.language')).toBe('pt-BR');
  });

  it('restores the stored language', () => {
    localStorage.setItem('library.language', 'pt-BR');

    expect(TestBed.inject(I18n).locale()).toBe('pt-BR');
  });

  it('fills placeholders and picks the plural form', () => {
    const i18n = TestBed.inject(I18n);
    i18n.use('pt-BR');

    expect(i18n.t('More by {author}', { author: 'Homer' })).toBe('Mais de Homer');
    expect(i18n.plural(1, '{count} book', '{count} books')).toBe('1 livro');
    expect(i18n.plural(3, '{count} book', '{count} books')).toBe('3 livros');
    expect(interpolate('{known} {unknown}', { known: 'a' })).toBe('a {unknown}');
  });

  it('keeps the placeholders of every translation', () => {
    const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);

    for (const [english, portuguese] of PT_BR) {
      expect(names(portuguese).sort()).toEqual(names(english).sort());
    }
  });

  it('translates templates, dates and numbers when the language changes', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Discover');
    expect(element.textContent).toContain('March 8, 2026');
    expect(element.textContent).toContain('1,234.5');

    fixture.componentInstance.i18n.use('pt-BR');
    await fixture.whenStable();

    expect(element.textContent).toContain('Descobrir');
    expect(element.textContent).toContain('8 de março de 2026');
    expect(element.textContent).toContain('1.234,5');
  });

  it('translates the paginator', async () => {
    TestBed.configureTestingModule({
      providers: [provideLocalizedPaginator()],
    });
    const intl = TestBed.inject(MatPaginatorIntl);
    TestBed.inject(I18n).use('pt-BR');
    TestBed.tick();

    expect(intl.nextPageLabel).toBe('Próxima página');
    expect(intl.getRangeLabel(1, 12, 30)).toBe('13 – 24 de 30');
    expect(intl.getRangeLabel(0, 12, 0)).toBe('0 de 0');
  });

  it('translates the page title', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'books', title: 'Catalog', component: Empty }]),
        { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
      ],
    });
    await TestBed.inject(Router).navigateByUrl('/books');
    const title = TestBed.inject(Title);

    expect(title.getTitle()).toBe('Catalog · Library');

    TestBed.inject(I18n).use('pt-BR');
    TestBed.tick();

    expect(title.getTitle()).toBe('Catálogo · Biblioteca');
  });
});
