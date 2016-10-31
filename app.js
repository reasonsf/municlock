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

var moment = require('moment');

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
    })
    
};
setInterval (getETA, 7000);

getKey(); 

function getKey() {
    // let's read private info
    var rezdyKey;
    fs = require('fs');
    fs.readFile('./private/rezdy.private', 'utf8', function (err, data) {
        if (err) {
                return console.log(err);
        }
        rezdyKey = new Buffer(data.toString());
        console.log('Key is: ' + rezdyKey);
        var timerInterval = setInterval( function () {
            getReservation(rezdyKey);
        }, 5000);
    });
    bigRezdyKey = rezdyKey;
    return rezdyKey;
}

//get Rezdy booking info
function getReservation(rezdyKey) {
    // use Rezdy API to get first booking
    // handle error
    // return Alert string to dispaly on client
   
    // get current time
    now = new Date().toISOString().substring(0,19) + 'Z';
    //console.log(now);
    tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() +1);
    tomorrow = tomorrow.toISOString().substring(0,19) + 'Z';
    //console.log('Tomorrow is: ' +tomorrow);
    
    console.log('getReservation() rezdyKey: ' +rezdyKey);
    //Rezdy API variables
    // rezdyKey has already been read
    var request = require ('request');
    var url = 'https://api.rezdy.com/v1/bookings?'; //'https://api.rezdy.com/v1/bookings?';
    var limit = 0; // how many results to return
    var minTourStartTime = now;
    var minTourEndTime = tomorrow;
    var offset = '0';
    var orderStatus ='CONFIRMED';
    var productCode ='PUVF7L';
    var fullUrl = url +'&limit=' + limit +'&minTourStartTime=' +minTourStartTime + '&offset=' +offset +'&orderStatus=' + orderStatus +'&apiKey=' + rezdyKey;
    //var fullUrl = url +'&limit=' + limit +'&apiKey=' + rezdyKey; 

    
    request ({
        url: fullUrl,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 2000) {
            console.log(body);
        }
        else {
            console.log('Got data from Rezdy.');
            //console.log(body);
            console.log(fullUrl);
            //io.sockets.emit ('welcome', body);
            bookingNotify(body);
        }
    })
}

function bookingNotify(data) {
    // loop through each data and send first bookin

    console.log("*** sending a booking ");
    //start time for local
    //console.log(data.bookings[0].items[0].startTimeLocal);
    // first name
    //console.log(data.bookings[0].customer.firstName);
    var now = moment();
    //var nextHour = now.setHours(now.getHours()+4);
    //nextHour = nextHour.toISOString();
    
    
    // 2 hours of milliseconds
    var timeBefore = new moment();
    timeBefore = timeBefore.subtract(20, 'm');
    var timeAfter = new moment();
    timeAfter = timeAfter.add(20, 'm');
    
    // name of booker
    var name
    // catch times when there is no internet connection and not run scripts
    if (data.bookings.length != null)
    {
        for (var i = 0; i < data.bookings.length; i++)
        {
            var bookingTime = new moment(); 
            bookingTime = moment (data.bookings[i].items[0].startTimeLocal);
            //- console.log('timeBefore is: ' +timeBefore.format() + '. timeAfter is: ' +timeAfter.format() + '. bookingTime is: ' +bookingTime.format());

            if (bookingTime.isBetween(timeBefore, timeAfter)) {
                name = data.bookings[i].customer.firstName;
                //- console.log('booking time is within 20 minutes of now. ' +name);
                io.sockets.emit ('booking', 'Hi ' +name +'! We have been expecting you! ' + String.fromCodePoint(0x1F601));
            }
            else {
            }
        }; 
    }
}

module.exports = app;
