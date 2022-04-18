const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const loggingSchema = mongoose.Schema(
  {
    gameId: {
      type: mongoose.SchemaTypes.ObjectId,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
    },
    logType: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    desc: {
      type: String,
      required: true
    },
  },
  {
    timestamps: { createdAt: '_createdAt', updatedAt: '_updatedAt' },
  }
);

// add plugin that converts mongoose to json
loggingSchema.plugin(toJSON);
loggingSchema.plugin(paginate);

/**
 * @typedef Log
 */
const Logging = mongoose.model('Loggings', loggingSchema);

module.exports = Logging;
