# Useful functions

### userText(line)

Send a user command to the game. It is written in the Achaea Telnet connection  and also persisted in the LOGS.

Example:

```ts
import { userText } from '../achaea/core/index.ts';

// ...
userText('put gold in pack');
// ...
```

### displayText(line)

Display some info text in the main game log. The text is NOT sent to the game and is NOT persisted in the LOGS.

Example:

```ts
import { displayText } from '../achaea/core/index.ts';

// ...
displayText('[INFO] Something happened and you need to know...');
// ...
```

### displayHtml(html)

Display some HTML in the main game log. This is NOT sent to the game and is NOT persisted in the LOGS.

The difference from `displayText` function is that you would send a bigger HTML element, which is not wrapped in a paragraph.

Example:

```ts
import { displayHtml } from '../achaea/core/index.ts';

// ...
displayHtml('<table><tr><td> Something important... </td></tr></table>');
// ...
```

### displayNote(line)

Similar to `displayText`, display a note on the left side communication panel. This text is NOT sent to the game and is NOT persisted in the LOGS.

Example:

```ts
import { displayNote } from '../achaea/core/index.ts';

// ...
displayNote('[NOTE] Something happened and you need to know...');
// ...
```

### logWrite(line)

Write some text in the LOG file. This is useful for later debug. The text is NOT sent to the game and you can't see it in the interface.

Example:

```ts
import { logWrite } from '../achaea/core/index.ts';

// ...
logWrite('[DEBUG] Some debug info here...');
// ...
```
