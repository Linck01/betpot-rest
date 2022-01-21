const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createTip = {
  body: Joi.object().keys({
    betId: Joi.custom(objectId),
    gameId: Joi.custom(objectId),
    userId: Joi.custom(objectId),
    answerId: Joi.number().optional().min(0).max(31),
    answerDecimal: Joi.number().optional(),
    currency: Joi.number()
  }),
};

const getTips = {
  query: Joi.object().keys({
    betId: Joi.custom(objectId).optional(),
    gameId: Joi.custom(objectId).optional(),
    userId: Joi.custom(objectId).optional(),
    answerId: Joi.number().min(0).max(31),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};


/*
const getTip = {
  params: Joi.object().keys({
    tipId: Joi.string().custom(objectId),
  }),
};

const updateTip = {
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

const deleteTip = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};*/


module.exports = {
  createTip,
  getTips
};
