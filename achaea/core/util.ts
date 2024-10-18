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

export function throttle<T, Args extends unknown[]>(fn: (...args: Args) => T, t: number) {
  /*
   * Throttle based on the args of the wrapped function.
   * Eg:
   * const throttled1 = throttle(() => 1, 5000)
   * throttled1('a') // would immediately run
   * throttled1('a') // would not run, you need to wait 5s
   * throttled1('b') // new param, would immediately run
   * throttled1('b') // param cached, you need to wait 5s
   */
  const __cache = new Map<string, any>();
  return function (...args: Args) {
    const argString = args.join('_');
    if (!__cache.has(argString)) {
      __cache.set(argString, true);
      setTimeout(() => {
        __cache.delete(argString);
      }, t);
      // pass the cb result
      return fn(...args);
    }
  };
}

export function debounce<T, Args extends unknown[]>(fn: (...args: Args) => T, t: number) {
  /*
   * Delay run based on the args of the wrapped function.
   * Eg:
   * const debounced1 = debounce(() => 1, 5000)
   * debounced1('a') // would not run, you need to wait 5s
   * debounced1('a') // would run after 5s
   * debounced1('b') // new param, you need to wait 5s
   * debounced1('b') // would run after 5s
   */
  const __cache = new Map<string, any>();
  return function (...args: Args) {
    const argString = args.join('_');
    if (!__cache.has(argString)) {
      let timeoutId = setTimeout(() => {
        __cache.delete(argString);
        // the cb result is lost
        fn(...args);
      }, t);
      __cache.set(argString, timeoutId);
    }
  };
}
