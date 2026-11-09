/*
 * Super helpful utility functions that allow waiting for a specific game trigger,
 * and chaining successful commands.
 *
 *   await waitMatch('You bring your blade to your opposite hand');
 *   await execMatch('CRUX LET ME', 'You bring your blade to your opposite hand');
 *   await chainMatch(['WIELD SWORD', 'You wield'], ['CAST SPELL', /^You cast/m]);
 *
 * Every function resolves true when the game text was matched in time, false otherwise.
 * The listener is attached before the command is sent, so a quick game answer is never lost.
 */
import ee from '../events/index.ts';
import { userText } from './index.ts';
import { normText } from './util.ts';

// Default seconds to wait for the game text
export const MATCH_TIMEOUT = 5;

/*
 * What to wait for in the game text:
 * - a string: a piece of the text; the whitespace is normalized on both sides,
 *   so a long sentence still matches when the game wraps it on multiple lines
 * - a RegExp: tested against the text, and the normalized text
 * - a function: receives the plain text and the normalized text
 */
export type Trigger = string | RegExp | ((text: string, norm: string) => boolean);

export interface MatchOptions {
  // Seconds to wait for the game text
  timeout?: number;
  // Where the command goes; the game by default, a fake in tests
  send?: (cmd: string) => void;
  // Gives up waiting when aborted
  signal?: AbortSignal;
}

// One link of a chain: the command, the game text to wait for, and the seconds to wait
export type Link = [alias: string, trigger: Trigger, timeout?: number];

/*
 * Does one block of game text match the trigger?
 * The normalized text has all the whitespace collapsed to single spaces.
 */
export function matchText(trigger: Trigger, text: string, norm = normText(text)): boolean {
  if (typeof trigger === 'string') {
    return norm.includes(normText(trigger));
  }
  if (trigger instanceof RegExp) {
    // A global or sticky regex remembers the last match
    trigger.lastIndex = 0;
    if (trigger.test(text)) return true;
    trigger.lastIndex = 0;
    return trigger.test(norm);
  }
  return trigger(text, norm);
}

/*
 * Wait for some game text, for a number of seconds.
 * Resolves true as soon as the text is matched, false on timeout or abort.
 */
export function waitMatch(trigger: Trigger, timeout: number | MatchOptions = MATCH_TIMEOUT): Promise<boolean> {
  const opts = typeof timeout === 'number' ? { timeout } : timeout;
  // A bad timeout (NaN, Infinity, negative) would fire immediately
  const seconds = Number.isFinite(opts.timeout) && opts.timeout > 0 ? opts.timeout : MATCH_TIMEOUT;
  return new Promise((resolve) => {
    const done = (result: boolean) => {
      clearTimeout(timer);
      ee.off('game:text', onText);
      opts.signal?.removeEventListener('abort', onAbort);
      resolve(result);
    };
    const onText = (text: string, norm: string) => {
      // A broken trigger function must not break the game text pipeline
      let ok = false;
      try {
        ok = matchText(trigger, text, norm);
      } catch (err) {
        console.error('Match trigger crashed:', err);
      }
      if (ok) done(true);
    };
    const onAbort = () => done(false);
    const timer = setTimeout(() => done(false), seconds * 1000);

    if (opts.signal?.aborted) return done(false);
    ee.on('game:text', onText);
    opts.signal?.addEventListener('abort', onAbort);
  });
}

/*
 * Send a command to the game and wait for its answer, for a number of seconds.
 * Resolves true when the game text is matched, false on timeout or abort.
 */
export function execMatch(
  alias: string,
  trigger: Trigger,
  timeout: number | MatchOptions = MATCH_TIMEOUT,
): Promise<boolean> {
  const opts = typeof timeout === 'number' ? { timeout } : timeout;
  const send = opts.send || userText;
  // Listen first, the game may answer before the next tick
  const promise = waitMatch(trigger, opts);
  send(alias);
  return promise;
}

/*
 * Run a chain of commands, each one only when the previous one matched its game text:
 *   chainMatch(['WIELD SWORD', 'You wield'], ['CAST SPELL', 'You cast', 10])
 * The links can also be passed as one array.
 * Resolves true when the whole chain matched, false at the first failure.
 */
export async function chainMatch(...links: Link[] | [Link[]] | [Link[], MatchOptions]): Promise<boolean> {
  let chain: Link[] = links as Link[];
  let opts: MatchOptions = {};
  if (links.length && Array.isArray(links[0][0])) {
    chain = links[0] as Link[];
    opts = (links[1] as MatchOptions) || {};
  }
  for (const [alias, trigger, timeout] of chain) {
    const ok = await execMatch(alias, trigger, {
      ...opts,
      timeout: timeout ?? opts.timeout,
    });
    if (!ok) return false;
  }
  return true;
}
