import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { buttonWithText, text } from '../../../testing/dom';
import { aLoan } from '../../../testing/test-data';
import { LoansApi } from '../../core/api/loans-api';
import { Notifier } from '../../core/notifications/notifier';
import { EPUB_ENGINE, ProgressListener, ReaderEngine } from './epub-engine';
import { ReaderPage } from './reader-page';

describe('ReaderPage', () => {
  let progress: ProgressListener | null = null;
  const engine: ReaderEngine = {
    toc: [{ label: 'Chapter 1', href: 'ch1.xhtml' }],
    next: vi.fn().mockResolvedValue(undefined),
    previous: vi.fn().mockResolvedValue(undefined),
    display: vi.fn().mockResolvedValue(undefined),
    setFontSize: vi.fn(),
    setDark: vi.fn(),
    destroy: vi.fn(),
  };
  const factory = vi.fn();
  const loansApi = {
    get: vi.fn(),
    readingLink: vi.fn(),
    saveProgress: vi.fn().mockReturnValue(of(aLoan())),
  };

  beforeEach(() => {
    progress = null;
    factory.mockReset().mockImplementation(async (_data, _host, _start, listener) => {
      progress = listener;
      return engine;
    });
    loansApi.get.mockReturnValue(
      of(aLoan({ format: 'Ebook', readingLocation: 'epubcfi(/6/2)', readingProgress: 10 })),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LoansApi, useValue: loansApi },
        { provide: EPUB_ENGINE, useValue: factory },
        { provide: Notifier, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
  });

  async function open(fileFormat: 'epub' | 'pdf') {
    loansApi.readingLink.mockReturnValue(
      of({ url: '/api/v1/ebooks/loan-1/content?signature=abc', expiresAt: '', fileFormat }),
    );
    const fixture = TestBed.createComponent(ReaderPage);
    fixture.componentRef.setInput('loanId', 'loan-1');
    await fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    await vi
      .waitFor(() => http.expectOne('/api/v1/ebooks/loan-1/content?signature=abc'), {
        timeout: 1000,
      })
      .then((request) => request.flush(new ArrayBuffer(8)));
    await vi.waitFor(() => expect(text(fixture)).not.toContain('Opening your e-book'));
    await fixture.whenStable();

    return fixture;
  }

  it('opens an EPUB where the reader stopped and saves the progress', async () => {
    const fixture = await open('epub');

    expect(factory).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      expect.any(HTMLElement),
      'epubcfi(/6/2)',
      expect.any(Function),
    );
    expect(text(fixture)).toContain('Dune');

    buttonWithText(fixture, 'Next').click();
    expect(engine.next).toHaveBeenCalled();

    progress?.('epubcfi(/6/8)', 37.5);
    fixture.destroy();

    expect(loansApi.saveProgress).toHaveBeenCalledWith('loan-1', 'epubcfi(/6/8)', 37.5);
    expect(engine.destroy).toHaveBeenCalled();
  });

  it('shows PDFs in the browser viewer', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:pdf');
    URL.revokeObjectURL = vi.fn();
    const fixture = await open('pdf');

    expect((fixture.nativeElement as HTMLElement).querySelector('iframe.pdf')).not.toBeNull();

    buttonWithText(fixture, 'Mark as finished').click();

    expect(loansApi.saveProgress).toHaveBeenCalledWith('loan-1', 'pdf', 100);
  });
});
