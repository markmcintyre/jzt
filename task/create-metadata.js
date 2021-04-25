/*jslint node: true */

var result = {};
result.version = process.env.npm_package_version;
result.date = Date.now();

console.log(JSON.stringify(result));
