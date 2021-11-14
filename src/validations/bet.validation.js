const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createBet = {
  body: Joi.object().keys({
    title: Joi.string().required().min(5).max(128),
    gameId: Joi.string().required().custom(objectId),
    answers: Joi.array().required().items(Joi.string()).min(2).max(10),
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
    betId: Joi.string().custom(objectId),
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
