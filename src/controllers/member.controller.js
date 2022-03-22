const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { memberService } = require('../services');

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
  const member = await memberService.updateMemberByGameUserId(req.params.gameId, req.params.userId, req.body);
  res.send(member);
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
};
