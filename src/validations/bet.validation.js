const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createBet = {
  body: Joi.object().keys({
    title: Joi.string().required().min(1).max(128),
    gameId: Joi.required().custom(objectId),
    desc: Joi.string().max(512),
    answers: Joi.array().required().items(Joi.object().keys({
      title: Joi.string().required().min(1).max(64),
      odds: Joi.number().required().min(1).max(32),
    }),).min(2).max(32),
    timeLimit: Joi.date().required()
  }),
};

const getBets = {
  query: Joi.object().keys({
    name: Joi.string().allow('').optional(),
    gameId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getBet = {
  params: Joi.object().keys({
    betId: Joi.custom(objectId),
  }),
};

const updateBet = {
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

const deleteBet = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};


module.exports = {
  createBet,
  getBets,
  getBet,
  updateBet,
  deleteBet
};
