import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MembersApi } from '../api/members-api';
import { Book } from '../api/models';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private readonly membersApi = inject(MembersApi);
  private readonly auth = inject(AuthService);

  readonly books = signal<Book[]>([]);
  readonly loaded = signal(false);
  readonly ids = computed(() => new Set(this.books().map((book) => book.id)));

  constructor() {
    effect(() => {
      const memberId = this.auth.session()?.memberId;

      this.books.set([]);
      this.loaded.set(false);

      if (memberId) {
        void this.load(memberId);
      }
    });
  }

  has(bookId: string): boolean {
    return this.ids().has(bookId);
  }

  async toggle(book: Book): Promise<boolean> {
    const memberId = this.auth.session()?.memberId;

    if (!memberId) {
      return false;
    }

    if (this.has(book.id)) {
      await firstValueFrom(this.membersApi.removeFromWishlist(memberId, book.id));
      this.books.update((books) => books.filter((item) => item.id !== book.id));
      return false;
    }

    await firstValueFrom(this.membersApi.addToWishlist(memberId, book.id));
    this.books.update((books) => [book, ...books]);
    return true;
  }

  async reload(): Promise<void> {
    const memberId = this.auth.session()?.memberId;

    if (memberId) {
      await this.load(memberId);
    }
  }

  private async load(memberId: string): Promise<void> {
    try {
      this.books.set(await firstValueFrom(this.membersApi.wishlist(memberId)));
    } catch {
      this.books.set([]);
    } finally {
      this.loaded.set(true);
    }
  }
}
