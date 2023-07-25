const { Member, Bet, Tip } = require('../models');
const { gameService, tipService, betService } = require('../services');
const util = require('util');
const mongoose = require('mongoose');
const socket = require('../utils/socket.js');
const fct = require('../utils/fct.js');
const config = require('../config/config');
const axios = require('axios');
const fs = require('fs/promises');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const testCache = true;
const handleFutureFixtures = async (date) => {
  try {
      
      const footballPaths = await scrapeUrls('football','Tomorrow');
      for (const path of footballPaths) {
        await scrapeFootballUrl(path);
        await fct.sleep(1000);
        break;
      }
        

      //const baseballUrls = await scrapeUrls('baseball','Tomorrow');

      console.log('Successfully scraped ' + '' + '.');
  } catch (e) { 
      console.log(e);
  } 
}

const scrapeFootballUrl = async (path) => {
  const result = await axios(axiosOpt('https://www.sportingindex.com' + path,{}));
  console.log(path);
  await fs.writeFile('./test.txt', JSON.stringify(result.data));
  const { document } = (new JSDOM(result.data)).window;
  //[...document.querySelectorAll('td')].find( e => console.log(e.className));
  

  console.log(path);
  return;
}





const scrapeUrls = async (sportTitle,timeTitle) => {
  console.log(sportTitle);

  let data;
  if (testCache) {
    data = JSON.parse(await fs.readFile('./' + sportTitle + '.txt'));
  } else {
    const result = await axios(axiosOpt('https://www.sportingindex.com/spread-betting/' + sportTitle,{}));
    data = result.data;
    await fs.writeFile('./' + sportTitle + '.txt', JSON.stringify(data));
  }
  
  //console.log(result.data);
  const { document } = (new JSDOM(data)).window;
  const trs = [];
  [...document.querySelectorAll('h3')].find( e => e.textContent.trim() == timeTitle).nextElementSibling.querySelectorAll('tr').forEach(e => trs.push(e));

  const paths = [];
  for (const tr of trs) {
    const tds = tr.querySelectorAll('td');
    for (const td of tds) {
      if (td.className == 'meeting')
      paths.push(td.querySelector('a').getAttribute('href'));
    }
  }

  console.log(trs.length + ' ' + paths.length);
  return paths;
}



module.exports = {
  handleFutureFixtures,
};

function axiosOpt(host,options) {
    const obj = {
        method: 'get',
        url: host + '?' + (new URLSearchParams(options).toString()) ,
        headers: {
          'x-apisports-key': config.apiFootballComSecret,
        }
    }

    return obj;
}

function censor(censor) {
    var i = 0;
    
    return function(key, value) {
      if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
        return '[Circular]'; 
      
      if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
        return '[Unknown]';
      
      ++i; // so we know we aren't using the original object anymore
      
      return value;  
    }
}