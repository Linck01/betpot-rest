module.exports.uniqueArray = (a) => {
    return a.filter(onlyUnique);
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}
  
module.exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}