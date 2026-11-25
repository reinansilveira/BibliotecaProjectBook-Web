import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../core/i18n/pipes';
import { EmptyState } from '../shared/empty-state';

@Component({
  selector: 'app-not-found-page',
  imports: [EmptyState, MatButtonModule, RouterLink, TranslatePipe],
  template: `
    <section class="page">
      <app-empty-state icon="explore_off" [title]="'Page not found' | t">
        {{ 'The page you are looking for does not exist.' | t }}
        <a mat-flat-button routerLink="/books">{{ 'Back to the catalog' | t }}</a>
      </app-empty-state>
    </section>
  `,
})
export class NotFoundPage {}
