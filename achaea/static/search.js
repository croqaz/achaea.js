String.prototype.toTitleCase = function () {
  return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};

window.addEventListener('load', function () {
  const input = document.getElementById('query');
  const searchWhois = async function (ev) {
    if (ev.key !== 'Enter') return;
    const q = input.value.trim();
    if (q.length < 2) {
      document.getElementById('result').innerHTML = '<tr><td>-</td></tr>';
      return;
    }

    const resp = await fetch(`/whois.json?key=${q}`, {
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
    });
    const results = await resp.json();

    let table = '';
    for (const x of results) {
      // console.log(x);
      x.class = x.class || '?';
      x.city = (x.city || '?').toTitleCase();
      x.race = (x.race || '?').toTitleCase();
      x.rank = x.xp_rank && x.xp_rank !== '0' ? x.xp_rank : '??';
      const pre = `#${x.rank.padEnd(3, ' ')} lvl.${x.level}\t${x.class}`;

      table += `<tr><td>${x.id}</td>`;
      table += `<td><pre class="small">${pre}</pre></td>`;
      table += `<td class="small">${x.city}</td>`;
      table += `<td class="small">${x.race}</td>`;
      table += `<td class="small">${x.dt.replace('T', ' ')}</td>`;
      table += '</tr>';
    }
    document.getElementById('result').innerHTML = table;
  };
  input.onkeydown = searchWhois;
  searchWhois({ key: 'Enter' });
});
