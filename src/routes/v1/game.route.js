const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const gameValidation = require('../../validations/game.validation');
const gameController = require('../../controllers/game.controller');

const router = express.Router();



router
  .route('/')
  .get(validate(gameValidation.getGames), gameController.getGames)
  .post(validate(gameValidation.createGame), gameController.createGame);


router
  .route('/:gameId')
  .get(validate(gameValidation.getGame), gameController.getGame)
  .patch(validate(gameValidation.updateGame), gameController.updateGame)
  .delete(validate(gameValidation.deleteGame), gameController.deleteGame);

module.exports = router;
