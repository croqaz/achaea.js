import { expect, test } from 'bun:test';
import * as m from '../achaea/maps/maps.js';
import { exploreMap, exploreDirections } from '../achaea/maps/explore.js';

test('explore map-1', () => {
  console.time('explore-1');
  const graph = new Map([
    ['A', new Set(['B', 'C'])],
    ['B', new Set(['A', 'D'])],
    ['C', new Set(['A', 'E'])],
    ['D', new Set(['B'])],
    ['E', new Set(['C'])],
  ]);
  const points = exploreMap(graph, 'A');
  expect(points).toEqual(['A', 'B', 'D', 'B', 'A', 'C', 'E', 'C', 'A']);
  console.timeEnd('explore-1');
});

test('explore map-2', () => {
  console.time('explore-2');
  const graph = new Map([
    [0, new Set([1, 4])],
    [1, new Set([0, 2])],
    [2, new Set([1, 3])],
    [3, new Set([2, 4])],
    [4, new Set([0, 5, 6])],
    [5, new Set([6])],
    [6, new Set([4, 5])],
  ]);
  const points = exploreMap(graph, 0);
  expect(points).toEqual([0, 1, 2, 3, 4, 5, 6, 4, 0]);
  console.timeEnd('explore-2');
});

test('explore map-3', () => {
  console.time('explore-3');
  const graph = new Map([
    [0, new Set([1, 4])],
    [1, new Set([0, 2])],
    [2, new Set([1, 3])],
    [3, new Set([4, 7])],
    [4, new Set([6, 5, 0])],
    [5, new Set([6])],
    [6, new Set([4, 5])],
    [7, new Set([3, 8])],
    [8, new Set([7])],
  ]);
  const points = exploreMap(graph, 0);
  expect(points).toEqual([0, 1, 2, 3, 4, 6, 5, 6, 4, 0, 1, 2, 3, 7, 8, 7, 3, 4, 0]);
  console.timeEnd('explore-3');
});

test('explore map-4', () => {
  console.time('explore-4');
  const graph = new Map([
    [1, new Set([2, 6, 10])],
    [2, new Set([1, 3])],
    [3, new Set([2, 4, 30])],
    [4, new Set([3, 5])],
    [5, new Set([4, 6, 50])],
    [6, new Set([1, 5])],
    [10, new Set([1])],
    [30, new Set([3])],
    [50, new Set([5])],
  ]);
  let points = exploreMap(graph, 1);
  expect(points).toEqual([1, 2, 3, 4, 5, 6, 5, 50, 5, 4, 3, 30, 3, 2, 1, 10, 1]);
  points = exploreMap(graph, 3);
  expect(points).toEqual([3, 2, 1, 6, 5, 4, 5, 50, 5, 6, 1, 10, 1, 2, 3, 30, 3]);
  points = exploreMap(graph, 5);
  expect(points).toEqual([5, 4, 3, 2, 1, 6, 1, 10, 1, 2, 3, 30, 3, 4, 5, 50, 5]);
  points = exploreMap(graph, 6);
  expect(points).toEqual([6, 1, 2, 3, 4, 5, 50, 5, 4, 3, 30, 3, 2, 1, 10, 1, 6]);
  console.timeEnd('explore-4');
});

test('explore map-5', () => {
  console.time('explore-5');
  const graph = new Map([
    [1, new Set([2, 14])],
    [2, new Set([1, 3])],
    [3, new Set([2, 31, 32, 4])],
    [4, new Set([3, 5])],
    [5, new Set([4, 6])],
    [6, new Set([5, 7])],
    [7, new Set([6, 8, 71])],
    [8, new Set([7, 9])],
    [9, new Set([8, 10])],
    [10, new Set([9, 11, 101, 102])],
    [11, new Set([10, 12])],
    [12, new Set([11, 13])],
    [13, new Set([12, 14])],
    [14, new Set([13, 1, 141])],
    [31, new Set([3])],
    [32, new Set([3])],
    [71, new Set([7, 72])],
    [72, new Set([71])],
    [101, new Set([10])],
    [102, new Set([10])],
    [141, new Set([14, 142])],
    [142, new Set([141, 143])],
    [143, new Set([142, 144])],
    [144, new Set([143])],
  ]);
  let points = exploreMap(graph, 1);
  expect(points.length).toBeLessThan(graph.size * 2);
  expect(points).toEqual([
    1, 2, 3, 31, 3, 32, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 141, 142, 143, 144, 143, 142, 141, 14,
    13, 12, 11, 10, 101, 10, 102, 10, 9, 8, 7, 71, 72, 71, 7, 6, 5, 4, 3, 2, 1,
  ]);
  points = exploreMap(graph, 7);
  expect(points.length).toBeLessThan(graph.size * 2);
  expect(points).toEqual([
    7, 6, 5, 4, 3, 2, 1, 14, 13, 12, 11, 10, 9, 8, 9, 10, 101, 10, 102, 10, 11, 12, 13, 14, 141, 142,
    143, 144, 143, 142, 141, 14, 1, 2, 3, 31, 3, 32, 3, 4, 5, 6, 7, 71, 72, 71, 7,
  ]);
  points = exploreMap(graph, 10);
  expect(points.length).toBeLessThan(graph.size * 2);
  expect(points).toEqual([
    10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 14, 13, 12, 11, 12, 13, 14, 141, 142, 143, 144, 143, 142, 141, 14, 1,
    2, 3, 31, 3, 32, 3, 4, 5, 6, 7, 71, 72, 71, 7, 8, 9, 10, 101, 10, 102, 10,
  ]);
  console.timeEnd('explore-5');
});

test('explore area Isaia', () => {
  console.time('explore-Isaia');
  // 99 = Isaia
  const graph = m.subGraph('99', {
    deny_rooms: ['21257'],
    deny_envs: [m.MAP_ENVS.ocean, m.MAP_ENVS.deepocean],
  });
  const grSize = graph.vertices.size;
  const points = exploreDirections(graph, '22351');
  // console.log('POINTS:', points);
  expect(points.length).toBeGreaterThan(grSize);
  expect(points.length).toBeLessThan(grSize * 2);
  console.timeEnd('explore-Isaia');
});
