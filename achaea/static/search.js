String.prototype.toTitleCase = function () {
  return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};

function processWares(x) {
  let row = '';
  row += `<tr><td>${x.id}</td>`;
  row += `<td class="small">${x.name}</td>`;
  row += `<td>${x.pp}</td>`;
  row += `<td>${x.price}</td>`;
  row += `<td class="small">${x.room}</td>`;
  row += `<td class="small">${x.dt.replace('T', ' ')}</td>`;
  row += '</tr>';
  return row;
}

function processWhois(x) {
  x.class = x.class || '?';
  x.city = (x.city || '?').toTitleCase();
  x.race = (x.race || '?').toTitleCase();
  x.rank = x.xp_rank && x.xp_rank !== '0' ? x.xp_rank : '??';
  const pre = `#${x.rank.padEnd(3, ' ')} lvl.${x.level}\t${x.class}`;

  let row = '';
  row += `<tr><td>${x.id}</td>`;
  row += `<td><pre class="small">${pre}</pre></td>`;
  row += `<td class="small">${x.city}</td>`;
  row += `<td class="small">${x.race}</td>`;
  row += `<td class="small">${x.dt.replace('T', ' ')}</td>`;
  row += '</tr>';
  return row;
}

function processItem(x) {
  let row = '';
  row += `<tr><td>${x.id}</td>`;
  row += `<td class="small">${x.name}</td>`;
  row += `<td class="small">${x.room}</td>`;
  row += `<td class="small">${x.dt.replace('T', ' ')}</td>`;
  row += '</tr>';
  return row;
}

window.addEventListener('load', function () {
  const dbElem = document.getElementById('db');
  const qElem = document.getElementById('query');
  const searchFunc = async function (ev) {
    if (ev.type === 'keydown' && ev.key !== 'Enter') return;
    const q = qElem.value.trim().toLowerCase();
    if (q.length < 2) {
      document.getElementById('result').innerHTML = '<tr><td>-</td></tr>';
      return;
    }

    const db = dbElem.value;
    const resp = await fetch(`/${db}.json?key=${q}`, {
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
    });
    const results = await resp.json();

    let table = '';
    for (const x of results) {
      if (db === 'wares') table += processWares(x);
      else if (db === 'whois') table += processWhois(x);
      else if (db === 'item') table += processItem(x);
      else if (db === 'npc') table += processItem(x);
      else table += `<tr><td>${JSON.stringify(x)}</td></tr>`;
    }
    document.getElementById('result').innerHTML = table;
  };
  dbElem.onchange = searchFunc;
  qElem.onkeydown = searchFunc;
  searchFunc({ key: 'Enter' });
});
