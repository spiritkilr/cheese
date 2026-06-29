const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Store game states for each room
let rooms = {};

io.on('connection', (socket) => {
    console.log('User Connected: ' + socket.id);

    socket.on('joinRoom', (data) => {
        const room = data.roomCode;
        socket.join(room);
        
        if (!rooms[room]) {
            rooms[room] = {
                players: [],
                gameState: {
                    p1: { hp: 20, mana: 5, cheese: 0, hand: [], board: [] },
                    p2: { hp: 20, mana: 5, cheese: 0, hand: [], board: [] }
                }
            };
        }
        
        const playerNum = rooms[room].players.length + 1;
        if (playerNum <= 2) {
            rooms[room].players.push(socket.id);
            socket.emit('playerAssign', { num: playerNum, state: rooms[room].gameState });
            console.log(`User ${socket.id} joined Room: ${room} as Player ${playerNum}`);
        }
    });

    socket.on('playCard', (data) => {
        if (rooms[data.room]) {
            rooms[data.room].gameState = data.newState;
            socket.to(data.room).emit('opponentMove', { newState: data.newState });
        }
    });

    socket.on('endTurn', (room) => {
        socket.to(room).emit('opponentEndTurn');
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

http.listen(3000, '0.0.0.0', () => {
    console.log('--- CHEESE SERVER RUNNING ---');
    console.log('Open http://localhost:3000 in two tabs');
});