import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
const { Battle, Me } = STATE;

/*
 * Break shield skill.
 * CAST SHALESTORM ??
 */
export function breakShield(name: string | number): string {
  return `CAST ERODE AT ${name}`;
}

export function rageBreakShield(name: string | number): string {
  return `CAST DISINTEGRATE AT ${name}`;
}

//
// Windlash (a1)
// Syntax:            CAST WINDLASH AT <target>
// Works on/against:  Denizens
// Cooldown:          16.00 seconds
// Resource:          14 rage
// Details:
// Summon precise gusts of wind to whip across your target's exposed flesh,
// causing intense pain. The winds will continually attack the denizen for several seconds.
// -------------------------------------------------------------------------------
//
// Dilation (a2)
// Syntax:            CAST DILATION AT <target>
// Extra Information: Gives denizen affliction: Aeon
// Works on/against:  Denizens
// Cooldown:          35.00 seconds
// Resource:          35 rage
// Details:
// Summon the forces of wind and ice in a polar vortex surrounding your
// target. The cold becomes so intense that the very fabric of time itself
// is cracked in a small pocket around the target, causing it to move much
// slower in relation to the rest of reality and afflicting it with the
// aeon effect for several seconds.
// -------------------------------------------------------------------------------
//
// Disintegrate (a3)
// Syntax:            CAST DISINTEGRATE AT <target>
// Works on/against:  Denizens
// Resource:          17 rage
// Details:
// This spell will use your rage to remove a denizen's shield.
// -------------------------------------------------------------------------------
//
// Squeeze (a4)
// Syntax:            CAST SQUEEZE <target>
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          36 rage
// Details:
// Command the earth to form a great stone hand to crush the life out
// of your target.
// You must have an earth channel opened to cast this spell.
// -------------------------------------------------------------------------------
//
// Firefall (a5)
// Syntax:            CAST FIREFALL AT <target>
// Extra Information: Uses denizen afflictions: Clumsiness or Recklessness
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          25 rage
// Details:
// Summon a mighty flaming rock high in the air and watch as it hurtles towards your target.
// Those who are too clumsy or reckless to dodge the attack will bear the full brunt of its might.
// -------------------------------------------------------------------------------
//
// Stormbolt (a6)
// Syntax:            CAST STORMBOLT AT <target>
// Extra Information: Gives denizen affliction: Sensitivity
// Works on/against:  Denizens
// Cooldown:          27.00 seconds
// Resource:          25 rage
// Details:
// Cast a bolt of electricity at a target, jangling its nerves and
// causing them to become hypersensitive for a few seconds.
// -------------------------------------------------------------------------------
//
export function battleRage(rage: number, force = false): void {
  //
  // Windlash      Channel whipping blasts of wind at your target.
  // Dilation      Freeze time around your opponent.
  // Disintegrate  Channel fire with your rage to destroy a denizen's shield.
  // Squeeze       Command the earth to crush your target.
  // Firefall      A mighty blow of earth and flame from the heavens.
  // Stormbolt     Sensitise your target with a bolt of lightning.
  //
  if (rage >= 14 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 16_200);
    Battle.rage -= 14;
    Battle.bals.a1 = false;
    ee.emit('user:text', `CAST WINDLASH AT ${Battle.tgtID}`);
    return;
  }

  if (rage >= 35 && (force || Battle.bals.a2)) {
    setTimeout(() => (Battle.bals.a2 = true), 35_200);
    Battle.rage -= 35;
    Battle.bals.a2 = false;
    ee.emit('user:text', `CAST DILATION AT ${Battle.tgtID}`);
    return;
  }

  if (rage >= 36 && (force || Battle.bals.a4)) {
    setTimeout(() => (Battle.bals.a4 = true), 23_200);
    Battle.rage -= 36;
    Battle.bals.a4 = false;
    ee.emit('user:text', 'CAST SQUEEZE');
    return;
  }

  //
  // Firefall and Stormbolt are afflict abilities,
  // and I want to use them more rarely
  //

  // 25 rage normally
  if (rage >= 35 && (force || Battle.bals.a5)) {
    setTimeout(() => (Battle.bals.a5 = true), 30_500); // 23s normally
    Battle.rage -= 25;
    Battle.bals.a5 = false;
    ee.emit('user:text', `CAST FIREFALL AT ${Battle.tgtID}`);
    return;
  }

  // 25 rage normally
  if (rage >= 35 && (force || Battle.bals.a6)) {
    setTimeout(() => (Battle.bals.a6 = true), 35_500); // 27s normally
    Battle.rage -= 25;
    Battle.bals.a6 = false;
    ee.emit('user:text', `CAST STORMBOLT AT ${Battle.tgtID}`);
    return;
  }
}
