const { Member, Bet, Tip } = require('../models');
const { gameService, tipService, betService } = require('./');
const util = require('util');
const mongoose = require('mongoose');
const socket = require('../utils/socket.js');
const gameLogService = require('./gameLogService.service.js');

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
            
            const settlement = await getSettlement(nextBet);
            removeFromQueue(nextBet.id);
            await payoutSettlement(nextBet, settlement);

            console.log('Successfully paid out bet ' + nextBet.id + '.');
        } catch (e) { 
            console.log(e);
            removeFromQueue(betQueue[0]);
        }
    }
}

const getSettlement = async (bet) => {
  const settlement = await getAndSortTips(bet);
  await setPossibleGainAndLoss(bet, settlement);
  await setActualGainAndLoss(settlement);
  console.log('settlement',util.inspect(settlement,{showHidden: false, depth: 3, colors: true}));
  
  return settlement;
}

const payoutSettlement = async (bet,settlement) => {
    const session = await mongoose.startSession();
    let tips = extractTipsFromSettlement(settlement);
    console.log();console.log('settlement',util.inspect(settlement,{showHidden: false, depth: 3, colors: true}));
    try {
        session.startTransaction();
        
        //console.log(bet,tips);
        const bulkWriteMemberRequest = [],bulkWriteTipRequest = [];
        for (let tip of tips) {
            bulkWriteMemberRequest.push({updateOne:{filter: {gameId: bet.gameId,userId: tip.userId}, update: {$inc: {currency: tip.inc}}}});
            bulkWriteTipRequest.push({updateOne: {filter: {_id: tip._id}, update: {diff: tip.diff}}});
        }
        
        //console.log();console.log('bulkWriteTipRequest',util.inspect(bulkWriteTipRequest,{showHidden: false, depth: 3, colors: true}));
        //console.log();console.log('bulkWriteMemberRequest',util.inspect(bulkWriteMemberRequest,{showHidden: false, depth: 5, colors: true}));
        await Tip.bulkWrite(bulkWriteTipRequest);
        await Member.bulkWrite(bulkWriteMemberRequest);
        //await Bet.updateOne({_id: bet.id},{isPaid: true});

        const betTitle = bet.title.length > 50 ? bet.title.substr(0,48) + '..' : bet.title;
        await gameLogService.createGameLog({gameId: bet.gameId, logType: 'betPaidOut', title: 'Bet paid out', desc: 'Bet "' + betTitle + '" was solved & redistributed.'});

        await session.commitTransaction();
        session.endSession();

    } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw new Error('PayoutBet error: ' + e);
    }

    tips = await tipService.getTipsByBetIdLean(bet.id);
    bet = await betService.getBetById(bet.id);
    await socket.sendUpdateTipsToGame(bet,tips);
    

    return;
};

const extractTipsFromSettlement = (settlement) => {
  const stacks = settlement.winners.stacks.concat(settlement.losers.stacks);
  const tips = [];

  for (let stack of stacks)
      for (let tip of stack.tips)
          tips.push(tip);

  return tips;
}

const setActualGainAndLoss = async (settlement) => {
    const { winners, losers } = settlement;
    let totalGainsAndLosses = 0;

    if (winners.possibleGain <= 0 || losers.possibleLoss <= 0){
        winners.actualGain = 0;
        losers.actualLoss = 0;
    } else if (winners.possibleGain < losers.possibleLoss) {
        winners.actualGain = winners.possibleGain;
        losers.actualLoss = winners.possibleGain;
    } else if (winners.possibleGain > losers.possibleLoss) {
        winners.actualGain = losers.possibleLoss;
        losers.actualLoss = losers.possibleLoss;
    }

    for (let stack of winners.stacks) {
        stack.actualGain = winners.actualGain * (stack.possibleGain / winners.possibleGain);

        for (let tip of stack.tips) {
            tip.diff = stack.actualGain * (parseFloat(tip.currency) / stack.sum);
            tip.inc = tip.diff + parseFloat(tip.currency);
            totalGainsAndLosses += tip.diff;
        }
    }

    for (let stack of losers.stacks) {
        stack.actualLoss = losers.actualLoss * (stack.possibleLoss / losers.possibleLoss);
        
        for (let tip of stack.tips) {
            tip.diff = (-1) * stack.actualLoss * (parseFloat(tip.currency) / stack.sum);
            tip.inc = parseFloat(tip.currency) + tip.diff;
            totalGainsAndLosses += tip.diff;
        }
    }

    if (Math.abs(totalGainsAndLosses) > 0.001)
        throw Error('Total gains and losses not equal: ' + totalGains + ' ' + totalLosses);
 
  return;
}

const getAndSortTips = async (bet) => {
    const stacks = [];
    let answer,answerPot;

    const tips = await tipService.getTipsByBetIdLean(bet.id);

    for (let tip of tips) {
        if (bet.betType == 'catalogue') answer = tip.answerId;
        if (bet.betType == 'scale') answer = parseFloat(tip.answerDecimal);

        if (!stacks.find(t => t.answer == answer))
            stacks.push({answer: answer,sum: 0,tips:[]});
            
        answerPot = stacks.find(t => t.answer == answer);
        answerPot.sum += parseFloat(tip.currency);
        answerPot.tips.push(tip); 
    }

    if (bet.betType == 'scale')
        sortProximity(stacks,bet.correctAnswerDecimal);

    const winners = {sum: 0, stacks: []};
    const losers = {sum: 0,stacks:[]};
    let isWinner, lastStack, lastStackIsWinner = false, accumulatedPot = 0, first = true;

    const inPot = stacks.reduce((prev,curr) => prev + curr.sum, 0);

    for (let stack of stacks) {
        if (bet.isAborted) {
            isWinner = false;
        } else if (bet.betType == 'catalogue') {
            isWinner = bet.correctAnswerIds.includes(stack.answer);
        } else if (bet.betType == 'scale') {
            
            accumulatedPot += stack.sum;
            isWinner = first || accumulatedPot < Math.floor(inPot * (bet.scale_options.winRate / 100));
            console.log(isWinner);

            if (!isWinner && lastStackIsWinner && stack.proximity == lastStack.proximity)
                isWinner = true;

            first = false;
            lastStackIsWinner = isWinner;
            lastStack = stack;
        } else 
            isWinner = false;
            
        if (isWinner)
            winners.stacks.push(stack);
        else 
            losers.stacks.push(stack);
    }

    return {winners,losers}
}

const sortProximity = async (stacks,correctAnswerDecimal) => {
    //console.log(correctAnswerDecimal);
    for (let stack of stacks)
        stack.proximity = Math.abs(stack.answer - correctAnswerDecimal);

    stacks.sort((a,b) => (a.proximity > b.proximity) ? 1 : ((b.proximity > a.proximity) ? -1 : 0));

    for (let i = 0; i < stacks.length; i++)
        stacks[i].proximityRank = i;

}

const setPossibleGainAndLoss = async (bet,settlement) => {
    let possibleGainSum = 0, sumSum = 0;
    const { winners, losers } = settlement;

    for (let stack of winners.stacks) {
        if(bet.betType == 'catalogue')
            stack.odds = bet.catalogue_answers[stack.answer].odds;
        if(bet.betType == 'scale')
            stack.odds = bet.scale_options.odds;

        stack.possibleGain = (stack.odds-1) * stack.sum;
        sumSum += stack.sum;
        possibleGainSum += stack.possibleGain;
    }

    winners.possibleGain = possibleGainSum;
    winners.sum = sumSum;

    let possibleLossSum = 0;

    for (let stack of losers.stacks) {
        stack.possibleLoss = stack.sum;
        possibleLossSum += stack.possibleLoss;
    }
    losers.sum = possibleLossSum;
    losers.possibleLoss = possibleLossSum;
}

module.exports = {
  processNextBet,
  addToQueue,
  getSettlement
};
