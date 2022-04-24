const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createBet = {
  body: Joi.object().keys({
    title: Joi.string().required().min(1).max(128),
    gameId: Joi.required().custom(objectId),
    desc: Joi.string().max(512).allow(''),
    betType: Joi.string().max(32),
    catalogue_answers: Joi.array().items(Joi.object().keys({
      title: Joi.string().required().min(1).max(64),
      odds: Joi.number().required().min(0).max(32),
    }).min(2).max(32)),
    scale_options: Joi.object().keys({
      step: Joi.number().min(0.000001).max(1000000000000),
      min: Joi.number().min(0).max(1000000000000),
      max: Joi.number().min(0).max(1000000000000),
      odds: Joi.number().required().min(1).max(32),
      winRate: Joi.number().required().min(1).max(95),
    }),
    timeLimit: Joi.date().required()
  }),
};

const solveBet = {
  params: Joi.object().keys({
    betId: Joi.custom(objectId),
  }),
  body: Joi.object().keys({
    answerIds: Joi.array().optional().items(Joi.number()).min(1).max(32),
    answerDecimal: Joi.number().optional()
  })
};

const abortBet = {
  params: Joi.object().keys({
    betId: Joi.custom(objectId),
  }),
};

const endBet = {
  params: Joi.object().keys({
    betId: Joi.custom(objectId),
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
    betId: Joi.custom(objectId),
  }),
};


module.exports = {
  createBet,
  getBets,
  getBet,
  updateBet,
  deleteBet,
  endBet,
  solveBet,
  abortBet,
};
