import ee from '../events/index.ts';
import * as p from '../parsers.ts';
import { STATE } from '../core/state.ts';
import { Config } from '../extra/config.ts';
import { queueCmd } from '../core/queue.ts';
import { logWrite } from '../logs/index.ts';

export function gatherTriggers(text: string) {
  /*
   * Auto gather, harvest, extract
   * ea = extract all  (Transmutation skill)
   * ha = harvest all  (Harvesting skill)
   * ga = gather all   (Gathering skill)
   * gh = gather & harvest
   */
  const userInput = STATE.Misc.input;
  const env = STATE.Room.environment.toLowerCase();

  if (STATE.Misc.getMinerals && (userInput === '//ea' || userInput === '//ggg')) {
    const goodies = p.parseMinerals(text);
    if (goodies && goodies.extract && STATE.Me.skills.Transmutation) {
      for (const name of goodies.extract) {
        if (Config.EXCLUDE_MINERALS.includes(name)) continue;
        queueCmd('bal', `EXTRACT ${name} && INR ${name}`);
      }
    }
    STATE.Misc.getMinerals = false;
    return;
  }

  if (STATE.Misc.getPlants & userInput.startsWith('//')) {
    const goodies = p.parsePlants(text);
    if (goodies && goodies.harvest && STATE.Me.skills.Harvesting) {
      if (userInput === '//ha' || userInput === '//gh' || userInput === '//ggg') {
        for (const name of goodies.harvest) {
          if (Config.EXCLUDE_HERBS.includes(name)) continue;
          queueCmd('bal', `HARVEST ${name} && INR ${name}`);
        }
      }
    }
    if (goodies && goodies.gather && STATE.Me.skills.Gathering) {
      if (userInput === '//ga' || userInput === '//gh' || userInput === '//ggg') {
        for (const name of goodies.gather) {
          if (Config.EXCLUDE_MATERIAL.includes(name)) continue;
          queueCmd('bal', `GATHER ${name} && INR ${name}`);
        }
        if (env === 'natural underground' && !Config.EXCLUDE_MATERIAL.includes('dust')) {
          queueCmd('bal', 'GATHER dust && INR dust');
        } else if (env === 'river' && !Config.EXCLUDE_MATERIAL.includes('clay')) {
          queueCmd('bal', 'GATHER clay && INR clay');
        }
      }
    }
    STATE.Misc.getPlants = false;
  }
}

// DON'T trigger this in TESTS!
if (process.env.NODE_ENV !== 'test') {
  ee.on('game:text', function () {
    try {
      gatherTriggers.apply(null, arguments);
    } catch (err) {
      const msg = `[SYS] GATHER trigger CRASHED: ${err} !`;
      ee.emit('sys:text', `<i class="c-dim c-red">${msg}</i>`);
      logWrite('\n' + msg + '\n');
    }
  });
}
