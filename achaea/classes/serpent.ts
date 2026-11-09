import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
// const { Battle, Me } = STATE;

/*
 * Serpent hunting attack.
 */
export function attack(start = false): string | void {
  return 'GARROTE';
}

export function breakShield(name: string | number): string {
  return `FLAY ${name}`;
}

export function rageBreakShield(name: string | number): string {
  return `EXCORIATE ${name}`;
}

/*
Thrash (a1)
Syntax:            THRASH <target>
Works on/against:  Denizens
Cooldown:          16.00 seconds
Resource:          14 rage
Details:
Expend your rage to whip the target bloody, causing intense damage.
-------------------------------------------------------------------------------

Flagellate (a2)    (10 levels required)
Syntax:            FLAGELLATE <target>
Extra Information: Gives denizen affliction: Sensitivity
Works on/against:  Denizens
Cooldown:          27.00 seconds
Resource:          25 rage
Details:
Sting your target's nerves with a series of light whip cracks, causing the target
to suffer from sensitivity for a few seconds.
-------------------------------------------------------------------------------

Excoriate (a3)     (20 levels required)
Syntax:            EXCORIATE <target>
Works on/against:  Denizens
Resource:          17 rage
Details:
Expend your rage in a savage attack, using your whip to remove a denizen's shield.
-------------------------------------------------------------------------------

Throatrip (a4)     (35 levels required)
Syntax:            THROATRIP <target>
Works on/against:  Denizens
Cooldown:          23.00 seconds
Resource:          36 rage
Details:
Use your fangs in a display of sheer viciousness and rage as you rip your target's throat out.
-------------------------------------------------------------------------------

Snare (a5)         (50 levels required)
Syntax:            SNARE <target>
Extra Information: Uses denizen afflictions: Recklessness or Inhibit
Works on/against:  Denizens
Cooldown:          23.00 seconds
Resource:          25 rage
Details:
Trip unsuspecting victims into your whip and strangle them, doing significantly
increased damage to targets that are reckless or are not able to easily heal.
-------------------------------------------------------------------------------

Obliviate (a6)     (65 levels required)
Syntax:            OBLIVIATE <target>
Extra Information: Gives denizen affliction: Amnesia
Works on/against:  Denizens
Cooldown:          41.00 seconds
Resource:          28 rage
Details:
Use a minor hypnosis technique to cause your target to forget what it was doing,
giving it amnesia for a few seconds.
-------------------------------------------------------------------------------

Provoke (a7)       (100 levels required)
Syntax:            PROVOKE <target>
Cooldown:          20.00 seconds
Resource:          32 rage
Details:
Let out a fierce bellow to provoke a denizen, forcing it to focus its
attacks on you for a short duration.
Note: This ability consumes 2.5s of both balance and equilibrium, while
also requiring you to be on both balance and equilibrium in addition to
your arms and legs being whole, not being paralysed, and not being tied.
-------------------------------------------------------------------------------
*/
export function battleRage(rage: number, force = false): void {
  //
  // Thrash        Use your whip to open painful, bloody wounds.
  // Flagellate    Sensitize your target's nerves.
  // Excoriate     Use your rage to flay a denizen's shield.
  // Throatrip     Go for the jugular.
  // Snare         Trap your target in a tight grip.
  // Obliviate     Induce forgetfulness in your target.
  // Provoke       I challenge thee!
  //
}
