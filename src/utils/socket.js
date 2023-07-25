
let io;

module.exports.init = (_io) => {
    io = _io;
    io.on('connection', (socket) => {
        console.log('User connected to socket');

        socket.on('room', function(gameId) {
            socket.join(gameId);
            console.log('Socket ' + socket.id + ' is in rooms ' + JSON.stringify([...socket.adapter.rooms]))
        });

        socket.on('disconnect', () => {
            console.log('User disconnected from socket');
        });
    });
}

module.exports.sendUpdateGameToGame = async (game) => {
    console.log('Sending socket updateGame to room game:' + game.id);

    io.to('game:' + game.id).emit('updateGame', game);
}

module.exports.sendChatMessageToGame = async (message) => {
    console.log('Sending socket chatMessage to room game:' + message.gameId);

    io.to('game:' + message.gameId).emit('chatMessage', message);
}

module.exports.sendNewBetToGame = async (bet) => {
    console.log('Sending socket newBet to room game:' + bet.gameId);

    io.to('game:' + bet.gameId).emit('newBet', bet);
}

module.exports.sendUpdateBetToGame = async (bet) => {
    console.log('Sending updateBet to room game:' + bet.gameId);

    io.to('game:' + bet.gameId).emit('updateBet', bet);
}

module.exports.sendNewTipToGame = async (tip,bet,member) => {
    console.log('Sending socket newTip to room game:' + bet.gameId);
    
    io.to('game:' + bet.gameId).emit('newTip', {tip, bet, member});
}

module.exports.sendUpdateTipsToGame = async (bet,tips) => {
    console.log('Sending socket updateTips to room game:' + bet.gameId);

    io.to('game:' + bet.gameId).emit('updateTips', {bet, tips});
}


module.exports.sendMessageToUser = (message) => {

}