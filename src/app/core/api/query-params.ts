import { HttpParams } from '@angular/common/http';

type QueryValue = string | number | boolean | null | undefined;

export function toQueryParams(query: Record<string, QueryValue>): HttpParams {
  return Object.entries(query).reduce((params, [key, value]) => {
    if (value === null || value === undefined || value === '') {
      return params;
    }

    return params.set(key, String(value));
  }, new HttpParams());
}
