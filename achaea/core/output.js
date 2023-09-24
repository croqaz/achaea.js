/*
 * Game text processor.
 * Can be used to highlight text, display meta-data, shrink or, mute game text.
 */

const CRITIC_LEVELS = [
  // "You have scored a CRITICAL hit", // no need
  'You have scored a CRUSHING CRITICAL hit',
  'You have scored an OBLITERATING CRITICAL hit',
  'You have scored an ANNIHILATINGLY POWERFUL CRITICAL hit',
  'You have scored a WORLD-SHATTERING CRITICAL hit',
  'You have scored a PLANE-RAZING CRITICAL hit',
];

const POWER_LEVELS = [
  ['almost glows with nearly god-like power', 16, '☠️☠️☠️'],
  ['does not even register your presence as a threat', 15, '☠️☠️'],
  ['exudes an aura of overwhelming power', 14, '☠️'],
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

export function processDisplayText(text) {
  /*
   * This is raw ANSI text, from the game.
   */

  if (text.includes('magical shield')) {
    text = text.replace(
      'A nearly invisible magical shield forms around ',
      'A nearly invisible magical shield 🛡️ forms around ',
    );
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
      if (text.includes(p[0])) {
        text = text.replace(p[0], `${p[0]} 🦾=${p[1]} LVL=${p[2]}`);
        break;
      }
    }
  }

  if (text.includes('talisman')) {
    text = text.replaceAll(' talisman piece', ' talisman piece 🧿');
  }

  if (text.includes('sovereigns')) {
    text = text.replaceAll(' golden sovereigns', ' golden sovereigns 🪙');
  }

  if (text.includes('the corpse')) {
    text = text.replace(', retrieving the corpse.', ', retrieving the corpse 💀.');
  }

  //
  process.stdout.write(text);
  return text;
}
