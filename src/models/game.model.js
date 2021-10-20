const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const gameSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
gameSchema.plugin(toJSON);
gameSchema.plugin(paginate);

/**
 * Check if name is taken
 * @param {string} name - The game's name
 * @param {ObjectId} [excludeGameId] - The id of the game to be excluded
 * @returns {Promise<boolean>}
 */
gameSchema.statics.isNameTaken = async function (name, excludeGameId) {
  const game = await this.findOne({ name, _id: { $ne: excludeGameId } });
  return !!game;
};

/**
 * Check if password matches the game's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
gameSchema.methods.isPasswordMatch = async function (password) {
  const game = this;
  return bcrypt.compare(password, game.password);
};

gameSchema.pre('save', async function (next) {
  const game = this;
  if (game.isModified('password')) {
    game.password = await bcrypt.hash(game.password, 8);
  }
  next();
});

/**
 * @typedef Game
 */
const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
