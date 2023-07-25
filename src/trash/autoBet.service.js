
const sportingIndexScraper = require('../utils/sportingIndexScraper.js');


const scrape = async (date) => {
  try {
    await sportingIndexScraper.handleFutureFixtures();


  } catch (e) { 
    console.log(e);
  } 
}


module.exports = {
  scrape,
};

