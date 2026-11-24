import { HttpErrorResponse } from '@angular/common/http';

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return FALLBACK_MESSAGE;
  }

  if (error.status === 0) {
    return 'Could not reach the server. Check your connection and try again.';
  }

  const problem = error.error as ProblemDetails | null;
  const validationMessages = Object.values(problem?.errors ?? {}).flat();

  if (validationMessages.length > 0) {
    return validationMessages.join(' ');
  }

  return problem?.detail ?? problem?.title ?? FALLBACK_MESSAGE;
}
