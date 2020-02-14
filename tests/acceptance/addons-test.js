import { test } from 'qunit';
import moduleForAcceptance from 'ember-twiddle/tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | addons', {
  beforeEach: function() {
    this.cachePrompt = window.prompt;
    window.prompt = (text, defaultResponse) => defaultResponse;
  },

  afterEach: function() {
    window.prompt = this.cachePrompt;
  }
});

test('Addons work', function(assert) {

  const files = [
    {
      filename: "application.template.hbs",
      content: `{{#if (gt appName.length 3)}}
                  Welcome to {{appName}}
                {{/if}}`
    },
    {
      filename: "application.controller.js",
      content: `import Ember from "ember";
                export default Ember.Controller.extend({
                  appName: 'Ember Twiddle'
                });`
    },
    {
      filename: "twiddle.json",
      content: `{
                  "version": "0.12.0",
                  "EmberENV": {
                    "FEATURES": {}
                  },
                  "options": {
                    "use_pods": true,
                    "enable-testing": false
                  },
                  "dependencies": {
                    "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js",
                    "ember": "2.11.2",
                    "ember-template-compiler": "2.11.2",
                    "ember-testing": "2.11.2"
                  },
                  "addons": {
                    "ember-truth-helpers": "1.2.0"
                  }
                }`
    }
  ];

  runGist(files);

  andThen(function() {
    assert.equal(outputContents(), 'Welcome to Ember Twiddle');
  });
});

test('Ember Data works as an addon', function (assert) {
  const files = [
    {
      filename: "templates.application.hbs",
      content: `Welcome to {{model.appName}}`
    },
    {
      filename: "routes.application.js",
      content: `import Ember from "ember";
                export default Ember.Route.extend({
                  model() {
                    return this.get('store').createRecord('app', {
                      appName: 'Ember Twiddle'
                    });
                  }
                });`
    },
    {
      filename: "models.app.js",
      content: `import Ember from "ember";
                import DS from "ember-data";
                export default DS.Model.extend({
                  appName: DS.attr('string')
                });`
    },
    {
      filename: "twiddle.json",
      content: `{
                  "version": "0.12.0",
                  "EmberENV": {
                    "FEATURES": {}
                  },
                  "options": {
                    "use_pods": true,
                    "enable-testing": false
                  },
                  "dependencies": {
                    "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js",
                    "ember": "3.8.1",
                    "ember-template-compiler": "3.8.1",
                    "ember-testing": "3.8.1"
                  },
                  "addons": {
                    "ember-data": "3.8.1"
                  }
                }`
      }
  ];

  runGist(files);

  andThen(function() {
    assert.equal(outputContents(), 'Welcome to Ember Twiddle');
  });
});
