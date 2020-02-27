import { run } from '@ember/runloop';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | ember cli', function(hooks) {
  setupTest(hooks);

  test('compiling a gist works', function(assert) {
    let done = assert.async();

    assert.expect(7);
    let service = this.owner.lookup('service:ember-cli');
    assert.ok(service);

    var gist = EmberObject.create({
      files: A([
        EmberObject.create({
          filePath: 'templates/application.hbs',
          extension: '.hbs',
          content: '<h1>Hi, I\'m{{appName}}</h1>'
        }),
        EmberObject.create({
          filePath: 'controllers/application.js',
          extension: '.js',
          content: 'import Ember from "ember";\n\nexport default Ember.Controller.extend({appName:"foo"});'
        }),
        EmberObject.create({
          filePath: 'twiddle.json',
          extension: '.json',
          content: `{
                    "version": "0.7.0",
                    "EmberENV": {
                      "FEATURES": {}
                    },
                    "options": {
                      "use_pods": false,
                      "enable-testing": false
                    },
                    "dependencies": {
                      "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js",
                      "ember": "https://cdnjs.cloudflare.com/ajax/libs/ember.js/2.4.3/ember.debug.js",
                      "ember-data": "https://cdnjs.cloudflare.com/ajax/libs/ember-data.js/2.4.0/ember-data.js"
                    }
                  }`
        })
      ])
    });

    run(function() {
      service.compileGist(gist).then(function(output) {
        output = output.replace(/define\('([a-z0-9-/]+)'/gi,'define("$1"');
        assert.ok(output.indexOf('define("twiddle/router"')>-1, 'build contains router');
        assert.ok(output.indexOf('define("twiddle/initializers/router"')>-1, 'build contains router initializer');
        assert.ok(output.indexOf('define("twiddle/app"')>-1, 'build contains app');
        assert.ok(output.indexOf('define("twiddle/templates/application"')>-1, 'build contains template');
        assert.ok(output.indexOf('define("twiddle/controllers/application"')>-1, 'build contains controller');
        assert.ok(output.indexOf('define("twiddle/config/environment"')>-1, 'build contains config');
        done();
      });
    });
  });

  test("buildProperties() works as expected without replacements", function (assert) {
    assert.expect(3);

    var service = this.owner.lookup('service:ember-cli');
    var props = service.buildProperties('helper');

    assert.equal(props.filePath, 'helpers/my-helper.js', 'filePath set');
    assert.ok(props.content, 'has content');
    assert.ok(props.content.indexOf('<%=') === -1, 'No replacement tags in content');
  });

  test("buildProperties() works as expected with replacements", function (assert) {
    assert.expect(5);

    var service = this.owner.lookup('service:ember-cli');
    var props = service.buildProperties('helper', {
      camelizedModuleName: 'myHelper'
    });

    assert.equal(props.filePath, 'helpers/my-helper.js', 'filePath set');
    assert.ok(props.content, 'has content');
    assert.ok(props.content.indexOf('<%=') === -1, 'No replacement tags in content');
    assert.ok(props.content.indexOf('myHelper(params') !== -1, 'Replacements worked');
    assert.ok(props.content.indexOf('helper(myHelper)') !== -1, 'Replacements worked if multiple');
  });

  test('compileHbs includes moduleName', function(assert) {
    var service = this.owner.lookup('service:ember-cli');
    var result = service.compileHbs('foo', 'somePath/here.hbs');

    assert.ok(result.indexOf('twiddle/somePath/here') > -1, 'moduleName included');
  });

  test('compileHbs can include backticks', function(assert) {
    var template = "`stuff`";
    var service = this.owner.lookup('service:ember-cli');
    var result = service.compileHbs(template, 'some-path');
    var mungedCode = '"`stuff`"';

    assert.ok(result.indexOf(mungedCode) > -1, 'munged template included');
  });

  test("buildHtml works when testing not enabled", function(assert) {
    var service = this.owner.lookup('service:ember-cli');

    var twiddleJson = {
      "version": "0.5.0",
      "EmberENV": {
        "FEATURES": {}
      },
      "options": {
        "enable-testing": false
      },
      "dependencies": {
        "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js"
      }
    };

    var gist = EmberObject.create({
      initialRoute: "/"
    });

    var output = service.buildHtml(gist, '/* app */', '/* styles */', twiddleJson);

    assert.ok(output.indexOf("window.location.hash='/';") > 0, "output sets initialRoute");
    assert.ok(output.indexOf('EmberENV = {"FEATURES":{}}') > 0, "output contains feature flags");
    assert.ok(output.indexOf('<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js"></script>') > 0, "output includes dependency");
    assert.ok(output.indexOf('<style type="text/css">/* styles */') > 0, "output includes styles");
    assert.ok(output.indexOf('<script type="text/javascript">/* app */') > 0, "output includes the app js");
    assert.ok(output.indexOf('<div id="ember-testing-container">') === -1, "output does not contain testing container");
  });



  test("buildHtml works when testing is enabled", function(assert) {
    var service = this.owner.lookup('service:ember-cli');

    var twiddleJson = {
      "version": "0.5.0",
      "EmberENV": {
        "FEATURES": {}
      },
      "options": {
        "enable-testing": true
      },
      "dependencies": {
        "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.js"
      }
    };

    var gist = EmberObject.create({});

    var output = service.buildHtml(gist, '', '', twiddleJson);

    assert.ok(output.indexOf("window.location.hash='/';") === -1, "output does not set initialRoute if not provided");
    assert.ok(output.indexOf('<div id="qunit"></div>') > 0, "output contains qunit div");
    assert.ok(output.indexOf('<div id="qunit-fixture"></div>') > 0, "output contains qunit fixture div");
    assert.ok(output.indexOf('<div id="ember-testing-container">') > 0, "output contains testing container");
    assert.ok(output.indexOf('<div id="ember-testing"></div>') > 0, "output contains testing div");
  });

  test("fixTwiddleAppNames works", function(assert) {
    var service = this.owner.lookup('service:ember-cli');

    assert.equal(service.fixTwiddleAppNames("import a from 'app/b';"), "import a from 'twiddle/b';");
    assert.equal(service.fixTwiddleAppNames('import ab from "demo-app/bc";'), 'import ab from "twiddle/bc";');
    assert.equal(service.fixTwiddleAppNames('import {a, b} from "demo-app/c.js";'), 'import {a, b} from "twiddle/c.js";');
    assert.equal(service.fixTwiddleAppNames("import a, {b, c} from 'demo-app/d';"), "import a, {b, c} from 'twiddle/d';");
    assert.equal(service.fixTwiddleAppNames("import {bc, cd}, ab from 'demo-app/de';"), "import {bc, cd}, ab from 'twiddle/de';");
    assert.equal(service.fixTwiddleAppNames(`import {
    a,
    b,
    c
  } from 'demo-app/utils';`), `import {
    a,
    b,
    c
  } from 'twiddle/utils';`);
  });
});
