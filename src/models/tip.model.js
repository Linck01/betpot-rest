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
    optionId: {
      type: Number,
      required: true,
      trim: true,
    },
    currency: {
      type: mongoose.Decimal128,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true,
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
