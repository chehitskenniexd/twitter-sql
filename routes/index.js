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

  });

  // single-tweet page
  router.get('/tweets/:id', function (req, res, next) {
    var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    res.render('index', {
      title: 'Twitter.js',
      tweets: tweetsWithThatId // an array of only one element ;-)
    });
  });

  // Create a new tweet for the user in the db
  router.post('/tweets', function (req, res, next) {
      client.query('SELECT id FROM Users WHERE name=$1', [req.body.userid], function(err, data){
        if (err){ return new next(err)};
        var userId;
        data && data.rowCount > 1 ? userId = data.rows[0].id : userId = undefined;

        // If user exists in the db, make the tweet
        // If user doesn't exist, create the user and then make the tweet
        if (userId) {
          makeTweet(req.body.userid, userId, req.body.content);
        } else {
          createUser(req.body.userid, req.body.content);
          makeNewUserTweet(req.body.userid, req.body.content);
        }
      });

    // Create new tweet in the db
    function makeTweet(name, id, content) {
      client.query('INSERT INTO Tweets(userid, content) VALUES ($1, $2)', [id, content], function(err, data) {
        var newTweet = {name: name, content: content};
        postTweet(newTweet);
      });
    }

    // Make tweet for new user
    function makeNewUserTweet(name, content){
      // Get id of the new user
      client.query('SELECT id FROM Users WHERE name=$1', [name], function(err, data){
        // Make new tweet for that new user
        makeTweet (name, data.rows[0].id, content);
      });

    }

    // Create new user if the user doesn't exist
    function createUser (name) {
      client.query('INSERT INTO USERS(name) VALUES ($1)', [name]);

    }
    // Post the tweet on the front page
    function postTweet(newTweet) {
      io.sockets.emit('new_tweet', {name: newTweet.name, content: newTweet.content});
      res.redirect('/');
    }

  });

  return router;
}
