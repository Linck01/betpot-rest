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
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
    },
    tipCount: {
      type: Number,
      default: 0
    },
    inPot: {
      type: Number,
      default: 0
    },
    isFinished: {
      type: Boolean,
      default: false
    },
    answers: {
      type: [{
        id: Number,
        title: String,
        isCorrect: {
          type: Boolean,
          default: false
        },
        odds: {
          type: mongoose.Decimal128,
          required: true
        },
        inPot: {
          type: mongoose.Decimal128,
          default: 0
        }
      }],
      required: true,
    },
    timeLimit: {
      type: Date,
      required: true,
    }
  },
  {
    timestamps: { createdAt: '_createdAt', updatedAt: '_updatedAt' },
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
