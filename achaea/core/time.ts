/*
 * A bit magic &hacky, but it works.
 * This is NOT a linear function, I tried...
 * GMCP DayNight to Achaea hour.
 */
export function dayNightToHour(dn: number): number {
  if (dn < 99) return 12 + Math.round(dn / 3);
  if (dn < 120) return Math.round(dn * 0.32 + 12.7);
  if (dn < 155) return Math.round(dn * 0.29 + 15.3);
  return Math.round(dn * 0.267 - 41);
}

/*
 * Achaea hour to real-life hour:minute.
 */
export function achaeaHourToRLhour(h: number): string {
  const raw = h / 2.5;
  // @ts-ignore: Types
  const hour = parseInt(raw);
  const rest = raw - hour;
  const min = Math.round(rest * 60);
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/*
 * Achaea hour to human names.
 */
export function hourToHuman(h: number): string {
  if (h < 2) return 'midnight';
  if (h < 5) return 'dead of night';
  if (h <= 10) return 'night';
  if (h < 15) return 'late night';
  if (h < 20) return 'daybreak';
  if (h < 25) return 'early morning';
  if (h < 29) return 'mid-morning';
  if (h <= 31) return 'high noon';
  if (h < 40) return 'early afternoon';
  if (h < 46) return 'late afternoon';
  if (h < 50) return 'dusk';
  if (h < 55) return 'twilight';
  if (h < 60) return 'before midnight';
  if (h >= 60) return 'midnight';
  else return '';
}

export function monthToSeason(mon: string): string {
  // 1) Sarapin   (mid-winter)    7) Valnuary  (mid-summer)
  // 2) Daedalan  (late winter)   8) Lupar     (late summer)
  // 3) Aeguary   (early spring)  9) Phaestian (early autumn)
  // 4) Miraman   (mid-spring)    10) Chronos  (mid-autumn)
  // 5) Scarlatan (late spring)   11) Glacian  (late autumn)
  // 6) Ero       (early summer)  12) Mayan    (early winter)
  switch (mon) {
    case '1':
      return 'mid-winter';
    case '2':
      return 'late winter';
    case '3':
      return 'early spring';
    case '4':
      return 'mid-spring';
    case '5':
      return 'late spring';
    case '6':
      return 'early summer';
    case '7':
      return 'mid-summer';
    case '8':
      return 'late summer';
    case '9':
      return 'early autumn';
    case '10':
      return 'mid-autumn';
    case '11':
      return 'late autumn';
    case '12':
      return 'early winter';
    default:
      return '';
  }
}
