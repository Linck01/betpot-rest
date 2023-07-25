const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const gameService = require('../services/game.service.js');
const memberService = require('../services/member.service.js');

/*const createMember = catchAsync(async (req, res) => {
  const member = await memberService.createMember(req.user.id,req.body);
  res.status(httpStatus.CREATED).send(member);
});*/

const getMembers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'gameId', 'userId', 'isFavoritedGame']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await memberService.queryMembers(filter, options);
  res.send(result);
});

const getMember = catchAsync(async (req, res) => {
  const member = await memberService.getMemberByGameUserId(req.params.gameId,req.params.userId);
  
  res.send(member);
});


const updateMember = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');
  
  const game = await gameService.getGameById(req.params.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');

  const member = await memberService.getMemberByGameUserId(game.id,req.user.id);
  const isAdminOrMod = game.userId == req.user.id || (member && member.isModerator);

  if ('isfavoritedGame' in req.body && req.user.id != req.params.userId) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You can only update your own member data.');
  if ('isBanned' in req.body && !isAdminOrMod) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Only admin and mods are allowed to ban members.');
  if ('isModerator' in req.body && req.user.id != game.userId) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Only admin is allowed to assign the mod role.');

  let memberToUpdate = await memberService.getMemberByGameUserId(req.params.gameId,req.params.userId);
  if (!memberToUpdate)
    memberToUpdate = await memberService.createMember({userId: req.params.userId, gameId: req.params.gameId, currency: game.startCurrency});

  memberToUpdate = await memberService.updateMemberByGameUserId(req.params.gameId, req.params.userId, req.body);
  res.send(memberToUpdate);
});

const topUpStartCurrency = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');
  
  const game = await gameService.getGameById(req.body.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');
  
  if (req.user.id != game.userId) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Only the admin of a game can top up the member\'s currency.');

  await memberService.updateMembers({gameId: game.id, currency: { $lt: game.startCurrency}}, {currency: game.startCurrency});
  res.status(httpStatus.OK).send();
});

/*
const deleteMember = catchAsync(async (req, res) => {
  await memberService.deleteMemberById(req.params.memberId);
  res.status(httpStatus.NO_CONTENT).send();
});
*/

module.exports = {
  //createMember,
  getMembers,
  getMember,
  updateMember,
  //deleteMember,
  topUpStartCurrency
};
