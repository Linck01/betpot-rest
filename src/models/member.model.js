const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const memberSchema = mongoose.Schema(
  {
    gameId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
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
    timestamps: { createdAt: '_createdAt', updatedAt: '_updatedAt' },
  }
);

// add plugin that converts mongoose to json
memberSchema.plugin(toJSON);
memberSchema.plugin(paginate);



/**
 * @typedef Member
 */
const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
