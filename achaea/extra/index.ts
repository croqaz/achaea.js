/*
 * Extra features.
 */
import './auto.ts';
import './gold.ts';
import './wares.ts';
import './whois.ts';
import './rooms.ts';
import './triggers.ts';
import './stats.ts';

try {
  // @ts-ignore: Types
  await import('../../custom/index.ts');
  // console.log('Custom user folder loaded!');
} catch {
  // console.error('Custom user folder not found');
}
