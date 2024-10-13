# Color themes

You can change the colors and fonts to your liking.

By default, there are a few available fonts:
- system monospace (the default)
- Monego (a Monaco monospaced font, recreated with bold and italic variants -- https://github.com/cseelus/monego)
- Mononoki (a font for programming and code review -- https://github.com/madmalik/mononoki)

All the code and styles are located in `achaea/themes/`.

To regenerate the styles with your favorite font, run:

```sh
bun achaea/themes/gen.ts --fonts mono --output achaea/static/style.css
```

In this case, the SCSS font file will be `fontMono.scss`.

There are also a few color options:
- Base16 Eighties
- Nord
- OneHalf dark
- Solarized dark
- Srcery

To regenerate the styles with Srcery for example, run:

```sh
bun achaea/themes/gen.ts --theme srcery --output achaea/static/style.css
```

In this case, the SCSS colors file will be `themeSrcery.scss`.

You can use both the `--fonts` and the `--theme` flag.

## DYI fonts

To create your own font styles, copy a style like `fontMonego.scss`, or `fontMononoki.scss`.

Let's create a **Roboto Mono font** style. Search the font on Google Fonts, eg: https://fonts.google.com/specimen/Roboto+Mono?classification=Monospace

Go to "Get font" and next to "Get embed code". You should see a snippet like:

```html
<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap');
</style>
```

When you open the `url(...)` in your browser, you'll see lots of `@font-face {...}` that you can copy & paste in a file like `fontRobotoMono.scss`. Don't forget to add the rest of the definitions by looking at the other pre-defined fonts.

Now you can regenerate the styles with your custom font:

```sh
bun achaea/themes/gen.ts --fonts robotoMono --output achaea/static/style.css
```

## DYI colors

To create your own theme, copy a theme like `themeBase16.scss`, or `themeSolarized.scss` and call it whatever you like, eg: `themeCustom1.scss`. You have to add this in `achaea/themes/`.

You don't need to re-define all the colors, but you must specify dark1-4, light1-3 and red, green, blue, etc. The bright variations are automatically calculated for you, but you can tweak them to your liking. The dim variations are not customizable, they are just darker shades of the base colors.

Keep in mind that the styles were never tested with light themes, only with dark themes.

To regenerate the styles with your custom style #1, run:

```sh
bun achaea/themes/gen.ts --theme custom1 --output achaea/static/style.css
```
