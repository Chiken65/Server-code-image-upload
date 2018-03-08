// 'use strict'
import config from './config';
import routes from './routes';
import logger from './log';

const Hapi = require('hapi');
const Inert = require('inert');

const server = Hapi.server({
  host: '0.0.0.0',
  port: config.port
});

// Add the route
server.route([...routes]);

// Start the server
async function start() {
  await server.register(Inert);

  try {
    await server.start();
  } catch (err) {
    logger.error(`server start error: ${err}`);
    process.exit(1);
  }

  console.log('Server running at:', server.info.uri);
  // logger.notice(server.info.uri);
}

start();
