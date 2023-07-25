const fct = require('../utils/fct');
const payoutService = require('../services/payout.service.js');
const betService = require('../services/bet.service.js');

module.exports.init = async () => {
    payout();
    //autoBets();
}

const payout = async () => {
    const bets =  await betService.getSolvedAbortedUnpaidBets();
    for (let bet of bets)
        payoutService.addToQueue(bet.id);

    while (true) {
        try { await payoutService.processNextBet(); }
        catch (e) { console.log(e); }

        await fct.sleep(2000);
    }
}

/*
const autoBetService = require('../services/autoBet.service.js');

const autoBets = async () => {
    while (true) {
        try { await autoBetService.scrape(); }
        catch (e) { console.log(e); }

        await fct.sleep(2000);
        break;
    }
}
*/