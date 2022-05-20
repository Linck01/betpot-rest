const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { betService, gameService, memberService, payoutService, loggingService, tipService } = require('../services');
const socket = require('../utils/socket');


const createBet = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  betBody = req.body;
  betBody.userId = req.user.id;

  const game = await gameService.getGameById(betBody.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  const member = await memberService.getMemberByGameUserId(game.id,req.user.id);  
  const isAdminOrMod = game.userId == req.user.id || (member && member.isModerator);
  if (!isAdminOrMod)
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to create bets for this game.');

  if (betBody.betType == 'scale') {
    if (betBody.scale_options.min >= betBody.scale_options.max)
      throw new ApiError(httpStatus.NOT_FOUND, 'Min value must be smaller than max value.');

    populateScale_answers(betBody);
  }
  if (betBody.betType == 'catalogue') {
    
  }
  
  const bet = await betService.createBet(betBody);

  // Add log
  const betTitle = bet.title.length > 50 ? bet.title.sustr(0,48) + '..' : bet.title;
  await loggingService.createLogging({gameId: bet.gameId, logType: 'betCreated', title: 'Bet created', desc: 'Bet ' + betTitle + ' was created.'});

  // Inc betCount
  await gameService.increment(game.id, 'betCount', 1);

  // Send socket
  await socket.sendNewBetToGame(bet);

  res.status(httpStatus.CREATED).send(bet);
});

const solveBet = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');
  
  let bet = await betService.getBetById(req.params.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');

  const game = await gameService.getGameById(bet.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (bet.isSolved || bet.isAborted)
    throw new ApiError(httpStatus.FORBIDDEN, 'Bet has already been solved or aborted.');

  const member = await memberService.getMemberByGameUserId(game.id,req.user.id);  
  const isAdminOrMod = game.userId == req.user.id || (member && member.isModerator);
  if (!isAdminOrMod)
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to solve bets of this game.');

  let result;
  if (req.body.answerDecimal)
    result = req.body.answerDecimal;
  else if (req.body.answerIds)
    result = req.body.answerIds;

  if (bet.betType == 'catalogue')
    await betService.updateBetById(bet.id, {isSolved: true, correctAnswerIds: result});
  if (bet.betType == 'scale')
    await betService.updateBetById(bet.id, {isSolved: true, correctAnswerDecimal: result});
  
  payoutService.addToQueue(bet.id);

  // Update Membercount
  const page = await memberService.queryMembers({gameId: game.id}, {limit:1});
  //console.log('FINALIZEBET Update Membercount page',page); 
  await gameService.updateGameById(game.id, {memberCount: page.totalResults});
  
  bet = await betService.getBetById(req.params.betId);
  await socket.sendUpdateBetToGame(bet);

  res.status(httpStatus.NO_CONTENT).send();
});

const abortBet = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');
  
  let bet = await betService.getBetById(req.params.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');

  const game = await gameService.getGameById(bet.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (bet.isSolved || bet.isAborted)
    throw new ApiError(httpStatus.FORBIDDEN, 'Bet has already been solved or aborted.');

  const member = await memberService.getMemberByGameUserId(game.id,req.user.id);  
  const isAdminOrMod = game.userId == req.user.id || (member && member.isModerator);
  if (!isAdminOrMod)
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to abort bets of this game.');

  await betService.updateBetById(bet.id, {isAborted: true});

  payoutService.addToQueue(bet); 

  bet = await betService.getBetById(req.params.betId);
  await socket.sendUpdateBetToGame(bet);

  res.status(httpStatus.NO_CONTENT).send();
});


const endBet = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');
  
  let bet = await betService.getBetById(req.params.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');

  const game = await gameService.getGameById(bet.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (bet.isSolved || bet.isAborted)
    throw new ApiError(httpStatus.FORBIDDEN, 'Bet has already been solved or aborted.');

  const member = await memberService.getMemberByGameUserId(game.id,req.user.id);  
  const isAdminOrMod = game.userId == req.user.id || (member && member.isModerator);
  if (!isAdminOrMod)
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to end bets of this game.');

  await betService.updateBetById(bet.id, {timeLimit: Date.now()});
  
  bet = await betService.getBetById(req.params.betId);
  await socket.sendUpdateBetToGame(bet);

  res.status(httpStatus.NO_CONTENT).send();
});

const getBets = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['gameId', 'userId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  const result = await betService.queryBets(filter, options);
  res.send(result);
});

const getBet = catchAsync(async (req, res) => {
  const bet = await betService.getBetById(req.params.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found');
  
  res.send(bet);
});

const getSettlementTips = catchAsync(async (req, res) => {
  const bet = await betService.getBetById(req.params.betId);
  if (!bet)
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found');
  
  if (!bet.isSolved && !bet.isAborted)
    throw new ApiError(httpStatus.FORBIDDEN, 'Bet has not yet been solved or aborted.');
  
  const settlementTips = await payoutService.getSettlementTips(bet);
  res.send(settlementTips);
});

/*
const updateBet = catchAsync(async (req, res) => {
  const bet = await betService.updateBetById(req.params.betId, req.body);
  res.send(bet);
});

*/
const deleteBet = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  const bet = await betService.getBetById(req.params.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');

  const game = await gameService.getGameById(bet.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  const member = await memberService.getMemberByGameUserId(game.id,req.user.id);  
  const isAdminOrMod = game.userId == req.user.id || (member && member.isModerator);
  if (!isAdminOrMod)
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to solve bets of this game.');

  await tipService.deleteTipsByBetId(req.params.betId);
  await betService.deleteBetById(req.params.betId);
  res.status(httpStatus.NO_CONTENT).send();
});


const populateScale_answers = (betBody) => {
  const { min, max, step } = betBody.scale_options;
  const possibleAnswers = ((max - min) / step) + 1;
  let intervalSize;
  
  if (possibleAnswers <= 32) {
    intervalSize = step;
    maxFroms = possibleAnswers;
  } else {
    intervalSize = (max - min) / 32;
    maxFroms = 32;
  }

  betBody.scale_answers = [];

  for (let i = 0; i < maxFroms; i++)
    betBody.scale_answers.push({from: min+i*intervalSize, odds:betBody.scale_options.odds});

  console.log(betBody.scale_answers);
  return;
};

module.exports = {
  createBet,
  getBets,
  getBet,
  endBet,
  solveBet,
  abortBet,
  getSettlementTips,
  //updateBet,
  deleteBet,
};
