var express = require('express');
var router = express.Router();


/* GET clock. */
router.get('/', function(req, res, next) {
  console.log ('In clock.js.');
  //res.send('respond with a resource - clock');
    
  ////////////////////////
    // Muni stuff

    //http://127.0.0.1:3535/agencies/sf-muni/routes/L/stops/6615/predictions
    
  res.render('clock', { title: 'Clock' });

});

module.exports = router;