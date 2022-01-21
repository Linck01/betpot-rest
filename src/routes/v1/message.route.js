const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const messageValidation = require('../../validations/message.validation');
const messageController = require('../../controllers/message.controller');


const router = express.Router();


router
  .route('/')
    .get(validate(messageValidation.getMessages), messageController.getMessages)
    .post(validate(messageValidation.createMessage), messageController.createMessage);

module.exports = router;
