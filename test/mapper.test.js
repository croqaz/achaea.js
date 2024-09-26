import { expect, test } from 'bun:test';
import * as m from '../achaea/maps/maps.js';
import * as mi from '../achaea/maps/index.js';

test('map area', async () => {
  const area = await mi.getArea('9');
  expect(area.id).toBe('9');
  expect(area.rooms).toBeTruthy();
  expect(area.levels).toBeTruthy();

  let areas = mi.findAreas('lodi');
  expect(areas.length).toBe(1);
  expect(areas[0].id).toBe('9');

  areas = mi.findAreas('9');
  expect(areas.length).toBe(1);
  expect(areas[0].name).toBe('Lodi, the Valley of');
});

test('map room', () => {
  let rooms = mi.findRooms(' shop ');
  expect(rooms.length).toBeTruthy();

  rooms = mi.findRooms('4529');
  expect(rooms.length).toBeTruthy();
});

test('map sub-graph', () => {
  // 87 = Sea Lion Cove
  let gr1 = m.subGraph('87', { deny_rooms: ['20873'], deny_envs: [m.MAP_ENVS.beach, m.MAP_ENVS.ocean] });
  let gr2 = m.subGraph('87', { deny_envs: [m.MAP_ENVS.beach, m.MAP_ENVS.ocean] });
  expect(gr1.vertices.size + 1).toBe(gr2.vertices.size);
});

test('get area middle', () => {
  // Lodi
  let room = mi.calcAreaMiddle('9');
  expect(room.coord.x).toBe(0);
  expect(room.coord.y).toBe(0);
  expect(room.coord.z).toBe(0);

  // Minia
  room = mi.calcAreaMiddle('11');
  expect(room.coord.x).toBe(0);
  expect(room.coord.y).toBe(0);
  expect(room.coord.z).toBe(0);

  // Tasur'ke
  room = mi.calcAreaMiddle('2');
  expect(room.name).toBe('Centre of the marketplace');
  expect(room.coord.z).toBe(0);

  // New Thera
  room = mi.calcAreaMiddle('3');
  expect(room.coord.x).toBe(0);
  expect(room.coord.y).toBe(0);
  expect(room.coord.z).toBe(0);

  // Delos
  room = mi.calcAreaMiddle('14');
  expect(room.coord.x).toBe(0);
  expect(room.coord.y).toBe(0);
  expect(room.coord.z).toBe(0);
});
