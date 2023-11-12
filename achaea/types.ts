export interface StateType {
  Me: StateMe;
  Room: StateRoom;
  Battle: StateBattle;
  Time: GmcpTime;
  Custom: Record<string, any>;
  Queue: Record<string, string[]>;
}

export interface StateMe {
  name: string;
  race: string;
  gender: string;
  level: number;
  xp: string;
  class: string;
  city: string;
  house: string;
  gold: number;

  hp: number;
  oldhp: number;
  maxhp: number;
  mp: number;
  oldmp: number;
  maxmp: number;
  ep: number;
  maxep: number;
  wp: number;
  maxwp: number;

  round: number;
  bal: boolean;
  eq: boolean;
  eb: boolean;

  rift: GmcpItem[];
  items: GmcpItem[];
  wieldedL: GmcpItem;
  wieldedR: GmcpItem;

  charstats: string[];
  afflictions: GmcpAffliction[];
  defences: GmcpDefence[];
  skills: GmcpSkillList;
}

export interface StateRoom {
  num: number;
  area: string; // this is the GMCP name, eg: Ashtan, Isle of Delos...
  plane: string;
  environment: string;
  name: string;
  desc: string;
  owner: string; // wares proprietor
  coord: any;
  room: any; // meta from map
  details?: string[];
  exits?: Record<string, number>;
  items: GmcpItem[];
  players: GmcpPlayer[];
}

export interface StateBattle {
  rage: number;
  rounds: number;
  active: boolean;
  combat: boolean;
  tgtID?: number;
  tgtHP?: string;
  // local target name
  target?: string;
  // battle targets, NPCs & Players
  tgts: Record<string, BattleTarget>;
  bals: Record<string, boolean>;
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
  target?: string;
  rage?: number;
}

export interface GmcpRoom {
  num: number;
  name: string;
  area: string;
  coords: string;
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
  hour: string;
  daynight: string;
  moonphase: string;
  time: string;
}

export interface DBPlayer {
  id: string;
  // shouldn't have name; the ID is used instead
  name?: string;
  fullname: string;
  age: string;
  city: string;
  class: string | string[];
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
  features?: string;
  dt?: string;
}
