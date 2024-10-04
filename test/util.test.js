import { expect, test } from 'bun:test';
import * as t from '../achaea/core/time.ts';
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

test('day-night to hour', () => {
  expect(t.dayNightToHour(0)).toBe(12);
  expect(t.dayNightToHour(3)).toBe(13);
  expect(t.dayNightToHour(24)).toBe(20);
  expect(t.dayNightToHour(30)).toBe(22);
  expect(t.dayNightToHour(39)).toBe(25);
  expect(t.dayNightToHour(54)).toBe(30);
  expect(t.dayNightToHour(66)).toBe(34);
  expect(t.dayNightToHour(72)).toBe(36);
  expect(t.dayNightToHour(78)).toBe(38);
  expect(t.dayNightToHour(81)).toBe(39);
  expect(t.dayNightToHour(87)).toBe(41);
  expect(t.dayNightToHour(90)).toBe(42);
  expect(t.dayNightToHour(93)).toBe(43);
  expect(t.dayNightToHour(96)).toBe(44);
  expect(t.dayNightToHour(100)).toBe(45);
  expect(t.dayNightToHour(118)).toBe(50);
  expect(t.dayNightToHour(122)).toBe(51);
  expect(t.dayNightToHour(125)).toBe(52);
  expect(t.dayNightToHour(129)).toBe(53);
  expect(t.dayNightToHour(137)).toBe(55);
  expect(t.dayNightToHour(140)).toBe(56);
  expect(t.dayNightToHour(148)).toBe(58);
  expect(t.dayNightToHour(151)).toBe(59);

  expect(t.dayNightToHour(155)).toBe(0);
  expect(t.dayNightToHour(162)).toBe(2);
  expect(t.dayNightToHour(170)).toBe(4);
  expect(t.dayNightToHour(174)).toBe(5);
  expect(t.dayNightToHour(177)).toBe(6);
  expect(t.dayNightToHour(185)).toBe(8);
  expect(t.dayNightToHour(188)).toBe(9);
  expect(t.dayNightToHour(192)).toBe(10);
  expect(t.dayNightToHour(196)).toBe(11);
});

test('Achaea hour to real-life hour:min', () => {
  expect(t.achaeaHourToRLhour(0)).toBe('00:00');
  expect(t.achaeaHourToRLhour(3.75)).toBe('01:30');
  expect(t.achaeaHourToRLhour(7.5)).toBe('03:00');
  expect(t.achaeaHourToRLhour(15)).toBe('06:00');
  expect(t.achaeaHourToRLhour(16.25)).toBe('06:30');
  expect(t.achaeaHourToRLhour(22.5)).toBe('09:00');
  expect(t.achaeaHourToRLhour(30)).toBe('12:00');
  expect(t.achaeaHourToRLhour(45)).toBe('18:00');
  expect(t.achaeaHourToRLhour(60)).toBe('24:00');
});
