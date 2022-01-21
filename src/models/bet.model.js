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
    betType: {
      type: String,
      trim: true,
      required: true
    },
    memberCount: {
      type: Number,
      default: 0
    },
    inPot: {
      type: mongoose.Decimal128,
      default: 0
    },
    isFinished: {
      type: Boolean,
      default: false
    },
    catalogue_answers: {
      type: [{
        title: {
          type: String,
          required: true
        },
        isCorrect: {
          type: Boolean,
          default: false,
          required: true
        },
        odds: {
          type: mongoose.Decimal128,
          required: true
        },
        inPot: {
          type: mongoose.Decimal128,
          default: 0,
          required: true
        },
        memberCount: {
          type: Number,
          default: 0,
          required: true
        },
      }]
    },
    scale_options: {
      type: {
        step: {
          type: Number,
          required: true
        },
        min: {
          type: Number,
          required: true
        },
        max: {
          type: Number,
          required: true
        },
        winRate: {
          type: Number,
          required: true
        },
        odds: {
          type: Number,
          required: true
        },
        correct: {
          type: mongoose.Decimal128,
          default: false,
        },
      }
    },
    scale_answers: {
      type: [{
        from: {
          type: mongoose.Decimal128,
          required: true
        },
        to: {
          type: mongoose.Decimal128,
          required: true
        },
        inPot: {
          type: mongoose.Decimal128,
          default: 0,
          required: true
        },
        memberCount: {
          type: Number,
          default: 0,
          required: true
        },
      }]
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
