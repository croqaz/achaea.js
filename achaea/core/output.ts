import { dim, italic } from 'ansicolor';
import { STATE } from './state.ts';
import extraProcessDisplayText from '../extra/output.ts';

const CRITIC_LEVELS = [
  // You have scored a CRITICAL hit // no need
  'You have scored a CRUSHING CRITICAL hit',
  'You have scored an OBLITERATING CRITICAL hit',
  'You have scored an ANNIHILATINGLY POWERFUL CRITICAL hit',
  'You have scored a WORLD-SHATTERING CRITICAL hit',
  'You have scored a PLANE-RAZING CRITICAL hit',
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

const ANSI_CODE = '\x1B[[][0-9]+m';
const PROMPT = new RegExp(
  `^(?:${ANSI_CODE})?${ANSI_CODE}\\d{1,6}h, ${ANSI_CODE}${ANSI_CODE}\\d{1,6}m` +
    `(?:, ${ANSI_CODE}${ANSI_CODE}\\d{1,7}e, ${ANSI_CODE}${ANSI_CODE}\\d{1,7}w)?` +
    `(?:, ${ANSI_CODE}${ANSI_CODE}\\d{1,6}R)?[ ]?${ANSI_CODE}[ ]?[a-z]+?-$`,
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
        extra += italic.yellow(` tgt=${STATE.Battle.tgtHP}`);
      }
      if (STATE.Me.hp < STATE.Me.oldhp) {
        extra += dim.red(` -${STATE.Me.oldhp - STATE.Me.hp}HP`);
      }
      if (STATE.Me.mp < STATE.Me.oldmp) {
        extra += dim.blue(` -${STATE.Me.oldmp - STATE.Me.mp}MP`);
      }
      if (!extra) {
        extra = ' ●';
      }
      text = text.replace(p[0], p[0] + extra + '\n');
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

  text = extraProcessDisplayText(text);

  process.stdout.write(text);
  // console.timeEnd(`core-output-${count}`);
  // count++;

  return text.trim();
}
