import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';

function procesRound() {
  /*
   * Run automation on a new round
   */
  const userInput: string = STATE.Custom.input;

  // TODO :: Move into Runewarden/ Pariah/ whatever
  // This is very specific to my 2H Runewarden
  if (STATE.Battle.active && STATE.Battle.target) {
    const tgt = STATE.Battle.tgts[STATE.Battle.tgtID];
    if (tgt && tgt.defs && (tgt.defs.has('shield') || tgt.defs.has('rebounding'))) {
      const wielded = STATE.Me.wieldedL.name.toLowerCase();
      if (wielded.endsWith(' bastard sword')) {
        tgt.defs.delete('shield');
        tgt.defs.delete('rebounding');
        console.log('SHIELD BREAK !! CARVE target defences');
        return ee.emit('user:text', 'CARVE');
      } else if (wielded.endsWith(' maul')) {
        tgt.defs.delete('shield');
        tgt.defs.delete('rebounding');
        console.log('SHIELD BREAK !! SPLINTER target defences');
        return ee.emit('user:text', 'SPLINTER');
      }
    }

    // Alias set kk <...>
    ee.emit('user:text', 'kk');
  }

  // Writhe forever
  else if (STATE.Custom.writhe && userInput === 'www') {
    ee.emit('user:text', 'WRITHE');
  }
}

ee.on('new:round', procesRound);
