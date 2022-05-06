const { Member, Bet, Tip } = require('../models');
const { gameService, tipService, betService } = require('./');
const util = require('util');
const mongoose = require('mongoose');
const socket = require('../utils/socket.js');
const loggingService = require('./logging.service.js');

let betQueue = [];

const addToQueue = (betId) => {
  betQueue.push(betId);
}

const removeFromQueue = (betId) => {
  betQueue = betQueue.filter(function( id ) {
      return id != betId;
  });
} 

const processNextBet = async () => {
    if (betQueue.length > 0) {
        try {
            const nextBet = await betService.getBetById(betQueue[0]);
            console.log('Started payout for bet ' + nextBet.id + '.');
            
            const settlementTips = await getSettlementTips(nextBet);
            removeFromQueue(nextBet.id);
            await payoutSettlement(nextBet, settlementTips);

            console.log('Successfully paid out bet ' + nextBet.id + '.');
        } catch (e) { 
            console.log(e);
            removeFromQueue(betQueue[0]);
        }
    }
}

const getSettlementTips = async (bet) => {

    const tips = await tipService.getTipsByBetIdLean(bet.id);
    await setIsWinner(bet, tips);
    await setPossibleGainAndLoss(tips);
    await setActualGainAndLoss(tips);
  
    return tips;
}

const payoutSettlement = async (bet,settlementTips) => {
    const session = await mongoose.startSession();

    console.log();console.log('settlement',util.inspect(settlementTips,{showHidden: false, depth: 3, colors: true}));
    try {
        session.startTransaction();
        
        //console.log(bet,tips);
        const bulkWriteMemberRequest = [],bulkWriteTipRequest = [];
        for (let tip of settlementTips) {
            bulkWriteMemberRequest.push({updateOne:{filter: {gameId: bet.gameId,userId: tip.userId}, update: {$inc: {currency: tip.inc}}}});
            bulkWriteTipRequest.push({updateOne: {filter: {_id: tip._id}, update: {diff: tip.diff}}});
        }
        
        //console.log();console.log('bulkWriteTipRequest',util.inspect(bulkWriteTipRequest,{showHidden: false, depth: 3, colors: true}));
        //console.log();console.log('bulkWriteMemberRequest',util.inspect(bulkWriteMemberRequest,{showHidden: false, depth: 5, colors: true}));
        await Tip.bulkWrite(bulkWriteTipRequest);
        await Member.bulkWrite(bulkWriteMemberRequest);
        await Bet.updateOne({_id: bet.id},{isPaid: true});

        const betTitle = bet.title.length > 50 ? bet.title.sustr(0,48) + '..' : bet.title;
        await loggingService.createLogging({gameId: bet.gameId, logType: 'betPaidOut', title: 'Bet paid out', desc: 'Bet "' + betTitle + '" was solved & redistributed.'});

        await session.commitTransaction();
        session.endSession();

    } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw new Error('PayoutBet error: ' + e);
    }

    bet = await betService.getBetById(bet.id);
    const tips = await tipService.getTipsByBetIdLean(bet.id);
    
    await socket.sendUpdateTipsToGame(bet,tips);
    return;
};

const setActualGainAndLoss = async (tips) => {
    let totalGainsAndLosses = 0;
    const totalPossibleGain = tips.filter(t => t.isWinner).reduce((prev,curr) => prev + curr.possibleGain, 0);
    const totalPossibleLoss = tips.filter(t => !t.isWinner).reduce((prev,curr) => prev + curr.possibleLoss, 0);

    let totalActualGain, totalActualLoss;
    if (totalPossibleGain <= 0 || totalPossibleLoss <= 0) {
        totalActualGain = 0;
        totalActualLoss = 0;
    } else if (totalPossibleGain < totalPossibleLoss) {
        totalActualGain = totalPossibleGain;
        totalActualLoss = totalPossibleGain;
    } else if (totalPossibleGain > totalPossibleLoss) {
        totalActualGain = totalPossibleLoss;
        totalActualLoss = totalPossibleLoss;
    }

    for (let tip of tips) {
        if (tip.isWinner) 
            tip.diff = totalActualGain * (tip.possibleGain / totalPossibleGain); 
        else 
            tip.diff = (-1) * totalActualLoss * (tip.possibleLoss / totalPossibleLoss);

        tip.inc = tip.diff + parseFloat(tip.currency);
        totalGainsAndLosses += tip.diff;
    }

    if (Math.abs(totalGainsAndLosses) > 0.001)
        throw Error('Total gains and losses not equal: ' + totalGains + ' ' + totalLosses);
 
  return;
}

const setIsWinner = async (bet,tips) => {
    if (bet.betType == 'scale')
        sortProximity(bet,tips);

    let isWinner, lastTip, accumulatedPot = 0, first = true;

    const inPot = tips.reduce((prev,curr) => prev + parseFloat(curr.currency), 0);

    for (let tip of tips) {
        isWinner = false;

        if (bet.isAborted) {
            isWinner = false;
        } else if (bet.betType == 'catalogue') {
            isWinner = bet.correctAnswerIds.includes(tip.answerId);
        } else if (bet.betType == 'scale') {
            accumulatedPot += parseFloat(tip.currency);
            isWinner = first || accumulatedPot < Math.floor(inPot * (bet.scale_options.winRate / 100));
            console.log(isWinner);

            if (!isWinner && lastTip.isWinner && tip.proximity == lastTip.proximity)
                isWinner = true;

            first = false;
            lastTip = tip;
        }
        
        if (isWinner)
            tip.isWinner = true;
        else 
            tip.isWinner = false;
    }

    return;
}

const sortProximity = async (bet,tips) => {
    
    for (let tip of tips)
        tip.proximity = Math.abs(parseFloat(tip.answerDecimal) - parseFloat(bet.correctAnswerDecimal));

    tips.sort((a,b) => (a.proximity > b.proximity) ? 1 : ((b.proximity > a.proximity) ? -1 : 0));
}
6
const setPossibleGainAndLoss = async (tips) => {
    for (let tip of tips) {
        if (tip.isWinner) 
            tip.possibleGain = parseFloat(tip.currency) * (parseFloat(tip.odds) - 1); 
        else 
            tip.possibleLoss = parseFloat(tip.currency); 
    }
}

module.exports = {
  processNextBet,
  addToQueue,
  getSettlementTips
};
