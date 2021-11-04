
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

module.exports.sendChatMessageToGameMembers = (message) => {
    console.log('Sending chatMessage to room ' + message.gameId);

    io.to(message.gameId + '').emit('chatMessage', message);
}

module.exports.sendMessageToUser = (message) => {

}