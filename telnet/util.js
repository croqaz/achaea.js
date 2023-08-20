import telOpts from './telOpts.js';

const HUMAN_OPTS = {};

Object.keys(telOpts).forEach((key) => {
  HUMAN_OPTS[telOpts[key]] = key;
});

export function teloptHuman(nr) {
  return HUMAN_OPTS[nr];
}

export function teloptFmt(nr) {
  const o = teloptHuman(nr);
  const hex = nr.toString(16).toUpperCase();
  if (o) return `0x${hex}=${o}`;
  else return `${nr}=0x${hex}`;
}
