import { expect, test } from 'bun:test';
import { Colors as ansi, ansiParse, ansi2Html } from '../achaea/ansi.ts';

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
  expect(ansi.bgLightRed(ansi.bgLightCyan('foo') + 'bar')).toBe(
    '\u001b[101m\u001b[106mfoo\u001b[101mbar\u001b[49m',
  );
  expect(ansi.underline(ansi.underline('foo') + 'bar')).toBe(
    '\u001b[4m\u001b[4mfoo\u001b[4mbar\u001b[24m',
  );

  expect(ansi.bright(ansi.bright('foo') + 'bar')).toBe(
    '\u001b[22m\u001b[1m\u001b[22m\u001b[1mfoo\u001b[22m\u001b[1mbar\u001b[22m',
  );
  expect(ansi.dim(ansi.dim('foo') + 'bar')).toBe(
    '\u001b[22m\u001b[2m\u001b[22m\u001b[2mfoo\u001b[22m\u001b[2mbar\u001b[22m',
  );
  expect(ansi.inverse(ansi.inverse('foo') + 'bar')).toBe('\u001b[7m\u001b[7mfoo\u001b[7mbar\u001b[27m');
});

test('ansi parse', () => {
  const raw =
    ansi.underline(ansi.italic(ansi.bright(ansi.bgLightRed('foo')))) + ansi.dim(ansi.red('bar'));
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
