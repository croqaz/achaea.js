import { dim, italic } from 'ansicolor';
import { STATE } from './state.ts';
import extraProcessDisplayText from '../extra/output.ts';

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

const SPAN_CODE = '<span class="[a-zA-Z- ]+">';
const SPAN_STOP = '</span>\n?';
// This can only handle CONFIG PROMPT STATS & ALL
export const PROMPT = new RegExp(
  `(${SPAN_CODE}[0-9]{1,6}h, ${SPAN_STOP}${SPAN_CODE}[0-9]{1,6}m,? ${SPAN_STOP}` +
    `(?:${SPAN_CODE}[0-9]{1,8}e, ${SPAN_STOP}${SPAN_CODE}[0-9]{1,8}w,? ${SPAN_STOP})?` +
    `(?:${SPAN_CODE}[0-9]{1,6}R${SPAN_STOP})?${SPAN_CODE}[ ]?[a-z]*-${SPAN_STOP})$`,
  'm',
);

// let count = 1;

export default function processDisplayText(text: string): string {
  /*
   * Game text processor.
   * Used to highlight or replace text, display meta-data...
   * This is raw ANSI text, from the game.
   * It is only used for display in the GUI,
   * it is not used for triggers.
   */
  // console.time(`core-output-${count}`);

  {
    const p = text.match(PROMPT);
    if (p) {
      let extra = '';
      if (STATE.Battle.active && STATE.Battle.tgtHP) {
        extra += ` <i class="ansi-yellow">tgt=${STATE.Battle.tgtHP}</i>`;
      }
      if (STATE.Me.hp < STATE.Me.oldhp) {
        extra += ` <i class="ansi-dim ansi-red">-${STATE.Me.oldhp - STATE.Me.hp}HP</i>`;
      }
      if (STATE.Me.mp < STATE.Me.oldmp) {
        extra += ` <i class="ansi-dim ansi-blue">-${STATE.Me.oldmp - STATE.Me.mp}MP</i>`;
      }
      if (!extra) {
        extra = ' <b>●</b>';
      }
      text = text.replace(p[0], p[0] + extra);
    }
  }

  if (text.includes(' CRITICAL hit')) {
    let index = 0;
    for (const p of CRITIC_LEVELS) {
      if (text.includes(p)) {
        text = text.replace(p, `${p} ${'⭐'.repeat(index + 1)}`);
        break;
      }
      index++;
    }
  }

  if (text.includes(' health remaining.')) {
    for (const p of POWER_LEVELS) {
      if (text.includes(p[0] as string)) {
        text = text.replace(p[0] as string, `${p[0]} 🦾=${p[1]} LVL=${p[2]}`);
        break;
      }
    }
  }

  // Fix the fucking newline, it's driving me crazy
  if (text.includes('You have recovered')) {
    text = text.replace(/\s+You have recovered /, 'You have recovered ');
  }

  text = extraProcessDisplayText(text);

  // console.timeEnd(`core-output-${count}`);
  // count++;

  return text.trim();
}
