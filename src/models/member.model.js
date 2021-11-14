const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const memberSchema = mongoose.Schema(
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
    username: {
      type: String,
      required: true,
      trim: true,
    },
    serverId: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
memberSchema.plugin(toJSON);
memberSchema.plugin(paginate);



/**
 * @typedef GameMember
 */
const GameMember = mongoose.model('GameMember', memberSchema);

module.exports = GameMember;
