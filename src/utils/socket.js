
let io;

module.exports.init = (_io) => {
    io = _io;
    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('room', function(gameId) {
            socket.join(gameId);
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
}

module.exports.sendMessageToGameMembers = (gameId, message) => {
    io.sockets.in(gameId).emit('message', message);
}

module.exports.sendMessageToUser = (message) => {

}