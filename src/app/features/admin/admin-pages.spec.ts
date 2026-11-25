import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { buttonWithText, click, fill, text } from '../../../testing/dom';
import { aBook, aPage } from '../../../testing/test-data';
import { BooksApi } from '../../core/api/books-api';
import { AuditApi, FinesApi } from '../../core/api/library-api';
import { AuditEntry, Fine } from '../../core/api/models';
import { Notifier } from '../../core/notifications/notifier';
import { auditChanges, AuditPage } from './audit/audit-page';
import { AdminBooksPage } from './books/admin-books-page';
import { BookFormDialog } from './books/book-form-dialog';
import { ManageBookDialog } from './books/manage-book-dialog';
import { AdminFinesPage } from './fines/admin-fines-page';

const fine: Fine = {
  id: 'fine-1',
  memberId: 'member-1',
  memberName: 'Ana Smith',
  loanId: 'loan-1',
  bookTitle: 'Dune',
  daysOverdue: 4,
  dailyRate: 0.5,
  amount: 2,
  currency: 'USD',
  status: 'Unpaid',
  issuedAt: '2026-03-10T10:00:00Z',
  resolvedAt: null,
  paymentReference: null,
};

const entry: AuditEntry = {
  id: 'audit-1',
  occurredAt: '2026-03-10T10:00:00Z',
  actorId: null,
  actorName: 'system',
  action: 'Book.Updated',
  entityType: 'Book',
  entityId: 'book-1',
  changes: '{"Title":"Dune","Copies":2}',
};

describe('administration pages', () => {
  const notifier = { success: vi.fn(), error: vi.fn() };
  const finesApi = { list: vi.fn(), waive: vi.fn().mockReturnValue(of({ ...fine })) };
  const auditApi = { list: vi.fn().mockReturnValue(of(aPage([entry]))) };
  const afterClosed = vi.fn();
  const dialog = { open: vi.fn().mockReturnValue({ afterClosed }) };
  const booksApi = {
    list: vi.fn().mockReturnValue(of(aPage([aBook({ hasEbook: true, ebookLicenses: 3 })]))),
    genres: () => of([{ name: 'Gothic', books: 3 }]),
    create: vi.fn().mockReturnValue(of(aBook({ title: 'Emma' }))),
    import: vi.fn().mockReturnValue(of(aBook({ title: 'Carmilla' }))),
    update: vi.fn().mockReturnValue(of(aBook({ title: 'Dune II' }))),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(() => {
    notifier.success.mockReset();
    finesApi.list.mockReturnValue(of(aPage([fine])));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FinesApi, useValue: finesApi },
        { provide: AuditApi, useValue: auditApi },
        { provide: BooksApi, useValue: booksApi },
        { provide: Notifier, useValue: notifier },
      ],
    });
  });

  it('lists unpaid fines, filters them and waives one', async () => {
    const fixture = TestBed.createComponent(AdminFinesPage);
    await fixture.whenStable();

    expect(finesApi.list).toHaveBeenCalledWith('Unpaid', 1, 10);
    expect(text(fixture)).toContain('Ana Smith');

    click(fixture, '.actions-cell button');
    expect(finesApi.waive).toHaveBeenCalledWith('fine-1');
    expect(notifier.success).toHaveBeenCalledWith('The fine of Ana Smith was waived.');

    buttonWithText(fixture, 'Paid').click();
    await fixture.whenStable();
    expect(finesApi.list).toHaveBeenLastCalledWith('Paid', 1, 10);
  });

  it('shows the audit trail with the recorded changes', async () => {
    const fixture = TestBed.createComponent(AuditPage);
    await fixture.whenStable();

    expect(text(fixture)).toContain('Book.Updated');

    buttonWithText(fixture, 'Book.Updated').click();
    await fixture.whenStable();

    expect(text(fixture)).toContain('Title');
    expect(auditChanges(entry)).toEqual([
      { field: 'Title', value: 'Dune' },
      { field: 'Copies', value: '2' },
    ]);
    expect(auditChanges({ ...entry, changes: 'not json' })).toEqual([
      { field: '', value: 'not json' },
    ]);
  });

  it('adds, imports and edits books through the dialogs', async () => {
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
    const fixture = TestBed.createComponent(AdminBooksPage);
    await fixture.whenStable();

    expect(text(fixture)).toContain('1 / 2');
    expect(text(fixture)).toContain('0 / 3');

    afterClosed.mockReturnValueOnce(
      of({
        kind: 'create',
        request: {
          title: 'Emma',
          author: 'Jane Austen',
          genre: 'Romance',
          description: '',
          copies: 2,
        },
      }),
    );
    buttonWithText(fixture, 'Add book').click();
    expect(booksApi.create).toHaveBeenCalled();
    expect(notifier.success).toHaveBeenCalledWith('“Emma” was added to the catalog.');

    afterClosed.mockReturnValueOnce(
      of({ kind: 'import', request: { isbn: '9780141439600', copies: 1, genre: null } }),
    );
    buttonWithText(fixture, 'Add book').click();
    expect(booksApi.import).toHaveBeenCalledWith({ isbn: '9780141439600', copies: 1, genre: null });

    afterClosed.mockReturnValueOnce(
      of({
        kind: 'update',
        request: {
          title: 'Dune II',
          author: 'Frank Herbert',
          genre: 'Science Fiction',
          description: '',
        },
      }),
    );
    click(fixture, 'button[aria-label="Edit Dune"]');
    expect(booksApi.update).toHaveBeenCalledWith(
      'book-1',
      expect.objectContaining({ title: 'Dune II' }),
    );
  });
});

describe('BookFormDialog', () => {
  const close = vi.fn();
  const lookup = vi.fn();

  function render(book: ReturnType<typeof aBook> | null) {
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: { book, genres: ['Gothic'] } },
        { provide: BooksApi, useValue: { lookup } },
      ],
    });

    return TestBed.createComponent(BookFormDialog);
  }

  beforeEach(() => close.mockReset());

  it('looks a book up by ISBN and imports it', async () => {
    lookup.mockReturnValue(
      of({
        isbn: '9780141439600',
        title: 'Carmilla',
        author: 'J. Sheridan Le Fanu',
        genre: 'Gothic',
      }),
    );
    const fixture = render(null);
    await fixture.whenStable();

    fill(fixture, 'input[formcontrolname=isbn]', '9780141439600');
    buttonWithText(fixture, 'Look up').click();
    await fixture.whenStable();

    expect(text(fixture)).toContain('Carmilla');

    buttonWithText(fixture, 'Import').click();

    expect(close).toHaveBeenCalledWith({
      kind: 'import',
      request: { isbn: '9780141439600', copies: 1, genre: 'Gothic' },
    });
  });

  it('edits the details of an existing book', async () => {
    const fixture = render(aBook({ isbn: '123', publishedYear: 1965 }));
    await fixture.whenStable();

    fill(fixture, 'input[formcontrolname=title]', 'Dune Messiah');
    buttonWithText(fixture, 'Save').click();

    expect(close).toHaveBeenCalledWith({
      kind: 'update',
      request: expect.objectContaining({ title: 'Dune Messiah', publishedYear: 1965, isbn: '123' }),
    });
  });
});

describe('ManageBookDialog', () => {
  const booksApi = {
    copies: vi.fn().mockReturnValue(
      of([
        {
          id: 'copy-1',
          barcode: 'DM-1',
          addedAt: '2026-01-01',
          withdrawnAt: null,
          isOnLoan: false,
        },
      ]),
    ),
    waitingList: vi.fn().mockReturnValue(of([])),
    addCopies: vi.fn().mockReturnValue(of([])),
    withdrawCopy: vi.fn().mockReturnValue(of(undefined)),
    refresh: vi.fn().mockReturnValue(of(aBook({ totalCopies: 4 }))),
    importGutenberg: vi.fn().mockReturnValue(of(aBook({ hasEbook: true, ebookLicenses: 3 }))),
  };
  const notifier = { success: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: aBook() },
        { provide: BooksApi, useValue: booksApi },
        { provide: Notifier, useValue: notifier },
      ],
    });
  });

  it('adds and withdraws printed copies', async () => {
    const fixture = TestBed.createComponent(ManageBookDialog);
    await fixture.whenStable();

    expect(text(fixture)).toContain('DM-1');

    buttonWithText(fixture, 'Add copies').click();
    await vi.waitFor(() => expect(booksApi.addCopies).toHaveBeenCalledWith('book-1', 1));

    buttonWithText(fixture, 'Withdraw').click();
    await vi.waitFor(() => expect(booksApi.withdrawCopy).toHaveBeenCalledWith('book-1', 'copy-1'));
    expect(notifier.success).toHaveBeenCalledWith('Copies added.');
  });
});
