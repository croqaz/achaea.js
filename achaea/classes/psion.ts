import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
const { Battle, Me } = STATE;

export function breakShield(name: string | number): string {
  return `PSI SPLINTER ${name}`;
}

export function rageBreakShield(name: string | number): string {
  return `WEAVE PULVERISE ${name}`;
}

/*
Barbedblade (a1)
Syntax:            WEAVE BARBEDBLADE <target>
Cooldown:          16.00 seconds
Resource:          14 rage
Details:
Weave a viciously barbed blade into being, and open bleeding wounds on your target.
They shall suffer periodic damage until the wounds heal.
-------------------------------------------------------------------------------

Devastate (a2)     (10 levels required)
Syntax:            PSI DEVASTATE <target>
Cooldown:          23.00 seconds
Resource:          36 rage
Details:
Strike out against the mind of your foe, causing damage.
-------------------------------------------------------------------------------

Regrowth (a3)      (20 levels required)
Syntax:            ENACT REGROWTH <target>
Cooldown:          35.00 seconds
Resource:          24 rage
Details:
The lost seed of Yggdrasil's powers are myriad and varied. With this
attempted replication, you may call forth the binding vines to grasp
your foe, preventing them from being able to heal.
-------------------------------------------------------------------------------

Pulverise (a4)     (35 levels required)
Syntax:            WEAVE PULVERISE <target>
Resource:          17 rage
Details:
Weave a warhammer into being and shatter any
magical shield your foe may cower behind.
-------------------------------------------------------------------------------

Whirlwind (a5)     (50 levels required)
Syntax:            WEAVE WHIRLWIND <target>
Cooldown:          23.00 seconds
Resource:          25 rage
Details:
Will blades into being and deliver a terrible onslaught against
your foe, causing massive damage.
-------------------------------------------------------------------------------

Terror (a6)        (65 levels required)
Syntax:            PSI TERROR <target>
Cooldown:          38.00 seconds
Resource:          32 rage
Details:
With a simple application of psionic might instill a sense of abject
terror in your foe, giving them the fear affliction.
-------------------------------------------------------------------------------
*/
export function battleRage(rage: number, force = false): void {
  //
  // Barbedblade  Imperfection for a purpose.
  // Devastate    The mind is a fragile thing.
  // Regrowth     Life shall be denied them.
  // Pulverise    Respite shall not be granted.
  // Whirlwind    Destroy them with your onslaught.
  // Terror       Fear is their enemy.
  //
  if (rage >= 14 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 16_200);
    Battle.rage -= 14;
    Battle.bals.a1 = false;
    ee.emit('user:text', 'WEAVE BARBEDBLADE');
    return;
  }

  // if (rage >= 36 && (force || Battle.bals.a2)) {
  //   setTimeout(() => (Battle.bals.a2 = true), 23_200);
  //   Battle.rage -= 36;
  //   Battle.bals.a2 = false;
  //   ee.emit('user:text', 'PSI DEVASTATE');
  //   return;
  // }
}
