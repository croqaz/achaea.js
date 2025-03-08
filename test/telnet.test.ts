import { expect, test, describe } from 'bun:test';
import * as tel from '../achaea/telnet.ts';
import { Command } from '../achaea/telnet.ts';

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

        [opts, remaining] = tel.parse(
            Buffer.from([98, Command.IAC, Command.SB, Command.GMCP, 97, Command.IAC, Command.SE, 99]),
        );
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
        let [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.IAC]));
        expect(opts).toEqual([]);
        expect(remaining).toEqual(Buffer.from([Command.IAC, Command.IAC]));

        [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.WILL, Command.GMCP, Command.IAC]));
        expect(opts).toEqual([{ type: 'will', option: 'gmcp' }]);
        expect(remaining).toEqual(Buffer.from([Command.IAC]));

        [opts, remaining] = tel.parse(
            Buffer.from([Command.IAC, Command.WILL, Command.ATCP, Command.IAC, 251]),
        );
        expect(opts).toEqual([{ type: 'will', option: 'atcp' }]);
        expect(remaining).toEqual(Buffer.from([Command.IAC, 251]));

        [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.IAC, Command.IAC, 253]));
        expect(opts).toEqual([]);
        expect(remaining).toEqual(Buffer.from([Command.IAC, Command.IAC, Command.IAC, 253]));

        [opts, remaining] = tel.parse(Buffer.from([Command.IAC, 253]));
        expect(opts).toEqual([]);
        expect(remaining).toEqual(Buffer.from([Command.IAC, 253]));

        [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.SB, 70]));
        expect(opts).toEqual([]);
        expect(remaining).toEqual(Buffer.from([Command.IAC, Command.SB, 70]));

        [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.SB]));
        expect(opts).toEqual([]);
        expect(remaining).toEqual(Buffer.from([Command.IAC, Command.SB]));

        [opts, remaining] = tel.parse(Buffer.from([Command.IAC, Command.IAC, Command.IAC, Command.SB]));
        expect(opts).toEqual([]);
        expect(remaining).toEqual(Buffer.from([Command.IAC, Command.IAC, Command.IAC, Command.SB]));
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
            Buffer.from([
                Command.IAC,
                Command.WILL,
                Command.ATCP,
                Command.IAC,
                Command.WILL,
                Command.GMCP,
                Command.GA,
            ]),
        );
        expect(tel.prepareResponse(opts)).toEqual(
            Buffer.from([Command.IAC, 253, Command.ATCP, Command.IAC, 253, Command.GMCP]),
        );

        const input = Buffer.from([
            255, 252, 86, 87, 104, 97, 116, 32, 112, 97, 115, 115, 119, 111, 114, 100, 63, 13, 10, 32, 255,
            239, 255, 251, 1, 255, 252, 1, 101, 120, 45, 255, 239,
        ]);
        [opts, _] = tel.parse(input);
        expect(tel.prepareResponse(opts)).toEqual(Buffer.alloc(0));
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
