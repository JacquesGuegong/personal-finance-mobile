// The API sends createdAt with NO timezone (e.g. "2026-06-07T20:44:46.306").
// We parse it explicitly as LOCAL time and guard against malformed values.

export function parseLocalDateTime(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (m) {
    const [, y, mo, d, h, min, s, frac] = m;
    const ms = frac ? Number(frac.padEnd(3, '0').slice(0, 3)) : 0;
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(min), Number(s), ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // Fallback for any other format (e.g. one that includes an offset).
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatRelativeTime(value: string): string {
  const date = parseLocalDateTime(value);
  if (!date) return 'Unknown time';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now'; // clock skew / future timestamp

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? '1 minute ago' : `${min} minutes ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? '1 hour ago' : `${hr} hours ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
