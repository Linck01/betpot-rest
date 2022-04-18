const httpStatus = require('http-status');
const { Message } = require('../models');
const ApiError = require('../utils/ApiError');

const createMessage = async (messageBody) => {
  let message = await Message.create(messageBody);

  return message;
};

const queryMessages = async (filter, options) => {
  const messages = await Message.paginate(filter, options);
  return messages;
};

const getMessageById = async (id) => {
  const message = await Message.findById(id);;
  return message;
};

const updateMessageById = async (messageId, updateBody) => {
  const message = await getMessageById(messageId);
  if (!message) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  
  if (updateBody.email && (await Message.isEmailTaken(updateBody.email, messageId))) 
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  
  Object.assign(message, updateBody);
  await message.save();
  return message;
};

const deleteMessageById = async (messageId) => {
  const message = await getMessageById(messageId);
  if (!message) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  
  await message.remove();
  return message;
};

const deleteMessagesByGameId = async (gameId) => {
  await Message.deleteMany({gameId});
  
  return;
};

module.exports = {
  createMessage,
  queryMessages,
  getMessageById,
  updateMessageById,
  deleteMessageById,
  deleteMessagesByGameId
};
