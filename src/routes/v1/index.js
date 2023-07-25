const express = require('express');
const authRoute = require('./auth.route.js');
const userRoute = require('./user.route.js');
const docsRoute = require('./docs.route.js');
const gameRoute = require('./game.route.js');
const betRoute = require('./bet.route.js');
const tipRoute = require('./tip.route.js');
const messageRoute = require('./message.route.js');
const memberRoute = require('./member.route.js');
const gameLogRoute = require('./gameLog.route.js');
const config = require('../../config/config.js');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/games',
    route: gameRoute,
  },
  {
    path: '/messages',
    route: messageRoute,
  },
  {
    path: '/members',
    route: memberRoute,
  },
  {
    path: '/bets',
    route: betRoute,
  },
  {
    path: '/tips',
    route: tipRoute,
  },
  {
    path: '/gameLogs',
    route: gameLogRoute,
  }
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
