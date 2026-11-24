import { catchError, map, Observable, of, startWith } from 'rxjs';
import { errorMessage } from './error-message';

export type LoadState<T> =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'loaded'; value: T };

export function toLoadState<T>(source: Observable<T>): Observable<LoadState<T>> {
  return source.pipe(
    map((value): LoadState<T> => ({ status: 'loaded', value })),
    catchError((error: unknown) =>
      of<LoadState<T>>({ status: 'error', message: errorMessage(error) }),
    ),
    startWith<LoadState<T>>({ status: 'loading' }),
  );
}
