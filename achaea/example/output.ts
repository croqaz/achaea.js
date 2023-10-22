/*
 * This is an example file, you may want to change this help text,
 * and all the logic inside the function below.
 */
import { STATE } from '../core/state.ts';

export default function processDisplayText(text: string): string {
  /*
   * This is raw ANSI text, from the game.
   * It is only used for display in the GUI,
   * it is not used for triggers.
   */

  // example: make the talisman text super visible
  //
  text = text.replaceAll(' talisman piece ', ' talisman piece 🧿 ');

  // Return the changed text to be displayed in the GUI
  return text;
}
