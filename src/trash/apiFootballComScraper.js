const { Member, Bet, Tip } = require('../models');
const { gameService, tipService, betService } = require('../services');
const util = require('util');
const mongoose = require('mongoose');
const socket = require('../utils/socket.js');
const config = require('../config/config');
const axios = require('axios');
const fs = require('fs/promises');

const handleFutureFixtures = async (date) => {
  try {
      
      await football(date);
      await baseball(date);
      /*console.log('Baseball');
      const oddsBaseball = await scrapeOdds('https://v1.baseball.api-sports.io',date);
      await fs.writeFile('./football.txt', JSON.stringify(oddsBaseball));
      //const oddsBaseball = JSON.parse(await fs.readFile('./baseball.txt'));
      console.log(oddsBaseball.length);*/


      console.log('Successfully scraped api ' + '' + '.');
  } catch (e) { 
      console.log(e);
  } 
}

const football = async (date) => {
  console.log('Football');
  //const odds = await scrapePagedEndpoint('https://v3.football.api-sports.io','odds',{bet: 1, date: date.toISOString().split('T')[0]});
  //await fs.writeFile('./football.txt', JSON.stringify(odds));
  const odds = JSON.parse(await fs.readFile('./football.txt'));
  console.log(odds.length);

  return;
}

const baseball = async (date) => {
  console.log('Baseball');

  const games = (await axios(apiFootballComAxiosConfig('https://v1.baseball.api-sports.io','games',{ date: date.toISOString().split('T')[0] }))).data.response;
  //await fs.writeFile('./baseball.txt', JSON.stringify(odds));
  //const games = JSON.parse(await fs.readFile('./baseball.txt'));
  console.log(games.length);

  return;
}

const scrapePagedEndpoint = async (host,endpoint,options) => {
    let currentPage = 1, maxPage = 1, results = [];
    while (currentPage <= maxPage) {
      const res = await axios(apiFootballComAxiosConfig(host,endpoint, {...options, page: currentPage} ));

      if (res.data.paging)
        maxPage = res.data.paging.total;
        
      currentPage++;
      results.push(...res.data.response);
    }

    return results;
}

module.exports = {
  handleFutureFixtures,
};

function apiFootballComAxiosConfig(host,endpoint,options) {
    const obj = {
        method: 'get',
        url: host + '/' + endpoint + '?' + (new URLSearchParams(options).toString()) ,
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