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
    expect(x.short).toBeTruthy();
  }
});

test('herbs-eq-minerals sanity', () => {
  expect(c.MINERAL_EQ_HERB).toBeTruthy();
  expect(c.HERB_EQ_MINERAL).toBeTruthy();

  expect(Object.keys(c.MINERALS)).toEqual(Object.keys(c.MINERAL_EQ_HERB));

  expect(c.HERB_EQ_MINERAL.ginseng).toBe('ferrum');
  expect(c.MINERAL_EQ_HERB.ferrum).toBe('ginseng');
});

test('search herb & mineral', () => {
  expect(c.findHerb('ash').length).toBe(1);
  expect(c.findHerb('qwerty').length).toBe(0);

  expect(c.findMineral('Quartz').length).toBe(1);
  expect(c.findMineral('qazwsxedc').length).toBe(0);

  expect(c.findHerb('irid')[0].short).toBe('some irid moss');
  expect(c.findHerb('MOSS')[0].short).toBe('some irid moss');

  expect(c.findMineral('blindness')[0].short).toBe('an arsenic pellet');
});

test('search venom & rune', () => {
  expect(c.findVenom('curare').length).toBe(1);
  expect(c.findVenom('qwerty').length).toBe(0);

  expect(c.findRune('FEHU').length).toBe(1);
  expect(c.findRune('XYZ0').length).toBe(0);

  expect(c.findVenom('stupidity')[0].name).toBe('aconite');
  expect(c.findRune('horse')[0].name).toBe('raido');
  expect(c.findRune('entangle')[0].name).toBe('nairat');
});

test('find weapon type', () => {
  expect(c.weaponType(`a butcher's cleaver`)).toBe('cleaver');
  expect(c.weaponType(`a mighty butcher's cleaver`)).toBe('cleaver');
  expect(c.weaponType('a Dawnrender bastard sword')).toBe('bastard sword');
  expect(c.weaponType(`a Stonesmith's Maul`)).toBe('warhammer');
});
