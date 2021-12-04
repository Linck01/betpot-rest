const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { betService } = require('../services');

const createBet = catchAsync(async (req, res) => {
  const bet = await betService.createBet(req.user.id,req.body);
  res.status(httpStatus.CREATED).send(bet);
});

const getBets = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'userId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  const result = await betService.queryBets(filter, options);
  res.send(result);
});

const getBet = catchAsync(async (req, res) => {
  const bet = await betService.getBetById(req.params.betId);
  if (!bet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found');
  }
  
  res.send(bet);
});

const updateBet = catchAsync(async (req, res) => {
  const bet = await betService.updateBetById(req.params.betId, req.body);
  res.send(bet);
});

const deleteBet = catchAsync(async (req, res) => {
  await betService.deleteBetById(req.params.betId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createBet,
  getBets,
  getBet,
  updateBet,
  deleteBet,
};
