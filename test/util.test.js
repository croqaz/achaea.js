import { expect, test } from 'bun:test';
import * as u from '../achaea/core/util.ts';

test('split words', () => {
  expect(u.words(' a  b\tc ')).toEqual(['a', 'b', 'c']);
  expect(u.words(' Asd\n\nqwe, \t zxc. ')).toEqual(['Asd', 'qwe,', 'zxc.']);
});

test('normalize text', () => {
  expect(u.normText(' a  b\tc ')).toEqual('a b c');
  expect(u.normText(' Asd\n\nqwe, \t zxc. ')).toEqual('Asd qwe, zxc.');
});

test('title-case', () => {
  expect(u.toTitleCase('aSd Zxc')).toBe('Asd zxc');
  expect(u.toTitleCase('QWE ZXC')).toBe('Qwe zxc');
});
