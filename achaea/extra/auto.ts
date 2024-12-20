import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';

function procesRound() {
  /*
   * Run automation on a new round
   */
  const userInput: string = STATE.Misc.input;

  // Count battle rounds
  //
  if (STATE.Battle.active && STATE.Battle.tgtID) {
    STATE.Battle.rounds++;
    ee.emit('battle:update', STATE.Battle);
  }

  // Writhe forever (until stopped)
  //
  if (STATE.Misc.writhe && userInput === 'www') {
    ee.emit('user:text', 'WRITHE');
  }

  // Auto hunting attack
  // if (Battle.active && Battle.target) {
  //   Config.AUTO_ATTACK();
  // }
}

ee.on('have:eb', procesRound);
