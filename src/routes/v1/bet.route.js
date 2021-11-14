const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const betValidation = require('../../validations/bet.validation');
const betController = require('../../controllers/bet.controller');

const router = express.Router();

router.get('/', validate(betValidation.getBets), betController.getBets);
router.get('/:betId', validate(betValidation.getBet), betController.getBet);

router
  .route('/')
  .post(auth('createBet'), validate(betValidation.createBet), betController.createBet);


router
  .route('/:betId')
  .patch(auth('manageBets'), validate(betValidation.updateBet), betController.updateBet)
  .delete(auth('manageBets'), validate(betValidation.deleteBet), betController.deleteBet);

module.exports = router;
