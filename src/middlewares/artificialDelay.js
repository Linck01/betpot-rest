const fct = require('../utils/fct');

const artificialDelay = () => async (req, res, next) => {
  console.log('DELAY');
  await fct.sleep(100);
  return next();
};


module.exports = artificialDelay;
