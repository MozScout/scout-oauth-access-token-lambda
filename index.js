/*  Required environment variables for this Lambda function:
 *  CONSUMER_KEY - The Pocket Consumer key obtained from your Pocket developer
 *  account.
 *  SCOUTUSER_ENDPOINT - The endpoint for the scout-ua/scoutuser API
 *  
 *  The runtime used for this Lambda is Node.js 8.x
 */
const rp = require('request-promise');

const finalAuthorizeOptions = {
  uri: 'https://getpocket.com/v3/oauth/authorize',
  method: 'POST',
  body: '',
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Accept': 'application/json'
  }
};

const scoutUserOptions = {
  uri: process.env.SCOUTUSER_ENDPOINT,
  method: 'POST',
  body: '',
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.handler = (event, context, callback) => {
  console.log('Got an event');

  var authBody = {
    consumer_key: process.env.CONSUMER_KEY,
    code: event.query.code
  };
  finalAuthorizeOptions.body = JSON.stringify(authBody);

  rp(finalAuthorizeOptions)
    .then(async body => {
      let jsonBody = JSON.parse(body);
      console.log(jsonBody);
      let redir =
        event.query.redirect_uri +
        '?#state=' +
        event.query.state +
        '&token_type=Bearer&access_token=' +
        jsonBody.username;
      console.log('final redir link is: ' + redir);

      // Save the username/token to the DB for later use in flow.
      const suBody = {
        userid: jsonBody.username,
        access_token: jsonBody.access_token
      };
      scoutUserOptions.body = JSON.stringify(suBody);
      console.log('calling with scoutUserOptions: ', scoutUserOptions);
      const result = await rp(scoutUserOptions);
      console.log('result', JSON.parse(body));
      context.succeed({ location: redir });
    })
    .catch(function(err) {
      console.log('Call failed' + err);
      context.succeed({ message: 'some info' });
    });
};
