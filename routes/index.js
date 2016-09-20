var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('In index.js.');
  res.render('index', { title: 'Express' });
  //res.send('Hello world.');
});

module.exports = router;
