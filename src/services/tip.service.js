const httpStatus = require('http-status');
const { Tip, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { memberService } = require('./');

/**
 * Create a tip
 * @param {Object} tipBody
 * @returns {Promise<Tip>}
 */
const createTip = async (userId,tipBody) => {
  console.log(tipBody);
  const member = await memberService.getMemberByGameUserId(userId, tipBody.gameId);

  if (member.points < tipBody.amount) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Not enough points to spend.');
  

  let tip = await Tip.getTipByUserBetOption(userId,tipBody.betId,tipBody.option);
  if (tip) {
    return await this.updateTipById(tip.id, {...tip, amount: (tip.amount + tipBody.amount)})

  } else {
    tipBody.userId = userId;
    return Tip.create(tipBody);
  }
  
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
  if (updateBody.email && (await Tip.isEmailTaken(updateBody.email, tipId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
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
};
