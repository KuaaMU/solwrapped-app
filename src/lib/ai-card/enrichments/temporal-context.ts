// Build a TemporalContext using lunar-javascript for lunar + solar term computation.
// Computation is anchored to China timezone (UTC+8) because Chinese festivals
// are meaningful on the CN calendar day.

// @ts-expect-error — lunar-javascript ships no type declarations
import { Solar } from 'lunar-javascript';
import type { TemporalContext } from './types';

const CN_TZ_OFFSET_MIN = 480; // UTC+8

function toCnDate(now: Date): { y: number; m: number; d: number } {
  // Shift by CN offset and read as UTC — gives us the CN wall-clock date parts.
  const utc = new Date(now.getTime() + CN_TZ_OFFSET_MIN * 60_000);
  return {
    y: utc.getUTCFullYear(),
    m: utc.getUTCMonth() + 1,
    d: utc.getUTCDate(),
  };
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export function buildTemporalContext(now: Date = new Date()): TemporalContext {
  const { y, m, d } = toCnDate(now);
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();

  return {
    now,
    localDate: `${y}-${pad(m)}-${pad(d)}`,
    month: m,
    day: d,
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    solarTerm: lunar.getJieQi() || '',
  };
}
