import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';

export default function processTriggers(text: string, normText: string) {
  /*
   * Process game text to enable triggers.
   * You can find lots of trigger examples in:
   * extra/triggers, extra/gold, extra/wares, extra/whois
   * Read the docs/Triggers to learn more.
   */

  // The usual pattern for fixed text is:
  // if (text.includes('...')) {
  //   ee.emit('user:text', 'DO SOMETHING WITH THE TRIGGER');
  // }
  //
  // And for regex patterns:
  // if (/some regex/.test(text)) {
  //   ee.emit('user:text', 'DO SOMETHING WITH THE REGEX');
  // }
}

// Hook the function on the game text
ee.on('game:text', processTriggers);
