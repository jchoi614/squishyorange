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

io.on('connection',function(socket){

    socket.on('newplayer',function(){
        socket.player = {
            id: server.lastPlayderID++,
            x: randomInt(100,400),
            y: randomInt(100,400)
            type: "player_body"
        };
        socket.emit('yourId', socket.player.id);
        socket.emit('allplayers',getAllPlayers());
        socket.broadcast.emit('newplayer',socket.player);

        // socket.on('click',function(data){
        //     console.log('click to '+data.x+', '+data.y);
        //     socket.player.x = data.x;
        //     socket.player.y = data.y;
        //     io.emit('move',socket.player);
        // });
        socket.on('movement', function(direction) {
            // console.log(socket.id + ' wants to move ' + direction)
            socket.broadcast.emit('movement', {id: socket.player.id, direction: direction})
        })

        socket.on('disconnect',function(){
            io.emit('remove',socket.player.id);
            delete io.sockets.connected[socket.id];
        });
        socket.on('player_collision', onPlayerCollision){
            console.log("hi")
        }
    });

    socket.on('test',function(){
        console.log('test received');
    });
});

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
