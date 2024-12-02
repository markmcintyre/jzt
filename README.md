# JZT

Better documentation is coming soon! In the meantime, here's how you can get JZT up and running locally:

```
$ npm install
$ npm run dev
```

Once the dev server is up and running, you can load JZT at `http://localhost:3000` and open a world file to play. Changes will restart the server automatically, so you can reload the page to see the changes locally.

## Generating a site

If you want to generate a standalone site to upload a playable version of a specific world, run:

```
$ npm run generate-site -- --world <world-name.jzt>
```

This will copy your world and output the necessary html, js, and css to the build directory.