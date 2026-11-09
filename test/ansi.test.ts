import path from 'node:path';
import fs from 'node:fs';
import * as tel from '../achaea/telnet.ts';
import { loadTrace } from '../achaea/logs/trace.ts';
import { expect, test } from 'bun:test';
import { escapeHtml } from '../achaea/core/util.ts';
import { describe, expect, test } from 'bun:test';
import { ansi2Html, ansiParse, ansiStrip, Colors as ansi } from '../achaea/ansi.ts';

const E = '\u001b';

test('ansi codes', () => {
  //
  // From: https://github.com/xpl/ansicolor/blob/master/test.js
  //
  expect('foo' + ansi.green(ansi.inverse(ansi.bgLightCyan('bar') + 'baz') + 'qux')).toBe(
    'foo\u001b[32m\u001b[7m\u001b[106mbar\u001b[49mbaz\u001b[27mqux\u001b[39m',
  );

  expect(ansi.underline.bright.green('chai' + ansi.dim.red.bgLightCyan('ning'))).toBe(
    '\u001b[4m\u001b[22m\u001b[1m\u001b[32mchai\u001b[22m\u001b[2m\u001b[31m\u001b[106mning\u001b[49m\u001b[32m\u001b[22m\u001b[1m\u001b[39m\u001b[22m\u001b[24m',
  );

  expect(ansi.bright('foo' + ansi.dim('bar') + 'baz')).toBe(
    '\u001b[22m\u001b[1mfoo\u001b[22m\u001b[2mbar\u001b[22m\u001b[1mbaz\u001b[22m',
  );

  expect(ansi.blue(ansi.green(ansi.red('red') + 'green') + 'blue')).toBe(
    '\u001b[34m\u001b[32m\u001b[31mred\u001b[32mgreen\u001b[34mblue\u001b[39m',
  );

  expect(ansi.red(ansi.cyan('foo') + 'bar')).toBe('\u001b[31m\u001b[36mfoo\u001b[31mbar\u001b[39m');
  expect(ansi.bgRed(ansi.bgCyan('foo') + 'bar')).toBe('\u001b[41m\u001b[46mfoo\u001b[41mbar\u001b[49m');
  expect(ansi.bgLightRed(ansi.bgLightCyan('foo') + 'bar')).toBe('\u001b[101m\u001b[106mfoo\u001b[101mbar\u001b[49m');
  expect(ansi.underline(ansi.underline('foo') + 'bar')).toBe('\u001b[4m\u001b[4mfoo\u001b[4mbar\u001b[24m');

  expect(ansi.bright(ansi.bright('foo') + 'bar')).toBe(
    '\u001b[22m\u001b[1m\u001b[22m\u001b[1mfoo\u001b[22m\u001b[1mbar\u001b[22m',
  );
  expect(ansi.dim(ansi.dim('foo') + 'bar')).toBe(
    '\u001b[22m\u001b[2m\u001b[22m\u001b[2mfoo\u001b[22m\u001b[2mbar\u001b[22m',
  );
  expect(ansi.inverse(ansi.inverse('foo') + 'bar')).toBe('\u001b[7m\u001b[7mfoo\u001b[7mbar\u001b[27m');
});

test('ansi parse', () => {
  const raw = ansi.underline(ansi.italic(ansi.bright(ansi.bgLightRed('foo')))) + ansi.dim(ansi.red('bar'));
  const parsed = Array.from(ansiParse(raw));
  expect(parsed[0]).toEqual({
    italic: true,
    bold: true,
    underline: true,
    bright: false,
    dim: false,
    inverse: false,
    color: { bright: true, dim: false, name: undefined },
    bgColor: {
      bright: false,
      dim: false,
      name: 'lightRed',
    },
    text: 'foo',
    code: {
      isBrightness: false,
      str: '\u001b[49m',
      subtype: 'default',
      type: 'bgColor',
      value: 49,
    },
  });
  expect(parsed[1]).toEqual({
    bgColor: undefined,
    bold: false,
    bright: false,
    code: {
      isBrightness: false,
      str: '\u001b[39m',
      subtype: 'default',
      type: 'color',
      value: 39,
    },
    color: {
      bright: false,
      dim: true,
      name: 'red',
    },
    dim: false,
    inverse: false,
    italic: false,
    text: 'bar',
    underline: false,
  });
});

test('ANSI to HTML', () => {
  expect(ansi2Html(ansi.red('r'))).toBe('<span class="c-red">r</span>');
  expect(ansi2Html(ansi.green('g'), 'b')).toBe('<b class="c-green">g</b>');
  expect(ansi2Html(ansi.blue('b'), 'i')).toBe('<i class="c-blue">b</i>');

  expect(ansi2Html(ansi.dim.green('dg'))).toBe('<span class="c-green c-dim">dg</span>');
  expect(ansi2Html(ansi.italic.blue('ib'))).toBe('<span class="c-blue italic">ib</span>');
  expect(ansi2Html(ansi.underline.red('ur'))).toBe('<span class="c-red underline">ur</span>');
});

describe('ansi2Html edge cases', () => {
  const cases: [string, string, string][] = [
    // name, input, expected <span> HTML
    ['empty', '', ''],
    ['plain', 'plain text, no codes', 'plain text, no codes'],
    ['lone ESC', `a${E}b`, `a${E}b`],
    ['ESC[ at end', `a${E}[`, `a${E}[`],
    ['partial code at end', `a${E}[3`, `a${E}[3`],
    ['partial code at end 2', `a${E}[31`, `a${E}[31`],
    ['ESC then letter', `a${E}xb`, `a${E}xb`],
    ['code with wrong final byte', `a${E}[31xb`, `a${E}[31xb`],
    ['non-SGR sequences', `${E}[2J${E}[?25hhi`, `${E}[2J${E}[?25hhi`],
    ['bold red', `${E}[1;31mbold red${E}[0m`, '<span class="c-red c-bright">bold red</span>'],
    ['256 color (unsupported)', `${E}[38;5;196mx${E}[0m`, 'x'],
    ['bare ESC[m reset', `${E}[31mred${E}[mplain`, '<span class="c-red">red</span>plain'],
    ['italic underline inverse without color', `${E}[3mi${E}[23m ${E}[4mu${E}[24m ${E}[7mv${E}[27m`, 'i u v'],
    ['styles without color are dropped', `${E}[3mitalic only${E}[0m`, 'italic only'],
    [
      'dim then bright',
      `${E}[2m${E}[31mdim${E}[22m${E}[1mbright${E}[0m`,
      '<span class="c-red c-dim">dim</span><span class="c-red c-bright">bright</span>',
    ],
    [
      'backgrounds',
      `${E}[41mbg${E}[49m ${E}[101mbgl${E}[49m`,
      '<span class="bg-red">bg</span> <span class="bg-lightRed">bgl</span>',
    ],
    ['bright background', `${E}[1m${E}[44mbb${E}[0m`, '<span class="c-bright bg-blue">bb</span>'],
    ['stacked colors, last wins', `a${E}[31m${E}[32m${E}[33mb`, 'a<span class="c-yellow">b</span>'],
    ['only a code', `${E}[31m`, ''],
    ['code and reset', `${E}[31m${E}[0m`, ''],
    [
      'light colors',
      `${E}[90mdark${E}[97mwhite${E}[39m`,
      '<span class="c-darkGray">dark</span><span class="c-white">white</span>',
    ],
    ['unknown codes', `${E}[99m${E}[109m${E}[9mq`, 'q'],
    ['empty code parts', `${E}[;31mz${E}[31;;32mz`, '<span class="c-red">z</span><span class="c-green">z</span>'],
    ['huge code', `${E}[1234mz`, 'z'],
    ['newlines inside a color', `${E}[31ma\r\nb\n\nc${E}[0m`, '<span class="c-red">a\r\nb\n\nc</span>'],
    ['all at once', `${E}[0;1;4;31;42mall${E}[0m`, '<span class="c-red c-bright underline bg-green">all</span>'],
    [
      'prompt',
      `${E}[32m4060h, ${E}[0m${E}[32m4060m, ${E}[0m${E}[37mex-${E}[0m\r\n`,
      '<span class="c-green">4060h, </span><span class="c-green">4060m, </span><span class="c-lightGray">ex-</span>\r\n',
    ],
    ['escaped html stays', `${E}[31m&lt;b&gt;${E}[0m`, '<span class="c-red">&lt;b&gt;</span>'],
  ];

  for (const [name, text, html] of cases) {
    test(name, () => {
      expect(ansi2Html(text)).toBe(html);
      // the element is customizable
      expect(ansi2Html(text, 'i')).toBe(html.replaceAll('<span', '<i').replaceAll('</span>', '</i>'));
    });
  }

  test('ansiStrip removes every escape sequence, but keeps a broken one', () => {
    // the color codes
    expect(ansiStrip(`${E}[1;31mbold red${E}[0m`)).toBe('bold red');
    expect(ansiStrip(`${E}[0;1;4;31;42mall${E}[m`)).toBe('all');
    expect(ansiStrip(`${E}[32m4060h, ${E}[0m${E}[37mex-${E}[0m\r\n`)).toBe('4060h, ex-\r\n');
    // other (non color) sequences, unlike ansi2Html which keeps them
    expect(ansiStrip(`${E}[2J${E}[?25hhi`)).toBe('hi');
    // broken sequences are kept, exactly like ansi2Html
    expect(ansiStrip(`a${E}b`)).toBe(`a${E}b`);
    expect(ansiStrip(`a${E}[`)).toBe(`a${E}[`);
    expect(ansiStrip(`a${E}xb`)).toBe(`a${E}xb`);
    expect(ansiStrip('plain')).toBe('plain');
    expect(ansiStrip('')).toBe('');
  });

  test('an escape sequence across the 1MB chunk boundary', () => {
    const ONE_MB = 1048576;
    for (const pad of [ONE_MB - 1, ONE_MB - 2, ONE_MB - 3, ONE_MB - 4, ONE_MB]) {
      const text = 'x'.repeat(pad) + `${E}[31m` + 'y' + `${E}[0m` + 'z';
      expect(ansi2Html(text)).toBe('x'.repeat(pad) + '<span class="c-red">y</span>z');
      expect(ansiStrip(text)).toBe('x'.repeat(pad) + 'yz');
    }
    // plain text over the chunk size is returned as it is
    const plain = 'p'.repeat(ONE_MB + 10);
    expect(ansi2Html(plain)).toBe(plain);
  });

  test('the same code is one shared, immutable Code object', () => {
    const one = Array.from(ansiParse(`${E}[31mred${E}[0m`));
    const two = Array.from(ansiParse(`${E}[31mred${E}[0m`));
    expect(one[0].code).toBe(two[0].code);
    expect(one[0].code.value).toBe(0);
    expect(Object.isFrozen(one[0].code)).toBe(false); // plain object, but never written to
    // the parse state is per call: a color never leaks into the next parse
    expect(ansi2Html(`${E}[31mred`)).toBe('<span class="c-red">red</span>');
    expect(ansi2Html('plain')).toBe('plain');
    expect(ansi2Html(`${E}[0mplain`)).toBe('plain');
  });
});

describe('the captured login session', () => {
  // The sanitized capture (no character name), as the game sent it,
  // and the HTML it must become. WE NEVER connect to the real game for testing!
  const packets = loadTrace(path.join(import.meta.dir, 'fixtures', 'achaea-login.bin'));
  const expected: { text: string; html: string }[] = JSON.parse(
    fs.readFileSync(path.join(import.meta.dir, 'fixtures', 'achaea-login.json'), 'utf8'),
  );

  test('every game text converts to the expected HTML', () => {
    const texts: string[] = [];
    for (const p of packets) {
      if (p.dir !== '<<') continue;
      const [opts] = tel.parse(p.data, true);
      for (const o of opts) {
        if (o.type === 'String' && o.text.trim()) texts.push(o.text);
      }
    }
    expect(texts.length).toBe(expected.length);
    expect(texts.length).toBeGreaterThan(0);
    for (let k = 0; k < texts.length; k++) {
      expect(texts[k]).toBe(expected[k].text);
      expect(ansi2Html(escapeHtml(texts[k]))).toBe(expected[k].html);
    }
    // the capture has real colors in it
    expect(expected.map((e) => e.html).join('')).toContain('<span class="c-');
  });
});
