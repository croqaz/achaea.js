import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
// import { Config } from './config.ts';

function procesRound() {
  /*
   * Run automation on a new round
   */
  const userInput: string = STATE.Custom.input;

  // Writhe forever
  //
  if (STATE.Custom.writhe && userInput === 'www') {
    ee.emit('user:text', 'WRITHE');
  }

  // Auto hunting attack
  // if (Battle.active && Battle.target) {
  //   Config.AUTO_ATTACK();
  // }
}

ee.on('have:eb', procesRound);
