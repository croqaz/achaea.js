import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
const { Battle } = STATE;

export function breakShield(name: string | number): string {
  return `TOUCH HAMMER ${name}`;
}

export function rageBreakShield(name: string | number): string {
  return `CRACK ${name}`;
}

//
// Torment (a1)
// Syntax:            ANGEL TORMENT <target>
// Works on/against:  Denizens
// Cooldown:          16.00 seconds
// Resource:          14 rage
// Details:
// Your angel crystalizes its wings and buffets the target with them, causing painful wounds.
// -------------------------------------------------------------------------------
//
// Incense (a2)       (10 levels required)
// Syntax:            ANGEL INCENSE <target>
// Extra Information: Gives denizen affliction: Recklessness
// Works on/against:  Denizens
// Cooldown:          19.00 seconds
// Resource:          18 rage
// Details:
// Your angel absorbs your rage and channels it into your target instead,
// making it impossible for the target to shield itself for several seconds.
// -------------------------------------------------------------------------------
//
// Crack (a3)         (20 levels required)
// Syntax:            CRACK <target>
// Works on/against:  Denizens
// Resource:          17 rage
// Details:
// Expend your rage in a powerful blow with your mace that is able to shatter a denizen's shield.
// -------------------------------------------------------------------------------
//
// Desolation (a4)    (35 levels required)
// Syntax:            PERFORM RITE OF DESOLATION ON <target>
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          36 rage
// Details:
// This rite will torture the unfaithful, causing their very bones to ache.
// The pain will last for several seconds, doing damage to your target for the duration.
// -------------------------------------------------------------------------------
//
// Hammer (a5)        (50 levels required)
// Syntax:            HAMMER <target>
// Extra Information: Uses denizen afflictions: Clumsiness or Amnesia
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          25 rage
// Details:
// Swing your mace in a mighty blow at your target.
// This attack will do significantly increased damage to those who
// are too clumsy to see it coming or forgetful enough to neglect to dodge it.
// -------------------------------------------------------------------------------
//
// Horrify (a6)       (65 levels required)
// Syntax:            PERFORM RITE OF HORRIFY ON <target>
// Extra Information: Gives denizen affliction: Fear
// Works on/against:  Denizens
// Cooldown:          34.00 seconds
// Resource:          29 rage
// Details:
// Summon a rite of terrible visions that causes your target to
// flee uncontrollably for several seconds.
// -------------------------------------------------------------------------------
//
export function battleRage(rage: number, force = false): void {
  //
  // Torment     A vicious attack from your angel.
  // Incense     Order your angel to enrage your opponent.
  // Crack       Shatter a denizen's shield with your mace.
  // Desolation  Punish the faithless with a desolating rite.
  // Hammer      Obliterate your target with an overpowering smash.
  // Horrify     A rite of dire visions that cause your opponent to flee.
  //
  //   ...
}
