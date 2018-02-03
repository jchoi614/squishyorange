var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.lastPlayderID = 0;

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

// game variables
var catchSquishMode = true;
var squishies = [];
var scores = {};
var gameGoing = false;
var startTime;

// socket handler
io.on('connection',function(socket){

    socket.on('newplayer',function(){
        socket.player = {
            id: server.lastPlayderID++,
            x: randomInt(100,400),
            y: randomInt(100,400),
            type: "player_body"
        };
        scores[socket.player.id] = {capture: 0, survival: 0}
        socket.emit('yourId', socket.player.id);
        socket.emit('allplayers',getAllPlayers());
        socket.broadcast.emit('newplayer',socket.player);

        socket.on('movement', function(direction) {
            io.emit('movement', {id: socket.player.id, direction: direction})
        })

        socket.on('disconnect',function(){
            io.emit('remove', socket.player.id);
            delete io.sockets.connected[socket.id];

            // check if the squish disconnected
            var i = squishies.indexOf(socket.player.id);
            if(i != -1) {
                squishies.pop(i);
                if (squishies.length == 0) {
                    chooseSquish()
                }
            }
        });
        socket.on('player_collision', function(data) {
            if(gameGoing && catchSquishMode && data.id == squishies[0]) {
                scores[socket.player.id]['capture'] += 1;
                // seconds survived gives you survival points
                scores[data.id]['survival'] += Math.floor((Date.now()-startTime)/1000);
                io.emit('caught', {winner: socket.player.id, scores: scores});
                squishies = [];
                gameGoing = false;
                chooseSquish();
            }
        })
    });

    socket.on('start', function(blank){
        chooseSquish()
    });
});

function chooseSquish() {
    var players = getAllPlayers();
    var squishIndex = randomInt(0, players.length);
    var squishId = players[squishIndex].id;
    squishies.push(squishId);

    if(catchSquishMode) {
        io.emit('catch', squishId);
    }
    startTime = Date.now();
    setTimeout(function(){gameGoing = true;}, 3000);
}

function getAllPlayers(){
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player);
    });
    return players;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
