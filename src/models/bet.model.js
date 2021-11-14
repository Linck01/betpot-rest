const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const betSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    gameId: {
      type: String,
      required: true,
      trim: true,
    },
    answers: {
      type: [String],
      required: true,
    },
    timeLimit: {
      type: Date,
      required: true,
    },
    tips: {
      type: [{
        userId: mongoose.SchemaTypes.ObjectId,
        username: String,
        value: Boolean
      }],
      required: true,
      default: [],
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
betSchema.plugin(toJSON);
betSchema.plugin(paginate);


/**
 * @typedef Bet
 */
const Bet = mongoose.model('Bet', betSchema);

module.exports = Bet;
