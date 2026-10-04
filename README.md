# JZT

JZT is a DOS-era adventure game for the web.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000` and use the world file chooser to play a world during development.

## Package a world for itch.io

Package any valid JZT world as a standalone HTML5 player:

```sh
npm run package:itch -- --world <path-to-world>
```

Use `--output <directory>` to stage the player in a directory other than `build/`:

```sh
npm run package:itch -- --world <path-to-world> --output <directory>
```

The input must be JSON or the editor’s binary compressed `.jzt` format (base64-compressed input is also accepted), with format version `1.0.0` and non-empty `name` and `author` fields. The command builds only the player runtime, normalizes the selected world to JSON under its original basename, and creates `/tmp/<world-basename>-html5.zip` with `index.html` at the archive root.

The selected output directory contains exactly:

- `index.html`
- `jzt.min.js`
- `script.js`
- `style.css`
- the selected world basename
- `license.md`

Editor bundles, development loaders, development styles, metadata headers, and unrelated assets are not included.

## Preview an itch build

Build the package and serve the production player in one command:

```sh
npm run preview:itch -- --world <path-to-world>
```

Open the printed `http://127.0.0.1:8000/` URL. Use `--output <directory>` for a custom staging directory or `--port <port>` if port 8000 is occupied:

```sh
npm run preview:itch -- --world <path-to-world> --output /tmp/jzt-preview --port 8080
```

This serves the same player-only output that is placed in the itch ZIP. It runs until `Ctrl-C`.

## Publish with Butler

Install [Butler](https://itch.io/docs/butler/), authenticate it once with `butler login`, then publish a player build directly to an itch project:

```sh
npm run publish:itch -- \
  --world <path-to-world> \
  --target <user/game>
```

The command builds the player package and pushes the output to the fixed `html5` channel. Use `--output <directory>` to select the staged output directory and `--version <version>` to pass a user-visible build version to Butler:

```sh
npm run publish:itch -- \
  --world <path-to-world> \
  --target <user/game> \
  --version 1.0.0
```

Butler uploads the player build; it does not configure the itch project page. Configure the project once as an HTML Game with an HTML5/playable-in-browser channel, then use `preview:itch` before publishing.