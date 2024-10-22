import * as druid from './druid.ts';
import * as jester from './jester.ts';
import * as pariah from './pariah.ts';
import * as priest from './priest.ts';
import * as runeward from './runeward.ts';
import * as sentinel from './sentinel.ts';
import { STATE } from '../core/state.ts';
import ee from '../events/index.ts';

export function cls() {
  if (!STATE.Me.class || STATE.Me.class === 'Class') return;
  else if (STATE.Me.class === 'Druid') return druid;
  else if (STATE.Me.class === 'Jester') return jester;
  else if (STATE.Me.class === 'Pariah') return pariah;
  else if (STATE.Me.class === 'Priest') return priest;
  else if (STATE.Me.class === 'Runewarden') return runeward;
  else if (STATE.Me.class === 'Sentinel') return sentinel;
  ee.emit('sys:text', `<i class="c-red">Unknown class: ${STATE.Me.class}!</i>`);
}
