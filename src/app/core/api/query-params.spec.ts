import { toQueryParams } from './query-params';

describe('toQueryParams', () => {
  it('keeps values and skips empty ones', () => {
    const params = toQueryParams({ page: 2, pageSize: 10, search: '', from: null, to: undefined });

    expect(params.toString()).toBe('page=2&pageSize=10');
  });
});
