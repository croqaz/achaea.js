import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
const { Battle } = STATE;

/*
 * Pariah smash shield/ rebound
 */
export function breakShield(_: string | number): string {
  return 'TRACE FISSURE';
}

export function rageBreakShield(): string {
  return 'ACCURSED SCOUR';
}

// Boil (a1)
// Syntax:            BLOOD BOIL <target>
// Cooldown:          16.00 seconds
// Resource:          14 rage
// Heat the blood of your victim, causing serious damage.
// -------------------------------------------------------------------------------
//
// Feast (a2)
// Syntax:            SWARM FEAST <target>
// Cooldown:          23.00 seconds
// Resource:          36 rage
// Call upon the wild insects to rise up and feast upon the flesh of your
// happless foe, causing extreme damage.
// -------------------------------------------------------------------------------
//
// Symphony (a3)
// Syntax:            SWARM SYMPHONY <target>
// Cooldown:          35.00 seconds
// Resource:          24 rage
// Join your voice with that of the myriad minds that surround you; your
// foe will know fear at the sound of death united.
// -------------------------------------------------------------------------------
//
// Scour (a4)
// Syntax:            ACCURSED SCOUR <target>
// Resource:          17 rage
// Call upon your mastery of the eternal sands, beckoning them forth to
// scour away the magical shield surrounding your foe.
// -------------------------------------------------------------------------------
//
// Spider (a5)
// Syntax:            TRACE SPIDER <target>
// Cooldown:          23.00 seconds
// Resource:          25 rage
// The spider logograph shall leap to a foe and bite them; those that
// suffer from being inhibited or sensitive shall suffer to a much greater
// extent than those who do not.
// -------------------------------------------------------------------------------
//
// Wail (a6)
// Syntax:            ACCURSED WAIL <target>
// Cooldown:          38.00 seconds
// Resource:          32 rage
// Give an enemy a taste of your own doom. They won't be walking that off(*).
// * Gives clumsiness.
//
export function battleRage(rage: number, force = false): void {
  if (rage >= 14 && (force || Battle.bals.a1)) {
    setTimeout(() => (Battle.bals.a1 = true), 16_200);
    Battle.rage -= 14;
    Battle.bals.a1 = false;
    ee.emit('user:text', 'BLOOD BOIL');
    return;
  }

  if (rage >= 25 && (force || Battle.bals.a5)) {
    setTimeout(() => (Battle.bals.a5 = true), 23_200);
    Battle.rage -= 25;
    Battle.bals.a5 = false;
    ee.emit('user:text', 'TRACE SPIDER');
    return;
  }

  if (rage >= 36 && (force || Battle.bals.a2)) {
    setTimeout(() => (Battle.bals.a2 = true), 23_200);
    Battle.rage -= 36;
    Battle.bals.a2 = false;
    ee.emit('user:text', 'SWARM FEAST');
    return;
  }

  // Your foe will know fear and will flee every couple seconds
  if (rage >= 24 && (force || Battle.bals.a3)) {
    setTimeout(() => (Battle.bals.a3 = true), 40_500); // 35s normally
    Battle.rage -= 24;
    Battle.bals.a3 = false;
    ee.emit('user:text', 'SWARM SYMPHONY');
    return;
  }

  // Level 100 required !
  if (rage >= 32 && (force || Battle.bals.a6)) {
    setTimeout(() => (Battle.bals.a6 = true), 38_200);
    Battle.rage -= 32;
    Battle.bals.a6 = false;
    ee.emit('user:text', 'ACCURSED WAIL');
    return;
  }
}
