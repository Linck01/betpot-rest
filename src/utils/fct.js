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
    let result = ' ';
    const charactersLength = characters.length;

    for (let i=0; i<length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

/*
module.exports.getTimeDifferenceToNow = (timeStr) => {
    const now = Date.now();
    const to = (new Date(timeStr)).getTime();

    return now - to;
}

/*
module.exports.getTimeDifference = (start,end) => {
    start = (new Date(start)).getTime();
    end = (new Date(end)).getTime();

    return end - start;
}
*/
