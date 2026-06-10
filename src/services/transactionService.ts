import { api } from '@/src/services/api';
import type { PageResponse, Transaction, TransactionInput } from '@/src/types';
import { getCurrentMonthRange } from '@/src/utils/dates';

// Server hard-caps page size at 100 — never request more.
const MAX_PAGE_SIZE = 100;

export type TransactionQuery = {
  startDate: string;
  endDate: string;
  category?: string;
  page?: number;
  size?: number;
};

// GET /api/transactions returns a pagination envelope:
//   { content, page, size, totalElements, totalPages, hasNext }
// Server sort is fixed (date descending, stable) — do NOT re-sort client-side.
async function fetchPage(query: TransactionQuery): Promise<PageResponse<Transaction>> {
  const { data } = await api.get<PageResponse<Transaction>>('/api/transactions', {
    params: {
      startDate: query.startDate,
      endDate: query.endDate,
      ...(query.category ? { category: query.category } : {}),
      page: query.page ?? 0,
      size: query.size ?? 20,
    },
  });
  return data;
}

// Fetch EVERY row in a range by following `hasNext`. Needed for aggregates that
// span the whole month (dashboard totals, insights category breakdown) — a single
// page would silently miss rows. Trusts the server's echoed paging, not the ask.
async function fetchAll(query: Omit<TransactionQuery, 'page' | 'size'>): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let page = 0;
  // safety cap so a bad `hasNext` can't loop forever
  for (let guard = 0; guard < 100; guard += 1) {
    const res = await fetchPage({ ...query, page, size: MAX_PAGE_SIZE });
    all.push(...res.content);
    if (!res.hasNext) break;
    page += 1;
  }
  return all;
}

export const transactionService = {
  /** One page of transactions — the list screen drives pagination with this. */
  getPage: fetchPage,

  /** Every transaction in the current month (aggregates need all rows, not one page). */
  async getCurrentMonth(): Promise<Transaction[]> {
    return fetchAll(getCurrentMonthRange());
  },

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    const { data } = await api.post<Transaction>('/api/transactions', input);
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/api/transactions/${id}`);
  },
};
