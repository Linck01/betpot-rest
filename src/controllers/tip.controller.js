const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { tipService } = require('../services');

const tipServer = [
  '10.0.0.3'
]

const createTip = catchAsync(async (req, res) => {
  const tip = await tipService.createTip(req.user.id,req.body);
  res.status(httpStatus.CREATED).send(tip);
});

const getTips = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'userId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await tipService.queryTips(filter, options);
  res.send(result);
});

/*
const getTip = catchAsync(async (req, res) => {
  const tip = await tipService.getTipById(req.params.tipId);
  res.send(tip);
});

/*
const updateTip = catchAsync(async (req, res) => {
  const tip = await tipService.updateTipById(req.params.tipId, req.body);
  res.send(tip);
});

const deleteTip = catchAsync(async (req, res) => {
  await tipService.deleteTipById(req.params.tipId);
  res.status(httpStatus.NO_CONTENT).send();
});
*/

module.exports = {
  createTip,
  getTips
};
