/*
 * Game classes.
 */
import * as blade from './blademaster.ts';
import * as druid from './druid.ts';
import * as jester from './jester.ts';
import * as pariah from './pariah.ts';
import * as priest from './priest.ts';
import * as runeward from './runeward.ts';
import * as sentinel from './sentinel.ts';
import { Config } from '../extra/config.ts';
import { STATE } from '../core/state.ts';
import ee from '../events/index.ts';

export function cls() {
  switch (STATE.Me.class) {
    case '':
    case 'Class':
      return;

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
    case 'Runewarden':
      return runeward;
    case 'Sentinel':
      return sentinel;

    default:
      ee.emit('sys:text', `<i class="c-red">Unknown class: ${STATE.Me.class}!</i>`);
  }
}

function defaultAttack() {
  /*
   * Basic action on new round
   * You should use this as a base to make your own
   */
  ee.emit('user:text', typeof Config.ATTACK === 'string' ? Config.ATTACK : 'kill');
}
