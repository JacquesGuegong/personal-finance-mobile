import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Keyword → icon. Categories are free-form strings (the AI returns things like
// "Dining"), so we match on substrings rather than a fixed enum.
const RULES: { keywords: string[]; icon: IoniconName }[] = [
  { keywords: ['dining', 'restaurant', 'food', 'coffee', 'cafe'], icon: 'restaurant-outline' },
  { keywords: ['grocery', 'groceries', 'supermarket'], icon: 'cart-outline' },
  { keywords: ['salary', 'income', 'pay', 'wage', 'deposit'], icon: 'cash-outline' },
  { keywords: ['transport', 'uber', 'taxi', 'gas', 'fuel', 'car', 'transit'], icon: 'car-outline' },
  { keywords: ['rent', 'housing', 'home', 'mortgage'], icon: 'home-outline' },
  { keywords: ['shopping', 'clothes', 'retail'], icon: 'bag-handle-outline' },
  { keywords: ['entertain', 'movie', 'music', 'game', 'subscription'], icon: 'film-outline' },
  { keywords: ['health', 'medical', 'pharmacy', 'doctor'], icon: 'medkit-outline' },
  { keywords: ['util', 'bill', 'electric', 'water', 'internet', 'phone'], icon: 'flash-outline' },
  { keywords: ['travel', 'flight', 'hotel'], icon: 'airplane-outline' },
];

export function categoryIcon(category: string): IoniconName {
  const c = category.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => c.includes(k))) return rule.icon;
  }
  return 'pricetag-outline';
}
