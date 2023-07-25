const httpStatus = require('http-status');
const Tip = require('../models/tip.model.js');

const ApiError = require('../utils/ApiError');

const createTip = async (tipBody) => {
  const tip = await Tip.create(tipBody);
  return tip;
};

const increment = async (id, field, value) => {
  const obj = {}; obj[field] = value;

  const tip = await Tip.findOneAndUpdate({_id: id}, {$inc: obj}, {useFindAndModify: false});
  return tip;
};

const queryTips = async (filter, options) => {
  const tips = await Tip.paginate(filter, options);
  return tips;
};

const getTipById = async (id) => {
  const tip = await Tip.findById(id);

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

const updateTipById = async (tipId, updateBody) => {
  const tip = await getTipById(tipId);
  if (!tip) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Tip not found');
  
  Object.assign(tip, updateBody);
  await tip.save();
  return tip;
};

const deleteTipById = async (tipId) => {
  const tip = await getTipById(tipId);
  if (!tip) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Tip not found');
  
  await tip.remove();
  return tip;
};

const deleteTipsByGameId = async (gameId) => {
  await Tip.deleteMany({gameId});
  
  return;
};

const deleteTipsByBetId = async (betId) => {
  await Tip.deleteMany({betId});
  
  return;
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
  increment,
  deleteTipsByGameId,
  deleteTipsByBetId
};
