const express = require('express');
const auth = require('../../middlewares/auth.js');
const validate = require('../../middlewares/validate.js');
const tipValidation = require('../../validations/tip.validation.js');
const tipController = require('../../controllers/tip.controller.js');

const router = express.Router();

//router.get('/', validate(tipValidation.getTips), tipController.getTips);
//router.get('/:tipId', validate(tipValidation.getTip), tipController.getTip);

router
  .route('/')
  .get(validate(tipValidation.getTips), tipController.getTips)
  .post(validate(tipValidation.createTip), tipController.createTip);


module.exports = router;
