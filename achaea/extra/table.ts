export function htmlTable(data: Record<string, any>[]) {
  const keys = Object.keys(data[0]);
  const head = '<tr>' + keys.map((x) => `<th>${x}</th>`).join('') + '</tr>\n';
  let body = '';
  for (const row of data) {
    body += '<tr>';
    for (const k of keys) body += `<td>${row[k]}</td>`;
    body += '</tr>\n';
  }
  return '<table>' + head + body + '</table>';
}
