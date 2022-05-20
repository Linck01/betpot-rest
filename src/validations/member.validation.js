const Joi = require('joi');
const { password, objectId } = require('./custom.validation');


const getMembers = {
  query: Joi.object().keys({
    gameId: Joi.string().custom(objectId).optional(),
    userId: Joi.string().custom(objectId).optional(),
    isFavoritedGame: Joi.boolean().optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer(),
  }),
};

const getMember = {
  params: Joi.object().keys({
    gameId: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId),
  }),
};

const topUpStartCurrency = {
  body: Joi.object().keys({
    gameId: Joi.string().custom(objectId),
  }).min(1),
};

const updateMember = {
  params: Joi.object().keys({
    gameId: Joi.required().custom(objectId),
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    isFavoritedGame: Joi.boolean(),
    isBanned: Joi.boolean(),
    isModerator: Joi.boolean(),
  }).min(1),
};

module.exports = {
  getMembers,
  getMember,
  updateMember,
  topUpStartCurrency
};
