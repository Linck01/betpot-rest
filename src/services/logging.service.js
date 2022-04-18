
const { Logging } = require('../models/');

const createLogging = async (logBody) => {
  const logging = await Logging.create(logBody);
  return logging;
};

const queryLoggings = async (filter, options) => {
  const loggings = await Logging.paginate(filter, options);
  return loggings;
};

const deleteLoggingsByGameId = async (gameId) => {
  await Logging.deleteMany({gameId});
  
  return;
};

/*
const getLogById = async (id) => {
  const log = await Log.findById(id);
  return log;
};


const updateLogById = async (logId, updateBody) => {
  const log = await getLogById(logId);
  if (!log) 
    return null;
  
  Object.assign(log, updateBody);
  await log.save();
  return log;
};


const deleteLogById = async (logId) => {
  const log = await getLogById(logId);
  if (!log) 
    return null;

  await log.remove();
  return log;
};

const increment = async (id, field, value) => {
  const obj = {}; obj[field] = value;

  const log = await Log.findOneAndUpdate({_id: id}, {$inc: obj}, {useFindAndModify: false});
  return log;
};
*/
module.exports = {
  createLogging,
  queryLoggings,
  deleteLoggingsByGameId,
  //getLogById,
  //getLogByEmail,
  //updateLogById,
  //deleteLogById,
  //increment
};
