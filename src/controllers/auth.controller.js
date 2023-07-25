const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service.js');
const userService = require('../services/user.service.js');
const tokenService = require('../services/token.service.js');
const emailService = require('../services/email.service.js');
const fct = require('../utils/fct');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const { verify } = require('hcaptcha');

const register = catchAsync(async (req, res) => {
  /*const captcha = await verify(config.captchaSecret,req.body.captchaToken);
  if (config.env != 'development' && !captcha.success)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Could not verify captcha.');

  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });*/

  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send({user});
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const user = await userService.getUserByEmail(req.body.email);
  if (!user)
    throw new ApiError(httpStatus.NOT_FOUND, 'No user with that email.');
  
  const secondsToLastReset = fct.getTimeDifferenceToNow(user.lastResetPasswordEmail);
  if (secondsToLastReset < 3600)
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Please wait ' + Math.ceil((3600 - secondsToLastReset)/60) + 'm to request another password reset.');

  const resetPasswordCode = fct.randomString(20);
  await userService.updateUserById(user.id, {resetPasswordCode});
  
  await userService.updateUserById(user.id, {lastResetPasswordEmail: Date.now()});
  await emailService.sendForgotPasswordEmail(user, resetPasswordCode);

  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.body.userId);
  if (!user)
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');

  if (user.resetPasswordCode != req.body.code)
    throw new ApiError(httpStatus.NOT_FOUND, 'Wrong reset code.');

  const newPassword = fct.randomString(12);
  await userService.updateUserById(user.id, { password: newPassword });
  await emailService.sendResetPasswordEmail(user, newPassword);
  await userService.updateUserById(user.id, { resetPasswordCode: '' });
  res.status(httpStatus.NO_CONTENT).send();
});

/*
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});


*/
module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  //sendVerificationEmail,
  //verifyEmail,
};
