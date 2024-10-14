import ee from '../events/index.ts';
import { queueCmd } from '../core/queue.ts';

export function millInks(nr: number, ink: string) {
  let steps = 2;
  if (ink === 'r' || ink === 'red') {
    // 1 x red, 1 x common
    ee.emit('user:text', `OUTR ${nr} CLAY && OUTR ${nr} SCALES`);
    queueCmd('eb', `PUT ${nr} CLAY IN MILL`);
    queueCmd('eb', `PUT ${nr} SCALES IN MILL`);
    queueCmd('eb', `MILL FOR ${nr} RED`);
  } else if (ink === 'b' || ink === 'blue') {
    // 1 x blue, 1 x uncommon
    ee.emit('user:text', `OUTR ${nr} LUMIC && OUTR ${nr} HORN`);
    queueCmd('eb', `PUT ${nr} LUMIC IN MILL`);
    queueCmd('eb', `PUT ${nr} HORN IN MILL`);
    queueCmd('eb', `MILL FOR ${nr} BLUE`);
  } else if (ink === 'y' || ink === 'yellow') {
    // 1 x yellow, 1 x scarce
    ee.emit('user:text', `OUTR ${nr} YELLOWCHITIN && OUTR ${nr} SHARKTOOTH`);
    queueCmd('eb', `PUT ${nr} YELLOWCHITIN IN MILL`);
    queueCmd('eb', `QUEUE ADD b PUT ${nr} SHARKTOOTH IN MILL`);
    queueCmd('eb', `QUEUE ADD b MILL FOR ${nr} YELLOW`);
  } else if (ink === 'g' || ink === 'green') {
    // 2 x blue, 1 x yellow, 2 x uncommon, 1 x scarce
    steps = 4;
    ee.emit('user:text', `OUTR ${nr * 2} LUMIC && OUTR ${nr} YELLOWCHITIN`);
    queueCmd('eb', `OUTR ${nr * 2} HORN && OUTR ${nr} SHARKTOOTH`);
    queueCmd('eb', `PUT ${nr} YELLOWCHITIN IN MILL`);
    queueCmd('eb', `QUEUE ADD b PUT ${nr} SHARKTOOTH IN MILL`);
    queueCmd('eb', `QUEUE ADD b PUT ${nr * 2} LUMIC IN MILL`);
    queueCmd('eb', `QUEUE ADD b PUT ${nr * 2} HORN IN MILL`);
    setTimeout(() => {
      queueCmd('eb', `MILL FOR ${nr} GREEN`);
    }, steps * 1000);
  } else if (ink === 'p' || ink === 'purple') {
    // 2 x red, 2 x blue, 2 x common, 2 x uncommon, 1 x rare
    steps = 5;
    ee.emit('user:text', `OUTR ${nr * 2} CLAY && OUTR ${nr * 2} LUMIC && OUTR ${nr * 2} SCALES`);
    ee.emit('user:text', `OUTR ${nr * 2} HORN && OUTR ${nr} TONGUE`);
    ee.emit('user:text', `PUT ${nr} TONGUE IN MILL`);
    ee.emit('user:text', `PUT ${nr * 2} CLAY IN MILL`);
    ee.emit('user:text', `QUEUE ADD b PUT ${nr * 2} LUMIC IN MILL`);
    ee.emit('user:text', `QUEUE ADD b PUT ${nr * 2} SCALES IN MILL`);
    ee.emit('user:text', `QUEUE ADD b PUT ${nr * 2} HORN IN MILL`);
    setTimeout(() => {
      ee.emit('user:text', `MILL FOR ${nr} PURPLE`);
    }, steps * 1000);
  } else if (ink === 'o' || ink === 'gold') {
    // 1 x gold, 2 x common, 2 x uncommon, 2 x scarce, 1 x rare
    steps = 5;
    ee.emit('user:text', `OUTR ${nr} GOLDFLAKES && OUTR ${nr * 2} SCALES && OUTR ${nr * 2} HORN`);
    ee.emit('user:text', `OUTR ${nr * 2} SHARKTOOTH && OUTR ${nr} TONGUE`);
    ee.emit('user:text', `PUT ${nr} GOLDFLAKES IN MILL`);
    ee.emit('user:text', `PUT ${nr} TONGUE IN MILL`);
    ee.emit('user:text', `QUEUE ADD b PUT ${nr * 2} SCALES IN MILL`);
    ee.emit('user:text', `QUEUE ADD b PUT ${nr * 2} HORN IN MILL`);
    ee.emit('user:text', `QUEUE ADD b PUT ${nr * 2} SHARKTOOTH IN MILL`);
    setTimeout(() => {
      ee.emit('user:text', `MILL FOR ${nr} GOLD`);
    }, steps * 1000);
  } else {
    ee.emit('sys:text', '<i class="c-red"><b>[Mill]</b>: Not sure what ink to prepare!</i>');
    return;
  }

  setTimeout(
    () => {
      ee.emit('user:text', `QUEUE ADD b GET ${nr * 2} INK FROM MILL`);
    },
    (steps + 2) * 1000,
  );
}
