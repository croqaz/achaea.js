import ee from '../events/index.ts';

const gold1 = /sovereigns?[ \n\r]+spills?[ \n\r]+from[ \n\r]+the[ \n\r]+corpse\./;
const gold2 = /of[ \n\r]+golden[ \n\r]+sovereigns[ \n\r]+twinkles[ \n\r]+and[ \n\r]+gleams\./;
const gold3 = /There[ \n\r]+.+?[ \n\r]+golden[ \n\r]+sovereigns?[ \n\r]+here\./;

export function handleGold(text: string) {
  /*
   * Auto pick-up gold for free
   * Prosperian Attractor artefact: 200 credits
   */
  if (
    text.includes('drops some golden sovereigns onto the ground.') ||
    gold1.test(text) ||
    gold2.test(text) ||
    gold3.test(text)
  ) {
    ee.emit('user:text', 'QUEUE ADD eb GET GOLD');
  }
}

ee.on('game:text', handleGold);
