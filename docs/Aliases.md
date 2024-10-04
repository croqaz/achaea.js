# Aliases

An alias is basically a command, or a series of commands.

Technically, there are no "aliases" in Achaea.js, but you have something better: user input processing.

You can do this in `custom/input.ts`. This is the basic template:

```ts
import ee from '../achaea/events/index.ts';

export default function processUserInput(args): string | void {
  /*
   * Proces user text input, eg: aliases, custom commands.
   * This function HAS TO BE SUPER FAST !!
   * The text returned from this function is sent to Achaea.
   */

  let { text, parts, firstWord, secondWord, otherWords } = args;

  // Your logic goes here
  // ...

  // Return original text
  //
  return text;
}

```

The most basic alias takes a short word from you and sends back to the game a longer command, eg:

```ts
if (text === 'pp') {
    return 'PUT GOLD IN PACK1234';
}
```

For these super-basic aliases, I would recommend defining server-side aliases, with the ALIAS command. It's not that Achaea.js is uncapable of handling basic aliases, it's more about latency. A server-side alias should run a few milliseconds faster and when you launch lots of commands, the delay adds up.

A slightly more complex alias uses multiple words and joins them together, eg:
( this assumes you defined `&&` as a command separator in CONFIG CommandSeparator )

```ts
/*
 * Get 10 myrrh balls from rift and give them to Romeo
 * Example: og 10 myrrh Romeo
 */
if (firstWord === 'og' && secondWord && parts[2] && parts[3]) {
    const quantity = secondWord;
    const riftItem = parts[2];
    const somebody = parts[3];
    // send the 2 commands to the game: OUTR ... and GIVE ...
    return `OUTR ${quantity} ${riftItem} && GIVE ${quantity} ${riftItem} TO ${somebody}`;
}
```

-----

Other aliases don't send anything to the game. These can be used for setup, debug, or searching in the DB.
For example:
( please don't re-implement this command, it is already available )

```ts
if (text.startsWith('//')) {
    const cmd = text.replace(/^[/]+/, '');
    // Run this like: //me to see the User's state tree
    //
    if (cmd === 'me') {
        ee.emit('sys:text', `ME: ${ JSON.stringify(STATE.Me, null, 2)}`);
        return ''; // <- notice this alias doesn't send anything to the game
    }
}
```

Another example that sends a command to the game and waits for a trigger to do something.
( please don't re-implement this command, it is already available )

```ts
// Thief protection alias
//
if (text === 'greed') {
    // toggle boolean value
    STATE.Misc.greed = !STATE.Misc.greed;
    if (STATE.Misc.greed) {
        return 'selfishness';
    } else {
        return 'generosity';
    }
}
```

With this new state, this is what happens in the triggers:

```ts
// Thief protection trigger
//
if (STATE.Misc.greed && text.includes('A feeling of generosity spreads throughout you.')) {
    ee.emit('user:text', 'QUEUE PREPEND e SELFISHNESS');
}
```

Another complex alias with a command and a trigger:
( please don't re-implement this command, it is already available )

```ts
// Collect wares DB input
//
if (firstWord === 'wares' || (firstWord === 'cart' && secondWord === 'wares')) {
    // prepare a state for triggers
    STATE.Misc.waresDB = true;
    // send back the same text to the game
    return text;
}
```

With this new state, this is what happens in the triggers:

```ts
// Collect wares DB trigger
//
if (
    STATE.Misc.waresDB &&
    (userInput === 'wares' || userInput === 'cart wares') &&
    (normText.includes('Proprietor:') || normText.includes('[File continued via MORE]'))
) {
    // snip ...
    //
    if (normText.includes('[Type MORE if you wish to continue reading.')) {
      ee.emit('user:text', 'more');
    } else {
      STATE.Misc.waresDB = false;
    }
    // parse the text and save
    return saveWares(origText);
}
```

## Geeky boy say 🤓

Important WARNING: the input processing function MUST BE FAST, because it runs for every single command you're typing. This means, no HTTP requests or DB queries or reading files from the disk. Now, if you just check some State flags and compare some strings, you can easily have tens of thousands of aliases with less that 1 millisecond delay.

Technically, the user input processing starts as a hook on the input text field in the GUI and then runs in `core/input.ts`, which calls `extra/input.ts`, which calls `custom/input.ts` (if this exists).

You could import extra input processing functions in `custom/input.ts` if you have lots of aliases.
