import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../shared/empty-state';

@Component({
  selector: 'app-not-found-page',
  imports: [EmptyState, MatButtonModule, RouterLink],
  template: `
    <section class="page">
      <app-empty-state icon="explore_off" title="Page not found">
        The page you are looking for does not exist.
        <a mat-flat-button routerLink="/books">Back to the catalog</a>
      </app-empty-state>
    </section>
  `,
})
export class NotFoundPage {}
