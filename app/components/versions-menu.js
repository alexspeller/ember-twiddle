import Ember from 'ember';

const { computed, inject } = Ember;

export default Ember.Component.extend({
  emberCli: inject.service('ember-cli'),
  dependencyResolver: inject.service(),
  classNames: ['versions-menu'],

  versions: computed.readOnly('dependencyResolver.emberVersions'),
  dataVersions: computed.readOnly('dependencyResolver.emberDataVersions'),

  actions: {
    versionSelected(dependency, version) {
      var gist = this.get('model');
      var emberCli = this.get('emberCli');

      emberCli.updateDependencyVersion(gist, dependency, version).then(() => {
        this.sendAction('onVersionChanged');
      });
    }
  }
});
