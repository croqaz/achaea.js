import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';
import { logWrite } from '../logs/index.ts';
const Stats = STATE.Stats;

function emitMsg(m) {
  console.log(m);
  ee.emit('sys:text', `<b>${m}</b>`);
  logWrite('\n' + m);
}

// Run only once
ee.once('game:start', function () {
  setTimeout(() => {
    // startup gold values
    Stats.gold = STATE.Me.gold;
    Stats.bank = STATE.Me.bank;
  }, 250);
});

// Run only once
ee.once('game:quit', function () {
  // Session play time in minutes
  if (!Stats.endDt) return;
  const playTime = (Stats.endDt.getTime() - Stats.begDt.getTime()) / 1000 / 60;
  let msg = '';

  if (playTime > 1) {
    emitMsg(`You played for ${Math.round(playTime)} minutes.`);

    if (Stats.kills > 1) {
      emitMsg(`You did ${Stats.kills} kills, ${(Stats.kills / playTime).toFixed(1)} kills/min.`);
    }

    const diff1 = STATE.Me.gold - Stats.gold;
    if (diff1) emitMsg(`Gold difference: ${(diff1 < 0 ? '' : '+') + diff1} gc.`);
    const diff2 = STATE.Me.bank - Stats.bank;
    if (diff2) emitMsg(`Bank difference: ${(diff2 < 0 ? '' : '+') + diff2} gc.`);
  }
});
