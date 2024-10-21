export interface StateType {
  Me: StateMe;
  Room: StateRoom;
  Battle: StateBattle;
  Time: StateTime;
  Stats: StateStats;
  Misc: Record<string, any>;
  Icons: Record<string, any>;
  Custom: Record<string, any>;
  Queue: Record<string, string[]>;
}

/*
 * Compared with Nexus variables:
 * https://nexus.ironrealms.com/Predefined_variables
 */
export interface StateMe {
  name: string;
  race: string;
  gender: string;
  level: number;
  xp: string; // @my_nl = Your experience percentage to next level, eg: 23%
  class: string;
  city: string;
  house: string;
  gold: number;
  bank: number;

  hp: number; // @my_hp = Your current health
  oldhp: number; // use it to calculate diff between old and new values
  maxhp: number; // @my_maxhp = Your maximum health points
  mp: number; // @my_mp = Your current mana points
  oldmp: number;
  maxmp: number; // @my_maxmp = Your maximum mana points
  ep: number; // @my_ep 	Your current endurance points
  maxep: number; // @my_maxep = Your maximum endurance points
  wp: number; // @my_wp = Your current willpower points
  maxwp: number; // @my_maxwp = Your maximum willpower points

  round: number;
  bal: boolean; // @my_bal = If you currently have balance
  eq: boolean; // @my_eq = If you currently have equilibrium
  eb: boolean; // balance + equilibrium

  rift: GmcpItem[];
  items: GmcpItem[];
  wieldedL: GmcpItem;
  wieldedR: GmcpItem;

  charstats: string[];
  afflictions: GmcpAffliction[];
  defences: GmcpDefence[];
  skills: GmcpSkillList;

  displayRace: string;
}

export interface StateRoom {
  num: number;
  area: string; // this is the GMCP name, eg: Ashtan, Isle of Delos...
  plane: string;
  environment: string;
  name: string;
  desc: string;
  owner: string; // wares proprietor
  room: any; // meta from map
  details?: string[];
  exits?: Record<string, number>;
  wild?: boolean;
  items: GmcpItem[];
  players: GmcpPlayer[];
}

export interface StateBattle {
  rage: number;
  rounds: number;
  active: boolean;
  combat: boolean;
  // continue hunting?
  auto: boolean;
  tgtID?: number;
  tgtHP?: string;
  // local target name
  target?: string;
  // battle targets, NPCs & Players
  tgts: Record<string, BattleTarget>;
  bals: Record<string, boolean>;
}

export interface StateStats {
  begDt: Date; // game start time
  endDt?: Date; // game end time
  perf: number; // used to calc ping
  ping: number; // ping/response time
  gold: number;
  bank: number;
  kills: number;
  bal?: Date;
  eq?: Date;
  eat?: Date;
  drink?: Date;
  apply?: Date;
  smoke?: Date;
}

export interface BattleTarget {
  id: string | number;
  name: string;
  hp?: number;
  maxhp?: number;
  hpperc?: string;
  attrib?: string;
  player?: boolean;
  affs?: Set<string>;
  defs?: Set<string>;
}

export interface GmcpPlayer {
  name: string;
  fullname?: string;
}

export interface GmcpChar extends GmcpPlayer {
  hp: string | number;
  maxhp: string | number;
  oldhp?: number;
  mp: string | number;
  maxmp: string | number;
  oldmp?: number;
  ep: string | number;
  maxep: string | number;
  wp: string | number;
  maxwp: string | number;
  bal: string | boolean;
  eq: string | boolean;
  nl: string;
  charstats: string[];
  age: string;
  race: string;
  gender: string;
  level: string | number;
  class: string;
  city: string;
  house: string;
  gold: string | number;
  bank: string | number;
  target?: string;
  rage?: number;
}

export interface GmcpRoom {
  num: number;
  name: string;
  area: string;
  coords: string;
  ohmap?: number;
  desc: string;
  details?: string[];
  environment: string;
  exits?: Record<string, number>;
  room?: any;
}

export interface GmcpDefence {
  name: string;
  desc: string;
}

export interface GmcpAffliction extends GmcpDefence {
  cure: string;
}

export interface GmcpSkill {
  name: string;
  rank: string;
}

export interface GmcpSkillList {
  group?: string;
  list: string[];
}

export interface GmcpItem {
  id: string | number;
  name: string;
  icon?: string;
  attrib?: string;
  type?: string;
}

export interface GmcpItemUpd {
  location: string;
  item: GmcpItem;
}

export interface GmcpItemList {
  location: string;
  items: GmcpItem[];
}

export interface GmcpChannelText {
  channel: string;
  talker: string;
  text: string;
}

export interface GmcpTime {
  day: string;
  mon: string;
  month: string;
  year: string;
  hour: string | number;
  daynight: string;
  moonphase: string;
  time: string;
}

export interface StateTime extends GmcpTime {
  season: string;
  hhour: string;
  rlhm: string;
}

export interface DBPlayer {
  id: string;
  // shouldn't have name; the ID is used instead
  name?: string;
  fullname: string;
  age: string;
  city: string;
  class: string | string[];
  level?: number;
  sex: string;
  race: string;
  dt?: string;
}

export interface DBWares {
  id: string;
  name: string;
  price: number;
  stock: number;
  owner: string;
  roomID?: number;
  room?: string;
  area?: string;
  dt?: string;
}

export interface DBRoom {
  id: string;
  name: string;
  desc: string;
  area: string;
  env: string;
  features?: string; // GMCP details
  dt?: string;
}
