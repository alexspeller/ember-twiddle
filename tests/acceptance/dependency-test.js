import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import runGist from '../helpers/run-gist';
import { findAll, click } from '@ember/test-helpers';
import waitForLoadedIFrame from '../helpers/wait-for-loaded-iframe';
import outputContents from '../helpers/output-contents';

module('Acceptance | dependencies', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  const oldVersionContent = `
  {
  "dependencies": {
  "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js",
  "ember": "1.13.10",
  "ember-data": "1.13.15"
  }
  }
  `;

  const newVersionContent = `
  {
  "dependencies": {
  "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js",
  "ember": "2.17.0",
  "ember-data": "2.18.0"
  }
  }
  `;

  const TWIDDLE_SHOWING_VERSIONS = [
    {
      filename: "application.template.hbs",
      content: `
      <span class='ember-version'>{{emberVersion}}</span>
      <span class='ember-data-version'>{{emberDataVersion}}</span>
      `
    },
    {
      filename: "application.controller.js",
      content: `
      import Ember from 'ember';
      import DS from 'ember-data';

      export default Ember.Controller.extend({
      emberVersion: Ember.VERSION,
      emberDataVersion: DS.VERSION
      });
      `
    },
    {
      filename: 'twiddle.json'
    }
  ];

  test('Able to run a gist using an external dependency', async function(assert) {

    const files = [
      {
        filename: "application.template.hbs",
        content: "{{version}}"
      },
      {
        filename: "application.controller.js",
        content: "import Ember from 'ember';\n\nexport default Ember.Controller.extend({\n  version: _.VERSION\n});\n"
      },
      {
        filename: 'twiddle.json',
        content:
          '{\n' +
          '  "version": "0.4.0",\n' +
          '  "dependencies": {\n' +
          '    "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js",\n' +
          '    "ember": "https://cdnjs.cloudflare.com/ajax/libs/ember.js/1.13.10/ember.debug.js",\n' +
          '    "ember-template-compiler": "https://cdnjs.cloudflare.com/ajax/libs/ember.js/1.13.10/ember-template-compiler.js",\n' +
          '    "ember-data": "https://cdnjs.cloudflare.com/ajax/libs/ember-data.js/1.13.15/ember-data.js",\n' +
          '    "lodash": "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.10.0/lodash.js"\n' +
          '  }\n' +
          '}'
      }
    ];

    await runGist(files);

    assert.equal(outputContents(), '3.10.0', 'Gist including an external dependency can make use of it');
  });

  test('Able to resolve ember / ember-data dependencies via version only (new versions)', async function(assert) {
    TWIDDLE_SHOWING_VERSIONS[2].content = newVersionContent;
    await runGist(TWIDDLE_SHOWING_VERSIONS);

    assert.equal(outputContents('.ember-version'), '2.17.0');
    assert.equal(outputContents('.ember-data-version'), '2.18.0');
  });

  test('Able to resolve ember / ember-data dependencies via version only (old versions)', async function(assert) {
    TWIDDLE_SHOWING_VERSIONS[2].content = oldVersionContent;
    await runGist(TWIDDLE_SHOWING_VERSIONS);

    assert.equal(outputContents('.ember-version'), '1.13.10');
    assert.equal(outputContents('.ember-data-version'), '1.13.15');
  });

  test('Dependencies can be changed via the UI', async function(assert) {
    TWIDDLE_SHOWING_VERSIONS[2].content = newVersionContent;
    await runGist(TWIDDLE_SHOWING_VERSIONS);

    assert.equal(outputContents('.ember-version'), '2.17.0');
    assert.equal(outputContents('.ember-data-version'), '2.18.0');
    await click('.versions-menu .dropdown-toggle');
    await click(findContains('.test-set-ember-data-version', '2.16.4'));

    await click('.versions-menu .dropdown-toggle');
    await click(findContains('.test-set-ember-version', '2.18.2'));

    await waitForLoadedIFrame();
    assert.equal(outputContents('.ember-version'), '2.18.2');
    assert.equal(outputContents('.ember-data-version'), '2.16.4');
  });
});

function findContains(selector, text) {
  return Array.from(findAll(selector)).find(el =>
    el.textContent.includes(text)
  );
}
