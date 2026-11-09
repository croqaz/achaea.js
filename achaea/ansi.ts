/*
 * This is a heavily modified version of Ansicolor,
 * a JavaScript ANSI parsing.
 * https://github.com/xpl/ansicolor
 * By Vitalik Gordon (xpl) and contributors
 *
 * For ANSI/VT100 Control sequences, see:
 * https://misc.flogisoft.com/bash/tip_colors_and_formatting
 */

// deno-lint-ignore-file no-explicit-any no-control-regex

const colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'lightGray', '', 'default'],
  colorCodesLight = [
    'darkGray',
    'lightRed',
    'lightGreen',
    'lightYellow',
    'lightBlue',
    'lightMagenta',
    'lightCyan',
    'white',
    '',
  ],
  styleCodes = ['', 'bright', 'dim', 'italic', 'underline', '', '', 'inverse'],
  types = {
    0: 'style',
    2: 'unstyle',
    3: 'color',
    9: 'colorLight',
    4: 'bgColor',
    10: 'bgColorLight',
  },
  subtypes = {
    color: colorCodes,
    colorLight: colorCodesLight,
    bgColor: colorCodes,
    bgColorLight: colorCodesLight,
    style: styleCodes,
    unstyle: styleCodes,
  };

/* ------------------------------------------------------------------------- */

export declare interface ParsedColor {
  name?: string;
  bright?: boolean;
  dim?: boolean;
}

export class Color {
  name: string;
  background: boolean;
  brightness: boolean;

  constructor(background: boolean, name: string, brightness: boolean) {
    this.name = name;
    this.background = background;
    this.brightness = brightness;
  }

  get clean(): ParsedColor | undefined {
    const name = this.name === 'default' ? '' : this.name;
    const bright = this.brightness === Code.bright;
    const dim = this.brightness === Code.dim;

    if (!name && !bright && !dim) {
      return undefined;
    }

    return {
      name,
      bright,
      dim,
    };
  }

  defaultBrightness(value: boolean) {
    return new Color(this.background, this.name, this.brightness || value);
  }
}

/* ------------------------------------------------------------------------- */

export class Code {
  value?: number;
  type?: string;
  subtype?: string;
  str?: string;
  isBrightness?: boolean;

  constructor(n: string | undefined) {
    let value = undefined;
    let type = undefined;
    let subtype = undefined;
    let str = '';
    let isBrightness = false;

    if (n !== undefined) {
      value = Number(n);
      type = types[Math.floor(value / 10)];
      if (type === undefined || subtypes[type] === undefined) {
        return;
      }
      subtype = subtypes[type][value % 10];
      str = '\u001b[' + value + 'm';
      isBrightness = value === Code.noBrightness || value === Code.bright || value === Code.dim;
    }

    this.value = value;
    this.type = type;
    this.subtype = subtype;
    this.str = str;
    this.isBrightness = isBrightness;
  }

  static str(x: string | undefined): string {
    if (x === undefined) return '';
    return '\u001b[' + Number(x) + 'm';
  }
}

// Every Code instance is immutable, so the ones in the ANSI range are created once.
// (Code.value is derived from the number, so '031' and '31' are the same code)
const CODE_CACHE: Code[] = [];
const CODE_CACHE_SIZE = 256;
const EMPTY_CODE = new Code(undefined);

function codeFor(n: string): Code {
  const value = Number(n);
  if (value >= 0 && value < CODE_CACHE_SIZE) {
    return CODE_CACHE[value] || (CODE_CACHE[value] = new Code(n));
  }
  return new Code(n);
}

/* ------------------------------------------------------------------------- */

Object.assign(Code, {
  reset: 0,
  bright: 1,
  dim: 2,
  inverse: 7,
  noBrightness: 22,
  noItalic: 23,
  noUnderline: 24,
  noInverse: 27,
  noColor: 39,
  noBgColor: 49,
});

/* ------------------------------------------------------------------------- */

const ONE_MB = 1048576;
const TEXT = 0;
const BRACKET = 1;
const CODE = 2;

class Span {
  code: Code;
  text: string;
  italic?: boolean;
  bold?: boolean;
  underline?: boolean;
  inverse?: boolean;
  color?: Color;
  bgColor?: Color;
  bright?: boolean;
  dim?: boolean;

  constructor(code: Code, text: string) {
    this.code = code;
    this.text = text;

    // Those are added in the actual parse, this is done for
    // performance reasons to have the same hidden class
    this.color = undefined;
    this.bgColor = undefined;
    this.bold = undefined;
    this.inverse = undefined;
    this.italic = undefined;
    this.underline = undefined;
    this.bright = undefined;
    this.dim = undefined;
  }
}

// getString as function instead of string to allow garbage collection
function* rawParse(getString) {
  const stateObject = {
    state: TEXT,
    buffer: '',
    text: '',
    code: '',
    codes: [],
  };

  // Instead of holding the reference to the string we split into chunks of 1MB
  // and after processing is finished we can remove the reference so it can be GCed
  const str = getString();
  const chunks = str.length <= ONE_MB ? [str] : splitStringToChunksOfSize(str, ONE_MB);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Free memory for the previous chunk
    chunks[i] = undefined;
    yield* processChunk(chunk, stateObject);
  }

  if (stateObject.state !== TEXT) stateObject.text += stateObject.buffer;

  if (stateObject.text) {
    yield new Span(EMPTY_CODE, stateObject.text);
  }
}

function splitStringToChunksOfSize(str: string, chunkSize: number): string[] {
  const chunks = [];
  const chunksLength = Math.ceil(str.length / chunkSize);
  for (let i = 0, o = 0; i < chunksLength; ++i, o += chunkSize) {
    chunks.push(str.substring(o, o + chunkSize));
  }
  return chunks;
}

function* processChunk(chunk: string, stateObject: Record<string, any>) {
  const charsLength = chunk.length;
  let i = 0;

  while (i < charsLength) {
    if (stateObject.state === TEXT) {
      // Plain text: jump to the next escape char, all at once
      const esc = chunk.indexOf('\u001b', i);
      if (esc === -1) {
        stateObject.text += i === 0 ? chunk : chunk.slice(i);
        return;
      }
      stateObject.text += chunk.slice(i, esc);
      stateObject.state = BRACKET;
      stateObject.buffer = '\u001b';
      i = esc + 1;
      continue;
    }

    const c = chunk[i++];
    stateObject.buffer += c;

    switch (stateObject.state) {
      case BRACKET:
        if (c === '[') {
          stateObject.state = CODE;
          stateObject.code = '';
          stateObject.codes = [];
        } else {
          stateObject.state = TEXT;
          stateObject.text += stateObject.buffer;
        }
        break;

      case CODE:
        if (c >= '0' && c <= '9') {
          stateObject.code += c;
        } else if (c === ';') {
          stateObject.codes.push(codeFor(stateObject.code));
          stateObject.code = '';
        } else if (c === 'm') {
          stateObject.code = stateObject.code || '0';
          for (const code of stateObject.codes) {
            yield new Span(code, stateObject.text);
            stateObject.text = '';
          }

          yield new Span(codeFor(stateObject.code), stateObject.text);
          stateObject.text = '';
          stateObject.state = TEXT;
        } else {
          stateObject.state = TEXT;
          stateObject.text += stateObject.buffer;
        }
    }
  }
}

/**
 * Parse ansi text
 * @param {Generator<Span, void, *>} rawSpansIterator raw spans iterator
 * @return {Generator<Span, void, *>}
 */
function* parseAnsi(rawSpansIterator: Generator<Span>): Generator<Span> {
  let color = new Color(false);
  let bgColor = new Color(true /* background */);
  let brightness = undefined;
  const styles = new Set();
  // The parsed colors of the current state, computed once per state change
  let dirty = true;
  let fgClean: ParsedColor | undefined = undefined;
  let bgClean: ParsedColor | undefined = undefined;

  function reset() {
    color = new Color(false);
    bgColor = new Color(true /* background */);
    brightness = undefined;
    styles.clear();
    dirty = true;
  }

  reset();

  for (const span of rawSpansIterator) {
    const c = span.code;

    if (span.text !== '') {
      if (dirty) {
        fgClean = color.defaultBrightness(brightness).clean;
        bgClean = bgColor.clean;
        dirty = false;
      }

      const newSpan = new Span(span.code, span.text);

      newSpan.bold = brightness === Code.bright;
      newSpan.color = fgClean;
      newSpan.bgColor = bgClean;
      newSpan.inverse = styles.has('inverse');
      newSpan.italic = styles.has('italic');
      newSpan.underline = styles.has('underline');
      newSpan.bright = styles.has('bright');
      newSpan.dim = styles.has('dim');

      yield newSpan;
    }

    if (c.isBrightness) {
      brightness = c.value;
      dirty = true;
      continue;
    }

    if (span.code.value === undefined) {
      continue;
    }

    if (span.code.value === Code.reset) {
      reset();
      continue;
    }

    switch (span.code.type) {
      case 'color':
      case 'colorLight':
        color = new Color(false, c.subtype);
        dirty = true;
        break;

      case 'bgColor':
      case 'bgColorLight':
        bgColor = new Color(true, c.subtype);
        dirty = true;
        break;

      case 'style':
        styles.add(c.subtype);
        break;
      case 'unstyle':
        styles.delete(c.subtype);
        break;
    }
  }
}

/* ------------------------------------------------------------------------- */

/*  ANSI brightness codes do not overlap, e.g. "{bright}{dim}foo" will be rendered bright (not dim).
    So we fix it by adding brightness canceling before each brightness code, so the former example gets
    converted to "{noBrightness}{bright}{noBrightness}{dim}foo" – this way it gets rendered as expected.
 */

const denormalizeBrightness = (s: string) => s.replace(/(\u001b\[(1|2)m)/g, '\u001b[22m$1');
const normalizeBrightness = (s: string) => s.replace(/\u001b\[22m(\u001b\[(1|2)m)/g, '$1');
const replaceAll = (str: string, a: string, b: string) => str.split(a).join(b);

const wrap = (x: any, openCode: number, closeCode: number) => {
  const open = Code.str(openCode),
    close = Code.str(closeCode);

  return String(x)
    .split('\n')
    .map((line) => denormalizeBrightness(open + replaceAll(normalizeBrightness(line), close, open) + close))
    .join('\n');
};

const camel = (a: string, b: string) => a + b.charAt(0).toUpperCase() + b.slice(1);

const stringWrappingMethods = (() =>
  [
    ...colorCodes.map((k, i) =>
      !k
        ? []
        : [
            // color methods
            [k, 30 + i, Code.noColor],
            [camel('bg', k), 40 + i, Code.noBgColor],
          ],
    ),

    ...colorCodesLight.map((k, i) =>
      !k
        ? []
        : [
            // light color methods
            [k, 90 + i, Code.noColor],
            [camel('bg', k), 100 + i, Code.noBgColor],
          ],
    ),

    ...styleCodes.map((k, i) =>
      !k
        ? []
        : [
            // style methods
            [k, i, k === 'bright' || k === 'dim' ? Code.noBrightness : 20 + i],
          ],
    ),
  ].reduce((a, b) => a.concat(b)))();

const assignStringWrappingAPI = (target, wrapBefore = target) =>
  stringWrappingMethods.reduce(
    (memo, [k, open, close]) =>
      Object.defineProperty(memo, k, {
        get: () => assignStringWrappingAPI((str) => wrapBefore(wrap(str, open, close))),
      }),
    target,
  );

export const Colors = {};

assignStringWrappingAPI(Colors, (str: string) => str);

/* ------------------------------------------------------------------------- */

const STRIP_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;

/*
 * @desc strip ANSI codes from a string
 * @param {string} s a string containing ANSI escape codes.
 * @return {string} clean string.
 */
export function ansiStrip(s: string): string {
  return s.replace(STRIP_REGEX, '');
}

/*
 * @desc parse a string containing ANSI escape codes
 * @return {Span} parsed representation.
 */
export function ansiParse(s: string): Iterator<any> {
  const parsed = rawParse(typeof s === 'string' ? () => s : s);
  return parseAnsi(parsed);
}

const ELEM = 'span';

/*
 * Convert raw ANSI to HTML.
 */
export function ansi2Html(text: string, elem = ELEM): string {
  // Fast path: nothing to convert
  if (text.indexOf('\u001b') === -1) return text;

  let html = '';
  const parsed = rawParse(() => text);
  for (const el of parseAnsi(parsed)) {
    if (!el.text) {
      continue;
    }
    if (!el.color && !el.bgColor) {
      html += el.text;
      continue;
    }
    let cls = '';
    if (el.color) {
      if (el.color.name) {
        cls += ' c-' + el.color.name;
      }
      if (el.color.bright) {
        cls += ' c-bright';
      }
      if (el.color.dim) {
        cls += ' c-dim';
      }
      if (el.italic) {
        cls += ' italic';
      }
      if (el.underline) {
        cls += ' underline';
      }
      if (el.inverse) {
        cls += ' inverse';
      }
    }
    if (el.bgColor) {
      if (el.bgColor.name) {
        cls += ' bg-' + el.bgColor.name;
      }
      if (el.bgColor.bright) {
        cls += ' bg-bright';
      }
      if (el.bgColor.dim) {
        cls += ' bg-dim';
      }
    }
    html += '<' + elem + ' class="' + cls.slice(1) + '">' + el.text + '</' + elem + '>';
  }
  return html;
}
