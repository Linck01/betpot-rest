const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { gameService, messageService, memberService, betService, tipService, loggingService } = require('../services');
const bannerUrls = require('../utils/bannerUrls');

const createGame = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Not authorized.');
  
  gameBody = req.body;
  gameBody.userId = req.user.id;
  gameBody.bannerUrl = bannerUrls.getRandom();

  const game = await gameService.createGame(gameBody);

  const logTitle = game.title.length > 50 ? game.title.sustr(0,48) + '..' : game.title;
  await loggingService.createLogging({gameId: game.id, logType: 'gameCreated', title: 'Game created', desc: 'Game ' + logTitle + ' has been created.'});

  res.status(httpStatus.CREATED).send(game);
});

const getGames = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'userId', 'ids', 'isEnded', 'isPublic']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  if (filter.ids) {
    filter._id = {$in: filter.ids};
    delete filter.ids;
  }

  const result = await gameService.queryGames(filter, options);
  res.send(result);
});

const getGame = catchAsync(async (req, res) => {
  const game = await gameService.getGameById(req.params.gameId);
  if (!game) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found');
  }
  
  res.send(game);
});

const updateGame = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  let game = await gameService.getGameById(req.params.gameId);
  if (game.userId != req.user.id)
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to change settings of this game.');

  game = await gameService.updateGameById(req.params.gameId, req.body);
  res.send(game);
});

const deleteGame = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  let game = await gameService.getGameById(req.params.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (game.userId != req.user.id)
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to delete this game.');
  
  await tipService.deleteTipsByGameId(req.params.gameId);
  await messageService.deleteMessagesByGameId(req.params.gameId);
  await memberService.deleteMembersByGameId(req.params.gameId);
  await betService.deleteBetsByGameId(req.params.gameId);
  await loggingService.deleteLoggingsByGameId(req.params.gameId);
    
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
