const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {packageSite} = require('./package-itch');

const repositoryRoot = path.resolve(__dirname, '..');
const defaultOutputDirectory = path.join(repositoryRoot, 'build');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

function parseArguments(argumentsList) {
  const options = {port: 8000};

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--world' || argument === '--output' || argument === '--port') {
      const value = argumentsList[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a value.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument !== '--') {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.world) {
    throw new Error('A world file is required. Use --world <path>.');
  }

  const port = Number(options.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('--port must be an integer from 1 to 65535.');
  }

  return {
    worldPath: path.resolve(process.cwd(), options.world),
    outputDirectory: path.resolve(process.cwd(), options.output || defaultOutputDirectory),
    port
  };
}

function startServer(outputDirectory, port) {
  const server = http.createServer((request, response) => {
    let pathname;

    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    } catch (error) {
      response.writeHead(400);
      response.end('Bad request.');
      return;
    }

    if (pathname === '/') {
      pathname = '/index.html';
    }

    const filePath = path.resolve(outputDirectory, `.${pathname}`);
    if (filePath !== outputDirectory && !filePath.startsWith(`${outputDirectory}${path.sep}`)) {
      response.writeHead(403);
      response.end('Forbidden.');
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        response.writeHead(404);
        response.end('Not found.');
        return;
      }

      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
      });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        fs.createReadStream(filePath).pipe(response);
      }
    });
  });

  server.on('error', (error) => {
    throw error;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Previewing the itch package at http://127.0.0.1:${port}/`);
    console.log('Press Ctrl-C to stop the preview server.');
  });

  const stopServer = () => {
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', stopServer);
  process.once('SIGTERM', stopServer);
}

function main() {
  const {worldPath, outputDirectory, port} = parseArguments(process.argv.slice(2));
  packageSite(worldPath, outputDirectory);
  startServer(outputDirectory, port);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {parseArguments, startServer};
