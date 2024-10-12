import { expect, test } from 'bun:test';
import * as g from '../achaea/core/gmcp.js';
import * as s from '../achaea/core/state.js';
import { sleep } from '../achaea/core/util.js';

test('char status & vitals', () => {
  g.processGMCP(`Char.Status {
      "name": "X", "fullname": "X Abc", "age": "18", "race": "Mhun", "specialisation": "",
      "level": "16 (85%)", "xp": "85%", "xprank": "0", "class": "Xyz", "city": "Hashan (1)",
      "boundcredits": "98", "unboundcredits": "0", "lessons": "710", "explorerrank": "a Vagabond",
      "mayancrowns": "0", "boundmayancrowns": "0", "gold": "1234", "bank": "0",
      "unread_news": "45592", "unread_msgs": "0", "target": "None", "gender": "male"
    }`);
  expect(s.STATE.Me.name).toBe('X');
  expect(s.STATE.Me.race).toBe('Mhun');
  expect(s.STATE.Me.class).toBe('Xyz');

  expect(s.STATE.Me.hp).toBeFalsy();
  expect(s.STATE.Me.mp).toBeFalsy();
  expect(s.STATE.Me.ep).toBeFalsy();
  expect(s.STATE.Me.wp).toBeFalsy();

  g.processGMCP(`Char.Vitals {
    "hp": "1000", "maxhp": "1005", "mp": "1100", "maxmp": "1155", "ep": "3100", "maxep": "3175",
    "wp": "3300", "maxwp": "3400", "nl": "54", "bal": "1", "eq": "1",
    "charstats": [ "Bleed: 0", "Rage: 0" ]
  }`);

  expect(s.STATE.Me.hp).toBe(1000);
  expect(s.STATE.Me.mp).toBe(1100);
  expect(s.STATE.Me.ep).toBe('3100');
  expect(s.STATE.Me.wp).toBe('3300');
});

test('char defences state', () => {
  expect(s.STATE.Me.defences.length).toBeFalsy();

  g.processGMCP(`Char.Defences.Add {
    "name": "morph", "desc": "Morphing to animal spirits..."
  }`);
  expect(s.STATE.Me.defences[0].name).toBe('morph');

  // try to remove inexistent thing
  g.processGMCP('Char.Defences.Remove [ "wrong" ]');
  expect(s.STATE.Me.defences.length).toBe(1);

  g.processGMCP('Char.Defences.Remove [ "morph" ]');
  expect(s.STATE.Me.defences.length).toBeFalsy();
});

test('char afflictions state', () => {
  expect(s.STATE.Me.afflictions.length).toBeFalsy();

  g.processGMCP(`Char.Afflictions.Add {
    "name": "sleeping", "cure": "", "desc": "wake up..."
  }`);
  expect(s.STATE.Me.afflictions[0].name).toBe('sleeping');

  // try to remove inexistent thing
  g.processGMCP('Char.Afflictions.Remove [ "wrong" ]');
  expect(s.STATE.Me.afflictions.length).toBe(1);

  g.processGMCP('Char.Afflictions.Remove [ "sleeping" ]');
  expect(s.STATE.Me.afflictions.length).toBeFalsy();
});

test('room info state', () => {
  expect(s.STATE.Room.num).toBeFalsy();
  expect(s.STATE.Room.name).toBeFalsy();
  expect(s.STATE.Room.area).toBeFalsy();

  g.processGMCP(`Room.Info {
    "num": 4246, "name": "Hallway outside of living quarters (indoors)",
    "desc": "A single torch burning from a sconce on the wall lights...",
    "area": "the Dungeon of the Beastlords", "environment": "Constructed underground",
    "details": [ "indoors" ], "exits": { "n": 4241, "e": 4248, "s": 4247, "w": 4244 }
  }`);

  expect(s.STATE.Room.num).toBe(4246);
  expect(s.STATE.Room.name).toBe('Hallway outside of living quarters (indoors)');
  expect(s.STATE.Room.area).toBe('the Dungeon of the Beastlords');
});

test('char items state', () => {
  expect(s.STATE.Me.items.length).toBeFalsy();

  g.processGMCP('Char.Items.List { "location": "inv", "items": [] }');
  expect(s.STATE.Me.items.length).toBeFalsy();

  g.processGMCP(`Char.Items.Add {
    "location": "inv", "item": {
      "id": "123", "name": "the corpse of a pixie", "icon": "deadbody"
    } }`);

  expect(s.STATE.Me.items[0].icon).toBe('deadbody');
  expect(s.STATE.Me.items[0].name).toBe('the corpse of a pixie');

  // try to remove inexistent item
  g.processGMCP(`Char.Items.Remove {
    "location": "inv", "item": {
      "id": "345", "name": "some gold sovereigns", "icon": "coin"
    } }`);
  expect(s.STATE.Me.items.length).toBe(1);

  g.processGMCP(`Char.Items.Remove {
    "location": "inv", "item": {
      "id": "123", "name": "the corpse of a pixie", "icon": "deadbody"
    } }`);
  expect(s.STATE.Me.items.length).toBeFalsy();
});

test('char wielded state', () => {
  expect(s.STATE.Me.wieldedL.id).toBeFalsy();
  expect(s.STATE.Me.wieldedR.id).toBeFalsy();

  g.processGMCP(`Char.Items.List { "location": "inv", "items": [
    { "id": "12", "name": "a sword", "icon": "weapon" },
    { "id": "34", "name": "a cleaver", "icon": "lamp" }
  ] }`);
  expect(s.STATE.Me.items[0].id).toBe(12);
  expect(s.STATE.Me.items[1].id).toBe(34);

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword", "icon": "weapon"
  } }`);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "34", "name": "a cleaver", "icon": "lamp", "attrib": "L"
  } }`);
  expect(s.STATE.Me.items.length).toBe(2);

  expect(s.STATE.Me.wieldedL.id).toBeFalsy();
  expect(s.STATE.Me.wieldedR.id).toBe(34);

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword", "icon": "weapon", "attrib": "l"
  } }`);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "34", "name": "a cleaver", "icon": "lamp"
  } }`);
  expect(s.STATE.Me.items.length).toBe(2);

  expect(s.STATE.Me.wieldedL.id).toBe(12);
  expect(s.STATE.Me.wieldedR.id).toBeFalsy();

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword"
  } }`);
  expect(s.STATE.Me.wieldedL.id).toBeFalsy();
  expect(s.STATE.Me.wieldedR.id).toBeFalsy();

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword", "icon": "weapon", "attrib": "l"
  } }`);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "34", "name": "a cleaver", "icon": "lamp", "attrib": "L"
  } }`);
  expect(s.STATE.Me.wieldedL.id).toBe(12);
  expect(s.STATE.Me.wieldedR.id).toBe(34);

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword"
  } }`);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "34", "name": "a cleaver"
  } }`);
  expect(s.STATE.Me.wieldedL.id).toBeFalsy();
  expect(s.STATE.Me.wieldedR.id).toBeFalsy();

  // cleanup
  g.processGMCP('Char.Items.List { "location": "inv", "items": [] }');
  expect(s.STATE.Me.items.length).toBeFalsy();
});

test('room players state', async () => {
  expect(s.STATE.Room.players.length).toBeFalsy();

  g.processGMCP('Room.AddPlayer { "name": "Abc", "fullname": "The Abc" }');
  await sleep(0.1);
  g.processGMCP('Room.AddPlayer { "name": "Abc", "fullname": "The Abc" }');
  await sleep(0.1);
  expect(s.STATE.Room.players.length).toBe(1);
  expect(s.STATE.Room.players[0].name).toBe('Abc');

  // try to remove inexistent player
  g.processGMCP('Room.RemovePlayer "Zxc"');
  expect(s.STATE.Room.players.length).toBe(1);

  g.processGMCP('Room.RemovePlayer "Abc"');
  expect(s.STATE.Room.players.length).toBeFalsy();
});

test('test room items state', () => {
  expect(s.STATE.Room.items.length).toBeFalsy();

  g.processGMCP(`Char.Items.Add {
      "location": "room", "item": {
        "id": "1234", "name": "a gnome woman", "icon": "humanoid", "attrib": "m"
    } }`);
  expect(s.STATE.Room.items.length).toBe(1);
  expect(s.STATE.Room.items[0].icon).toBe('humanoid');
  expect(s.STATE.Room.items[0].name).toBe('a gnome woman');

  // try to remove inexistent item
  g.processGMCP(`Char.Items.Remove {
    "location": "room", "item": {
      "id": "3456", "name": "a pixie", "icon": "magical", "attrib": "m"
  } }`);
  expect(s.STATE.Room.items.length).toBe(1);

  g.processGMCP(`Char.Items.Remove {
      "location": "room", "item": {
        "id": "1234", "name": "a gnome woman", "icon": "humanoid", "attrib": "m"
    } }`);
  expect(s.STATE.Room.items.length).toBeFalsy();

  g.processGMCP(`Char.Items.Add {
    "location": "room", "item": {
      "id": "9876", "name": "the corpse of xxx", "icon": "deadbody", "attrib": "mdt"
    } }`);
  expect(s.STATE.Room.items.length).toBe(1);

  g.processGMCP(`Char.Items.Remove {
    "location": "room", "item": {
      "id": "9876", "name": "the corpse of xxx", "icon": "deadbody", "attrib": "mdt"
    } }`);
  expect(s.STATE.Room.items.length).toBeFalsy();
});

test('test room corpse state', () => {
  expect(s.STATE.Me.items.length).toBeFalsy();
  g.processGMCP(`Char.Items.List {
    "location": "room", "items": [ { "id": "254273", "name": "a spiny toad", "icon": "animal", "attrib": "m"
  } ] }`);
  expect(s.STATE.Room.items.length).toBe(1);
  g.processGMCP(`Char.Items.Add {
    "location": "inv", "item": { "id": "254273", "name": "the corpse of a spiny toad", "icon": "deadbody"
  } }`);
  expect(s.STATE.Me.items.length).toBe(1);
  g.processGMCP(`Char.Items.Remove {
    "location": "room", "item": { "id": "254273", "name": "the corpse of a spiny toad", "icon": "deadbody", "attrib": "mdt"
  } }`);
  expect(s.STATE.Room.items.length).toBeFalsy();
  g.processGMCP(`Char.Items.Remove {
    "location": "inv", "item": { "id": "254273", "name": "a spiny toad", "icon": "animal"
  } }`);
  expect(s.STATE.Me.items.length).toBeFalsy();
});

test('test room rats state', () => {
  expect(s.STATE.Room.items.length).toBeFalsy();

  g.processGMCP(`Char.Items.Add { "location": "room", "item": {
      "id": "345", "name": "a baby rat", "attrib": "m"
    } }`);
  g.processGMCP(`Char.Items.Add { "location": "room", "item": {
      "id": "678", "name": "a rat", "attrib": "m"
    } }`);
  expect(s.STATE.Room.items.length).toBe(2);

  g.processGMCP(`Char.Items.Remove { "location": "room", "item": {
    "id": "345", "name": "the corpse of a baby rat", "icon": "deadbody", "attrib": "mdt"
  } }`);
  expect(s.STATE.Room.items.length).toBe(1);

  // Items list should reset all items
  g.processGMCP('Char.Items.List { "location": "room", "items": [] }');
  expect(s.STATE.Room.items.length).toBeFalsy();
});
