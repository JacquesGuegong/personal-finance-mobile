import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { AlertType } from '@/src/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Icon + color per alert type: WARNING amber, EXCEEDED red, ANOMALY purple.
export const ALERT_VISUAL: Record<AlertType, { icon: IoniconName; color: string }> = {
  WARNING: { icon: 'warning-outline', color: '#ff9f0a' },
  EXCEEDED: { icon: 'alert-circle-outline', color: '#ff3b30' },
  ANOMALY: { icon: 'pulse-outline', color: '#af52de' },
};

// The three filter tabs. Each maps to a different endpoint in AlertsScreen.
export type AlertTab = 'ALL' | 'UNREAD' | 'ANOMALY';
export const ALERT_TABS: readonly AlertTab[] = ['ALL', 'UNREAD', 'ANOMALY'];
