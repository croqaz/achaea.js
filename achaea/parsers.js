export function parseSurvey(text) {
  const parts = text.split('\n').filter((x) => !!x);
  let area = parts[0]
    .trim()
    .split(' ')
    .slice(6)
    .join(' ')
    .replace(/[ .]*$/, '');
  if (area.startsWith('the ')) {
    area = area.slice(4);
  }
  const environment = parts[1]
    .trim()
    .split(' ')
    .slice(6)
    .join(' ')
    .replace(/[ .]*$/, '');
  const plane = parts[2]
    .trim()
    .split(' ')
    .slice(4)
    .join(' ')
    .replace(/[ .]*$/, '');
  return { area, environment, plane };
}
