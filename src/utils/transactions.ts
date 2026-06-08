import type { Transaction, TransactionType } from '@/src/types';

export type TypeFilter = 'ALL' | TransactionType;
export const TYPE_FILTERS: readonly TypeFilter[] = ['ALL', 'INCOME', 'EXPENSE'];

/** Client-side filtering (the API only filters by date range). */
export function filterTransactions(
  transactions: Transaction[],
  type: TypeFilter,
  category: string | null,
): Transaction[] {
  return transactions.filter(
    (t) =>
      (type === 'ALL' || t.type === type) &&
      (category === null || t.category === category),
  );
}

export interface TransactionSection {
  title: string; // the raw YYYY-MM-DD (formatted for display in the header)
  data: Transaction[];
}

/** Group into SectionList sections by date, most recent first. */
export function groupByDate(transactions: Transaction[]): TransactionSection[] {
  const byDate = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const existing = byDate.get(t.date);
    if (existing) existing.push(t);
    else byDate.set(t.date, [t]);
  }
  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0])) // YYYY-MM-DD sorts correctly as strings
    .map(([title, data]) => ({ title, data }));
}

/** Distinct categories present in the data (for the filter dropdown). */
export function distinctCategories(transactions: Transaction[]): string[] {
  return [...new Set(transactions.map((t) => t.category))].sort();
}
