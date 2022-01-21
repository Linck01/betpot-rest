const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const messageSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      trim: true,
    },
    gameId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      default: 0
    },
    message: {
      type: String,
      required: true,
      trim: true,
    }
  },
  {
    timestamps: { createdAt: '_createdAt', updatedAt: '_updatedAt' },
  }
);

// add plugin that converts mongoose to json
messageSchema.plugin(toJSON);
messageSchema.plugin(paginate);



/**
 * @typedef Message
 */
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
