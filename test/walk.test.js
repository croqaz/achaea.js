import { expect, test } from 'bun:test';

import fs from 'node:fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import ee from '../achaea/events/index.ts';
import * as m from '../achaea/maps/maps.js';
import * as mi from '../achaea/maps/index.js';
import { STATE } from '../achaea/core/state.js';
import { sleep } from '../achaea/core/util.js';
import { autoWalker, walkDirections, innerWalker, walkRooms } from '../achaea/maps/walker.js';

const dirName = dirname(fileURLToPath(import.meta.url));
const LODI = JSON.parse(fs.readFileSync(dirName + '/lodi-map.json'));
const G = m.localGraph(LODI, { costs: { 6220: 2 } });

test('area sanity', async () => {
  const area = await mi.getArea('9', false);
  expect(area.id).toBe(LODI.id);
  expect(area.name.length).toBe(LODI.name.length);
  expect(area.rooms.length).toBe(LODI.rooms.length);
});

test('auto walk', async () => {
  STATE.Room.num = '15068';
  const w = await autoWalker(STATE.Room.num, '18769', {
    interval: 5,
    walkDelay: 0.001,
    autoStart: false,
  });

  const path = [];
  const hnd = function (dir) {
    path.push(dir);
    STATE.Room.num = w.walk.curr().uid;
  };
  ee.on('user:text', hnd);

  expect(w.moving()).toBe(false);
  w.start();
  expect(w.moving()).toBe(true);

  await sleep(0.1);
  expect(path).toEqual(['s', 'e', 'sw', 'w', 'w', 'n', 'w']);

  ee.off('user:text', hnd);
  STATE.Room.num = 0;
});

test('walk from-to', async () => {
  const w = await innerWalker('6213', '6223');
  expect(w.path.map((x) => x.uid)).toEqual(['6213', '6234', '6224', '6233', '6223']);

  expect(w.curr().uid).toBe('6213');
  expect(w.next()).toEqual({ uid: '6234', dir: 'out' });
  expect(w.curr().uid).toBe('6234');
  expect(w.prev()).toEqual({ uid: '6213', dir: 'in' });
  expect(w.curr().uid).toBe('6213');

  expect(w.next()).toEqual({ uid: '6234', dir: 'out' });
  expect(w.next()).toEqual({ uid: '6224', dir: 'e' });
  expect(w.next()).toEqual({ uid: '6233', dir: 'e' });
  expect(w.next()).toEqual({ uid: '6223', dir: 'in' });
  // shouldn't crash
  expect(w.next()).toBeFalsy();
  expect(w.curr().uid).toBe('6223');

  expect(w.prev()).toEqual({ uid: '6233', dir: 'out' });
  expect(w.prev()).toEqual({ uid: '6224', dir: 'w' });
  expect(w.prev()).toEqual({ uid: '6234', dir: 'w' });
  expect(w.prev()).toEqual({ uid: '6213', dir: 'in' });
  // shouldn't crash
  expect(w.prev()).toBeFalsy();
});

test('auto directions', () => {
  const p1 = walkDirections(m.GRAPH, '18356', '18057');
  expect(p1).toEqual([
    { uid: '18356', next: 'nw', prev: null },
    { uid: '18279', next: 'ne', prev: 'nw' },
    { uid: '9877', next: 'e', prev: 'ne' },
    { uid: '18349', next: 'se', prev: 'e' },
    { uid: '18361', next: 'sw', prev: 'se' },
    { uid: '18057', next: null, prev: 'sw' },
  ]);
});

test('walk rooms smoke test', () => {
  const graph = {
    vertices: new Map([
      ['A', new Set(['B', 'C'])],
      ['B', new Set(['A', 'D'])],
      ['C', new Set(['A', 'E'])],
      ['D', new Set(['B'])],
      ['E', new Set(['C'])],
    ]),
  };
  const p1 = walkRooms(graph, 'B', 'E');
  const p2 = walkRooms(graph, 'E', 'B');

  expect(p1).toEqual(['B', 'A', 'C', 'E']);
  expect(p1).toEqual(p2.reverse());
});

test('auto-walk Bedroom-Sentry Post', () => {
  const p1 = walkRooms(G, '6210', '6196');
  const p2 = walkRooms(G, '6196', '6210');

  expect(p1).toEqual(['6210', '6209', '6219', '6226', '6234', '6228', '6194', '6195', '6196']);
  expect(p1).toEqual(p2.reverse());
});

test('auto-walk Hills-Royal Chambers', () => {
  const p1 = walkRooms(G, '3985', '18057');
  const p2 = walkRooms(G, '18057', '3985');

  expect(p1).toEqual([
    '3985',
    '3986',
    '4092',
    '4093',
    '4094',
    '4095',
    '4096',
    '4097',
    '4098',
    '4099',
    '9877',
    '18349',
    '18361',
    '18057',
  ]);
  expect(p1).toEqual(p2.reverse());
});

test('auto-walk Fishing-Fergil', () => {
  const p1 = walkRooms(G, '6216', '17367');
  const p2 = walkRooms(G, '17367', '6216');

  expect(p1).toEqual([
    '6216',
    '7664',
    '7663',
    '7662',
    '7661',
    '6182',
    '6218',
    '6231',
    '6222',
    '6183',
    '6219',
    '6226',
    '6234',
    '6224',
    '6181',
    '3884',
    '3901',
    '3966',
    '3971',
    '3972',
    '3973',
    '3975',
    '3976',
    '18337',
    '18587',
    '18583',
    '9932',
    '3660',
    '15118',
    '16665',
    '16736',
    '17367',
  ]);
  expect(p1).toEqual(p2.reverse());
});

test('mapper test Ashtan market to gates', () => {
  const recordedWalk = [
    {
      id: 451,
      name: 'Southeast of Central Market',
    },
    {
      id: 450,
      name: "Southern corner of the Merchant's Quarter",
    },
    {
      id: 446,
      name: "Entry to the Merchant's Quarter",
    },
    {
      id: 436,
      name: 'Entering the main gate of Ashtan',
    },
  ];

  const source = recordedWalk.at(0).id.toString();
  const target = recordedWalk.at(-1).id.toString();
  const walk = walkRooms(m.GRAPH, source, target);
  // console.log(walk.join(' > '));

  let index = 0;
  for (const uid of walk) {
    expect(parseInt(uid)).toBe(recordedWalk[index].id);
    index++;
  }
});
