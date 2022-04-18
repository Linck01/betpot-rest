const Joi = require('joi');
const { objectId } = require('./custom.validation');


const getLoggings = {
  query: Joi.object().keys({
    gameId: Joi.string().custom(objectId).optional(),
    userId: Joi.string().custom(objectId).optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  getLoggings,
};
