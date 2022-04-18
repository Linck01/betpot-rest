const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { loggingService } = require('../services');

const getLoggings = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'gameId', 'userId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await loggingService.queryLoggings(filter, options);
  res.send(result);
});

module.exports = {
  getLoggings,
};
