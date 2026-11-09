import { beforeAll, expect, setSystemTime, test } from 'bun:test';
import { CACHE_MS } from '../achaea/core/classes.ts';
import * as g from '../achaea/core/gmcp.ts';
import * as s from '../achaea/core/state.ts';

// All the test files share one process: the replays of the login capture leave their state behind.
// The class too: left as the Runewarden of the capture, the "Xyz" below is a class change, and the Runewarden
// cleanup of custom/runeward.ts fires 8 seconds later (PUT FULLPLATE IN PACK), in whatever test file runs then
beforeAll(() => {
  s.STATE.Me.class = '';
  s.STATE.Me.defences = [];
  s.STATE.Me.afflictions = [];
  s.STATE.Me.skills = {};
  s.STATE.Room.num = 0;
  s.STATE.Room.name = '';
  s.STATE.Room.area = '';
});

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
    "charstats": [ "Bleed: 1", "Rage: 0" ]
  }`);

  expect(s.STATE.Me.hp).toBe(1000);
  expect(s.STATE.Me.mp).toBe(1100);
  expect(s.STATE.Me.ep).toBe('3100');
  expect(s.STATE.Me.wp).toBe('3300');

  expect(s.STATE.Me.bleed).toBe(1);
  expect(s.STATE.Me.devotion).toBeNull();
  expect(s.STATE.Me.essence).toBeNull();
  expect(s.STATE.Me.morph).toBeNull();
  expect(s.STATE.Me.sunlight).toBe(0);
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

  g.processGMCP(`Char.Afflictions.Add {
    "name": "prone", "cure": "STAND", "desc": "Being knocked..."
  }`);
  expect(s.STATE.Me.afflictions[1].name).toBe('prone');
  expect(s.STATE.Me.prone).toBeTrue();

  // try to remove inexistent thing
  g.processGMCP('Char.Afflictions.Remove [ "wrong" ]');
  expect(s.STATE.Me.afflictions.length).toBe(2);

  g.processGMCP('Char.Afflictions.Remove [ "sleeping" ]');
  g.processGMCP('Char.Afflictions.Remove [ "prone" ]');
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
  expect(s.STATE.Me.wielded.left?.id).toBeFalsy();
  expect(s.STATE.Me.wielded.right?.id).toBeFalsy();

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

  expect(s.STATE.Me.wielded.left?.id).toBeFalsy();
  expect(s.STATE.Me.wielded.right?.id).toBe(34);

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword", "icon": "weapon", "attrib": "l"
  } }`);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "34", "name": "a cleaver", "icon": "lamp"
  } }`);
  expect(s.STATE.Me.items.length).toBe(2);

  expect(s.STATE.Me.wielded.left?.id).toBe(12);
  expect(s.STATE.Me.wielded.right?.id).toBeFalsy();

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword"
  } }`);
  expect(s.STATE.Me.wielded.left).toBeFalsy();
  expect(s.STATE.Me.wielded.right).toBeFalsy();

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword", "icon": "weapon", "attrib": "l"
  } }`);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "34", "name": "a cleaver", "icon": "lamp", "attrib": "L"
  } }`);
  expect(s.STATE.Me.wielded.left.id).toBe(12);
  expect(s.STATE.Me.wielded.right.id).toBe(34);

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "12", "name": "a sword"
  } }`);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": { "id": "34", "name": "a cleaver"
  } }`);
  expect(s.STATE.Me.wielded.left).toBeFalsy();
  expect(s.STATE.Me.wielded.right).toBeFalsy();

  // cleanup
  g.processGMCP('Char.Items.List { "location": "inv", "items": [] }');
  expect(s.STATE.Me.items.length).toBeFalsy();
});

test('char worn items state', () => {
  expect(s.STATE.Me.worn.feet).toBeFalsy();
  expect(s.STATE.Me.worn.armor).toBeFalsy();

  g.processGMCP(`Char.Items.Add {
    "location": "inv", "item": {
    "id": "12", "name": "war boots", "icon": "clothing", "attrib": "W" } }`);
  expect(s.STATE.Me.items.length).toBe(1);

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": {
    "id": "12", "name": "war boots", "icon": "clothing", "attrib": "W" }  }`);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": {
    "id": "12", "name": "war boots", "icon": "clothing", "attrib": "w", "wearslot": "feet" } }`);
  expect(s.STATE.Me.worn.feet.id).toBe(12);
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": {
    "id": "12", "name": "war boots", "icon": "clothing", "attrib": "W" }  }`);
  expect(s.STATE.Me.worn.feet).toBeFalsy();

  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": {
    "id": "35", "name": "a savage suit of chain mail", "icon": "armor", "attrib": "W" } }`);
  expect(s.STATE.Me.worn.armor).toBeFalsy();
  g.processGMCP(`Char.Items.Update {
    "location": "inv", "item": {
    "id": "35", "name": "a savage suit of chain mail", "icon": "armor", "attrib": "w" } }`);
  expect(s.STATE.Me.worn.armor.id).toBe(35);
  g.processGMCP(`Char.Items.Update {
      "location": "inv", "item": {
      "id": "35", "name": "a savage suit of chain mail", "icon": "armor", "attrib": "W" } }`);
  expect(s.STATE.Me.worn.armor).toBeFalsy();

  // cleanup
  g.processGMCP('Char.Items.List { "location": "inv", "items": [] }');
  expect(s.STATE.Me.items.length).toBeFalsy();
});

test('room players state', async () => {
  // The STATE is shared by every test file: another one may have left players in the room
  s.STATE.Room.players = [];

  g.processGMCP('Room.AddPlayer { "name": "Abc", "fullname": "The Abc" }');
  await Bun.sleep(1);
  g.processGMCP('Room.AddPlayer { "name": "Abc", "fullname": "The Abc" }');
  await Bun.sleep(1);
  expect(s.STATE.Room.players.length).toBe(1);
  expect(s.STATE.Room.players[0].name).toBe('Abc');

  // try to remove inexistent player
  g.processGMCP('Room.RemovePlayer "Zxc"');
  expect(s.STATE.Room.players.length).toBe(1);

  g.processGMCP('Room.RemovePlayer "Abc"');
  expect(s.STATE.Room.players.length).toBeFalsy();
});

test('players state items state', () => {
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

test('room corpse state', () => {
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

test('room rats state', () => {
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

test('char skills state', () => {
  g.processGMCP('Char.Skills.Groups [ { "name": "Vision", "rank": "Capable" }, { "name": "Survival", "rank": "Fabled" } ]');
  expect(s.STATE.Me.skills.Survival).toEqual({ rank: 'Fabled', list: [] });
  // The abilities of a group (never asked for by the client); the game answers with the group in lowercase
  g.processGMCP('Char.Skills.List { "group": "survival", "list": [ "Fishing", "Leap", "Swimming" ] }');
  expect(s.STATE.Me.skills.Survival.list).toEqual(['Fishing', 'Leap', 'Swimming']);
  expect(s.STATE.Me.skills.survival).toBeUndefined();
  // The groups come again after AB <skill>: the abilities are kept
  g.processGMCP('Char.Skills.Groups [ { "name": "Survival", "rank": "Mythical" } ]');
  expect(s.STATE.Me.skills.Survival).toEqual({
    rank: 'Mythical',
    list: ['Fishing', 'Leap', 'Swimming'],
  });
  // An unknown group, and no group
  g.processGMCP('Char.Skills.List { "group": "Weaponry", "list": [ "Parry" ] }');
  expect(s.STATE.Me.skills.Weaponry).toEqual({ rank: '', list: ['Parry'] });
  g.processGMCP('Char.Skills.List { "list": [ "Nothing" ] }');
  s.STATE.Me.skills = {};
});

test('the class specialization is read from the charstats once a minute', () => {
  try {
    setSystemTime(new Date('2026-11-01T12:00:00Z'));
    s.STATE.Me.charstats = ['Bleed: 0', 'Spec: Two Arts'];
    expect(s.STATE.Me.specialization).toBe('two arts');
    // Cached: a change in the charstats is not seen for a minute
    s.STATE.Me.charstats = ['Bleed: 0', 'Spec: Shikudo'];
    expect(s.STATE.Me.specialization).toBe('two arts');
    setSystemTime(new Date(Date.now() + CACHE_MS - 1));
    expect(s.STATE.Me.specialization).toBe('two arts');
    setSystemTime(new Date(Date.now() + 1));
    expect(s.STATE.Me.specialization).toBe('shikudo');
    // The private cache stays out of the JSON of the state (the charstats are the only place the word is)
    s.STATE.Me.charstats = [];
    expect(s.STATE.Me.specialization).toBe('shikudo');
    expect(JSON.stringify(s.STATE.Me)).not.toContain('shikudo');
    // No specialization is cached too
    setSystemTime(new Date(Date.now() + CACHE_MS));
    expect(s.STATE.Me.specialization).toBe('');
    s.STATE.Me.charstats = ['Spec: Shikudo'];
    expect(s.STATE.Me.specialization).toBe('');
  } finally {
    setSystemTime();
    s.STATE.Me.charstats = [];
  }
});

// From the logs: "plant quarterstaff" dissolves the wielded staff, a butterfly net is used up;
// the game removes them from the inventory without an unwield update first
test('a wielded or worn item gone from the inventory is not wielded, nor worn', () => {
  g.processGMCP(`Char.Items.List { "location": "inv", "items": [
    { "id": "219877", "name": "a wyvern-etched druidic quarterstaff", "icon": "weapon", "attrib": "l" },
    { "id": "580796", "name": "a butterfly net", "icon": "tool", "attrib": "L" },
    { "id": "170595", "name": "azure leather mountain boots", "icon": "clothing", "attrib": "w", "wearslot": "feet" },
    { "id": "123", "name": "the corpse of a pixie", "icon": "deadbody" }
  ] }`);
  expect(s.STATE.Me.wielded.left.id).toBe(219877);
  expect(s.STATE.Me.wielded.right.id).toBe(580796);
  expect(s.STATE.Me.worn.feet.id).toBe(170595);
  expect(s.STATE.Me.items.length).toBe(4);

  g.processGMCP(`Char.Items.Remove {
    "location": "inv", "item": { "id": "219877", "name": "a wyvern-etched druidic quarterstaff", "icon": "weapon" }
  }`);
  expect(s.STATE.Me.wielded.left).toBeFalsy();
  expect(s.STATE.Me.wielded.right.id).toBe(580796);
  // The ids come as strings, they are numbers in the state: the item is gone from the list
  expect(s.STATE.Me.items.map((x) => x.id)).toEqual([580796, 170595, 123]);

  g.processGMCP('Char.Items.Remove { "location": "inv", "item": { "id": "580796", "name": "a butterfly net" } }');
  g.processGMCP(
    'Char.Items.Remove { "location": "inv", "item": { "id": "170595", "name": "azure leather mountain boots" } }',
  );
  expect(s.STATE.Me.wielded).toEqual({});
  expect(s.STATE.Me.worn.feet).toBeFalsy();
  expect(s.STATE.Me.items.map((x) => x.id)).toEqual([123]);

  // An item added then removed, the id as a number in the state
  g.processGMCP(
    'Char.Items.Add { "location": "inv", "item": { "id": "345", "name": "some gold sovereigns", "icon": "coin" } }',
  );
  expect(s.STATE.Me.items.map((x) => x.id)).toEqual([123, 345]);
  g.processGMCP(
    'Char.Items.Remove { "location": "inv", "item": { "id": "345", "name": "some gold sovereigns", "icon": "coin" } }',
  );
  expect(s.STATE.Me.items.map((x) => x.id)).toEqual([123]);

  // The inventory list rebuilds the hands & the worn slots: what is not in it is not wielded
  g.processGMCP(`Char.Items.List { "location": "inv", "items": [
    { "id": "12", "name": "a sword", "icon": "weapon", "attrib": "L" },
    { "id": "170595", "name": "azure leather mountain boots", "icon": "clothing", "attrib": "w", "wearslot": "feet" }
  ] }`);
  expect(s.STATE.Me.wielded.right.id).toBe(12);
  expect(s.STATE.Me.worn.feet.id).toBe(170595);
  g.processGMCP(`Char.Items.List { "location": "inv", "items": [
    { "id": "12", "name": "a sword", "icon": "weapon" }
  ] }`);
  expect(s.STATE.Me.wielded).toEqual({});
  expect(s.STATE.Me.worn).toEqual({});

  // cleanup
  g.processGMCP('Char.Items.List { "location": "inv", "items": [] }');
  expect(s.STATE.Me.items.length).toBeFalsy();
});
