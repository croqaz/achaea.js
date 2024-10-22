// deno-lint-ignore-file no-explicit-any

import * as T from '../types.ts';

/*
 * Player! Myself, yourself.
 *
 * Compared to Nexus variables:
 * https://nexus.ironrealms.com/Predefined_variables
 */
export class Player {
  name: string = '';
  class: string = '';
  race: string = '';
  gender: string = '';
  level: number = 5;
  xp: string = '0%'; // @my_nl = Your XP percentage to next level
  city: string = '';
  house: string = '';
  gold: number = 0; // gold in packs
  bank: number = 0; // gold in banks

  hp: number = 0; // @my_hp = Your current health
  oldhp: number = 0; // use it to calculate diff between old and new values
  maxhp: number = 0; // @my_maxhp = Your maximum health points
  mp: number = 0; // @my_mp = Your current mana points
  oldmp: number = 0;
  maxmp: number = 0; // @my_maxmp = Your maximum mana points
  ep: number = 0; // @my_ep 	Your current endurance points
  maxep: number = 0; // @my_maxep = Your maximum endurance points
  wp: number = 0; // @my_wp = Your current willpower points
  maxwp: number = 0; // @my_maxwp = Your maximum willpower points

  bal: boolean = false; // @my_bal = If you currently have balance
  eq: boolean = false; // @my_eq = If you currently have equilibrium
  eb: boolean = false; // balance + equilibrium

  rift: T.GmcpItem[] = [];
  items: T.GmcpItem[] = [];
  wieldedL: T.GmcpItem = {} as T.GmcpItem;
  wieldedR: T.GmcpItem = {} as T.GmcpItem;

  charstats: string[] = [];
  afflictions: T.GmcpAffliction[] = [];
  defences: T.GmcpDefence[] = [];
  skills: T.GmcpSkillList = {} as T.GmcpSkillList;

  constructor(args: Record<string, any>) {
    this.update(args);
  }

  update(args: Record<string, any>): void {
    for (const k of Object.keys(args)) {
      // Ignore inexistent fields
      if (this[k] === undefined) {
        continue;
      }
      this[k] = args[k];
    }
  }

  /*
   * The current amount of health you're bleeding for
   * @my_bleed in Nexus
   */
  get bleed(): number {
    for (const cs of this.charstats) {
      if (cs.startsWith('Bleed:')) {
        const [, x] = cs.split(': ');
        return parseInt(x);
      }
    }
    return 0;
  }

  /*
   * The current Angel power.
   * Priest class only.
   */
  get angelpower(): number {
    for (const cs of this.charstats) {
      if (cs.startsWith('Angelpower:')) {
        const [, x] = cs.split(': ');
        return parseInt(x);
      }
    }
    return 0;
  }

  /*
   * The current Devotional essence.
   * Priest and Paladin classes only.
   * @my_devotion in Nexus: Remaining devotion percent (Devotion)
   * Example: Devotion: 59%
   */
  get devotion(): string | null {
    for (const cs of this.charstats) {
      if (cs.startsWith('Devotion:')) {
        const [, x] = cs.split(': ');
        return x;
      }
    }
    return null;
  }

  /*
   * The current Life essence.
   * Necromancy classes only.
   * @my_essence in Nexus: Remaining life essence percent (Necromancy)
   * Example: Essence: 59%
   */
  get essence(): string | null {
    for (const cs of this.charstats) {
      if (cs.startsWith('Essence:')) {
        const [, x] = cs.split(': ');
        return x;
      }
    }
    return null;
  }

  /*
   * The current Animal spirit.
   * Metamporh classes only.
   */
  get morph(): string | null {
    for (const cs of this.charstats) {
      if (cs.startsWith('Morph:')) {
        const [, morph] = cs.split(': ');
        if (morph && morph !== 'None') {
          return morph;
        }
      }
    }
    return null;
  }

  /*
   * The current Grove sunlight.
   * Druid and Sylvan classes only.
   * Example: Sunlight: 5950
   */
  get sunlight(): number {
    for (const cs of this.charstats) {
      if (cs.startsWith('Sunlight:')) {
        const [, x] = cs.split(': ');
        return parseInt(x);
      }
    }
    return 0;
  }
}
