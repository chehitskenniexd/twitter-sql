'use strict';
var express = require('express');
var router = express.Router();
var client = require('../db/index');

module.exports = function makeRouterWithSockets(io) {


  function respondWithDBTweets(req, res, next) {
    // client call
    client.query('SELECT content, name, pictureurl FROM Tweets t JOIN Users u ON t.userid = u.id', function (err, result) {
      if (err) { return next(err); }
      var tweets = result.rows;
      res.render('index', {
        title: 'twitter.js',
        tweets: tweets,
        showForm: true
      });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithDBTweets);
  router.get('/tweets', respondWithDBTweets);

  // single-user page
  router.get('/users/:username', function (req, res, next) {
     client.query('SELECT content, name, pictureurl FROM Tweets t JOIN Users u ON t.userid = u.id WHERE u.name =$1', [req.params.username], function (err, data){
      res.render('index', {
        title: 'Twitter.js',
        tweets: data.rows,
        showForm: true,
      });
    });

    // var tweetsForName = tweetBank.find({ name: req.params.username });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsForName,
    //   showForm: true,
    //   username: req.params.username
    // });

  });

  // single-tweet page
  router.get('/tweets/:id', function (req, res, next) {
    var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    res.render('index', {
      title: 'Twitter.js',
      tweets: tweetsWithThatId // an array of only one element ;-)
    });
  });

  // create a new tweet
  router.post('/tweets', function (req, res, next) {
    // function checkId() {
      client.query('SELECT id FROM Users WHERE name=$1', [req.body.userid], function(err, data){
        if (err){ return new next(err)};
        var userId;
        data != undefined && data.rows != undefined ? userId = data.rows[0].id : userId = undefined;
        if (userId) {
          makeTweet(req.body.userid, userId, req.body.content);
        } else {

        }
      });
    // }

    function makeTweet(name, id, content) {
      client.query('INSERT INTO Tweets(userid, content) VALUES ($1, $2)', [id, content], function(err, data) {
        var newTweet = {name: name, content: content};
        postTweet(newTweet);
    });
    }

    function postTweet(newTweet) {
      io.sockets.emit('new_tweet', {name: newTweet.name, content: newTweet.content});
      res.redirect('/');
    }



  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
