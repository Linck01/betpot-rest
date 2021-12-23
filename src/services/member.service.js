const httpStatus = require('http-status');
const { Member } = require('../models');
const ApiError = require('../utils/ApiError');
const { gameService } = require('./');

/**
 * Create a member
 * @param {Object} memberBody
 * @returns {Promise<Member>}
 */
const createMember = async (userId, memberBody) => {
  memberBody.userId = userId;

  const game = await gameService.getGameById(memberBody.gameId);
  memberBody.currency = game.startCurrency;

  return Member.create(memberBody);
};

/**
 * Query for members
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMembers = async (filter, options) => {
  const members = await Member.paginate(filter, options);
  return members;
};


const getMemberByGameUserId = async (gameId, userId) => {
  const member = Member.findOne({userId, gameId});

  return member;
};


/**
 * Update member by gameId + userId
 * @param {ObjectId} memberId
 * @param {Object} updateBody
 * @returns {Promise<Member>}
 */
 const updateMemberByGameUserId = async (gameId, userId, updateBody) => {
  const member = await getMemberByGameUserId(gameId, userId);
  if (!member) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');
  }
  
  Object.assign(member, updateBody);
  await member.save();
  return member;
};


/**
 * Update member by id
 * @param {ObjectId} memberId
 * @param {Object} updateBody
 * @returns {Promise<Member>}
 */
const updateMemberById = async (memberId, updateBody) => {
  const member = await getMemberById(memberId);
  if (!member) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');
  }
  
  Object.assign(member, updateBody);
  await member.save();
  return member;
};

const findOneAndUpdate = async (filter, update, options) => {
  const member = Member.findOneAndUpdate(filter, update, {...options, useFindAndModify: false});
  return member;
};

/**
 * Delete member by id
 * @param {ObjectId} memberId
 * @returns {Promise<Member>}
 */
const deleteMemberById = async (memberId) => {
  const member = await getMemberById(memberId);
  if (!member) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');
  }
  await member.remove();
  return member;
};

module.exports = {
  createMember,
  queryMembers,
  getMemberByGameUserId,
  updateMemberById,
  deleteMemberById,
  getMemberByGameUserId,
  updateMemberByGameUserId,
  findOneAndUpdate
};
