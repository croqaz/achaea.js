import { expect, test } from 'bun:test';
import { cleanLogs } from '../achaea/logs/clean.ts';

test('test logs cleaning', () => {
  let txt = `(2023-11-09 12:12:12) :: <span class="ansi-green">4854h, </span><span class="ansi-green">5522m, </span><span class="ansi-green">18800e, </span><span class="ansi-green">20000w </span><span class="ansi-lightGray">ex-</span>


GMCP: Char.Vitals { "hp": "4854", "maxhp": "4854", "mp": "5522", "maxmp": "5522", "ep": "18800", "maxep": "18800", "wp": "20000", "maxwp": "20000", "nl": "45", "bal": "1", "eq": "1", "string": "H:4854/4854 M:5522/5522 E:18800/18800 W:20000/20000 NL:45/100 ", "charstats": [ "Bleed: 0", "Rage: 0", "epitaph_length: 0" ] }

You may apply another salve to yourself.



GMCP: Char.Afflictions.Add { "name": "transfixation", "cure": "WRITHE", "desc": "Being cacas prevents many actions." }



GMCP: Char.Vitals { "hp": "4854", "maxhp": "4854", "mp": "5522", "maxmp": "5522", "ep": "18800", "maxep": "18800", "wp": "20000", "maxwp": "20000", "nl": "45", "bal": "1", "eq": "1", "string": "H:4854/4854 M:5522/5522 E:18800/18800 W:20000/20000 NL:45/100 ", "charstats": [ "Bleed: 0", "Rage: 0", "epitaph_length: 0" ] }



<span class="ansi-cyan">
You have recovered balance on all limbs.
</span>

With blinding speed, A transfixes you with a swirling pattern of fire and air.`;
  let out = cleanLogs(txt);

  expect(out).toBe(
    `(2023-11-09 12:12:12) :: <span class="ansi-green">4854h, </span><span class="ansi-green">5522m, </span><span class="ansi-green">18800e, </span><span class="ansi-green">20000w </span><span class="ansi-lightGray">ex-</span>

GMCP: Char.Vitals { "hp": "4854", "maxhp": "4854", "mp": "5522", "maxmp": "5522", "ep": "18800", "maxep": "18800", "wp": "20000", "maxwp": "20000", "nl": "45", "bal": "1", "eq": "1", "string": "H:4854/4854 M:5522/5522 E:18800/18800 W:20000/20000 NL:45/100 ", "charstats": [ "Bleed: 0", "Rage: 0", "epitaph_length: 0" ] }

You may apply another salve to yourself.

GMCP: Char.Afflictions.Add { "name": "transfixation", "cure": "WRITHE", "desc": "Being cacas prevents many actions." }
GMCP: Char.Vitals { "hp": "4854", "maxhp": "4854", "mp": "5522", "maxmp": "5522", "ep": "18800", "maxep": "18800", "wp": "20000", "maxwp": "20000", "nl": "45", "bal": "1", "eq": "1", "string": "H:4854/4854 M:5522/5522 E:18800/18800 W:20000/20000 NL:45/100 ", "charstats": [ "Bleed: 0", "Rage: 0", "epitaph_length: 0" ] }

<span class="ansi-cyan">You have recovered balance on all limbs.</span>

With blinding speed, A transfixes you with a swirling pattern of fire and air.`,
  );
});
