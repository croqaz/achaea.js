import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
const { Battle } = STATE;

export function breakShield(name: string | number): string {
  return `RAZE ${name}`;
}

export function rageBreakShield(): string {
  return 'SHIN SHATTER';
}

/*
Leapstrike (a1)
Syntax:            LEAPSTRIKE <target>
Works on/against:  Denizens
Cooldown:          16.00 seconds
Resource:          14 rage
Details:
Fire a blast of Shin energy at the ground below you, using it to propel you high in the air.
On your way down, strike your target with one knee, focusing all of your weight and downward energy in one devastating blow.
-------------------------------------------------------------------------------

Daze (a2)          (10 levels required)
Syntax:            SHIN DAZE <target>
Extra Information: Gives denizen affliction: Stun
Works on/against:  Denizens
Cooldown:          33.00 seconds
Resource:          26 rage
Details:
Hurl a precise blast of Shin energy at the eyes of your target, stunning it for several seconds.
-------------------------------------------------------------------------------

Shatter (a3)       (20 levels required)
-------------------------------------------------------------------------------
Syntax:            SHIN SHATTER <target>
Works on/against:  Denizens
Resource:          17 rage
Details:
Use your rage and channel it as a blast of Shin energy at a denizen that can shatter shields.
-------------------------------------------------------------------------------

Spinslash (a4)     (35 levels required)
Syntax:            SPINSLASH <target>
Works on/against:  Denizens
Cooldown:          23.00 seconds
Resource:          36 rage
Details:
Spin in a tight circle, expending your stored rage to deliver a series of slashes to a denizen.
-------------------------------------------------------------------------------

Headstrike (a5)    (50 levels required)
Syntax:            STRIKE <target> HEAD
Extra Information: Uses denizen afflictions: Recklessness or Fear
Works on/against:  Denizens
Cooldown:          23.00 seconds
Resource:          25 rage
Details:
Deliver a precise strike to the head of a flailing denizen,
doing increased damage to those who are reckless or fleeing in terror.
-------------------------------------------------------------------------------

Nerveslash (a6)    (65 levels required)
Syntax:            NERVESLASH|NSL <target>
Extra Information: Gives denizen affliction: Weakness
Works on/against:  Denizens
Cooldown:          31.00 seconds
Resource:          22 rage
Details:
With a series of precise strikes against the nerve centers of your target,
you are able to weaken its limbs, decreasing the amount of damage it does for several seconds.
-------------------------------------------------------------------------------
*/
export function battleRage(rage: number, force = false): void {
  //
  // Leapstrike  Destroy your enemy on your way down.
  // Daze        Stun your victim with Shin energy.
  // Shatter     Shin energy shatters a denizen's shield.
  // Spinslash   Strike your target repeatedly while spinning.
  // Headstrike  Slip through their defences and strike.
  // Nerveslash  Weaken your target's attacks by deadening their nerves.
  //
  if (rage >= 14 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 16_200);
    Battle.rage -= 14;
    Battle.bals.a1 = false;
    ee.emit('user:text', 'LEAPSTRIKE');
    return;
  }

  if (rage >= 26 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 33_200);
    Battle.rage -= 26;
    Battle.bals.a1 = false;
    ee.emit('user:text', 'SHIN DAZE');
    return;
  }
}
