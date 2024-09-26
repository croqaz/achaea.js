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

test('day-night to hour', () => {
  expect(u.dayNightToHour(0)).toBe(12);
  expect(u.dayNightToHour(3)).toBe(13);
  expect(u.dayNightToHour(24)).toBe(20);
  expect(u.dayNightToHour(30)).toBe(22);
  expect(u.dayNightToHour(39)).toBe(25);
  expect(u.dayNightToHour(54)).toBe(30);
  expect(u.dayNightToHour(66)).toBe(34);
  expect(u.dayNightToHour(72)).toBe(36);
  expect(u.dayNightToHour(78)).toBe(38);
  expect(u.dayNightToHour(81)).toBe(39);
  expect(u.dayNightToHour(87)).toBe(41);
  expect(u.dayNightToHour(90)).toBe(42);
  expect(u.dayNightToHour(93)).toBe(43);
  expect(u.dayNightToHour(96)).toBe(44);
  expect(u.dayNightToHour(100)).toBe(45);
  expect(u.dayNightToHour(118)).toBe(50);
  expect(u.dayNightToHour(122)).toBe(51);
  expect(u.dayNightToHour(125)).toBe(52);
  expect(u.dayNightToHour(129)).toBe(53);
  expect(u.dayNightToHour(137)).toBe(55);
  expect(u.dayNightToHour(140)).toBe(56);
  expect(u.dayNightToHour(148)).toBe(58);
  expect(u.dayNightToHour(151)).toBe(59);

  expect(u.dayNightToHour(155)).toBe(0);
  expect(u.dayNightToHour(162)).toBe(2);
  expect(u.dayNightToHour(170)).toBe(4);
  expect(u.dayNightToHour(174)).toBe(5);
  expect(u.dayNightToHour(177)).toBe(6);
  expect(u.dayNightToHour(185)).toBe(8);
  expect(u.dayNightToHour(188)).toBe(9);
  expect(u.dayNightToHour(192)).toBe(10);
  expect(u.dayNightToHour(196)).toBe(11);
});

test('Achaea hour to real-life hour:min', () => {
  expect(u.achaeaHourToRLhour(0)).toBe('00:00');
  expect(u.achaeaHourToRLhour(3.75)).toBe('01:30');
  expect(u.achaeaHourToRLhour(7.5)).toBe('03:00');
  expect(u.achaeaHourToRLhour(15)).toBe('06:00');
  expect(u.achaeaHourToRLhour(16.25)).toBe('06:30');
  expect(u.achaeaHourToRLhour(22.5)).toBe('09:00');
  expect(u.achaeaHourToRLhour(30)).toBe('12:00');
  expect(u.achaeaHourToRLhour(45)).toBe('18:00');
  expect(u.achaeaHourToRLhour(60)).toBe('24:00');
});
