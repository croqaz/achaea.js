import ee from '../events.js';

/*
 * X drops some golden sovereigns onto the ground.
 * A few golden sovereigns spill from the corpse.
 * A couple of golden sovereigns spill from the corpse.
 * A tiny pile of sovereigns spills from the corpse.
 * A pile of golden sovereigns twinkles and gleams.
 * There is a small pile of golden sovereigns here.
 * There are X golden sovereigns here.
 * There is one golden sovereign here.
 */

// auto pick-up gold
export function handleGold(text) {
  if (
    text.includes('drops some golden sovereigns onto the ground.') ||
    text.includes('golden sovereigns twinkles and gleams.') ||
    text.includes('sovereigns spill from the corpse.') ||
    (text.includes('There ') && text.includes(' golden sovereigns here.'))
  ) {
    ee.emit('user:text', 'get gold');
  }
}

ee.on('game:text', handleGold);
