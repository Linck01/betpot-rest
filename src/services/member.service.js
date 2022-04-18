const httpStatus = require('http-status');
const { Member } = require('../models');
const ApiError = require('../utils/ApiError');
const { gameService } = require('./');

/**
 * Create a member
 * @param {Object} memberBody
 * @returns {Promise<Member>}
 */
const createMember = async (memberBody) => {
  const member = await Member.create(memberBody);
  return member;
};

const queryMembers = async (filter, options) => {
  const members = await Member.paginate(filter, options);
  return members;
};

const getMemberByGameUserId = async (gameId, userId) => {
  const member = await Member.findOne({userId, gameId});

  return member;
};

 const updateMemberByGameUserId = async (gameId, userId, updateBody) => {
  const member = await getMemberByGameUserId(gameId, userId);
  if (!member) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');
  
  
  Object.assign(member, updateBody);
  await member.save();
  return member;
};

const updateMemberById = async (memberId, updateBody) => {
  const member = await getMemberById(memberId);
  if (!member) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');
  
  
  Object.assign(member, updateBody);
  await member.save();
  return member;
};

const increment = async (gameId, userId, field, value) => {
  const obj = {}; obj[field] = value;

  const member = await Member.findOneAndUpdate({gameId, userId}, {$inc: obj}, {useFindAndModify: false});
  return member;
};

const findOne = async (filter) => {
  const member = await Member.findOne(filter);
  return member;
};

const deleteMemberById = async (memberId) => {
  const member = await getMemberById(memberId);
  if (!member) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');
  

  await member.remove();
  return member;
};

const deleteMembersByGameId = async (gameId) => {
  await Member.deleteMany({gameId});
  
  return;
};

module.exports = {
  createMember,
  queryMembers,
  getMemberByGameUserId,
  updateMemberById,
  deleteMemberById,
  updateMemberByGameUserId,
  findOne,
  increment,
  deleteMembersByGameId
};
