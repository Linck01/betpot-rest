const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const socket = require('./utils/socket.js');

let server;
const io = require('socket.io')(server);


mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);


      const io = require('socket.io')(server);
      socket.init(io);
      app.set('socketio', io);
  });
});




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
