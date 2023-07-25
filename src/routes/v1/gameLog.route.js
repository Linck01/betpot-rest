const express = require('express');
const auth = require('../../middlewares/auth.js');
const validate = require('../../middlewares/validate.js');

const gameLogValidation = require('../../validations/gameLog.validation.js');
const gameLogController = require('../../controllers/gameLog.controller.js');

const router = express.Router();

router
  .route('/')
  .get(validate(gameLogValidation.getGameLogs), gameLogController.getGameLogs)

module.exports = router;