const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service.js');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (filter.id && Array.isArray(filter.id)) {
    filter._id = { $in: filter.id }
  
    delete filter.id;
  }
  
  options.select = {username: 1};

  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId, {username: true, captchaTicker: true, premium: true});

  if (!user) 
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  res.send(user);
});

const getUserByToken = catchAsync(async (req, res) => {
  if (!req.user)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  res.send(req.user);
});

const updateUser = catchAsync(async (req, res) => {
  if (!req.user || req.user.id != req.params.userId)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  let updateBody = {};
  if (req.body.password) {
    if (!(await req.user.isPasswordMatch(req.body.password)))
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    
      updateBody.password = req.body.newPassword;
  }
  
  const user = await userService.updateUserById(req.params.userId, updateBody);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserByToken
};
