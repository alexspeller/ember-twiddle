/* jshint node: true */

module.exports = function(environment) {
  var rootURL = process.env.TWIDDLE_ROOT_URL || '/';
  var host = process.env.GH_API_HOST || 'https://api.github.com';
  var toriiGHEBaseURL = process.env.TORII_GHE_OAUTH || null;
  var toriiProvider = process.env.TORII_PROVIDER || 'github-oauth2';
  var githubOauthURL = process.env.GATEKEEPER_URL || 'http://localhost:9999/authenticate/';
  var assetsHost = process.env.TWIDDLE_ASSET_HOST || '/';
  var githubApiKey = process.env.GH_API_KEY || 'f864eae7e7abe78fe869'

  var ENV = {
    modulePrefix: 'ember-twiddle',
    environment: environment,
    rootURL: rootURL,
    locationType: 'auto',
    host: host,
    githubOauthUrl: githubOauthURL,
    addonUrl: 'https://emw2ujz4u1.execute-api.us-east-1.amazonaws.com/canary/addon',
    assetsHost: assetsHost,
    maxNumFilesInitiallyExpanded: 12,
    toriiProvider: toriiProvider,
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },


    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
      rootElement: '#main-app'
    },

    torii: {
      sessionServiceName: 'session',
      providers: {}
    },
  };

  // computed property name didn't work so I had to do this:
  ENV.torii.providers[toriiProvider] = {
    scope: 'gist',
    apiKey: githubApiKey
  };


  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
    ENV.rootURL = '/',
    ENV.assetsHost = '/',

    ENV['ember-cli-mirage'] = {
      enabled: false
    };
  }

  if (environment === 'test') {
    ENV.locationType = 'auto';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';

    ENV.host = undefined;
  }

  if (environment === 'production') {
    ENV.githubOauthUrl = githubOauthURL;
    ENV.assetsHost = assetsHost;
    // we only need to set the baseUrl if we are using GH Enterprise
    if( toriiGHEBaseURL ) {
      ENV.torii.providers[toriiProvider].baseUrl = toriiGHEBaseURL;
    }
    ENV.addonUrl = "https://howq105a2c.execute-api.us-east-1.amazonaws.com/production/addon";
  }

  // staging to GH Enterprise is not currently supported.
  if (environment === 'staging') {
    ENV.githubOauthUrl = 'https://canary-twiddle-gatekeeper.herokuapp.com/authenticate/';
    ENV.assetsHost = '//canary-assets.ember-twiddle.com/';
  }

  return ENV;
};
