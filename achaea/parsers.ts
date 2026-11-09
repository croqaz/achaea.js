// deno-lint-ignore-file no-explicit-any
import * as T from './types.ts';
import { Config } from './config.ts';
import { STATE } from './core/state.ts';
import { CITIES, HERBS, MATERIALS, MINERALS } from './core/common.ts';
import { stripHtml } from './core/util.ts';

export function parseSurvey(text: string): Record<string, any> | null {
  if (!text.includes('You discern that you are in ')) return null;
  if (!text.includes('You are in the ')) return null;
  const parts = text.split('\n').filter((x) => !!x);
  let area = parts[0]
    .trim()
    .split(' ')
    .slice(6)
    .join(' ')
    .replace(/[ .]*$/, '');
  if (area.startsWith('the ')) {
    area = area.slice(4);
  }
  const environment = parts[1]
    .trim()
    .split(' ')
    .slice(6)
    .join(' ')
    .replace(/[ .]*$/, '');
  const plane = parts[2]
    .trim()
    .split(' ')
    .slice(4)
    .join(' ')
    .replace(/[ .]*$/, '');
  const influence = parts
    .at(-1)
    .trim()
    .split(' ')
    .slice(9)
    .join(' ')
    .replace(/[ .]*$/, '');
  return { area, environment, plane, influence };
}

export function validRoomInfo(text: string): Record<string, any> | null {
  /*
   * Validate room title, description and features.
   */
  if (text.includes('>You see exits leading<') && text.includes(' and ')) {
    return null;
  } else if (text.includes('>You see a single exit leading<')) {
    return null;
  }
  const parts = text.trim().split('\n');
  if (parts.length < 2 || parts.length > 3) return null;
  let title = parts.at(-2).replace(/\r$/, '');
  if (!title.includes('.</span><span')) return null;
  let description = parts.at(-1).trim();
  if (!(description.endsWith('.') || description.includes('.</span><span'))) {
    return null;
  }
  description = stripHtml(description);

  const features = [];
  if (description.includes('The area is ablaze!')) {
    features.push('fire');
  }
  if (
    description.includes('A small wooden sign is here.') ||
    description.includes('A sign here suggests you READ SIGN!') ||
    description.includes('A small wooden sign is nailed crookedly to a post here.')
  ) {
    features.push('sign');
  }
  if (description.includes('Lying flat on the ground is a key-shaped sigil.')) {
    features.push('key-sigil');
  }
  if (
    description.includes('A runic totem is planted in the ground.') ||
    description.includes('A runic totem is planted solidly in the ground.')
  ) {
    features.push('totem');
  }
  if (description.includes('A sigil in the shape of a small, rectangular monolith is on the ground.')) {
    features.push('monolith');
  }
  if (description.includes('A furry little humgii sits here, a hungry expression in his wide eyes.')) {
    features.push('humgii');
  }
  if (description.includes('The entry to a mine looms here, its great arched doorway worked in grey stone.')) {
    features.push('mine');
  }
  if (description.includes('Vines have overtaken this location.')) {
    features.push('vines');
  }
  if (
    description.includes('A large beehive hangs down from the trees above.') ||
    description.includes('A mighty earth golem stands guard here.')
  ) {
    features.push('grove');
  }

  // Obstacles and delays
  if (description.includes('A pile of boulders is here, partially blocking the cave entrance.')) {
    features.push('boulders');
  }
  if (description.includes('Everything about you is obscured by a heavy fog.')) {
    features.push('fog');
  }
  // Walls
  if (description.includes('A scorching wall of fire stands here, blocking passage to ')) {
    features.push('fireWall');
  }
  if (
    description.includes('An icewall is here, blocking passage to the ') ||
    description.includes('A large wall of ice is blocking passage to the ')
  ) {
    features.push('iceWall');
  }
  if (description.includes('A large wall of stone stands here, blocking passage to ')) {
    features.push('stoneWall');
  }
  if (description.includes('A large wall of thorns stands here, barring passage to ')) {
    features.push('thornWall');
  }

  // City influences
  if (description.includes('Crackling ozone heralds warp-touched mirage, their coming the advent of change.')) {
    features.push('Ashtan');
  } else if (description.includes('Bound in ice, draconic tracks scribe a glittering path across the earth.')) {
    features.push('Cyrene');
  } else if (
    description.includes(`Nature's fecundity floods the surrounds with the clamour of life in a chittering refrain.`)
  ) {
    features.push('Eleusis');
  } else if (description.includes('Lines of leaden shadow coil underfoot, turning earth to metal by alchemical writ.')) {
    features.push('Hashan');
  } else if (
    description.includes('Radiant light joins with calescent heat, suffusing the area with a harsh, blinding mien.')
  ) {
    features.push('Targossas');
  } else if (description.includes('A noxious, red-hued fog overwhelms the area with a thick, palpable vapour.')) {
    features.push('Mhaldor');
  }

  if (features.length) {
    title = stripHtml(title);
    title = title.replace('. (', ' (').replace(/\.$/, '');
    return { title, description, features };
  }
  return null;
}

//
// The full room text: title, the whole description paragraph (with the items,
// NPCs and players in it) and the exits. Some of this does not exist in GMCP.
//

export interface RoomExit {
  dir: string;
  // eg: open, closed
  door?: string;
}

export interface RoomText {
  title: string;
  desc: string;
  exits?: RoomExit[];
}

const EXITS_LINE = /You see (?:a single exit|exits) leading ([a-z ,()]+)\./;
const EXIT_ITEM = /^([a-z]+)(?: \(([a-z]+) door\))?$/;
const ROOM_TITLE = /^([^.]{3,100})\.( \([a-z ]+\))?$/;

/*
 * Parse the exits line, plain text:
 *   You see exits leading north (open door), east, and south (closed door).
 *   You see a single exit leading east (open door).
 * Returns null when the text has no exits line.
 */
export function parseRoomExits(text: string): RoomExit[] | null {
  const m = text.replace(/\s+/g, ' ').match(EXITS_LINE);
  if (!m) return null;
  const exits: RoomExit[] = [];
  for (const item of m[1].split(/,? and |, /)) {
    const x = item.trim().match(EXIT_ITEM);
    if (!x) return null;
    exits.push(x[2] ? { dir: x[1], door: x[2] } : { dir: x[1] });
  }
  return exits;
}

/*
 * Parse the room text, HTML straight from the game:
 *   <span class="c-yellow">A roadside cafe.</span><span class="c-lightGray"> (indoors)
 *   </span><span class="c-blue">Cerulean waters preside, ... </span><span class="c-cyan">A runic totem is planted solidly in the ground.</span>
 *   <span class="c-yellow">You see a single exit leading</span><span class="c-yellow"> north.</span>
 * The title is coloured on its own, the description is the next line.
 * The exits are included when they are in the same block,
 * but they usually come in the next block, because the GMCP room info arrives in between.
 * Returns null when this is not a room.
 */
export function parseRoomText(html: string): RoomText | null {
  if (!html.includes('.</span><span')) return null;
  const lines = html.split('\n');
  if (lines.length > 20) return null;
  for (let i = 0; i + 1 < lines.length; i++) {
    if (!lines[i].includes('.</span><span')) continue;
    const m = stripHtml(lines[i]).trim().match(ROOM_TITLE);
    if (!m || m[1].startsWith('You ')) continue;
    const desc = stripHtml(lines[i + 1]).trim();
    if (desc.length < 20 || !/[.!?]$/.test(desc)) continue;
    const title = m[2] ? m[1] + m[2] : m[1];
    const exits = parseRoomExits(
      lines
        .slice(i + 2)
        .map(stripHtml)
        .join(' '),
    );
    return exits ? { title, desc, exits } : { title, desc };
  }
  return null;
}

//
// Players
//

export interface PlayerText {
  // The whole description: the paragraph, then the sections (wearing, containers, specialist gear...)
  desc: string;
}

const DASHES = /^-{20,}$/;
const PLAYER_LINE = /^[A-Z][a-z]* (?:is|are) an? [a-z]/;

/*
 * Parse the text of LOOK <player>, plain text:
 *   ----------------------------------------
 *   He is a mhun. Youthful features are given definition by high cheekbones, ...
 *   You can glean more about his hair, eyes, complexion, height, and build.
 *
 *   He is wearing:
 *      an abyssal suit of hellscorched cloth armour, a hunter's belt, ...
 *   Containers:
 *      a wyvernskin pack.
 *   ----------------------------------------
 *   Specialist gear:
 *   A battered helmet crowns his head, ...
 *   ----------------------------------------
 * The block is between two dashed lines, the first line is "<pronoun> is <race>",
 * the pronoun can be anything (He, She, Fae...). The sections are optional.
 * The text keeps every line of the block, except the dashed lines; the player's name is not in it.
 * Returns null when this is not a player.
 */
export function parsePlayerText(text: string): PlayerText | null {
  if (!text.includes('----------')) return null;
  const lines = text.split('\n').map((l) => l.trimEnd());
  // Trim the empty lines at both ends, the block must start and end with the dashes
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  if (lines.length < 3 || !DASHES.test(lines[0].trim()) || !DASHES.test(lines.at(-1).trim())) return null;
  if (!PLAYER_LINE.test(lines[1])) return null;
  const desc = lines
    .slice(1, -1)
    .filter((l) => !DASHES.test(l.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { desc };
}

//
// Denizens
//

// How a denizen compares to you, from LOOK: [phrase, power, levels]
export const POWER_LEVELS: [string, number, string][] = [
  ['almost glows with nearly god-like power', 16, '??-☠️☠️☠️'],
  ['does not even register your presence as a threat', 15, '??-☠️☠️'],
  ['exudes an aura of overwhelming power', 14, '150++☠️'],
  ['has an air of extreme strength', 13, '125++'],
  ['looks to be crushingly strong', 12, '100-124'],
  ['appears to be extraordinarily strong', 11, '75-99'],
  ['is quite powerful', 10, '60-74'],
  ['is not one to be trifled with', 9, '50-59'],
  ['seems strong and confident', 8, '40-49'],
  ['exudes a quiet confidence', 7, '30-39'],
  ['seems to be unafraid', 6, '25-29'],
  ['appears to lack strength', 5, '20-24'],
  ['does not look particularly dangerous', 4, '15-19'],
  ['is a humble-looking creature', 3, '10-14'],
  ['looks relatively helpless', 2, '5-9'],
  ['looks weak and feeble', 1, '1-4'],
];

export interface DenizenText {
  // The name, as in GMCP (eg: Merrygold, the village elder; a crow)
  name: string;
  // The power level: 1-16
  power: number;
  // The description, the name line, the weight & loyalty lines
  desc: string;
}

const HEALTH_LINE = /^\S+ (?:has|have) \d+% health remaining\.$/;
// The client decorates the name line, before the full stop: "seems to be unafraid 🦾=6 LVL=25-29."
const DECORATION = / 🦾=\d+ LVL=[^ .]+(?=\.$)/;
const NAME_LINE = new RegExp(`^(.{2,120}?) (${POWER_LEVELS.map((p) => p[0]).join('|')})(?: 🦾=\\d+ LVL=[^ .]+)?\\.$`);
const NOTHING_IN_IT = /^You see nothing in (?:it|him|her|them)\.$/;

/*
 * Parse the text of LOOK <denizen>, plain text:
 *   Merrygold stands here humming an unfamiliar tune under her breath. Her face is careworn, ...
 *   Merrygold, the village elder exudes a quiet confidence.
 *   She has 100% health remaining.
 *   She weighs about 75 pounds.
 *   She is loyal to Actar.
 *   You see nothing in it.
 * The name line is the GMCP name followed by the power phrase, just before the health line;
 * an item has neither. The health line and the "nothing in it" line are left out of the text.
 * Returns null when this is not a denizen.
 */
export function parseDenizenText(text: string): DenizenText | null {
  if (!text.includes('% health remaining.')) return null;
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const h = lines.findIndex((l) => HEALTH_LINE.test(l));
  if (h < 2) return null;
  const m = lines[h - 1].match(NAME_LINE);
  if (!m) return null;
  const power = POWER_LEVELS.find((p) => p[0] === m[2])[1];
  const desc = lines
    .filter((l, i) => i !== h && !NOTHING_IN_IT.test(l))
    .map((l) => l.replace(DECORATION, ''))
    .join('\n');
  return { name: m[1], power, desc };
}

// A row of the wilderness map: the terrain symbols, the player, points of interest
const WILD_ROW = /^[ #&%!?*';,.\/;@IMSXYjmnw\\|+\-~=^]+$/;
// A row with some terrain in it, not only dots, dashes or spaces (a separator line of ordinary text)
const WILD_TERRAIN = /[@*w^#&%!?IMSXYjmn~]/;
// A line of the map text that is not a row: the title ("Grasslands."), or any sentence
const isTitle = (line: string) => line.endsWith('.') || line.includes('.</span><span');
// The map rows after a line: as many as there are, 0 when the line after it is not a row
function wildRows(parts: string[], from: number): string[] {
  const rows: string[] = [];
  for (let i = from; i < parts.length; i++) {
    const txt = stripHtml(parts[i]).replace(/\r$/, '');
    if (!txt || txt.length >= 60 || !WILD_ROW.test(txt)) break;
    rows.push(parts[i]);
  }
  return rows;
}

/*
 * Validate wilderness maps: the ASCII window the game sends with every move in the wilderness (and for MAP).
 * The block is the title line ("Grasslands.") then the rows, then the rest of the text (the exits, the room
 * description on LOOK). The window is 5x3 in a forest, up to 21x13 outside and 37 wide when flying; the rows
 * can be fewer and ragged: the game does not draw the deep ocean, so a row ends at its last visible cell and
 * the sea rows at the bottom are missing. The title can come after some lines of text in the same packet
 * ("You enter the wilderness.", "You enter the subdivision.", taking off, landing). The MAP command, or a
 * packet split by the network, gives the rows without a title: then the player (@) must be in them.
 * Returns [the map rows, the rest of the text], or null when the text is not a map.
 */
export function validWildMap(text: string): string[] | null {
  const parts = text.trim().split('\n');
  if (parts.length < 3) return null;
  // Without a title: the rows from the first line, with the player
  const untitled = wildRows(parts, 0);
  if (untitled.length >= 3 && untitled.some((row) => stripHtml(row).includes('@'))) {
    return [untitled.join('\n'), parts.slice(untitled.length).join('\n')];
  }
  // A title, then at least 3 rows with some terrain in them
  for (let i = 0; i < parts.length - 3; i++) {
    if (!isTitle(parts[i].replace(/\r$/, ''))) continue;
    const map = wildRows(parts, i + 1);
    if (map.length < 3) continue;
    // Some terrain in the rows, and a row as wide as the smallest window (5 x 3) or the player in it
    const plain = map.map(stripHtml);
    if (!plain.some((row) => WILD_TERRAIN.test(row))) continue;
    if (!plain.some((row) => row.length >= 5 || row.includes('@'))) continue;
    const desc = [...parts.slice(0, i + 1), ...parts.slice(i + 1 + map.length)];
    return [map.join('\n'), desc.join('\n')];
  }
  return null;
}

export function isWaresHeader(text: string): boolean {
  if (
    text.includes('Proprietor:') &&
    text.includes('(Item)------(Description)------------------------------(Stock)--(Price)')
  ) {
    return true;
  }
  return false;
}

export function getWaresProprietor(text: string) {
  const parts = text.split('\n');
  const owner = parts[0].slice(12, -1).replace(/[ .]*$/, '');
  return { owner };
}

export function parseWares(text: string): T.DBWares[] {
  text = text.trim();
  if (!(text.startsWith('Proprietor:') || text.startsWith('[File continued via MORE]'))) {
    console.error('Cannot parse text as WARES!');
    return [];
  }
  const parts = text.split('\n').filter((x) => !!x);
  const stateOwner = STATE.Room.owner;
  const lineOwner = parts[0].includes('File continued via MORE') ? parts[0].slice(12, -1).replace(/[ .]*$/, '') : null;
  const owner = stateOwner || lineOwner;
  const result = [];
  // id - description - stock - price
  const gpRe = /^[a-z]+\d+[ ][-a-z0-9;,() ]+\d+[ ]+\d+gp$/i;
  for (let line of parts) {
    line = line.trim();
    if (gpRe.test(line)) {
      const item = parseWaresLine(line);
      item.owner = owner;
      result.push(item);
    }
  }
  return result;
}

function parseWaresLine(line: string): T.DBWares {
  const parts = line.split(' ').filter((x) => !!x);
  const id = parts[0];
  const stock = parseInt(parts.at(-2));
  const price = parseInt(parts.at(-1));
  const name = parts.slice(1, -2).join(' ');
  return { id, stock, price, name, owner: '' };
}

export function parseElixList(text: string): Record<string, any>[] {
  const lines = text.split('\n').filter((x) => !!x);
  if (lines.length < 3 || !lines[1].includes('-------')) return [];
  const head1 = /Vial[ ]+Fluid[ ]+Sips[ ]+Months/;
  if (!head1.test(lines[0])) return [];

  const elixlist = [];
  for (const line of lines) {
    const m = line.match(/^([a-z0-9' -]+?)[ ]+(an? [a-z0-9 ]+?)[ ]+(\d+)/i);
    if (m && m[1] && m[2] && m[3]) {
      const fluid = m[2];
      let m2 = fluid.match(/^an? (?:elixir|salve) of ([a-z]+)/);
      let type = null;
      if (m2 && m2[1]) {
        type = m2[1];
      }
      if (!type) {
        m2 = fluid.match(/^an? ([a-z]+) salve/);
        if (m2 && m2[1]) {
          type = m2[1];
        }
      }
      elixlist.push({
        vial: m[1],
        fluid,
        type,
        sips: parseInt(m[3]),
      });
    }
  }
  return elixlist;
}

export function parseQuickWho(text: string): string[] {
  /*
   * Parse quick-who text
   */
  const lines = text.split('\n').filter((x) => !!x);
  const names = [];
  for (const line of lines) {
    for (let name of line.split(',')) {
      name = name.trim().replace(/[.]*$/g, '');
      if (name.startsWith('and ')) {
        name = name.slice(4);
      }
      if (/^[A-Z][a-z]+$/.test(name)) {
        names.push(name);
      }
    }
  }
  return names;
}

export function parseHonours(text: string): T.DBPlayer {
  /*
   * Parse honours/ whois text
   */
  const lines = text.split('\n').filter((x) => !!x);
  let name = lines[0].replace(/[\r .]*$/, '');
  const sexRace = name.match(/\(([a-z]+) ([ 'a-z]+?)\)/i);
  name = name.replace(/ \(.+?\)$/, '');
  const result = { id: null, fullname: name, city: '', class: '' };
  for (const line of lines) {
    const parts = line.split(' ').filter((x) => !!x);
    if (line.includes('years old, having been born')) {
      result.age = parseInt(parts.at(2));
      continue;
    }
    if (line.includes('is a member of the Ivory Mark.')) {
      result.mark = 'Ivory Mark';
      continue;
    } else if (line.includes('is a member of the Quisalis Mark.')) {
      result.mark = 'Quisalis Mark';
      continue;
    }
    if (line.includes('class.') && line.includes(' is a member of the ')) {
      result.class = parts.at(-2);
      continue;
    }
    if (line.includes('is a') && line.includes('in')) {
      const m = text.match(`[SHFah]e is a.+ in (${CITIES.join('|')})`);
      if (m) {
        result.city = m[1];
      }
    }
  }
  if (sexRace) {
    result.sex = sexRace[1];
    result.race = sexRace[2];
  }
  return result;
}

const EXTRACT_MINERALS = Object.keys(MINERALS).filter((x) => !Config.EXCLUDE_MINERALS.includes(x));
// Ignore some plants from config
const HARVEST_PLANTS = Object.keys(HERBS).filter((x) => !Config.EXCLUDE_HERBS.includes(x));
// Ignore some gathering materials
const GATHER_MATERIALS = Object.keys(MATERIALS).filter((x) => !Config.EXCLUDE_MATERIAL.includes(x));

export function parseMinerals(text: string) {
  if (!text.includes('You spot the following minerals here')) {
    return;
  }
  const regex = /^([a-z]+)[ ]+([a-z]+)$/i;
  const lines = text.split('\n').filter((x) => !!x);
  const goodies = { extract: [] };
  for (const line of lines) {
    const m = line.trim().match(regex);
    if (m) {
      const stuff = m[1].toLowerCase();
      // ignore quantity for now
      if (EXTRACT_MINERALS.includes(stuff)) goodies.extract.push(stuff);
      else {
        console.warn(`Unknown gatherable: ${stuff}! Not sure what to do with it!`);
      }
    }
  }
  return goodies;
}

export function parsePlants(text: string) {
  if (!text.includes('The following plants are growing in this room')) {
    return;
  }
  const regex = /^.+?\(([a-z]+)\)[ ]+([a-z]+)$/i;
  const lines = text.split('\n').filter((x) => !!x);
  const goodies = { gather: [], harvest: [] };
  for (const line of lines) {
    const m = line.trim().match(regex);
    if (m) {
      const plant = m[1];
      // ignore quantity for now
      if (HARVEST_PLANTS.includes(plant)) goodies.harvest.push(plant);
      else if (GATHER_MATERIALS.includes(plant)) goodies.gather.push(plant);
      else {
        console.warn(`Unknown gatherable: ${plant}! Not sure what to do with it!`);
      }
    }
  }
  return goodies;
}
