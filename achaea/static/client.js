import * as map from './map.js';

const ASCII_INPUT = /^[/'"0-9a-z]$/i;

window.addEventListener('load', function () {
  let historyIndex = 0;
  const history = ['QL'];

  const gameLog = document.getElementById('gameLog');
  const userInput = document.getElementById('userInput');

  const mapElem = document.getElementById('map');
  const rightElem = document.getElementById('rightSide');

  startWS();

  (async function mapData() {
    const data = await map.fetchRoom();
    await map.fetchMap(data);
  })();

  document.body.onkeydown = function (ev) {
    // console.log(ev);
    // Full expand map
    if (ev.ctrlKey && ev.key === 'm') {
      mapElem.classList.toggle('big');
      // Force Paper.js to resize & recalculate
      // https://github.com/paperjs/paper.js/issues/662
      window.dispatchEvent(new Event('resize'));
      return map.autoCenterMap();
    }
    // Half screen expand the chat
    if (ev.ctrlKey && ev.key === ',') {
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
          historyIndex = history.length - 1;
        }
        WS.send(input);
        userInput.select();
        // Jump scroll to the end of game text
        setTimeout(() => {
          gameLog.scrollTop = gameLog.scrollHeight;
        }, 100);
        // Twice ??
        setTimeout(() => {
          gameLog.scrollTop = gameLog.scrollHeight;
        }, 333);
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
    if (data.num && data.area && data.room) {
      // Current Z level
      const level = data.room.coord ? data.room.coord.z : 0;
      window.ROOM = { id: data.num, level };
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

    // This should be a Player update
    // name: .., race: .., level: .., xp: .., class: .., city: ..,
    // hp: .. maxhp: .. mp: .. maxmp: .. ep: .. maxep: .. wp: .. maxwp: ..
    // bal: '1', eq: '1', rift: [], items: [], afflictions: [], defences: []
    if (data.race && data.level) {
      return displayMyself(data);
    }

    // This should be a social/channel text
    // channel: .., talker .., text: ..
    if (data.channel && data.talker) {
      return displayChannel(data);
    }

    // Reject unknown messages
    if (!text || !data.textType) {
      return console.warn(`Unknown message format:`, data);
    }

    const txt = document.createElement('pre');
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

window.probeItem = function probeItem(elem) {
  const id = elem.dataset.id;
  console.log(`PROBE: ${id}`);
  WS.send(`PROBE ${id}`);
};

function displayRoom(data) {
  const roomX = document.getElementById('room');
  let room = '';

  if (data.players.length) {
    room += `<h5>${data.players.length} Players:</h5>`;
    for (const x of data.players) {
      // Level X Race, Color based on city
      room += `<p data-id="${x.name}" class="roomPlayer" title="${x.fullname}" onclick="whoisPlayer(this)">- ${x.name}</p>`;
    }
  }

  const items = [];
  const denizen = [];
  if (data.items.length) {
    for (const x of data.items) {
      if (x.attrib === 'm') denizen.push(x);
      else items.push(x);
    }
  }
  if (denizen.length) {
    room += `<h5>${denizen.length} Denizens:</h5>`;
    for (const x of denizen) {
      // On-click, probe denizen
      room += `<p data-id="${x.id}" class="roomItem" title="[${x.id}] ${x.name}" onclick="probeItem(this)">- ${x.name}</p>`;
    }
  }
  if (items.length) {
    room += `<h5>${items.length} Items:</h5> - `;
    for (const x of items) {
      // On-click, probe item
      room += `<span data-id="${x.id}" class="roomItem" title="[${x.id}] ${x.name}" onclick="probeItem(this)">${x.name}</span>; `;
    }
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

  let html = `<h5>${data.name} (Lvl ${data.level} ${data.race})</h5>`;
  if (data.defences.length) {
    html += '<h5>Defences:</h5>';
    for (const x of data.defences) {
      html += `<p>- ${x.name}</p>`;
    }
  }
  if (data.afflictions.length) {
    html += '<h5>Afflictions:</h5>';
    for (const x of data.afflictions) {
      html += `<p>- ${x.name}</p>`;
    }
  }
  playerX.innerHTML = html;
}

function displayChannel(data) {
  const commChannel = document.getElementById('rightSide');
  const cls = data.channel.replace(/[ \t-]+/g, '-');
  const msg = document.createElement('p');
  msg.innerHTML = data.text;
  msg.classList.add(cls);
  commChannel.append(msg);
  // Jump scroll on comm text
  commChannel.scrollTop = commChannel.scrollHeight;
}
