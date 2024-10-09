/*
 * This is an example file, you may want to change this help text,
 * and all the logic inside the function below.
 */
import { STATE } from '../core/state.ts';

export default function processDisplayText(html: string, text: string): string {
 /*
 * Game text processor.
 * Used to highlight or replace text, display meta-data...
 * This is HTML output, straight from the game.
 * The output is used for display and the logs,
 * it is not used for triggers.
 * Read the docs/Output to learn more.
 */

  // example: make the talisman text super visible
  //
  html = html.replaceAll(' talisman piece ', ' talisman piece 🧿 ');

  // Return the changed text to be displayed in the GUI
  return html;
}
