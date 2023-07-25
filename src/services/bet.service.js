const Bet = require('../models/bet.model.js');

const createBet = async (betBody) => {
  const bet = await Bet.create(betBody);
  return bet;
};

const queryBets = async (filter, options) => {
  const bets = await Bet.paginate(filter, options);
  return bets;
};

const getBetById = async (id) => {
  const bet = await Bet.findById(id);
  return bet;
};

 const getSolvedAbortedUnpaidBets = async () => {
  const bets1 = await Bet.find({isSolved: true, isPaid: false});
  const bets2 = await Bet.find({isAborted: true, isPaid: false});

  return bets1.concat(bets2);
};

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

  const bet = await Bet.findOneAndUpdate({_id: id}, {$inc: obj}, {useFindAndModify: false});
  return bet;
};

const deleteBetById = async (betId) => {
  const bet = await getBetById(betId);
  if (!bet) 
    return null
  
  await bet.remove();
  return bet;
};

const deleteBetsByGameId = async (gameId) => {
  await Bet.deleteMany({gameId});
  
  return;
};

const getBetsByGameId = async (gameId,options) => {
  const bets = await Bet.find({gameId}, null, options);
  return bets;
};

module.exports = {
  createBet,
  queryBets,
  getBetById,
  updateBetById,
  deleteBetById,
  getSolvedAbortedUnpaidBets,
  increment,
  deleteBetsByGameId,
  getBetsByGameId
};

