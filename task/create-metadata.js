/*jslint node: true */

var nodePackage = require('../package.json'),
    result = {};

result.version = nodePackage.version;
result.date = Date.now();

console.log(JSON.stringify(result));
