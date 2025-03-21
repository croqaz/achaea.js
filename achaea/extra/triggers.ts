import ee from '../events/index.ts';
import { STATE, stateStopBattle } from '../core/state.ts';
import { debounce } from '../core/util.ts';
import * as p from '../parsers.ts';

// TODO ::
// An icewall is here, blocking passage to the up.
//
const RE = {
  assess: /^You glance over ([A-Za-z]+) and see that his health is at (\d+)\/(\d+)\.$/m,
  shield: /^A nearly invisible magical shield forms around (.+)\.$/m,
  barrier: /^([A-Za-z]+) strums a few notes on a Lasallian lyre, and a prismatic barrier forms around (?:him|her|faen)\.$/m,
  rebound: /^You suddenly perceive the vague outline of an aura of rebounding around ([A-Za-z]+)\.$/m,
  auraClear: /^([A-Za-z]+)'s aura of weapons rebounding disappears\.$/m,
  barrClear: /^([A-Za-z]+)'s prismatic barrier dissolves into nothing\.$/m,
};

const diagMe = debounce(() => {
  ee.emit('user:text', 'QUEUE PREPEND e DIAG ME');
}, 2500);

const standUp = debounce(() => {
  ee.emit('user:text', 'STAND');
}, 1000);

export default function processTriggers(text: string, normText: string) {
  /*
   * Process game text to enable triggers
   * The first triggers are THE MOST IMPORTANT
   */
  text = text.trim();
  const userInput = STATE.Misc.input.toLowerCase();

  // Auto diagnose on Loki
  if (text.includes('You are confused as to the effects of the venom.')) {
    // if (STATE.me.hp === STATE.me.maxhp && STATE.me.mp === STATE.me.maxmp)
    // ee.emit('user:text', 'CURING PREDICT RECKLESSNESS') ??
    diagMe();
  }

  // Thief protection
  if (STATE.Misc.greed && text.includes('A feeling of generosity spreads throughout you.')) {
    ee.emit('user:text', 'QUEUE PREPEND e SELFISHNESS');
  }

  if (
    normText.includes('You must be standing ') ||
    normText.includes('You open your eyes and yawn mightily')
    // normText.includes('You open your eyes and stretch languidly')
  ) {
    standUp();
  }

  // Auto air-pocket under-water
  if (STATE.Room.details.includes('underwater') && normText.includes('You choke as you inhale water.')) {
    ee.emit('user:text', 'CURING PRIORITY DEFENCE AIRPOCKET 25');
  } else if (
    !STATE.Room.details.includes('underwater') &&
    normText.includes('The pocket of air around you dissipates into the atmosphere.')
  ) {
    ee.emit('user:text', 'CURING PRIORITY DEFENCE AIRPOCKET RESET');
  }

  if (normText.includes('has the following venoms or magical effects on it:') && normText.includes('Walk on water')) {
    STATE.Me.waterWalk = true;
  }

  if (
    userInput === 'fly' &&
    (normText.includes('You begin to flap your wings powerfully, and rise quickly up into the firmament.') ||
      normText.includes('You are already soaring through the sky, free as a bird.'))
  ) {
    // DEF: You are soaring high above the ground.
    STATE.Me.flying = true;
  } else if (
    userInput === 'land' &&
    (normText.includes(
      'You begin to descend, the wind whistling past you as the earth draws ever closer. You land easily',
    ) ||
      normText.includes('You are not flying, my friend.'))
  ) {
    STATE.Me.flying = false;
  }

  if (
    normText.includes('You easily vault onto the back of a ') ||
    normText.includes('You climb up on a ') ||
    normText.includes('You must dismount before you can mount anything else.')
  ) {
    // DEF: You are riding a ...
    STATE.Me.riding = true;
  } else if (normText.includes('You step down off of a ') || normText.includes('You are not currently riding anything.')) {
    // You lose purchase on (riding = false)
    STATE.Me.riding = false;
  }

  // Fill all elixirs
  //
  if (STATE.Misc.filla && text.includes('  Fluid  ')) {
    const elixlist = p.parseElixList(text);
    if (elixlist.length) {
      let toFill = 0;
      STATE.Misc.filla = false;
      for (const elem of elixlist) {
        if (elem.sips < 190) {
          toFill++;
          ee.emit('user:text', `FILL ${elem.type} WITH ${elem.type} FROM rift`);
        }
      }
      if (toFill) {
        setTimeout(() => {
          ee.emit('sys:text', `Tried to fill ${toFill} vials.`);
        }, 1000);
      }
    }
  }

  // Track room shields & rebounding auras
  {
    let m = text.match(RE.shield);
    if (m && m[1]) {
      const tgt = Object.values(STATE.Battle.tgts).find((t) => t.name === m[1]);
      // Found the enemy with shield!
      if (tgt) {
        if (!tgt.defs) tgt.defs = new Set();
        tgt.defs.add('shield');
        ee.emit('room:track:def', tgt);
      }
    }
    m = text.match(RE.rebound);
    if (m && m[1]) {
      const tgt = Object.values(STATE.Battle.tgts).find((t) => t.name === m[1]);
      // Found the enemy with rebounding!
      if (tgt) {
        if (!tgt.defs) tgt.defs = new Set();
        tgt.defs.add('rebounding');
        ee.emit('room:track:def', tgt);
      }
    }
    m = text.match(RE.barrier);
    if (m && m[1]) {
      const tgt = Object.values(STATE.Battle.tgts).find((t) => t.name === m[1]);
      // Found the enemy with prismatic barrier!
      if (tgt) {
        if (!tgt.defs) tgt.defs = new Set();
        tgt.defs.add('barrier');
        ee.emit('room:track:def', tgt);
      }
    }
    m = text.match(RE.auraClear);
    if (m && m[1]) {
      const tgt = Object.values(STATE.Battle.tgts).find((t) => t.name === m[1]);
      // Found the enemy with rebounding!
      if (tgt && tgt.defs) {
        tgt.defs.delete('rebounding');
        ee.emit('room:track:def', tgt);
      }
    }
    m = text.match(RE.barrClear);
    if (m && m[1]) {
      const tgt = Object.values(STATE.Battle.tgts).find((t) => t.name === m[1]);
      // Found the enemy with prismatic barrier!
      if (tgt && tgt.defs) {
        tgt.defs.delete('barrier');
        ee.emit('room:track:def', tgt);
      }
    }
    m = text.match(RE.assess);
    if (m && m[1]) {
      const tgt = Object.values(STATE.Battle.tgts).find((t) => t.name === m[1]);
      // Found the enemy!
      if (tgt) {
        tgt.hp = parseInt(m[2]);
        tgt.maxhp = parseInt(m[3]);
        tgt.hpperc = Math.round((tgt.hp / tgt.maxhp) * 100) + '%';
        ee.emit('room:track:def', tgt);
      }
    }
  }

  // Enable/ disable hunting rats
  //
  if (text.includes('You will now notice the movement of rats. Happy hunting!')) {
    STATE.Misc.rats = true;
    return;
  } else if (text.includes('You will no longer take notice of the movement of rats.')) {
    STATE.Misc.rats = false;
    return;
  }

  if (text.includes('has requested that you share some of your knowledge of')) {
    return ee.emit('user:text', 'OK');
  }

  // Stop auto-attack, backup logic
  // The main logic uses GMCP data
  //
  if (text.includes('You have slain') && text.includes(', retrieving the corpse.')) {
    STATE.Stats.kills++;
    STATE.Battle.tgtHP = null;
    return stateStopBattle();
  } else if (text.includes('You cannot see that being here.')) {
    return stateStopBattle();
  }

  // Stop auto-PVP attack
  //
  if (
    text.includes('You have been defeated and are thrown out of the Arena.\n') ||
    text.includes('You have been victorious and leave the Arena in triumph!\n')
  ) {
    STATE.Battle.tgtHP = null;
    return stateStopBattle();
  } else if (
    STATE.Battle.target &&
    (normText.includes(`You have slain ${STATE.Battle.target}.`) ||
      normText.includes(`You have been slain by ${STATE.Battle.target}.`))
  ) {
    return stateStopBattle();
  }

  // Track balances
  //
  const dt = new Date();
  if (/^You eat (?:a|some) [a-z ]+\.$/m.test(text)) {
    STATE.Stats.eat = dt;
  }
  if (/^You take a drink from a[a-zA-Z ]+ vial\.$/m.test(text)) {
    STATE.Stats.drink = dt;
  }
  if (/^You take out some salve and quickly rub it on your (?:arms|legs|skin)\.$/m.test(text)) {
    STATE.Stats.apply = dt;
  }
  if (/^You take a long drag of [a-z]+ off your pipe\.$/m.test(text)) {
    STATE.Stats.smoke = dt;
  }

  // DISABLED: currently unused
  // try to parse survey output, to enhance location state
  // if (text.includes('You discern that you are') && text.includes('Your environment')) {
  //   p.parseSurvey(text) ...
  // }
}

ee.on('game:text', processTriggers);
