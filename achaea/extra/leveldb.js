import { ClassicLevel } from 'classic-level';

export const DB = new ClassicLevel('../gameDB', { valueEncoding: 'json' });

export async function dbGet(prefix, id) {
  return await DB.get(`${prefix}-${id}`);
}

export async function dbSave(prefix, item) {
  return await DB.put(`${prefix}-${item.id}`, item);
}
