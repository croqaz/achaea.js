/*
 * Extra features.
 */
import './auto.ts';
import './gold.ts';
import './gather.ts';
import './wares.ts';
import './whois.ts';
import './rooms.ts';
import './triggers.ts';
import './stats.ts';

import ee from '../events/index.ts';
import { Config } from '../config.ts';

try {
  // @ts-ignore: Types
  await import('../../custom/index.ts');
  // console.log('Custom user folder loaded!');
} catch {
  // console.error('Custom user folder not found');
}

ee.once('game:start', () => {
  const { STATE } = require('../core/state.ts');
  const { gmcpTime } = require('../core/gmcp.ts');
  // Call GMCP time every X sec
  // and measure the response time
  setInterval(() => {
    // high-res timestamp in milliseconds
    STATE.Stats.perf = performance.now();
    ee.emit('user:gmcp', gmcpTime());
  }, Config.PING_INTERVAL);
});
