const Joi = require('joi');
const { objectId } = require('./custom.validation');


const getGameLogs = {
  query: Joi.object().keys({
    gameId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  getGameLogs,
};
