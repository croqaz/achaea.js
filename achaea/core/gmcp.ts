// deno-lint-ignore-file no-node-globals no-process-globals

// import process from 'node:process';
import * as T from '../types.ts';
import * as S from './state.ts';
import ee from '../events/index.ts';
import { ansi2Html } from '../ansi.ts';

export function gmcpHello() {
  // Core.Hello {"client":"Mudlet", "version":"4.12.0"}
  // Core.Hello {"Client":"IRE-Nexus","Version":"3.0.1"}
  return Buffer.from(`Core.Hello {"Client":"Tinyfugue","Version":"${process.version}"}`);
}

export function gmcpSupports() {
  const value = `"Core 1","Char 1", "Char.Vitals 1","Char.Skills 1","Char.Items 1",
    "IRE.Rift 1", "IRE.Target 1", "Room 1", "Comm.Channel 1", "IRE.Time 1"`;
  return Buffer.from(`Core.Supports.Set [ ${value} ]`);
}

export function gmcpTime() {
  // high resolution timestamp in milliseconds diff
  const diff = (performance.now() - S.STATE.Stats.perf) * 1000;
  S.STATE.Stats.ping.push(diff);
  if (S.STATE.Stats.ping.length > 10) {
    S.STATE.Stats.ping.shift();
  }
  return Buffer.from('IRE.Time.Request');
}

export function gmcpInventory() {
  return Buffer.from('Char.Items.Inv');
}

export function gmcpRiftItems() {
  return Buffer.from('IRE.Rift.Request');
}

export function gmcpPlayers() {
  return Buffer.from('Comm.Channel.Players');
}

export function processGMCP(text: string) {
  /*
   * Process and save game states
   * Reference: https://nexus.ironrealms.com/GMCP
   * And: https://nexus.ironrealms.com/GMCP_Data
   */
  const type = text.split(' ', 1).pop();
  //
  // Ignore some states from the start
  if (
    !type ||
    type === 'Client.Map' ||
    type === 'Char.Defences.InfoList' ||
    type === 'Comm.Channel.List' ||
    type === 'Comm.Channel.Start' ||
    type === 'Comm.Channel.End' ||
    type === 'Room.WrongDir' ||
    type === 'Core.Goodbye'
  ) {
    return;
  }

  let data = {};
  try {
    data = JSON.parse(text.slice(type.length + 1));
  } catch {
    return;
  }

  // IRE.Target.Set "1234"
  // IRE.Target.Info { "id":"1234", "short_desc":"a scorpion", "hpperc":"60%" }
  if (type === 'IRE.Target.Set' || type === 'IRE.Target.Info') {
    return S.gmcpProcessTarget(type, data);
  }

  if (type === 'Char.Status' || type === 'Char.Vitals') {
    return S.gmcpProcessChar(type, data as T.GmcpChar);
  }

  // defences
  if (type.startsWith('Char.Defences.')) {
    return S.gmcpProcessDefences(type, data);
  }

  // afflictions
  if (type.startsWith('Char.Afflictions.')) {
    return S.gmcpProcessAfflictions(type, data);
  }

  // player & room items
  if (type.startsWith('Char.Items.')) {
    return S.gmcpProcessItems(type, data as T.GmcpItemUpd);
  }

  if (type.startsWith('IRE.Rift.')) {
    // SKIP for now
    // gmcpProcessRift(type, data);
    return;
  }

  if (type === 'Char.Skills.Groups' || type === 'Char.Skills.List') {
    return S.gmcpProcessSkills(type, data);
  }

  if (type === 'Room.Info') {
    return S.gmcpProcessRoomInfo(type, data as T.GmcpRoom);
  }

  if (type === 'Room.Players' || type === 'Room.AddPlayer' || type === 'Room.RemovePlayer') {
    return S.gmcpProcessRoomPlayers(type, data);
  }

  if (type === 'Comm.Channel.Text') {
    // Communication msgs are not saved in STATE
    const tsData = data as T.GmcpChannelText;
    tsData.text = ansi2Html(tsData.text);
    return ee.emit('channel:text', tsData);
  }

  if (type === 'IRE.Time.List' || type === 'IRE.Time.Update') {
    return S.gmcpProcessTime(type, data as T.GmcpTime);
  }

  // Only once, after correct login
  if (type === 'Char.StatusVars') {
    setTimeout(() => ee.emit('user:gmcp', gmcpInventory()), 250);
    setTimeout(() => ee.emit('user:gmcp', gmcpRiftItems()), 500);
    // Game has started, enable user logic
    setTimeout(() => ee.emit('game:start'), 750);
    return;
  }

  console.warn('[GMCP] Unhandled/ Unknown STATE ??', type, data);
}

ee.on('game:gmcp', processGMCP);
