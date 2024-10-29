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
  let cls = '';
  switch (type) {
    case 'battleaxe':
      cls = 'ra ra-axe';
      break;
    case 'bastard sword':
      cls = 'ra ra-sword';
      break;
    case 'cleaver':
      cls = 'ra ra-bone-knife';
      break;
    case 'dirk':
      cls = 'ra ra-knife';
      break;
    case 'mace':
      cls = 'ra ra-spiked-mace';
      break;
    case 'shield':
      cls = 'ra ra-shield';
      break;
    case 'spear':
      cls = 'ra ra-spear-head';
      break;
    case 'trident':
      cls = 'ra ra-trident';
      break;
    case 'warhammer':
      cls = 'ra ra-large-hammer';
      break;
    default:
      cls = 'ra ra-crossed-swords';
  }
  return {
    html: `<i class="${cls}" aria-label="${Hand}: ${name}"></i>`,
  };
}

export function wornArmour(): Record<string, string> {
  if (!STATE.Me.worn.armor) {
    return {
      html: '<h5 aria-label="No armour">×</h5>',
    };
  }
  return {
    html: `<i class="ra ra-vest" aria-label="Armour: ${STATE.Me.worn.armor.name}"></i>`,
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

export function pingIcon(): Record<string, string> {
  return {
    html: `<i class="fa-solid fa-signal" aria-label="Response time: ${STATE.Stats.ping.toFixed(2)}μs"></i>`,
  };
}

export function statGoldText(): Record<string, string> {
  return {
    text: `${STATE.Me.gold.toLocaleString('en-US')} 🪙`,
    label: 'Gold in inventory',
  };
}
