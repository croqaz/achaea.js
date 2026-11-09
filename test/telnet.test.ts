import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import * as tel from '../achaea/telnet.ts';
import { Command } from '../achaea/telnet.ts';
import { loadTrace } from '../achaea/logs/trace.ts';
import ee from '../achaea/events/index.ts';

describe('parse telnet options', () => {
  test('a string', () => {
    const [opts, remaining] = tel.parse('this is a string');
    expect(opts).toEqual([{ type: 'string', text: 'this is a string' }]);
    expect(remaining).toEqual(Buffer.alloc(0));
  });

  test('a single option', () => {
    let [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.WILL, Command.ATCP]));
    expect(opts).toEqual([{ type: 'will', option: 'atcp' }]);
    expect(remaining).toEqual(Buffer.alloc(0));

    [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.GA]));
    expect(opts).toEqual([{ type: 'ga' }]);
    expect(remaining).toEqual(Buffer.alloc(0));

    // mixed text and option
    [opts, remaining] = tel.parse(
      Buffer.from([1, 2, 3, Command.IAC, Command.SB, 90, 1, 2, 3, Command.IAC, Command.SE, 1, 2, 3]),
    );
    expect(opts).toEqual([
      { type: 'String', text: '\u0001\u0002\u0003' },
      { type: 'sub', name: 'mxp', data: Buffer.from([1, 2, 3]) },
      { type: 'string', text: '\u0001\u0002\u0003' },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));

    [opts, remaining] = tel.parse(Buffer.from([98, Command.IAC, Command.SB, Command.GMCP, 97, Command.IAC, Command.SE, 99]));
    expect(opts).toEqual([
      { type: 'String', text: 'b' },
      { type: 'sub', name: 'gmcp', data: { module: 'a' } },
      { type: 'string', text: 'c' },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));
  });

  test('multiple options', () => {
    let [opts, remaining] = tel.parse(
      Buffer.from([
        Command.IAC,
        Command.WILL,
        Command.ATCP,
        Command.IAC,
        Command.WILL,
        Command.GMCP,
        Command.IAC,
        Command.WILL,
        Command.MXP,
      ]),
    );
    expect(opts).toEqual([
      { type: 'will', option: 'atcp' },
      { type: 'will', option: 'gmcp' },
      { type: 'will', option: 'mxp' },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));

    // <<IAC, WONT, COMPRESS, What password?\r\n, IAC, EOR, IAC, WILL, ECHO, IAC, WONT, ECHO, ex-, EOR>>
    const input = Buffer.from([
      Command.IAC,
      Command.WONT,
      Command.COMPRESS,
      87,
      104,
      97,
      116,
      32,
      112,
      97,
      115,
      115,
      119,
      111,
      114,
      100,
      63,
      13,
      10,
      32,
      Command.IAC,
      Command.EOR,
      Command.IAC,
      Command.WILL,
      Command.ECHO,
      Command.IAC,
      Command.WONT,
      Command.ECHO,
      101,
      120,
      45,
      Command.IAC,
      Command.EOR,
    ]);
    [opts, remaining] = tel.parse(input);
    expect(opts).toEqual([
      { type: 'wont', option: 'compress' },
      { type: 'String', text: 'What password?\r\n ' },
      { type: 'eor' },
      { type: 'will', option: 'echo' },
      { type: 'wont', option: 'echo' },
      { type: 'String', text: 'ex-' },
      { type: 'eor' },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));

    [opts, remaining] = tel.parse(
      'ÿúÉChar.StatusVars { "name": "Name", "fullname": "Full Name" }ÿðÿúÉChar.Status { "name": "X", "fullname": "X, of Y" }ÿð',
    );
    expect(opts).toEqual([
      {
        type: 'sub',
        name: 'gmcp',
        data: {
          data: {
            name: 'Name',
            fullname: 'Full Name',
          },
          module: 'char.statusvars',
        },
      },
      {
        type: 'sub',
        name: 'gmcp',
        data: {
          data: {
            name: 'X',
            fullname: 'X, of Y',
          },
          module: 'char.status',
        },
      },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));
  });

  test('incomplete options', () => {
    let [opts, remaining] = tel.parse(Buffer.from([Command.IAC]));
    expect(opts).toEqual([]);
    expect(remaining).toEqual(Buffer.from([Command.IAC]));

    [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.WILL, Command.GMCP, Command.IAC]));
    expect(opts).toEqual([{ type: 'will', option: 'gmcp' }]);
    expect(remaining).toEqual(Buffer.from([Command.IAC]));

    [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.WILL, Command.ATCP, Command.IAC, 251]));
    expect(opts).toEqual([{ type: 'will', option: 'atcp' }]);
    expect(remaining).toEqual(Buffer.from([Command.IAC, 251]));

    [opts, remaining] = tel.parse(Buffer.from([Command.IAC, 253]));
    expect(opts).toEqual([]);
    expect(remaining).toEqual(Buffer.from([Command.IAC, 253]));

    [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.SB, 70]));
    expect(opts).toEqual([]);
    expect(remaining).toEqual(Buffer.from([Command.IAC, Command.SB, 70]));

    [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.SB]));
    expect(opts).toEqual([]);
    expect(remaining).toEqual(Buffer.from([Command.IAC, Command.SB]));

    // text, then an incomplete command: the text is complete
    [opts, remaining] = tel.parse(Buffer.from([97, Command.IAC, Command.WILL]));
    expect(opts).toEqual([{ type: 'String', text: 'a' }]);
    expect(remaining).toEqual(Buffer.from([Command.IAC, Command.WILL]));

    // text, then a lone IAC: it could be IAC IAC (escaped text), so the text is not complete yet
    [opts, remaining] = tel.parse(Buffer.from([97, Command.IAC]));
    expect(opts).toEqual([{ type: 'string', text: 'a' }]);
    expect(remaining).toEqual(Buffer.from([Command.IAC]));
  });

  test('IAC IAC is an escaped 0xFF byte, not a command', () => {
    // a lone 0xFF is not valid UTF-8, so it decodes as U+FFFD; the point is: it doesn't stall the stream
    let [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.IAC]));
    expect(opts).toEqual([{ type: 'string', text: '�' }]);
    expect(remaining).toEqual(Buffer.alloc(0));

    [opts, remaining] = tel.parse(Buffer.from([97, Command.IAC, Command.IAC, 98, Command.IAC, Command.GA]));
    expect(opts).toEqual([{ type: 'String', text: 'a�b' }, { type: 'ga' }]);
    expect(remaining).toEqual(Buffer.alloc(0));

    // escaped byte, then an incomplete negotiation
    [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.IAC, Command.IAC, 253]));
    expect(opts).toEqual([{ type: 'String', text: '�' }]);
    expect(remaining).toEqual(Buffer.from([Command.IAC, 253]));

    // escaped bytes inside a sub-negotiation payload
    [opts, remaining] = tel.parse(
      Buffer.from([Command.IAC, Command.SB, Command.MXP, 1, Command.IAC, Command.IAC, 2, Command.IAC, Command.SE, 99]),
    );
    expect(opts).toEqual([
      { type: 'sub', name: 'mxp', data: Buffer.from([1, 255, 2]) },
      { type: 'string', text: 'c' },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));

    // escaped IAC right before the IAC SE must not be mistaken for the end
    [opts, remaining] = tel.parse(
      Buffer.from([Command.IAC, Command.SB, Command.MXP, Command.IAC, Command.IAC, Command.SE, Command.IAC, Command.SE]),
    );
    expect(opts).toEqual([
      {
        type: 'sub',
        name: 'mxp',
        data: Buffer.from([255, Command.SE]),
      },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));
  });

  test('empty sub-negotiation', () => {
    // IAC SB GMCP IAC SE used to be never recognized: it would stall the stream forever
    let [opts, remaining] = tel.parse(
      Buffer.from([Command.IAC, Command.SB, Command.ATCP, Command.IAC, Command.SE, 97, Command.IAC, Command.GA]),
    );
    expect(opts).toEqual([
      { type: 'sub', name: 'atcp', data: Buffer.alloc(0) },
      { type: 'String', text: 'a' },
      { type: 'ga' },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));

    [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.SB, Command.GMCP, Command.IAC, Command.SE]));
    expect(opts).toEqual([{ type: 'sub', name: 'gmcp', data: { module: '' } }]);
    expect(remaining).toEqual(Buffer.alloc(0));
  });

  test('unknown commands and options throw, they never stall the stream', () => {
    // IAC DM (Data Mark), IAC AYT, a stray IAC SE: Achaea never sends these
    expect(() => tel.parse(Buffer.from([Command.IAC, 242]))).toThrow('Unknown Telnet command: 242');
    expect(() => tel.parse(Buffer.from([Command.IAC, 246]))).toThrow('Unknown Telnet command: 246');
    expect(() => tel.parse(Buffer.from([Command.IAC, Command.SE]))).toThrow('Unknown Telnet command: 240');
    expect(() => tel.parse(Buffer.from([Command.IAC, 0]))).toThrow('Unknown Telnet command: 0');
    // unknown options, in a negotiation or a sub-negotiation
    expect(() => tel.parse(Buffer.from([Command.IAC, Command.WILL, 69]))).toThrow('Unknown Telnet option: 69');
    expect(() => tel.parse(Buffer.from([Command.IAC, Command.DOIT, 31]))).toThrow('Unknown Telnet option: 31');
    expect(() => tel.parse(Buffer.from([Command.IAC, Command.SB, 69, 1, Command.IAC, Command.SE]))).toThrow(
      'Unknown Telnet option: 69',
    );
  });

  test('room description split across 2 packets is ONE event for the triggers', () => {
    // The nasty bug fixed in 70fdcbc: a long room description arrives in 2 TCP packets,
    // the prompt (and IAC GA) only in the 2nd one. The triggers must see 1 complete text,
    // not 2 halves, so all the text in memory is flushed on the next IAC.
    const desc1 = 'Shallam Road before the city (road).\r\nThe road here is paved with ';
    const desc2 = 'white flagstones.\r\nYou see exits leading north and south.\r\n3500h, 3200m ex-';
    let [opts, remaining] = tel.parse(Buffer.from(desc1), true);
    // nothing complete yet: index.ts ignores the lowercase 'string'
    expect(opts).toEqual([{ type: 'string', text: desc1 }]);
    expect(remaining).toEqual(Buffer.alloc(0));

    [opts, remaining] = tel.parse(Buffer.concat([Buffer.from(desc2), Buffer.from([Command.IAC, Command.GA])]), true);
    expect(opts).toEqual([
      { type: 'String', text: desc1 + desc2 },
      {
        type: 'ga',
      },
    ]);
    expect(opts.filter((o) => o.type === 'String').length).toBe(1);
    expect(remaining).toEqual(Buffer.alloc(0));

    // same thing when the 2nd packet is terminated by GMCP instead of the prompt
    [opts] = tel.parse(Buffer.from(desc1), true);
    [opts] = tel.parse(
      Buffer.concat([
        Buffer.from(desc2),
        Buffer.from([Command.IAC, Command.SB, Command.GMCP]),
        Buffer.from('Core.Ping'),
        Buffer.from([Command.IAC, Command.SE]),
      ]),
      true,
    );
    expect(opts).toEqual([
      { type: 'String', text: desc1 + desc2 },
      { type: 'sub', name: 'gmcp', data: { module: 'core.ping' } },
    ]);
  });

  test('text split across many packets', () => {
    // A long game line arrives in 3 TCP packets, the prompt (IAC GA) only in the last one.
    // The middle packet used to overwrite the text of the first one.
    let [opts] = tel.parse(Buffer.from('The quick '), true);
    expect(opts).toEqual([{ type: 'string', text: 'The quick ' }]);
    [opts] = tel.parse(Buffer.from('brown fox '), true);
    expect(opts).toEqual([{ type: 'string', text: 'The quick brown fox ' }]);
    [opts] = tel.parse(Buffer.concat([Buffer.from('jumps.'), Buffer.from([Command.IAC, Command.GA])]), true);
    expect(opts).toEqual([
      {
        type: 'String',
        text: 'The quick brown fox jumps.',
      },
      { type: 'ga' },
    ]);
    // the text was consumed, it's not repeated in the next packet
    [opts] = tel.parse(Buffer.from([Command.IAC, Command.GA]), true);
    expect(opts).toEqual([{ type: 'ga' }]);
  });

  test('UTF-8 character split across packets', () => {
    // "ü" is C3 BC; a packet boundary in the middle of it must not garble the complete string
    let [opts] = tel.parse(Buffer.from([0xc3]), true);
    expect(opts).toEqual([{ type: 'string', text: '�' }]);
    [opts] = tel.parse(Buffer.from([0xbc, Command.IAC, Command.EOR]), true);
    expect(opts).toEqual([{ type: 'String', text: 'ü' }, { type: 'eor' }]);
  });

  test('GMCP sub-negotiation split byte by byte', () => {
    const msg = Buffer.concat([
      Buffer.from([Command.IAC, Command.SB, Command.GMCP]),
      Buffer.from('Core.Ping'),
      Buffer.from([Command.IAC, Command.SE, Command.IAC, Command.GA]),
    ]);
    const all: any[] = [];
    for (const byte of msg) {
      const [opts, remaining] = tel.parse(Buffer.from([byte]), true);
      all.push(...opts);
      expect(remaining.length).toBeLessThan(msg.length);
    }
    expect(all).toEqual([
      {
        type: 'sub',
        name: 'gmcp',
        data: { module: 'core.ping' },
      },
      { type: 'ga' },
    ]);
    // nothing left over
    const [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.NOP]), true);
    expect(opts).toEqual([{ type: 'nop' }]);
    expect(remaining).toEqual(Buffer.alloc(0));
  });

  test('handles midstream sub negotiation', () => {
    let [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.SB, 70, Command.ECHO]));
    expect(opts).toEqual([]);
    expect(remaining).toEqual(Buffer.from([Command.IAC, Command.SB, 70, Command.ECHO]));

    [opts, remaining] = tel.parse(
      Buffer.concat([Buffer.from('string'), Buffer.from([Command.IAC, Command.SB, 70, Command.ECHO])]),
    );
    expect(opts).toEqual([{ type: 'String', text: 'string' }]);
    expect(remaining).toEqual(Buffer.from([Command.IAC, Command.SB, 70, Command.ECHO]));
  });

  test('concat leftover from last packet', () => {
    let [opts, remaining] = tel.parse(
      'ÿúÉChar.Defences.List [ { "name": "boartattoo", "desc": "This tattoo will passively regenerate your health." } ]ÿðÿúÉChar.Defences.InfoList [ { "name": "deafness", "category": "general", "important": "1", "icon": "ear-deaf", "color": "green',
      true,
    );
    expect(opts).toEqual([
      {
        type: 'sub',
        name: 'gmcp',
        data: {
          module: 'char.defences.list',
          data: [
            {
              name: 'boartattoo',
              desc: 'This tattoo will passively regenerate your health.',
            },
          ],
        },
      },
    ]);

    [opts, remaining] = tel.parse(
      '" }, { "name": "mindseye", "category": "general", "important": "1", "icon": "podcast", "color": "purple" } ]ÿðÿúÉRoom.Info { "num": 2052, "name": "Shallam Road before the city (road)", "desc": "..", "area": "Targossas", "environment": "Road", "exits": { "s": 39635, "w": 2051 } }ÿðÿúÉRoom.Players [ { "name": "X", "fullname": "X, of Y" } ]ÿð',
      true,
    );
    expect(opts).toEqual([
      {
        name: 'gmcp',
        type: 'sub',
        data: {
          module: 'char.defences.infolist',
          data: [
            {
              category: 'general',
              color: 'green',
              icon: 'ear-deaf',
              important: '1',
              name: 'deafness',
            },
            {
              category: 'general',
              color: 'purple',
              icon: 'podcast',
              important: '1',
              name: 'mindseye',
            },
          ],
        },
      },
      {
        name: 'gmcp',
        type: 'sub',
        data: {
          module: 'room.info',
          data: {
            area: 'Targossas',
            desc: '..',
            environment: 'Road',
            exits: {
              s: 39635,
              w: 2051,
            },
            name: 'Shallam Road before the city (road)',
            num: 2052,
          },
        },
      },
      {
        name: 'gmcp',
        type: 'sub',
        data: {
          module: 'room.players',
          data: [
            {
              fullname: 'X, of Y',
              name: 'X',
            },
          ],
        },
      },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));
  });
});

describe('telnet response', () => {
  test('respond', () => {
    let [opts, _] = tel.parse(Buffer.from([Command.IAC, Command.GA]));
    expect(tel.prepareResponse(opts)).toEqual(Buffer.alloc(0));

    [opts, _] = tel.parse(Buffer.from([Command.IAC, Command.WILL, Command.ATCP]));
    expect(tel.prepareResponse(opts)).toEqual(Buffer.from([Command.IAC, Command.DOIT, Command.ATCP]));

    [opts, _] = tel.parse(Buffer.from([Command.IAC, Command.WILL, Command.GMCP]));
    expect(tel.prepareResponse(opts)).toEqual(Buffer.from([Command.IAC, Command.DOIT, Command.GMCP]));

    [opts, _] = tel.parse(
      Buffer.from([Command.IAC, Command.WILL, Command.ATCP, Command.IAC, Command.WILL, Command.GMCP, Command.GA]),
    );
    expect(tel.prepareResponse(opts)).toEqual(Buffer.from([Command.IAC, 253, Command.ATCP, Command.IAC, 253, Command.GMCP]));

    const input = Buffer.from([
      255, 252, 86, 87, 104, 97, 116, 32, 112, 97, 115, 115, 119, 111, 114, 100, 63, 13, 10, 32, 255, 239, 255, 251, 1, 255,
      252, 1, 101, 120, 45, 255, 239,
    ]);
    [opts, _] = tel.parse(input);
    expect(tel.prepareResponse(opts)).toEqual(Buffer.alloc(0));
  });

  test('every WILL gets an answer, every DO is refused', () => {
    // WILL MXP used to get no answer at all
    let [opts] = tel.parse(Buffer.from([Command.IAC, Command.WILL, Command.MXP]));
    expect(tel.prepareResponse(opts)).toEqual(Buffer.from([Command.IAC, Command.DONT, Command.MXP]));

    [opts] = tel.parse(Buffer.from([Command.IAC, Command.DOIT, Command.ECHO, Command.IAC, Command.DOIT, Command.GMCP]));
    expect(tel.prepareResponse(opts)).toEqual(
      Buffer.from([Command.IAC, Command.WONT, Command.ECHO, Command.IAC, Command.WONT, Command.GMCP]),
    );

    // acknowledgements and NOP are silently ignored
    [opts] = tel.parse(
      Buffer.from([
        Command.IAC,
        Command.DONT,
        Command.TTYPE,
        Command.IAC,
        Command.WONT,
        Command.COMPRESS,
        Command.IAC,
        Command.NOP,
      ]),
    );
    expect(opts).toEqual([
      { type: 'dont', option: 'term_type' },
      {
        type: 'wont',
        option: 'compress',
      },
      { type: 'nop' },
    ]);
    expect(tel.prepareResponse(opts)).toEqual(Buffer.alloc(0));
  });
});

describe('replay the captured login session', () => {
  // test/fixtures/achaea-login.bin: a real session captured with --trace (2026-10-20),
  // with the character name replaced. Every packet is replayed exactly as the server sent it.
  // WE NEVER connect to the real game for testing!
  const packets = loadTrace(path.join(import.meta.dir, 'fixtures', 'achaea-login.bin'));

  test('parses every packet, nothing left over at the end', () => {
    const all: any[] = [];
    let remaining = Buffer.alloc(0);
    let gmcp = 0;
    const onGmcp = () => gmcp++;
    ee.on('game:gmcp', onGmcp);
    try {
      for (const p of packets) {
        if (p.dir !== '<<') continue;
        let opts: any[];
        [opts, remaining] = tel.parse(p.data, true);
        all.push(...opts);
      }
    } finally {
      ee.off('game:gmcp', onGmcp);
    }
    expect(packets.filter((p) => p.dir === '<<').length).toBe(7);
    expect(remaining).toEqual(Buffer.alloc(0));

    // the greeting
    expect(all.slice(0, 6)).toEqual([
      { type: 'will', option: 'opt_eor' },
      { type: 'will', option: 'atcp' },
      { type: 'will', option: 'gmcp' },
      { type: 'will', option: 'compress' },
      { type: 'will', option: 'mssp' },
      { type: 'doit', option: 'term_type' },
    ]);
    // the server acknowledges our DONT MCCP2
    expect(all).toContainEqual({ type: 'wont', option: 'compress' });
    // password prompt: echo off, then on
    expect(all).toContainEqual({ type: 'will', option: 'echo' });
    expect(all).toContainEqual({ type: 'wont', option: 'echo' });

    // 12 GMCP messages, one of them (Room.Info) split across 2 TCP packets
    const subs = all.filter((o) => o.type === 'sub');
    expect(subs.length).toBe(12);
    expect(gmcp).toBe(12);
    expect(subs.map((o) => o.data.module)).toEqual([
      'client.map',
      'char.statusvars',
      'char.status',
      'char.skills.groups',
      'comm.channel.list',
      'ire.time.list',
      'char.afflictions.list',
      'char.defences.list',
      'char.defences.infolist',
      'client.map',
      'room.info',
      'room.players',
    ]);
    const room = subs.find((o) => o.data.module === 'room.info');
    expect(room.data.data.num).toBeNumber();
    expect(room.data.data.area).toBe('Cyrene');
    // every GMCP payload is valid JSON (no "GMCP parse error")
    for (const s of subs) {
      if (s.data.module !== 'core.ping') expect(s.data.data).toBeDefined();
    }

    // all the text is complete (terminated by GA/EOR), nothing is lost
    const text = all
      .filter((o) => o.type === 'String')
      .map((o) => o.text)
      .join('');
    expect(text).toContain('Rapture Runtime Environment');
    expect(text).toContain('What is your password?');
    expect(text).toContain('Password correct.');
  });

  test('the client answers the greeting correctly', () => {
    const [opts] = tel.parse(packets[0].data);
    const reply = tel.prepareResponse(opts);
    // this is what the client sent (the 2nd packet in the capture), except that
    // the capture was the "DO MSSP" experiment: the server never sent any MSSP data,
    // so the client went back to DONT MSSP
    expect(packets[1].dir).toBe('>>');
    const sent = Buffer.from(packets[1].data);
    const mssp = sent.indexOf(Buffer.from([Command.IAC, Command.DOIT, Command.MSSP]));
    expect(mssp).toBeGreaterThan(0);
    sent[mssp + 1] = Command.DONT;
    expect(reply).toEqual(sent);
  });
});

describe('parsing messages', () => {
  test('splits out the module from the data', () => {
    let result = tel.parseGMCP('Core.Ping');
    expect(result).toEqual({ module: 'core.ping' });

    result = tel.parseGMCP('Client.Map {"version":"1","url":"http://example.com/map.xml"}');
    expect(result).toEqual({
      module: 'client.map',
      data: { version: '1', url: 'http://example.com/map.xml' },
    });
  });

  test('handles bad JSON', () => {
    let result = tel.parseGMCP('Whatever {"');
    expect(result).toEqual({ module: 'whatever' });

    result = tel.parseGMCP('Whatever {"version"');
    expect(result).toEqual({ module: 'whatever' });

    result = tel.parseGMCP('Whatever {"version":"1');
    expect(result).toEqual({ module: 'whatever' });
  });
});

describe('MSSP (Mud Server Status Protocol)', () => {
  // The exact greeting Achaea sends on connect (captured 2026-10-20):
  // IAC WILL EOR, IAC WILL ATCP, IAC WILL GMCP, IAC WILL MCCP2, IAC WILL MSSP, IAC DO TTYPE, text, IAC GA
  // Before MSSP was known, the parser threw on byte 70 and the WHOLE packet
  // was lost, so none of the other options got a response either.
  // prettier-ignore
  const greeting = Buffer.concat([
    Buffer.from([
      0xff,
      0xfb,
      0x19,
      0xff,
      0xfb,
      0xc8,
      0xff,
      0xfb,
      0xc9,
      0xff,
      0xfb,
      0x56,
      0xff,
      0xfb,
      0x46,
      0xff,
      0xfd,
      0x18,
    ]),
    Buffer.from(
      "Rapture Runtime Environment v2.4.10 -- (c) 2026 -- Iron Realms Entertainment\r\r\n",
    ),
    Buffer.from([Command.IAC, Command.GA]),
  ]);

  test('parses the Achaea greeting', () => {
    const [opts, remaining] = tel.parse(greeting);
    expect(opts).toEqual([
      { type: 'will', option: 'opt_eor' },
      { type: 'will', option: 'atcp' },
      { type: 'will', option: 'gmcp' },
      { type: 'will', option: 'compress' },
      { type: 'will', option: 'mssp' },
      { type: 'doit', option: 'term_type' },
      {
        type: 'String',
        text: 'Rapture Runtime Environment v2.4.10 -- (c) 2026 -- Iron Realms Entertainment\r\r\n',
      },
      { type: 'ga' },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));
  });

  test('refuses MSSP and still answers all the other options', () => {
    const [opts] = tel.parse(greeting);
    expect(tel.prepareResponse(opts)).toEqual(
      Buffer.from([
        Command.IAC,
        Command.DOIT,
        Command.OEOR,
        Command.IAC,
        Command.DOIT,
        Command.ATCP,
        Command.IAC,
        Command.DOIT,
        Command.GMCP,
        Command.IAC,
        Command.DONT,
        Command.COMPRESS,
        Command.IAC,
        Command.DONT,
        Command.MSSP,
        Command.IAC,
        Command.WONT,
        Command.TTYPE,
      ]),
    );
  });

  test('parses MSSP sub-negotiation, if the server sends it anyway', () => {
    // IAC SB MSSP, VAR "NAME" VAL "Achaea", VAR "PLAYERS" VAL "123", VAR "CODEBASE" VAL "Rapture" VAL "2.4.10", IAC SE
    const input = Buffer.concat([
      Buffer.from([Command.IAC, Command.SB, Command.MSSP]),
      Buffer.from([1]),
      Buffer.from('NAME'),
      Buffer.from([2]),
      Buffer.from('Achaea'),
      Buffer.from([1]),
      Buffer.from('PLAYERS'),
      Buffer.from([2]),
      Buffer.from('123'),
      Buffer.from([1]),
      Buffer.from('CODEBASE'),
      Buffer.from([2]),
      Buffer.from('Rapture'),
      Buffer.from([2]),
      Buffer.from('2.4.10'),
      Buffer.from([Command.IAC, Command.SE]),
      Buffer.from('ex-'),
    ]);
    const [opts, remaining] = tel.parse(input);
    expect(opts).toEqual([
      {
        type: 'sub',
        name: 'mssp',
        data: {
          NAME: 'Achaea',
          PLAYERS: '123',
          CODEBASE: ['Rapture', '2.4.10'],
        },
      },
      { type: 'string', text: 'ex-' },
    ]);
    expect(remaining).toEqual(Buffer.alloc(0));
    // nothing to answer to a sub-negotiation
    expect(tel.prepareResponse(opts)).toEqual(Buffer.alloc(0));
  });

  test('parseMSSP edge cases', () => {
    expect(tel.parseMSSP(Buffer.alloc(0))).toEqual({});
    // value without a variable name is dropped
    expect(tel.parseMSSP(Buffer.from([2, 65]))).toEqual({});
    // variable without a value
    expect(tel.parseMSSP(Buffer.from([1, 65]))).toEqual({});
    expect(tel.parseMSSP(Buffer.from([1, 65, 2]))).toEqual({ A: '' });
  });
});
