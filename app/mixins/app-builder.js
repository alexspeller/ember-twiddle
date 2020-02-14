import { isArray } from '@ember/array';
import Mixin from '@ember/object/mixin';
import { task, timeout } from "ember-concurrency";

export default Mixin.create({

  /**
   * Build the application and set the iframe code
   */
  buildApp: task(function *() {
    this.set('isBuilding', true);
    this.set('buildErrors', []);
    this.set('model.initialRoute', this.get('route'));

    try {
      const buildOutput = yield this.get('emberCli').compileGist(this.get('model'));
      this.set('isBuilding', false);
      this.set('buildOutput', buildOutput);
    } catch(errors) {
      this.set('isBuilding', false);
      if (isArray(errors)) {
        this.set('buildErrors', errors);
        errors.forEach(error => {
          // eslint-disable-next-line no-console
          console.error(error);
        });
      } else if (errors) {
        // eslint-disable-next-line no-console
        console.error(errors);
      }
    }
    yield timeout(100);
  }).enqueue(),

  rebuildApp: task(function *() {
    if (this.get('isLiveReload')) {
      yield timeout(500);
      yield this.get('buildApp').perform();
    }
  }).restartable(),

  willDestroyElement() {
    this._super(...arguments);

    this.get('dependencyResolver.resolveAddonsTask').cancelAll();
  }
});
