import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { alertService } from '@/src/services/alertService';

// The unread-alerts count is "lifted" here, above the bottom-tab navigator, so
// it's shared: the tab badge and the Dashboard badge read it, and the Alerts
// screen calls refresh() after marking alerts read — and every consumer updates.
interface UnreadAlertsValue {
  count: number;
  refresh: () => Promise<void>;
}

const UnreadAlertsContext = createContext<UnreadAlertsValue | undefined>(undefined);

export function UnreadAlertsProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setCount(await alertService.getUnreadCount());
    } catch {
      // Keep the last known count on a transient failure rather than zeroing it.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <UnreadAlertsContext.Provider value={{ count, refresh }}>{children}</UnreadAlertsContext.Provider>
  );
}

export function useUnreadAlerts(): UnreadAlertsValue {
  const ctx = useContext(UnreadAlertsContext);
  if (!ctx) {
    throw new Error('useUnreadAlerts must be used within an <UnreadAlertsProvider>');
  }
  return ctx;
}
