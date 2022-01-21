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
  
  let bet = await betService.getBetById(tipBody.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');
  
  const game = await gameService.getGameById(tipBody.gameId);
  if (!game) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');
  
  const randomTipFromUser = await findOne({betId: tipBody.betId, userId });
  // Reduce currency
  await memberService.findOneAndUpdate({gameId: tipBody.gameId, userId}, {$inc: {currency: -tipBody.currency}}, {});
  
  let tip;
  if (bet.betType == 'catalogue')
    tip = await catalogueTipCreate(userId,tipBody);
  if (bet.betType == 'scale')
    tip = await scaleTipCreate(userId,tipBody,bet);
  
  // Increment bet memberCount (if user has not placed a tip on any answer)
  if (!randomTipFromUser)
    await betService.findOneAndUpdate({_id: tipBody.betId}, {$inc: {memberCount : 1}}, {});
  
  // Increment bet inPot
  await betService.findOneAndUpdate({_id: tipBody.betId}, {$inc: {inPot: tipBody.currency}}, {});

  bet = await betService.getBetById(tipBody.betId);
  await socket.sendNewTipToGame(tip,bet);
};

const catalogueTipCreate = async (userId,tipBody) => {
  // Add/Increment tip
  const duplicateTip = await findOne({betId: tipBody.betId, userId, answerId: tipBody.answerId });

  let tip;
  if (duplicateTip) {
    tip = await findOneAndUpdate({ _id: duplicateTip.id }, { $inc: {currency: tipBody.currency}});
  } else {
    // Increment answer memberCount (if user has not placed a tip on that specific answer)
    const arrMemberCount = {}; arrMemberCount['catalogue_answers.' + tipBody.answerId + '.memberCount'] = 1;
    await betService.findOneAndUpdate({_id: tipBody.betId}, {$inc: arrMemberCount}, {});

    tipBody.userId = userId;
    tip = await Tip.create(tipBody);
  }
  
  // Increment answer inPot
  const arrInPot = {}; arrInPot['catalogue_answers.' + tipBody.answerId + '.inPot'] = tipBody.currency;
  await betService.findOneAndUpdate({_id: tipBody.betId}, {$inc: arrInPot}, {});

  return tip;
};

const scaleTipCreate = async (userId,tipBody,bet) => {
  // Add/Increment tip
  const duplicateTip = await findOne({betId: tipBody.betId, userId, answerDecimal: tipBody.answerDecimal});
  const interval = getInterval(tipBody.answerDecimal, bet);
  const intervalTip = await findOne({betId: tipBody.betId, userId, answerDecimal: { $gte: interval.from,  $lt: interval.to }});

  let tip;
  if (duplicateTip) {
    tip = await findOneAndUpdate({ _id: duplicateTip.id }, { $inc: {currency: tipBody.currency}});
    tip = await findOne({betId: tipBody.betId, userId, answerDecimal: tipBody.answerDecimal});
  } else {
    tipBody.userId = userId;
    tip = await Tip.create(tipBody);
  }

  // Increment interval memberCount (if user has not placed a tip on that specific interval)
  if (!intervalTip) {
    const arrMemberCount = {}; arrMemberCount['scale_answers.' + interval.index + '.memberCount'] = 1;
    await betService.findOneAndUpdate({_id: tipBody.betId}, {$inc: arrMemberCount}, {});
  }

  // Increment interval inPot
  const arrInPot = {}; arrInPot['scale_answers.' + interval.index + '.inPot'] = tipBody.currency;
  await betService.findOneAndUpdate({_id: tipBody.betId}, {$inc: arrInPot}, {});
  
  console.log('finalTip',tip.currency.toString());
  return tip;
};

const findOneAndUpdate = async (filter, update, options) => {
  const tip = Tip.findOneAndUpdate(filter, update, {...options, useFindAndModify: false});
  return tip;
};

const getInterval = (value,bet) => {
  let from, to, index;

  for (let i = 0; i < bet.scale_answers.length; i++) {
    if (value >= parseFloat(bet.scale_answers[i].from.toString())) {
      
      index = i;
      from = parseFloat(bet.scale_answers[i].from.toString());
      to = parseFloat(bet.scale_answers[i].to.toString());
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
  getTipByUserBetOption
};
