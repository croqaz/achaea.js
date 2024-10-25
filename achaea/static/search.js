// deno-lint-ignore-file
String.prototype.toTitleCase = function () {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

const F = {
  waresHead: () => {
    return {
      id: null,
      name: null,
      pp: null,
      price: null,
      room: null,
      dt: (x) => x.dt.replace('T', ' '),
    };
  },
  whoisHead: () => {
    return {
      id: null,
      rank: (x) => {
        x.rank = x.xp_rank && x.xp_rank !== '0' ? x.xp_rank : '??';
        return `#${x.rank.padEnd(3, ' ')} lvl.${x.level}`;
      },
      class: (x) => x.class || '?',
      city: (x) => (x.city || '?').toTitleCase(),
      house: (x) => (x.house || '?').toTitleCase(),
      race: (x) => (x.race || '?').toTitleCase(),
      dt: (x) => x.dt.replace('T', ' '),
    };
  },
  itemHead: () => {
    return {
      id: null,
      icon: (x) => x.icon || '?',
      name: null,
      room: null,
      dt: (x) => x.dt.replace('T', ' '),
    };
  },
  npcHead: () => {
    return {
      id: null,
      icon: (x) => x.icon || '?',
      name: null,
      dt: (x) => x.dt.replace('T', ' '),
    };
  },
};

window.addEventListener('load', function () {
  const dbElem = document.getElementById('db');
  const quElem = document.getElementById('query');
  const searchFunc = async function (ev) {
    if (ev.type === 'keydown' && ev.key !== 'Enter') return;
    const q = quElem.value.trim().toLowerCase();
    if (q.length < 2) {
      document.getElementById('result').innerHTML = '<tr><td>-</td></tr>';
      return;
    }

    const db = dbElem.value;
    const resp = await fetch(`/${db}.json?q=${q}`, {
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
    });
    const results = await resp.json();

    const head = F[db + 'Head']();
    let table = `<tr class="head">${Object.keys(head)
      .map((h) => '<td>' + h + '</td>')
      .join('')}</tr>`;
    for (const x of results) {
      table += '<tr>';
      for (const [h, f] of Object.entries(head)) {
        let v = x[h];
        if (f) v = f(x);
        if (h === 'id' && x.fullname) {
          table += `<td class="id" title="${x.fullname}">${v}</td>`;
        } else table += `<td class="${h}">${v}</td>`;
      }
      table += '</tr>';
    }
    document.getElementById('result').innerHTML = table;
  };

  dbElem.onchange = searchFunc;
  quElem.onkeydown = searchFunc;
  searchFunc({ key: 'Enter' });
});
