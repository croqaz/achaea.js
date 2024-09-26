import * as map from './map.js';
window.BATTLE = { tgtID: null };
const ASCII_INPUT = /^[/'"0-9a-z]$/i;

window.addEventListener('load', function () {
  const history = restoreHistory();
  let historyIndex = history.length - 1;

  const gameLog = document.getElementById('gameLog');
  const userInput = document.getElementById('userInput');

  const mapElem = document.getElementById('map');
  const rightElem = document.getElementById('rightSide');

  startWS();

  (async function mapData() {
    // warmup on page refresh
    const data = await map.fetchRoom();
    await map.fetchMap(data);
  })();

  document.body.onkeydown = function (ev) {
    // console.log(ev);
    // Full expand map
    if (ev.ctrlKey && ev.key === 'm') {
      if (rightElem.classList.contains('big')) {
        rightElem.classList.toggle('big');
      }
      mapElem.classList.toggle('big');
      // Force Paper.js to resize & recalculate
      // https://github.com/paperjs/paper.js/issues/662
      window.dispatchEvent(new Event('resize'));
      return map.autoCenterMap();
    }
    // Half screen expand the chat
    if (ev.ctrlKey && ev.key === ',') {
      if (mapElem.classList.contains('big')) {
        mapElem.classList.toggle('big');
        window.dispatchEvent(new Event('resize'));
      }
      return rightElem.classList.toggle('big');
    }
    // Ignore all the other meta events
    if (ev.metaKey || ev.ctrlKey || ev.altKey) {
      return;
    }
    if (ev.key === 'Escape') {
      if (mapElem.classList.contains('big')) {
        mapElem.classList.toggle('big');
        window.dispatchEvent(new Event('resize'));
        return map.autoCenterMap();
      }
      if (rightElem.classList.contains('big')) {
        return rightElem.classList.toggle('big');
      }
      userInput.blur();
      gameLog.focus();
      return;
    }

    const input = userInput.value.trim();
    if (ev.key === 'ArrowUp') {
      historyIndex--;
      if (historyIndex < 0) historyIndex = 0;
      userInput.value = history.at(historyIndex);
    } else if (ev.key === 'ArrowDown') {
      historyIndex++;
      if (historyIndex >= history.length) historyIndex = history.length - 1;
      userInput.value = history.at(historyIndex);
    }

    // On Enter/Return, focus & select text
    else if (ev.key === 'Enter') {
      if (document.activeElement.id !== userInput.id) {
        userInput.focus();
        userInput.select();
      }
      // If focused, add to history, send & select again
      else if (document.activeElement.id === userInput.id && input) {
        if (history.at(-1) !== input) {
          history.push(input);
          persistHistory(history);
          historyIndex = history.length - 1;
        }
        WS.send(input);
        userInput.select();
        // Jump scroll to the end of game text
        setTimeout(() => {
          gameLog.scrollTop = gameLog.scrollHeight;
        }, 100);
        // Twice
        setTimeout(() => {
          gameLog.scrollTop = gameLog.scrollHeight;
        }, 200);
        // Thrice
        setTimeout(() => {
          gameLog.scrollTop = gameLog.scrollHeight;
        }, 300);
      }
    }
    // When we start to write, delete & focus
    else if (ASCII_INPUT.test(ev.key)) {
      if (document.activeElement.id !== userInput.id) {
        userInput.value = '';
        userInput.focus();
      }
    }
  };
});

async function startWS() {
  window.WS = null;
  window.WS = new WebSocket(`ws://${location.host}`);

  window.WS.onmessage = async function (event) {
    const data = JSON.parse(event.data);
    // console.log(data); // DEBUG
    let text = data.text;

    // This should be a Room update
    // num: .., name: .., plane: .., environment: ..,
    // details: [], exits: {}, items: [], players: []
    if (data.num && data.name && data.room) {
      window.ROOM.id = data.num;
      // Current Z level
      window.ROOM.level = data.room.coord ? data.room.coord.z : 0;
      // Always mark current room as visited
      if (AREA.rooms[data.num]) {
        AREA.rooms[data.num].visited = true;
      }
      if (data.room && data.room.area) {
        await map.fetchMap(data);
        map.drawMap(data);
      }
      return displayRoom(data);
    }
    if (data.textType === 'roomItems' && data.items) {
      window.ROOM.items = data.items;
      return displayRoom();
    }
    if (data.textType === 'roomPlayers' && data.players) {
      window.ROOM.players = data.players;
      return displayRoom();
    }
    if (data.textType === 'battleUpdate' && data.battle) {
      window.BATTLE = data.battle;
      return displayBattle(data.battle);
    } else if (data.textType === 'battleStop') {
      document.getElementById('battleWrap').style.display = 'none';
      window.BATTLE = { tgtID: null };
      return;
    }

    // This should be Player info
    // name: .., race: .., level: .., xp: .., class: .., city: ..,
    // hp: .. maxhp: .. mp: .. maxmp: .. ep: .. maxep: .. wp: .. maxwp: ..
    // bal: '1', eq: '1', rift: [], items: [], afflictions: [], defences: []
    if (data.name && data.race && data.level) {
      return displayMyself(data);
    }

    // This should be a social/channel text
    // channel: .., talker .., text: ..
    if (data.channel && data.talker) {
      return displayChannel(data);
    }

    if (data.textType === 'timeUpdate' && data.day && data.month) {
      return displayDateTime(data);
    }

    // Reject unknown messages
    if (!text || !data.textType) {
      return console.warn(`Unknown message format:`, data);
    }

    if (data.textType === 'sysHtml') {
      const div = document.createElement('div');
      div.classList.add(data.textType);
      div.innerHTML = text;
      return gameLog.append(div);
    }

    // Echo user's input text
    const txt = document.createElement('p');
    if (data.textType === 'userText') {
      text = `> ${text}`;
    }
    txt.innerHTML = text;
    txt.classList.add(data.textType);

    // Check if user has scrolled manually
    // (before adding the new element)
    const notScrolled = Math.abs(gameLog.scrollTopMax - gameLog.scrollTop) <= 4;

    gameLog.append(txt);

    if (notScrolled) {
      // Jump scroll new element into view
      txt.scrollIntoView();
    }
  };

  window.WS.onerror = function (err) {
    console.error('WS error:', err);
  };

  // Try to re-connect ?
  // window.WS.onclose = function () {
  //   setTimeout(startWS, 250);
  // };
}

window.whoisPlayer = function whoisPlayer(elem) {
  const id = elem.dataset.id;
  console.log(`WHOIS: ${id}`);
  WS.send(`WHOIS ${id}`);
};

window.probeItem = function probeItem(event, elem) {
  const id = elem.dataset.id;
  const isDeniz = elem.classList.contains('denizen');
  if (isDeniz && event.ctrlKey) WS.send(`kk ${id}`);
  else WS.send(`PROBE ${id}`);
};

function persistHistory(history) {
  // Limit history, so it doesn't explode
  if (history.length > 999) history.shift();
  // Save user's command history in the browser
  localStorage.setItem('History', JSON.stringify(history));
}

function restoreHistory() {
  // Load user's command history from last time
  const h = localStorage.getItem('History');
  if (h) return JSON.parse(h);
  return ['QL'];
}

function displayRoom(data) {
  const roomX = document.getElementById('room');
  let room = '';

  if (data && data.name) {
    const locX = document.getElementById('loc');
    let loc = '';
    if (data.area) {
      // shorter area name
      let a = data.area.replace(/^the |^a /, '');
      // title-case
      a = a.charAt(0).toUpperCase() + a.substr(1);
      loc += `<small class="bold">${a}</small>: `;
    }
    loc += data.name.replace(/\(indoors\)|\(road\)$/, '');
    if (data.details && data.details.length) {
      loc += `<br>( ${data.details.join(', ')} )`;
    }
    locX.innerHTML = loc;
  }

  if (data && data.exits) {
    const exitX = document.getElementById('exits');
    let exits = '<small class="bold">Exits</small>: ';
    exits += Object.keys(data.exits).join(', ');
    exitX.innerHTML = exits;
  }

  if (window.ROOM.players && window.ROOM.players.length) {
    room += `<h5>${window.ROOM.players.length} Players here:</h5>`;
    for (const x of window.ROOM.players) {
      // Level X Race, Color based on city
      room += `<p data-id="${x.name}" class="roomPlayer" title="${x.fullname}" onclick="whoisPlayer(this)">- ${x.name}</p>`;
    }
  }

  let battleTgtID = null;
  if (window.BATTLE.tgtID && window.BATTLE.tgts && window.BATTLE.tgts[window.BATTLE.tgtID]) {
    battleTgtID = window.BATTLE.tgtID;
  }

  const items = [];
  const denizen = [];
  if (window.ROOM.items && window.ROOM.items.length) {
    for (const x of window.ROOM.items) {
      if (x.attrib === 'm') denizen.push(x);
      else items.push(x);
    }
  }
  if (denizen.length) {
    room += `<h5>${denizen.length} Denizens here:</h5>`;
    for (const x of denizen) {
      let cls = 'denizen roomItem';
      if (x.id === battleTgtID) cls += ' ansi-red';
      // On-click, probe denizen
      room += `<p data-id="${x.id}" class="${cls}" title="[${x.id}] ${x.name}" onclick="probeItem(event,this)">- ${x.name}</p>`;
    }
  } else {
    room += `<h5>No denizens here</h5>`;
  }
  if (items.length) {
    room += `<h5>${items.length} Items here:</h5> - `;
    for (const x of items) {
      // On-click, probe item
      room += `<span data-id="${x.id}" class="roomItem" title="[${x.id}] ${x.name}" onclick="probeItem(event,this)">${x.name}</span>; `;
    }
  } else {
    room += `<h5>No items here</h5>`;
  }

  roomX.innerHTML = room;
}

function displayMyself(data) {
  const hpNow = document.getElementById('hpnow');
  const mpNow = document.getElementById('mpnow');
  const epNow = document.getElementById('epnow');
  const wpNow = document.getElementById('wpnow');
  const playerX = document.getElementById('player');

  if (data.maxhp - data.hp > 1) {
    const p = Math.floor((parseInt(data.hp) / parseInt(data.maxhp)) * 100);
    hpNow.title = `${data.hp} / ${data.maxhp}`;
    hpNow.style.width = `${p}%`;
    hpNow.innerText = `${p}%`;
  } else {
    hpNow.title = '';
    hpNow.innerText = '';
    hpNow.style.width = '100%';
  }
  if (data.maxmp - data.mp > 1) {
    const p = Math.floor((parseInt(data.mp) / parseInt(data.maxmp)) * 100);
    mpNow.title = `${data.mp} / ${data.maxmp}`;
    mpNow.style.width = `${p}%`;
    mpNow.innerText = `${p}%`;
  } else {
    mpNow.title = '';
    mpNow.innerText = '';
    mpNow.style.width = '100%';
  }
  if (data.maxep - data.ep > 9) {
    const p = Math.floor((parseInt(data.ep) / parseInt(data.maxep)) * 100);
    epNow.title = `${data.ep} / ${data.maxep}`;
    epNow.style.width = `${p}%`;
    epNow.innerText = `${p}%`;
  } else {
    epNow.title = '';
    epNow.innerText = '';
    epNow.style.width = '100%';
  }
  if (data.maxwp - data.wp > 9) {
    const p = Math.floor((parseInt(data.wp) / parseInt(data.maxwp)) * 100);
    wpNow.innerText = `${p}%`;
    wpNow.style.width = `${p}%`;
    wpNow.style.borderRight = '1px solid #999';
  } else {
    wpNow.title = '';
    wpNow.innerText = '';
    wpNow.style.width = '100%';
    wpNow.style.borderRight = 'none';
  }

  let displayRace = data.displayRace ? `<i>${data.displayRace}</i> ` : '';
  let html = `<h5>${data.name} (Lvl ${data.level}<span class="thin">+${data.xp}</span> ${displayRace}${data.class})</h5>`;
  if (data.defences.length) {
    html += '<h5>Defences:</h5> - ';
    for (const x of data.defences) {
      html += `<span class="playerDef" title="${x.desc}">${x.name}</span>; `;
    }
  } else {
    html += '<h5>No defences</h5>';
  }
  if (data.afflictions.length) {
    html += '<h5>Afflictions:</h5> - ';
    for (const x of data.afflictions) {
      html += `<span class="playerAff" title="${x.desc}">${x.name}</span>; `;
    }
  } else {
    html += '<h5>No afflictions</h5>';
  }
  playerX.innerHTML = html;
}

function displayBattle(data) {
  if (!data.active) return;
  // Ignore PVP for now
  if (data.combat) return;
  const elem = document.getElementById('battle');
  const wrap = document.getElementById('battleWrap');
  const hpNow = document.getElementById('targetHpnow');
  let html = '';
  let round = '';
  if (data.rounds) {
    round = `<span style="float:right">Round #${data.rounds}</span>`;
  }
  if (data.tgtID && data.tgts && data.tgts[data.tgtID]) {
    const tgt = data.tgts[data.tgtID];
    html += `<h5>Hunting: <i>${tgt.name}</i> !${round}</h5>`;
    const npcElem = document.querySelector(`.roomItem[data-id="${data.tgtID}"]`);
    if (npcElem) npcElem.classList.add('ansi-red');
  } else if (data.target) {
    html += `<h5>Hunting: <i>${data.target}</i> !${round}</h5>`;
  }
  if (data.tgtHP) {
    hpNow.title = `HP: ${data.tgtHP}`;
    hpNow.style.width = data.tgtHP;
    hpNow.innerText = data.tgtHP;
  }
  if (html) {
    wrap.style.display = 'block';
    elem.innerHTML = html;
  }
}

function displayChannel(data) {
  const elem = document.getElementById('rightSide');
  const cls = data.channel.replace(/[ \t-]+/g, '-');
  const msg = document.createElement('p');
  msg.innerHTML = data.text;
  msg.classList.add(cls);
  elem.append(msg);
  // Jump scroll on comm text
  elem.scrollTop = elem.scrollHeight;
}

function displayDateTime(data) {
  const elem = document.getElementById('dateTimeWrap');
  const emoji = {
    0: '🕛',
    1: '🕐',
    2: '🕑',
    3: '🕒',
    4: '🕓',
    5: '🕓',
    6: '🕕',
    7: '🕖',
    8: '🕗',
    9: '🕘',
    10: '🕙',
    11: '🕚',
    12: '🕛',
    0.5: '🕧',
    1.5: '🕜',
    2.5: '🕝',
    3.5: '🕞',
    4.5: '🕟',
    5.5: '🕠',
    6.5: '🕡',
    7.5: '🕢',
    8.5: '🕣',
    9.5: '🕤',
    10.5: '🕥',
    11.5: '🕦',
    12.5: '🕧',
  };
  let key = data.hour / 2.5;
  let rest = key - parseInt(key);
  if (rest <= 0.25) {
    rest = 0;
  } else if (rest > 0.25 && rest < 0.75) {
    rest = 0.5;
  } else {
    rest = 1;
  }
  key = parseInt(key) + rest;
  if (key > 12) key -= 12;
  let html = `${emoji[key]} ${data.rlhm} | ${data.day} ${data.month} ${data.year}`;
  elem.innerHTML = html;
}
