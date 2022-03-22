
const { Game } = require('../models');

/**
 * Create a game
 * @param {Object} gameBody
 * @returns {Promise<Game>}
 */
const createGame = async (gameBody) => {
  const game = await Game.create(gameBody);
  return game;
};

/**
 * Query for games
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryGames = async (filter, options) => {
  const games = await Game.paginate(filter, options);
  return games;
};

/**
 * Get game by id
 * @param {ObjectId} id
 * @returns {Promise<Game>}
 */
const getGameById = async (id) => {
  return Game.findById(id);
};

/**
 * Get game by email
 * @param {string} email
 * @returns {Promise<Game>}
 */
const getGameByEmail = async (email) => {
  return Game.findOne({ email });
};

/**
 * Update game by id
 * @param {ObjectId} gameId
 * @param {Object} updateBody
 * @returns {Promise<Game>}
 */
const updateGameById = async (gameId, updateBody) => {
  const game = await getGameById(gameId);
  if (!game) 
    return null;
  
  Object.assign(game, updateBody);
  await game.save();
  return game;
};

/**
 * Delete game by id
 * @param {ObjectId} gameId
 * @returns {Promise<Game>}
 */
const deleteGameById = async (gameId) => {
  const game = await getGameById(gameId);
  if (!game) 
    return null;

  await game.remove();
  return game;
};

/**
 * Logs
 */

const addLog = async (gameId,logType,title,desc) => {
  const game = await getGameById(gameId);
  const now = new Date();
  const newLog = [...game.logs, {logType,title,desc,createdAt: now}];

  trimLog(newLog);

  await updateGameById(game.id,{logs: newLog});

  return;
};

const trimLog =  (newLog) => {
  if (newLog.length > 100)
      newLog.shift();

  return;
};

const increment = async (id, field, value) => {
  const obj = {}; obj[field] = value;

  const game = Game.findOneAndUpdate({_id: id}, {$inc: obj}, {useFindAndModify: false});
  return game;
};

module.exports = {
  createGame,
  queryGames,
  getGameById,
  getGameByEmail,
  updateGameById,
  deleteGameById,
  addLog,
  increment
};
