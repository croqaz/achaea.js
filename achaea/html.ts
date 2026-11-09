/*
 * Common HTML helpers.
 * Used to generate elements and colors in the web GUI.
 *
 * The colors & modifiers are the ones the ANSI parser (ansi.ts) emits
 * and the themes (themes/style.scss) know how to style:
 *
 *   i('text')            -> <i>text</i>
 *   i.red('text')        -> <i class="c-red">text</i>
 *   i.dim.red('text')    -> <i class="c-dim c-red">text</i>
 *   b.bright.yellow('!') -> <b class="c-bright c-yellow">!</b>
 *   b.bgBlue('text')     -> <b class="bg-blue">text</b>
 *   error('Path', 'No path!') -> <i class="c-dim c-red"><b>[Path]</b>: No path!</i>
 *   info('DB', '12 saved')    -> <i class="c-darkGray"><b>[DB]</b>: 12 saved</i>
 *
 * The text is NOT escaped, so HTML inside the text is allowed;
 * text coming from the game must be passed through escapeHtml() first.
 *
 * Performance: these are on the hot path, between the game and the GUI.
 * Every chain (i.dim.red, b.bgBlue, ...) is built ONCE at load time,
 * with its tags already rendered, so a call is a single string concat.
 * No Proxy, no per-call allocation, no class-name parsing.
 */

export const COLORS = Object.freeze([
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'darkGray',
  'lightGray',
  'white',
] as const);

export type Color = (typeof COLORS)[number];
export type BgColor = `bg${Capitalize<Color>}`;

/** Wraps a text in a tag: i.red('text') */
export type Wrap = (text: string) => string;
/** A wrap with a color per property: i.red, i.bgRed, ... */
export type Colored = Wrap & Readonly<Record<Color | BgColor, Wrap>>;
/** A tag with the color modifiers: i.dim.red, i.bright.red, ... */
export type Tag = Colored & Readonly<{ dim: Colored; bright: Colored }>;

function wrap(tag: string, cls: string): Wrap {
  const open = cls ? `<${tag} class="${cls}">` : `<${tag}>`;
  const close = `</${tag}>`;
  return (text: string) => open + text + close;
}

function colored(tag: string, modifier: string): Colored {
  const fn = wrap(tag, modifier) as Colored;
  const prefix = modifier ? modifier + ' ' : '';
  for (const c of COLORS) {
    (fn as any)[c] = wrap(tag, `${prefix}c-${c}`);
    (fn as any)[`bg${c.charAt(0).toUpperCase()}${c.slice(1)}`] = wrap(tag, `${prefix}bg-${c}`);
  }
  return fn;
}

function makeTag(tag: string): Tag {
  const t = colored(tag, '') as Tag;
  (t as any).dim = Object.freeze(colored(tag, 'c-dim'));
  (t as any).bright = Object.freeze(colored(tag, 'c-bright'));
  return Object.freeze(t);
}

/** Italic: i('text'), i.red('text'), i.dim.red('text') */
export const i: Tag = makeTag('i');

/** Bold: b('text'), b.red('text'), b.bright.red('text') */
export const b: Tag = makeTag('b');

const ERROR_OPEN = '<i class="c-dim c-red"><b>[';
const INFO_OPEN = '<i class="c-darkGray"><b>[';
const PREFIX_CLOSE = ']</b>: ';
const CLOSE = '</i>';

/** A standard error message from a module: error('Path', 'No path was found!') */
export function error(module: string, text: string): string {
  return ERROR_OPEN + module + PREFIX_CLOSE + text + CLOSE;
}

/** A standard info message from a module: info('DB', '12 entries saved in WARES.') */
export function info(module: string, text: string): string {
  return INFO_OPEN + module + PREFIX_CLOSE + text + CLOSE;
}

/**
 * A loud, full-width message, for things that are NOT normal gameplay:
 * banner('red', 'Record', 'RECORDING from the Guard room...')
 * Styled by .banner in the theme; sent as sys:html, not sys:text.
 */
export function banner(color: Color, module: string, text: string): string {
  return `<div class="banner bg-${color}"><b>[${module}]</b> ${text}</div>`;
}
