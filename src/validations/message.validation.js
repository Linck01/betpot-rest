const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createMessage = {
  body: Joi.object().keys({
    message: Joi.string().required().min(1).max(1024),
    userId: Joi.required().custom(objectId),
    gameId: Joi.string().custom(objectId),
  }),
};

const getMessages = {
  query: Joi.object().keys({
    gameId: Joi.custom(objectId),
    userId: Joi.custom(objectId).optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().max(100),
    page: Joi.number().integer(),
  }),
};

/*
const getGameMessage = {
  params: Joi.object().keys({
    gameId: Joi.string().custom(objectId),
  }),
};

const updateGameMessage = {
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

const deleteGameMessage = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

*/
module.exports = {
  createMessage,
  getMessages,
 /*
  getGameMessage,
  updateGameMessage,
  deleteGameMessage*/
};
