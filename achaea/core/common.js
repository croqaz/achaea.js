export function isoDate() {
  return new Date().toISOString().split('.')[0];
}

export function dateDiff(d1, d2) {
  // Date difference, calculated in hours
  const d = Math.abs(new Date(d1) - new Date(d2));
  return d / 1000 / 3600;
}

export const CITIES = ['Ashtan', 'Cyrene', 'Eleusis', 'Hashan', 'Mhaldor', 'Targossas'];

export const HOUSES = [
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
];

export const CLASSES = [
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
];

export const RACES = [
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
];
