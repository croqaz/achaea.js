import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';

export function queueClear() {
  for (const name of Object.keys(STATE.Queue)) {
    STATE.Queue[name] = [];
  }
}

/*
 * Example:
 * queueCmd('bal', 'DO SOMETHING ON BALANCE')
 * queueCmd('eq', 'DO SOMETHING ON EQUILIBRIUM')
 * queueCmd('eb', 'DO SOMETHING WITH BAL & EQ')
 */
export function queueCmd(name: string, cmd: string) {
  if (STATE.Queue[name] && typeof STATE.Me[name] === 'boolean') {
    STATE.Queue[name].push(cmd);
  } else {
    console.error(`Cannot queue command! Invalid queue name: ${name}!`);
  }
}

let intID = setInterval(function () {
  // Consume from all the queues, in order
  for (const [name, queue] of Object.entries(STATE.Queue)) {
    if (queue.length && STATE.Me[name] === true) {
      STATE.Me[name] = false;
      ee.emit('user:text', queue.shift());
      continue;
    }
  }
}, 100);

// Make sure to shut down cleanly
ee.on('will:quit', function () {
  if (intID) clearInterval(intID);
  intID = null;
});
