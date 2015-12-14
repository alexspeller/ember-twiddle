import Babel from "npm:babel";
import Path from 'npm:path';
import blueprints from '../lib/blueprints';
import config from '../config/environment';
import Ember from 'ember';
import moment from 'moment';

const twiddleAppName = 'demo-app';

// These files will be included if not present
const boilerPlateJs = [
  'app',
  'router',
  'initializers/router',
  'initializers/mouse-events'
];

// These files have to be present
const requiredFiles = [
  'twiddle.json'
];

const availableBlueprints = {
  'templates/application': {
    blueprint: 'templates/application',
    filePath: 'application/template.hbs'
  },
  'controllers/application': {
    blueprint: 'controllers/application',
    filePath: 'application/controller.js'
  },
  'app': {
    blueprint: 'app',
    filePath: 'app.js'
  },
  'css': {
    blueprint: 'app.css',
    filePath: 'styles/app.css'
  },
  'component-hbs': {
    blueprint: 'component-hbs',
    filePath: 'my-component/template.hbs'
  },
  'component-js': {
    blueprint: 'component-js',
    filePath: 'my-component/component.js'
  },
  'controller': {
    blueprint: 'controller',
    filePath: 'my-route/controller.js'
  },
  'initializers/router': {
    blueprint: 'initializers/router',
    filePath: 'initializers/router.js'
  },
  'initializers/mouse-events': {
    blueprint: 'initializers/mouse-events',
    filePath: 'initializers/mouse-events.js'
  },
  'model': {
    blueprint: 'model',
    filePath: 'models/my-model.js'
  },
  'helper': {
    blueprint: 'helper',
    filePath: 'helpers/my-helper.js'
  },
  'route': {
    blueprint: 'route',
    filePath: 'my-route/route.js'
  },
  'service': {
    blueprint: 'service',
    filePath: 'my-service/service.js'
  },
  'template': {
    blueprint: 'template',
    filePath: 'my-route/template.hbs'
  },
  'router': {
    blueprint: 'router',
    filePath: 'router.js'
  },
  'twiddle.json': {
    blueprint: 'twiddle.json',
    filePath: 'twiddle.json'
  }
};

const requiredDependencies = [
  'jquery',
  'ember',
  'ember-template-compiler'
];

/**
 * A tiny browser version of the CLI build chain.
 * or more realistically: a hacked reconstruction of it.
 *
 * Parts of this module are directly copied from the ember-cli
 * source code at https://github.com/ember-cli/ember-cli
 */
export default Ember.Service.extend({
  dependencyResolver: Ember.inject.service(),

  init () {
    this._super();
    this.set('store', this.container.lookup("service:store"));
  },

  generate(type) {
    return this.store.createRecord('gistFile', this.buildProperties(type));
  },

  buildProperties(type, replacements) {
    if (type in availableBlueprints) {
      let blueprint = availableBlueprints[type];
      let content = blueprints[blueprint.blueprint];

      if (replacements) {
        Object.keys(replacements).forEach(key => {
          let token = `<%= ${key} %>`;
          let value = replacements[key];

          content = content.replace(new RegExp(token, 'g'), value);
        });
      }

      return {
        filePath: blueprint.filePath,
        content: content.replace(/<\%\=(.*)\%\>/gi,'')
      };
    }
  },

  nameWithModule: function (filePath) {
    // Remove app prefix if present
    let name = filePath.replace(/^app\//, '');

    return Path.join(twiddleAppName,
      Path.dirname(name), Path.basename(name, Path.extname(name)));
  },

  /**
   * Build a gist into an Ember app.
   *
   * @param  {Gist} gist    Gist to build
   * @return {Ember Object}       Source code for built Ember app
   */
  compileGist (gist) {
    var promise = new Ember.RSVP.Promise((resolve, reject) => {
      let errors = [];
      let out = [];
      let cssOut = [];

      this.checkRequiredFiles(out, gist);

      gist.get('files').forEach(file => {
        try {
          switch(file.get('extension')) {
            case '.js':
              out.push(this.compileJs(file.get('content'), file.get('filePath')));
              break;
            case '.hbs':
              out.push(this.compileHbs(file.get('content'), file.get('filePath')));
              break;
            case '.css':
              cssOut.push(this.compileCss(file.get('content'), file.get('filePath')));
              break;
            case '.json':
              break;
          }
        }
        catch(e) {
          e.message = `${file.get('filePath')}: ${e.message}`;
          errors.push(e);
        }
      });

      if (errors.length) {
        return reject(errors);
      }

      this.addBoilerPlateFiles(out, gist);
      this.addConfig(out, gist);

      let twiddleJson = this.getTwiddleJson(gist);

      // Add boot code
      contentForAppBoot(out, {modulePrefix: twiddleAppName, dependencies: twiddleJson.dependencies});

      resolve(this.buildHtml(gist, out.join('\n'), cssOut.join('\n')));
    });

    return promise;
  },

  buildHtml (gist, appJS, appCSS) {
    if (gist.get('initialRoute')) {
      appJS += "window.location.hash='" + gist.get('initialRoute') + "';";
    }

    let index = blueprints['index.html'];
    let twiddleJSON = this.getTwiddleJson(gist);
    let deps = twiddleJSON.dependencies;

    let depCssLinkTags = '';
    let depScriptTags ='';
    let appScriptTag = `<script type="text/javascript">${appJS}</script>`;
    let appStyleTag = `<style type="text/css">${appCSS}</style>`;

    let EmberENV = twiddleJSON.EmberENV || {};
    depScriptTags += `<script type="text/javascript">EmberENV = ${JSON.stringify(EmberENV)};</script>`;

    Object.keys(deps).forEach(function(depKey) {
      let dep = deps[depKey];
      if (dep.substr(dep.lastIndexOf(".")) === '.css') {
        depCssLinkTags += `<link rel="stylesheet" type="text/css" href="${dep}">`;
      } else {
        depScriptTags += `<script type="text/javascript" src="${dep}"></script>`;
      }
    });

    depScriptTags += `<script type="text/javascript" src="${config.assetsHost}assets/twiddle-deps.js?${config.APP.version}"></script>`;

    index = index.replace('{{content-for \'head\'}}', `${depCssLinkTags}\n${appStyleTag}`);
    index = index.replace('{{content-for \'body\'}}', `${depScriptTags}\n${appScriptTag}`);

    // replace the {{build-timestamp}} placeholder with the number of
    // milliseconds since the Unix Epoch:
    // http://momentjs.com/docs/#/displaying/unix-offset/
    index = index.replace('{{build-timestamp}}', +moment());

    return index;
  },

  checkRequiredFiles (out, gist) {
    requiredFiles.forEach(filePath => {
      var file = gist.get('files').findBy('filePath', filePath);
      if(!file) {
        gist.get('files').pushObject(this.store.createRecord('gistFile', {
          filePath: filePath,
          content: blueprints[filePath]
        }));
      }
    });
  },

  addBoilerPlateFiles (out, gist) {
    boilerPlateJs.forEach(blueprintName => {
      let blueprint = availableBlueprints[blueprintName];
      if(!gist.get('files').findBy('filePath', blueprint.filePath)) {
        out.push(this.compileJs(blueprints[blueprint.blueprint], blueprint.filePath));
      }
    });
  },

  addConfig (out) {
    let config = {
      modulePrefix: "demo-app",
      TWIDDLE_ORIGIN: location.origin
    };

    let configJs = 'export default ' + JSON.stringify(config);
    out.push(this.compileJs(configJs, 'config/environment'));
  },

  getTwiddleJson (gist) {
    var twiddleJson = JSON.parse(gist.get('files').findBy('filePath', 'twiddle.json').get('content'));

    // Fill in any missing required dependencies
    var dependencies = JSON.parse(blueprints['twiddle.json']).dependencies;
    requiredDependencies.forEach(function(dep) {
      if (!twiddleJson.dependencies[dep] && dependencies[dep]) {
        if (dep === 'ember-template-compiler') {
          twiddleJson.dependencies[dep] = twiddleJson.dependencies['ember'].replace('ember.debug.js', 'ember-template-compiler.js');
        } else {
          twiddleJson.dependencies[dep] = dependencies[dep];
        }
      }
    });

    var dependencyResolver = this.get('dependencyResolver');
    dependencyResolver.resolveDependencies(twiddleJson.dependencies);

    return twiddleJson;
  },

  updateDependencyVersion: function(gist, dependencyName, version) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      var twiddle = gist.get('files').findBy('filePath', 'twiddle.json');

      var json;
      try {
        json = JSON.parse(twiddle.get('content'));
      } catch (e) {
        return reject(e);
      }

      json.dependencies[dependencyName] = version;

      // since ember and ember-template-compiler should always have the same
      // version, we update the version for the ember-template-compiler too, if
      // the ember dependency is updated
      if (dependencyName === 'ember' && json.dependencies.hasOwnProperty('ember-template-compiler')) {
        json.dependencies['ember-template-compiler'] = version;
      }

      json = JSON.stringify(json, null, '  ');
      twiddle.set('content', json);

      resolve();
    });
  },

  /**
   * Compile a javascript file. This means that we
   * transform it using Babel.
   *
   * @param  {String} code       ES6 module code
   * @param  {String} filePath   File path (will be used for module name)
   * @return {String}            Transpiled module code
   */
  compileJs (code, filePath) {
    let moduleName = this.nameWithModule(filePath);
    return Babel.transform(code, babelOpts(moduleName)).code;
  },

  /**
   * Compile a Handlebars template into an AMD module.
   *
   * @param  {String} code       hbs code
   * @param  {String} filePath   File path (will be used for module name)
   * @return {String}            AMD module code
   */
  compileHbs (code, filePath) {
    // TODO: Is there a way to precompile using the template compiler brought in via twiddle.json?
    // let templateCode = Ember.HTMLBars.precompile(code || '');

    // Compiles all templates at runtime.
    let moduleName = this.nameWithModule(filePath);

    const mungedCode = (code || '')
            .replace(/\\/g, "\\\\") // Prevent backslashes from being escaped
            .replace(/`/g, "\\`"); // Prevent backticks from causing syntax errors

    return this.compileJs('export default Ember.HTMLBars.compile(`' + mungedCode + '`, { moduleName: `' + moduleName + '`});', filePath);
  },

  compileCss(code, moduleName) {
    var prefix = "styles/";
    if (moduleName.substring(0, prefix.length) === prefix) {
        return code;
    }
    return '';
  }
});

/**
 * Generate babel options for the specified module
 * @param  {String} moduleName
 * @return {Object}            Babel options
 */
function babelOpts(moduleName) {
  return {
    modules:'amd',
    moduleIds:true,
    moduleId: moduleName
  };
}

/**
 * Generate the application boot code
 * @param  {Array} content  Code buffer to append to
 * @param  {Object} config  App configuration
 * @return {Array}          Code buffer
 */
function contentForAppBoot (content, config) {
  // Add in a shim for ember-resolver => ember/resolver for now since we are still bringing in old bower component
  // TODO: Once we support included addons, bring in new ember-resolver addon
  content.push('    define("ember-resolver", ["exports", "ember/resolver"],\n' +
    '      function(exports, Resolver) {\n' +
    '        exports["default"] = Resolver;\n' +
    '      });\n');

  // Some modules are not actually transpiled so Babel
  // doesn't recognize them properly...
  var monkeyPatchModules = [
    'ember',
    'ember/load-initializers',
    'ember-resolver'
  ];

  if ("ember-data" in config.dependencies) {
    monkeyPatchModules.push('ember-data');
  }

  monkeyPatchModules.forEach(function(mod) {
    content.push('  require("'+mod+'").__esModule=true;');
  });

  content.push('  require("' +
    config.modulePrefix +
    '/app")["default"].create(' +
    calculateAppConfig(config) +
    ');');
}

/**
 * Directly copied from ember-cli
 */
function calculateAppConfig(config) {
  return JSON.stringify(config.APP || {});
}
