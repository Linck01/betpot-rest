const urls = [
    'https://images.unsplash.com/photo-1609017909889-d7b582c072f7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1769&q=80',
    'https://images.unsplash.com/photo-1518895312237-a9e23508077d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2084&q=80',
    'https://images.unsplash.com/photo-1568860161401-fc6bbea94914?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80'
]


module.exports.getRandom = () => {
    return urls[Math.floor(Math.random()*urls.length)];
}