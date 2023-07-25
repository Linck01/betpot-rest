const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const bannerUrls = require('../utils/bannerUrls');

const betService = require('../services/bet.service.js');
const gameService = require('../services/game.service.js');
const memberService = require('../services/member.service.js');
const messageService = require('../services/message.service.js');
const gameLogService = require('../services/gameLog.service.js');
const tipService = require('../services/tip.service.js');


const createGame = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Not authorized.');
  
  gameBody = req.body;
  gameBody.userId = req.user.id;
  gameBody.bannerUrl = bannerUrls.getRandom();

  const game = await gameService.createGame(gameBody);
  //const url = encodeURI(game.title.replaceAll(' ', '-') + '-' + game.id);
  //await gameService.updateGameById(game.id, { url });

  await gameLogService.rebuildGameLogs(game);

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

/*
const getGameByUrl = catchAsync(async (req, res) => {
  const game = await gameService.getGameByUrl(req.params.gameUrl);
  if (!game) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found');
  }
  
  res.send(game);
});*/

const updateGame = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  let game = await gameService.getGameById(req.params.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  const member = await memberService.getMemberByGameUserId(game.id,req.user.id);
  const isAdminOrMod = game.userId == req.user.id || (member && member.isModerator);
  if (!isAdminOrMod)
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
  await gameLogService.deleteGameLogsByGameId(req.params.gameId);
    
  await gameService.deleteGameById(req.params.gameId);
  res.status(httpStatus.NO_CONTENT).send();
});


module.exports = {
  createGame,
  getGames,
  getGame,
  updateGame,
  deleteGame
};
