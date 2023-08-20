//
// Ref: https://nexus.ironrealms.com/GMCP
//

import process from 'node:process';

export function gmcpHello() {
  return Buffer.from(`Core.Hello {"Client":"node","Version":"${process.version}"}`);
}

export function gmcpPing() {
  return Buffer.from('Core.Ping');
}

export function gmcpSupports() {
  return Buffer.from('Core.Supports.Set [ "Char 1", "Char.Items 1", "Room 1" ]');
}

export function gmcpPlayers() {
  return Buffer.from('Comm.Channel.Players');
}

// function gmcpTime() {
//   // sub IRE.Time
//   return Buffer.from('IRE.Time.Request');
// }
