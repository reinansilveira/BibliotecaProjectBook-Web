import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('uses the problem details description', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { title: 'Business rule violation', detail: 'The book is already on loan.' },
    });

    expect(errorMessage(error)).toBe('The book is already on loan.');
  });

  it('joins validation errors from every field', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        title: 'Validation error',
        errors: { Email: ['Email is invalid.'], Password: ['Password is too short.'] },
      },
    });

    expect(errorMessage(error)).toBe('Email is invalid. Password is too short.');
  });

  it('explains when the server cannot be reached', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain(
      'Could not reach the server',
    );
  });

  it('falls back to a generic message', () => {
    expect(errorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});
