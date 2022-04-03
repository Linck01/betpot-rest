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

