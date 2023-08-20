import ee from './events.js';

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
    target: 'Target',

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
    owner: '', // wares proprietor
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
    rats: false, // watching for rats?
    battle: false, // in battle?
    target: null, // attack target
    //
  },
};

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

function myselfAddInv(item) {
  STATE.Myself.items.push(item);
}

function myselfRemInv(item) {
  let index = 0;
  for (const x of STATE.Myself.items) {
    if (x.id === item.id) {
      STATE.Myself.items.splice(index, 1);
      return;
    }
    index += 1;
  }
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

function locationAddInv(item) {
  STATE.Location.items.push(item);
}

function locationRemInv(item) {
  let index = 0;
  for (const x of STATE.Location.items) {
    if (x.id === item.id) {
      STATE.Location.items.splice(index, 1);
      return;
    }
    index += 1;
  }
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
    if (
      (data.bal === '1' && data.bal !== STATE.Myself.bal) ||
      (data.eq === '1' && data.eq !== STATE.Myself.eq)
    ) {
      STATE.MUD.round++;
      ee.emit('new:round');
    }
    return updateMyself(data);
  } else if (type === 'Char.Defences.List') {
    return updateMyself({ defences: data });
  } else if (type === 'Char.Afflictions.List') {
    return updateMyself({ afflictions: data });
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
      myselfAddInv(data.item);
    } else if (data.location === 'room') {
      locationAddInv(data.item);
    } else {
      console.log('DONT KNOW WHAT DO DO WITH STATE', type, data.location);
    }
    return;
  }
  if (type === 'Char.Items.Remove') {
    if (data.location === 'inv') {
      myselfRemInv(data.item);
    } else if (data.location === 'room') {
      locationRemInv(data.item);
    } else {
      console.log('DONT KNOW WHAT DO DO WITH STATE', type, data.location);
    }
    return;
  }

  if (type === 'Room.Info') {
    return updateLocation(data);
  } else if (type === 'Room.Players') {
    return updateLocation({ players: data });
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

  console.log('?? STATE ??', type, data);
}

ee.on('game:gmcp', processStates);
