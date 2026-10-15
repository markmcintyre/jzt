import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Liquid} from 'liquidjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;

const srcDir = path.join(__dirname, '..', 'src');
const siteDir = path.join(srcDir, 'site');
const buildDir = path.join(__dirname, '..', 'build');

const engine = new Liquid({root: siteDir});
const unknownAuthorNames = [
    'a JZT wizard',
    'a binary byte shaper',
    'an ASCII architect',
    'a pixel pixie',
    'a level luminary',
    'a virtual visionary',
    'a construct cartographer'
];

app.get('/', (req, res) => {
    engine.renderFile(path.join(siteDir, 'index.html.liquid'), {
        environment: 'dev',
        world: {
            name: 'Development Instance',
            author: `${unknownAuthorNames[Math.floor(Math.random() * unknownAuthorNames.length) ]}`,
        }
      }).then((result) => {
        res.send(result)
      });
});
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(siteDir, 'style.css'));
});
app.get('/script.js', (req, res) => {
    res.sendFile(path.join(siteDir, 'script.js'));
});
app.get('/jzt.min.js', (req, res) => {
    res.sendFile(path.join(buildDir, 'jzt.min.js'));
});
app.get('/jzt-editor.min.js', (req, res) => {
    res.sendFile(path.join(buildDir, 'jzt-editor.min.js'));
});
app.get('/jzt-editor-play.min.js', (req, res) => {
    res.sendFile(path.join(buildDir, 'jzt-editor-play.min.js'));
});
app.get('/dev.js', (req, res) => {
    res.sendFile(path.join(buildDir, 'dev.js'));
});
app.get('/jzt.min.js.map', (req, res) => {
    res.sendFile(path.join(buildDir, 'jzt.min.js.map'));
});
app.get('/jzt-editor.min.js.map', (req, res) => {
    res.sendFile(path.join(buildDir, 'jzt-editor.min.js.map'));
});
app.get('/jzt-editor-play.min.js.map', (req, res) => {
    res.sendFile(path.join(buildDir, 'jzt-editor-play.min.js.map'));
});
app.get('/dev.js.map', (req, res) => {
    res.sendFile(path.join(buildDir, 'dev.js.map'));
});
app.get('/dev.css', (req, res) => {
    res.sendFile(path.join(siteDir, 'dev.css'));
});
async function startServer() {
    const {build} = await import('./build.js');
    await build({development: true, entries: ['game', 'editor', 'player', 'dev']});
    return app.listen(port, () => {
        console.log(`✅ JZT development server running.`);
        console.log(`👉 http://localhost:${port}`);
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    startServer();
}

export {app, startServer};
