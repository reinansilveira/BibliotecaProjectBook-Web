import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { COVER_LOOKUP_ENABLED, CoverService, coverUrl } from './cover.service';

describe('CoverService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: COVER_LOOKUP_ENABLED, useValue: true },
      ],
    });
  });

  it('finds the cover on Open Library and remembers it', async () => {
    const service = TestBed.inject(CoverService);
    const http = TestBed.inject(HttpTestingController);

    const result = firstValueFrom(service.coverId('Dune', 'Frank Herbert'));
    const request = http.expectOne((candidate) => candidate.url.includes('openlibrary.org'));
    expect(request.request.params.get('title')).toBe('Dune');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ docs: [{}, { cover_i: 42 }] });

    expect(await result).toBe(42);
    expect(localStorage.getItem('library.covers')).toContain('42');
  });

  it('falls back when Open Library has no cover or fails', async () => {
    const service = TestBed.inject(CoverService);
    const http = TestBed.inject(HttpTestingController);

    const missing = firstValueFrom(service.coverId('Unknown', 'Nobody'));
    http.expectOne(() => true).flush({ docs: [] });
    const failed = firstValueFrom(service.coverId('Broken', 'Nobody'));
    http.expectOne(() => true).error(new ProgressEvent('error'));

    expect(await missing).toBeNull();
    expect(await failed).toBeNull();
  });

  it('does not call Open Library when the lookup is disabled', async () => {
    TestBed.overrideProvider(COVER_LOOKUP_ENABLED, { useValue: false });
    const service = TestBed.inject(CoverService);

    expect(await firstValueFrom(service.coverId('Dune', 'Frank Herbert'))).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });

  it('builds the cover image address', () => {
    expect(coverUrl(42, 'L')).toBe('https://covers.openlibrary.org/b/id/42-L.jpg');
  });
});
