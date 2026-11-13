
class Socket_Service {

    static init(io) {

        io.on('connection', (socket) => {
            console.log("===============");
            console.log("New connection");
            console.log("===============");

            socket.on('join_room', chat_id => {
                socket.join(chat_id);
            })

            socket.on('new_message', message => {
                socket.to(message.chat_id).emit('new_message', message);
            })

            socket.on('delete_message', message => {
                socket.to(message.chat_id).emit('delete_message', message)
            })

            socket.on('mark_paid', payload => {
                socket.to(payload.chat_id).emit('mark_paid', payload)
            })

            socket.on('confirm', payload => {
                socket.to(payload.chat_id).emit('confirm', payload)
            })

            socket.on('reject', payload => {
                socket.to(payload.chat_id).emit('reject', payload)
            })

            // notify user when someone is typing
            socket.on('user_typing', data => {
                //Broadcast the user who is typing
                socket.broadcast.emit('user_typing', data)
            })

            // notify user when someone delete a comment
            socket.on('delete_message', data => {
                //Broadcast the user who is typing
                socket.broadcast.emit('delete_message', data)
            })

            socket.on('disconnect', () => {
                console.log("===============");
                console.log("New Disconnection");
                console.log("===============");
            });
        });
    }
}



module.exports = Socket_Service;