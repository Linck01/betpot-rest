const httpStatus = require('http-status');
const { Bet } = require('../models');
const ApiError = require('../utils/ApiError');
const { gameService } = require('./');
const socket = require('../utils/socket');

const finishedUnpaidBets = [];

/**
 * Finalize bet
 * @param {Object} 
 * @returns {Promise<Bet>}
 */
 const finalizeBet = async (user,betId,result) => {
  const bet = await getBetById(betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');

  const game = await gameService.getGameById(bet.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (game.userId != user.id)
    throw new ApiError(httpStatus.NOT_FOUND, 'Not authorized to finalize a bet for this game.');

  if (bet.isFinished)
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet has already been finalized.');

  if (bet.betType == 'catalogue')
    updateBetById(bet.id,{...bet, isFinished: true, correctAnswerIds: result})
  if (bet.betType == 'scale')
    updateBetById(bet.id,{...bet, isFinished: true, correctAnswerDecimal: result})
  
  
  finishedUnpaidBets.push(bet);
  
  return;
};

/**
 * Abort bet
 * @param {Object} 
 * @returns {Promise<Bet>}
 */
 const abortBet = async (userId,betId,result) => {
  const bet = await getBetById(betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');

  const game = await gameService.getGameById(bet.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (game.userId != userId)
    throw new ApiError(httpStatus.NOT_FOUND, 'Not authorized to finalize a bet for this game.');

    updateBetById(bet.id,{...bet, isAborted: true});
  return;
};

/**
 * Create a bet
 * @param {Object} betBody
 * @returns {Promise<Bet>}
 */
const createBet = async (userId,betBody) => {
  betBody.userId = userId;

  const game = await gameService.getGameById(betBody.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (game.userId != userId)
    throw new ApiError(httpStatus.NOT_FOUND, 'Not authorized to create a bet for this game.');

  if (betBody.betType == 'scale')
    populateScale_answers(betBody);

  const bet = await Bet.create(betBody);
  await socket.sendNewBetToGame(bet);
  return;
};

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

/**
 * Query for bets
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryBets = async (filter, options) => {
  const bets = await Bet.paginate(filter, options);
  return bets;
};

/**
 * Get bet by id
 * @param {ObjectId} id
 * @returns {Promise<Bet>}
 */
const getBetById = async (id) => {
  return Bet.findById(id);
};

/**
 * Get finished unpaid bets
 * @param {ObjectId} id
 * @returns {Promise<Bet>}
 */
 const getFinishedUnpaidBets = async () => {
  return Bet.find({isFinished: true, isPaid: false});
};

/**
 * Get bet by email
 * @param {string} email
 * @returns {Promise<Bet>}
 */
const getBetByEmail = async (email) => {
  return Bet.findOne({ email });
};

/**
 * Update bet by id
 * @param {ObjectId} betId
 * @param {Object} updateBody
 * @returns {Promise<Bet>}
 */
const updateBetById = async (betId, updateBody) => {
  const bet = await getBetById(betId);
  if (!bet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found');
  }
  
  Object.assign(bet, updateBody);
  await bet.save();
  return bet;
};

const increment = async (id, field, value) => {
  const obj = {}; obj[field] = value;

  const bet = Bet.findOneAndUpdate({_id: id}, {$inc: obj}, {useFindAndModify: false});
  return bet;
};


/**
 * Delete bet by id
 * @param {ObjectId} betId
 * @returns {Promise<Bet>}
 */
const deleteBetById = async (betId) => {
  const bet = await getBetById(betId);
  if (!bet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found');
  }
  await bet.remove();
  return bet;
};

module.exports = {
  createBet,
  queryBets,
  getBetById,
  getBetByEmail,
  updateBetById,
  deleteBetById,
  finalizeBet,
  abortBet,
  getFinishedUnpaidBets,
  finishedUnpaidBets,
  increment,
};

