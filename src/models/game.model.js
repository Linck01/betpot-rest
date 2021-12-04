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
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      trim: true,
    },
    serverId: {
      type: Number,
      required: true,
      default: 0
    },
    moderators: {
      type: [mongoose.SchemaTypes.ObjectId]
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
 * @typedef Game
 */
const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
