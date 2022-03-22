const { Bet } = require('../models');

/**
 * Create a bet
 * @param {Object} betBody
 * @returns {Promise<Bet>}
 */
const createBet = async (betBody) => {
  const bet = await Bet.create(betBody);
  return bet;
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
  return Bet.find({isSolved: true, isPaid: false});
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
  if (!bet) 
    return null
  
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
  if (!bet) 
    return null
  
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
  getFinishedUnpaidBets,
  increment,
};

