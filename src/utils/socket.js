
let io;

module.exports.init = (_io) => {
    io = _io;
    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('room', function(gameId) {
            socket.join(gameId);
            console.log('Socket ' + socket.id + ' is in rooms ' + JSON.stringify([...socket.adapter.rooms]))
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
}

module.exports.sendChatMessageToGame = async (message) => {
    console.log('Sending socket chatMessage to room game:' + message.gameId);

    io.to('game:' + message.gameId).emit('chatMessage', message);
}

module.exports.sendNewBetToGame = async (bet) => {
    console.log('Sending socket newBet to room game:' + bet.gameId);

    io.to('game:' + bet.gameId).emit('newBet', bet);
}

module.exports.sendNewTipToGame = async (tip,bet,member) => {
    console.log('Sending socket newTip to room game:' + bet.gameId);
    
    io.to('game:' + bet.gameId).emit('newTip', {tip, bet, member});
}

module.exports.sendPaidOutToGame = async (bet,tips) => {
    console.log('Sending socket paidout to room game:' + bet.gameId);

    io.to('game:' + bet.gameId).emit('betPaidout', {bet, tips});
}


module.exports.sendMessageToUser = (message) => {

}