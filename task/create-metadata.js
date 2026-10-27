/*jslint node: true */
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function createMetadata() {
  return {
    version: process.env.npm_package_version,
    date: Date.now()
  };
}

function main() {
  console.log(JSON.stringify(createMetadata()));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export {createMetadata};
