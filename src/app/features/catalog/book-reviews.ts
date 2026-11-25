import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ReviewsApi } from '../../core/api/library-api';
import { Book, Review } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../core/i18n/pipes';
import { Notifier } from '../../core/notifications/notifier';
import { StarInput, StarRating } from '../../shared/stars';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-book-reviews',
  imports: [
    FormsModule,
    LocalDatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
    StarInput,
    StarRating,
    TranslatePipe,
  ],
  templateUrl: './book-reviews.html',
  styleUrl: './book-reviews.scss',
})
export class BookReviews {
  private readonly reviewsApi = inject(ReviewsApi);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);
  protected readonly auth = inject(AuthService);

  readonly book = input.required<Book>();
  readonly changed = output<void>();

  protected readonly reviews = signal<Review[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly loading = signal(true);
  protected readonly mine = signal<Review | null>(null);
  protected readonly rating = signal(0);
  protected readonly comment = signal('');
  protected readonly saving = signal(false);

  protected readonly hasMore = computed(() => this.reviews().length < this.total());

  constructor() {
    effect(() => {
      const bookId = this.book().id;
      const signedIn = this.auth.isAuthenticated();

      void this.load(bookId, signedIn);
    });
  }

  protected async loadMore(): Promise<void> {
    const next = this.page() + 1;
    const result = await firstValueFrom(this.reviewsApi.list(this.book().id, next, PAGE_SIZE));
    this.reviews.update((reviews) => [...reviews, ...result.items]);
    this.page.set(next);
  }

  protected async save(): Promise<void> {
    if (this.rating() < 1) {
      this.notifier.success(this.i18n.t('Choose from 1 to 5 stars.'));
      return;
    }

    this.saving.set(true);

    try {
      const review = await firstValueFrom(
        this.reviewsApi.save(this.book().id, { rating: this.rating(), comment: this.comment() }),
      );
      this.mine.set(review);
      this.notifier.success(this.i18n.t('Thanks! Your review was saved.'));
      await this.reloadList();
      this.changed.emit();
    } catch (error: unknown) {
      this.notifier.error(error);
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    this.saving.set(true);

    try {
      await firstValueFrom(this.reviewsApi.delete(this.book().id));
      this.mine.set(null);
      this.rating.set(0);
      this.comment.set('');
      this.notifier.success(this.i18n.t('Your review was removed.'));
      await this.reloadList();
      this.changed.emit();
    } catch (error: unknown) {
      this.notifier.error(error);
    } finally {
      this.saving.set(false);
    }
  }

  private async load(bookId: string, signedIn: boolean): Promise<void> {
    this.loading.set(true);
    await this.reloadList();

    if (signedIn) {
      const mine = await firstValueFrom(this.reviewsApi.mine(bookId)).catch(() => null);
      this.mine.set(mine);
      this.rating.set(mine?.rating ?? 0);
      this.comment.set(mine?.comment ?? '');
    }

    this.loading.set(false);
  }

  private async reloadList(): Promise<void> {
    try {
      const result = await firstValueFrom(this.reviewsApi.list(this.book().id, 1, PAGE_SIZE));
      this.reviews.set(result.items);
      this.total.set(result.totalItems);
      this.page.set(1);
    } catch {
      this.reviews.set([]);
      this.total.set(0);
    }
  }
}
