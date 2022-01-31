const fct = require('../utils/fct');
const { tipService, betService, payoutService } = require('../services');
const util = require('util');

const batchSize = 2;

module.exports.init = async () => {
    console.log('Check for open payouts');
    betService.finishedUnpaidBets = await betService.getFinishedUnpaidBets();
    
    let nextBet;
    while (true) {
        if (betService.finishedUnpaidBets.length > 0) {
            nextBet = betService.finishedUnpaidBets[0];
            try {
                await payoutBet(nextBet);
            } catch (e) { 
                console.log(e); 
                await removeFromQueue(nextBet.id);
            }
        }
        await fct.sleep(1000);
    }
}

const payoutBet = async (bet) => {
    console.log('Payout started for bet ' + bet.id);

    const sort = await getAndSortTips(bet);
    await setPossibleGainAndLoss(bet, sort);
    await setActualGainAndLoss(sort);
    console.log('sort',util.inspect(sort,{showHidden: false, depth: 3, colors: true}));

    await removeFromQueue(bet.id);
    await payoutService.payoutBet(bet, extractTipsFromSort(sort));
    return;
}

const extractTipsFromSort = (sort) => {
    const stacks = sort.winners.stacks.concat(sort.losers.stacks);
    const tips = [];

    for (let stack of stacks)
        for (let tip of stack.tips)
            tips.push(tip);

    return tips;
}

const setActualGainAndLoss = async (sort) => {
    const { winners, losers } = sort;
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

const setIsPaid = async () => {

    
    return;
}

const removeFromQueue = async (betId) => {
    betService.finishedUnpaidBets = betService.finishedUnpaidBets.filter(function( obj ) {
        return obj.id !== betId;
    });
}

const getAndSortTips = async (bet) => {
    const stacks = [];
    let answer, inPot = 0;

    const tips = await tipService.getTipsByBetIdLean(bet.id);

    for (let tip of tips) {
        if (bet.betType == 'catalogue') answer = tip.answerId;
        if (bet.betType == 'scale') answer = parseFloat(tip.answerDecimal);

        if (!stacks.find(t => t.answer == answer))
            stacks.push({answer: answer,sum: 0,tips:[]});
        
        const answerPot = stacks.find(t => t.answer == answer);
        answerPot.sum += parseFloat(tip.currency);
        inPot += answerPot.sum;
        answerPot.tips.push(tip); 
    }

    if (bet.betType == 'scale')
        sortProximity(stacks,bet.correctAnswerDecimal);

    const winners = {sum: 0, stacks: []};
    const losers = {sum: 0,stacks:[]};
    let isWinner, lastStack, lastStackIsWinner, accumulatedPot = 0;

    for (let stack of stacks) {
        if (bet.betType == 'catalogue') 
            isWinner = bet.correctAnswerIds.includes(stack.answer);
        else if (bet.betType == 'scale') {
            accumulatedPot += stack.sum;
            isWinner = accumulatedPot <= Math.floor(inPot * (bet.scale_options.winRate / 100));

            if (!isWinner && lastStackIsWinner && stack.proximity == lastStack.proximity) {
                isWinner = true;
                console.log(stack.answer,lastStack.answer,stack.proximity, lastStack.proximity);
            }

            lastStackIsWinner = isWinner;
            lastStack = stack;
        }
            
        if (isWinner)
            winners.stacks.push(stack);
        else 
            losers.stacks.push(stack);
    }  

    return {winners,losers}
}

const sortProximity = async (stacks,correctAnswerDecimal) => {
    console.log(correctAnswerDecimal);
    for (let stack of stacks)
        stack.proximity = Math.abs(stack.answer - correctAnswerDecimal);

    stacks.sort((a,b) => (a.proximity > b.proximity) ? 1 : ((b.proximity > a.proximity) ? -1 : 0));

    for (let i = 0; i < stacks.length; i++)
        stacks[i].proximityRank = i;

}

const setPossibleGainAndLoss = async (bet,sort) => {
    let possibleGainSum = 0, sumSum = 0;
    const { winners, losers } = sort;

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

/*
const getAndSortTips = async (bet) => {
    let tips,tipsRes;
    let currentPage = 1;
    const sort = [];
    let answerField;
    let answer;
    

    while (!tipsRes || currentPage <= tipsRes.totalPages)  {
        tipsRes = await tipService.queryTips({betId: bet.id},{limit: batchSize, page: currentPage});

        for (let tip of tipsRes.results) {
            if (bet.betType == 'catalogue') answer = tip.answerId;
            if (bet.betType == 'scale') answer = tip.answerDecimal.toString();

            if (!sort.find(t => t.answer == answer))
                sort.push({answer: answer,tips:[]});
            
            const answerPot = sort.find(t => t.answer == answer);
            answerPot.tips.push(tip);
        }

        currentPage++;
    }

    return sort;
}
*/