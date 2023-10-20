import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
import { gmcpHello, gmcpSupports } from './gmcp.ts';

// Quit signals
let quits = 0;

export default function processTriggers(text: string) {
  /*
   * Process game text to enable triggers
   */

  //
  // after correct login
  if (STATE.Me.round === 0 && text.includes('Password correct. Welcome to Achaea.')) {
    // Say hello & Subscribe to GMCP messages
    ee.emit('user:gmcp', gmcpHello());
    setTimeout(() => ee.emit('user:gmcp', gmcpSupports()), 1000);
  }

  //
  // Hack to close telnet on quit (only for Bun)
  if (text.includes('You grow still and begin to silently pray for preservation of your soul')) quits++;
  if (text.includes('You feel your insides clench as your soul is frozen')) quits++;
  if (text.includes('Goodbye for now!')) quits++;
  if (text.includes('You have played')) quits++;
  if (quits >= 4) ee.emit('quit');
}

ee.on('game:text', processTriggers);
