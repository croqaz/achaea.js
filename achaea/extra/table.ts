function __rowFunc(key: string, row: Record<string, any>): string {
  return `<td>${row[key] || '?'}</td>`;
}

export function htmlTable(data: Record<string, any>[], rowFunc = __rowFunc) {
  const keys = Object.keys(data[0]);
  const head = '<tr>' + keys.map((x) => `<th>${x}</th>`).join('') + '</tr>\n';
  let body = '';
  for (const row of data) {
    body += '<tr>';
    for (const k of keys) body += rowFunc(k, row);
    body += '</tr>\n';
  }
  return '<table>' + head + body + '</table>';
}
