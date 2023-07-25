module.exports.uniqueArray = (a) => {
    return a.filter(onlyUnique);
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}
  
module.exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.randomString = (length) => {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i=0; i<length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

module.exports.getTimeDifference = (start,end) => {
    const startDate = (new Date(start)).getTime();
    const endDate = (new Date(end)).getTime();

    return (endDate - startDate) / 1000;
}


module.exports.getTimeDifferenceToNow = (time) => {
    const nowDate = Date.now();
    const toDate = (new Date(time)).getTime();

    return (nowDate - toDate) / 1000;
}
/*
module.exports.getActualOdds = (bet) => {
    let answers;
    if (bet.betType == 'catalogue')
        answers = bet.catalogue_answers;
    else if (bet.betType == 'scale') 
        answers = bet.scale_answers;

    if (!bet.dynamicOdds)
        return answers.map(a => parseFloat(a.odds));

    const average = answers.reduce((prev,curr) => prev + parseFloat(curr.inPot),0) / answers.length;

    let differenceToAverage, actualOdds = [];
    
    for (let answer of answers) {
        differenceToAverage = average - answer.inPot;

        if (differenceToAverage >= 0) 
            actualOdds.push(1 + (parseFloat(answer.odds) - 1) * (1 + differenceToAverage / bet.dynamicOddsPower));
        else
            actualOdds.push(1 + (parseFloat(answer.odds) - 1) / (1 + Math.abs(differenceToAverage) / bet.dynamicOddsPower));

    }

    return actualOdds;
}
*/

/*
// all answers
initialOdds: (2,2,2), answers: (0,10,20)

factorPower = 10

for answers
  differenceToAverage = (-10,0,10)
  if (differenceToAverage >= 0)
    answer.odds = 1 + (initialOdds - 1) / (1 + differenceToAverage / factorPower)  
  else
    answer.odds = 1 + (initialOdds - 1) * (1 + |differenceToAverage| / factorPower) 

newOdds = (3,2,1.33)


const adaptCatalogueOdds = async (bet, tipBody) => {
    const currentOdds = parseFloat(bet.catalogue_answers[tipBody.answerId].odds);
  
    if (!bet.dynamicOdds)
      return currentOdds;
  
    const currencyFactor = parseFloat(tipBody.currency) / parseFloat(bet.dynamicOddsPower)
    
    let newCatalogueAnswers = [], answer;
    for (let i = 0; i < bet.catalogue_answers.length; i++) {
      answer = bet.catalogue_answers[i];
  
      if (i == tipBody.answerId)
        newCatalogueAnswers.push({...answer.toObject(), odds: 1 + (currentOdds - 1) / (1 + currencyFactor)});
      else
        newCatalogueAnswers.push({...answer.toObject(), odds: 1 + (parseFloat(answer.odds) - 1) * (1 + (currencyFactor / (bet.catalogue_answers.length - 1)))});
    }
  
    //console.log(newCatalogueAnswers[tipBody.answerId], newCatalogueAnswers);
    await betService.updateBetById(bet.id, {catalogue_answers: newCatalogueAnswers});
  
    return currentOdds;
  }

  */