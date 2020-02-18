import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { click } from '@ember/test-helpers';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import $ from 'jquery';
import runGist from '../helpers/run-gist';
import outputContents from '../helpers/output-contents';

const firstColumn = '.code:eq(0)';
const firstFilePicker = firstColumn + ' .dropdown-toggle';
const fileMenu = '.main-menu .dropdown-toggle';
const addTemplateAction = '.test-template-action';

module('Acceptance | use pods', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    this.cachePrompt = window.prompt;
    window.prompt = (text, defaultResponse) => defaultResponse;
  });

  hooks.afterEach(function() {
    window.prompt = this.cachePrompt;
  });

  test('Use pods option works', async function(assert) {

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
                      "ember-data": "https://cdnjs.cloudflare.com/ajax/libs/ember-data.js/2.4.0/ember-data.js"
                    }
                  }`
      }
    ];

    await runGist(files);

    assert.equal(outputContents(), 'Welcome to Ember Twiddle');

    await click(firstFilePicker);
    await click(fileMenu);
    await click(addTemplateAction);
    await click(firstFilePicker);

    assert.equal($(firstFilePicker).text().trim(), "my-route/template.hbs", "Use pods option creates correct filename");
  });
});
