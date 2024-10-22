import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
const { Battle } = STATE;

/*
 * Break shield skill.
 */
export function breakShield(name: string | number): string {
  // Druids only have a hammer tattoo ??
  return `TOUCH HAMMER ${name}`;
}

export function rageBreakShield(): string {
  return 'VINECRACK';
}

//
// Strangle (a1)
// Syntax:            STRANGLE <target>
// Works on/against:  Denizens
// Cooldown:          16.00 seconds
// Resource:          14 rage
// Details:
// Summon vines from your quarterstaff which will throttle your opponent.
// The vines will continue to choke the life from your target for some time, doing damage to the denizen for the duration.
// -------------------------------------------------------------------------------
//
// Redeem (a2)
// Syntax:            RECLAMATION REDEEM <target>
// Extra Information: Gives denizen affliction: Weakness
// Works on/against:  Denizens
// Cooldown:          31.00 seconds
// Resource:          22 rage
// Details:
// Steal a target's energy for a short time to feed the natural world around it, giving the weakness affliction for several seconds.
// -------------------------------------------------------------------------------
//
// Vinecrack (a3)
// Syntax:            VINECRACK <target>
// Works on/against:  Denizens
// Resource:          17 rage
// Details:
// Wrap your target in vines which constrict around it, shattering a denizen's shield.
// -------------------------------------------------------------------------------
//
// Ravage (a4)
// Syntax:            RAVAGE <target>
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          36 rage
// Details:
// Spring upon your target and savagely attack it with your fangs and claws.
// (Requires Wildcat, Cheetah, Hyena, Bear, Wolverine, Icewyrm, Gorilla, Wyvern, or Hydra)
// -------------------------------------------------------------------------------
//
// Sear (a5)
// Syntax:            SEAR <target>
// Extra Information: Uses denizen afflictions: Recklessness or Stun
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          25 rage
// Details:
// Summon a blast of sunlight from your outstretched quarterstaff to blind your opponent.
// This attack will do significantly increased damage to targets that are afflicted by recklessness or are stunned.
// -------------------------------------------------------------------------------
//
// Glare (a6)
// Syntax:            QUARTERSTAFF|QSTAFF GLARE <target>
// Extra Information: Gives denizen affliction: Clumsiness
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          14 rage
// Details:
// Assault your target with the brightened tip of your quarterstaff,
// causing the target to become clumsy for several seconds.
//
export function battleRage(rage: number, force = false): void {
  //
  // Strangle   Summon vines to throttle your opponent.
  // Redeem     Severely weaken your target.
  // Vinecrack  Crack a denizen's shield like a tough nut.
  // Ravage     Unleash your animalistic rage.
  // Sear       Summon the blinding power of sunlight.
  // Glare      Startle your target into clumsiness.
  //
  if (rage >= 14 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 16_200);
    Battle.rage -= 14;
    Battle.bals.a1 = false;
    ee.emit('user:text', 'STRANGLE');
    return;
  }

  if (rage >= 22 && (force || Battle.bals.a2)) {
    setTimeout(() => (Battle.bals.a2 = true), 31_200);
    Battle.rage -= 22;
    Battle.bals.a2 = false;
    ee.emit('user:text', 'RECLAMATION REDEEM');
    return;
  }

  if (rage >= 36 && (force || Battle.bals.a4)) {
    setTimeout(() => (Battle.bals.a4 = true), 23_200);
    Battle.rage -= 36;
    Battle.bals.a4 = false;
    ee.emit('user:text', 'RAVAGE');
    return;
  }

  //
  // Sear and Glare are afflict abilities,
  // and I want to use them more rarely
  //

  // 25 rage normally
  if (rage >= 35 && (force || Battle.bals.a5)) {
    setTimeout(() => (Battle.bals.a5 = true), 30_500); // 23s normally
    Battle.rage -= 25;
    Battle.bals.a5 = false;
    ee.emit('user:text', `SEAR ${Battle.tgtID}`);
    return;
  }

  // 14 rage normally
  if (rage >= 25 && (force || Battle.bals.a6)) {
    setTimeout(() => (Battle.bals.a6 = true), 25_500); // 23s normally
    Battle.rage -= 14;
    Battle.bals.a6 = false;
    ee.emit('user:text', `QUARTERSTAFF GLARE ${Battle.tgtID}`);
    return;
  }
}
