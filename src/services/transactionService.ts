import { api } from '@/src/services/api';
import type { Transaction, TransactionInput } from '@/src/types';
import { getCurrentMonthRange } from '@/src/utils/dates';

export const transactionService = {
  /**
   * Transactions within a date range. NOTE: the API only filters by date — it
   * ignores type/category query params — so those filters are applied
   * client-side (see utils/transactions).
   */
  async getRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>('/api/transactions', {
      params: { startDate, endDate },
    });
    return data;
  },

  async getCurrentMonth(): Promise<Transaction[]> {
    const { startDate, endDate } = getCurrentMonthRange();
    const { data } = await api.get<Transaction[]>('/api/transactions', {
      params: { startDate, endDate },
    });
    return data;
  },

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    const { data } = await api.post<Transaction>('/api/transactions', input);
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/api/transactions/${id}`);
  },
};
