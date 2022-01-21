const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const tipValidation = require('../../validations/tip.validation');
const tipController = require('../../controllers/tip.controller');

const router = express.Router();

//router.get('/', validate(tipValidation.getTips), tipController.getTips);
//router.get('/:tipId', validate(tipValidation.getTip), tipController.getTip);

router
  .route('/')
  .get(validate(tipValidation.getTips), tipController.getTips)
  .post(validate(tipValidation.createTip), tipController.createTip);


module.exports = router;
