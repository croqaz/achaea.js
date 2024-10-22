import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
import { weaponType } from '../core/common.ts';
const { Battle } = STATE;

/*
 * Break shield skill
 * Requires bastard or hammer
 */
export function breakShield(name: string | number): string | void {
  const wpnType = weaponType(STATE.Me.wieldedL.name || '');
  if (!wpnType) return;
  if (wpnType === 'bastard sword') {
    // Required: Bastard Sword
    return `CARVE ${name}`;
  } else if (wpnType === 'warhammer') {
    // Required: Warhammer
    return `SPLINTER ${name}`;
  }
}

export function rageBreakShield(): string {
  return 'FRAGMENT';
}

//
// Collide (a1)
// Syntax:            COLLIDE <target>
// Works on/against:  Denizens
// Cooldown:          16.00 seconds
// Resource:          14 rage
// Details:
// Charge your target, crashing into it with the full weight of your armoured form, doing significant damage.
// -------------------------------------------------------------------------------
//
// Bulwark (a2)
// Syntax:            BULWARK
// Works on/against:  Self
// Cooldown:          45.00 seconds
// Resource:          28 rage
// Details:
// This ability allows you to empower the runes on a suit of runic armour, allowing it to negate 25% of all damage taken
// for the next 15 seconds.
// -------------------------------------------------------------------------------
//
// Fragment (a3)
// Syntax:            FRAGMENT <target>
// Works on/against:  Denizens
// Resource:          17 rage
// Details:
// Carve a rune in a denizen's shield, shattering it into fragments.
// -------------------------------------------------------------------------------
//
// Onslaught (a4)
// Syntax:            ONSLAUGHT <target>
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          36 rage
// Details:
// Repeatedly pound your target with your weapon.
// -------------------------------------------------------------------------------
//
// Etch (a5)
// Syntax:            ETCH RUNE AT <target>
// Extra Information: Uses denizen afflictions: Aeon or Stun
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          25 rage
// Details:
// Draw the outline of a rune in the air with your weapon, sending the rune crashing into your opponent,
// doing extra damage if the target is unable to dodge the attack because of aeon or stun.
// -------------------------------------------------------------------------------
//
// Safeguard (a6)
// Syntax:            SAFEGUARD <target>
// Works on/against:  Adventurers
// Cooldown:          57.00 seconds
// Resource:          35 rage
// Details:
// Protects a target with a shimmering rune that absorbs 40% of the target's health in damage.
// Fades in 10 seconds.
// -------------------------------------------------------------------------------
//
export function battleRage(rage: number, force = false): void {
  if (rage >= 14 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 16_200);
    ee.emit('user:text', 'COLLIDE');
    Battle.bals.a1 = false;
    Battle.rage -= 14;
    return;
  }

  if (rage >= 28 && (force || Battle.bals.a2)) {
    setTimeout(() => (Battle.bals.a2 = true), 45_200);
    ee.emit('user:text', 'BULWARK');
    Battle.bals.a2 = false;
    Battle.rage -= 28;
    return;
  }

  if (rage >= 36 && (force || Battle.bals.a4)) {
    setTimeout(() => (Battle.bals.a4 = true), 23_200);
    ee.emit('user:text', 'ONSLAUGHT');
    Battle.bals.a4 = false;
    Battle.rage -= 36;
    return;
  }

  if (rage >= 25 && Battle.tgtID && (force || Battle.bals.a5)) {
    setTimeout(() => (Battle.bals.a5 = true), 23_200);
    ee.emit('user:text', `ETCH RUNE AT ${Battle.tgtID}`);
    Battle.bals.a5 = false;
    Battle.rage -= 25;
    return;
  }
}
