// deno-lint-ignore-file no-explicit-any
'use strict';
import { bright, italic } from 'ansicolor';

import * as T from '../types.ts';
import ee from '../events/index.ts';
import ansiToHtml from './ansi.ts';
import { MAP } from '../maps/index.ts';

/*
 * The STATE tree represents everything we know about the game and is
 * like "Sarapis the Logos", a source of Truth.
 * It is updated in a very strict order:
 * - the first source of truth is GMCP
 * - the second source of truth, less trustworthy is from game text via triggers
 * - the third source of truth, is from user input or logic, to store flags & such
 * Most of the STATE tree is frozen (read-only)!
 */
export var STATE: T.StateType = Object.seal({
  Me: Object.seal({
    //
    name: 'Name',
    race: 'Race',
    gender: 'Gender',
    level: 0,
    xp: 'Experience To Next Level',
    class: 'Class',
    city: 'City',
    house: 'House',
    gold: 0,

    hp: 0,
    oldhp: 0,
    maxhp: 0,
    mp: 0,
    oldmp: 0,
    maxmp: 0,
    ep: 0,
    maxep: 0,
    wp: 0,
    maxwp: 0,

    bal: true,
    eq: true,
    eb: true,
    round: 0, // rounds of balance / equilibrium

    rift: [],
    items: [],
    charstats: [],
    afflictions: [],
    defences: [],
    skills: { list: [] },
    wieldedL: {} as T.GmcpItem,
    wieldedR: {} as T.GmcpItem,
  }),
  //
  Room: Object.seal({
    num: 0,
    area: '', // this is the GMCP name, eg: Ashtan, Isle of Delos...
    plane: '',
    environment: '',
    name: '',
    desc: '',
    owner: '', // wares proprietor
    coord: {},
    room: {}, // meta from map
    details: [],
    exits: {},
    items: [],
    players: [],
  }),
  //
  Battle: Object.seal({
    rage: 0,
    active: false,
    tgtID: null,
    tgtHP: null,
    target: null, // attack target name
    // battle targets, NPCs & Players
    // each target has: id, name, defs, affs
    tgts: {},
  }),
  //
  Time: Object.seal({
    day: '0',
    mon: '0',
    month: '..',
    year: '100',
    hour: '0',
    daynight: '1',
    moonphase: '..',
    time: 'It is deep night in Achaea, before midnight.',
  }),
  //
  // Queue
  //
  Custom: {
    // user's current input
    input: '',
    autoWalk: [], // auto-walk state
    walkHist: [], // walk history
    rats: false, // watching for rats?
    greed: false, // auto-keep greedy
    writhe: false,
    waresDB: false,
    whoisDB: false,
    getPlants: false, // gather/ harvest?
    getMinerals: false,
    //
  },
  // TOOD: Queue ...
});

// Hack to keep a frozen clone clone of the initial custom state
const defaultMUD: Record<string, any> = Object.freeze(JSON.parse(JSON.stringify(STATE.Custom)));
// Reset to default state
export function resetDefaultState() {
  // Seal & clone the default object, to re-use it later
  STATE.Custom = Object.seal(JSON.parse(JSON.stringify(defaultMUD)));
}

function addToStateList(key, list, value) {
  if (!STATE[key]) {
    console.error('Wrong STATE key!', key);
    return;
  }
  if (!STATE[key][list]) {
    console.error('Wrong STATE list key!', key);
    return;
  }
  STATE[key][list].push(value);
}

function remFromStateList(key, list, value) {
  if (!STATE[key]) {
    console.error('Wrong STATE key!', key);
    return;
  }
  if (!STATE[key][list]) {
    console.error('Wrong STATE list key!', key);
    return;
  }
  let index = 0;
  for (const x of STATE[key][list]) {
    if ((x.id && x.id === value.id) || (x.name && x.name === value)) {
      STATE[key][list].splice(index, 1);
      return;
    }
    index += 1;
  }
}

function updateMyself(meta) {
  for (const k of Object.keys(meta)) {
    // Ignore inexistent fields
    if (STATE.Me[k] === undefined) {
      continue;
    }
    STATE.Me[k] = meta[k];
  }
}

function syncWieldedWpn(item: T.GmcpItem) {
  // Sync a wielded weapon
  // Overwrite whatever weapons are already wielded
  if (item.attrib) {
    if (item.attrib.includes('l')) {
      // l' = wielded_left
      STATE.Me.wieldedL = item;
    } else if (item.attrib.includes('L')) {
      // 'L' = wielded_right
      STATE.Me.wieldedR = item;
    }
  }
  // Unwield left weapon?
  else if (STATE.Me.wieldedL && !item.attrib && item.id === STATE.Me.wieldedL.id) {
    STATE.Me.wieldedL = {} as T.GmcpItem;
  }
  // Unwield right weapon?
  else if (STATE.Me.wieldedR && !item.attrib && item.id === STATE.Me.wieldedR.id) {
    STATE.Me.wieldedR = {} as T.GmcpItem;
  }
}

export function listDenizens(): string[] {
  // list NPCs in the room
  const isDenizen = (x) => x.attrib && x.attrib === 'm';
  return STATE.Room.items.filter(isDenizen).map((x) => x.id.toString());
}

//
// GMCP processing functions
//

export function gmcpProcessChar(_type: string, data: T.GmcpChar) {
  if (data.bal) {
    if (data.bal === '1') {
      data.bal = true;
    } else {
      data.bal = false;
    }
    // if (data.bal && data.bal !== STATE.Me.bal) ee.emit('have:bal'); ??
  }
  if (data.eq) {
    if (data.eq === '1') {
      data.eq = true;
    } else {
      data.eq = false;
    }
    // if (data.eq && data.eq !== STATE.Me.eq) ee.emit('have:eq'); ??
  }
  if (data.bal && data.eq && (data.bal !== STATE.Me.bal || data.eq !== STATE.Me.eq)) {
    STATE.Me.round++;
    STATE.Me.eb = true;
    ee.emit('have:eb');
  } else if (data.bal === false || data.eq === false) {
    STATE.Me.eb = false;
  }

  if (data.gold) {
    data.gold = parseInt(data.gold as string);
  }
  if (data.level) {
    data.level = parseInt((data.level as string).split(' ')[0]);
  }
  if (data.hp) {
    data.oldhp = STATE.Me.hp;
    data.hp = parseInt(data.hp as string);
  }
  if (data.mp) {
    data.oldmp = STATE.Me.mp;
    data.mp = parseInt(data.mp as string);
  }
  if (data.charstats) {
    for (const cs of data.charstats) {
      if (cs.startsWith('Rage:')) {
        const [, r] = cs.split(': ');
        if (r) STATE.Battle.rage = parseInt(r);
        break;
      }
    }
  }

  updateMyself(data);
  ee.emit('myself:update', STATE.Me);
}

export function gmcpProcessTarget(type: string, data) {
  if (type === 'IRE.Target.Set') {
    // Ignore targets outside of battle
    if (STATE.Battle.active) STATE.Battle.tgtID = parseInt(data as string);
  } else if (type === 'IRE.Target.Info') {
    const tsData = data as Record<string, string>;
    STATE.Battle.tgtID = parseInt(tsData.id as string);
    STATE.Battle.tgtHP = tsData.hpperc;
  }
}

export function gmcpProcessDefences(type: string, data) {
  if (type === 'Char.Defences.List') {
    updateMyself({ defences: data });
  } else if (type === 'Char.Defences.Add') {
    const tsData = data as T.GmcpDefence;
    ee.emit('sys:text', ansiToHtml(italic.magenta(`Defences ++ ${tsData.name}`)));
    addToStateList('Me', 'defences', tsData);
  } else if (type === 'Char.Defences.Remove') {
    ee.emit('sys:text', ansiToHtml(italic.red(`Defences -- ${data}`)));
    for (const item of data as string[]) {
      remFromStateList('Me', 'defences', item);
    }
  }
  ee.emit('myself:update', STATE.Me);
}

export function gmcpProcessAfflictions(type: string, data) {
  if (type === 'Char.Afflictions.List') {
    updateMyself({ afflictions: data });
  } else if (type === 'Char.Afflictions.Add') {
    const tsData = data as T.GmcpAffliction;
    ee.emit(
      'sys:text',
      ansiToHtml(
        italic.red(`Afflictions ++ ${tsData.name} `) +
          (tsData.cure ? italic.magenta(`; CURE: ${tsData.cure}`) : ''),
      ),
    );
    addToStateList('Me', 'afflictions', tsData);
  } else if (type === 'Char.Afflictions.Remove') {
    const tsData = data as string[];
    ee.emit('sys:text', ansiToHtml(italic.magenta(`Afflictions -- ${data}`)));
    for (const item of tsData) {
      remFromStateList('Me', 'afflictions', item);
    }
  }
  ee.emit('myself:update', STATE.Me);
}

export function gmcpProcessItems(type: string, data: T.GmcpItemUpd) {
  // Player & room items
  // Room item attribs:
  // 'w' = worn
  // 'W' = wearable
  // 'l' = wielded_left
  // 'L' = wielded_right
  // 'g' = groupable
  // 'c' = container
  // 't' = takeable
  // 'r' = rifted
  // 'm' = monster/ denizen
  // 'd' = dead monster
  // 'x' = should not be targeted (guards, ...)
  //
  if (type === 'Char.Items.List') {
    // @ts-ignore: Types
    const tsData = data as T.GmcpItemList;
    if (tsData.location === 'inv') {
      for (const item of tsData.items) {
        // item ID must be int
        item.id = parseInt(item.id as string);
        syncWieldedWpn(item);
      }
      updateMyself({ items: tsData.items });
    } else if (tsData.location === 'room') {
      STATE.Room.items = [];
      STATE.Battle.tgts = {};
      for (const item of tsData.items) {
        // item ID must be int
        item.id = parseInt(item.id as string);
        STATE.Room.items.push(item);
        // Only if Denizen or Guard;
        // should be the same object in memory
        if (item.attrib && (item.attrib.includes('m') || item.attrib.includes('x')))
          STATE.Battle.tgts[item.id] = item;
      }
    } else {
      ee.emit('log:write', `[GMCP] DON'T KNOW WHAT TODO WITH Char.Items.List: ${tsData.location}`);
    }
  }
  //
  else if (type === 'Char.Items.Update') {
    // item ID must be int
    const itemID = parseInt(data.item.id as string);
    data.item.id = itemID;
    let itm = null as T.GmcpItem;
    if (data.location === 'inv') {
      syncWieldedWpn(data.item);
      itm = STATE.Me.items.find((x) => x.id === itemID);
    } else if (data.location === 'room') {
      itm = STATE.Room.items.find((x) => x.id === itemID);
    }
    // Only these props are updatable
    if (itm) {
      itm.icon = data.item.icon;
      itm.attrib = data.item.attrib;
    }
  }
  //
  else if (type === 'Char.Items.Add') {
    if (data.location === 'inv') {
      addToStateList('Me', 'items', data.item);
    } else if (data.location === 'room') {
      // item ID must be int
      data.item.id = parseInt(data.item.id as string);
      STATE.Room.items.push(data.item);
      // Only if Denizen or Guard
      if (data.item.attrib && (data.item.attrib.includes('m') || data.item.attrib.includes('x')))
        STATE.Battle.tgts[data.item.id] = data.item;
    }
  }
  //
  else if (type === 'Char.Items.Remove') {
    if (data.location === 'inv') {
      remFromStateList('Me', 'items', data.item);
    } else if (data.location === 'room') {
      const itemID = parseInt(data.item.id as string);
      STATE.Room.items = STATE.Room.items.filter((x) => x.id !== itemID);
      delete STATE.Battle.tgts[itemID];
      //
      // Black magic! Stop battle if the item removed from the room,
      // is the battle target
      // This can happen because the NPC has left the room
      if (itemID === STATE.Battle.tgtID) {
        STATE.Battle.active = false;
        // Reset the target only if the NPC is dead
        if (data.item.attrib && data.item.attrib.includes('d')) {
          STATE.Battle.tgtID = null;
          STATE.Battle.tgtHP = null;
        }
      }
    }
  }

  if (data.location === 'inv') {
    ee.emit('inv:update', STATE.Me);
  } else if (data.location === 'room') {
    ee.emit('items:update', STATE.Room.items);
  }
}

export function gmcpProcessRift(type: string, data) {
  if (type === 'IRE.Rift.List') {
    updateMyself({ rift: data });
  } else if (type === 'IRE.Rift.Add') {
    addToStateList('Me', 'rift', data);
  } else if (type === 'IRE.Rift.Remove') {
    remFromStateList('Me', 'rift', data.item);
  }
  ee.emit('rift:update', STATE.Me);
}

export function gmcpProcessSkills(type: string, data) {
  if (type === 'Char.Skills.Groups') {
    const tsData = data as T.GmcpSkill[];
    for (const skill of tsData) {
      STATE.Me.skills[skill.name] = { rank: skill.rank, list: [] };
    }
  } else if (type === 'Char.Skills.List') {
    const tsData = data as T.GmcpSkillList;
    STATE.Me.skills[tsData.group].list = tsData.list;
  }
}

export function gmcpProcessRoomInfo(_type: string, data: T.GmcpRoom) {
  // TODO :: navigation history
  // STATE.Custom.walk.push({ id: data.num, name: data.name });
  //
  const mapRoom = MAP.rooms[data.num];
  // Enhance GMCP room info with data from the map JSON
  if (mapRoom && mapRoom.title) {
    // This contains the real area ID & real map coords
    data.room = { area: mapRoom.area, environment: mapRoom.environment, coord: mapRoom.coord };
  }
  for (const k of Object.keys(data)) {
    // Ignore inexistent fields so the Room object doesn't explode
    if (STATE.Room[k] === undefined) {
      continue;
    }
    STATE.Room[k] = data[k];
  }
  ee.emit('room:update', STATE.Room);
}

export function gmcpProcessRoomPlayers(type: string, data) {
  if (type === 'Room.Players') {
    STATE.Room.players = data as T.GmcpPlayer[];
    // remove current player from the list
    STATE.Room.players = STATE.Room.players.filter((x) => x.name !== STATE.Me.name);
  } else if (type === 'Room.AddPlayer') {
    const tsData = data as T.GmcpPlayer;
    ee.emit('sys:text', ansiToHtml(bright.italic(`Players ++ ${tsData.name}`)));
    STATE.Room.players.push(data as T.GmcpPlayer);
  } else if (type === 'Room.RemovePlayer') {
    ee.emit('sys:text', ansiToHtml(bright.italic(`Players -- ${data}`)));
    STATE.Room.players = STATE.Room.players.filter((x) => x.name !== (data as string));
  }
  ee.emit('players:update', STATE.Room.players);
}

export function gmcpProcessTime(type: string, data: T.GmcpTime) {
  if (type === 'IRE.Time.List') {
    STATE.Time = data;
  } else if (type === 'IRE.Time.Update') {
    for (const k of Object.keys(data)) {
      // Ignore inexistent fields so the Time object doesn't explode
      if (STATE.Time[k] === undefined) {
        continue;
      }
      STATE.Time[k] = data[k];
    }
  }
}