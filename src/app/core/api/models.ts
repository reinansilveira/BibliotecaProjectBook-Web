export type Role = 'Member' | 'Admin';

export type BookFormat = 'Print' | 'Ebook';

export type LoanStatus = 'Active' | 'Overdue' | 'Returned' | 'Expired';

export type ReservationStatus = 'Waiting' | 'Ready' | 'Fulfilled' | 'Cancelled' | 'Expired';

export type FineStatus = 'Unpaid' | 'Paid' | 'Waived';

export type BookSort = 'Title' | 'Newest' | 'Rating' | 'Popular' | 'Year';

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PageQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export interface BookQuery extends PageQuery {
  genre?: string;
  author?: string;
  yearFrom?: number;
  yearTo?: number;
  format?: BookFormat;
  availableOnly?: boolean;
  sort?: BookSort;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  isbn?: string | null;
  publishedYear?: number | null;
  coverUrl?: string | null;
  createdAt: string;
  totalCopies: number;
  availableCopies: number;
  hasEbook: boolean;
  ebookLicenses: number;
  availableEbookLicenses: number;
  waitingCount: number;
  averageRating: number;
  ratingsCount: number;
}

export interface BookRequest {
  title: string;
  author: string;
  description: string;
  genre: string;
  isbn?: string | null;
  publishedYear?: number | null;
  coverUrl?: string | null;
}

export interface CreateBookRequest extends BookRequest {
  copies: number;
}

export interface BookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
}

export interface Genre {
  name: string;
  books: number;
}

export interface BookMetadata {
  isbn?: string | null;
  title?: string | null;
  author?: string | null;
  description?: string | null;
  genre?: string | null;
  publishedYear?: number | null;
  coverUrl?: string | null;
}

export interface ImportBookRequest {
  isbn: string;
  copies: number;
  genre?: string | null;
}

export interface BookCopy {
  id: string;
  barcode?: string | null;
  addedAt: string;
  withdrawnAt?: string | null;
  isOnLoan: boolean;
}

export interface Member {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  role: Role;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface RegisterMemberRequest {
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  password: string;
}

export interface UpdateMemberRequest {
  name: string;
  birthDate: string;
  phone: string;
  email: string;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverUrl?: string | null;
  memberId: string;
  format: BookFormat;
  loanDate: string;
  dueDate: string;
  returnedAt?: string | null;
  status: LoanStatus;
  renewalsLeft: number;
  readingProgress: number;
  readingLocation?: string | null;
}

export interface ReadingLink {
  url: string;
  expiresAt: string;
  fileFormat: 'epub' | 'pdf';
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverUrl?: string | null;
  memberId: string;
  memberName: string;
  format: BookFormat;
  status: ReservationStatus;
  position?: number | null;
  createdAt: string;
  readyAt?: string | null;
  expiresAt?: string | null;
}

export interface Review {
  id: string;
  bookId: string;
  memberId: string;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  rating: number;
  comment: string;
}

export interface Fine {
  id: string;
  memberId: string;
  memberName: string;
  loanId: string;
  bookTitle: string;
  daysOverdue: number;
  dailyRate: number;
  amount: number;
  currency: string;
  status: FineStatus;
  issuedAt: string;
  resolvedAt?: string | null;
  paymentReference?: string | null;
}

export interface Standing {
  canBorrow: boolean;
  activeLoans: number;
  maxActiveLoans: number;
  overdueLoans: number;
  unpaidFines: number;
  currency: string;
  reasons: string[];
}

export interface GenreCount {
  genre: string;
  loans: number;
}

export interface MonthCount {
  month: string;
  loans: number;
}

export interface ReadingStats {
  totalLoans: number;
  booksRead: number;
  ebooksRead: number;
  activeLoans: number;
  booksThisYear: number;
  reviewsWritten: number;
  averageRatingGiven: number;
  favoriteGenre?: string | null;
  topGenres: GenreCount[];
  lastTwelveMonths: MonthCount[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  memberId: string;
  name: string;
  role: Role;
}

export interface MostBorrowedBook {
  rank: number;
  bookId: string;
  title: string;
  author: string;
  totalLoans: number;
}

export interface MonthlyOverdue {
  month: number;
  totalLoans: number;
  overdueLoans: number;
  overduePercentage: number;
  averageDaysOverdue: number;
}

export interface Dashboard {
  books: number;
  copies: number;
  ebooks: number;
  members: number;
  newMembersThisMonth: number;
  activeLoans: number;
  activeEbookLoans: number;
  overdueLoans: number;
  loansToday: number;
  returnsToday: number;
  waitingReservations: number;
  readyReservations: number;
  unpaidFines: number;
  unpaidFinesAmount: number;
  topBooksThisMonth: MostBorrowedBook[];
}

export interface MaintenanceResult {
  expiredEbookLoans: number;
  expiredHolds: number;
  promotedReservations: number;
  dueSoonReminders: number;
  overdueNotices: number;
}

export interface AuditEntry {
  id: string;
  occurredAt: string;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes?: string | null;
}

export interface AuditQuery {
  page: number;
  pageSize: number;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  from?: string;
  to?: string;
}
