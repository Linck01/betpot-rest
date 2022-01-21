const httpStatus = require('http-status');
const { Bet } = require('../models');
const ApiError = require('../utils/ApiError');
const { gameService } = require('./');

/**
 * Create a bet
 * @param {Object} betBody
 * @returns {Promise<Bet>}
 */
const createBet = async (userId, betBody) => {
  betBody.userId = userId;

  const game = await gameService.getGameById(betBody.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  if (betBody.betType == 'scale')
    populateScale_answers(betBody);

  return Bet.create(betBody);
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
    betBody.scale_answers.push({from: min+i*intervalSize, to: min+(i+1)*intervalSize});
  
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

const findOneAndUpdate = async (filter, update, options) => {
  const bet = Bet.findOneAndUpdate(filter, update, {...options, useFindAndModify: false});
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
  findOneAndUpdate
};
