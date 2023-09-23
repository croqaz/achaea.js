/*
 * Ref: https://nexus.ironrealms.com/GMCP
 */

import process from 'node:process';

export function gmcpHello() {
  return Buffer.from(`Core.Hello {"Client":"node","Version":"${process.version}"}`);
}

export function gmcpPing() {
  return Buffer.from('Core.Ping');
}

export function gmcpSupports() {
  const value = `"Char 1", "Char.Vitals 1", "Char.Items 1", "IRE.Rift 1", "IRE.Target 1",
    "Room 1", "Comm.Channel 1"`;
  return Buffer.from(`Core.Supports.Set [ ${value} ]`);
}

export function gmcpPlayers() {
  return Buffer.from('Comm.Channel.Players');
}

export function gmcpRiftItems() {
  return Buffer.from('IRE.Rift.Request');
}

// function gmcpTime() {
//   // sub IRE.Time
//   return Buffer.from('IRE.Time.Request');
// }
