const Member = require('../models/member.model.js');
const Bet = require('../models/bet.model.js');
const Tip = require('../models/tip.model.js');

const tipService = require('../services/tip.service.js');
const betService = require('../services/bet.service.js');
const gameLogService = require('../services/gameLog.service.js');
const gameService = require('../services/game.service.js');

const util = require('util');
const mongoose = require('mongoose');
const socket = require('../utils/socket.js');

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

    //console.log('settlement',util.inspect(settlementTips,{showHidden: false, depth: 3, colors: true}));
    try {
        session.startTransaction();
        
        //console.log(bet,tips);
        const bulkWriteMemberRequest = [],bulkWriteTipRequest = [];
        for (let tip of settlementTips) {
            bulkWriteMemberRequest.push({updateOne:{filter: {gameId: bet.gameId,userId: tip.userId}, update: {$inc: {currency: tip.inc}}}});
            bulkWriteTipRequest.push({updateOne: {filter: {_id: tip._id}, update: {diff: tip.diff, isWinner: tip.isWinner}}});
        }
        
        //console.log();console.log('bulkWriteTipRequest',util.inspect(bulkWriteTipRequest,{showHidden: false, depth: 3, colors: true}));
        //console.log();console.log('bulkWriteMemberRequest',util.inspect(bulkWriteMemberRequest,{showHidden: false, depth: 5, colors: true}));
        await Tip.bulkWrite(bulkWriteTipRequest);
        await Member.bulkWrite(bulkWriteMemberRequest);
        await Bet.updateOne({_id: bet.id},{isPaid: true});

        await session.commitTransaction();
        session.endSession();

    } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw new Error('PayoutBet error: ' + e);
    }

    bet = await betService.getBetById(bet.id);
    const tips = await tipService.getTipsByBetIdLean(bet.id);
    
    const game = await gameService.getGameById(bet.gameId);
    await gameLogService.rebuildGameLogs(game);
    await socket.sendUpdateTipsToGame(bet,tips);
    return;
};

const setActualGainAndLoss = async (tips) => {
    const totalPossibleGain = tips.filter(t => t.isWinner).reduce((prev,curr) => prev + curr.possibleGain, 0);
    const totalPossibleLoss = tips.filter(t => !t.isWinner).reduce((prev,curr) => prev + curr.possibleLoss, 0);

    let totalActualGainLoss;
    if (totalPossibleGain == 0 || totalPossibleLoss == 0) 
        totalActualGainLoss = 0;
    else if (totalPossibleGain < totalPossibleLoss) 
        totalActualGainLoss = totalPossibleGain;
    else if (totalPossibleGain > totalPossibleLoss) 
        totalActualGainLoss = totalPossibleLoss;

    let zeroSumCheck = 0;
    for (let tip of tips) {
        if (tip.isWinner) 
            tip.diff = totalActualGainLoss * (tip.possibleGain / totalPossibleGain); 
        else 
            tip.diff = (-1) * totalActualGainLoss * (tip.possibleLoss / totalPossibleLoss);

        tip.inc = tip.diff + parseFloat(tip.currency);
        zeroSumCheck += tip.diff;
    }

    if (Math.abs(zeroSumCheck) > 0.001)
        throw Error('Total gains and losses not equal: ' + zeroSumCheck);
 
  return;
}

const setIsWinner = async (bet,tips) => {
    if (bet.betType == 'scale')
        sortProximity(bet,tips);

    let lastTip, accumulatedPot = 0, first = true;

    const inPot = tips.reduce((prev,curr) => prev + parseFloat(curr.currency), 0);

    for (let tip of tips) {
        tip.isWinner = false;

        if (bet.isAborted) {
            tip.isWinner = false;
        } else if (bet.betType == 'catalogue') {
            tip.isWinner = bet.correctAnswerIds.includes(tip.answerId);
        } else if (bet.betType == 'scale') {
            accumulatedPot += parseFloat(tip.currency);
            tip.isWinner = first || accumulatedPot < Math.floor(inPot * (bet.scale_options.winRate / 100));

            if (!tip.isWinner && lastTip.isWinner && tip.proximity == lastTip.proximity)
                tip.isWinner = true;

            first = false;
            lastTip = tip;
        }
    }

    // Check if there is only winners due to having 2 symmetrical proximities at the end and make those two symetrical winners to losers.
    if (bet.betType == 'scale' && !bet.isAborted && tips.length >= 3 && tips[tips.length].isWinner && tips[tips.length - 1].isWinner && tips[tips.length].proximity == tips[tips.length - 1].proximity) {
        tips[tips.length].isWinner = false;
        tips[tips.length - 1].isWinner = false;
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
