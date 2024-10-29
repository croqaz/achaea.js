// deno-lint-ignore-file no-explicit-any
import * as T from '../types.ts';
import { weaponType } from './common.ts';

/*
 * Player class! Myself, yourself.
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
  boundcredits: number = 0; // Bound Credits
  unboundcredits: number = 0; // Unbound Credits
  mayancrowns: number = 0; // Unbound Mayan Crowns
  boundmayancrowns: number = 0; // Bound Mayan Crowns

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
  worn: Record<string, any> = {};
  wielded: Record<string, any> = {};

  charstats: string[] = [];
  afflictions: T.GmcpAffliction[] = [];
  defences: T.GmcpDefence[] = [];
  skills: T.GmcpSkillList = {} as T.GmcpSkillList;

  // Don't change manually
  // these are set in triggers
  // @my_flying = Whether you are currently flying
  flying: boolean = false;
  // True when riding something
  riding: boolean = false;
  // True if your boots have waterWalk
  waterWalk: boolean = false;
  // -----

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
   * Internal function, don't use !
   * Sync a wielded weapon, or a worn item
   * Overwrite whatever items are already there
   */
  syncWieldWorn(item: T.GmcpItem) {
    if (item.attrib) {
      if (item.attrib.includes('l')) {
        item.type = weaponType(item.name);
        // attrib l = wielded_left
        this.wielded.left = item;
      } else if (item.attrib.includes('L')) {
        item.type = weaponType(item.name);
        // attrib L = wielded_right
        this.wielded.right = item;
      } else if (item.wearslot && item.attrib.includes('w')) {
        // attrib w = worn
        this.worn[item.wearslot] = item;
      } else if (item.icon === 'armor' && item.attrib.includes('w')) {
        // wear armor
        this.worn[item.icon] = item;
      } else if (item.attrib.includes('W')) {
        // Remove worn item?
        for (const [slot, worn] of Object.entries(this.worn)) {
          if (item.id === worn.id) {
            delete this.worn[slot];
          }
        }
      }
    } // Unwield left weapon?
    else if (this.wielded.left && !item.attrib && item.id === this.wielded.left.id) {
      delete this.wielded.left;
    } // Unwield right weapon?
    else if (this.wielded.right && !item.attrib && item.id === this.wielded.right.id) {
      delete this.wielded.right;
    }
  }

  /*
   * True, if you are blind.
   * @my_blind in Nexus
   */
  get blind(): boolean {
    return this.defences.some((x) => x.name === 'blindness');
  }

  /*
   * True, if you are deaf.
   * @my_deaf in Nexus
   */
  get deaf(): boolean {
    return this.defences.some((x) => x.name === 'deafness');
  }

  /*
   * If you have the Cloak (tattoo) defence
   * @my_cloak in Nexus
   */
  get cloak(): boolean {
    return this.defences.some((x) => x.name === 'cloak');
  }

  /*
   * True, if you are prone/ fallen.
   * @my_prone in Nexus
   */
  get prone(): boolean {
    return this.afflictions.some((x) => x.name === 'prone');
  }

  /*
   * The current amount of health you're bleeding for.
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
   * Metamorph classes only.
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
   * The current Kaido kai energy.
   * Monk class only.
   * @my_kai in Nexus: What your kai level is at
   * Example: Kai: 10
   */
  get kai(): number {
    for (const cs of this.charstats) {
      if (cs.startsWith('Kai:')) {
        const [, x] = cs.split(': ');
        return parseInt(x);
      }
    }
    return 0;
  }

  /*
   * The current Shindo shin energy.
   * Blademaster class only.
   * Example: Shin: 10
   */
  get shin(): number {
    for (const cs of this.charstats) {
      if (cs.startsWith('Shin:')) {
        const [, x] = cs.split(': ');
        return parseInt(x);
      }
    }
    return 0;
  }

  /*
   * The current TwoArts Stance.
   * Blademaster class only.
   * @my_stance in Nexus: What stance you are currently in (Tekura, TwoArts)
   * Example: Stance: Thyr
   */
  get stance(): string | null {
    for (const cs of this.charstats) {
      if (cs.startsWith('Stance:')) {
        const [, stance] = cs.split(': ');
        if (stance && stance !== 'None') {
          return stance;
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
