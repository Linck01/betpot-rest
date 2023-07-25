const express = require('express');
const auth = require('../../middlewares/auth.js');
const validate = require('../../middlewares/validate.js');
const messageValidation = require('../../validations/message.validation.js');
const messageController = require('../../controllers/message.controller.js');


const router = express.Router();


router
  .route('/')
    .get(validate(messageValidation.getMessages), messageController.getMessages)
    .post(validate(messageValidation.createMessage), messageController.createMessage);

module.exports = router;
