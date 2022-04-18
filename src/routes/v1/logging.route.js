const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const loggingValidation = require('../../validations/logging.validation');
const loggingController = require('../../controllers/logging.controller');

const router = express.Router();

router
  .route('/')
  .get(validate(loggingValidation.getLoggings), loggingController.getLoggings)

module.exports = router;