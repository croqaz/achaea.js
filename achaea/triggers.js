import ee from './events.js';
import * as p from './parsers.js';
import { STATE, updateLocation } from './states.js';
import { gmcpHello, gmcpSupports } from './gmcp.js';

function processTriggers(text) {
  /*
   * Process game text to enable triggers
   * The first triggers are THE MOST IMPORTANT
   */
  text = text.trim();

  if (
    text.includes('You must be standing first') ||
    text.includes('You open your eyes and yawn mightily') ||
    text.includes('You open your eyes and stretch languidly, feeling deliciously well-rested')
  ) {
    ee.emit('user:text', 'stand');
    return;
  }

  // auto attack logic
  if (text.includes('You have slain') && text.includes('retrieving the corpse.')) {
    STATE.MUD.battle = false;
    return;
  }

  // try to parse survey output, to enhance location state
  if (text.includes('You discern that you are') && text.includes('Your environment')) {
    updateLocation(p.parseSurvey(text));
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
    setTimeout(() => ee.emit('user:gmcp', gmcpSupports()), 500);
  }
}

ee.on('game:text', processTriggers);
