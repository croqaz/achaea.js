import ee from '../events.js';
import { STATE } from './state.js';
import { gmcpHello, gmcpSupports, gmcpRiftItems } from './gmcp.js';

const RAGE_REGEX = /\[Rage\]: \+\d+\.\d+\. Total: \d+\.\d+ Now Available: (.+)/;

export default function processTriggers(text) {
  /*
   * Process game text to enable triggers
   * The first triggers are THE MOST IMPORTANT
   */
  text = text.trim();

  // Thief protection
  if (STATE.MUD.greed && text.includes('A feeling of generosity spreads throughout you')) {
    ee.emit('user:text', 'QUEUE PREPEND EB SELFISHNESS');
    return;
  }

  if (
    text.includes('You must be standing first') ||
    text.includes('You must be standing to walk') ||
    text.includes('You open your eyes and yawn mightily')
  ) {
    ee.emit('user:text', 'stand');
    return;
  }

  // Stop auto attack logic
  if (text.includes('You have slain') && text.includes(', retrieving the corpse.')) {
    STATE.MUD.battle = false;
    return;
  }

  // enable/ disable hunting rats
  if (text.includes('You will now notice the movement of rats. Happy hunting!')) {
    STATE.MUD.rats = true;
    return;
  } else if (text.includes('You will no longer take notice of the movement of rats.')) {
    STATE.MUD.rats = false;
    return;
  }

  // after correct login
  if (text.includes('Password correct. Welcome to Achaea.')) {
    // Say hello & Subscribe to GMCP messages
    ee.emit('user:gmcp', gmcpHello());
    setTimeout(() => ee.emit('user:gmcp', gmcpSupports()), 1000);
    setTimeout(() => ee.emit('user:gmcp', gmcpRiftItems()), 2000);
  }
}

ee.on('game:text', processTriggers);
