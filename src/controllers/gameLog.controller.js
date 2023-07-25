const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const gameService = require('../services/game.service.js');
const gameLogService = require('../services/gameLog.service.js');

const getGameLogs = catchAsync(async (req, res) => {
  const game = await gameService.getGameById(req.query.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found');

  await gameLogService.rebuildGameLogs(game);

  const filter = pick(req.query, ['name', 'gameId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await gameLogService.queryGameLogs(filter, {...options,lean: true });

  res.send(result);
});

module.exports = {
  getGameLogs,
};
