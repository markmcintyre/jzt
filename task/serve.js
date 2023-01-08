const express = require('express');
const app = express();
const path = require('path');
const browserify = require('browserify-middleware');
const port = 3000;

const DEV_INDEX = path.join(__dirname, 'static', 'index.html');
const DEV_JS = path.join(__dirname, 'static', 'dev.js');
const JZT_SRC = './src/jzt.js';

app.get('/', (req, res) => {
    res.sendFile(DEV_INDEX);
});

app.get('/dev.js', browserify(DEV_JS, {
    debug: true
}));
app.get('/jzt.min.js', browserify(JZT_SRC, {
    debug: true,
    standalone: 'jzt'
}));

app.listen(port, () => {
    console.log(`✅ JZT development server running.`);
    console.log(`👉 http://localhost:${port}`);
});