// Date helpers for API queries. Kept pure (no side effects) so they're easy to test.

/** Date -> 'YYYY-MM-DD' using LOCAL time (avoids the UTC off-by-one of toISOString). */
export function toISODateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** 'YYYY-MM-DD' -> local Date (parsed as local midnight, not UTC). */
export function fromISODateString(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** First and last day of the current month, as YYYY-MM-DD strings. */
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // day 0 of next month
  return { startDate: toISODateString(start), endDate: toISODateString(end) };
}

/** 'YYYY-MM-DD' -> e.g. "Fri, Jun 5" for section headers. */
export function formatDateHeading(iso: string): string {
  return fromISODateString(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Relative section header: "Today" / "Yesterday" / "Mar 15" (+ year if older). */
export function formatSectionDate(iso: string): string {
  const date = fromISODateString(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(
    undefined,
    sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' },
  );
}
