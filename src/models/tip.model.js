const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const tipSchema = mongoose.Schema(
  {
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
    betId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      trim: true,
    },
    optionId: {
      type: Number,
      required: true,
      trim: true,
    },
    amount: {
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
 * Check if name is taken
 * @param {string} name - The tip's name
 * @param {ObjectId} [excludeTipId] - The id of the tip to be excluded
 * @returns {Promise<boolean>}
 */
tipSchema.statics.getTipByUserBetOption = async function (userId, betId, optionId) {
  const tip = await this.findOne({ userId, betId, optionId });
  return !!tip;
};

/**
 * @typedef Tip
 */
const Tip = mongoose.model('Tip', tipSchema);

module.exports = Tip;
