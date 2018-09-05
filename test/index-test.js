const LambdaTester = require('lambda-tester');
const lambdaHandler = require('../index').handler;
const nock = require('nock');
const expect = require('chai').expect;

describe('handler', function() {
  beforeEach(function() {
    nock('https://getpocket.com/v3')
      .post('/oauth/authorize')
      .reply(200, function() {
        return { username: 'existing-user@test.com' };
      });

    nock(process.env.SCOUTUSER_ENDPOINT)
      .post('/')
      .reply(200, function() {});
  });

  afterEach(function() {
    nock.cleanAll();
  });

  it('should call context.succeed', function() {
    return LambdaTester(lambdaHandler)
      .event({
        query: {
          redirect_uri: 'redirect_uri',
          state: 'final',
          code: '1234'
        }
      })
      .expectSucceed(result => {
        expect(result.location).to.exist;
        expect(result.location).to.equal(
          'redirect_uri?#state=final&token_type=Bearer' +
            '&access_token=existing-user@test.com'
        );
      });
  });

  it('should call context.fail with empty query', function() {
    return LambdaTester(lambdaHandler)
      .event({})
      .expectFail();
  });
});
