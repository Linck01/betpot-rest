const express = require('express');
const auth = require('../../middlewares/auth.js');
const validate = require('../../middlewares/validate.js');

const memberValidation = require('../../validations/member.validation.js');
const memberController = require('../../controllers/member.controller.js');

const router = express.Router();

router
  .route('/')
  .get(validate(memberValidation.getMembers), memberController.getMembers)

router
  .route('/:gameId/:userId')
  .get(validate(memberValidation.getMember), memberController.getMember)
  .patch(validate(memberValidation.updateMember), memberController.updateMember)

router
  .route('/topUpStartCurrency')
  .patch(validate(memberValidation.topUpStartCurrency), memberController.topUpStartCurrency)

module.exports = router;