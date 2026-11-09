import ee from '../events/index.ts';
import * as p from '../parsers.ts';
import { POWER_LEVELS } from '../parsers.ts';
import { STATE } from './state.ts';
import { Config } from '../config.ts';
import { customUserOutput } from './custom.ts';
import { i } from '../html.ts';

// optionally, import extras
let extraProcessDisplayText: typeof module;
if (Config.EXTRA) extraProcessDisplayText = await import('../extra/output.ts');

const CRITIC_LEVELS = [
  // You have scored a CRITICAL hit // no need for Stars
  'You have scored a CRUSHING CRITICAL hit',
  'You have scored an OBLITERATING CRITICAL hit',
  'You have scored an ANNIHILATINGLY POWERFUL CRITICAL hit',
  'You have scored a WORLD-SHATTERING CRITICAL hit',
  'You have scored a PLANE-RAZING CRITICAL hit', // 5x Stars
];

const SPAN_CODE = '<span class="[a-zA-Z -]+">';
const SPAN_STOP = '</span>\n?';
// This can only handle CONFIG PROMPT STATS & ALL
export const PROMPT = new RegExp(
  `^(${SPAN_CODE}[0-9]{1,6}h, ${SPAN_STOP}${SPAN_CODE}[0-9]{1,6}m,? ${SPAN_STOP}` +
    `(?:${SPAN_CODE}[0-9]{1,8}e, ${SPAN_STOP}${SPAN_CODE}[0-9]{1,8}w,? ${SPAN_STOP})?` +
    `(?:${SPAN_CODE}[0-9]{1,6}R${SPAN_STOP})?${SPAN_CODE}[ ]?[a-z]*-\n?${SPAN_STOP})`,
  'm',
);

// [System]: Added GET GOLD to your eb queue. -- as HTML, 4 coloured spans; gagged from the output
const QUEUE_NOTE =
  /^<span[^>]*>\[<\/span><span[^>]*>System<\/span><span[^>]*>\]<\/span><span[^>]*>: Added .+? to your \S+ queue\.(?:<\/span>)?\n?/gm;

const SPAN_OPEN = '<span class="';
const SPAN_CLOSE = '</span>';

function isSpace(c: number): boolean {
  return c === 32 || c === 10 || c === 13 || c === 9;
}

/*
 * Trim the block, including the whitespace inside the colour spans at the edges.
 * The game colours its newlines too, so when GMCP arrives between the room
 * description and the exits, the exits block starts with: <span class="c-cyan">\r\n</span>
 * The GUI shows every block in its own paragraph, so that newline is a visible gap.
 * Hot path: no regex, only the first & the last span are inspected (~50ns)
 */
export function trimHtml(html: string): string {
  html = html.trim();
  // head: <span class="x">\r\n</span>... or <span class="x">\r\n text...
  while (html.startsWith(SPAN_OPEN)) {
    const gt = html.indexOf('>', SPAN_OPEN.length);
    if (gt < 0) break;
    let i = gt + 1;
    while (isSpace(html.charCodeAt(i))) i++;
    if (html.startsWith(SPAN_CLOSE, i)) {
      // an empty span
      html = html.slice(i + SPAN_CLOSE.length).trimStart();
      continue;
    }
    if (i > gt + 1) html = html.slice(0, gt + 1) + html.slice(i);
    break;
  }
  // tail: ...text\r\n</span> or ...<span class="x">\r\n</span>
  while (html.endsWith(SPAN_CLOSE)) {
    const end = html.length - SPAN_CLOSE.length;
    let i = end - 1;
    while (i >= 0 && isSpace(html.charCodeAt(i))) i--;
    if (html.charCodeAt(i) === 62 /* > */) {
      // an empty span, if this is its opening tag
      const k = html.lastIndexOf(SPAN_OPEN, i);
      if (k >= 0 && html.indexOf('>', k) === i) {
        html = html.slice(0, k).trimEnd();
        continue;
      }
    }
    if (i < end - 1) html = html.slice(0, i + 1) + SPAN_CLOSE;
    break;
  }
  return html;
}

// let count = 1;

export default function processDisplayText(html: string, text: string): string {
  /*
   * Game text processor.
   * Used to highlight or replace text, display meta-data...
   * This is HTML output, straight from the game.
   * The output is used for display and the logs,
   * it is not used for triggers.
   */
  // console.time(`core-output-${count}`);

  html = trimHtml(html);

  // fix space before list on newline
  html = html.replace(/[\r\n ]+?\* </g, '\n* <');

  {
    const p = html.match(PROMPT);
    if (p) {
      let extra = '';
      if (STATE.Battle.active && STATE.Battle.tgtHP) {
        extra += ' ' + i.yellow(`tgt=${STATE.Battle.tgtHP}`);
      }
      if (STATE.Me.hp < STATE.Me.oldhp) {
        extra += ' ' + i.dim.red(`-${STATE.Me.oldhp - STATE.Me.hp}HP`);
      }
      if (STATE.Me.mp < STATE.Me.oldmp) {
        extra += ' ' + i.dim.blue(`-${STATE.Me.oldmp - STATE.Me.mp}MP`);
      }
      if (!extra) {
        extra = ' <b>●</b>';
      }
      html = html.replace(p[0], p[0] + extra);
    }
  }

  if (html.includes(' CRITICAL hit')) {
    let index = 0;
    for (const p of CRITIC_LEVELS) {
      if (html.includes(p)) {
        html = html.replace(p, `${p} ${'⭐'.repeat(index + 1)}`);
        break;
      }
      index++;
    }
  }

  if (html.includes(' health remaining.')) {
    for (const p of POWER_LEVELS) {
      if (html.includes(p[0] as string)) {
        html = html.replace(p[0] as string, `${p[0]} 🦾=${p[1]} LVL=${p[2]}`);
        break;
      }
    }
  }

  {
    // Check for room title & description
    const roomInfo = p.validRoomInfo(html);
    if (roomInfo) {
      STATE.Room.update2(roomInfo);
    }
    // The full room text is saved in the DB
    const roomText = p.parseRoomText(html);
    if (roomText) {
      ee.emit('room:text', roomText);
    } else {
      const exits = p.parseRoomExits(text);
      if (exits) ee.emit('room:exits', exits);
    }
    // The text of LOOK <player> is saved in the DB
    const playerText = p.parsePlayerText(text);
    if (playerText) ee.emit('player:text', playerText);
    // The text of LOOK <denizen> is saved in the DB
    const denizenText = p.parseDenizenText(text);
    if (denizenText) ee.emit('denizen:text', denizenText);
  }

  {
    // Check for wilderness map
    const mapDescrip = p.validWildMap(html);
    if (mapDescrip) {
      const [map, desc] = mapDescrip;
      // Send wilderness map
      ee.emit('wild:map', map);
      html = desc;
    }
  }

  // GAG junk
  // Sad that I have to gag this, instead of disabling them from CONFIG
  //
  // [System]: Added Whatever to your eb (b!p!wu!t...) queue.
  html = html.replace(QUEUE_NOTE, '');

  // Optional: run extra output function
  if (extraProcessDisplayText) {
    html = extraProcessDisplayText.default(html, text);
  }

  // Optional: run custom output function
  {
    const customFunc = customUserOutput();
    if (customFunc) {
      try {
        html = customFunc(html, text);
      } catch (err) {
        console.error("Can't process custom user output:", err);
      }
    }
  }
  // console.timeEnd(`core-output-${count}`);
  // count++;

  return html.trim();
}
