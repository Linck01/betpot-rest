const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const betValidation = require('../../validations/bet.validation');
const betController = require('../../controllers/bet.controller');

const router = express.Router();

router
  .route('/')
  .get(validate(betValidation.getBets), betController.getBets)
  .post(validate(betValidation.createBet), betController.createBet);


router
  .route('/:betId')
  .get(validate(betValidation.getBet), betController.getBet)
  //.patch(validate(betValidation.updateBet), betController.updateBet)
  .delete(validate(betValidation.deleteBet), betController.deleteBet);

router
  .route('/:betId/settlementTips')
  .get(validate(betValidation.getSettlementTips), betController.getSettlementTips);

router
  .route('/:betId/solve')
  .patch(validate(betValidation.solveBet), betController.solveBet);

router
  .route('/:betId/end')
  .patch(validate(betValidation.endBet), betController.endBet);

router
  .route('/:betId/abort')
  .patch(validate(betValidation.abortBet), betController.abortBet);

module.exports = router;
