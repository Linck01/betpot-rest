const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createGame = {
  body: Joi.object().keys({
    title: Joi.string().required().min(5).max(128)
  }),
};

const getGames = {
  query: Joi.object().keys({
    name: Joi.string().allow('').optional(),
    userId: Joi.custom(objectId).allow('').optional(),
    ids: Joi.array().optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    isEnded: Joi.boolean().optional(),
    isPublic: Joi.boolean().optional()
  }),
};

const getGame = {
  params: Joi.object().keys({
    gameId: Joi.string().custom(objectId),
  }),
};

const updateGame = {
  body: Joi.object().keys({
      title: Joi.string().max(128),
      desc: Joi.string().max(4096).allow(''),
      isPublic: Joi.boolean(),
      isEnded: Joi.boolean(),
      startCurrency: Joi.number(),
      currencyName: Joi.string().max(32),
      bannerUrl: Joi.string().max(4096),
      language: Joi.string().max(16)
    })
};

const deleteGame = {
  params: Joi.object().keys({
    gameId: Joi.custom(objectId),
  }),
};


module.exports = {
  createGame,
  getGames,
  getGame,
  updateGame,
  deleteGame
};
