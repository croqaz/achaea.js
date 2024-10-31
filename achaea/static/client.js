// deno-lint-ignore-file
import { computePosition, flip, shift, offset } from 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.x/+esm';

import * as map from './map.js';
window.ME = {};
window.TIME = {};
window.BATTLE = { tgtID: null };
const ASCII_INPUT = /^[/'"0-9a-z]$/i;

function elemHidden(elem) {
  return !elem.style.display || elem.style.display === 'none';
}

window.addEventListener('load', function () {
  const history = restoreHistory();
  let historyIndex = history.length - 1;

  const gameLog = document.getElementById('gameLog');
  const userInput = document.getElementById('userInput');

  const mapElem = document.getElementById('map');
  const wildMap = document.getElementById('wildMap');
  const rightElem = document.getElementById('rightSide');
  const tooltip = document.getElementById('tooltip');

  startWS();

  (async function mapData() {
    // warmup on page refresh
    const data = await map.fetchRoom();
    await map.fetchMap(data);
  })();

  document.body.onmouseover = function (ev) {
    const label = ev.target.getAttribute('aria-label');
    if (label) {
      computePosition(ev.target, tooltip, {
        placement: 'top',
        middleware: [offset(2), flip(), shift({ padding: 4 })],
      }).then(({ x, y }) => {
        Object.assign(tooltip.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
      tooltip.innerText = label;
      tooltip.style.display = 'block';
      ev.preventDefault();
    }
  };
  document.body.onmouseout = function (ev) {
    const label = ev.target.getAttribute('aria-label');
    if (label) {
      tooltip.innerText = '';
      tooltip.style.display = '';
      ev.preventDefault();
    }
  };

  document.body.onclick = function (ev) {
    // a command to send directly on WS
    const dataSend = ev.target.getAttribute('data-send');
    if (dataSend) {
      WS.send(dataSend);
      ev.preventDefault();
    }
    // a command to write in input field
    const dataInput = ev.target.getAttribute('data-input');
    if (dataInput) {
      const userInput = document.getElementById('userInput');
      userInput.value = dataInput;
      userInput.focus();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    }
  };

  document.body.onkeydown = function (ev) {
    // Full expand map
    if (ev.ctrlKey && ev.key === 'm') {
      if (rightElem.classList.contains('big')) {
        rightElem.classList.remove('big');
      }
      const mapView = elemHidden(mapElem) ? wildMap : mapElem;
      mapView.classList.toggle('big');
      // Force Paper.js to resize & recalculate
      // https://github.com/paperjs/paper.js/issues/662
      window.dispatchEvent(new Event('resize'));
      return map.autoCenterMap();
    }
    // Half screen expand the chat
    if (ev.ctrlKey && ev.key === ',') {
      if (mapElem.classList.contains('big') || wildMap.classList.contains('big')) {
        mapElem.classList.remove('big');
        wildMap.classList.remove('big');
        window.dispatchEvent(new Event('resize'));
      }
      return rightElem.classList.toggle('big');
    }
    // Ignore all the other meta events
    if (ev.metaKey || ev.ctrlKey || ev.altKey) {
      return;
    }
    if (ev.key === 'Escape') {
      if (mapElem.classList.contains('big') || wildMap.classList.contains('big')) {
        mapElem.classList.remove('big');
        wildMap.classList.remove('big');
        window.dispatchEvent(new Event('resize'));
        return map.autoCenterMap();
      }
      if (rightElem.classList.contains('big')) {
        return rightElem.classList.remove('big');
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
  document.body.onpaste = function (ev) {
    if (ev.target.id === 'userInput') return;
    // Hack the paste event to paste in the user's input text
    ev.preventDefault();
    const paste = (ev.clipboardData || window.clipboardData).getData('text');
    userInput.value += paste;
    userInput.focus();
  };

  const dateTime = document.getElementById('dateTimeWrap');
  dateTime.onclick = function switchTimeDisplay() {
    if (dateTime.dataset['human']) {
      delete dateTime.dataset['human'];
    } else {
      dateTime.dataset['human'] = 't';
    }
    displayDateTime();
  };
});

async function startWS() {
  window.WS = null;
  window.WS = new WebSocket(`ws://${location.host}/ws`);

  window.WS.onmessage = async function (event) {
    const gameLog = document.getElementById('gameLog');
    const statBar = document.getElementById('statBar');
    const data = JSON.parse(event.data);
    // console.log(data); // DEBUG

    switch (data.type) {
      case 'user:text':
      case 'game:html':
      case 'sys:text':
        let text = data.text;
        if (!text) return;
        if (data.type === 'user:text') {
          text = `> ${text}`;
        }
        const txt = document.createElement('p');
        txt.classList.add(data.type.replace(':', '-'));
        txt.innerHTML = text;

        // Check if user has scrolled manually
        // (before adding the new element)
        const notScrolled = Math.abs(gameLog.scrollHeight - gameLog.scrollTop - gameLog.clientHeight) <= 10;
        gameLog.append(txt);
        if (notScrolled) {
          // Jump scroll new element into view
          txt.scrollIntoView();
        }
        break;

      case 'channel:text':
        // This is a social/channel text
        // channel: .., talker .., text: ..
        return displayChannel(data);

      case 'time:update':
        window.TIME = data;
        return displayDateTime();

      case 'sys:html':
        const div = document.createElement('div');
        div.classList.add(data.type.replace(':', '-'));
        div.innerHTML = data.html;
        return gameLog.append(div);

      case 'ico:update':
        delete data.type;
        let html = '';
        for (const [k, ico] of Object.entries(data)) {
          let label = '';
          if (ico && ico.label) {
            label = `aria-label="${ico.label}"`;
          }
          // if empty display data
          if (!ico || !(ico.text || ico.html)) {
            html += `<div data-name="${k}" ${label}> </div>`;
          } else if (ico.text) {
            html += `<div data-name="${k}" ${label}>${ico.text}</div>`;
          } else if (ico.html) {
            html += ico.html;
          }
        }
        statBar.innerHTML = html;
        if (html && elemHidden(statBar)) {
          statBar.style.display = 'flex';
        }
        break;

      case 'items:update':
        window.ROOM.items = data.items;
        return displayRoom();

      case 'players:update':
        window.ROOM.players = data.players;
        return displayRoom();

      case 'wild:map':
        document.getElementById('wildMap').innerHTML = `<div>${data.map}</div>`;
        break;

      case 'battle:update':
        window.BATTLE = data.battle;
        return displayBattle(data.battle);

      case 'battle:stop':
        document.getElementById('battleWrap').style.display = 'none';
        window.BATTLE = { tgtID: null };
        break;

      default:
        //
        // This should be Player info
        // name: .., race: .., level: .., xp: .., class: .., city: ..,
        // hp: .. maxhp: .. mp: .. maxmp: .. ep: .. maxep: .. wp: .. maxwp: ..
        // bal: '1', eq: '1', rift: [], items: [], afflictions: [], defences: []
        if (data.name && data.race && data.level) {
          window.ME = data;
          return displayMyself(data);
        }

        //
        // This should be a Room update
        // num: .., name: .., plane: .., environment: ..,
        // details: [], exits: {}, items: [], players: []
        if (data.num && data.name && data.room) {
          window.ROOM.id = data.num;
          window.ROOM.name = data.name;
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

        // Reject unknown messages
        return console.warn(`Unknown message format:`, data);
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

  if (data && data.details) {
    const mapElem = document.getElementById('map');
    const wildMap = document.getElementById('wildMap');
    if (data.wild) {
      wildMap.style.display = 'flex';
      mapElem.style.display = 'none';
    } else if (elemHidden(mapElem)) {
      mapElem.style.display = 'block';
      wildMap.style.display = 'none';
      map.autoCenterMap();
    }
  }

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
      room += `<p data-id="${x.name}" class="roomPlayer ${x.cls}" aria-label="${x.fullname}" data-input="WHOIS ${x.name}">- ${x.name}</p>`;
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
      if (x.id === battleTgtID) cls += ' c-red';
      // On-click, probe denizen
      room += `<p data-id="${x.id}" class="${cls}" aria-label="[${x.id}] ${x.name}" onclick="probeItem(event,this)">- ${x.name}</p>`;
    }
  } else {
    room += `<h5>No denizens here</h5>`;
  }
  if (items.length) {
    room += `<h5>${items.length} Items here:</h5> - `;
    for (const x of items) {
      // On-click, probe item
      room += `<span data-id="${x.id}" class="roomItem" aria-label="[${x.id}] ${x.name}" onclick="probeItem(event,this)">${x.name}</span>; `;
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
    hpNow.setAttribute('aria-label', `${data.hp} / ${data.maxhp}`);
    hpNow.style.width = `${p}%`;
    hpNow.innerText = `${p}%`;
    if (data.hp <= data.maxhp / 2) {
      const p = 0.75 - data.hp / data.maxhp;
      hpNow.style.boxShadow = `0 0 18px rgba(250, 10, 10, ${p})`;
    } else {
      hpNow.style.boxShadow = '';
    }
  } else {
    hpNow.setAttribute('aria-label', '');
    hpNow.innerText = '';
    hpNow.style.width = '100%';
  }
  if (data.maxmp - data.mp > 1) {
    const p = Math.floor((parseInt(data.mp) / parseInt(data.maxmp)) * 100);
    mpNow.setAttribute('aria-label', `${data.mp} / ${data.maxmp}`);
    mpNow.style.width = `${p}%`;
    mpNow.innerText = `${p}%`;
    if (data.mp <= data.maxmp / 2) {
      const p = 0.75 - data.mp / data.maxmp;
      mpNow.style.boxShadow = `0 0 18px rgba(10, 10, 250, ${p})`;
    } else {
      mpNow.style.boxShadow = '';
    }
  } else {
    mpNow.setAttribute('aria-label', '');
    mpNow.innerText = '';
    mpNow.style.width = '100%';
  }
  if (data.maxep - data.ep > 9) {
    const p = Math.floor((parseInt(data.ep) / parseInt(data.maxep)) * 100);
    epNow.style.width = `${p}%`;
    epNow.innerText = `${p}%`;
  } else {
    epNow.innerText = '';
    epNow.style.width = '100%';
  }
  if (data.maxwp - data.wp > 9) {
    const p = Math.floor((parseInt(data.wp) / parseInt(data.maxwp)) * 100);
    wpNow.innerText = `${p}%`;
    wpNow.style.width = `${p}%`;
    wpNow.style.borderRight = '1px solid #999';
  } else {
    wpNow.innerText = '';
    wpNow.style.width = '100%';
    wpNow.style.borderRight = 'none';
  }

  let html = `<h5>${data.name} (Lvl ${data.level}<span class="thin">+${data.xp}</span> ${data.class})</h5>`;
  if (data.defences.length) {
    html += '<h5>Defences:</h5> - ';
    for (const x of data.defences) {
      html += `<span class="playerDef" aria-label="${x.desc}">${x.name}</span>; `;
    }
  } else {
    html += '<h5>No defences</h5>';
  }
  if (data.afflictions.length) {
    html += '<h5>Afflictions:</h5> - ';
    for (const x of data.afflictions) {
      html += `<span class="playerAff" aria-label="${x.desc}">${x.name}</span>; `;
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
    if (npcElem) npcElem.classList.add('c-red');
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
const moon = {
  'New Moon': '🌑',
  'Waxing Crescent': '🌒',
  'First Quarter': '🌓',
  'Waxing Gibbous': '🌔',
  'Full Moon': '🌕',
  'Waning Gibbous': '🌖',
  'Last Quarter': '🌗',
  'Waning Crescent': '🌘',
};

function displayDateTime() {
  const elem = document.getElementById('dateTimeWrap');
  if (window.TIME.time) {
    elem.setAttribute('aria-label', window.TIME.time);
  }
  if (elem.dataset['human']) {
    elem.innerHTML = `${window.TIME.hhour} | ${window.TIME.season}`;
    return;
  }
  let key = window.TIME.hour / 2.5;
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
  let html = `${emoji[key]} ${window.TIME.rlhm} | ${window.TIME.day} ${window.TIME.month}`;
  html += ` ${window.TIME.year} ${moon[window.TIME.moonphase]}`;
  elem.innerHTML = html;
}
