/*
 * Telnet options ref:
 * https://iana.org/assignments/telnet-options/telnet-options.xhtml
 * ATCP / GMCP protocols:
 * https://www.gammon.com.au/gmcp
 * https://tintin.mudhalla.net/protocols/gmcp
 */
const OPTS = {
  TELNET_BIN: 0, // x00 ; Binary transmission
  TELNET_ECHO: 1, // x01
  TELNET_SGA: 3, // 0x03 ; Suppress go ahead

  TELNET_TTYPE: 24, // x18 ; Terminal type
  TELNET_EOR: 25, // x19 ; End of record

  MCCP_COMPRESS: 85, // 0x55
  MCCP2_COMPRESS: 86, // 0x56

  TELNET_ATCP: 200, // 0xC8 ; ATCP sequence
  TELNET_GMCP: 201, // 0xC9 ; GMCP sequence

  TELNET_SE: 240, // 0xF0 ; End of subnegotiation
  TELNET_NOP: 241, // 0xF1 ; No operation
  TELNET_GA: 249, // 0xF9 ; Go ahead
  TELNET_SB: 250, // 0xFA ; Start of subnegotiation
  TELNET_WILL: 251, // 0xFB
  TELNET_WONT: 252, // 0xFC
  TELNET_DO: 253, // 0xFD
  TELNET_DONT: 254, // 0xFE
  TELNET_IAC: 255, // 0xFF ; Interpret As Command
};

// enum {
//   SE   = 240, 0xF0, // end of subnegotiation
//   SB   = 250, 0xFA, // start of subnegotiation
//   WILL = 251, 0xFB,
//   WONT = 252, 0xFC,
//   DO   = 253, 0xFD,
//   DONT = 254, 0xFE,
//   IAC  = 255, 0xFF, // Interpret As Command
//   GMCP = 201, 0xC9  // GMCP sequence
// };

export default OPTS;
