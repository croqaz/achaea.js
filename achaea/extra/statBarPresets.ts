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
      cls = 'ra ra-bone-knife flipY';
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
      cls = 'ra ra-spear-head flipY';
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
  const m = STATE.Me.morph;
  let cls = '';
  let txt = '';
  switch (m) {
    case 'Basilisk':
      cls = 'ra ra-sea-serpent';
      break;
    case 'Hydra':
      cls = 'ra ra-hydra';
      break;
    case 'Wyvern':
      cls = 'ra ra-wyvern';
      break;
    case 'Bear':
      cls = 'ra ra-pawprint';
      break;
    case 'Wolf':
      cls = 'ra ra-wolf-head';
      break;
    default:
      txt = m.slice(0, 3);
  }
  return {
    html: `<i class="${cls}" aria-label="Morph: ${m}">${txt}</i>`,
  };
}

export function pingIcon(): Record<string, string> {
  const ping = STATE.Stats.ping;
  const avg = ping.reduce((a, b) => a + b) / ping.length;
  const label = `Response time: ${ping.at(-1)!.toFixed(2)}μs; Average: ${avg.toFixed(2)}μs`;
  return {
    html: `<i class="fa-solid fa-signal" aria-label="${label}"></i>`,
  };
}

export function statGoldText(): Record<string, string> {
  let gold = STATE.Me.gold;
  if (gold > 100_000) {
    gold = Math.round(gold / 1000) + 'k';
  } else {
    gold = gold.toLocaleString('en-US');
  }
  return {
    text: `${gold} 🪙`,
    label: `${STATE.Me.gold.toLocaleString('en-US')} Gold in inventory`,
  };
}
