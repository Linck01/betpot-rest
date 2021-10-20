const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const gameValidation = require('../../validations/game.validation');
const gameController = require('../../controllers/game.controller');

const router = express.Router();

router.get('/', validate(gameValidation.getGames), gameController.getGames);
router.get('/:gameId', validate(gameValidation.getGame), gameController.getGame);

router
  .route('/')
  .post(auth('createGame'), validate(gameValidation.createGame), gameController.createGame);

router
  .route('/:gameId')
  .patch(auth('manageGames'), validate(gameValidation.updateGame), gameController.updateGame)
  .delete(auth('manageGames'), validate(gameValidation.deleteGame), gameController.deleteGame);

module.exports = router;
