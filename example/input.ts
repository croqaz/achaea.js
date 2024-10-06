/*
 * This is an example file, you may want to change this help text,
 * and all the logic inside the function below.
 */
import ee from '../events/index.ts';
import { STATE } from '../core/state.ts';

export default function processUserInput(args): string | void {
  /*
   * Proces user text input, eg: aliases, custom commands.
   * This function HAS TO BE SUPER FAST !!
   * The text returned from this function is sent to Achaea.
   * Read the docs/Aliases to learn more.
   */

  let { text, parts, firstWord, secondWord, otherWords } = args;

  // Example alias: gg
  //
  if (text === 'gg') {
    return 'GET GOLD';
  }

  // Example alias: pp
  // Replace the pack ID with yours
  //
  if (text === 'pp') {
    return 'PUT GOLD IN PACK1234';
  }

  // Example alias: defup
  // Runewarden defences up!
  // Emits more commands from one alias
  //
  if (text === 'defup') {
    ee.emit('user:text', 'WEATHERING');
    ee.emit('user:text', 'RESISTANCE');
    ee.emit('user:text', 'DEFLECT');
    return;
  }

  // return original text
  return text;
}
