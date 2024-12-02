const express = require('express');
const app = express();
const path = require('path');
const browserify = require('browserify-middleware');
const {Liquid} = require('liquidjs');
const port = 3000;

const GENERATOR_PATH = path.join(__dirname, 'generator');
const SRC_PATH = path.join(__dirname, '..', 'src');
const engine = new Liquid();

app.get('/', (req, res) => {
    engine.renderFile(path.join(GENERATOR_PATH, 'index.html.liquid'), {
        environment: 'dev',
        world: {
            name: 'Development Instance',
        }
      }).then((result) => {
        res.send(result)
      });
});
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(GENERATOR_PATH, 'style.css'));
});
app.get('/script.js', browserify(path.join(GENERATOR_PATH, 'script.js'), {
    debug: true
}));
app.get('/jzt.min.js', browserify(path.join(SRC_PATH, 'jzt.js'), {
    debug: true,
    standalone: 'jzt'
}));
app.get('/dev.js', browserify(path.join(GENERATOR_PATH, 'dev.js')));
app.get('/dev.css', (req, res) => {
    res.sendFile(path.join(GENERATOR_PATH, 'dev.css'));
});
app.listen(port, () => {
    console.log(`✅ JZT development server running.`);
    console.log(`👉 http://localhost:${port}`);
});