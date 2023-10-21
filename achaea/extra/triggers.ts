import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';

const RAGE_REGEX = /\[Rage\]: \+\d+\.\d+\. Total: \d+\.\d+ Now Available: (.+)/;
const SHIELD_REGEX = /A nearly invisible magical shield forms around (.+)./;
const BRK_AURA_FAIL_REGEX =
  /You lunge toward (.+) with (.+), but finding no resistance, you stumble hopelessly off balance./;
const REBOUND_REGEX = /You suddenly perceive the vague outline of an aura of rebounding around (.+)./;

export default function processTriggers(text: string) {
  /*
   * Process game text to enable triggers
   * The first triggers are THE MOST IMPORTANT
   */
  text = text.trim();

  // Auto diagnose on Loki
  if (text.includes('You are confused as to the effects of the venom')) {
    ee.emit('user:text', 'QUEUE PREPEND EB DIAG ME');
  }

  // Thief protection
  if (STATE.Custom.greed && text.includes('A feeling of generosity spreads throughout you')) {
    ee.emit('user:text', 'QUEUE PREPEND EB SELFISHNESS');
  }

  if (
    STATE.Battle.active &&
    STATE.Battle.tgtID &&
    text.includes('You may channel the fury of battle once again')
  ) {
    // TODO :: Move into Runewarden/ Pariah/ whatever
    // TODO: get the focus type from a state: SPEED or PRECISION
    ee.emit('user:text', 'BATTLEFURY FOCUS SPEED');
  }

  // The bubble of air around you dissipates.
  // You choke as you inhale water.

  // has requested that you share some of your knowledge of
  // 'OK' to commence the lesson.

  if (
    text.includes('You must be standing ') ||
    text.includes('You open your eyes and yawn mightily')
    // text.includes('You open your eyes and stretch languidly')
  ) {
    ee.emit('user:text', 'STAND');
  }

  // Stop auto attack, backup logic
  // The main logic uses GMCP data
  if (text.includes('You have slain') && text.includes(', retrieving the corpse.')) {
    STATE.Battle.active = false;
    STATE.Battle.tgtID = null;
    STATE.Battle.tgtHP = null;
    return;
  } else if (text.includes('You cannot see that being here.')) {
    STATE.Battle.active = false;
    return;
  }

  // Track room shields & rebounding auras
  {
    let m = text.match(SHIELD_REGEX);
    if (m && m[1]) {
      const tgt = Object.values(STATE.Battle.tgts).find((t) => t.name === m[1]);
      // Found the enemy with shield!
      if (tgt) {
        if (!tgt.defs) tgt.defs = new Set();
        tgt.defs.add('shield');
        // TODO :: move this bit in a separate event
        if (STATE.Battle.active) {
          // Rage fragment! Resource: 17 rage (no cooldown)
          if (STATE.Battle.rage >= 17) {
            ee.emit('user:text', 'FRAGMENT');
            tgt.defs.delete('shield');
          }
        }
      }
    }
    m = text.match(REBOUND_REGEX);
    if (m && m[1]) {
      const tgt = Object.values(STATE.Battle.tgts).find((t) => t.name === m[1]);
      // Found the enemy with rebounding!
      if (tgt) {
        if (!tgt.defs) tgt.defs = new Set();
        // TODO :: emit an event
        tgt.defs.add('rebounding');
      }
    }

    // Remove defences on CARVE/ SPLINTER failure
    m = text.match(BRK_AURA_FAIL_REGEX);
    if (m && m[1]) {
      // This is the current target
      const tgt = STATE.Battle.tgts[STATE.Battle.tgtID];
      if (tgt && tgt.defs && (tgt.defs.has('shield') || tgt.defs.has('rebounding'))) {
        console.log('SHIELD BREAK FAIL !! remove tracked target defences');
        tgt.defs.delete('shield');
        tgt.defs.delete('rebounding');
      }
    }
  }

  /*
   Auto rage attacks for Runewarden:
   Collide    You are a battering ram.
   Bulwark    Negate some of the damage you take.
   Fragment   A rune that shatters a denizen's shield.
   Onslaught  It's just like tenderising meat.
   Etch       A fiery rune will strike your opponent.
   Safeguard  A protective rune that absorbs damage.
  */
  if (STATE.Battle.active) {
    // TODO :: Handle rage using GMCP instead of triggers!
    const m = text.match(RAGE_REGEX);
    if (m && m[1]) {
      const rage = m[1].toLowerCase().split(', ');
      // Collide cooldown: 16.00 seconds ; Resource: 14 rage
      if (rage.includes('collide')) ee.emit('user:text', 'COLLIDE');
      // Onslaught cooldown: 23.00 seconds ; Resource: 36 rage
      else if (rage.includes('onslaught')) ee.emit('user:text', 'ONSLAUGHT');
      // Bulwark cooldown: 45.00 seconds ; Resource: 28 rage
      else if (rage.includes('bulwark')) ee.emit('user:text', 'BULWARK');
    }
  }

  // enable/ disable hunting rats
  if (text.includes('You will now notice the movement of rats. Happy hunting!')) {
    STATE.Custom.rats = true;
    return;
  } else if (text.includes('You will no longer take notice of the movement of rats.')) {
    STATE.Custom.rats = false;
    return;
  }

  // DISABLED: currently unused
  // try to parse survey output, to enhance location state
  // if (text.includes('You discern that you are') && text.includes('Your environment')) {
  //   p.parseSurvey(text) ...
  // }
}

ee.on('game:text', processTriggers);
