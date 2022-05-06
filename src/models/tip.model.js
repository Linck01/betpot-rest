const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const tipSchema = mongoose.Schema(
  {
    betId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      trim: true,
    },
    gameId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      trim: true,
    },
    answerDecimal: {
      type: mongoose.Decimal128,
      trim: true,
    },
    answerId: {
      type: Number,
      trim: true,
    },
    odds: {
      type: mongoose.Decimal128,
    },
    currency: {
      type: mongoose.Decimal128,
      required: true,
      default: 0
    },
    diff: {
      type: mongoose.Decimal128,
    },
  },
  {
    timestamps: { createdAt: '_createdAt', updatedAt: '_updatedAt' },
  }
);

// add plugin that converts mongoose to json
tipSchema.plugin(toJSON);
tipSchema.plugin(paginate);

/**
 * @typedef Tip
 */
const Tip = mongoose.model('Tip', tipSchema);

module.exports = Tip;
