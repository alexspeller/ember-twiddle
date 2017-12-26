import Ember from 'ember';
import config from '../config/environment';
import { task, timeout } from 'ember-concurrency';

const { computed, inject, RSVP, testing } = Ember;

const EMBER_VERSIONS = ['2.16.0', '2.15.3', '2.14.1', '2.13.0', '2.12.0', '2.11.2', '2.10.2', '2.9.1', '2.8.2', '2.7.3', '2.6.2', '2.5.1', '2.4.5', '2.3.2', '2.2.2', '2.1.2', '2.0.3', '1.13.13', '1.12.2'];
const EMBER_DATA_VERSIONS = ['2.16.3', '2.15.3', '2.14.10', '2.13.2', '2.12.2', '2.11.3', '2.10.0', '2.9.0', '2.8.1', '2.7.0', '2.6.2', '2.5.5', '2.4.3', '2.3.3', '2.2.1', '2.1.0', '2.0.1', '1.13.15'];

const VERSION_REGEX = /^\d+.\d+.\d+(-beta\.\d+)?$/;

const CDN_MAP = {
  'ember': {
    library: 'ember.js',
    fileName: 'ember.debug.js'
  },

  'ember-template-compiler': {
    library: 'ember.js',
    fileName: 'ember-template-compiler.js'
  },

  'ember-testing': {
    library: 'ember.js',
    fileName: 'ember-testing.js'
  },

  'ember-data': {
    library: 'ember-data.js',
    fileName: 'ember-data.js'
  }
};

const CHANNEL_FILENAME_MAP = {
  'ember': 'ember.debug.js',
  'ember-template-compiler': 'ember-template-compiler.js',
  'ember-testing': 'ember-testing.js',
  'ember-data': 'ember-data.js'
};

const CHANNELS = ['alpha', 'canary', 'beta', 'release'];

const POLL_INTERVAL = 10000;

export default Ember.Service.extend({
  notify: inject.service(),

  resolveDependencies(dependencies) {
    Object.keys(dependencies).forEach((name) => {
      var value = dependencies[name];

      dependencies[name] = this.resolveDependency(name, value);
    });
  },

  resolveAddons(addons, dependencies, emberVersion) {
    const taskInstance = this.get('resolveAddonsTask').perform(addons, dependencies, emberVersion);
    return taskInstance.then(() => taskInstance.value);
  },

  resolveAddonsTask: task(function *(addons, dependencies, emberVersion) {
    let done = false;
    while (!done) {
      let addonPromises = {};
      let addonNames = Object.keys(addons);
      for (let i = 0; i < addonNames.length; ++i) {
        const name = addonNames[i];
        const value = addons[name];
        addonPromises[name] = this.resolveAddon(name, value, emberVersion);
      }
      let allAddonsLoaded = true;
      try {
        let hash = yield RSVP.hash(addonPromises);
        for (let j = 0; j < addonNames.length; ++j) {
          const name = addonNames[j];
          const addon = hash[name];
          if (addon.status === 'build_success') {
            dependencies[name+'_js'] = addon.addon_js;
            dependencies[name+'_css'] = addon.addon_css;
            if (!testing) {
              console.log(`Addon ${name} is loaded...`);
            }
            delete addons[name];
          } else if (addon.status === 'building') {
            console.log(`Addon ${name} is still building...`);
            allAddonsLoaded = false;
          } else if (addon.status === 'build_error') {
            console.error(`Addon ${name} encountered a build error:`);
            if (addon.error_log) {
              console.error(addon.error_log);
            }
            allAddonsLoaded = false;
            throw addon;
          } else {
            console.error(addon);
          }
        }
      } catch(e) {
        try {
          this.get('notify').error(JSON.parse(e.responseText).errorMessage, {
            closeAfter: 10000
          });
        } catch(e2) {
          console.error(e);
        }
        throw e;
      }
      if (allAddonsLoaded) {
        done = true;
      } else {
        yield timeout(POLL_INTERVAL);
      }
    }
    return dependencies;
  }),

  resolveAddon(name, value, emberVersion) {
    const url = `${config.addonUrl}?ember_version=${emberVersion}&addon=${name}&addon_version=${value}`;
    return new RSVP.Promise(function(resolve) {
      Ember.$.getJSON(url).then(resolve);
    });
  },

  resolveDependency(name, value) {
    switch (name) {
      case 'ember':
      case 'ember-template-compiler':
      case 'ember-testing':
      case 'ember-data':
        return this.resolveEmberDependency(name, value);

      default:
        return value;
    }
  },

  resolveEmberDependency(name, value) {
    if (VERSION_REGEX.test(value)) {
      return this.cdnURL(name, value);
    }

    if (CHANNELS.indexOf(value) !== -1) {
      return this.channelURL(name, value);
    }

    return value;
  },

  channelURL(name, channel) {
    var fileName = CHANNEL_FILENAME_MAP[name];

    return `//s3.amazonaws.com/builds.emberjs.com/${channel}/${fileName}`;
  },

  cdnURL(name, version) {
    var { library, fileName } = CDN_MAP[name];

    return `//cdnjs.cloudflare.com/ajax/libs/${library}/${version}/${fileName}`;
  },

  emberVersions: computed(function() {
    return [...CHANNELS, ...EMBER_VERSIONS];
  }),

  emberDataVersions: computed(function() {
    return [...CHANNELS, ...EMBER_DATA_VERSIONS];
  })
});
