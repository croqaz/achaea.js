/*
 * Game classes.
 */
import ee from '../events/index.ts';
import * as serpent from './serpent.ts';
import * as sentinel from './sentinel.ts';
import * as runeward from './runeward.ts';
import * as psion from './psion.ts';
import * as priest from './priest.ts';
import * as pariah from './pariah.ts';
import * as jester from './jester.ts';
import * as druid from './druid.ts';
import * as blade from './blademaster.ts';
import * as alchemist from './alchemist.ts';
import { STATE } from '../core/state.ts';
import { i } from '../html.ts';

export function cls() {
  switch (STATE.Me.class) {
    case '':
    case 'Class':
      return;

    case 'Alchemist':
      return alchemist;
    case 'Blademaster':
      return blade;
    case 'Druid':
      return druid;
    case 'Jester':
      return jester;
    case 'Pariah':
      return pariah;
    case 'Priest':
      return priest;
    case 'Psion':
      return psion;
    case 'Runewarden':
      return runeward;
    case 'Sentinel':
      return sentinel;
    case 'Serpent':
      return serpent;

    default:
      ee.emit('sys:text', i.red(`CLS: unknown class: ${STATE.Me.class}!`));
  }
}

/*
 * Multi-class PVE hunting attack.
 */
export function attack(start = false): void {
  const x = cls();
  if (x) ee.emit('user:text', 'QUEUE ADD bu!p!t!w ' + x.attack(start));
}

/*
 * The hunting attack again, replacing any attack still in that queue (ADDCLEAR, HELP QUEUEING):
 * after an attack rebounded off a shield (it used the equilibrium, not the balance, so no balance
 * comes back to drive the next one), or when nothing landed for a while. Never two attacks queued.
 */
export function attackAgain(): void {
  const x = cls();
  if (x) ee.emit('user:text', 'QUEUE ADDCLEAR bu!p!t!w ' + x.attack(false));
}

/*
 * Multi-class ability smash shield!
 */
export function breakShield(name: string | number): string | void {
  const x = cls();
  if (x) return x.breakShield(name);
}

/*
 * Multi-class battle-rage break shield!
 * Resource: 17 rage (no cooldown)
 */
export function rageBreakShield(name: string | number): string | void {
  const x = cls();
  if (x) return x.rageBreakShield(name);
}

/*
 * Multi-class battle rage attack!
 */
export function battleRage(rage: number, force = false): void {
  const x = cls();
  if (x) return x.battleRage(rage, force);
}
