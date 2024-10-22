/*
 * This is a modified version of Ansicolor,
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
  asBright = {
    red: 'lightRed',
    green: 'lightGreen',
    yellow: 'lightYellow',
    blue: 'lightBlue',
    magenta: 'lightMagenta',
    cyan: 'lightCyan',
    black: 'darkGray',
    lightGray: 'white',
  },
  types = { 0: 'style', 2: 'unstyle', 3: 'color', 9: 'colorLight', 4: 'bgColor', 10: 'bgColorLight' },
  subtypes = {
    color: colorCodes,
    colorLight: colorCodesLight,
    bgColor: colorCodes,
    bgColorLight: colorCodesLight,
    style: styleCodes,
    unstyle: styleCodes,
  };

const RGB: Record<string, number[]> = {
  black: [0, 0, 0],
  darkGray: [100, 100, 100],
  lightGray: [200, 200, 200],
  white: [255, 255, 255],

  red: [204, 0, 0],
  lightRed: [255, 51, 0],

  green: [0, 204, 0],
  lightGreen: [51, 204, 51],

  yellow: [204, 102, 0],
  lightYellow: [255, 153, 51],

  blue: [0, 0, 255],
  lightBlue: [26, 140, 255],

  magenta: [204, 0, 204],
  lightMagenta: [255, 0, 255],

  cyan: [0, 153, 255],
  lightCyan: [0, 204, 255],
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

  get inverse() {
    return new Color(!this.background, this.name || (this.background ? 'black' : 'white'), this.brightness);
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

  css(inverted: boolean) {
    const color: Color = inverted ? this.inverse : this;

    const rgbName: string = (color.brightness === Code.bright && asBright[color.name]) || color.name;

    const prop = color.background ? 'background:' : 'color:',
      rgb = RGB[rgbName],
      alpha = this.brightness === Code.dim ? 0.5 : 1;

    return rgb
      ? prop + 'rgba(' + [...rgb, alpha].join(',') + ');'
      : !color.background && alpha < 1
        ? 'color:rgba(0,0,0,0.5);'
        : ''; // Chrome doesn't support 'opacity' property...
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

  clone() {
    const newCode = new Code(undefined);
    newCode.value = this.value;
    newCode.type = this.type;
    newCode.subtype = this.subtype;
    newCode.str = this.str;
    newCode.isBrightness = this.isBrightness;
    return newCode;
  }
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

    // Those are added in the actual parse, this is done for performance reasons to have the same hidden class
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
  const chunks = splitStringToChunksOfSize(getString(), ONE_MB);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Free memory for the previous chunk
    chunks[i] = undefined;
    yield* processChunk(chunk, stateObject);
  }

  if (stateObject.state !== TEXT) stateObject.text += stateObject.buffer;

  if (stateObject.text) {
    yield new Span(new Code(), stateObject.text);
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
  const chars = chunk;
  const charsLength = chunk.length;

  for (let i = 0; i < charsLength; i++) {
    const c = chars[i];

    stateObject.buffer += c;

    switch (stateObject.state) {
      case TEXT:
        if (c === '\u001b') {
          stateObject.state = BRACKET;
          stateObject.buffer = c;
        } else {
          stateObject.text += c;
        }
        break;

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
          stateObject.codes.push(new Code(stateObject.code));
          stateObject.code = '';
        } else if (c === 'm') {
          stateObject.code = stateObject.code || '0';
          for (const code of stateObject.codes) {
            yield new Span(code, stateObject.text);
            stateObject.text = '';
          }

          yield new Span(new Code(stateObject.code), stateObject.text);
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
  let color = new Color();
  let bgColor = new Color(true /* background */);
  let brightness = undefined;
  const styles = new Set();

  function reset() {
    color = new Color();
    bgColor = new Color(true /* background */);
    brightness = undefined;
    styles.clear();
  }

  reset();

  for (const span of rawSpansIterator) {
    const c = span.code;

    if (span.text !== '') {
      const inverted = styles.has('inverse');
      const underline = styles.has('underline') ? 'text-decoration: underline;' : '';
      const italic = styles.has('italic') ? 'font-style: italic;' : '';
      const bold = brightness === Code.bright ? 'font-weight: bold;' : '';

      const foreColor = color.defaultBrightness(brightness);

      const newSpan = new Span(span.code ? span.code.clone() : undefined, span.text);

      newSpan.bold = span.bold ? span.bold : !!bold;
      newSpan.color = span.color ? span.color : foreColor.clean;
      newSpan.bgColor = span.bgColor ? span.bgColor : bgColor.clean;
      newSpan.inverse = inverted;
      newSpan.italic = !!italic;
      newSpan.underline = !!underline;
      newSpan.bright = styles.has('bright');
      newSpan.dim = styles.has('dim');

      yield newSpan;
    }

    if (c.isBrightness) {
      brightness = c.value;
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
        break;

      case 'bgColor':
      case 'bgColorLight':
        bgColor = new Color(true, c.subtype);
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
  const parts = [];
  const parsed = rawParse(() => text);
  for (const el of parseAnsi(parsed)) {
    if (!el.text) {
      continue;
    }
    const cls = [];
    if (el.color) {
      if (el.color.name) {
        cls.push(`c-${el.color.name}`);
      }
      if (el.color.bright) {
        cls.push('c-bright');
      }
      if (el.color.dim) {
        cls.push('c-dim');
      }
      if (el.italic) {
        cls.push('italic');
      }
      if (el.underline) {
        cls.push('underline');
      }
      if (el.inverse) {
        cls.push('inverse');
      }
    }
    if (el.bgColor) {
      if (el.bgColor.name) {
        cls.push(`bg-${el.bgColor.name}`);
      }
      if (el.bgColor.bright) {
        cls.push('bg-bright');
      }
      if (el.bgColor.dim) {
        cls.push('bg-dim');
      }
    }
    parts.push(el.color || el.bgColor ? `<${elem} class="${cls.join(' ')}">${el.text}</${elem}>` : el.text);
  }
  return parts.join('');
}
