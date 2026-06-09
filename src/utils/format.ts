// Display formatting helpers.

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const wholeCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Currency without cents, e.g. "$3,200" — for compact pills/labels. */
export function formatCurrencyWhole(amount: number): string {
  return wholeCurrencyFormatter.format(amount);
}
