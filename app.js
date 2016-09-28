var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var clock = require ('./routes/clock');

var app = require('express')();
var http = require ('http').Server(app);
var io = require ('socket.io')(http);

var restbus = require ('restbus');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/clock', clock);

// bower - setting up location for its folder location
app.use('/bower_components/', express.static(__dirname + '/bower_components'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Implementing socket.io

io.on ('connection', function (socket) {
    console.log ('Socket.io - A user connected.');
    socket.on ('disconnect', function () {
        console.log ('Socket.io - A user disconnect.');
    });
});

// Setting up Server

/* OLD SERVER CODE
http.listen(process.env.PORT || 4000, function () {
    console.log('Express server listening on port %d in %s mode', this.address().port, app.settings.env);
    restbus.listen(function() {
        console.log('Restbus is now listening on port 3535.');
    });
});
*/


// Just running http server only, since Heroku only allows one port
http.listen(process.env.PORT || 5000, function () {
    console.log('Express server listening on port %d in %s mode', this.address().port, app.settings.env);
    
});


/*
restbus.listen(process.env.PORT || 4000, function () {
  console.log('Restbus server listening on port %d in %s mode', process.env.PORT, app.settings.env);
});
*/

// cyclecounter
//var cycles = 0;

/*
function increaseCounter () {
    cycles++;
    io.sockets.emit ('cycle', cycles);
    console.log('App.js cycles count:' +cycles);
};

setInterval (increaseCounter, 1000);
*/

function getETA() {
    
    var request = require ('request')
    var url = 'http://restbus.info:3535/agencies/sf-muni/routes/L/stops/6615/predictions'
    // OLD var url = 'http://127.0.0.1:3535/agencies/sf-muni/routes/L/stops/6615/predictions'
    request ({
        url: url,
        json: true
    }, function (error, response, body) {
            if (!error && response.statusCode === 2000) {
                console.log(body);
            }
            else {
                console.log('Got response from muni api.');
                // Emitting ETA
                io.sockets.emit ('etaEvent', body);
            }
            //console.log(body[0].values[0].seconds)
    })
    
};
setInterval (getETA, 7000);


//get Rezdy booking info
function getReservation() {
    // use Rezdy API to get first booking
    // handle error
    // return Alert string to dispaly on client
   
    // get current time
    now = new Date().toISOString().substring(0,19) + 'Z';
    console.log(now);
    
    //Rezdy API variables
    var rezdyKey = 'null';
    var request = require ('request');
    var url = 'https://api.rezdy.com/v1/bookings?';
    var limit = 1; // how many results to return
    var minTourStartTime = now;
    
    var offset = 0;
    request ({
        url: url +'&limit=' + limit +'&minTourStartTime=' +minTourStartTime +'&offset=' +offset +'&apiKey=' + rezdyKey,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 2000) {
            console.log(body);
        }
        else {
            console.log('Got data from Rezdy.');
            console.log(body);
            console.log(url +'&limit=' + limit +'&minTourStartTime=' +minTourStartTime +'&offset=' +offset +'&apiKey=' + rezdyKey)
            io.sockets.emit ('welcome', body);
        }
    })
}
//getReservation();
module.exports = app;
