# Custom logic for Achaea.js

This is you! Please *copy this folder and rename it* to `custom/`. This is so that you can pull the latest changes without overwriting your custom logic.

In this folder, you can write your custom logic for Achaea: aliases, triggers, anything you want.

You should create 3 files:

- input.ts -- this is where you process **your input text and commands**, in other words: aliases
- output.ts -- this will process the **text coming from the game**, so you can display more data, shrink or, mute game text;
- index.ts -- here you can import any other files, like triggers.

These 3 files are optional, but... what's the point of customizing Achaea, if you don't actually write your own logic? So, you should probably have all of them, and more.
