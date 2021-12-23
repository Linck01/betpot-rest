const httpStatus = require('http-status');
const { Tip } = require('../models');
const ApiError = require('../utils/ApiError');
const { memberService, betService, gameService } = require('./');

/**
 * Create a tip
 * @param {Object} tipBody
 * @returns {Promise<Tip>}
 */
const createTip = async (userId,tipBody) => {
  let member = await memberService.getMemberByGameUserId(tipBody.gameId, userId);
  
  if(!member)
    member = await memberService.createMember(userId, { gameId: tipBody.gameId })

  console.log('AAAA', member, tipBody);
  if (member.currency < tipBody.currency) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Not enough points to spend.');
  
  const bet = await betService.getBetById(tipBody.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');
  
  const game = await gameService.getGameById(tipBody.gameId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  //await memberService.updateMemberByGameUserId(, { currency: member.currency - tipBody.currency });
  await memberService.findOneAndUpdate({ gameId: tipBody.gameId, userId }, { $inc: { currency: -tipBody.currency}}, {});
  

  let tip = await getTipByUserBetOption(tipBody.betId,userId,tipBody.optionId);
  console.log(tip);
  if (tip) {
    console.log('incTip', tip.currency, tipBody.currency, tip.currency + tipBody.currency);
    await findOneAndUpdate({ _id: tip.id }, { $inc: { currency: tipBody.currency }});

    await betService.findOneAndUpdate({ _id: tipBody.betId }, { $inc: { inPot: tipBody.currency}}, {});
    return;
  } else {
    console.log('newTip');
    tipBody.userId = userId;
    await Tip.create(tipBody);

    await betService.findOneAndUpdate({ _id: tipBody.betId }, { $inc: { inPot: tipBody.currency, tipCount : 1}}, {});
  }
  
};

const findOneAndUpdate = async (filter, update, options) => {
  const tip = Tip.findOneAndUpdate(filter, update, {...options, useFindAndModify: false});
  return tip;
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

const getTipByUserBetOption = async (betId, userId, optionId) => {
  console.log(betId, userId, optionId);
  const tip = await Tip.findOne({ betId, userId, optionId });
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
