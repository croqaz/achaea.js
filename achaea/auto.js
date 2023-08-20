import ee from './events.js';
import { STATE } from './states.js';

function procesRound() {
  /*
   * Run automation on a new round
   */
  if (STATE.MUD.battle) {
    ee.emit('user:text', 'kill');
  }
}

ee.on('new:round', procesRound);
