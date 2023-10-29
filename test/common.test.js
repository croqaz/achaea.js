import { expect, test } from 'bun:test';
import * as c from '../achaea/core/common.ts';

test('herbs sanity', () => {
  expect(c.HERBS).toBeTruthy();
  for (const x of Object.values(c.HERBS)) {
    expect(x.short).toBeTruthy();
    expect(x.long).toBeTruthy();
  }
});

test('minerals sanity', () => {
  expect(c.MINERALS).toBeTruthy();
  for (const x of Object.values(c.MINERALS)) {
    expect(x.short).toBeTruthy();
    expect(x.long).toBeTruthy();
  }
});

test('venoms sanity', () => {
  expect(c.VENOMS).toBeTruthy();
  for (const x of Object.values(c.VENOMS)) {
    expect(typeof x.aff).toBe('string');
    expect(x.short).toBeTruthy();
    expect(x.long).toBeTruthy();
  }
});

test('runes sanity', () => {
  expect(c.RUNES).toBeTruthy();
  for (const x of Object.values(c.RUNES)) {
    expect(x.effect).toBeTruthy();
    expect(x.req).toBeTruthy();
    expect(x.symbol).toBeTruthy();
    expect(x.desc).toBeTruthy();
  }
});

test('herbs-eq-minerals sanity', () => {
  expect(c.MINERAL_EQ_HERB).toBeTruthy();
  expect(c.HERB_EQ_MINERAL).toBeTruthy();

  expect(Object.keys(c.MINERALS)).toEqual(Object.keys(c.MINERAL_EQ_HERB));

  expect(c.HERB_EQ_MINERAL.ginseng).toBe('ferrum');
  expect(c.MINERAL_EQ_HERB.ferrum).toBe('ginseng');
});
