const httpStatus = require('http-status');
const { Tip } = require('../models');
const ApiError = require('../utils/ApiError');
const { memberService, betService, gameService } = require('./');
const socket = require('../utils/socket');


/**
 * Create a tip
 * @param {Object} tipBody
 * @returns {Promise<Tip>}
 */
const createTip = async (userId,tipBody) => {
  let member = await memberService.findOne({userId, gameId: tipBody.gameId});
  
  if(!member)
    member = await memberService.createMember(userId, { gameId: tipBody.gameId })

  if (member.currency < tipBody.currency) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Not enough points to spend.');

  if (tipBody.currency <= 0) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Currency must be greater than 0.');
  
  let bet = await betService.getBetById(tipBody.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');
  
  const game = await gameService.getGameById(tipBody.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');
  
  const randomTipFromUser = await findOne({betId: tipBody.betId, userId });
  // Reduce currency
  await memberService.increment(tipBody.gameId,userId,'currency', -tipBody.currency);
  
  let tip;
  if (bet.betType == 'catalogue')
    tip = await catalogueTipCreate(userId,tipBody);
  if (bet.betType == 'scale')
    tip = await scaleTipCreate(userId,tipBody,bet);
  
  // Increment bet memberCount (if user has not placed a tip on any answer)
  if (!randomTipFromUser)
    await betService.increment(tipBody.betId,'memberCount',1);
  
  // Increment bet inPot
  await betService.increment(tipBody.betId, 'inPot', tipBody.currency);

  bet = await betService.getBetById(tipBody.betId);
  await socket.sendNewTipToGame(tip,bet);
};

const catalogueTipCreate = async (userId,tipBody) => {
  // Add/Increment tip
  const duplicateTip = await findOne({betId: tipBody.betId, userId, answerId: tipBody.answerId });

  let tip;
  if (duplicateTip) {
    await increment(duplicateTip.id,'currency',tipBody.currency);
    tip = await findOne({betId: tipBody.betId, userId, answerId: tipBody.answerId });
  } else {
    // Increment answer memberCount (if user has not placed a tip on that specific answer)
    await betService.increment(tipBody.betId,'catalogue_answers.' + tipBody.answerId + '.memberCount', 1);

    tipBody.userId = userId;
    tip = await Tip.create(tipBody);
  }
  
  // Increment answer inPot
  await betService.increment(tipBody.betId,'catalogue_answers.' + tipBody.answerId + '.inPot', tipBody.currency);

  return tip;
};

const scaleTipCreate = async (userId,tipBody,bet) => {
  // Add/Increment tip
  const duplicateTip = await findOne({betId: tipBody.betId, userId, answerDecimal: tipBody.answerDecimal});
  const interval = getInterval(tipBody.answerDecimal, bet.scale_answers);

  const intervalFilter = interval.to ? { $gte: interval.from,  $lt: interval.to } : { $gte: interval.from };
  const intervalTip = await findOne({betId: tipBody.betId, userId, answerDecimal: intervalFilter});

  let tip;
  if (duplicateTip) {
    await increment(duplicateTip.id,'currency',tipBody.currency);
    tip = await findOne({betId: tipBody.betId, userId, answerDecimal: tipBody.answerDecimal});
  } else {
    tipBody.userId = userId;
    tip = await Tip.create(tipBody);
  }

  // Increment interval memberCount (if user has not placed a tip on that specific interval)
  if (!intervalTip) {
    await betService.increment(tipBody.betId,'scale_answers.' + interval.index + '.memberCount', 1);
  }

  // Increment interval inPot
  await betService.increment(tipBody.betId, 'scale_answers.' + interval.index + '.inPot', tipBody.currency);
  
  console.log('finalTip',tip.currency.toString());
  return tip;
};

const increment = async (id, field, value) => {
  const obj = {}; obj[field] = value;

  const tip = Tip.findOneAndUpdate({_id: id}, {$inc: obj}, {useFindAndModify: false});
  return tip;
};

const getInterval = (value,scale_answers) => {
  let from, to, index;

  for (let i = 0; i < scale_answers.length; i++) {
    if (value >= parseFloat(scale_answers[i].from.toString())) {
      
      index = i;
      from = parseFloat(scale_answers[i].from.toString());
      if (scale_answers[i+1])
        to = parseFloat(scale_answers[i+1].from.toString());
      else
        to = null;
    }
  }

  return { index, from, to };
};


/**
 * Query for tips
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTips = async (filter, options) => {
  const tips = await Tip.paginate(filter, options);
  return tips;
};

/**
 * Get tip by id
 * @param {ObjectId} id
 * @returns {Promise<Tip>}
 */
const getTipById = async (id) => {
  const tip = Tip.findById(id);

  if (!tip) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tip not found');
  }

  return tip;
};

const findOne = async (filter) => {
  const tip = await Tip.findOne(filter);
  return tip;
};

const getTipsByBetIdLean = async (betId) => {
  const tips = await Tip.find({betId}).lean();
  return tips;
};

const getTipByUserBetOption = async (betId, userId, answerId) => {
  const tip = await Tip.findOne({ betId, userId, answerId });
  return tip;
};

/**
 * Get tip by email
 * @param {string} email
 * @returns {Promise<Tip>}
 
const getTipsByUser = async (email) => {
  return Tip.findOne({ email });
};

/**
 * Update tip by id
 * @param {ObjectId} tipId
 * @param {Object} updateBody
 * @returns {Promise<Tip>}
 */
const updateTipById = async (tipId, updateBody) => {
  const tip = await getTipById(tipId);
  if (!tip) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tip not found');
  }
  
  Object.assign(tip, updateBody);
  await tip.save();
  return tip;
};


/**
 * Delete tip by id
 * @param {ObjectId} tipId
 * @returns {Promise<Tip>}
 */
const deleteTipById = async (tipId) => {
  const tip = await getTipById(tipId);
  if (!tip) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tip not found');
  }
  await tip.remove();
  return tip;
};


module.exports = {
  createTip,
  queryTips,
  getTipById,
  updateTipById,
  deleteTipById,
  getTipByUserBetOption,
  getTipsByBetIdLean
};
