/*  Required environment variables for this Lambda function:
 *  CONSUMER_KEY - The Pocket Consumer key obtained from your Pocket developer
 *  account.
 *  
 *  The runtime used for this Lambda is Node.js 6.10.
 */
'use strict';
const rp = require('request-promise');

const finalAuthorizeOptions = {
  uri: 'https://getpocket.com/v3/oauth/authorize',
  method: 'POST',
  body: '',
  headers: {'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json'}
};

exports.handler = (event, context, callback) => {
  console.log('Got an event');
  console.log('Code is: ' + event.query.code);
  
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
      jsonBody.access_token;
    console.log('final redir link is: ' + redir);
    context.succeed({location : redir});
  })
  .catch(function(err) {
    console.log('Call failed' + err);
    context.succeed({'message': 'some info'});
  });
};