// When is Black Friday, and how long until it starts (or ends), in the visitor's own time zone.
// Black Friday is the day after US Thanksgiving (the fourth Thursday of November): always the Friday
// between the 23rd and the 29th of November.

/** Local midnight at the start of Black Friday in year y. */
export function blackFriday(y) {
  const firstDow = new Date(y, 10, 1).getDay(); // 0 = Sunday
  const firstThursday = 1 + ((4 - firstDow + 7) % 7);
  return new Date(y, 10, firstThursday + 21 + 1);
}

/**
 * Where `now` (ms) stands:
 *   mode 'before': counting to the start of this year's Black Friday
 *   mode 'today':  it is Black Friday; counting to local midnight at its end
 *   mode 'after':  this year's is over; counting to the start of next year's
 * `to` is the moment counted to (ms); `left` the ms remaining.
 */
export function status(now) {
  const y = new Date(now).getFullYear();
  const start = blackFriday(y).getTime();
  const end = new Date(y, 10, new Date(start).getDate() + 1).getTime();
  let mode, to;
  if (now < start) { mode = 'before'; to = start; }
  else if (now < end) { mode = 'today'; to = end; }
  else { mode = 'after'; to = blackFriday(y + 1).getTime(); }
  return { mode, to, left: Math.max(0, to - now) };
}

/** The clock's units for a status: [['DAYS', '06'], ['HRS', '12'], ...]. On the day: HRS MIN SEC only. */
export function units({ mode, left }) {
  const sec = Math.floor(left / 1000);
  const d = Math.floor(sec / 86400), h = Math.floor(sec / 3600) % 24, m = Math.floor(sec / 60) % 60, s = sec % 60;
  const two = (v) => String(v).padStart(2, '0');
  if (mode === 'today') return [['HRS', two(Math.floor(sec / 3600))], ['MIN', two(m)], ['SEC', two(s)]];
  return [['DAYS', two(d)], ['HRS', two(h)], ['MIN', two(m)], ['SEC', two(s)]];
}

/**
 * The ?now= override: an ISO date or date-time, or ms since the epoch. A bare date (2026-11-27) means
 * local midnight; a date-time without an offset (2026-11-27T14:00) is local time. Returns ms or null.
 */
export function parseNow(v) {
  if (v == null) return null;
  v = v.trim();
  if (!v) return null;
  if (/^-?\d{6,}$/.test(v)) return Number(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (m) return new Date(+m[1], m[2] - 1, +m[3]).getTime();
  // a "+01:00" offset arrives as " 01:00" when the + was not escaped in the URL
  const t = Date.parse(v.replace(/ (\d\d:?\d\d)$/, '+$1'));
  return Number.isNaN(t) ? null : t;
}
