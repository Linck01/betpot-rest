const { Game } = require('../models');

const createGame = async (gameBody) => {
  const game = await Game.create(gameBody);
  return game;
};

const queryGames = async (filter, options) => {
  const games = await Game.paginate(filter, options);
  return games;
};

const getGameById = async (id) => {
  const game = await Game.findById(id);
  return game;
};

const getGameByEmail = async (email) => {
  const game = await Game.findOne({ email });
  return game;
};

const updateGameById = async (gameId, updateBody) => {
  const game = await getGameById(gameId);
  if (!game) 
    return null;
  
  Object.assign(game, updateBody);
  await game.save();
  return game;
};

const deleteGameById = async (gameId) => {
  const game = await getGameById(gameId);
  if (!game) 
    return null;

  await game.remove();
  return game;
};

const increment = async (id, field, value) => {
  const obj = {}; obj[field] = value;

  const game = await Game.findOneAndUpdate({_id: id}, {$inc: obj}, {useFindAndModify: false});
  return game;
};

module.exports = {
  createGame,
  queryGames,
  getGameById,
  getGameByEmail,
  updateGameById,
  deleteGameById,
  increment
};
