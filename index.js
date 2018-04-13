/*  Required environment variables for this Lambda function:
 *  CONSUMER_KEY - The Pocket Consumer key obtained from your Pocket developer
 *  account.
 *  MONGO_STRING - The connection string for a mongodb.
 *  
 *  The runtime used for this Lambda is Node.js 6.10.
 */
'use strict';
const rp = require('request-promise');
var mongoose = require('mongoose');
var scoutuser = require('./scout_user');
var uniqueValidator = require('mongoose-unique-validator');

const finalAuthorizeOptions = {
  uri: 'https://getpocket.com/v3/oauth/authorize',
  method: 'POST',
  body: '',
  headers: {'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json'}
};

exports.handler = (event, context, callback) => {
  console.log('Got an event');
  
  var authBody = {
    'consumer_key': process.env.CONSUMER_KEY,
    'code': event.query.code
  };
  finalAuthorizeOptions.body = JSON.stringify(authBody);

  rp(finalAuthorizeOptions)
  .then(function(body) {
    let jsonBody = JSON.parse(body);
    console.log(jsonBody);
    let redir = event.query.redirect_uri + 
      '?#state=' + event.query.state + '&token_type=Bearer&access_token=' + 
      jsonBody.username;
    console.log('final redir link is: ' + redir);
    
    // Save the username/token to the DB for later use in flow.
    var mongoose = require('mongoose');
    console.log('connecting to mongoose');
    mongoose.connect(process.env.MONGO_STRING, {  })

    scoutuser.findOne({ userid: jsonBody.username }, function(err, user) {
      if (err) {
        console.log('query failed')
      } else {
        if (!user) {
          console.log('need to create user.');
          scoutuser.create({
            userid : jsonBody.username,
            access_token : jsonBody.access_token
          }, 
          function (err, user) {
            if (err) {
              console.log('Error creating ScoutUser in DB')
            } else {
              console.log('Created ScoutUser in DB')
              context.succeed({location : redir});
            }
          });
        } else {
          // User is already there.... update token
          console.log('User is already here.  Need to update it.')
          user.access_token = jsonBody.access_token;
          user.save(function(err) {
            if (err) {
              console.log('Got an error in the DB save');
            } else {
              console.log('Updated ScoutUser in DB')
              context.succeed({location : redir});
            }
          });
        }
      }
    });
  })
  .catch(function(err) {
    console.log('Call failed' + err);
    context.succeed({'message': 'some info'});
  });
};