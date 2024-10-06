# Useful functions

### userText(line)

Send a user command to the game. It is written in the Achaea Telnet connection  and also persisted in the LOGS.

Example:

```
import { userText } from '../achaea/core/index.ts';

// ...
userText('put gold in pack');
// ...
```

### displayText(line)

Display some info text in the main game log. The text is NOT sent to the game and is NOT persisted in the LOGS.

Example:

```
import { displayText } from '../achaea/core/index.ts';

// ...
displayText('[INFO] Something happened and you need to know...');
// ...
```

### displayNote(line)

Similar to `displayText`, display a note on the left side communication panel. The text is NOT sent to the game and is NOT persisted in the LOGS.

Example:

```
import { displayNote } from '../achaea/core/index.ts';

// ...
displayNote('[NOTE] Something happened and you need to know...');
// ...
```

## logWrite(line)

Write some text in the LOG file. This is useful for later debug. The text is NOT sent to the game and you can't see it in the interface.

Example:

```
import { logWrite } from '../achaea/core/index.ts';

// ...
logWrite('[DEBUG] Some debug info here...');
// ...
```
