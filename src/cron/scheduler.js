const fct = require('../utils/fct');
const payoutService = require('../services/payout.service.js');
const betService = require('../services/bet.service.js');

module.exports.init = async () => {
    payout();
}

const payout = async () => {
    const bets =  await betService.getFinishedUnpaidBets();
    payoutService.addToQueue(bets);

    while (true) {
        try { await payoutService.processNextBet(); }
        catch (e) { console.log(e); }

        await fct.sleep(1000);
    }
}


/*
module.exports.init = async () => {
    console.log('Start payout queue.');
    payoutService.payoutQueue = await betService.getFinishedUnpaidBets();

    let nextBet;
    while (true) {
        if (payoutService.payoutQueue.length > 0) {
            nextBet = betService.finishedUnpaidBetsQueue[0];
            try {
                await payoutService.processPayout(nextBet);
            } catch (e) { 
                console.log(e); 
                await payoutService.removeFromQueue(nextBet.id);
            }
        }
        await fct.sleep(1000);
    }
}

*/