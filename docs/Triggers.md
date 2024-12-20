# Triggers

Triggers/ reflexes are hooks on the game text with the purpose of updating some internal state, or sending some commands back to the game.

There is no special file to start triggers, any imported file will work. You should import your trigger files from `custom/index.ts`.

Example:

```ts
export default function processTriggers(origText: string, normText: string) {
  /*
   * Process game text to enable triggers
   * Original-text is the raw game plain text
   * Normalized-text is a normalized game text (all extra lines and spaces removed)
   */

  // do something with the text here
  //...
}

ee.on('game:text', processTriggers);
```

Examples of triggers can be found in `core/triggers.ts`, `extra/triggers.ts`, `extra/gold.ts`, `extra/whois.ts`, etc.
