# Output

Game output processing is a series of functions that change the display HTML that you see in the GUI and the logs.

This output is only used for display and logs, it is not used for triggers. (the triggers are matching on plain text)

This can be used to highlight or replace text, display meta-data, etc...

## Geeky boy say 🤓

Important WARNING: the output processing should be relatively fast, if you want to see it in GUI live, as it happens. If you need to query the DB to enhance the output, maybe try to cache the result in memory with a timeout before calling the DB again.

Technically, the output HTML processing starts as a hook on the ANSI raw text coming from the Game, which is converted to HTML and then runs in `core/output.ts`, which calls `extra/output.ts`, which calls `custom/output.ts` (if this exists).

You could import extra output processing functions in `custom/output.ts` if you want to go crazy.
