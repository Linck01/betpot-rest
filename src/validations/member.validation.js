const Joi = require('joi');
const { password, objectId } = require('./custom.validation');


const getMembers = {
  query: Joi.object().keys({
    name: Joi.string().allow('').optional(),
    userId: Joi.string().allow('').optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMember = {
  params: Joi.object().keys({
    gameId: Joi.string().custom(objectId),
  }),
};

const updateMember = {
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

module.exports = {
  getMembers,
  getMember,
  updateMember
};
