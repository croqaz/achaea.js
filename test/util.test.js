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

test('throttle func', async () => {
  let calls = 0;
  const t1 = u.throttle((x) => {
    calls += 1;
    return x;
  }, 10);
  expect(t1('a')).toBe('a');
  expect(t1('b')).toBe('b');
  expect(t1('a')).toBeUndefined();
  expect(t1('a')).toBeUndefined();
  expect(t1('a')).toBeUndefined();
  expect(t1('b')).toBeUndefined();
  expect(calls).toBe(2);

  await Bun.sleep(10);
  expect(t1('a')).toBe('a');
  expect(t1('b')).toBe('b');
  expect(t1('a')).toBeUndefined();
  expect(t1('a')).toBeUndefined();
  expect(t1('a')).toBeUndefined();
  expect(t1('b')).toBeUndefined();
  expect(calls).toBe(4);

  t1({ a: 1, b: null, c: 'c', d: { x: { y: 'z' } } });
  t1({ a: 2, b: NaN, c: '-c', d: { x: { y: 'z' } } });
  expect(calls).toBe(6);
});

test('debounce func', async () => {
  let calls = 0;
  let result = null;
  const t1 = u.debounce((x) => {
    calls += 1;
    result = x;
  }, 10);
  expect(t1('a')).toBeUndefined();
  expect(t1('b')).toBeUndefined();
  expect(t1('a')).toBeUndefined();
  expect(t1('a')).toBeUndefined();
  expect(calls).toBe(0);
  expect(result).toBeNull();

  await Bun.sleep(10);
  expect(calls).toBe(2);
  expect(result).toBe('b');

  t1([1, 2, 3]);
  t1([4, 5, 6]);
  await Bun.sleep(10);
  expect(calls).toBe(4);
  expect(result).toEqual([4, 5, 6]);

  t1({ a: 1, b: null, c: 'c', d: { x: { y: 'z' } } });
  t1({ a: 2, b: NaN, c: '-c', d: { x: { y: 'z' } } });
  await Bun.sleep(10);
  expect(calls).toBe(6);
  expect(result).toEqual({ a: 2, b: NaN, c: '-c', d: { x: { y: 'z' } } });
});

test('day-night to hour', () => {
  // values are from the actual game
  expect(t.dayNightToHour(0)).toBe(12);
  expect(t.dayNightToHour(3)).toBe(13);
  expect(t.dayNightToHour(6)).toBe(14);
  expect(t.dayNightToHour(9)).toBe(15);
  expect(t.dayNightToHour(12)).toBe(16);
  expect(t.dayNightToHour(15)).toBe(17);
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
  expect(t.dayNightToHour(103)).toBe(46);
  expect(t.dayNightToHour(107)).toBe(47);
  expect(t.dayNightToHour(118)).toBe(50);
  expect(t.dayNightToHour(122)).toBe(51);
  expect(t.dayNightToHour(125)).toBe(52);
  expect(t.dayNightToHour(129)).toBe(53);
  expect(t.dayNightToHour(137)).toBe(55);
  expect(t.dayNightToHour(140)).toBe(56);
  expect(t.dayNightToHour(144)).toBe(57);
  expect(t.dayNightToHour(148)).toBe(58);
  expect(t.dayNightToHour(151)).toBe(59);

  expect(t.dayNightToHour(155)).toBe(0);
  expect(t.dayNightToHour(159)).toBe(1);
  expect(t.dayNightToHour(162)).toBe(2);
  expect(t.dayNightToHour(166)).toBe(3);
  expect(t.dayNightToHour(170)).toBe(4);
  expect(t.dayNightToHour(174)).toBe(5);
  expect(t.dayNightToHour(177)).toBe(6);
  expect(t.dayNightToHour(181)).toBe(7);
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
