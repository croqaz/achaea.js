import ee from '../events.js';
import { STATE } from './state.js';

function procesRound() {
  /*
   * Run automation on a new round
   */
  if (STATE.MUD.battle && STATE.MUD.target) {
    // Alias set kk <...>
    ee.emit('user:text', 'kk');
  }
}

ee.on('new:round', procesRound);
