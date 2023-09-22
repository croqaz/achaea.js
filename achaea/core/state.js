import chalk from 'chalk';

import ee from '../events.js';

export const STATE = {
  Myself: {
    //
    name: 'Name',
    race: 'Race',
    level: 'Experience Level',
    xp: 'Experience To Next Level',
    class: 'Class',
    city: 'City',
    gold: 'Gold',

    hp: '',
    maxhp: '',
    mp: '',
    maxmp: '',
    ep: '',
    maxep: '',
    wp: '',
    maxwp: '',
    bal: '1',
    eq: '1',

    // rage_balance
    // elixir_balance
    // pipe_balance
    target: '',

    rift: [],
    items: [],
    charstats: [],
    afflictions: [],
    defences: [],
    //
  },
  Location: {
    //
    num: 0,
    area: '',
    plane: '',
    environment: '',
    name: '',
    owner: '',
    coords: '',
    details: [],
    exits: {},
    items: [],
    players: [],
    //
  },
  MUD: {
    //
    input: '', // user's current input
    round: 0, // rounds after balance / equilibrium
    walk: [], // auto-walk paths
    rats: false, // watching for rats?
    battle: false, // in battle?
    target: null, // attack target
    waresDB: false,
    whoisDB: false,
    //
  },
};

function remFromStateList(key, list, value) {
  if (!STATE[key]) {
    console.error('Wrong STATE key!', key);
    return;
  }
  if (!STATE[key][list]) {
    console.error('Wrong STATE list key!', key);
    return;
  }
  let index = 0;
  for (const x of STATE[key][list]) {
    if (x.id === value.id) {
      STATE[key][list].splice(index, 1);
      return;
    }
    index += 1;
  }
}

export function updateMyself(meta) {
  for (const k of Object.keys(meta)) {
    // Ignore inexistent fields
    if (STATE.Myself[k] === undefined) {
      continue;
    }
    STATE.Myself[k] = meta[k];
  }
  // console.debug('MYSELF updated:', STATE.Myself);
}

export function updateLocation(meta) {
  for (const k of Object.keys(meta)) {
    // Ignore inexistent fields so the Location object doesn't explode
    if (STATE.Location[k] === undefined) {
      continue;
    }
    STATE.Location[k] = meta[k];
  }
  // console.debug('LOCATION updated:', STATE.Location);
}

export function listDenizens() {
  // list NPCs in the room
  const isDenizen = (x) => x.attrib && x.attrib.includes('m') && !x.attrib.includes('d');
  return STATE.Location.items.filter(isDenizen).map((x) => x.id);
}

export function listPlayers() {
  // list players in the room
  return STATE.Location.players.map((x) => x.name);
}

function processStates(text) {
  /*
   * Process and save game states
   */
  const type = text.slice(0, text.indexOf(' '));
  let data = {};
  try {
    data = JSON.parse(text.slice(text.indexOf(' ') + 1));
  } catch (err) {
    console.error('CANNOT parse GMCP:', err);
    return;
  }

  if (type === 'Char.Status' || type === 'Char.Vitals') {
    if ((data.bal === '1' && data.bal !== STATE.Myself.bal) || (data.eq === '1' && data.eq !== STATE.Myself.eq)) {
      STATE.MUD.round++;
      // emit a new round
      ee.emit('new:round');
    }
    return updateMyself(data);
  }

  // defences
  if (type === 'Char.Defences.List') {
    return updateMyself({ defences: data });
  } else if (type === 'Char.Defences.Add') {
    console.log(chalk.italic.magenta('Defences ++', data.name));
    STATE.Myself.defences.push(data);
    return;
  } else if (type === 'Char.Defences.Remove') {
    console.log(chalk.italic.red('Defences --', data));
    for (const item of data) {
      remFromStateList('Myself', 'defences', item);
    }
    return;
  }

  // afflictions
  if (type === 'Char.Afflictions.List') {
    return updateMyself({ afflictions: data });
  } else if (type === 'Char.Afflictions.Add') {
    console.log(
      chalk.italic.red('Afflictions ++', data.name),
      data.cure ? chalk.italic.magenta('CURE:', data.cure) : '',
    );
    STATE.Myself.afflictions.push(data);
    return;
  } else if (type === 'Char.Afflictions.Remove') {
    console.log(chalk.italic.magenta('Afflictions --', data));
    for (const item of data) {
      remFromStateList('Myself', 'afflictions', item);
    }
    return;
  }

  if (type === 'Char.Items.List') {
    if (data.location === 'inv') {
      updateMyself({ items: data.items });
    } else if (data.location === 'room') {
      updateLocation({ items: data.items });
    } else {
      console.log('DONT KNOW WHAT DO DO WITH STATE', type, data.location);
    }
    return;
  }
  if (type === 'Char.Items.Add') {
    if (data.location === 'inv') {
      STATE.Myself.items.push(data.item);
    } else if (data.location === 'room') {
      STATE.Location.items.push(data.item);
    } else {
      console.log('DONT KNOW WHAT DO DO WITH STATE', type, data.location);
    }
    return;
  }
  if (type === 'Char.Items.Remove') {
    if (data.location === 'inv') {
      remFromStateList('Myself', 'items', data.item);
    } else if (data.location === 'room') {
      remFromStateList('Location', 'items', data.item);
    } else {
      console.log('DONT KNOW WHAT DO DO WITH STATE', type, data.location);
    }
    return;
  }

  if (type === 'IRE.Rift.List') {
    updateMyself({ rift: data });
    return;
  }

  if (type === 'Room.Info') {
    // STATE.MUD.walk.push(data.num);
    return updateLocation(data);
  } else if (type === 'Room.Players') {
    return updateLocation({ players: data });
  } else if (type === 'Room.AddPlayer') {
    console.log(chalk.italic('Players ++', data.name));
    STATE.Location.players.push(data);
    return;
  } else if (type === 'Room.RemovePlayer') {
    console.log(chalk.italic('Players --', data));
    return remFromStateList('Location', 'players', data);
  }

  // Ignore these states for now
  if (
    type === 'Client.Map' ||
    type === 'Char.StatusVars' ||
    type === 'Char.Defences.InfoList' ||
    type === 'Room.WrongDir' ||
    type === 'Core.Goodbye'
  ) {
    return;
  }

  // console.log('?? STATE ??', type, data);
}

ee.on('game:gmcp', processStates);