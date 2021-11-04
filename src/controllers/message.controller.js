const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { messageService } = require('../services');
const { userService } = require('../services');
const socket = require('../utils/socket');

const createMessage = catchAsync(async (req, res) => {
  let message = await messageService.createMessage(req.user.id,req.body);
  const user = await userService.getUserById(req.user.id, { username: true, role: true});
  console.log(user);
  message = message.toObject();
  message.user = user;

  socket.sendChatMessageToGameMembers(message);

  res.status(httpStatus.CREATED).send(message);
});

const getMessages = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['gameId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const messagesResult = await messageService.queryMessages(filter, options);
  messagesResult.results = await userService.addUsersToArray(messagesResult.results);

  res.send(messagesResult);
});

const getMessage = catchAsync(async (req, res) => {
  const message = await messageService.getMessageById(req.params.messageId);
  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }
  message.server = messageServer[0];
  
  res.send(message);
});

const updateMessage = catchAsync(async (req, res) => {
  const message = await messageService.updateMessageById(req.params.messageId, req.body);
  res.send(message);
});

const deleteMessage = catchAsync(async (req, res) => {
  await messageService.deleteMessageById(req.params.messageId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createMessage,
  getMessages,
  getMessage,
  updateMessage,
  deleteMessage,
};
