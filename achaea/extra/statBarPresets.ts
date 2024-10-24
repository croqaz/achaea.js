import * as R from 'remeda';
import { STATE } from '../core/state.ts';

/*
 * wieldedIcon('left')
 * wieldedIcon('right')
 */
export function wieldedIcon(hand: string): Record<string, string> {
  const Hand = R.capitalize(hand);
  if (!STATE.Me.wielded[hand]) {
    return {
      html: `<h5 aria-label="${Hand}: fist">👊</h5>`,
    };
  }
  const { name, type } = STATE.Me.wielded[hand];
  const text = type === 'shield' ? '🛡️' : '⚔️';
  return {
    text,
    label: `${Hand}: ${name}`,
  };
}

export function wornArmour(): Record<string, string> {
  if (!STATE.Me.worn.armor) {
    return {
      html: '<h5 aria-label="No armour">×</h5>',
    };
  }
  return {
    text: STATE.Me.worn.armor.name[0],
    label: `Armour: ${STATE.Me.worn.armor.name}`,
  };
}

export function metaAnimal(): Record<string, string> {
  if (!STATE.Me.morph) {
    return {
      html: '<h5 aria-label="Not morphed">H</h5>',
    };
  }
  return {
    text: STATE.Me.morph[0],
    label: `Morph: ${STATE.Me.morph}`,
  };
}
