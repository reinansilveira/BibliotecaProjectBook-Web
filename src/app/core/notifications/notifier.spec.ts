import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Notifier } from './notifier';

describe('Notifier', () => {
  const open = vi.fn();

  beforeEach(() => {
    open.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { open } }] });
  });

  it('shows success messages', () => {
    TestBed.inject(Notifier).success('Saved.');

    expect(open).toHaveBeenCalledWith('Saved.', 'OK', { duration: 4000 });
  });

  it('turns API errors into readable messages', () => {
    TestBed.inject(Notifier).error(
      new HttpErrorResponse({ status: 422, error: { detail: 'The book is already on loan.' } }),
    );

    expect(open).toHaveBeenCalledWith(
      'The book is already on loan.',
      'Dismiss',
      expect.objectContaining({ duration: 6000 }),
    );
  });
});
