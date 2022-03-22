const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { betService, gameService, memberService, payoutService } = require('../services');
const socket = require('../utils/socket');


const createBet = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  betBody = req.body;
  betBody.userId = req.user.id;

  const game = await gameService.getGameById(betBody.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (game.userId != betBody.userId)
    throw new ApiError(httpStatus.NOT_FOUND, 'Not authorized to create a bet for this game.');

  if (betBody.betType == 'scale')
    populateScale_answers(betBody);

  const bet = await betService.createBet(betBody);

  // Add log
  const betTitle = bet.title.length > 50 ? bet.title.sustr(0,48) + '..' : bet.title;
  await gameService.addLog(bet.gameId,'betCreated','Bet created','Bet ' + betTitle + ' was created.');

  // Inc betCount
  await gameService.increment(game.id, 'betCount', 1);

  // Send socket
  await socket.sendNewBetToGame(bet);

  res.status(httpStatus.CREATED).send(bet);
});

const finalizeBet = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');
  
  const bet = await betService.getBetById(req.body.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');

  const game = await gameService.getGameById(bet.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (game.userId != req.user.id)
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to finalize a bet for this game.');

  let result;
  if (req.body.answerDecimal)
    result = req.body.answerDecimal;
  else if (req.body.answerIds)
    result = req.body.answerIds;

  if (bet.isSolved)
    throw new ApiError(httpStatus.FORBIDDEN, 'Bet has already been solved.');

  if (bet.betType == 'catalogue')
    await betService.updateBetById(bet.id,{...bet, isSolved: true, correctAnswerIds: result})
  if (bet.betType == 'scale')
    await betService.updateBetById(bet.id,{...bet, isSolved: true, correctAnswerDecimal: result})
  
  payoutService.addToQueue([bet]);

  // Update Membercount
  const page = await memberService.queryMembers({gameId: game.id}, {limit:1});
  console.log('FINALIZEBET Update Membercount page',page); 
  await gameService.updateGameById(game.id, { memberCount: page.totalResults });
  
  res.status(httpStatus.NO_CONTENT).send();
});

const abortBet = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');
  
  const game = await gameService.getGameById(bet.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (game.userId != req.user.id)
    throw new ApiError(httpStatus.FORBIDDEN, 'Not allowed to finalize a bet for this game.');

  const bet = await getBetById(betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');

  await betService.updateBetById(bet.id,{...bet, isAborted: true});

  const betTitle = bet.title.length > 50 ? bet.title.sustr(0,48) + '..' : bet.title;
  await gameService.addLog(bet.gameId,'betAborted','Bet aborted','Bet ' + betTitle + ' was aborted and redistributed.');

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
  if (!bet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found');
  }
  
  res.send(bet);
});

/*
const updateBet = catchAsync(async (req, res) => {
  const bet = await betService.updateBetById(req.params.betId, req.body);
  res.send(bet);
});

const deleteBet = catchAsync(async (req, res) => {
  await betService.deleteBetById(req.params.betId);
  res.status(httpStatus.NO_CONTENT).send();
});
*/

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
    betBody.scale_answers.push({from: min+i*intervalSize});
  
  return;
};

module.exports = {
  createBet,
  getBets,
  getBet,
  finalizeBet,
  abortBet
  //updateBet,
  //deleteBet,
};
