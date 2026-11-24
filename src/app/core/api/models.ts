export type Role = 'Member' | 'Admin';

export type LoanStatus = 'Active' | 'Overdue' | 'Returned';

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

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  createdAt: string;
}

export interface BookRequest {
  title: string;
  author: string;
  description: string;
}

export interface Member {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  role: Role;
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
  memberId: string;
  loanDate: string;
  dueDate: string;
  returnedAt?: string;
  status: LoanStatus;
}

export interface BlacklistEntry {
  memberId: string;
  memberName: string;
  addedAt: string;
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
