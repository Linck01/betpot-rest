const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const bannerUrls = require('../utils/bannerUrls');
const { gameService } = require('../services');

const gameServer = [
  '10.0.0.3'
]

const createGame = catchAsync(async (req, res) => {
  req.body.bannerUrl = bannerUrls.getRandom();
  const game = await gameService.createGame(req.user.id,req.body);
  res.status(httpStatus.CREATED).send(game);
});

const getGames = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'userId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await gameService.queryGames(filter, options);
  res.send(result);
});

const getGame = catchAsync(async (req, res) => {
  const game = await gameService.getGameById(req.params.gameId);
  if (!game) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found');
  }
  game.server = gameServer[0];
  
  res.send(game);
});

const updateGame = catchAsync(async (req, res) => {
  const game = await gameService.updateGameById(req.params.gameId, req.body);
  res.send(game);
});

const deleteGame = catchAsync(async (req, res) => {
  await gameService.deleteGameById(req.params.gameId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createGame,
  getGames,
  getGame,
  updateGame,
  deleteGame,
};
