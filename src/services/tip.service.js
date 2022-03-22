const httpStatus = require('http-status');
const { Tip } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a tip
 * @param {Object} tipBody
 * @returns {Promise<Tip>}
 */
const createTip = async (tipBody) => {
  tip = await Tip.create(tipBody);
  return tip;
};



const increment = async (id, field, value) => {
  const obj = {}; obj[field] = value;

  const tip = Tip.findOneAndUpdate({_id: id}, {$inc: obj}, {useFindAndModify: false});
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
  getTipsByBetIdLean,
  findOne,
  increment
};
