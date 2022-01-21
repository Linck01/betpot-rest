const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const memberValidation = require('../../validations/member.validation');
const memberController = require('../../controllers/member.controller');

const router = express.Router();

router
  .route('/')
  .get(validate(memberValidation.getMembers), memberController.getMembers)

router
  .route('/:gameId/:userId')
  .get(validate(memberValidation.getGame), memberController.getMember)



module.exports = router;
