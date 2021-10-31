const httpStatus = require('http-status');
const { Message } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a message
 * @param {Object} messageBody
 * @returns {Promise<Message>}
 */
const createMessage = async (userId, messageBody) => {
  messageBody.userId = userId;

  return Message.create(messageBody);
};

/**
 * Query for messages
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMessages = async (filter, options) => {
  const messages = await Message.paginate(filter, options);
  return messages;
};

/**
 * Get message by id
 * @param {ObjectId} id
 * @returns {Promise<Message>}
 */
const getMessageById = async (id) => {
  return Message.findById(id);
};


/**
 * Get message by email
 * @param {string} email
 * @returns {Promise<Message>}
 */
const getMessageByEmail = async (email) => {
  return Message.findOne({ email });
};

/**
 * Update message by id
 * @param {ObjectId} messageId
 * @param {Object} updateBody
 * @returns {Promise<Message>}
 */
const updateMessageById = async (messageId, updateBody) => {
  const message = await getMessageById(messageId);
  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }
  if (updateBody.email && (await Message.isEmailTaken(updateBody.email, messageId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(message, updateBody);
  await message.save();
  return message;
};

/**
 * Delete message by id
 * @param {ObjectId} messageId
 * @returns {Promise<Message>}
 */
const deleteMessageById = async (messageId) => {
  const message = await getMessageById(messageId);
  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }
  await message.remove();
  return message;
};

module.exports = {
  createMessage,
  queryMessages,
  getMessageById,
  getMessageByEmail,
  updateMessageById,
  deleteMessageById,
};
