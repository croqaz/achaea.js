import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
const { Battle, Me } = STATE;

/*
 * Break shield skill
 * Skirmishing rive: Shatter an opponent's shield
 * Rivestrike: rive through protective defences & deliver a followup blow
 * Requires spear or trident
 */
export function breakShield(name: string | number): string {
  return `RIVESTRIKE ${name}`;
}

export function rageBreakShield(): string {
  return 'BORE';
}

//
// Pester (a1)
// Syntax:            PESTER <target>
// Works on/against:  Denizens
// Cooldown:          16.00 seconds
// Resource:          14 rage
// Details:
// Summon a minor denizen of the wilds to pester your target, constantly attacking and doing damage to your target for several seconds.
// -------------------------------------------------------------------------------
//
// Tame (a2)
// Syntax:            TAME <target>
// Extra Information: Gives denizen affliction: Charm
// Works on/against:  Denizens
// Cooldown:          43.00 seconds
// Resource:          32 rage
// Details:
// Use your mastery over the wildlands to charm your target for a few seconds.
// For a short time, your target will instead attack any other denizens around you that you are also currently fighting.
// -------------------------------------------------------------------------------
//
// Bore (a3)
// Syntax:            BORE <target>
// Works on/against:  Denizens
// Resource:          17 rage
// Details:
// Using your rage, thrust forward with your weapon and bore through a denizen's shield, rendering it useless.
// -------------------------------------------------------------------------------
//
// Skewer (a4)
// Syntax:            SKEWER <target>
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          36 rage
// Details:
// Leap high into the air with a spear or trident and drive the weapon deep into your opponent's flesh.
// -------------------------------------------------------------------------------
//
// Swarm (a5)
// Syntax:            SWARM <target>
// Extra Information: Uses denizen afflictions: Aeon or Inhibit
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          25 rage
// Details:
// Summon a swarm of wasps attack a target.
// The damage of the swarm is substantially increased if the target is unable to heal properly
// or is afflicted by aeon and unable to dodge effectively.
// -------------------------------------------------------------------------------
//
// Goad (a6)
// Syntax:            GOAD <target>
// Extra Information: Gives denizen affliction: Recklessness
// Works on/against:  Denizens
// Cooldown:          19.00 seconds
// Resource:          18 rage
// Details:
// Pretend to be weak, goading your target into attacking you recklessly for several seconds.
//
export function battleRage(rage: number, force = false): void {
  //
  // Pester     Annoy your target to death.
  // Tame       Charm even the most savage beasts.
  // Bore       Pierce a denizen's shield with your weapon.
  // Skewer     Drive your weapon all the way through your opponent.
  // Swarm      A group of wasps will sting your target.
  // Goad       Taunt your target into reckless attacks.
  //
  if (rage >= 14 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 16_200);
    Battle.rage -= 14;
    Battle.bals.a1 = false;
    ee.emit('user:text', 'PESTER');
    return;
  }

  if (rage >= 25 && Me.level >= 50 && (force || Battle.bals.a5)) {
    setTimeout(() => (Battle.bals.a5 = true), 23_200);
    Battle.rage -= 25;
    Battle.bals.a5 = false;
    ee.emit('user:text', 'SWARM');
    return;
  }

  if (rage >= 36 && (force || Battle.bals.a4)) {
    setTimeout(() => (Battle.bals.a4 = true), 23_200);
    Battle.rage -= 36;
    Battle.bals.a4 = false;
    ee.emit('user:text', 'SKEWER');
    return;
  }

  // I want charm/tame more rarely
  //
  if (rage >= 32 && (force || Battle.bals.a2)) {
    setTimeout(() => (Battle.bals.a2 = true), 50_500);
    Battle.rage -= 32;
    Battle.bals.a2 = false;
    ee.emit('user:text', 'TAME');
    return;
  }

  // I want recklessness/goad more rarely
  //
  if (rage >= 18 && Me.level >= 65 && (force || Battle.bals.a6)) {
    setTimeout(() => (Battle.bals.a6 = true), 25_500);
    Battle.rage -= 18;
    Battle.bals.a6 = false;
    ee.emit('user:text', 'GOAD');
    return;
  }
}
