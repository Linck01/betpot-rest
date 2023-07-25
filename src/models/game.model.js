const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const gameSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    /*url: {
      type: String,
    },*/
    serverId: {
      type: Number,
      required: true,
      default: 0
    },
    bannerUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
      default: ''
    },
    currencyName: {
      type: String,
      trim: true,
      default: '⭐'
    },
    desc: {
      type: String,
      trim: true,
      default: ''
    },
    language: {
      type: String,
      trim: true,
      default: 'en_US'
    },
    isEnded: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    betCount: {
      type: Number,
      default: 0
    },
    memberCount: {
      type: Number,
      default: 0
    },
    betCount: {
      type: Number,
      default: 0
    },
    startCurrency: {
      type: mongoose.Decimal128,
      default: 1000
    }
  },
  {
    timestamps: { createdAt: '_createdAt', updatedAt: '_updatedAt' },
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
