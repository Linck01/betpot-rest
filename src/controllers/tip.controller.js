const httpStatus = require('http-status');
const pick = require('../utils/pick');
const fct = require('../utils/fct');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { tipService, betService, gameService, memberService, userService } = require('../services');
const socket = require('../utils/socket');
const { verify } = require('hcaptcha');
const config = require('../config/config');

const createTip = catchAsync(async (req, res) => {
  if (!req.user) 
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized.');

  if (req.user.premium < 1 && req.user.captchaTicker % config.captchaTickerInterval == 0) {
    if (!req.body.captchaToken)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Could not verify captcha.');

    const captcha = await verify(config.captchaSecret,req.body.captchaToken);
    if (!captcha.success)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Could not verify captcha.');
  }
  
  const tipBody = req.body;
  tipBody.userId = req.user.id;
  let bet = await betService.getBetById(tipBody.betId);
  if (!bet) 
    throw new ApiError(httpStatus.NOT_FOUND, 'Bet not found.');
  
  const game = await gameService.getGameById(tipBody.gameId);
  if (!game)
    throw new ApiError(httpStatus.NOT_FOUND, 'Game not found.');
  
  if (fct.getTimeDifferenceToNow(bet.timeLimit) > 0 || bet.isSolved || bet.isAborted)
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Cannot add tip - Bet has ended, is solved or was aborted.');

  let member = await memberService.getMemberByGameUserId(game.id, req.user.id);
  if(!member)
    member = await memberService.createMember({ gameId: game.id, userId: req.user.id, currency: game.startCurrency })

  if (member.isBanned)
    throw new ApiError(httpStatus.NOT_FOUND, 'You are banned from this game.');

  if (member.currency < tipBody.currency) 
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Not enough points to spend.');

  if (tipBody.currency <= 0) 
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Currency must be greater than 0.');

  const randomTipFromUser = await tipService.findOne({betId: tipBody.betId, userId: tipBody.userId });
  // Decrement currency
  await memberService.increment(tipBody.gameId,tipBody.userId,'currency', -tipBody.currency);
  
  let tip;
  if (bet.betType == 'catalogue')
    tip = await catalogueTipCreate(tipBody,bet);
  if (bet.betType == 'scale')
    tip = await scaleTipCreate(tipBody,bet);
  
  // Increment bet memberCount (if user has not placed a tip on any answer)
  if (!randomTipFromUser)
    await betService.increment(tipBody.betId,'memberCount',1);
  
  // Increment bet inPot
  await betService.increment(tipBody.betId, 'inPot', tipBody.currency);

  // Increment user captchaTicker
  await userService.increment(tipBody.userId, 'captchaTicker', 1);

  // Send socket message
  member = await memberService.findOne({userId: tipBody.userId, gameId: tipBody.gameId})
  bet = await betService.getBetById(tipBody.betId);
  await socket.sendNewTipToGame(tip,bet,member);

  res.status(httpStatus.CREATED).send(tip);
});

const catalogueTipCreate = async (tipBody,bet) => {
  // Add/Increment tip
  const duplicateTip = await tipService.findOne({betId: tipBody.betId, userId: tipBody.userId, answerId: tipBody.answerId });

  // Increment answer memberCount (if user has not placed a tip on that specific answer)
  if (!duplicateTip) 
    await betService.increment(tipBody.betId,'catalogue_answers.' + tipBody.answerId + '.memberCount', 1);

  let tip;
  tipBody.odds = fct.getActualOdds(bet)[tipBody.answerId];
  tip = await tipService.createTip(tipBody);

  // Increment answer inPot
  await betService.increment(tipBody.betId,'catalogue_answers.' + tipBody.answerId + '.inPot', tipBody.currency);

  return tip;
};

const scaleTipCreate = async (tipBody,bet) => {
  // Add/Increment tip
  //const duplicateTip = await tipService.findOne({betId: tipBody.betId, userId: tipBody.userId, answerDecimal: tipBody.answerDecimal});
  const interval = getScaleInterval(tipBody.answerDecimal, bet.scale_answers);

  const intervalFilter = interval.to ? { $gte: interval.from,  $lt: interval.to } : { $gte: interval.from };
  const intervalTip = await tipService.findOne({betId: tipBody.betId, userId: tipBody.userId, answerDecimal: intervalFilter});

  let tip;
  tipBody.odds = fct.getActualOdds(bet)[interval.index];
  tip = await tipService.createTip(tipBody);

  // Increment interval memberCount (if user has not placed a tip on that specific interval)
  if (!intervalTip) 
    await betService.increment(tipBody.betId,'scale_answers.' + interval.index + '.memberCount', 1);

  // Increment interval inPot
  await betService.increment(tipBody.betId, 'scale_answers.' + interval.index + '.inPot', tipBody.currency);
  
  return tip;
};



/*
const adaptCatalogueOdds = async (bet, tipBody) => {
  const currentOdds = parseFloat(bet.catalogue_answers[tipBody.answerId].odds);

  if (!bet.dynamicOdds)
    return currentOdds;

  const currencyFactor = parseFloat(tipBody.currency) / parseFloat(bet.dynamicOddsPower)
  
  let newCatalogueAnswers = [], answer;
  for (let i = 0; i < bet.catalogue_answers.length; i++) {
    answer = bet.catalogue_answers[i];

    if (i == tipBody.answerId)
      newCatalogueAnswers.push({...answer.toObject(), odds: 1 + (currentOdds - 1) / (1 + currencyFactor)});
    else
      newCatalogueAnswers.push({...answer.toObject(), odds: 1 + (parseFloat(answer.odds) - 1) * (1 + (currencyFactor / (bet.catalogue_answers.length - 1)))});
  }

  //console.log(newCatalogueAnswers[tipBody.answerId], newCatalogueAnswers);
  await betService.updateBetById(bet.id, {catalogue_answers: newCatalogueAnswers});

  return currentOdds;
}
*/

const adaptScaleOdds = async (bet, tipBody, interval) => {
  const currentOdds = bet.scale_answers[interval.index].odds;

  if (!bet.dynamicOdds)
    return currentOdds;

  const currencyFactor = parseFloat(tipBody.currency) / parseFloat(bet.dynamicOddsPower)

  let newScaleAnswers = [], answerInterval;
  for (let i = 0; i < bet.scale_answers.length; i++) {
    answerInterval = bet.scale_answers[i];

    if (i == interval.index)
      newScaleAnswers.push({...answerInterval.toObject(), odds: 1 + (currentOdds - 1) / (1 + currencyFactor)});
    else
      newScaleAnswers.push({...answerInterval.toObject(), odds: 1 + (parseFloat(answerInterval.odds) - 1) * (1 + (currencyFactor / (bet.scale_answers.length - 1)))});
  }

  console.log(newScaleAnswers[interval.index], newScaleAnswers);
  await betService.updateBetById(bet.id, {scale_answers: newScaleAnswers});

  return currentOdds;
}

const getTips = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['betId', 'userId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await tipService.queryTips(filter, options);

  res.send(result);
});


const getScaleInterval = (value,scale_answers) => {
  let from, to, index;

  for (let i = 0; i < scale_answers.length; i++) {
    if (value >= parseFloat(scale_answers[i].from.toString())) {
      
      index = i;
      from = parseFloat(scale_answers[i].from.toString());
      if (scale_answers[i+1])
        to = parseFloat(scale_answers[i+1].from.toString());
      else
        to = null;
    }
  }

  return { index, from, to };
};

/*



// Tipped answer
  // currency: 10, currentOdds: 2.0, factor: 0.01 -> newOdds: 1 + (2 - 1) / (1 + 0.01 ) = 1.99
  // currency: 1000, currentOdds: 2.0, factor: 1 -> newOdds: 1 + (2 - 1) / (1 + 1) = 1.5
  // currency: 500, currentOdds: 2.0, factor: 0.5 -> newOdds: 1 + (2 - 1) / (1 + 0.5) = 1.66
  // currency: 100, currentOdds: 2.0, factor: 0.1 -> newOdds: 1 + (2 - 1) / (1 + 0.1) = 1.91

  // currency: 10, currentOdds: 3.0, factor: 0.01 -> newOdds: 1 + (3 - 1) / (1 + 0.01 ) = 2.98
  // currency: 1000, currentOdds: 3.0, factor: 1 -> newOdds: 1 + (3 - 1) / (1 + 1) = 2
  // currency: 500, currentOdds: 3.0, factor: 0.5 -> newOdds: 1 + (3 - 1) / (1 + 0.5) = 2.33
  // currency: 100, currentOdds: 3.0, factor: 0.1 -> newOdds: 1 + (3 - 1) / (1 + 0.1) = 2.81

  // Other answers
  // currency: 10, currentOdds: 2.0, factor: 0.01 -> otherAnswerOdds: 1 + (2 - 1) * (1 + 0.01) = 2.01
  // currency: 1000, currentOdds: 2.0, factor: 1 -> otherAnswerOdds: 1 + (2 - 1) * (1 + 1) = 3
  // currency: 500, currentOdds: 2.0, factor: 0.5 -> otherAnswerOdds: 1 + (2 - 1) * (1 + 0.5) = 2.5
  // currency: 100, currentOdds: 2.0, factor: 0.1 -> otherAnswerOdds: 1 + (2 - 1) * (1 + 0.1) = 2.1

  // currency: 10, currentOdds: 3.0, factor: 0.01 -> otherAnswerOdds: 1 + (3 - 1) * (1 + 0.01) = 3.02
  // currency: 1000, currentOdds: 3.0, factor: 1 -> otherAnswerOdds: 1 + (3 - 1) * (1 + 1) = 5
  // currency: 500, currentOdds: 3.0, factor: 0.5 -> otherAnswerOdds: 1 + (3 - 1) * (1 + 0.5) = 4
  // currency: 100, currentOdds: 3.0, factor: 0.1 -> otherAnswerOdds: 1 + (3 - 1) * (1 + 0.1) = 3.2

  const currencyFactor = parseFloat(tipBody.currency) / parseFloat(bet.dynamicOddsPower); // 0.3

  // answerCount: 2, currentOdds: 2.0, factor: 1 -> otherAnswerOdds: 1 + (2 - 1) * (1 + 1) = 3
  // answerCount: 3, currentOdds: 2.0, factor: 1 -> otherAnswerOdds: 1 + (2 - 1) * (1 + (1 / 2)) = 2.5

  
*/

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
