const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const socket = require('./utils/socket.js');
const scheduler = require('./cron/scheduler.js');

let server;
const io = require('socket.io')(server);

const initDb = () => {
  return new Promise(async function (resolve, reject) {
    mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
      logger.info('Connected to MongoDB');
      return resolve();
    });
  });
}

const initServer = () => {
  return new Promise(async function (resolve, reject) {
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
      return resolve(server);
    });
  });
}

const initSocket = () => {
  return new Promise(async function (resolve, reject) {
    const io = require('socket.io')(server);
    socket.init(io);
    app.set('socketio', io);

    return resolve(io);
  });
}

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});


const init = async () => {
  await initDb();
  await initServer();
  await initSocket();
  await scheduler.init();
}

init();

/* module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      
      resolve();
    } catch (e) { reject(e); }
  });
} */