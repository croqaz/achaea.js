import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
const { Battle } = STATE;

/*
 * Break shield skill.
 */
export function breakShield(name: string | number): string {
  return `TOUCH HAMMER ${name}`;
}

export function rageBreakShield(name: string | number): string {
  return `THROW JACKS AT ${name}`;
}

//
// Noogie (a1)
// Syntax:            NOOGIE <target>
// Works on/against:  Denizens
// Cooldown:          16.00 seconds
// Resource:          14 rage
// Details:
// Wrap your opponent in a headlock and try to start a fire on its scalp with your knuckles.
//
// -------------------------------------------------------------------------------
// Dustthrow (a2)
// Syntax:            DUSTTHROW <target>
// Extra Information: Gives denizen affliction: Inhibit
// Works on/against:  Denizens
// Cooldown:          25.00 seconds
// Resource:          18 rage
// Details:
// Throw a pinch of diamond dust into a target's face.
// The uncontrollable coughing and heaving will make regaining health very difficult for a short time.
// -------------------------------------------------------------------------------
//
// Jacks (a3)
// Syntax:            THROW JACKS AT <target>
// Works on/against:  Denizens
// Resource:          17 rage
// Details:
// These typical toys for children have had their spines sharpened.
// When thrown at a denizen's shield, the sharpened spines can shred the shield and render it ineffective.
// -------------------------------------------------------------------------------
//
// Ensconce (a4)
// Syntax:            ENSCONCE FIRECRACKER ON <target>
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          36 rage
// Details:
// Secretly place a firecracker on your opponent's person.
// The reaction will be priceless. And probably painful.
// -------------------------------------------------------------------------------
//
// Befuddle (a5)
// Syntax:            BEFUDDLE <target>
// Extra Information: Uses denizen afflictions: Aeon or Amnesia
// Works on/against:  Denizens
// Cooldown:          23.00 seconds
// Resource:          25 rage
// Details:
// Use your incredible wit to overwhelm the intellect of one who is slowed through time or forgetful.
// Cackle as the resulting aneurysm causes great pain in your opponent.
// -------------------------------------------------------------------------------
//
// Rap (a6)
// Syntax:            RAP <target>
// Extra Information: Gives denizen affliction: Stun
// Works on/against:  Denizens
// Cooldown:          33.00 seconds
// Resource:          26 rage
// Details:
// Hit an opponent in the back of the head with a blackjack, stunning it briefly.
// -------------------------------------------------------------------------------
//
export function battleRage(rage: number, force = false): void {
  //
  // Noogie     As painful as it is humiliating.
  // Dustthrow  That stuff will make them cough for days.
  // Jacks      Small toys that can pierce denizen shields.
  // Ensconce   Shock and awe!
  // Befuddle   Show that you're always the smartest person in the room.
  // Rap        They'll never see it coming.
  //
  if (rage >= 14 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 16_200);
    Battle.rage -= 14;
    Battle.bals.a1 = false;
    ee.emit('user:text', 'NOOGIE');
    return;
  }

  if (rage >= 18 && (force || Battle.bals.a2)) {
    setTimeout(() => (Battle.bals.a2 = true), 25_200);
    Battle.rage -= 18;
    Battle.bals.a2 = false;
    ee.emit('user:text', 'DUSTTHROW');
    return;
  }

  if (rage >= 36 && (force || Battle.bals.a4)) {
    setTimeout(() => (Battle.bals.a4 = true), 23_200);
    Battle.rage -= 36;
    Battle.bals.a4 = false;
    ee.emit('user:text', `ENSCONCE FIRECRACKER ON ${Battle.tgtID}`);
    return;
  }

  //
  // Befuddle and Rap are afflict abilities,
  // and I want to use them more rarely
  //

  // 25 rage normally
  if (rage >= 35 && (force || Battle.bals.a5)) {
    setTimeout(() => (Battle.bals.a5 = true), 30_500); // 23s normally
    Battle.rage -= 25;
    Battle.bals.a5 = false;
    ee.emit('user:text', 'BEFUDDLE');
    return;
  }

  // 26 rage normally
  if (rage >= 36 && (force || Battle.bals.a6)) {
    setTimeout(() => (Battle.bals.a6 = true), 40_500); // 33s normally
    Battle.rage -= 26;
    Battle.bals.a6 = false;
    ee.emit('user:text', 'RAP');
    return;
  }
}
