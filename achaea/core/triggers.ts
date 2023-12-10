import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
import { gmcpHello, gmcpSupports } from './gmcp.ts';

export default function processTriggers(_: string, normText: string) {
  /*
   * Process game text to enable triggers
   */

  //
  // after correct login
  if (STATE.Me.round === 0 && normText.includes('Password correct. Welcome to Achaea.')) {
    // Say hello & Subscribe to GMCP messages
    ee.emit('user:gmcp', gmcpHello());
    setTimeout(() => ee.emit('user:gmcp', gmcpSupports()), 1000);
  }

  // Make sure the user is really quitting
  if (
    STATE.Custom.quitting &&
    normText.includes('You grow still and begin to silently pray for preservation of your soul')
  ) {
    // Session finish time
    STATE.Stats.endDt = new Date();
    // Emit quitting, for cleanup
    ee.emit('game:quit');
  }
}

ee.on('game:text', processTriggers);
