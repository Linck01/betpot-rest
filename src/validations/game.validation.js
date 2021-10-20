const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createGame = {
  body: Joi.object().keys({
    name: Joi.string().required().min(5).max(128)
  }),
};

const getGames = {
  query: Joi.object().keys({
    name: Joi.string().allow('').optional(),
    userId: Joi.string().allow('').optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getGame = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateGame = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

const deleteGame = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};


module.exports = {
  createGame,
  getGames,
  getGame,
  updateGame,
  deleteGame
};
