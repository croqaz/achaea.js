import ee from '../events/index.ts';
import * as p from '../parsers.ts';
import { STATE } from './state.ts';
import { Config } from '../config.ts';
import { customUserOutput } from './custom.ts';

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

const POWER_LEVELS = [
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

const SPAN_CODE = '<span class="[a-zA-Z -]+">';
const SPAN_STOP = '</span>\n?';
// This can only handle CONFIG PROMPT STATS & ALL
export const PROMPT = new RegExp(
  `^(${SPAN_CODE}[0-9]{1,6}h, ${SPAN_STOP}${SPAN_CODE}[0-9]{1,6}m,? ${SPAN_STOP}` +
    `(?:${SPAN_CODE}[0-9]{1,8}e, ${SPAN_STOP}${SPAN_CODE}[0-9]{1,8}w,? ${SPAN_STOP})?` +
    `(?:${SPAN_CODE}[0-9]{1,6}R${SPAN_STOP})?${SPAN_CODE}[ ]?[a-z]*-\n?${SPAN_STOP})`,
  'm',
);

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

  // fix space before list on newline
  html = html.replace(/[\r\n ]+?\* </g, '\n* <');

  {
    const p = html.match(PROMPT);
    if (p) {
      let extra = '';
      if (STATE.Battle.active && STATE.Battle.tgtHP) {
        extra += ` <i class="c-yellow">tgt=${STATE.Battle.tgtHP}</i>`;
      }
      if (STATE.Me.hp < STATE.Me.oldhp) {
        extra += ` <i class="c-dim c-red">-${STATE.Me.oldhp - STATE.Me.hp}HP</i>`;
      }
      if (STATE.Me.mp < STATE.Me.oldmp) {
        extra += ` <i class="c-dim c-blue">-${STATE.Me.oldmp - STATE.Me.mp}MP</i>`;
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
    const roomInfo = p.validRoomInfo(text);
    if (roomInfo) {
      STATE.Room.update2(roomInfo);
    }
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
