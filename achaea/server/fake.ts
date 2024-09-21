import { black, blue, darkGray, green, lightGray, red, white } from 'ansicolor';

import ee from '../events/index.ts';
import ansiToHtml from '../core/ansi.ts';

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

export default async function fakeEvents() {
  console.log('Will start sending FAKE events...');
  await sleep(5);
  console.log('Sending FAKE events...');

  ee.emit('user:text', '$ password');
  ee.emit('game:html', 'Welcome to Achaea.');

  ee.emit('game:html', ansiToHtml(red('This is color red.')));
  ee.emit('game:html', ansiToHtml(green('This is color green.')));
  ee.emit('game:html', ansiToHtml(blue('This is color blue.')));

  await sleep(0.1);
  ee.emit('game:html', ansiToHtml(black('This is color black.')));
  ee.emit('game:html', ansiToHtml(white('This is color white.')));
  ee.emit('game:html', ansiToHtml(lightGray('This is light gray.')));
  ee.emit('game:html', ansiToHtml(darkGray('This is dark gray.')));

  await sleep(0.1);
  ee.emit('sys:text', `<i class="ansi-darkGray"><b>[DB]</b> 6789 entries saved in WARES.</i>`);
  ee.emit('sys:text', `<i class="ansi-darkGray"><b>[DB]</b> 0123 entries saved in WHOIS.</i>`);

  await sleep(0.5);
  ee.emit('user:text', 'User text');
  ee.emit('user:text', 'TEST ligatures: fi, ffi, th ...');
  ee.emit('user:text', 'TEST ligatures: find fluffy jello ...');

  ee.emit(
    'game:gmcp',
    `Char.Status {
      "name": "Sarapis", "fullname": "Sarapis the Logos", "age": "999", "race": "God", "level": "999 (99%)", "xp": "99%", "xprank": "1",
      "class": "Druid", "city": "Eleusis (1)", "house": "(None)", "order": "(None)", "boundcredits": "68", "unboundcredits": "0",
      "lessons": "0", "explorerrank": "a Vagabond", "mayancrowns": "0", "boundmayancrowns": "0", "gold": "162", "bank": "0",
      "unread_news": "43658", "unread_msgs": "0", "target": "None", "gender": "male"
    }`,
  );
  ee.emit('game:gmcp', `Char.Afflictions.List [  ]`);
  ee.emit(
    'game:gmcp',
    `Char.Defences.List [
      { "name": "boartattoo", "desc": "This tattoo will passively regenerate your health." }
    ]`,
  );

  ee.emit(
    'game:gmcp',
    `IRE.Time.Update {
    "day": "6", "mon": "3", "month": "Glacian", "year": "955", "hour": "11",
    "time": "Dusk has overtaken the light in Achaea.", "moonphase": "Waxing Crescent"
  }`,
  );

  ee.emit(
    'game:html',
    ansiToHtml(`Room Descriptions:
[37mRoom_Title     [33m  3   0  [37m[33mOutside the Cave.
[37mRoom_Desc      [33m  7   0  [37mThe trees loom above you...\n`),
  );

  ee.emit(
    'game:html',
    ansiToHtml(`Things         [33m  6   0  [37m[36mA squirrel scampers about here.
[37mPlants         [33m  5   0  [37m[35mA lobelia wildflower is growing here.
[37mPlayers        [33m 14   0  [37m[1;36mMaya, the Great Mother, is here.
[0;37mExits          [33m  3   0  [37m[33mYou see exits to the north and east.
[37m[34m-------------------------------------------------------------------------------\n`),
  );

  // Node.js ANSI
  await sleep(0.5);
  ee.emit(
    'game:html',
    ansiToHtml(`
Your current colour configuration is as follows:
Channel        FG BG  Sample
[34m-------------------------------------------------------------------------------
[37m[32mSpecial:
[37mH1             [33m 11   0  [37m[1;33mThis is an H1 header.
[0;37mH2             [33m  3   0  [37m[33mThis is an H2 header.
[37mH3             [33m  2   0  [37m[32mThis is an H3 header.
[37mH4             [33m  6   0  [37m[36mThis is an H4 header.
[37mDeathsight     [33m  7   0  [37mGronk has been slain by the might of a baby rat.
Balance        [33m  6   0  [37m[36mYou have recovered balance on all limbs.
[37mAffmessages    [33m  9   0  [37m[1;31mYou have been afflicted with paralysis.
[0;37m
[32mCommunication:
[37mSays           [33m 14   0  [37m[1;36mYou say, "Blah."
[0;37mShouts         [33m  6   0  [37m[36mYou shout, "Blah."
[37mTells          [33m 11   0  [37m[1;33mYou tell Epicurus, "Blah."
[0;37mHNT            [33m  5   0  [37m[35m(Newcomer): You say, "Blah."
[37mHT             [33m  5   0  [37m[35m(House): You say, "Blah."
[37mCitytells      [33m  5   0  [37m[35m(City): You say, "Blah."
[37mOrdertells     [33m  5   0  [37m[35m(Order): You say, "Blah."
[37mNewbie         [33m  7   0  [37m(Newbie): You say, "Blah."
Emotes         [33m 14   0  [37m[1;36mAeyr waves hello.
[0;37mArenatells     [33m 15   8  [37m[1;37m(&lt;team name>): You say, "Blah."
[0;37mMarket         [33m  8   0  [37m[1;30m(Market): You say, "Blah."
[0;37mPartytells     [33m 13   0  [37m[1;35m(Party): You say, "Blah."
[0;37mIntrepid       [33m  7   0  [37m(Intrepid): You say, "Blah."
Armytells      [33m 15   8  [37m[1;37m(Army): You say, "Blah."
[0;37mGrouptells     [33m 13   0  [37m[1;35m(Group): You say, "Blah."
[0;37mRiddletalk     [33m  8   0  [37m[1;30m(Riddletalk): Glemfry says, "I win!"
[0;37mShipRace       [33m  8   0  [37m[1;30m(ShipRace): Schlomo says, "Oyvast!"
[0;37mClassleads     [33m  7   0  [37m(Classleads): A report has changed.
Ideas          [33m  7   0  [37m(Ideas): A new idea has been submitted.
Lethals        [33m  9   0  [37m[1;31mSomeone is trying to kill you.
[0;37mCac            [33m  7   0  [37m(Cyrenian Academy of Combat): You say, "Blah."
KongolDrak     [33m  7   0  [37m(Dwarves of Kongol Drak): You say, "Blah."
Messages       [33m  7   0  [37mYou just received message #666 from Sartan.
Mail_Messages  [33m  7   0  [37mA dove comes flying into the room...
News_Messages  [33m  7   0  [37mA new article has been posted on the...
Rage_Messages  [33m  7   0  [37mYou can use battlerage ability #1 again.
[32m
Room Descriptions:
[37mRoom_Title     [33m  3   0  [37m[33mOutside the Cave.
[37mRoom_Desc      [33m  7   0  [37mThe trees loom above you...
Things         [33m  6   0  [37m[36mA squirrel scampers about here.
[37mPlants         [33m  2   0  [37m[32mA lobelia wildflower is growing here.
[37mPlayers        [33m 14   0  [37m[1;36mMaya, the Great Mother, is here.
[0;37mExits          [33m  3   0  [37m[33mYou see exits to the north and east.
[37m[34m-------------------------------------------------------------------------------
[37mAvailable Colours:
FG:[30m 0[37m[31m 1[37m[32m 2[37m[33m 3[37m[34m 4[37m[35m 5[37m[36m 6[37m 7[1;30m 8[0;37m[1;31m 9[0;37m[1;32m 10[0;37m[1;33m 11[0;37m[1;34m 12[0;37m[1;35m 13[0;37m[1;36m 14[0;37m[1;37m 15[0;37m
BG:[30m 0[37m[31m 1[37m[32m 2[37m[33m 3[37m[34m 4[37m[35m 5[37m[36m 6[37m 7
To set a channel, enter CONFIG COLOUR <channel> <fg#> [bg#]
To restore the defaults, enter CONFIG COLOUR DEFAULT
`),
  );

  await sleep(0.5);
  ee.emit(
    'game:html',
    ansiToHtml(`Proprietor: Lady Bambi Peaceful Dragon.
[36m--------([33mItem[36m)------([33mDescription[36m)------------------------------([33mStock[36m)--([33mPrice[36m)
[37m[1;32m[0;37m[1;32m[0;37m[1;32m[0;37m[1;32m[0;37m[1;32m[0;37m[1;32m[0;37m[32m       shield230957[37m a dented hefty kite shield                      1    5000[1;33mgp[0;37m
[33m                    Cutting%    7;  Blunt%   13;  Magic%  n/a[37m
[32m       shield397695[37m an ordinary rustic banded shield                1    5000[1;33mgp[0;37m
[33m                    Cutting%    8;  Blunt%    8;  Magic%  n/a[37m
[32m       shield353827[37m a balanced barbed cavalry shield                1    5000[1;33mgp[0;37m
[33m                    Cutting%    4;  Blunt%    5;  Magic%  n/a[37m
[32m       shield169335[37m a solid unadorned cavalry shield                1    5000[1;33mgp[0;37m
[33m                    Cutting%    4;  Blunt%    4;  Magic%  n/a[37m`),
  );

  let dayNight = 1;
  let userTextNo = 1;
  setInterval(() => {
    ee.emit('user:text', `User text ${userTextNo}`);
    ee.emit('game:gmcp', `IRE.Time.Update { "daynight": "${dayNight}" }`);
    userTextNo++;
    dayNight += 4;
    if (dayNight > 199) dayNight = 1;
  }, 2500);

  let fakeHP = 1500;
  let hpGrowing = false;
  let fakeMP = 100;
  let mpGrowing = true;
  setInterval(() => {
    ee.emit(
      'game:gmcp',
      `Char.Vitals {
      "hp": "${fakeHP}", "maxhp": "1500", "mp": "${fakeMP}", "maxmp": "1200",
      "ep": "3800", "maxep": "3800", "wp": "3545", "maxwp": "3545", "nl": "66",
      "bal": "1", "eq": "1", "string": "H:1150/1150 M:1099/1099 E:3800/3800 W:3545/3545 NL:66/100 ",
      "charstats": [ "Bleed: 0", "Rage: 0", "Morph: None" ]
    }`,
    );

    if (hpGrowing) fakeHP = fakeHP + 100;
    else fakeHP = fakeHP - 100;
    if (fakeHP === 100 || fakeHP === 1500) hpGrowing = !hpGrowing;

    if (mpGrowing) fakeMP = fakeMP + 100;
    else fakeMP = fakeMP - 100;
    if (fakeMP === 100 || fakeMP === 1200) mpGrowing = !mpGrowing;
  }, 2000);

  await sleep(0.33);
  ee.emit(
    'game:gmcp',
    `Room.Info { "area":"the presence of the Divine", "coords":"",
    "desc":"Only perceivable by a deity, this is where dead mortals with middling belief levels go to be resurrected in the glorious presence of Ugrach, The Finality.",
    "details":["indoors"], "environment":"Nothing", "exits":{"out":1231}, "name":"Before the throne of Death (indoors)", "num":7 }`,
  );

  await sleep(0.33);
  ee.emit(
    'game:gmcp',
    `Room.Info { "num": 437, "name": "Parade of Zarathustra before the main gate",
    "desc": "Here at the heart of the grand square that stands before Ashtan's gates, the aged cobble streets continue in a multitude of directions..",
    "area": "Ashtan", "environment": "Urban", "coords": "49,4,-12,0", "details": [], "exits": {"n": 438, "e": 447, "s": 436, "w": 446} }`,
  );

  await sleep(0.1);
  ee.emit('game:gmcp', `Room.Players [ { "name": "Sarapis", "fullname": "Sarapis the Logos" } ]`);

  await sleep(0.1);
  ee.emit(
    'game:gmcp',
    `Char.Items.List {
      "location": "room", "items": [
      { "id": "357858", "name": "a runic totem", "icon": "rune" },
      { "id": "619865", "name": "a monolith sigil", "icon": "rune", "attrib": "t" },
      { "id": "131221", "name": "a lavishly gilded pet cage", "icon": "container" },
      { "id": "623144", "name": "a logosmas stocking", "icon": "lamp" },
      { "id": "7220", "name": "a sturdy iron forge", "icon": "container" },
      { "id": "41165", "name": "Modron, the Blacksmith", "icon": "humanoid", "attrib": "m" },
      { "id": "130", "name": "the pixie shaman", "icon": "magical", "attrib": "m" },
      { "id": "137499", "name": "an indigo nightfire butterfly", "icon": "animal", "attrib": "m" }
    ] }`,
  );

  const ROOMS = [
    `Room.Info { "num": 451, "name": "Southeast of Central Market",
      "desc": "Stalls bearing all varieties of goods threaten to overfill and spill into the milling throng of people.",
      "area": "Ashtan", "environment": "Urban", "details": [], "exits": { "n": 452, "e": 5438, "s": 450, "w": 456, "nw": 455 } }`,
    `Room.Info { "num": 450, "name": "Southern corner of the Merchant's Quarter",
      "desc": "A small wooden stage in this corner of the marketplace stands ready for the use of street buskers and would-be politicians.",
      "area": "Ashtan", "environment": "Urban", "details": [], "exits": { "n": 451, "e": 7690, "se": 446, "s": 5529, "w": 8003 } }`,
    `Room.Info { "num": 446, "name": "Entry to the Merchant's Quarter",
      "desc": "As the prime commercial area of Ashtan, the Merchant's Quarter is always busy.",
      "area": "Ashtan", "environment": "Urban", "details": [], "exits": { "ne": 438, "e": 437, "se": 436, "nw": 450, "u": 37631 } }`,
    `Room.Info { "num": 436, "name": "Entering the main gate of Ashtan",
      "desc": "The world of people abruptly replaces the world of plains here, at the entrance to the city of Ashtan.",
      "area": "Ashtan", "environment": "Urban", "details": [ "subdivision" ], "exits": { "n": 437, "ne": 447, "s": 1284, "nw": 446 } }`,
  ];

  // auto-move
  let roomNo = 0;
  let roomGrowing = true;
  setInterval(() => {
    ee.emit('game:gmcp', ROOMS[roomNo]);
    if (roomGrowing) roomNo++;
    else roomNo--;
    if (roomNo === 0 || roomNo === ROOMS.length - 1) roomGrowing = !roomGrowing;
  }, 2100);

  // add & remove players & items
  setInterval(async () => {
    ee.emit(
      'game:gmcp',
      `Room.AddPlayer {
        "name": "Proficy", "fullname": "Proficy Ikari"
      }`,
    );
    ee.emit(
      'game:gmcp',
      `Char.Items.Add {
        "location": "room", "item": { "id": "99123", "name": "Ruffian, an Infernal dingo", "icon": "fiend", "attrib": "mx"
      } }`,
    );
    ee.emit(
      'game:gmcp',
      `Char.Items.Add {
        "location": "room", "item": { "id": "99234", "name": "a Baalzadeen", "icon": "fiend", "attrib": "m"
      } }`,
    );

    await sleep(2.75);
    ee.emit('game:gmcp', `Room.RemovePlayer "Proficy"`);
    ee.emit(
      'game:gmcp',
      `Char.Items.Remove {
        "location": "room", "item": { "id": "99123", "name": "Ruffian, an Infernal dingo", "icon": "fiend", "attrib": "mx"
      } }`,
    );
    ee.emit(
      'game:gmcp',
      `Char.Items.Remove {
        "location": "room", "item": { "id": "99234", "name": "a Baalzadeen", "icon": "fiend", "attrib": "m"
      } }`,
    );
  }, 7250);

  await sleep(0.25);
  ee.emit(
    'game:gmcp',
    `Char.Afflictions.Add {
      "name": "prone", "cure": "STAND", "desc": "Being knocked prone can cause..."
    }`,
  );

  await sleep(0.25);
  ee.emit(
    'game:gmcp',
    `Char.Defences.Add {
      "name": "weathering", "desc": "Weathering increases your constitution..."
    }`,
  );

  await sleep(0.25);
  ee.emit('game:gmcp', `Char.Afflictions.Remove [ "prone" ]`);

  await sleep(0.25);
  ee.emit(
    'game:gmcp',
    `Char.Afflictions.Add {
      "name": "prone", "cure": "STAND", "desc": "Being knocked prone can cause..."
    }`,
  );

  await sleep(0.25);
  ee.emit(
    'game:gmcp',
    `Char.Defences.Add {
      "name": "selfishness", "desc": "Selfishness prevents you from giving away items."
    }`,
  );

  await sleep(0.25);
  ee.emit('game:gmcp', `Char.Defences.Remove [ "selfishness" ]`);

  await sleep(0.5);
  ee.emit(
    'game:gmcp',
    `Comm.Channel.Text {
      "channel": "says", "talker": "Liirup the Placid", "text": "Liirup says, \\"Dead rats. Truly, is there anything tastier in this entire, wonderful world?\\""
    }`,
  );

  await sleep(0.5);
  ee.emit(
    'game:gmcp',
    `Comm.Channel.Text {
      "channel": "tell Certimene876", "talker": "Certimene",
      "text": "Certimene tells you, \\"Greetings! Are you looking to make a change? I can help you into a new class once you have QUIT your current class, if that's your aim!\\""
    }`,
  );

  let sayMsgNo = 1;
  setInterval(() => {
    ee.emit(
      'game:gmcp',
      `Comm.Channel.Text { "channel": "says", "talker": "Abc",
      "text": "You say, \\"Hello ${sayMsgNo}.\\"" }`,
    );
    sayMsgNo++;
  }, 3500);
}
