import u from '@yanick/updeep-remeda';

export const CITIES = Object.freeze(['Ashtan', 'Cyrene', 'Eleusis', 'Hashan', 'Mhaldor', 'Targossas']);

export const HOUSES = Object.freeze([
  'Cij',
  'Consortium',
  'Dawnblade',
  'Harbingers',
  'Heartwood',
  'Insidium',
  'Krymenian',
  'Legates',
  'Merchants',
  'Outriders',
  'Savants',
  'Scions',
  'Shield',
  'Somatikos',
  'Vanguard',
  'Virtuosi',
]);

export const CLASSES = Object.freeze([
  'Alchemist',
  'Apostate',
  'Bard',
  'Blademaster',
  'Depthswalker',
  'Druid',
  'Infernal',
  'Jester',
  'Magi',
  'Monk',
  'Occultist',
  'Paladin',
  'Pariah',
  'Priest',
  'Psion',
  'Runewarden',
  'Sentinel',
  'Serpent',
  'Shaman',
  'Sylvan',
  'Unnamable',
]);

export const RACES = Object.freeze([
  'Atavian',
  'Dwarf',
  'Fayad',
  'Grook',
  'Horkval',
  'Human',
  'Mhun',
  'Rajamala',
  'Satyr',
  'Siren',
  "Tash'la",
  'Troll',
  "Tsol'aa",
  'Xoran',
]);

export const VENOMS = Object.freeze({
  xentio: {
    aff: 'clumsiness',
    short: 'loss of coordination',
    long: 'makes even the most coordinated warrior a clumsy fool',
  },
  oleander: {
    aff: 'blindness',
    def: 'blindness',
    short: 'blindness',
    long: "attacks the visual system, causing the victim's eyes to fail",
  },
  eurypteria: {
    aff: 'recklessness',
    short: 'gives the victim delusions of invulnerability',
    long: 'affecting the decision making ability of the mortal victim, it causes even the most rational mortal to believe himself immortal, causing him to run into battle recklessly',
  },
  kalmia: {
    aff: 'asthma',
    short: 'inhibits the respiratory system',
    long: "contracts the victim's lungs, making the passage of all air impossible",
  },
  digitalis: {
    aff: 'shyness', // cured by eating goldenseal
    short: 'causes unbearable shyness',
    long: 'causes the most outgoing person to become a shy, fearful, child and unable to bear the presence of others',
  },
  darkshade: {
    aff: 'darkshade', // cured by eating a ginseng root or the ferrum mineral
    short: 'makes the victim allergic to sunlight',
    long: "the sun itself becomes your enemy when bitten with this venom, searing the victim's flesh when exposed to sunlight",
  },
  curare: {
    aff: 'paralysis',
    short: 'a venom of muscular paralysis',
    long: 'the victim will find himself unable to move, as his muscles fail to respond to his commands',
  },
  epteth: {
    aff: 'damaged limb',
    short: 'shrivel up the arms of your unlucky victim',
    long: 'attacks the muscle fibre of the upper limbs of the victim, causing them to shrivel up and become useless',
  },
  prefarar: {
    aff: 'sensitivity',
    short: "increase the recipient's sensitivity.",
    long: 'all nerve endings in the victim are heightened, increasing his sensitivity to even the slightest sensation, often to the point of causing pain',
  },
  monkshood: {
    aff: 'disfigurement',
    short: 'disfigure your victim, causing disloyalty in those around',
    long: 'affects the face of its victim, causing horrible disfigurement. Those loyal to the victim are often so disgusted that they turn on him, possibly attacking him',
  },
  euphorbia: {
    aff: 'nausea',
    short: 'induces spasmodic vomiting',
    long: 'the digestive system of the victim is thrown into upheaval, causing spasmodic vomiting',
  },
  colocasia: {
    aff: 'blindness and deafness',
    def: 'blindness and deafness',
    short: 'gives blindness and deafness',
    long: 'exposure leaves one robbed of their most vital senses: sight and hearing',
  },
  oculus: {
    aff: 'cure blindness',
    short: "forces the recipient's eyelids open.",
    long: 'forcibly heals those with shut eyes or blindness',
  },
  vernalius: {
    aff: 'weariness',
    short: 'a venom that weakens the muscles',
    long: "causes the victim's strength to leave its body, leaving a weak husk of a person in its place",
  },
  epseth: {
    aff: 'damaged limb',
    short: 'cause the legs of your victim to become useless',
    long: 'sister venom of Epteth, it attacks the muscles of the leg, leaving them rotten and withered',
  },
  larkspur: {
    aff: 'dizziness',
    short: 'causes great dizziness',
    long: 'famous for its ability to induce great dizziness',
  },
  slike: {
    aff: 'anorexia',
    short: 'give the curse of anorexia to your victim',
    long: 'causes the victim to lose all desire for food or drink, possibly causing starvation if left unchecked',
  },
  voyria: {
    aff: 'voyria',
    short: 'the deadliest venom known to mankind',
    long: 'The most deadly venom in all of mankind. Even the smallest dose can kill a large bull within a matter of seconds.',
  },
  delphinium: {
    aff: 'sleep',
    short: 'put your victim to sleep',
    long: "By slowing heartrate and synapse activity, it eventually results in a peacefully sleeping victim. Often used by 'pacifists' to subdue their attackers.",
  },
  notechis: {
    aff: 'haemophilia',
    short: 'induce haemophilia in a target',
    long: "induces haemophilia preventing its victim's blood from clotting",
  },
  vardrax: {
    aff: 'addiction',
    short: 'grants an insatiable addiction',
    long: 'will instill an addiction in the victim that will not be sated',
  },
  loki: {
    aff: 'random',
    short: 'an unpredictable toxin',
    long: 'a potent mix of other venoms, the effects are random and wide ranging, from sickness to death',
  },
  aconite: {
    aff: 'stupidity',
    short: 'cause sheer stupidity in your opponent',
    long: 'the brain of the affected individual ceases to operate correctly, causing them to exist in a state of complete stupor',
  },
  selarnia: {
    aff: '',
    short: 'forcing your victim back into mortal form',
    long: 'the bane of Shapechangers, it disrupts the concentration of those with altered physical form, forcing them back into a mortal shape',
  },
  gecko: {
    aff: 'slickness',
    short: 'causes the recipient to become foully oily',
    long: "adapted from the serpents of old, it will cause its victim's body to become coated in a very slick slime",
  },
  scytherus: {
    aff: 'scytherus', // cured by eating a ginseng root or the ferrum mineral
    short: 'a venom that thins the blood',
    long: 'those infected will find that their blood turns against them when any type of foreign substance is introduced into their system',
  },
  nechamandra: {
    aff: 'freezing',
    short: 'a venom that chills the veins',
    long: 'those inflicted will find that their blood runs cold causing them to shiver violently',
  },
});

export const RUNES = Object.freeze({
  kena: {
    effect: 'inspires fear',
    req: '1 red ink',
    symbol: 'nightmare',
    short: 'a rune to inspire fear',
  },
  uruz: {
    effect: 'heals allies',
    req: '1 blue ink, 1 yellow ink',
    symbol: 'lightning bolt',
    short: 'heal your allies with earth magic',
  },
  fehu: {
    effect: 'causes sleeping',
    req: '1 red ink',
    symbol: 'closed eye',
    short: 'causes sleeping urges',
  },
  pithakhan: {
    effect: 'attacks mana',
    req: '1 red ink',
    symbol: 'square box',
    short: 'attack the mental reserves of your enemies',
  },
  jera: {
    effect: 'str+1 con+1',
    req: '1 purple ink',
    symbol: 'mighty oak',
    short: 'a rune to increase the vitality of the bearer',
  },
  inguz: {
    effect: 'enemy paralysis',
    req: '1 red ink',
    symbol: 'stickman',
    short: 'a rune with the ability to paralyse',
  },
  wunjo: {
    effect: 'returns sight',
    req: '1 red ink',
    symbol: 'open eye',
    short: "upon encountering this, an enemy's sight will be returned",
  },
  lagul: {
    effect: 'increases weapon bleeding',
    req: '1 purple ink',
    symbol: 'dirk',
    short: 'add an element of bleeding to your strategem',
  },
  sowulu: {
    effect: 'damages enemy health',
    req: '1 red ink',
    symbol: 'nail',
    short: 'damages the health of enemies',
  },
  algiz: {
    effect: '10% damage protection',
    req: '1 green ink',
    symbol: 'elk',
    short: 'a rune of protection from damage',
  },
  isaz: {
    effect: 'calls forth shockwaves',
    req: '1 blue ink, 1 red ink',
    symbol: 'flurry of lightning bolts',
    short: 'a rune to call shockwaves to take your enemies off balance',
  },
  dagaz: {
    effect: 'cure afflictions',
    req: '1 green ink, 1 red ink',
    symbol: 'rising sun',
    short: 'this rune will heal afflictions from you at random',
  },
  gebu: {
    effect: 'armour blunt protection',
    req: '1 gold ink',
    symbol: 'shield',
    short: 'this rune will increase the blunt protection of armour',
  },
  gebo: {
    effect: 'armour cutting protection',
    req: '1 gold ink',
    symbol: 'chain',
    short: 'a rune to increase the cutting protection of armour',
  },
  gular: {
    effect: 'raises a stone wall',
    req: '1 red ink',
    symbol: 'wall',
    short: 'drawing on the power of the earth, raise a stone wall',
  },
  raido: {
    effect: 'teleports to rune',
    req: '1 green ink',
    symbol: 'horse',
    short: 'summon a spiritual steed to bear you home',
  },
  thurisaz: {
    effect: 'calls forth molten lava',
    req: '1 blue ink, 1 red ink',
    symbol: 'volcano',
    short: 'call forth a spout of molten lava from the earth',
  },
  lagua: {
    effect: 'increases weapon damage',
    req: '1 purple ink',
    symbol: 'large hammer',
    short: 'further punish your foe',
  },
  hugalaz: {
    effect: 'calls down a hailstorm',
    req: '1 blue ink',
    symbol: 'ball of ice',
    short: 'call down a hailstorm around you',
  },
  nauthiz: {
    effect: 'sucks the nourishment from foes',
    req: '1 blue ink, 1 yellow ink',
    symbol: 'leech',
    short: 'suck the nourishment from your foes',
  },
  mannaz: {
    effect: 'returns hearing',
    req: '1 red ink',
    symbol: 'bell',
    short: 'return hearing to a victim',
  },
  othala: {
    effect: 'burns enemies with lava',
    req: '5 red inks',
    symbol: 'mountain range',
    short: 'besiege your enemies with multiple spouts of molten lava',
  },
  sleizak: {
    effect: 'afflicts foes with voyria',
    req: '1 blue ink',
    symbol: 'viper',
    short: 'afflict a foe with the horrible voyria poison',
  },
  tiwaz: {
    effect: 'removes a defence from enemies',
    req: '1 blue ink, 2 red inks',
    symbol: 'upwards-pointing arrow',
    short: 'this rune will remove the defenses of your enemies',
  },
  berkana: {
    effect: 'health regeneration',
    req: '3 yellow inks',
    symbol: 'lion',
    short: 'provides health regeneration to the bearer',
  },
  nairat: {
    effect: 'beguiles and transfixes enemies',
    req: '1 yellow ink',
    symbol: 'butterfly',
    short: 'a rune to entangle',
  },
  eihwaz: {
    effect: 'dampens vibrations',
    req: '1 blue ink, 1 yellow ink',
    symbol: 'yew',
    short: 'a powerful vibration-dampening rune',
  },
  laguz: {
    effect: 'increased weapon damage',
    req: '1 purple ink',
    symbol: 'long slim blade',
    short: 'increased damage to the limbs of your foe',
  },
  loshre: {
    effect: 'afflicts enemies with anorexia',
    req: '1 blue ink',
    symbol: 'apple core',
    short: 'cause an opponent to become afflicted with anorexia',
  },
});

// Copied from HELP HERBS
let _herbs_short = `
Ash         some prickly ash bark
Bayberry    some bayberry bark
Bellwort    a bellwort flower
Bloodroot   a bloodroot leaf
Cohosh      a black cohosh root
Echinacea   an echinacea root
Elm         slippery elm
Ginger      a ginger root
Ginseng     a ginseng root
Goldenseal  a goldenseal root
Hawthorn    a hawthorn berry
Kelp        a piece of kelp
Kola        a kola nut
Kuzu        a kuzu root
Lobelia     a lobelia seed
Moss        some irid moss
Myrrh       a ball of myrrh gum
Pear        a prickly pear
Sileris     a sileris berry
Skullcap    a skullcap flower
Slipper     a lady's slipper root
Valerian    a valerian leaf
Weed        a sprig of cactus weed
`
  .split('\n')
  .filter((x) => !!x)
  .map((x) => {
    const [name, short] = x.split(/[ ]+(.*)/);
    return [name.toLowerCase(), { short }];
  });

// Copied from HELP HEALING LIST
// Renamed a few herbs, to match the short names:
// Prickly Ash renamed to Ash, Prickly Pear renamed to Pear
// Also: Slippery Elm -> Elm, Irid Moss -> Moss
// After renaming, they were sorted alphabetically
// Weed, Kuzu & Slipper were added because this list is also used for harvesting;
// ALL the herbs must have a short & a long description!
let _herbs_long = `
Ash           When eaten, cures various afflictions relating to your sanity.
Bayberry      Gives blindness.
Bellwort      Cures unnatural tendencies to be excessively altruistic.
Bloodroot     Cures paralysis and slickness.
Cohosh        Gives you insomnia, which prevents you being put to sleep.
Echinacea     Gives third eye.
Elm           (Smoked) Cures a variety of curses and afflictions.
Ginger        Reduces the fluid level in your body when artificially raised.
Ginseng       Cure for impurities of the blood or diseases of the skin.
Goldenseal    Cure for body or mind in disharmony.
Hawthorn      Gives deafness.
Kelp          Cure for weakened muscles or lower general fitness.
Kola          Allows you to awaken from sleep immediately, at will.
Kuzu          The kuzu root is used as an ingredient in concoctions.
Lobelia       Cure relating mainly to various types of phobias or pathos.
Moss          Heals some health and mana.
Myrrh         Increases your learning lesson speed.
Pear          Allows breathing underwater. Cannot be used pre-emptively.
Sileris       (Applied) Defends against Serpent class fang attacks.
Skullcap      (Eaten) Gives deathsight.
Skullcap      (Smoked) Anti-weapon field that lasts until taken down by others or you act aggressively.
Slipper       The yellow lady's slipper can be used to brew the mana elixir.
Valerian      (Smoked) Cures the disfigurement and slickness afflictions.
Weed          (Smoked) Induces feelings of euphoria and hallucinations of giant, colourful smiley faces.
`
  .split('\n')
  .filter((x) => !!x)
  .map((x) => {
    const [name, long] = x.split(/[ ]+(.*)/);
    return [name.toLowerCase(), { long }];
  });

export const HERBS = u.freeze(u(Object.fromEntries(_herbs_short), Object.fromEntries(_herbs_long)));
// Release memory
_herbs_short = null;
_herbs_long = null;

// Copied from HELP MINERALS
let _minerals_short = `
Antimony     an antimony flake
Argentum     an argentum flake
Arsenic      an arsenic pellet
Aurum        an aurum flake
Azurite      an azurite mote
Bisemutum    a bisemutum chip
Calamine     a calamine crystal
Calcite      a calcite mote
Cinnabar     a pinch of ground cinnabar
Cuprum       a cuprum flake
Dolomite     a dolomite grain
Ferrum       a ferrum flake
Gypsum       a gypsum crystal
Magnesium    a magnesium chip
Malachite    a pinch of ground malachite
Plumbum      a plumbum flake
Potash       a potash crystal
Quartz       a quartz grain
Quicksilver  a quicksilver droplet
Realgar      a pinch of realgar
Stannum      a stannum flake
`
  .split('\n')
  .filter((x) => !!x)
  .map((x) => {
    const [name, short] = x.split(/[ ]+(.*)/);
    return [name.toLowerCase(), { short }];
  });

// Copied from HELP HEALING LIST
let _minerals_long = `
Antimony      Reduces the fluid level in your body when artificially raised.
Argentum      Cure relating mainly to various types of phobias or pathos.
Arsenic       Gives blindness.
Aurum         Cure for weakened muscles or lower general fitness.
Azurite       (Eaten) Gives deathsight.
Bisemutum     Increases your learning lesson speed.
Calamine      Gives deafness.
Calcite       Allows breathing underwater. Cannot be used pre-emptively.
Cinnabar      (Smoked) Cures a variety of curses and afflictions.
Cuprum        Cures unnatural tendencies to be excessively altruistic.
Dolomite      Gives third eye.
Ferrum        Cure for impurities of the blood or diseases of the skin.
Gypsum        Gives you insomnia, which prevents you being put to sleep.
Magnesium     Cures paralysis and slickness.
Malachite     (Smoked) Anti-weapon field that lasts until taken down by others or you act aggressively.
Plumbum       Cure for body or mind in disharmony.
Potash        Heals some health and mana.
Quartz        Allows you to awaken from sleep immediately, at will.
Quicksilver   (Applied) Defends against Serpent class fang attacks.
Realgar       (Smoked) Cures the disfigurement and slickness afflictions.
Stannum       When eaten, cures various afflictions relating to your sanity.
`
  .split('\n')
  .filter((x) => !!x)
  .map((x) => {
    const [name, long] = x.split(/[ ]+(.*)/);
    return [name.toLowerCase(), { long }];
  });

export const MINERALS = u.freeze(
  u(Object.fromEntries(_minerals_short), Object.fromEntries(_minerals_long)),
);
// Release memory
_minerals_short = null;
_minerals_long = null;

// Copied from HELP GATHERING
// I ignored Saltwater, Milk & Eggs
let _gather_materials = `
Cacao       Cacao pods that can be refined into chocolate.
Dust        Valuable diamond dust gathered underground.
Fruit       Delicious and juicy edibles.
Grain       Wheat, rice, corn, maize, barley, oats, rye...
Lumic       Blue moss growing underground.
Nut         Crunchy garnishes for your meals.
Olive       Versatile fruit grown in fertile soil.
Sugarcane   Sweet-tasting plant that rots your teeth.
Vegetable   Healthy food to help you grow big and strong.
`
  .split('\n')
  .filter((x) => !!x)
  .map((x) => {
    const [name, desc] = x.split(/[ ]+(.*)/);
    return [name.toLowerCase(), desc];
  });

export const MATERIALS = u.freeze(Object.fromEntries(_gather_materials));
_gather_materials = null;

// Mineral to Herb equivalence
let _mineral_eq_herb = `
Antimony     Ginger
Argentum     Lobelia
Arsenic      Bayberry
Aurum        Kelp
Azurite      Skullcap
Bisemutum    Myrrh
Calamine     Hawthorn
Calcite      Pear
Cinnabar     Elm
Cuprum       Bellwort
Dolomite     Echinacea
Ferrum       Ginseng
Gypsum       Cohosh
Magnesium    Bloodroot
Malachite    Skullcap
Plumbum      Goldenseal
Potash       Moss
Quartz       Kola
Quicksilver  Sileris
Realgar      Valerian
Stannum      Ash
`
  .split('\n')
  .filter((x) => !!x)
  .map((x) => {
    const [herb, mineral] = x.split(/[ ]+/);
    return [herb.toLowerCase(), mineral.toLowerCase()];
  });

export const MINERAL_EQ_HERB = u.freeze(Object.fromEntries(_mineral_eq_herb));
export const HERB_EQ_MINERAL = u.freeze(Object.fromEntries(_mineral_eq_herb.map((x) => [x[1], x[0]])));
// Release memory
_mineral_eq_herb = null;

export function findHerb(name: string) {
  const result = [];
  name = name.toLowerCase();
  for (const [n, info] of Object.entries(HERBS)) {
    if (name === n || info.short.includes(name) || info.long.includes(name)) {
      const equal = HERB_EQ_MINERAL[n];
      result.push({ name: n, equal, ...info });
    }
  }
  return result;
}

export function findMineral(name: string) {
  const result = [];
  name = name.toLowerCase();
  for (const [n, info] of Object.entries(MINERALS)) {
    if (name === n || info.short.includes(name) || info.long.includes(name)) {
      const equal = MINERAL_EQ_HERB[n];
      result.push({ name: n, equal, ...info });
    }
  }
  return result;
}

export function findVenom(name: string) {
  const result = [];
  name = name.toLowerCase();
  for (const [n, info] of Object.entries(VENOMS)) {
    if (
      name === n ||
      info.aff.startsWith(name) ||
      info.short.includes(name) ||
      info.long.includes(name)
    ) {
      result.push({ name: n, ...info });
    }
  }
  return result;
}

export function findRune(name: string) {
  //   kena: {
  //   effect: 'inspires fear',
  //   req: '1 red ink',
  //   symbol: 'nightmare',
  //   desc: 'a rune to inspire fear',
  // },
  const result = [];
  name = name.toLowerCase();
  for (const [n, info] of Object.entries(RUNES)) {
    if (
      name === n ||
      info.symbol.includes(name) ||
      info.effect.includes(name) ||
      info.short.includes(name)
    ) {
      result.push({ name: n, ...info });
    }
  }
  return result;
}

export function weaponType(text: string): string {
  if (
    text.includes(' Dreadblade ') ||
    text.includes(' Soulreaver ') ||
    text.includes(' Dawnrender ') ||
    text.includes(' bastard sword')
  ) {
    return 'bastard sword';
  } else if (
    text.includes(' Hellforge ') ||
    text.includes(' Worldforge ') ||
    text.includes(` Stonesmith's `)
  ) {
    return 'warhammer';
  } else if (text.includes(' Orcsplitter ') || text.includes('Logosian Battleaxe')) {
    return 'battleaxe';
  } else if (text.includes('Scimitar of ')) {
    return 'scimitar';
  } else if (
    text.includes(`Assassin's Dirk`) ||
    text.includes(`Buckawn's Spine`) ||
    text.includes(`Thoth's Fang`)
  ) {
    return 'dirk';
  } else if (text.endsWith(' cleaver')) {
    return 'cleaver';
  }
  return '';
}
