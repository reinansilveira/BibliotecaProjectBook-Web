import { HttpBackend, HttpClient } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { absoluteApiUrl } from '../../core/api/api-url';
import { LoansApi } from '../../core/api/loans-api';
import { Loan } from '../../core/api/models';
import { errorMessage } from '../../core/http/error-message';
import { I18n } from '../../core/i18n/i18n.service';
import { LocalNumberPipe, TranslatePipe } from '../../core/i18n/pipes';
import { Notifier } from '../../core/notifications/notifier';
import { ThemeService } from '../../core/theme/theme.service';
import { EmptyState } from '../../shared/empty-state';
import { EPUB_ENGINE, ReaderEngine, TocEntry } from './epub-engine';

const SAVE_DELAY = 1500;
const FONT_STEPS = [80, 90, 100, 115, 130, 150];

type ReaderStatus = 'loading' | 'epub' | 'pdf' | 'error';

@Component({
  selector: 'app-reader-page',
  imports: [
    EmptyState,
    LocalNumberPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './reader-page.html',
  styleUrl: './reader-page.scss',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class ReaderPage {
  private readonly loansApi = inject(LoansApi);
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly engineFactory = inject(EPUB_ENGINE);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifier = inject(Notifier);
  private readonly i18n = inject(I18n);
  private readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loanId = input.required<string>();

  private readonly host = viewChild<ElementRef<HTMLElement>>('host');

  protected readonly status = signal<ReaderStatus>('loading');
  protected readonly message = signal('');
  protected readonly loan = signal<Loan | null>(null);
  protected readonly percentage = signal(0);
  protected readonly toc = signal<TocEntry[]>([]);
  protected readonly fontStep = signal(2);
  protected readonly pdfUrl = signal<SafeResourceUrl | null>(null);
  protected readonly saved = signal(true);

  private engine: ReaderEngine | null = null;
  private objectUrl: string | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pending: { location: string; percentage: number } | null = null;

  constructor() {
    afterNextRender(() => void this.open());
    this.destroyRef.onDestroy(() => this.close());
  }

  protected next(): void {
    void this.engine?.next();
  }

  protected previous(): void {
    void this.engine?.previous();
  }

  protected goTo(entry: TocEntry): void {
    void this.engine?.display(entry.href);
  }

  protected changeFont(delta: number): void {
    const step = Math.min(FONT_STEPS.length - 1, Math.max(0, this.fontStep() + delta));
    this.fontStep.set(step);
    this.engine?.setFontSize(FONT_STEPS[step]);
  }

  protected markFinished(): void {
    this.queueSave('pdf', 100);
    this.flush();
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.next();
      return;
    }

    if (event.key === 'ArrowLeft') {
      this.previous();
    }
  }

  private async open(): Promise<void> {
    try {
      const loan = await firstValueFrom(this.loansApi.get(this.loanId()));
      this.loan.set(loan);
      this.percentage.set(loan.readingProgress);

      const link = await firstValueFrom(this.loansApi.readingLink(loan.id));
      const data = await firstValueFrom(
        this.http.get(absoluteApiUrl(link.url), { responseType: 'arraybuffer' }),
      );

      if (link.fileFormat === 'pdf') {
        this.openPdf(data);
        return;
      }

      this.status.set('epub');
      await this.openEpub(data, loan);
    } catch (error: unknown) {
      this.message.set(errorMessage(error));
      this.status.set('error');
    }
  }

  private openPdf(data: ArrayBuffer): void {
    this.objectUrl = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
    this.status.set('pdf');
  }

  private async openEpub(data: ArrayBuffer, loan: Loan): Promise<void> {
    const host = this.host()?.nativeElement;

    if (!host) {
      return;
    }

    this.engine = await this.engineFactory(
      data,
      host,
      loan.readingLocation ?? null,
      (location, percentage) => this.queueSave(location, percentage),
    );
    this.toc.set(this.engine.toc);
    this.engine.setDark(this.theme.mode() === 'dark');
    this.engine.setFontSize(FONT_STEPS[this.fontStep()]);
  }

  private queueSave(location: string, percentage: number): void {
    this.percentage.set(percentage);
    this.pending = { location, percentage };
    this.saved.set(false);

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => this.flush(), SAVE_DELAY);
  }

  private flush(): void {
    const pending = this.pending;
    const loan = this.loan();

    if (!pending || !loan) {
      return;
    }

    this.pending = null;
    this.loansApi.saveProgress(loan.id, pending.location, pending.percentage).subscribe({
      next: () => this.saved.set(true),
      error: (error: unknown) => this.notifier.error(error),
    });
  }

  private close(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.flush();
    this.engine?.destroy();

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  protected title(): string {
    return this.loan()?.bookTitle ?? this.i18n.t('E-book');
  }
}
