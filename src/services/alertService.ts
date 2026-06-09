import { api } from '@/src/services/api';
import type { Alert, AlertType } from '@/src/types';

export const alertService = {
  /** Every alert, read and unread, all types. */
  async getAll(): Promise<Alert[]> {
    const { data } = await api.get<Alert[]>('/api/alerts/all');
    return data;
  },

  /** Unread alerts only, every type. */
  async getUnread(): Promise<Alert[]> {
    const { data } = await api.get<Alert[]>('/api/alerts');
    return data;
  },

  /** Read + unread, filtered to one type (e.g. ANOMALY). */
  async getByType(type: AlertType): Promise<Alert[]> {
    const { data } = await api.get<Alert[]>('/api/alerts', { params: { type } });
    return data;
  },

  /** Mark a single alert read; returns the updated alert. */
  async markRead(id: string): Promise<Alert> {
    const { data } = await api.put<Alert>(`/api/alerts/${id}/read`);
    return data;
  },

  /** Mark every alert read; returns how many were cleared. */
  async markAllRead(): Promise<number> {
    const { data } = await api.put<{ count: number }>('/api/alerts/read-all');
    return data.count;
  },

  /** Unread count for the badge. */
  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ count: number }>('/api/alerts/count');
    return data.count;
  },
};
