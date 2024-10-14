/** Splits a string into space separated words. */
export function words(str: string, divider = /\s+/) {
  if (!str) return [];
  return str.trim().split(divider);
}

/** Normalize spaces and newlines. */
export function normText(str: string): string {
  if (!str) return '';
  return str.trim().split(/\s+/).join(' ');
}

/** Simple escape HTML. */
export function escapeHtml(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** ISO date, as string. */
export function isoDate(): string {
  return new Date().toISOString().split('.')[0];
}

/** Date difference, calculated in hours. */
export function dateDiff(d1: any, d2: any): number {
  const d = Math.abs(new Date(d1).getTime() - new Date(d2).getTime());
  return d / 1000 / 3600;
}

/** Returns a promise that resolves after a fixed time. */
export function sleep(sec: number) {
  return new Promise((r) => setTimeout(r, Math.round(sec * 1000)));
}

/**
 * Function wrapper that prevents a function from being executed more than once
 * every t ms. This is particularly useful for optimising callbacks for
 * continues events like scroll, resize or slider move. Setting `forceDelay`
 * to `true` means that even the first function call is after the minimum
 * timout, rather than instantly.
 * https://github.com/mathigon/core.js/blob/master/src/utilities.ts
 * (C) Philipp Legner & contributors
 */
export function throttle<Args extends unknown[]>(fn: (...args: Args) => void, t = 1, forceDelay = false) {
  let delay = false;
  let repeat = false;
  return (...args: Args) => {
    if (delay) {
      repeat = true;
    } else {
      if (forceDelay) {
        repeat = true;
      } else {
        fn(...args);
      }
      delay = true;
      setTimeout(() => {
        if (repeat) fn(...args);
        delay = repeat = false;
      }, t);
    }
  };
}
