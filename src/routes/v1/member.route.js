const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const memberValidation = require('../../validations/member.validation');
const memberController = require('../../controllers/member.controller');

const router = express.Router();

router.get('/', validate(memberValidation.getMembers), memberController.getMembers);
//router.get('/:gameId/:userId', validate(memberValidation.getGame), memberController.getGameMember);


module.exports = router;
