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
    'X-Accept': 'application/json',
    'x-access-token': process.env.JWOT_TOKEN
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

exports.handler = async (event, context, callback) => {
  console.log('Got an event');
  try {
    const authBody = {
      consumer_key: process.env.CONSUMER_KEY,
      code: event.query.code
    };
    finalAuthorizeOptions.body = JSON.stringify(authBody);

    const body = await rp(finalAuthorizeOptions);
    let jsonBody = JSON.parse(body);
    console.log(jsonBody);
    const redir =
      `${event.query.redirect_uri}?#state=${event.query.state}` +
      `&token_type=Bearer&access_token=${jsonBody.username}`;
    console.log('final redir link is: ' + redir);

    // Give user/token to Scout
    const suBody = {
      userid: jsonBody.username,
      access_token: jsonBody.access_token
    };
    scoutUserOptions.body = JSON.stringify(suBody);
    await rp(scoutUserOptions);
    context.succeed({ location: redir });
  } catch (err) {
    console.log('Call failed' + err);
    context.succeed({ message: `Error: ${err}` });
  }
};
