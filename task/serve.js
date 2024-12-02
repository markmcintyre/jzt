const express = require('express');
const app = express();
const path = require('path');
const browserify = require('browserify-middleware');
const {Liquid} = require('liquidjs');
const port = 3000;

const srcDir = path.join(__dirname, '..', 'src');
const siteDir = path.join(srcDir, 'site');

const engine = new Liquid();

app.get('/', (req, res) => {
    engine.renderFile(path.join(siteDir, 'index.html.liquid'), {
        environment: 'dev',
        world: {
            name: 'Development Instance',
        }
      }).then((result) => {
        res.send(result)
      });
});
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(siteDir, 'style.css'));
});
app.get('/script.js', browserify(path.join(siteDir, 'script.js'), {
    debug: true
}));
app.get('/jzt.min.js', browserify(path.join(srcDir, 'jzt.js'), {
    debug: true,
    standalone: 'jzt'
}));
app.get('/dev.js', browserify(path.join(siteDir, 'dev.js')));
app.get('/dev.css', (req, res) => {
    res.sendFile(path.join(siteDir, 'dev.css'));
});
app.listen(port, () => {
    console.log(`✅ JZT development server running.`);
    console.log(`👉 http://localhost:${port}`);
});