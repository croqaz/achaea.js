# Custom logic for Achaea.js

This is you! Please *copy this folder and rename it* to `custom/`. This is so that you can pull the latest changes without overwriting your custom logic.

In this folder, you can write your custom logic for Achaea: aliases, triggers, anything you want.

You should create 4 files:

- input.ts -- this is where you process **your input text and commands**, in other words: aliases
- output.ts -- this will process the **text coming from the game**, so you can display more data, shrink or, mute game text;
  This processed text is only used in the GUI, it is not used for triggers, so you can go absolutely crazy.
- index.ts -- here you can define triggers and import any other files
- config.ts -- this tree is used to customize different features like: what to gather, how to auto-walk, how to attack, etc.
  You can also use it to tweak your own game packages.

These 4 files are optional, but... what's the point of customizing Achaea, if you don't actually write your own logic? So, you should probably have all of them, and more.
