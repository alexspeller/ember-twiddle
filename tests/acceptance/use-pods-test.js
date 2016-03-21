import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'ember-twiddle/tests/helpers/start-app';

const firstColumn = '.code:eq(0)';
const firstFilePicker = firstColumn + ' .dropdown-toggle';
const fileMenu = '.main-menu .dropdown-toggle';
const addTemplateAction = '.test-template-action';

module('Acceptance | use pods', {
  beforeEach: function() {
    this.application = startApp();
    this.cachePrompt = window.prompt;
    window.prompt = (text, defaultResponse) => defaultResponse;
  },

  afterEach: function() {
    Ember.run(this.application, 'destroy');
    window.prompt = this.cachePrompt;
  }
});

test('Use pods option works', function(assert) {

  const files = [
    {
      filename: "application.template.hbs",
      content: "Welcome to {{appName}}"
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
                  "version": "0.7.0",
                  "EmberENV": {
                    "FEATURES": {}
                  },
                  "options": {
                    "use_pods": true,
                    "enable-testing": false
                  },
                  "dependencies": {
                    "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js",
                    "ember": "https://cdnjs.cloudflare.com/ajax/libs/ember.js/2.4.3/ember.debug.js",
                    "ember-data": "https://cdnjs.cloudflare.com/ajax/libs/ember-data.js/2.4.0/ember-data.js",
                    "ember-template-compiler": "https://cdnjs.cloudflare.com/ajax/libs/ember.js/2.4.3/ember-template-compiler.js"
                  }
                }`
    }
  ];

  runGist(files);

  andThen(function() {
    const outputDiv = 'div';

    assert.equal(outputContents(outputDiv), 'Welcome to Ember Twiddle');
  });

  click(firstFilePicker);
  click(fileMenu);
  click(addTemplateAction);
  click(firstFilePicker);

  andThen(function() {
    assert.equal($(firstFilePicker).text().trim(), "my-route/template.hbs", "Use pods option creates correct filename");
  });
});
