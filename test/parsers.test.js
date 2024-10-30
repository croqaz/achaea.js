import { expect, test } from 'bun:test';
import * as p from '../achaea/parsers.ts';
import { mergeWhois } from '../achaea/extra/whois.ts';

test('survey test', () => {
  let result = p.parseSurvey(`You discern that you are in Mount Gheladan.
Your environment conforms to that of Urban.
You are in the Prime Material Plane.
This area seems suitable for one of your might.`);
  expect(result.area).toBe('Mount Gheladan');
  expect(result.plane).toBe('Prime Material Plane');
  expect(result.environment).toBe('Urban');

  result = p.parseSurvey(`You discern that you are in the Central Wilderness.
Your environment conforms to that of Constructed underground.
You are in the Prime Material Plane.
This area is fraught with peril for one such as you.
The Divine Order of Babel, God of Oblivion holds sovereignty over this area.
This locale has fallen under the influence of the Eldritch Empire of Ruin.`);
  expect(result.area).toBe('Central Wilderness');
  expect(result.plane).toBe('Prime Material Plane');
  expect(result.environment).toBe('Constructed underground');
});

test('maps test', () => {
  let result = p.validWildMap(`Grasslands.
.........................
.......................**
......................***
.....................****
....................*****
...................******
...................******
............@......******
...................******
.................********
................*********
...............**********
.............************
.............************
............*************
`);
  expect(result[1]).toBe('Grasslands.');

  result = p.validWildMap(`Small hills.
    wwww..@@@@@@@@@nnnnnMMMMM
    wwwww@@@@@@@@@nnnnnMMMMMM
    wwwww@@@@@@@@@nnnnMMMMMMM
    wwww@@@@@@@@@nnnnMMMMMMMM
    www@@@@@@@@@nnnnMMMMMMMMM
    ww@@@@@@@@@?nnnnMMMMMMMMM
    ww@@@@@@@@@@@nnnMMMMMMMMM
    ww@@@@@@@nnnnnnMMMMMMMMMM
    www.@@@@@nnnnnnMMMMMMMMMM
    .wwwww@@@nnnnnMMMMMMMMMMM
    www.......nnnnMMMMMMMMMMM
    www........nnnMMMMMMMMMMM
    IIIIIIIIII~~**.**********
    `);
  expect(result[1]).toBe('Small hills.');
  expect(result[0]).toContain('IIIIIII');

  result = p.validWildMap(`Upon a glacier.
     wwww.....@@@@@@@nnnnnnMM
    wwwww...@@@@@@@@@nnnnnMMM
    wwwww..@@@@@@@@@nnnnnnMMM
    wwwww..@@@@@@@@@nnnnnMMMM
    wwwwww@@@@@@@@@nnnnnMMMMM
    wwwwww@@@@@@@@@nnnnMMMMMM
    wwwww@@@@@@@@@nnnnMMMMMMM
    wwww@@@@@@@@@nnnnMMMMMMMM
    www@@@@@@@@@?nnnnMMMMMMMM
    www@@@@@@@@@@nnnnMMMMMMMM
    www@@@@@@@nnnnnnMMMMMMMMM
    wwww.@@@@@nnnnnnMMMMMMMMM
    w.wwwww@@@nnnnnMMMMMMMMMM
    wwww.......nnnnMMMMMMMMMM
    wwww........nnnMMMMMMMMMM
    www.........nnnnMMMMMMMMM
    www.........nnnnMMMMMMMMM`);
  expect(result[1]).toBe('Upon a glacier.');

  result = p.validWildMap(`
You enter the subdivision.
A cosy forest hollow.
    *^   *^*  Y,*|***|**Y
    ##^ * X * &Y,Y@*@Y**^
    ##^  ***  *X^    ****
    ..^   #  *^^^ *** ###
    YY*^###***^^^    *&&&
    YY*^ ; **^^^^^Y,*****
    YY*^^;^*^^@^^^Y,*****
    ..*^ ^ ^^^|^^XY,*****
    ||*^   ^^;# ;Y   *&&&
    ||*^ Y  ; X ;  *  ###
    ***^ ,,,|X \\|,,     ,
    ^^^^ X||/XX \\||X ****
       # *,/ *** \\,* **.*`);
  expect(result[1]).toBe('You enter the subdivision.\nA cosy forest hollow.');

  result = p.validWildMap(`<span class="c-yellow">Small hills.</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">www</span><span class="c-lightGray c-bright bg-lightGray">...@@@@@@@@@</span><span class="c-yellow">nnnnnMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">www</span><span class="c-lightGray c-bright bg-lightGray">..@@@@@@@@@</span><span class="c-yellow">nnnnnnMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">www</span><span class="c-lightGray c-bright bg-lightGray">..@@@@@@@@@</span><span class="c-yellow">nnnnnMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">wwww</span><span class="c-lightGray c-bright bg-lightGray">@@@@@@@@@</span><span class="c-yellow">nnnnnMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">wwww</span><span class="c-lightGray c-bright bg-lightGray">@@@@@@@@@</span><span class="c-yellow">nnnnMMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">www</span><span class="c-lightGray c-bright bg-lightGray">@@@@@@@@@</span><span class="c-yellow">nnnnMMMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">ww</span><span class="c-lightGray c-bright bg-lightGray">@@@@@@@@@</span><span class="c-yellow">nnnnMMMMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">w</span><span class="c-lightGray c-bright bg-lightGray">@@@@@@@@@?</span><span class="c-yellow">nnnnMMMMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">w</span><span class="c-lightGray c-bright bg-lightGray">@@@@@@@@@@</span><span class="c-yellow">n</span><span class="c-lightGray c-bright">@</span><span class="c-yellow">nnMMMMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">w</span><span class="c-lightGray c-bright bg-lightGray">@@@@@@@</span><span class="c-yellow">nnnnnnMMMMMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">ww</span><span class="c-lightGray c-bright bg-lightGray">.@@@@@</span><span class="c-yellow">nnnnnnMMMMMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">wwwww</span><span class="c-lightGray c-bright bg-lightGray">@@@</span><span class="c-yellow">nnnnnMMMMMMMMMMMM</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">ww</span><span class="c-lightGray c-bright bg-lightGray">.......</span><span class="c-yellow">nnnnMMMMMMMMMMMn</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">ww</span><span class="c-lightGray c-bright bg-lightGray">........</span><span class="c-yellow">nnnMMMMMMMMMMMn</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">w</span><span class="c-lightGray c-bright bg-lightGray">.........</span><span class="c-yellow">nnnnMMMMMMMMMMn</span><span class="c-lightGray">
    </span><span class="c-cyan bg-blue">w</span><span class="c-lightGray c-bright bg-lightGray">.........</span><span class="c-yellow">nnnnMMMMMMMMMnn</span><span class="c-lightGray">
    </span><span class="c-lightGray c-bright bg-lightGray">...........</span><span class="c-yellow">nnnMMMMMMMMMnn</span><span class="c-lightGray">
    Weathered and grass-clad, these hills sweep across the land like the bones of giants.</span>`);
  expect(result[1]).toContain('Small hills');
  expect(result[1]).toContain(
    'Weathered and grass-clad, these hills sweep across the land like the bones of giants',
  );

  // Negative testing
  result = p.validWildMap(`Proprietor: Rurin, the Crafter.
--------(Item)------(Description)------------------------------(Stock)--(Price)
           bowl6260 an earthenware bowl                            20     100gp
        redink13226 a red ink                                     500      20gp
         sigil13396 a key-shaped sigil                             50    1250gp
        shovel18633 a hefty shovel                                 10     750gp
       journal24167 a personal journal                             10    5000gp
        bucket24713 a bucket                                       49      50gp
          drum35641 a ritual drum                                  50     500gp
      backpack54217 a canvas backpack                              20     100gp
         sigil55060 a flame-shaped sigil                           45     700gp
          dust63478 a pinch of diamond dust                       200      85gp
       blueink67136 a blue ink                                    300      40gp
     purpleink75847 a purple ink                                  300     250gp
     yellowink77165 a yellow ink                                  500      80gp`);
  expect(result).toBeFalsy();

  result = p.validWildMap(`Shoreline.
    w.........ww.wwww........
    wwww..wwwwww..wwww......!`);
  expect(result).toBeFalsy();

  result = p.validWildMap(`Shoreline.
w.........ww.wwww........
wwww..wwwwww..wwww......`);
  expect(result).toBeFalsy();

  result = p.validWildMap(`Shoreline.
w.........ww.wwww........
wwww..wwwwww..wwww......0`);
  expect(result).toBeFalsy();
});

test('honours test', () => {
  let result = p.parseHonours(`Abc, Founder of Xyz (male Rajamala).
He is 719 years old, having been born on the 8th of Phaestian, 204 years after the fall of the Seleucarian Empire.
He is unranked in Achaea.
He is an extremely credible character.
He is not known for acts of infamy.
He is a Praetor in Ashtan.
He is a member of the Monk class.
He is considered to be approximately 4% of your might.
He is a mentor and able to take on proteges.
His warcry: 'My greatest strength is that I have no weakness!'`);
  expect(result.fullname).toBe('Abc, Founder of Xyz');
  expect(result.city).toBe('Ashtan');
  expect(result.class).toBe('Monk');
  expect(result.sex).toBe('male');
  expect(result.race).toBe('Rajamala');
  expect(result.age).toBe(719);

  result = p.parseHonours(`Qaz Wsx (male Tash'la).
His date of birth is hidden by the sand of Aeon.
He is ranked 131st in Achaea.
He is a member of the Ivory Mark.
He is a Citizen in Cyrene.
He is a Vashnarian Defender(5) in the army of Cyrene.
He is a member of the Runewarden class.
He is considered to be approximately 5% of your might.
He is a mentor and able to take on proteges.
He bears the arms: Or, a feather Sanguine.`);
  expect(result.fullname).toBe('Qaz Wsx');
  expect(result.city).toBe('Cyrene');
  expect(result.class).toBe('Runewarden');
  expect(result.mark).toBe('Ivory Mark');
  expect(result.sex).toBe('male');
  expect(result.race).toBe("Tash'la");
  expect(result.age).toBeFalsy();

  result = p.parseHonours(`Edc Ert (female Elder Black Dragon).
She is 374 years old, having been born on the 1st of Glacian, 550 years after the fall of the Seleucarian Empire.
She is ranked 70th in Achaea.
She is a Vanguard in Targossas.
She is a member of the Runewarden class.
She is considered to be approximately 2% of your might.
She is a mentor and able to take on proteges.`);
  expect(result.fullname).toBe('Edc Ert');
  expect(result.city).toBe('Targossas');
  expect(result.class).toBe('Runewarden');
  expect(result.sex).toBe('female');
  expect(result.race).toBe('Elder Black Dragon');
  expect(result.age).toBe(374);

  result = p.parseHonours(`Bun Black (male Tsol'aa).
Faes date of birth is hidden by the sand of Aeon.
Fae is ranked 220th in Achaea.
Fae is a member of the Quisalis Mark.
Fae is a Burgher in Hashan.
Fae is a Marshal of Darkness(5) in the army of Hashan.
Fae is a formal ally of the Just Territories of Cyrene.
Fae is a member of the Psion class.
Fae is considered to be approximately 5% of your might.
Fae is a mentor and able to take on proteges.`);
  expect(result.fullname).toBe('Bun Black');
  expect(result.city).toBe('Hashan');
  expect(result.class).toBe('Psion');
  expect(result.mark).toBe('Quisalis Mark');
  expect(result.sex).toBe('male');
  expect(result.race).toBe("Tsol'aa");
  expect(result.age).toBeFalsy();

  result = p.parseHonours(`Undead Drudge Eolnys (male Undead).
He is 99 years old, having been born on the 4th of Aeguary, 909 years after the fall of the Seleucarian Empire.
He is unranked in Achaea.
He is an extremely credible character.
He is not known for acts of infamy.
He is a Profane Warrior in The underworld.
He is considered to be approximately 4% of your might.`);
  expect(result.fullname).toBe('Undead Drudge Eolnys');
  expect(result.sex).toBe('male');
  expect(result.race).toBe('Undead');
  expect(result.age).toBe(99);
});

test('parse wares', () => {
  const txt = `Proprietor: Rurin, the Crafter.
--------(Item)------(Description)------------------------------(Stock)--(Price)
          vial11678 a caloric salve (oaken vial)                   20    1400gp
          vial11681 an elixir of mana (oaken vial)                 20     600gp
          vial12312 an oaken vial                                 500     300gp
          vial43195 a black-walnut vial                           500     300gp
         sigil11843 a flame-shaped sigil                           20     700gp
         sigil12099 a key-shaped sigil                             20    1250gp
         sigil12388 a fist-shaped sigil                            20     700gp
         sigil13365 a monolith sigil                               20    1700gp
       blueink13896 a blue ink                                    300      40gp
      stencil495327 a blank tattoo stencil                        999      25gp`;

  expect(p.isWaresHeader(txt)).toBeTruthy();
  expect(p.getWaresProprietor(txt)).toEqual({ owner: 'Rurin, the Crafter' });

  const wares = p.parseWares(txt);
  expect(wares.length).toBe(10);
  expect(wares[0].id).toBe('vial11678');
  expect(wares[0].stock).toBe(20);
  expect(wares[0].price).toBe(1400);

  expect(wares[2].name).toBe('an oaken vial');
  expect(wares[2].stock).toBe(500);
  expect(wares[2].price).toBe(300);

  expect(wares.at(-1).id).toBe('stencil495327');
  expect(wares.at(-1).stock).toBe(999);
  expect(wares.at(-1).price).toBe(25);
});

test('parse elix-list', () => {
  const result = p.parseElixList(
    `Vial                          Fluid                          Sips     Months
-------------------------------------------------------------------------------
Ruby vial483025               an elixir of health            46       ---
Amethyst vial49253            a salve of mending             155      ---
Vial58044                     an epidermal salve             178      138
A cherry'Wooden vial23053689  an elixir of immunity          183      138
Vial133393                    an elixir of levitation        195      138
Moonstone vial362096          a caloric salve                139      ---
Oak-oak-crap vial574352       an elixir of mana              190      119
Ebony vial574305              a salve of restoration         200      119

random broken thingie       x random stuff y                 999      123
random broken thingie        a salve of restoration          abc
random broken thingie        a salve of restoration yes
-------------------------------------------------------------------------`,
  );

  expect(result.length).toBe(8);
  expect(result[0].vial).toBe('Ruby vial483025');
  expect(result[0].fluid).toBe('an elixir of health');
  expect(result[0].type).toBe('health');
  expect(result[0].sips).toBe(46);
  expect(result.map((x) => x.type)).toEqual([
    'health',
    'mending',
    'epidermal',
    'immunity',
    'levitation',
    'caloric',
    'mana',
    'restoration',
  ]);
});

test('parse plants', () => {
  const result = p.parsePlants(`The following plants are growing in this room:
  A weird thing (thing)                        Abundant
  A myrrh bush (myrrh)                         Abundant
  A purple coneflower (echinacea)              Plentiful
  A lobelia wildflower (lobelia)               Sparse
  A wild ginger plant (ginger)                 Abundant
  A ginseng plant (ginseng)                    Plentiful
  A red elm tree (elm)                         Plentiful
  An olive tree (olive)                        Abundant
  A cacao tree (cacao)                         Abundant`);

  expect(result.gather.length + result.harvest.length).toBe(8);
  expect(result.gather).toEqual(['olive', 'cacao']);
});

test('parse minerals', () => {
  const result = p.parseMinerals(`You spot the following minerals here:
  Azurite                                      Abundant
  Gypsum                                       Abundant
  Unobtainium                                  Sparse`);
  expect(result.extract).toEqual(['azurite', 'gypsum']);
});

test('parse quick who', () => {
  const result = p.parseQuickWho(`Aishu, Amranu,
Khadafi, Kilian,
Talysin, and Zadkiel.
Plus another 7 whose presence you cannot fully sense (47 total).`);
  expect(result).toEqual(['Aishu', 'Amranu', 'Khadafi', 'Kilian', 'Talysin', 'Zadkiel']);
});

test('merge whois info', () => {
  let u1 = { id: 'A', name: 'A', city: 'C1', house: 'H1', level: '50', class: 'runewarden,Runewarden' };
  let u2 = { id: 'A', name: 'A', city: 'C2', house: 'H2', level: '51', class: 'Psion,psion' };
  let merged = mergeWhois(u1, u2);
  expect(merged.id).toBe('A');
  expect(merged.city).toBe('C2');
  expect(merged.house).toBe('H2');
  expect(merged.class).toEqual(['runewarden', 'psion']);

  u1 = { id: 'A', name: 'A', level: '50', race: 'human,Human' };
  u2 = { id: 'A', name: 'A', level: '51', race: 'Dwarf,dwarf' };
  merged = mergeWhois(u1, u2);
  expect(merged.race).toBe('human,dwarf');
});
