import { effect, inject, Injectable, Provider } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { I18n } from './i18n.service';

export function provideLocalizedPaginator(): Provider {
  return { provide: MatPaginatorIntl, useClass: LocalizedPaginatorIntl };
}

@Injectable()
export class LocalizedPaginatorIntl extends MatPaginatorIntl {
  private readonly i18n = inject(I18n);

  constructor() {
    super();
    effect(() => {
      this.i18n.language();
      this.itemsPerPageLabel = this.i18n.t('Items per page');
      this.nextPageLabel = this.i18n.t('Next page');
      this.previousPageLabel = this.i18n.t('Previous page');
      this.firstPageLabel = this.i18n.t('First page');
      this.lastPageLabel = this.i18n.t('Last page');
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) {
      return this.i18n.t('0 of {length}', { length });
    }

    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);

    return this.i18n.t('{start} – {end} of {length}', { start, end, length });
  };
}
