const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const gameLogSchema = mongoose.Schema(
  {
    gameId: {
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
    _createdAt: {
      type: Date,
      required: true,
    }
  }
);

// add plugin that converts mongoose to json
gameLogSchema.plugin(toJSON);
gameLogSchema.plugin(paginate);

/**
 * @typedef Log
 */
const GameLog = mongoose.model('GameLogs', gameLogSchema);

module.exports = GameLog;
