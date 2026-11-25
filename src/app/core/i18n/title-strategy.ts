import { effect, inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18n } from './i18n.service';

@Injectable()
export class LocalizedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18n);
  private current: string | undefined;

  constructor() {
    super();
    effect(() => {
      this.i18n.language();
      this.apply();
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.current = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    const library = this.i18n.t('Library');

    if (!this.current) {
      this.title.setTitle(library);
      return;
    }

    this.title.setTitle(`${this.i18n.t(this.current)} · ${library}`);
  }
}
